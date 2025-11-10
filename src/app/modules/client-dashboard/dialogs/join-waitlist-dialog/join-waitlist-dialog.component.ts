import { Component, OnInit, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, provideNativeDateAdapter } from '@angular/material/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AppointmentsService } from '../../../appointments/services/appointment.service';
import { SettingsService } from '../../../settings/services/settings.service';
import { ServicesService } from '../../../services/services/services.service';
import { EmployeesService } from '../../../employees/services/employees.service';
import { ClientsService } from '../../../clients/services/clients.service';
import { Employee } from '../../../../models/Employee';
import { Service } from '../../../../models/Service';
import { Facility } from '../../../../models/Facility';
import { AuthService } from '../../../../core/services/auth.service';
import { WaitlistEntry } from '../../../../models/WaitlistEntry';
import { AddToWaitlistRequest } from '../../../appointments/services/appointment.service';
import { Client } from '../../../../models/Client';

type WaitlistFormValue = {
  facility: string;
  employee: string;
  service: string;
  preferredDate: string | Date;
  preferredStartHour: string;
  preferredEndHour: string;
};

/**
 * Join Waitlist Dialog Component
 * 
 * Dialog komponenta za prijavu klijenta na listu čekanja.
 * 
 * Funkcionalnosti:
 * - Odabir facility (lokacija) - prikazuje radne sate lokacije
 * - Odabir zaposlenog iz te lokacije
 * - Odabir usluge
 * - Odabir preferiranog datuma (Material DatePicker)
 * - Odabir preferiranog vremena (samo radni sati lokacije)
 * - Automatski izračunava endHour na osnovu durationMinutes usluge
 */
