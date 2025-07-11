import { CommonModule } from '@angular/common';
import {
  Component,
  OnInit,
  AfterViewInit,
  ElementRef,
  ViewChild,
  ChangeDetectorRef,
  NgZone,
  ChangeDetectionStrategy,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSnackBar } from '@angular/material/snack-bar';
import interact from 'interactjs';
import {
  trigger,
  state,
  style,
  transition,
  animate,
  keyframes,
  query,
  stagger,
} from '@angular/animations';
import {
  Appointment,
  ScheduleService,
} from './services/schedule.service';
import {
  ServicesService,
} from '../services/services/services.service';
import { MatDialog } from '@angular/material/dialog';
import {
  AppointmentDialogComponent,
  AppointmentDialogData,
} from './dialog/appointment-dialog.component';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/services/auth.service';
import { Service } from '../../models/Service';
import { Employee } from '../../models/Employee';
import { MatMomentDateModule, MomentDateAdapter, MAT_MOMENT_DATE_ADAPTER_OPTIONS } from '@angular/material-moment-adapter';
import { MAT_DATE_FORMATS, DateAdapter, MAT_DATE_LOCALE } from '@angular/material/core';
import moment from 'moment';
import { MatTooltipModule } from '@angular/material/tooltip';

export const CUSTOM_DATE_FORMATS = {
  parse: {
    dateInput: 'DD/MM/YYYY',
  },
  display: {
    dateInput: 'DD/MM/YYYY',
    monthYearLabel: 'MMMM YYYY',
    dateA11yLabel: 'DD/MM/YYYY',
    monthYearA11yLabel: 'MMMM YYYY',
  },
};

