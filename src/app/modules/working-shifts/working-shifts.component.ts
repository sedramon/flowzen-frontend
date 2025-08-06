/* eslint-disable max-lines */
/* Potpuno refaktorisana logika komponente uz dodatne komentare.  */

import { CommonModule }                 from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  FormGroupDirective,
  ReactiveFormsModule,
  FormsModule,
} from '@angular/forms';
import { HttpClient }                   from '@angular/common/http';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

/* Angular-Material */
import { DateAdapter, MatNativeDateModule }     from '@angular/material/core';
import { MatCardModule }             from '@angular/material/card';
import { MatFormFieldModule }        from '@angular/material/form-field';
import { MatInputModule }            from '@angular/material/input';
import { MatSelectModule }           from '@angular/material/select';
import { MatDatepickerModule, MatDatepicker } from '@angular/material/datepicker';
import { MatButtonModule }           from '@angular/material/button';
import { MatIconModule }             from '@angular/material/icon';
import { MatDialog, MatDialogModule }from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatListModule }             from '@angular/material/list';

/* Aplikacijski modeli / servisi */
import { environment }               from '../../../environments/environment';
import { Employee }                  from '../../models/Employee';
import { AuthService }               from '../../core/services/auth.service';
import { WorkingShiftsService }      from './services/working-shifts.service';
import { ShiftsService }             from './services/shifts.service';
import { EditWorkingDayDialogComponent } from './dialogs/edit-working-day-dialog/edit-working-day-dialog.component';
import { FlexLayoutModule } from '@angular/flex-layout';
import { SettingsService }           from '../settings/services/settings.service';

/* ────────────────────────── Tipovi ────────────────────────── */

interface CalendarDay {
  date: Date;
  shift?: {
    shiftType: string;
    note?: string;
    startHour?: number;
    endHour?: number;
  };
  id?: string;
  animate?: boolean;
}

/* ───────────────────────── Komponenta ───────────────────────── */

@Component({
  selector   : 'app-working-shifts',
  standalone : true,
  imports    : [
    /* Angular core */
    CommonModule,
    ReactiveFormsModule,
    FormsModule,

    /* Angular-Material */
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatSnackBarModule,
    MatListModule
  ],
  templateUrl : './working-shifts.component.html',
  styleUrls   : ['./working-shifts.component.scss'],
})
export class WorkingShiftsComponent implements OnInit {

  /* ------------------------------ ViewChild ------------------------------ */
  @ViewChild('shiftFormDir', { static: false })
  private shiftFormDir!: FormGroupDirective;

  /* ----------------------------- Forme / state --------------------------- */
  form      : FormGroup;     // izbor zaposlenog + meseca
  shiftForm : FormGroup;     // forma za tip smene

  employees : Employee[]          = [];
  facilities: any[]              = [];
  weeks     : CalendarDay[][]     = [];

  shiftTypes      : any[] = [];      // puni backend
  activeShiftType : string = '';     // trenutno „četkica" boje u kalendaru
  editShiftsMode  = false;
  timeOptions     : number[] = [];
  facilityWorkingHours: { opening: number; closing: number } | null = null;

  editingShift: any = null;          // trenutni shift u modal nom

  /* backend korisnik (tenant, id…) */
  currentUser: any;

  /* Statične opcije, kada se kreira NOVI tip smene */
  readonly shiftEnumOptions = [
    { value: 'morning',   label: 'Jutarnja'   },
    { value: 'afternoon', label: 'Popodnevna' },
    { value: 'evening',   label: 'Večernja'   },
    { value: 'full',      label: 'Cela smena' },
    { value: 'custom',    label: 'Custom'     },
  ];

  /* ─────────────────────────── Konstruktori ─────────────────────────── */
  constructor(
    private fb           : FormBuilder,
    private http         : HttpClient,
    private wsService    : WorkingShiftsService,
    private shiftsService: ShiftsService,
    private authService  : AuthService,
    private snackBar     : MatSnackBar,
    private dialog       : MatDialog,
    private dateAdapter  : DateAdapter<Date>,
    private settingsService: SettingsService,
  ) {
    /* Locale za datepicker (SR) */
    this.dateAdapter.setLocale('en-US');
    this.dateAdapter.setLocale('en-US');

    /* -------- glavna forma (zaposleni + facility + mesec) -------- */
    this.form = this.fb.group({
      employee : [null, Validators.required],
      facility : [null, Validators.required],
      month    : [null, Validators.required]
    });

    /* -------- forma za pojedinačni tip smene -------- */
    this.shiftForm = this.fb.group({
      value: ['', Validators.required],
      label: ['', Validators.required],
      color: ['#ffe082', Validators.required],
      startHour: [null],
      endHour: [null],
      facility: [null, Validators.required]
    });

    /* Polusatni slotovi 0–24h (0, 0.5, 1 … 23.5, 24) */
    for (let h = 0; h <= 24; h += 0.5) { this.timeOptions.push(h); }
  }

  /* ────────────────────────── Lifecycle ────────────────────────── */
  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadEmployees();
    this.loadFacilities();
    this.loadShifts();