@Component({
  selector: 'app-join-waitlist-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatSnackBarModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTooltipModule
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './join-waitlist-dialog.component.html',
  styleUrl: './join-waitlist-dialog.component.scss'
})
export class JoinWaitlistDialogComponent implements OnInit {
  waitlistForm: FormGroup;
  employees: Employee[] = [];
  services: Service[] = [];
  facilities: Facility[] = [];
  timeSlots: string[] = [];
  loading = false;
  today = new Date().toISOString().split('T')[0];
  shiftWindow: { startHour: number; endHour: number } | null = null;
  shiftWarning: string | null = null;
  isShiftLoading = false;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<JoinWaitlistDialogComponent>,
    private appointmentsService: AppointmentsService,
    private settingsService: SettingsService,
    private servicesService: ServicesService,
    private employeesService: EmployeesService,
    private clientsService: ClientsService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.waitlistForm = this.fb.group({
      facility: ['', Validators.required],
      employee: ['', Validators.required],
      service: ['', Validators.required],
      preferredDate: ['', Validators.required],
      preferredStartHour: [{value: '', disabled: true}, Validators.required],
      preferredEndHour: ['']
    });
  }

  ngOnInit(): void {
    this.loadData();
    this.generateTimeSlots();

    this.waitlistForm.get('employee')?.valueChanges.subscribe(() => {
      this.waitlistForm.patchValue({ preferredStartHour: '', preferredEndHour: '' }, { emitEvent: false });
      this.loadShiftWindow();
    });

    this.waitlistForm.get('preferredDate')?.valueChanges.subscribe(() => {
      this.waitlistForm.patchValue({ preferredStartHour: '', preferredEndHour: '' }, { emitEvent: false });
      this.loadShiftWindow();
    });
  }

  loadData(): void {
    const user = this.authService.getCurrentUser();
    const tenantId = user?.tenant || '';

    // Load facilities
    if (tenantId) {
      this.settingsService.getAllFacilities(tenantId).subscribe({
      next: (facilities: Facility[]) => {
        this.facilities = facilities;
      },
      error: (error: any) => {
        console.error('Error loading facilities:', error);
        this.snackBar.open('Greška pri učitavanju lokacija', 'Zatvori', { duration: 3000 });
      }
    });
    }

    // Load services
    if (tenantId) {
      this.servicesService.getAllServices(tenantId).subscribe({
        next: (services: Service[]) => {
          this.services = services.filter(s => s.isActive);
        },
        error: (error: any) => {
          console.error('Error loading services:', error);
          this.snackBar.open('Greška pri učitavanju usluga', 'Zatvori', { duration: 3000 });
        }
      });
    }
  }

  generateTimeSlots(): void {
    const slots = [];
    for (let hour = 8; hour <= 20; hour++) {
      for (let min = 0; min < 60; min += 30) {
        const hourStr = String(hour).padStart(2, '0');
        const minStr = String(min).padStart(2, '0');
        slots.push(`${hourStr}:${minStr}`);
      }
    }
    this.timeSlots = slots;
  }

  /**
   * Generiše vremenske slotove na osnovu radnih sati lokacije.
   * Filtrira time slots tako da uključi samo vreme kada je lokacija otvorena.
   * PRIMER: Ako lokacija radi od 08:00 do 18:00, generiše slotove samo u tom rasponu.
   */
  generateTimeSlotsForFacility(facility: Facility): void {
    const slots: string[] = [];
    
    // Parse opening and closing hours
    const openingHour = this.parseTimeString(facility.openingHour);
    const closingHour = this.parseTimeString(facility.closingHour);
    
    // Generate slots based on facility hours (every 30 minutes)
    for (let hour = openingHour.hour; hour <= closingHour.hour; hour++) {
      const minStart = (hour === openingHour.hour) ? openingHour.min : 0;
      const minEnd = (hour === closingHour.hour) ? closingHour.min : 60;
      
      for (let min = minStart; min <= minEnd; min += 30) {
        // Ne dodavaj slotove sa minutima >= 60 (npr. 08:60 -> treba 09:00)
        if (min >= 60) {
          continue;
        }
        const hourStr = String(hour).padStart(2, '0');
        const minStr = String(min).padStart(2, '0');
        slots.push(`${hourStr}:${minStr}`);
      }
    }
    
    if (this.shiftWindow) {
      this.timeSlots = slots.filter(slot => this.isTimeWithinShift(slot));
      if (!this.timeSlots.length) {
        this.shiftWarning = 'Zaposleni nema dostupne termine unutar svoje smene za izabrani datum.';
      } else {
        this.shiftWarning = null;
      }
    } else {
      this.timeSlots = slots;
      this.shiftWarning = null;
    }
  }

  parseTimeString(time: string): { hour: number; min: number } {
    // Parse "HH:MM" format
    const [hour, min] = time.split(':').map(Number);
    return { hour, min };
  }

  private timeStringToDecimal(value: string): number {
    const [hour, minute] = value.split(':').map(Number);
    return hour + minute / 60;
  }

  private getCurrentServiceDurationHours(): number {
    const serviceId = this.waitlistForm.get('service')?.value;
    const service = this.services.find(s => s._id === serviceId);
    return service ? service.durationMinutes / 60 : 0;
  }

  private isTimeWithinShift(value: string): boolean {
    if (!this.shiftWindow) {
      return true;
    }

    const startDecimal = this.timeStringToDecimal(value);
    const duration = this.getCurrentServiceDurationHours();
    const endDecimal = startDecimal + duration;

    return startDecimal >= this.shiftWindow.startHour && endDecimal <= this.shiftWindow.endHour;
  }

  private formatDateForApi(value: any): string {
    if (!value) {
      return '';
    }

    if (value instanceof Date) {
      return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
    }

    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}-${String(parsed.getDate()).padStart(2, '0')}`;
    }

    return value;
  }

  loadShiftWindow(): void {
    const facilityId = this.waitlistForm.get('facility')?.value;
    const employeeId = this.waitlistForm.get('employee')?.value;
    const preferredDateControl = this.waitlistForm.get('preferredDate')?.value;

    if (!facilityId || !employeeId || !preferredDateControl) {
      this.shiftWindow = null;
      this.shiftWarning = null;
      this.waitlistForm.get('preferredStartHour')?.disable({ emitEvent: false });
      this.timeSlots = [];
      return;
    }

    const facilityObj = this.facilities.find(f => f._id === facilityId);
    if (!facilityObj) {
      return;
    }

    const preferredDate = this.formatDateForApi(preferredDateControl);
    if (!preferredDate) {
      return;
    }

    this.isShiftLoading = true;
    this.waitlistForm.get('preferredStartHour')?.disable({ emitEvent: false });
    this.appointmentsService.getWaitlistShiftWindow(employeeId, facilityId, preferredDate).subscribe({
      next: (result) => {
        this.isShiftLoading = false;

        if (result.hasShift && result.startHour !== undefined && result.endHour !== undefined) {
          this.shiftWindow = { startHour: result.startHour, endHour: result.endHour };
          this.shiftWarning = null;
          this.waitlistForm.get('preferredStartHour')?.enable({ emitEvent: false });
          this.generateTimeSlotsForFacility(facilityObj);
          this.calculateEndHour();
        } else {
          this.shiftWindow = null;
          this.shiftWarning = 'Zaposleni nema definisanu smenu za izabrani datum.';
          this.waitlistForm.get('preferredStartHour')?.disable({ emitEvent: false });
          this.timeSlots = [];
        }
      },
      error: (error) => {
        this.isShiftLoading = false;
        console.error('Error loading shift window:', error);
        this.shiftWindow = null;
        this.shiftWarning = 'Greška pri proveri smene zaposlenog.';
        this.waitlistForm.get('preferredStartHour')?.disable({ emitEvent: false });
        this.timeSlots = [];
        this.snackBar.open('Greška pri proveri smene zaposlenog', 'Zatvori', { duration: 3000 });
      },
    });
  }

  /**
   * Kada se selektuje lokacija:
   * - Briše employee i time selections
   * - Omogućava odabir vremena (disabled by default)
   * - Generiše time slots na osnovu radnih sati lokacije
   * - Učitava zaposlene za tu lokaciju
   */
  onFacilityChange(facilityId: string): void {
    const facilityObj = this.facilities.find(f => f._id === facilityId);
    if (!facilityObj) return;

    // Clear employee selection
    this.waitlistForm.patchValue({ employee: '', preferredStartHour: '', preferredEndHour: '' }, { emitEvent: false });
    this.waitlistForm.get('preferredStartHour')?.disable({ emitEvent: false });
    this.shiftWindow = null;
    this.shiftWarning = null;

    // Generate time slots based on facility working hours
    this.generateTimeSlotsForFacility(facilityObj);
    
    const user = this.authService.getCurrentUser();
    const tenantId = typeof user?.tenant === 'string' ? user.tenant : String(user?.tenant || '');

    // Load employees for this facility
    this.employeesService.getAllEmployees(tenantId, facilityId).subscribe({
      next: (employees) => {
        this.employees = employees.filter(e => 
          e.includeInAppoitments && 
          e.isActive && 
          (typeof e.facilities === 'undefined' || 
           e.facilities.some(f => {
             const fid = typeof f === 'string' ? f : f._id;
             return fid === facilityId;
           }))
        );
      },
      error: (error) => {
        console.error('Error loading employees:', error);
        this.snackBar.open('Greška pri učitavanju zaposlenih', 'Zatvori', { duration: 3000 });
      }
    });

    this.loadShiftWindow();
  }

  /**
   * Kada se odabere usluga, automatski se izračunava endHour.
   */
  onServiceChange(): void {
    const facilityId = this.waitlistForm.get('facility')?.value;
    const facilityObj = this.facilities.find(f => f._id === facilityId);
    if (facilityObj) {
      this.generateTimeSlotsForFacility(facilityObj);
    }
    this.calculateEndHour();
  }

  /**
   * Kada se promeni start hour, automatski se izračunava endHour na osnovu usluge.
   */
  onStartHourChange(): void {
    this.calculateEndHour();
  }

  /**
   * Izračunava krajnje vreme na osnovu usluge i početnog vremena.
   */
  calculateEndHour(): void {
    const serviceId = this.waitlistForm.get('service')?.value;
    const service = this.services.find(s => s._id === serviceId);
    const preferredStartHour = this.waitlistForm.get('preferredStartHour')?.value;
    const startControl = this.waitlistForm.get('preferredStartHour');

    if (!preferredStartHour) {
      this.waitlistForm.patchValue({ preferredEndHour: '' }, { emitEvent: false });
      return;
    }

    if (service && preferredStartHour) {
      const durationMinutes = service.durationMinutes;
      const hours = Math.floor(durationMinutes / 60);
      const minutes = durationMinutes % 60;
      
      const [startH, startM] = preferredStartHour.split(':').map(Number);
      let endH = startH + hours;
      let endM = startM + minutes;
      
      if (endM >= 60) {
        endH += 1;
        endM -= 60;
      }
      
      const endDecimal = endH + endM / 60;

      if (this.shiftWindow && endDecimal > this.shiftWindow.endHour) {
        startControl?.setErrors({ ...(startControl.errors || {}), outsideShift: true });
        this.shiftWarning = 'Termin izlazi iz radnog vremena smene za odabranu uslugu.';
        this.waitlistForm.patchValue({ preferredEndHour: '' }, { emitEvent: false });
        return;
      }

      if (startControl?.hasError('outsideShift')) {
        const { outsideShift, ...errors } = startControl.errors || {};
        startControl.setErrors(Object.keys(errors).length ? errors : null);
      }

      this.shiftWarning = null;
      const endHour = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
      this.waitlistForm.patchValue({ preferredEndHour: endHour }, { emitEvent: false });
    }
  }

  onSubmit(): void {
    if (this.waitlistForm.valid) {
      this.loading = true;
      const user = this.authService.getCurrentUser();
      if (!user?.userId) {
        this.snackBar.open('Greška: Neispravni korisnički podaci', 'Zatvori', { duration: 3000 });
        this.loading = false;
        return;
      }

      const formValue = this.waitlistForm.getRawValue() as WaitlistFormValue;
      if (!formValue.preferredStartHour || !formValue.preferredEndHour) {
        this.snackBar.open('Molimo izaberite vreme termina.', 'Zatvori', { duration: 3000 });
        this.loading = false;
        return;
      }
      
      if (this.shiftWindow && !this.isTimeWithinShift(formValue.preferredStartHour)) {
        this.snackBar.open(this.shiftWarning || 'Termin nije u okviru radnog vremena zaposlenog.', 'Zatvori', {
          duration: 4000,
        });
        this.loading = false;
        return;
      }
      
      // Convert time to hour number
      const [startH, startM] = formValue.preferredStartHour.split(':').map(Number);
      const preferredStartHour = startH + startM / 60;
      
      const [endH, endM] = formValue.preferredEndHour.split(':').map(Number);
      const preferredEndHour = endH + endM / 60;

      // First, get the Client ID from User ID
      this.clientsService.getClientByUserId(user.userId).subscribe({
        next: (client: Client) => {
          if (!client || !client._id) {
            this.snackBar.open('Greška: Niste povezani sa klijent profila', 'Zatvori', { duration: 3000 });
            this.loading = false;
            return;
          }

          // Convert date to YYYY-MM-DD format
          const date = new Date(formValue.preferredDate);
          const preferredDate = date.getFullYear() + '-' + 
            String(date.getMonth() + 1).padStart(2, '0') + '-' + 
            String(date.getDate()).padStart(2, '0');

          const waitlistData: AddToWaitlistRequest = {
            client: client._id,
            employee: formValue.employee,
            service: formValue.service,
            facility: formValue.facility,
            tenant: typeof user?.tenant === 'string' ? user.tenant : String(user?.tenant ?? ''),
            preferredDate: preferredDate,
            preferredStartHour,
            preferredEndHour
          };

          this.appointmentsService.addToWaitlist(waitlistData).subscribe({
            next: (entry: WaitlistEntry) => {
              this.loading = false;
              const successMessage =
                entry?.shiftValidationMessage ?? entry?.slotStatus ?? 'Uspešno ste dodati na listu čekanja!';
              this.snackBar.open(successMessage, 'Zatvori', { duration: 3000 });
              this.dialogRef.close(true);
            },
            error: (error) => {
              this.loading = false;
              const errorMsg = error?.error?.message || 'Greška pri prijavi na listu čekanja';
              this.snackBar.open(errorMsg, 'Zatvori', { duration: 3000 });
              console.error('Error joining waitlist:', error);
            }
          });
        },
        error: (error) => {
          this.loading = false;
          this.snackBar.open('Greška pri pronalaženju klijent profila', 'Zatvori', { duration: 3000 });
          console.error('Error getting client:', error);
        }
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  private formatTimeFromDecimal(value: number): string {
    const hours = Math.floor(value);
    const minutes = Math.round((value - hours) * 60);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  }

  formatShiftWindowLabel(): string {
    if (!this.shiftWindow) {
      return '';
    }
    return `${this.formatTimeFromDecimal(this.shiftWindow.startHour)} - ${this.formatTimeFromDecimal(this.shiftWindow.endHour)}`;
  }

  get startHint(): string | null {
    if (this.isShiftLoading) {
      return 'Provera smene...';
    }

    if (this.shiftWindow && !this.shiftWarning) {
      return `Radno vreme smene: ${this.formatShiftWindowLabel()}`;
    }

    if (!this.waitlistForm.get('facility')?.value) {
      return 'Izaberi lokaciju prvo';
    }

    return null;
  }
}
