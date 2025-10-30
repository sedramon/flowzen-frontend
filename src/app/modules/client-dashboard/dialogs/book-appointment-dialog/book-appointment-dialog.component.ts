import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { AuthService } from '../../../../core/services/auth.service';
import { AppointmentsService } from '../../../appointments/services/appointment.service';
import { SettingsService } from '../../../settings/services/settings.service';
import { ServicesService } from '../../../services/services/services.service';
import { EmployeesService } from '../../../employees/services/employees.service';
import { ClientsService } from '../../../clients/services/clients.service';
import { Employee } from '../../../../models/Employee';
import { Service } from '../../../../models/Service';
import { Facility } from '../../../../models/Facility';

@Component({
  selector: 'app-book-appointment-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatSnackBarModule
  ],
  templateUrl: './book-appointment-dialog.component.html',
  styleUrl: './book-appointment-dialog.component.scss'
})
export class BookAppointmentDialogComponent implements OnInit {
  appointmentForm: FormGroup;
  employees: Employee[] = [];
  services: Service[] = [];
  facilities: Facility[] = [];
  timeSlots: string[] = [];
  loading = false;
  today = new Date().toISOString().split('T')[0];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<BookAppointmentDialogComponent>,
    private appointmentsService: AppointmentsService,
    private settingsService: SettingsService,
    private servicesService: ServicesService,
    private employeesService: EmployeesService,
    private clientsService: ClientsService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.appointmentForm = this.fb.group({
      facility: ['', Validators.required],
      employee: ['', Validators.required],
      service: ['', Validators.required],
      date: ['', Validators.required],
      startHour: ['', Validators.required],
      endHour: ['']
    });
  }

  ngOnInit(): void {
    this.loadData();
    this.generateTimeSlots();
    
    // Pre-populate form if data is provided (rebooking cancelled appointment)
    if (this.data) {
      if (this.data.facility) {
        this.appointmentForm.patchValue({ facility: this.data.facility._id || this.data.facility.id });
        setTimeout(() => this.onFacilityChange(this.data.facility._id || this.data.facility.id), 100);
      }
      if (this.data.service) {
        setTimeout(() => this.appointmentForm.patchValue({ service: this.data.service._id || this.data.service.id }), 200);
      }
      if (this.data.employee) {
        setTimeout(() => this.appointmentForm.patchValue({ employee: this.data.employee._id || this.data.employee.id }), 300);
      }
      if (this.data.date) {
        this.appointmentForm.patchValue({ date: this.data.date });
      }
    }
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

  onFacilityChange(facilityId: string): void {
    const facilityObj = this.facilities.find(f => f._id === facilityId);
    if (!facilityObj) return;

    // Load employees for this facility
    const tenantId = typeof facilityObj.tenant === 'string' ? facilityObj.tenant : String(facilityObj.tenant);
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

  onServiceChange(): void {
    const serviceId = this.appointmentForm.get('service')?.value;
    const service = this.services.find(s => s._id === serviceId);
    
    if (service) {
      const durationMinutes = service.durationMinutes;
      const hours = Math.floor(durationMinutes / 60);
      const minutes = durationMinutes % 60;
      
      const startHour = this.appointmentForm.get('startHour')?.value;
      if (startHour) {
        const [startH, startM] = startHour.split(':').map(Number);
        let endH = startH + hours;
        let endM = startM + minutes;
        
        if (endM >= 60) {
          endH += 1;
          endM -= 60;
        }
        
        const endHour = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
        this.appointmentForm.patchValue({ endHour });
      }
    }
  }

  onSubmit(): void {
    if (this.appointmentForm.valid) {
      const user = this.authService.getCurrentUser();
      if (!user?.userId || !user?.tenant) {
        this.snackBar.open('Greška: Neispravni korisnički podaci', 'Zatvori', { duration: 3000 });
        return;
      }

      const formValue = this.appointmentForm.value;
      
      // Convert time to hour number
      const [startH, startM] = formValue.startHour.split(':').map(Number);
      const startHour = startH + startM / 60;
      
      const [endH, endM] = formValue.endHour.split(':').map(Number);
      const endHour = endH + endM / 60;

      // First, get the Client ID from User ID
      this.clientsService.getClientByUserId(user.userId).subscribe({
        next: (client) => {
          if (!client || !client._id) {
            this.snackBar.open('Greška: Niste povezani sa klijent profila', 'Zatvori', { duration: 3000 });
            this.loading = false;
            return;
          }

          const appointmentData = {
            employee: formValue.employee,
            client: client._id,
            service: formValue.service,
            facility: formValue.facility,
            tenant: user.tenant!,
            date: formValue.date,
            startHour,
            endHour,
            paid: false
          };

          this.appointmentsService.createAppointment(appointmentData).subscribe({
            next: () => {
              this.loading = false;
              this.snackBar.open('Termin je uspešno zakazan!', 'Zatvori', { duration: 3000 });
              this.dialogRef.close(true);
            },
            error: (error) => {
              this.loading = false;
              const errorMsg = error?.error?.message || 'Greška pri zakazivanju termina';
              this.snackBar.open(errorMsg, 'Zatvori', { duration: 3000 });
              console.error('Error booking appointment:', error);
            }
          });
        },
        error: (error) => {
          this.loading = false;
          this.snackBar.open('Greška pri pronalaženju klijent profila', 'Zatvori', { duration: 3000 });
          console.error('Error getting client:', error);
        }
      });

      return; // Exit early since we're handling async operation above
    }
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