    // Automatsko ažuriranje kalendara kada se promeni bilo koje polje
    // + mogućnost ručnog poziva preko dugmeta "Prikaži kalendar"
    this.form.valueChanges.pipe(debounceTime(500), distinctUntilChanged())
      .subscribe(() => {
        // Učitaj shifts kada se promeni facility
        if (this.form.get('facility')?.valid) {
          this.loadShifts();
          this.updateTimeOptions();
        }
        
        // Automatsko učitavanje kalendara kada su sva polja validna
        if (this.form.valid) {
          this.loadSchedule();
        }
      });
  }

  /* ────────────────────────── HTTP pozivi ───────────────────────── */

  /** Učitaj sve zaposlene za tenant-a. */
  private loadEmployees(): void {
    const tenantId = this.currentUser?.tenant;
    this.http
      .get<Employee[]>(`${environment.apiUrl}/employees?tenant=${tenantId}`)
      .subscribe(res => this.employees = res.filter(e => e.includeInAppoitments));
  }

  /** Učitaj sve facilities za tenant-a. */
  private loadFacilities(): void {
    const tenantId = this.currentUser?.tenant;
    this.settingsService.getAllFacilities(tenantId).subscribe((res: any[]) => {
      this.facilities = res;
      this.updateTimeOptions();
    });
  }

  /** Ažuriraj timeOptions na osnovu odabranog facility-ja */
  private updateTimeOptions(): void {
    const selectedFacility = this.facilities.find(f => f._id === this.form.value.facility);
    
    if (selectedFacility) {
      const openingHour = parseInt(selectedFacility.openingHour.split(':')[0]);
      const closingHour = parseInt(selectedFacility.closingHour.split(':')[0]);
      
      this.facilityWorkingHours = { opening: openingHour, closing: closingHour };
      
      // Generiši timeOptions samo za radne sate facility-ja
      this.timeOptions = [];
      for (let h = openingHour; h <= closingHour; h += 0.5) {
        this.timeOptions.push(h);
      }
    } else {
      this.facilityWorkingHours = null;
      // Fallback na standardne sate
      this.timeOptions = [];
      for (let h = 0; h <= 24; h += 0.5) { 
        this.timeOptions.push(h); 
      }
    }
  }

  /** Učitaj listu DEFINISANIH tipova smena (boje, vreme). */
  private loadShifts(): void {
    const tenantId = this.currentUser?.tenant;
    const facilityId = this.form.value.facility;
    
    if (!facilityId) {
      this.shiftTypes = [];
      this.activeShiftType = '';
      return;
    }

    this.shiftsService.getAllShifts(tenantId, facilityId).subscribe(shifts => {
      this.shiftTypes = shifts ?? [];
      /* Ako je prethodni activeShiftType nestao, uzmi prvi */
      if (this.shiftTypes.length) {
        if (!this.shiftTypes.find(s => s.value === this.activeShiftType)) {
          this.activeShiftType = this.shiftTypes[0].value;
        }
      } else {
        this.activeShiftType = '';
      }
    });
  }

  /* ────────────────────────── KALENDAR ───────────────────────── */

  /** Klik na „Prikaži kalendar". */
  loadSchedule(): void {
    if (this.form.invalid) return;

    const selectedMonth : Date = this.form.value.month;
    const employeeId    = this.form.value.employee;
    const facilityId    = this.form.value.facility;
    const tenantId      = this.currentUser?.tenant;

    this.buildCalendar(selectedMonth);

    /* Učitaj smene u tom mesecu */
    this.wsService
      .getShiftsForEmployeeMonth(
        employeeId,
        selectedMonth.getMonth(),
        selectedMonth.getFullYear(),
        tenantId,
        facilityId
      )
      .subscribe(shifts => {
        for (const week of this.weeks) {
          for (const day of week) {
            if (!day) continue;
            const found = shifts.find(s =>
              new Date(s.date).toDateString() === day.date.toDateString(),
            );
            if (found) {
              day.shift = {
                shiftType: found.shiftType,
                note     : found.note,
                startHour: found.startHour,
                endHour  : found.endHour,
              };
              day.id = found.id;
            } else {
              day.shift = undefined;
              day.id   = undefined;
            }
          }
        }
      });
  }

  /** Kreiraj matricu nedelja (pon–ned) za dati mesec. */
  private buildCalendar(monthDate: Date): void {
    const y = monthDate.getFullYear();
    const m = monthDate.getMonth();

    const firstDay = new Date(y, m, 1);
    const lastDay  = new Date(y, m + 1, 0);

    const weeks: CalendarDay[][] = [];
    let current: CalendarDay[]   = [];

    /* Offset tako da nedelja počinje od ponedeljka */
    const offset = (firstDay.getDay() + 6) % 7;
    for (let i = 0; i < offset; i++) current.push(null!);

    for (let d = 1; d <= lastDay.getDate(); d++) {
      current.push({ date: new Date(y, m, d) });
      if (current.length === 7) {
        weeks.push(current);
        current = [];
      }
    }

    while (current.length && current.length < 7) current.push(null!);
    if (current.length) weeks.push(current);

    this.weeks = weeks;
  }

  /* ────────────────────────── Klik na dan ───────────────────────── */

  onDayClick(day: CalendarDay): void {
    if (!day) return;

    const employee = this.form.value.employee;
    const facility = this.form.value.facility;
    const tenant   = this.currentUser?.tenant;
    const dateStr    = this.toLocalDateString(day.date);

    /* Kratka animacija „flip" */
    day.animate = true;
    setTimeout(() => (day.animate = false), 500);

    /* Ako ISTA smena već postoji → briši je */
    if (day.shift && day.shift.shiftType === this.activeShiftType) {
      day.shift = undefined;
      this.wsService.deleteShiftByEmployeeDate(employee, dateStr, tenant, facility)
        .subscribe();
      return;
    }

    /* Inače upsert nove smene */
    const s = this.shiftTypes.find(t => t.value === this.activeShiftType);
    day.shift = { shiftType: this.activeShiftType };

    this.wsService.upsertShift({
      employee,
      facility,
      date     : dateStr,
      shiftType: this.activeShiftType,
      startHour: s?.startHour ?? null,
      endHour  : s?.endHour   ?? null,
      tenant,
    }).subscribe();
  }

  /* ───────────────────────── Modal za detalj ──────────────────────── */

  openEditDialogForDay(day: CalendarDay): void {
    const ref = this.dialog.open(EditWorkingDayDialogComponent, {
      width: '400px',
      data : {
        date      : day.date,
        employee: this.form.value.employee,
        facility: this.form.value.facility,
        shift     : day.shift ?? { shiftType: null, note: '' },
        shiftTypes: this.shiftTypes,
      },
    });

    ref.afterClosed().subscribe(res => {
      if (!res) return;
      day.shift = res.shiftType
        ? { shiftType: res.shiftType, note: res.note }
        : undefined;

      this.snackBar.open('Radni dan izmenjen!', 'Zatvori', { duration: 2000 });
    });
  }

  /* ────────────────────── Uređivanje tipova smena ───────────────────── */

  toggleEditShifts(): void { this.editShiftsMode = !this.editShiftsMode; }

  saveShift(): void {
    // Postavi facility u shiftForm pre validacije
    this.shiftForm.patchValue({ facility: this.form.value.facility });
    
    if (this.shiftForm.invalid) {
      return;
    }

    const payload = { 
      ...this.shiftForm.value, 
      tenant: this.currentUser?.tenant,
      facility: this.form.value.facility
    };
    
    // Proveri da li editingShift ima id pre update-a
    if (this.editingShift && !this.editingShift.id) {
      this.snackBar.open('Greška: Nedostaje ID smene', 'Zatvori', { duration: 3000 });
      return;
    }
    
    const req$ = this.editingShift
      ? this.shiftsService.updateShift(this.editingShift.id, payload)
      : this.shiftsService.createShift(payload);

    req$.subscribe(() => {
      this.loadShifts();   // refresh liste
      this.resetShiftForm();
    });
  }

  private resetShiftForm(): void {
    this.shiftFormDir.resetForm({
      value: '', label: '', color: '#ffe082', startHour: null, endHour: null, facility: null,
    });
    this.editingShift = null;
  }

  cancelEditShift(): void {
    this.editingShift = null;
    this.shiftFormDir.resetForm({ color: '#ffe082' });
  }

  editShift(shift: any): void {
    if (!shift || !shift.id) {
      return;
    }
    this.editingShift = shift;
    this.shiftForm.patchValue(shift);
  }

  deleteShift(shift: any): void {
    if (!shift || !shift.id) {
      return;
    }
    this.shiftsService.deleteShift(shift.id).subscribe(() => this.loadShifts());
  }

  /* ────────────────────────── Helpers ───────────────────────── */

  /** Format hh:mm ili hh:30 */
  formatTime(t: number): string {
    return t === 24
      ? '24:00'
      : t % 1 === 0
      ? `${t}:00`
      : `${Math.floor(t)}:30`;
  }

  /** Naziv dana pon–ned (lokalizovano) */
  getWeekdayName(i: number): string {
    return ['Pon', 'Uto', 'Sri', 'Čet', 'Pet', 'Sub', 'Ned'][i];
  }

  /** YYYY-MM-DD lokalni string (bez time-zone pomeranja) */
  private toLocalDateString(d: Date): string {
    return [
      d.getFullYear(),
      String(d.getMonth() + 1).padStart(2, '0'),
      String(d.getDate()).padStart(2, '0'),
    ].join('-');
  }

  /** Handle za datepicker: postavi mesec i resetuj kalendar */
  chosenMonthHandler(month: Date, dp: MatDatepicker<Date>): void {
    this.form.get('month')?.setValue(month);
    dp.close();
  }

  getShiftType(value?: string) {
    return this.shiftTypes.find(t => t.value === value) ?? { label: '', color: '' };
  }
}
