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
import { MatSelectModule } from '@angular/material/select';
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

import { ServicesService } from '../services/services/services.service';
import { MatDialog } from '@angular/material/dialog';
import {
  AppointmentDialogComponent,
  AppointmentDialogData,
} from './dialog/appointment-dialog.component';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/services/auth.service';
import { Service } from '../../models/Service';
import { Employee } from '../../models/Employee';
import { Facility, FacilityUtils } from '../../models/Facility';
import {
  MatMomentDateModule,
  MomentDateAdapter,
  MAT_MOMENT_DATE_ADAPTER_OPTIONS,
} from '@angular/material-moment-adapter';
import {
  MAT_DATE_FORMATS,
  DateAdapter,
  MAT_DATE_LOCALE,
} from '@angular/material/core';
import moment from 'moment';
import { MatTooltipModule } from '@angular/material/tooltip';

import {
  Appointment,
  UpdateAndCreateAppointmentDto,
} from '../../models/Appointment';
import { ClientsService } from '../clients/services/clients.service';
import { Client } from '../../models/Client';
import { MatButtonModule } from '@angular/material/button';
import { AppointmentsService } from './services/appointment.service';

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
    MatTooltipModule,
    MatButtonModule,
    MatSelectModule
  ],
  templateUrl: './appoitments.component.html',
  styleUrls: ['./appoitments.component.scss'],
  providers: [
    {
      provide: DateAdapter,
      useClass: MomentDateAdapter,
      deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS],
    },
    { provide: MAT_DATE_FORMATS, useValue: CUSTOM_DATE_FORMATS },
    { provide: MAT_DATE_LOCALE, useValue: 'en-GB' },
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
  @ViewChild('gridBody', { static: false })
  gridBodyRef!: ElementRef<HTMLElement>;
  @ViewChild('firstEmployeeColumn', { static: false })
  firstEmployeeColumnRef!: ElementRef;

  dateControl = new FormControl<Date | null>(null);
  facilityControl = new FormControl<string>('');
  selectedDate: Date | null = null;
  selectedFacility: string = '';
  // Kontrola prikaza rasporeda u DOM-u
  animateSchedule: boolean = false;
  toolbarState: 'centered' | 'spaced' = 'centered';
  loading = true;

  workStartHour = 8;
  workEndHour = 22;

  // Generate time slots based on working hours
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
  clients: Client[] = [];
  facilities: Facility[] = [];

  private totalMinutes = 14 * 60;

  // Grid calculations for 8-22, 57 slots, height 1300px, line-height 20px
  get gridBodyHeight(): number {
    // 57 slots for 8-22, 1300px
    // 1300 / 57 = 22.8 px per slot
    // slotCount = this.timeSlots.length
    return Math.round((1300 / 57) * this.slotCount);
  }

  // get timeCellLineHeight(): number {
  //   // 20px za 57 slotova, proporcionalno
  //   return Math.round((20 / 57) * this.slotCount);
  // }

  // Store offsets during drag operations
  private dragOffset: { [id: string]: { x: number; y: number } } = {};
  private initialPosition: { [id: string]: { left: number; top: number } } = {};

  // Prevent default text selection behavior
  private mouseMoveListener = (ev: MouseEvent) => {
    if (window.getSelection) {
      window.getSelection()?.removeAllRanges();
    }
    ev.preventDefault();
  };

  get selectedDateStr(): string {
    if (!this.selectedDate) return '';
    return (
      this.selectedDate.getFullYear() +
      '-' +
      String(this.selectedDate.getMonth() + 1).padStart(2, '0') +
      '-' +
      String(this.selectedDate.getDate()).padStart(2, '0')
    );
  }

  get currentFacility(): Facility | undefined {
    return this.facilities.find(f => f._id === this.selectedFacility);
  }

  get workHoursString(): string {
    const facility = this.currentFacility;
    if (facility) {
      return `${facility.openingHour} - ${facility.closingHour}`;
    }
    return `${this.workStartHour}:00 - ${this.workEndHour}:00`;
  }

  constructor(
    private cd: ChangeDetectorRef,
    private appointmentsService: AppointmentsService,
    private readonly servicesService: ServicesService,
    private readonly clientService: ClientsService,
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

    // Load facilities and initialize work hours
    this.appointmentsService.getFacilities().subscribe((facilities: any[]) => {
      this.facilities = facilities;
      if (facilities.length > 0) {
        this.selectedFacility = facilities[0]._id || '';
        this.facilityControl.setValue(this.selectedFacility);
        this.updateWorkHours(facilities[0]);
      }
    });

    this.servicesService
      .getAllServices(currentUser.tenant)
      .subscribe((fetchedServices) => {
        this.services = fetchedServices;

        const today = new Date();
        this.dateControl.setValue(today);
        this.onDateChange(today);
      });

    this.clientService
      .getClientsAll(currentUser.tenant)
      .subscribe((fetchedClients) => {
        this.clients = fetchedClients;
      });

    // Listen for facility changes
    this.facilityControl.valueChanges.subscribe((facilityId) => {
      if (facilityId && this.selectedDate) {
        this.selectedFacility = facilityId;
        const selectedFacility = this.facilities.find(f => f._id === facilityId);
        if (selectedFacility) {
          this.updateWorkHours(selectedFacility);
        }
        this.loadSchedule(this.selectedDate);
      }
    });
  }

  isDragging = false;
  justResized = false;
  isResizing = false;

  ngAfterViewInit(): void {
    // Initialize interact.js after view initialization
    setTimeout(() => this.initializeInteractJS(), 0);
  }

  private initializeInteractJS(): void {
    // Guard: ensure viewchildren are available
    if (!this.gridBodyRef?.nativeElement || !this.timeColumnRef?.nativeElement || !this.employeeColumnsRef?.nativeElement) {
      return;
    }
    // Clear existing interact.js instances
    interact('.appointment-block').unset();
    interact('.employee-column').unset();
    
    const gridBodyEl = this.gridBodyRef.nativeElement;
    const timeColEl = this.timeColumnRef.nativeElement;
    const employeeColumnsEl = this.employeeColumnsRef.nativeElement;
    const gridRect = gridBodyEl.getBoundingClientRect();
    const timeRect = timeColEl.getBoundingClientRect();
    const empRect = employeeColumnsEl.getBoundingClientRect();
    const dragBoundary = {
      top: gridRect.top,
      left: timeRect.right,
      bottom: gridRect.bottom,
      right: empRect.right,
    };

    interact('.appointment-block')
      .draggable({
        inertia: false,
        autoScroll: false,
        modifiers: [
          interact.modifiers.restrictRect({
            restriction: employeeColumnsEl,
            endOnly: false,
            elementRect: { top: 0, left: 0, bottom: 1, right: 1 }
          }),
        ],
        listeners: {
          start: (event) => {
            this.isDragging = true;
            this.cd.detectChanges();
            const target = event.target as HTMLElement;
            target.setAttribute('data-dragging', 'true');
            target.style.zIndex = '1000';
            const apId = target.getAttribute('data-appointment-id') || '';
            const rect = target.getBoundingClientRect();
            this.dragOffset[apId] = {
              x: event.clientX - rect.left,
              y: event.clientY - rect.top,
            };
            target.setAttribute('data-x', '0');
            target.setAttribute('data-y', '0');
            document.addEventListener('mousemove', this.mouseMoveListener, { passive: false });
          },
          move: (event) => {
            const target = event.target as HTMLElement;
            const apId = target.getAttribute('data-appointment-id') || '';
            const offset = this.dragOffset[apId];
            if (!offset) return;
            // Accumulate dx/dy and apply transform, restriction handled by restrictRect
            const dx = event.dx;
            const dy = event.dy;
            const x0 = parseFloat(target.getAttribute('data-x') || '0');
            const y0 = parseFloat(target.getAttribute('data-y') || '0');
            const x = x0 + dx;
            const y = y0 + dy;
            target.style.transform = `translate(${x}px, ${y}px)`;
            target.setAttribute('data-x', x.toString());
            target.setAttribute('data-y', y.toString());
            this.cd.detectChanges();
          },
          end: (event) => {
            const target = event.target as HTMLElement;
            target.style.transition = 'transform 0.1s ease, left 0.2s, width 0.2s';
            target.style.transform = 'none';
            target.style.zIndex = '3';
            document.removeEventListener('mousemove', this.mouseMoveListener);
            void target.offsetWidth;
            setTimeout(() => {
              target.removeAttribute('data-dragging');
              this.isDragging = false;
              this.cd.detectChanges();
            }, 0);
          },
        },
      })
      .resizable({
        edges: { bottom: '.resize-handle' },
        modifiers: [
          interact.modifiers.restrictEdges({
            outer: gridBodyEl, // Use grid body as restriction
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
            const employee = this.employees.find((e) => e === ap.employee);
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
              const employee = this.employees.find((e) => e === ap.employee);
              if (
                !employee ||
                !employee.workingShift ||
                ap.startHour < employee.workingShift.startHour ||
                ap.endHour > employee.workingShift.endHour
              ) {
                ap.endHour = Math.min(
                  Math.max(
                    ap.endHour,
                    (employee?.workingShift?.startHour ?? 8) + 0.5
                  ),
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

              this.appointmentsService
                .updateAppointment(ap.id!, {
                  ...ap,
                  date: this.selectedDateStr,
                })
                .subscribe({
                  next: () =>
                    this.snackBar.open('Termin sačuvan!', 'Zatvori', {
                      duration: 2000,
                    }),
                  error: () =>
                    this.snackBar.open(
                      'Greška pri čuvanju termina!',
                      'Zatvori',
                      { duration: 2000 }
                    ),
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
      overlap: 0.3, // Reduce overlap for more precise drop
      ondrop: (event) => {
        const empEl = event.target as HTMLElement;
        const employeeId = empEl.getAttribute('data-employee-id') || '';
        const employee = this.employees.find((e) => e._id === employeeId);
        const appointmentEl = event.relatedTarget as HTMLElement;
        const apId = appointmentEl.getAttribute('data-appointment-id') || '';
        const ap = this.appointments.find((a) => a.id === apId);
        
        // Dodatna provera da li je drop validan
        if (!ap || !employee) {
          appointmentEl.style.transition = 'transform 0.3s ease';
          appointmentEl.style.transform = 'none';
          return;
        }

        // Check if employee column is valid for drop
        if (this.isColumnDisabled(employee)) {
          appointmentEl.style.transition = 'transform 0.3s ease';
          appointmentEl.style.transform = 'none';
          this.snackBar.open(
            'Nije moguće postaviti uslugu jer zaposleni ne radi',
            'Zatvori',
            { duration: 3000 }
          );
          return;
        }

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
        const pointerX = event.dragEvent.clientX;
        const offsetY = this.dragOffset[apId]?.y || 0;
        let localY = pointerY - colRect.top - offsetY;
        
        // Ensure localY is within boundaries
        localY = Math.max(0, Math.min(localY, this.gridBodyHeight));
        
        // Check if drop is exactly in this column
        const localX = pointerX - colRect.left;
        if (localX < 0 || localX > colRect.width) {
          // Drop is not in this column, return appointment to place
          appointmentEl.style.transition = 'transform 0.3s ease';
          appointmentEl.style.transform = 'none';
          return;
        }
        
        const minutesFromTop = (localY / this.gridBodyHeight) * this.totalMinutes;
        let newStartHour = 8 + (Math.round(minutesFromTop / 5) * 5) / 60;
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

        const dto: UpdateAndCreateAppointmentDto = {
          employee: employeeId,
          client: ap.client._id!,
          service: ap.service._id!,
          facility: ap.facility._id!,
          tenant: ap.tenant._id!,
          date: this.selectedDateStr,
          startHour: newStartHour,
          endHour: newEndHour,
        };

        ap.startHour = newStartHour;
        ap.endHour = newEndHour;
        ap.employee = employee;
        appointmentEl.style.transform = 'none';
        appointmentEl.style.zIndex = '1';
        
        // Ensure boundaries are properly calculated after drop
        setTimeout(() => {
          this.cd.detectChanges();
        }, 0);

        this.appointmentsService.updateAppointment(ap.id!, dto).subscribe({
          next: () =>
            this.snackBar.open('Termin sačuvan!', 'Zatvori', {
              duration: 2000,
            }),
          error: () =>
            this.snackBar.open('Greška pri čuvanju termina!', 'Zatvori', {
              duration: 2000,
            }),
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
    // Snap to 15 minutes
    const snappedMinutes = Math.round(minutesFromTop / 15) * 15;
    const appointmentStart = 8 + snappedMinutes / 60;

    // Allow click only if slot is within working hours
    if (!this.isSlotAvailable(emp, appointmentStart)) return;

    const dialogData: AppointmentDialogData = {
      employee: emp._id!,
      appointmentStart,
      services: this.services,
      clients: this.clients,
      facilities: this.facilities,
      facility: this.selectedFacility, // Add currently selected facility
    };

    const dialogRef = this.dialog.open(AppointmentDialogComponent, {
      data: dialogData,
      panelClass: 'custom-appointment-dialog',
      backdropClass: 'custom-backdrop',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        const newAp: UpdateAndCreateAppointmentDto = {
          employee: emp._id!,
          startHour: result.startHour,
          endHour: result.startHour + 1,
          service: result.service,
          client: result.client,
          facility: result.facility || this.selectedFacility,
          tenant: this.authService.getCurrentUser()!.tenant,
          date: this.selectedDateStr,
        };

        this.appointmentsService.createAppointment(newAp).subscribe({
          next: (created: any) => {
            this.appointments.push({
              ...newAp,
              ...created,
              id: created._id || created.id,
            });
            this.cd.detectChanges();
            this.snackBar.open('Termin sačuvan!', 'Zatvori', {
              duration: 2000,
            });
          },
          error: () =>
            this.snackBar.open('Greška pri čuvanju termina!', 'Zatvori', {
              duration: 2000,
            }),
        });
      }
    });
  }

  onAppointmentClick(ap: Appointment, event: MouseEvent): void {
    if (this.isDragging || this.justResized) return;
    const target = event.currentTarget as HTMLElement;
    if (target.getAttribute('data-dragging') === 'true') return;

    const dialogData: AppointmentDialogData = {
      employee: ap.employee._id!,
      appointmentStart: ap.startHour,
      appointmentEnd: ap.endHour,
      service: ap.service._id,
      clients: this.clients,
      client: ap.client._id,
      services: this.services,
      facilities: this.facilities,
      facility: ap.facility._id, // Use facility from existing appointment
    };

    const dialogRef = this.dialog.open(AppointmentDialogComponent, {
      data: dialogData,
      panelClass: 'custom-appointment-dialog',
      backdropClass: 'custom-backdrop',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result?.delete) {
        this.appointmentsService.deleteAppointment(ap.id!).subscribe({
          next: () => {
            this.appointments = this.appointments.filter((a) => a.id !== ap.id);
            this.snackBar.open('Termin obrisan!', 'Zatvori', {
              duration: 2000,
            });
            this.cd.detectChanges();
          },
          error: () =>
            this.snackBar.open('Greška pri brisanju termina!', 'Zatvori', {
              duration: 2000,
            }),
        });
      } else if (result) {
        const dto: UpdateAndCreateAppointmentDto = {
          employee: ap.employee._id!,
          client: result.client,
          tenant: ap.tenant._id,
          facility: result.facility || ap.facility._id,
          service: result.service,
          startHour: result.startHour,
          endHour: result.endHour,
          date: this.selectedDateStr,
        };

        this.cd.detectChanges();

        this.appointmentsService.updateAppointment(ap.id!, dto).subscribe({
          next: () => {
            this.loadSchedule(this.selectedDate!);
            this.snackBar.open('Termin izmenjen!', 'Zatvori', {
              duration: 2000,
            });
          },
          error: () =>
            this.snackBar.open('Greška pri izmeni termina!', 'Zatvori', {
              duration: 2000,
            }),
        });
      }
    });
  }

  // --- NEW OVERLAP LOGIC ---

  // Returns all appointments that overlap with the given one (including itself)
  getOverlappingAppointments(
    ap: Appointment,
    employeeId: string
  ): Appointment[] {
    return this.appointments.filter(
      (a) =>
        // Only consider overlaps within the same employee column
        (a.employee._id === employeeId) &&
        a.date === ap.date &&
        a.startHour < ap.endHour &&
        a.endHour > ap.startHour
    );
  }

  // Returns stable index of appointment in overlap group (sorted only by id)
  getAppointmentOverlapIndex(ap: Appointment, employeeId: string): number {
    const overlapping = this.getOverlappingAppointments(ap, employeeId)
      .map((a) => a.id)
      .sort(); // Stable by id
    return overlapping.indexOf(ap.id);
  }

  // Returns number of overlapped appointments in that group
  getAppointmentOverlapCount(ap: Appointment, employeeId: string): number {
    return this.getOverlappingAppointments(ap, employeeId).length;
  }

  trackByAppointmentId(index: number, ap: Appointment) {
    return ap.id;
  }

  getAppointmentsForEmployee(employeeId: string): Appointment[] {
    return this.appointments.filter((a) => a.employee._id === employeeId);
  }

  loadSchedule(date: Date): void {
    this.loading = true;
    this.appointmentsService.getScheduleSimple(date, this.selectedFacility).subscribe({
      next: (data) => {
        console.log('LOAD SCHEDULE : ', data);
        this.employees = data.employees;
        this.appointments = data.appointments;
        this.loading = false;
        this.cd.detectChanges();
        // Reinitialize interact.js after rendering appointments
        setTimeout(() => this.initializeInteractJS(), 0);
      },
      error: (err) => {
        this.loading = false;
        console.error('Schedule loading error:', err);
      },
    });
  }

  onDateChange(dateValue: any): void {
    if (dateValue) {
      // If dateValue is Moment object, convert to Date
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

  setToday(): void {
    const today = new Date();

    this.dateControl.setValue(today);

    this.onDateChange(today);
  }

  shiftDate(deltaDays: number): void {
    let current = this.dateControl.value;
    if (!current) return;

    // If current is Moment object, convert to native Date
    if (moment.isMoment(current)) {
      current = current.toDate();
    }

    // Current is now guaranteed to be Date
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
    // Position relative to dynamic working hours
    return ((startHour - this.workStartHour) / (this.workEndHour - this.workStartHour)) * 100;
  }

  calculateHeight(startHour: number, endHour: number): number {
    // Height relative to dynamic working hours duration
    return ((endHour - startHour) / (this.workEndHour - this.workStartHour)) * 100;
  }

  isColumnDisabled(emp: Employee): boolean {
    // Column is disabled if there's no workingShift for that day
    return !emp.workingShift;
  }

  // Check if slot is within employee working hours
  isSlotAvailable(emp: Employee, slotHour: number): boolean {
    if (!emp.workingShift) return false;
    return (
      slotHour >= emp.workingShift.startHour &&
      slotHour < emp.workingShift.endHour
    );
  }

  isSlotCovered(emp: Employee, t: number): boolean {
    const appointments = this.getAppointmentsForEmployee(emp._id || '');
    return appointments.some((ap) => t >= ap.startHour && t < ap.endHour);
  }

  updateWorkHours(facility: Facility): void {
    try {
      this.workStartHour = FacilityUtils.getOpeningHourAsNumber(facility);
      this.workEndHour = FacilityUtils.getClosingHourAsNumber(facility);
      console.log(`Updated work hours for facility ${facility.name}: ${this.workStartHour} - ${this.workEndHour}`);
    } catch (error) {
      console.error('Error updating work hours:', error);
      this.workStartHour = 8;
      this.workEndHour = 22;
    }
  }
}
