import { Component, OnInit, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { MatDatepickerModule, MatDatepickerInputEvent } from '@angular/material/datepicker';
import { MatNativeDateModule, provideNativeDateAdapter } from '@angular/material/core';
import { AppointmentsService } from '../../../appointments/services/appointment.service';
import { SettingsService } from '../../../settings/services/settings.service';
import { ServicesService } from '../../../services/services/services.service';
import { EmployeesService } from '../../../employees/services/employees.service';
import { ClientsService } from '../../../clients/services/clients.service';
import { Employee } from '../../../../models/Employee';
import { Service } from '../../../../models/Service';
import { Facility } from '../../../../models/Facility';
import { AuthService } from '../../../../core/services/auth.service';

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
    MatNativeDateModule
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
        const hourStr = String(hour).padStart(2, '0');
        const minStr = String(min).padStart(2, '0');
        slots.push(`${hourStr}:${minStr}`);
      }
    }
    
    this.timeSlots = slots;
  }

  parseTimeString(time: string): { hour: number; min: number } {
    // Parse "HH:MM" format
    const [hour, min] = time.split(':').map(Number);
    return { hour, min };
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
    this.waitlistForm.patchValue({ employee: '', preferredStartHour: '', preferredEndHour: '' });

    // Enable preferred time when facility is selected
    this.waitlistForm.get('preferredStartHour')?.enable();

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
  }

  /**
   * Kada se odabere usluga, automatski se izračunava endHour.
   * Na osnovu durationMinutes usluge, dodaje se trajanje na startHour.
   */
  onServiceChange(): void {
    const serviceId = this.waitlistForm.get('service')?.value;
    const service = this.services.find(s => s._id === serviceId);
    
    if (service) {
      const durationMinutes = service.durationMinutes;
      const hours = Math.floor(durationMinutes / 60);
      const minutes = durationMinutes % 60;
      
      const preferredStartHour = this.waitlistForm.get('preferredStartHour')?.value;
      if (preferredStartHour) {
        const [startH, startM] = preferredStartHour.split(':').map(Number);
        let endH = startH + hours;
        let endM = startM + minutes;
        
        if (endM >= 60) {
          endH += 1;
          endM -= 60;
        }
        
        const endHour = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
        this.waitlistForm.patchValue({ preferredEndHour: endHour });
      }
    }
  }

  onSubmit(): void {
    if (this.waitlistForm.valid) {
      const user = this.authService.getCurrentUser();
      if (!user?.userId) {
        this.snackBar.open('Greška: Neispravni korisnički podaci', 'Zatvori', { duration: 3000 });
        return;
      }

      const formValue = this.waitlistForm.value;
      
      // Convert time to hour number
      const [startH, startM] = formValue.preferredStartHour.split(':').map(Number);
      const preferredStartHour = startH + startM / 60;
      
      const [endH, endM] = formValue.preferredEndHour.split(':').map(Number);
      const preferredEndHour = endH + endM / 60;

      // First, get the Client ID from User ID
      this.clientsService.getClientByUserId(user.userId).subscribe({
        next: (client) => {
          if (!client || !client._id) {
            this.snackBar.open('Greška: Niste povezani sa klijent profila', 'Zatvori', { duration: 3000 });
            this.loading = false;
            return;
          }

          const waitlistData = {
            client: client._id,
            employee: formValue.employee,
            service: formValue.service,
            facility: formValue.facility,
            preferredDate: formValue.preferredDate,
            preferredStartHour,
            preferredEndHour
          };

          this.appointmentsService.addToWaitlist(waitlistData).subscribe({
            next: () => {
              this.loading = false;
              this.snackBar.open('Uspešno ste dodati na listu čekanja!', 'Zatvori', { duration: 3000 });
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
}