@Component({
  selector: 'app-appoitments',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDatepickerModule,
    MatMomentDateModule,
    MatNativeDateModule,
    MatFormFieldModule,
    MatInputModule,
    MatToolbarModule,
    MatCardModule,
    FlexLayoutModule,
    MatIconModule,
    MatTooltipModule
  ],
  templateUrl: './appoitments.component.html',
  styleUrls: ['./appoitments.component.scss'],
  providers: [
    { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS] },
    { provide: MAT_DATE_FORMATS, useValue: CUSTOM_DATE_FORMATS },
    { provide: MAT_DATE_LOCALE, useValue: 'en-GB' }
  ],
  animations: [
    // Animacija za slide-in pri ulasku elementa
    trigger('slideIn', [
      transition(':enter', [
        animate(
          '0.5s ease-in',
          keyframes([
            style({ opacity: 0, transform: 'translateY(20px)', offset: 0 }),
            style({ opacity: 1, transform: 'translateY(0)', offset: 1 }),
          ])
        ),
      ]),
    ]),
    // Animacije za naslov i datepicker (pomak ulevo/udesno)
    trigger('titleAnim', [
      state('centered', style({ transform: 'translateX(0)' })),
      state('spaced', style({ transform: 'translateX(-100px)' })),
      transition('centered => spaced', animate('0.5s ease-out')),
      transition('spaced => centered', animate('0.5s ease-in')),
    ]),
    trigger('dateAnim', [
      state('centered', style({ transform: 'translateX(0)' })),
      state('spaced', style({ transform: 'translateX(100px)' })),
      transition('centered => spaced', animate('0.5s ease-out')),
      transition('spaced => centered', animate('0.5s ease-in')),
    ]),
    // Animacija za promenu rasporeda – samo ulazna animacija (fade-in)
    trigger('scheduleChange', [
      transition(':enter', [
        query(
          '.employee-column',
          [
            style({ opacity: 0 }),
            stagger(100, [animate('0.5s ease-out', style({ opacity: 1 }))]),
          ],
          { optional: true }
        ),
      ]),
    ]),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppoitmentsComponent implements OnInit, AfterViewInit {
  @ViewChild('timeColumn', { static: false }) timeColumnRef!: ElementRef;
  @ViewChild('employeeColumns', { static: false })
  employeeColumnsRef!: ElementRef;

  dateControl = new FormControl<Date | null>(null);
  selectedDate: Date | null = null;
  // Kontrola prikaza rasporeda u DOM-u
  animateSchedule: boolean = false;
  toolbarState: 'centered' | 'spaced' = 'centered';
  loading = true;

  workStartHour = 8;
  workEndHour = 22;

  // Generiši slotove prema radnom vremenu
  get timeSlots(): number[] {
    const slots: number[] = [];
    for (let t = this.workStartHour; t <= this.workEndHour; t += 0.25) {
      slots.push(Number(t.toFixed(2)));
    }
    return slots;
  }

  get slotCount(): number {
    return this.timeSlots.length;
  }

  employees: Employee[] = [];
  appointments: Appointment[] = [];
  services: Service[] = [];

  private totalMinutes = 14 * 60;

  // Ove vrednosti su za 8-22, 57 slotova, height 1300px, line-height 20px
  get gridBodyHeight(): number {
    // 57 slotova za 8-22, 1300px
    // 1300 / 57 = 22.8 px po slotu
    // slotCount = this.timeSlots.length
    return Math.round((1300 / 57) * this.slotCount);
  }

  // get timeCellLineHeight(): number {
  //   // 20px za 57 slotova, proporcionalno
  //   return Math.round((20 / 57) * this.slotCount);
  // }

  // Čuvamo offsete tokom drag operacije
  dragOffset: { [id: string]: { x: number; y: number } } = {};

  // Sprečavamo default ponašanje selektovanja teksta
  private mouseMoveListener = (ev: MouseEvent) => {
    if (window.getSelection) {
      window.getSelection()?.removeAllRanges();
    }
    ev.preventDefault();
  };

  get selectedDateStr(): string {
  if (!this.selectedDate) return '';
  return this.selectedDate.getFullYear() + '-' +
    String(this.selectedDate.getMonth() + 1).padStart(2, '0') + '-' +
    String(this.selectedDate.getDate()).padStart(2, '0');
 }

  constructor(
    private cd: ChangeDetectorRef,
    private scheduleService: ScheduleService,
    private readonly servicesService: ServicesService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private authService: AuthService,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      return;
    }

    this.servicesService.getAllServices(currentUser.tenant).subscribe(fetchedServices => {
      this.services = fetchedServices

    const today = new Date();
    this.dateControl.setValue(today);
    this.onDateChange(today); // manually trigger date load
  });
  }

  isDragging = false;
  justResized = false;
  isResizing = false;

  ngAfterViewInit(): void {
    const boundingFn = () => {
      const timeR = this.timeColumnRef.nativeElement.getBoundingClientRect();
      const colsR =
        this.employeeColumnsRef.nativeElement.getBoundingClientRect();
      return {
        top: colsR.top,
        left: timeR.right,
        bottom: colsR.bottom,
        right: colsR.right,
      };
    };

    interact('.appointment-block')
      .draggable({
        inertia: false,
        autoScroll: false,
        modifiers: [
          interact.modifiers.restrictRect({
            restriction: boundingFn,
            endOnly: false,
          }),
        ],
        listeners: {
          start: (event) => {
            this.isDragging = true;
            event.target.setAttribute('data-dragging', 'true');
            const target = event.target as HTMLElement;
            target.style.zIndex = '1000';
            const apId = target.getAttribute('data-appointment-id') || '';
            const rect = target.getBoundingClientRect();
            this.dragOffset[apId] = {
              x: event.clientX - rect.left,
              y: event.clientY - rect.top,
            };
            document.addEventListener('mousemove', this.mouseMoveListener, {
              passive: false,
            });
          },
          move: (event) => {
            const target = event.target as HTMLElement;
            const match = target.style.transform.match(
              /translate\(([-\d.]+)px,\s*([-\d.]+)px\)/
            );
            const prevX = match ? parseFloat(match[1]) : 0;
            const prevY = match ? parseFloat(match[2]) : 0;
            const newX = prevX + event.dx;
            const newY = prevY + event.dy;
            target.style.transform = `translate(${newX}px, ${newY}px)`;
            this.cd.detectChanges();
          },
          end: (event) => {
            const target = event.target as HTMLElement;
            target.style.transition = 'none';
            target.style.transform = 'none';
            target.style.zIndex = '3';
            document.removeEventListener('mousemove', this.mouseMoveListener);
            target.style.zIndex = '1';
            void target.offsetWidth;
            target.style.transition = 'transform 0.1s ease';
            setTimeout(() => {
              event.target.removeAttribute('data-dragging');
              this.isDragging = false;
            }, 0);
          },
        },
      })
      .resizable({
        edges: { bottom: '.resize-handle' },
        modifiers: [
          interact.modifiers.restrictEdges({
            outer: boundingFn,
            endOnly: true,
          }),
          interact.modifiers.restrictSize({
            min: { width: 40, height: (0.5 / 14) * this.gridBodyHeight },
          }),
        ],
        inertia: false,
        listeners: {
          start: (event) => {
            this.isResizing = true;
            document.addEventListener('mousemove', this.mouseMoveListener, {
              passive: false,
            });
          },
          move: (event) => {
            const target = event.target as HTMLElement;
            const apId = target.getAttribute('data-appointment-id') || '';
            const ap = this.appointments.find((a) => a.id === apId);
            if (!ap) return;
            const employee = this.employees.find(e => e._id === ap.employeeId);
            if (!employee || !employee.workingShift) return;

            let newHeightPx = event.rect.height;
            const fiveMinuteFraction = 5 / 60;
            let computedDuration = (newHeightPx / this.gridBodyHeight) * 14;
            let newDuration =
              Math.round(computedDuration / fiveMinuteFraction) *
              fiveMinuteFraction;

            if (newDuration < 0.5) {
              newDuration = 0.5;
              newHeightPx = (newDuration / 14) * this.gridBodyHeight;
            }

            const maxEndHour = employee.workingShift.endHour;
            if (ap.startHour + newDuration > maxEndHour) {
              newDuration = maxEndHour - ap.startHour;
              newHeightPx = (newDuration / 14) * this.gridBodyHeight;
            }

            if (ap.startHour + newDuration < ap.startHour + 0.5) {
              newDuration = 0.5;
              newHeightPx = (newDuration / 14) * this.gridBodyHeight;
            }

            ap.endHour = ap.startHour + newDuration;
            target.style.height = newHeightPx + 'px';

            // Više nema logike za overlapp
            this.cd.detectChanges();
          },
          end: (event) => {
            this.isResizing = false;
            document.removeEventListener('mousemove', this.mouseMoveListener);
            const apId = event.target.getAttribute('data-appointment-id') || '';
            const ap = this.appointments.find((a) => a.id === apId);
            if (ap) {
              const employee = this.employees.find(e => e._id === ap.employeeId);
              if (
                !employee ||
                !employee.workingShift ||
                ap.startHour < employee.workingShift.startHour ||
                ap.endHour > employee.workingShift.endHour
              ) {
                ap.endHour = Math.min(
                  Math.max(ap.endHour, (employee?.workingShift?.startHour ?? 8) + 0.5),
                  employee?.workingShift?.endHour ?? 22
                );
                this.snackBar.open(
                  'Nije moguće promeniti trajanje termina van radnog vremena zaposlenog',
                  'Zatvori',
                  { duration: 3000 }
                );
                this.cd.detectChanges();
                return;
              }

              this.cd.detectChanges();

              this.scheduleService.updateAppointment(ap.id, {
                ...ap,
                date: this.selectedDateStr
              }).subscribe({
                next: () => this.snackBar.open('Termin sačuvan!', 'Zatvori', { duration: 2000 }),
                error: () => this.snackBar.open('Greška pri čuvanju termina!', 'Zatvori', { duration: 2000 })
              });
            }
            this.justResized = true;
            setTimeout(() => {
              this.justResized = false;
            }, 0);
          },
        },
      });

    interact('.employee-column').dropzone({
      accept: '.appointment-block',
      overlap: 0.5,
      ondrop: (event) => {
        const empEl = event.target as HTMLElement;
        const employeeId = empEl.getAttribute('data-employee-id') || '';
        const employee = this.employees.find((e) => e._id === employeeId);
        const appointmentEl = event.relatedTarget as HTMLElement;
        const apId = appointmentEl.getAttribute('data-appointment-id') || '';
        const ap = this.appointments.find((a) => a.id === apId);
        if (!ap) return;

        if (
          !employee ||
          !employee.workingShift ||
          employee.workingShift.date !== this.selectedDateStr
        ) {
          appointmentEl.style.transition = 'transform 0.3s ease';
          appointmentEl.style.transform = 'none';
          this.snackBar.open(
            'Nije moguće postaviti uslugu jer zaposleni ne radi',
            'Zatvori',
            { duration: 3000 }
          );
          return;
        }

        const colRect = empEl.getBoundingClientRect();
        const pointerY = event.dragEvent.clientY;
        const offsetY = this.dragOffset[apId]?.y || 0;
        let localY = pointerY - colRect.top - offsetY;
        const minutesFromTop = (localY / this.gridBodyHeight) * this.totalMinutes;
        let newStartHour = 8 + Math.round(minutesFromTop / 5) * 5 / 60;
        const duration = ap.endHour - ap.startHour;
        let newEndHour = newStartHour + duration;

        if (
          newStartHour < employee.workingShift.startHour ||
          newEndHour > employee.workingShift.endHour
        ) {
          appointmentEl.style.transition = 'transform 0.3s ease';
          appointmentEl.style.transform = 'none';
          this.snackBar.open(
            'Nije moguće postaviti uslugu van radnog vremena zaposlenog',
            'Zatvori',
            { duration: 3000 }
          );
          return;
        }

        ap.startHour = newStartHour;
        ap.endHour = newEndHour;
        ap.employeeId = employeeId;
        appointmentEl.style.transform = 'none';
        appointmentEl.style.zIndex = '1';
        this.cd.detectChanges();

        this.scheduleService.updateAppointment(ap.id, {
          ...ap,
          date: this.selectedDateStr
        }).subscribe({
          next: () => this.snackBar.open('Termin sačuvan!', 'Zatvori', { duration: 2000 }),
          error: () => this.snackBar.open('Greška pri čuvanju termina!', 'Zatvori', { duration: 2000 })
        });
      },
    });
  }

  onEmptyColumnClick(emp: Employee, event: MouseEvent): void {
    if (this.isDragging) return;
    if (!emp.workingShift) return;

    const empColRect = (
      event.currentTarget as HTMLElement
    ).getBoundingClientRect();
    const localY = event.clientY - empColRect.top;
    const minutesFromTop = (localY / this.gridBodyHeight) * this.totalMinutes;
    // Snap na 15 minuta
    const snappedMinutes = Math.round(minutesFromTop / 15) * 15;
    const appointmentStart = 8 + snappedMinutes / 60;

    // Dozvoli klik samo ako je slot u okviru radnog vremena
    if (!this.isSlotAvailable(emp, appointmentStart)) return;

    const dialogData: AppointmentDialogData = {
      employeeId: emp._id!,
      appointmentStart,
      services: this.services,
    };

    const dialogRef = this.dialog.open(AppointmentDialogComponent, {
      data: dialogData,
      panelClass: 'custom-appointment-dialog',
      backdropClass: 'custom-backdrop',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        const newAp: Appointment = {
          employeeId: emp._id!,
          startHour: result.startHour,
          endHour: result.startHour + 1,
          serviceName: result.service,
          date: this.selectedDateStr,
          id: ''
        };

        this.scheduleService.createAppointment(newAp).subscribe({
          next: (created: any) => {
            this.appointments.push({
              ...newAp,
              ...created,
              id: created._id || created.id
            });
            this.cd.detectChanges();
            this.snackBar.open('Termin sačuvan!', 'Zatvori', { duration: 2000 });
          },
          error: () => this.snackBar.open('Greška pri čuvanju termina!', 'Zatvori', { duration: 2000 })
        });
      }
    });
  }

  onAppointmentClick(ap: Appointment, event: MouseEvent): void {
    if (this.isDragging || this.justResized) return;
    const target = event.currentTarget as HTMLElement;
    if (target.getAttribute('data-dragging') === 'true') return;

    const dialogData: AppointmentDialogData = {
      employeeId: ap.employeeId,
      appointmentStart: ap.startHour,
      appointmentEnd: ap.endHour,
      service: ap.serviceName,
      services: this.services,
    };

    const dialogRef = this.dialog.open(AppointmentDialogComponent, {
      data: dialogData,
      panelClass: 'custom-appointment-dialog',
      backdropClass: 'custom-backdrop',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result?.delete) {
        this.scheduleService.deleteAppointment(ap.id).subscribe({
          next: () => {
            this.appointments = this.appointments.filter(a => a.id !== ap.id);
            this.snackBar.open('Termin obrisan!', 'Zatvori', { duration: 2000 });
            this.cd.detectChanges();
          },
          error: () => this.snackBar.open('Greška pri brisanju termina!', 'Zatvori', { duration: 2000 })
        });
      } else if (result) {
        ap.startHour = result.startHour;
        ap.endHour = result.endHour;
        ap.serviceName = result.service;
        this.cd.detectChanges();

        this.scheduleService.updateAppointment(ap.id, {
          ...ap,
          date: this.selectedDateStr
        }).subscribe({
          next: () => this.snackBar.open('Termin izmenjen!', 'Zatvori', { duration: 2000 }),
          error: () => this.snackBar.open('Greška pri izmeni termina!', 'Zatvori', { duration: 2000 })
        });
      }
    });
  }

  // --- NOVA LOGIKA ZA OVERLAP ---

  // Vraća sve termine koji se preklapaju sa zadatim (uključujući njega)
  getOverlappingAppointments(ap: Appointment, employeeId: string): Appointment[] {
    return this.appointments
      .filter(a =>
        a.employeeId === employeeId &&
        a.date === ap.date &&
        a.startHour < ap.endHour &&
        a.endHour > ap.startHour
      );
  }

  // Vraća stabilan indeks termina u overlapp grupi (sortirano samo po id)
  getAppointmentOverlapIndex(ap: Appointment, employeeId: string): number {
    const overlapping = this.getOverlappingAppointments(ap, employeeId)
      .map(a => a.id)
      .sort(); // stabilno po id-u
    return overlapping.indexOf(ap.id);
  }

  // Vraća broj overlappovanih termina u toj grupi
  getAppointmentOverlapCount(ap: Appointment, employeeId: string): number {
    return this.getOverlappingAppointments(ap, employeeId).length;
  }

  trackByAppointmentId(index: number, ap: Appointment) {
    return ap.id;
  }

  getAppointmentsForEmployee(employeeId: string): Appointment[] {
    return this.appointments.filter((a) => a.employeeId === employeeId);
  }

  loadSchedule(date: Date): void {
    this.loading = true;
    this.scheduleService.getScheduleSimple(date).subscribe({
      next: (data) => {
        this.employees = data.employees;
        this.appointments = data.appointments;
        this.loading = false;
        this.cd.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        console.error('Schedule loading error:', err);
      }
    });
  }

  onDateChange(dateValue: any): void {
    if (dateValue) {
      // Ako je dateValue Moment objekt, konvertuj ga u Date
      const nativeDate = dateValue.toDate ? dateValue.toDate() : dateValue;
      if (
        !this.selectedDate ||
        nativeDate.getTime() !== this.selectedDate.getTime()
      ) {
        this.animateSchedule = false;
        this.selectedDate = nativeDate;
        this.toolbarState = 'spaced';
        this.employees = [];
        this.appointments = [];
        this.cd.detectChanges();
        this.ngZone.run(() => {
          this.loadSchedule(nativeDate);
          this.animateSchedule = true;
          this.cd.detectChanges();
        });
      }
    } else {
      this.toolbarState = 'centered';
      this.selectedDate = null;
      this.employees = [];
      this.appointments = [];
      this.animateSchedule = false;
    }
  }

  shiftDate(deltaDays: number): void {
  let current = this.dateControl.value;
  if (!current) return;
  
  // Ako je current Moment objekat, konvertuj u native Date
  if (moment.isMoment(current)) {
    current = current.toDate();
  }
  
  // current je sada garantovano Date
  const next: Date = new Date(current);
  next.setDate(current.getDate() + deltaDays);
  this.dateControl.setValue(next);
  this.onDateChange(next);
}

  formatTime(time: number): string {
    const h = Math.floor(time);
    const m = Math.round((time - h) * 60);
    return `${h}:${m < 10 ? '0' + m : m}`;
  }

  calculateTop(startHour: number): number {
    return ((startHour - 8) / 14) * 100;
  }

  calculateHeight(startHour: number, endHour: number): number {
    return ((endHour - startHour) / 14) * 100;
  }

  isColumnDisabled(emp: Employee): boolean {
    // Kolona je disabled ako nema workingShift za taj dan
    return !emp.workingShift;
  }

  // Da li je slot u okviru radnog vremena zaposlenog
  isSlotAvailable(emp: Employee, slotHour: number): boolean {
    if (!emp.workingShift) return false;
    return slotHour >= emp.workingShift.startHour && slotHour < emp.workingShift.endHour;
  }

  isSlotCovered(emp: Employee, t: number): boolean {
    const appointments = this.getAppointmentsForEmployee(emp._id || '');
    return appointments.some(ap => t >= ap.startHour && t < ap.endHour);
  }
}
