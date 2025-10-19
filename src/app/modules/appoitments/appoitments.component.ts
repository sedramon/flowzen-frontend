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
import { CashSession, CloseSessionRequest } from '../../models/CashSession';
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
} from './dialog/appointment-dialog/appointment-dialog.component';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/services/auth.service';
import { Service } from '../../models/Service';
import { Employee } from '../../models/Employee';
import { Facility } from '../../models/Facility';
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
import { BulkAppointmentsDialogComponent } from './dialog/bulk-appointments-dialog/bulk-appointments-dialog.component';
import { PosCheckoutComponent } from '../pos/components/sales/pos-checkout/pos-checkout.component';
import { PosService } from '../pos/services/pos.service';
import { firstValueFrom } from 'rxjs';

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
    MatSelectModule,
    PosCheckoutComponent
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
  // ===== VIEW CHILD REFERENCES =====
  // Angular ViewChild references for DOM elements
  @ViewChild('timeColumn', { static: false }) timeColumnRef!: ElementRef;
  @ViewChild('employeeColumns', { static: false })
  employeeColumnsRef!: ElementRef;
  @ViewChild('gridBody', { static: false })
  gridBodyRef!: ElementRef<HTMLElement>;
  @ViewChild('firstEmployeeColumn', { static: false })
  firstEmployeeColumnRef!: ElementRef;

  // ===== FORM CONTROLS =====
  // Angular form controls
  dateControl = new FormControl<Date | null>(null);
  facilityControl = new FormControl<string>('');
  selectedDate: Date | null = null;
  selectedFacility: string = '';
  // Kontrola prikaza rasporeda u DOM-u
  // ===== UI PROPERTIES =====
  // UI state and animation properties
  animateSchedule: boolean = false;
  toolbarState: 'centered' | 'spaced' = 'centered';
  loading = true;

  // ===== WORKING HOURS =====
  // Default working hours (8:00-22:00)
  workStartHour = 8;
  workEndHour = 22;

  // ===== TIME SLOTS CALCULATION =====
  // Generate time slots based on working hours (supports overnight shifts) in 15-minute intervals
  get timeSlots(): number[] {
    const slots: number[] = [];
    
    if (this.workStartHour > this.workEndHour) {
      // Overnight shifts (e.g., 22:00-08:00)
      for (let t = this.workStartHour; t < 24; t += 0.25) {
        slots.push(Number(t.toFixed(2)));
      }
      for (let t = 0; t <= this.workEndHour; t += 0.25) {
        slots.push(Number(t.toFixed(2)));
      }
    } else {
      // Normal working hours (e.g., 8:00-22:00)
      for (let t = this.workStartHour; t <= this.workEndHour; t += 0.25) {
        slots.push(Number(t.toFixed(2)));
      }
    }
    
    return slots;
  }

  // Get total number of time slots
  get slotCount(): number {
    return this.timeSlots.length;
  }

  // ===== DATA PROPERTIES =====
  // Component data arrays
  employees: Employee[] = [];
  appointments: Appointment[] = [];
  services: Service[] = [];
  clients: Client[] = [];
  facilities: Facility[] = [];

  // ===== TOTAL MINUTES CALCULATION =====
  // Calculate total working minutes (supports overnight shifts)
  get totalMinutes(): number {
    if (this.workStartHour > this.workEndHour) {
      // Overnight shifts: from start to midnight + from midnight to end
      const firstPart = (24 - this.workStartHour) * 60;
      const secondPart = this.workEndHour * 60;
      return firstPart + secondPart;
    } else {
      // Normal working hours
      return (this.workEndHour - this.workStartHour) * 60;
    }
  }

  // ===== GRID HEIGHT CALCULATION =====
  // Calculate grid height based on working hours (supports overnight shifts)
  get gridBodyHeight(): number {
    const baseHeight = 1300;
    const baseHours = 14;
    
    let currentHours: number;
    if (this.workStartHour > this.workEndHour) {
      // Overnight shifts: from start to midnight + from midnight to end
      currentHours = (24 - this.workStartHour) + this.workEndHour;
    } else {
      // Normal working hours
      currentHours = this.workEndHour - this.workStartHour;
    }
    
    return Math.round((baseHeight / baseHours) * currentHours);
  }

  // get timeCellLineHeight(): number {
  //   // 20px za 57 slotova, proporcionalno
  //   return Math.round((20 / 57) * this.slotCount);
  // }

  // ===== DRAG & DROP PROPERTIES =====
  // Store offsets during drag operations
  private dragOffset: { [id: string]: { x: number; y: number } } = {};
  private initialObserver: MutationObserver | null = null;
  private interactReady = false;

  // ===== EVENT HANDLERS =====
  // Prevent default text selection behavior during drag operations
  private mouseMoveListener = (ev: MouseEvent) => {
    if (window.getSelection) {
      window.getSelection()?.removeAllRanges();
    }
    ev.preventDefault();
  };

  // ===== GETTERS =====
  // Format selected date as string (YYYY-MM-DD)
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

  // Get current facility object
  get currentFacility(): Facility | undefined {
    return this.facilities.find(f => f._id === this.selectedFacility);
  }

  // Get formatted work hours string
  get workHoursString(): string {
    const facility = this.currentFacility;
    if (facility) {
      return `${facility.openingHour} - ${facility.closingHour}`;
    }
    return `${this.workStartHour}:00 - ${this.workEndHour}:00`;
  }

  // ===== CONSTRUCTOR =====
  // Dependency injection
  constructor(
    private cd: ChangeDetectorRef,
    private appointmentsService: AppointmentsService,
    private readonly servicesService: ServicesService,
    private readonly clientService: ClientsService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private authService: AuthService,
    private ngZone: NgZone,
    private posService: PosService
  ) {}

  // ===== COMPONENT INITIALIZATION =====
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
        this.cd.detectChanges();
      }
    });

    this.servicesService
      .getAllServices(currentUser.tenant!)
      .subscribe((fetchedServices) => {
        this.services = fetchedServices;

        const today = new Date();
        this.dateControl.setValue(today);
        this.onDateChange(today);
      });

    this.clientService
      .getClientsAll(currentUser.tenant!)
      .subscribe((fetchedClients) => {
        this.clients = fetchedClients;
      });

    // Listen for facility changes and update work hours
    this.facilityControl.valueChanges.subscribe((facility) => {
      if (facility) {
        this.selectedFacility = facility;
        const selectedFacility = this.facilities.find(f => f._id === facility);
        if (selectedFacility) {
          this.updateWorkHours(selectedFacility);
        }
        this.cd.detectChanges();
        
        // Učitaj raspored samo ako je datum izabran
        if (this.selectedDate) {
          this.loadSchedule(this.selectedDate);
        }
      }
    });
  }

  // ===== STATE PROPERTIES =====
  // Component state flags
  isDragging = false;
  justResized = false;
  isResizing = false;

  // ===== LIFECYCLE HOOKS =====
  // Initialize interact.js after view initialization
  ngAfterViewInit(): void {
    // initialize once after first render
    setTimeout(() => this.ensureInitialInteract(), 0);
  }

  // ===== INTERACT.JS INITIALIZATION =====
  private ensureInitialInteract(): void {
    if (this.interactReady) return;
    const host = this.employeeColumnsRef?.nativeElement as HTMLElement | undefined;
    if (!host) return;

    const checkAndInit = (): boolean => {
      const hasBlock = host.querySelector('.appointment-block');
      const hasHandle = host.querySelector('.resize-handle');
      if (hasBlock && hasHandle) {
        this.initializeInteractJS();
        this.interactReady = true;
        if (this.initialObserver) {
          this.initialObserver.disconnect();
          this.initialObserver = null;
        }
        return true;
      }
      return false;
    };

    if (checkAndInit()) return;

    if (this.initialObserver) this.initialObserver.disconnect();
    this.initialObserver = new MutationObserver(() => {
      checkAndInit();
    });
    this.initialObserver.observe(host, { childList: true, subtree: true });
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
        ignoreFrom: '.resize-handle',
        modifiers: [
          interact.modifiers.restrictRect({
            restriction: employeeColumnsEl,
            endOnly: false,
            elementRect: { top: 0, left: 0, bottom: 1, right: 1 }
          }),
        ],
        listeners: {
          start: (event) => {
            if (this.isResizing) { event.interaction.stop(); return; }
            const target = event.target as HTMLElement;
            const apId = target.getAttribute('data-appointment-id') || '';
            const appointment = this.appointments.find(ap => ap.id === apId);
            if (appointment && ((appointment as any).paid || (appointment as any).sale?.fiscal?.status === 'success')) {
              event.interaction.stop();
              return;
            }
            this.isDragging = true;
            this.cd.detectChanges();
            target.setAttribute('data-dragging', 'true');
            target.style.zIndex = '1000';
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
            if (this.isResizing) { event.interaction.stop(); return; }
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
            if (this.isResizing) { return; }
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
      });

    // ===== DROPZONE CONFIGURATION =====
    // Configure drop zones for appointment blocks with validation
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
        
        // Calculate new appointment time based on drop position (supports overnight shifts)
        const minutesFromTop = (localY / this.gridBodyHeight) * this.totalMinutes;
        let newStartHour = this.workStartHour + (Math.round(minutesFromTop / 5) * 5) / 60;
        const duration = ap.endHour - ap.startHour;
        let newEndHour = newStartHour + duration;

        // Validate appointment time against employee working hours
        let isValidTime = false;
        if (employee.workingShift.startHour > employee.workingShift.endHour) {
          // Overnight shifts: appointment must be >= startHour OR < endHour
          isValidTime = (newStartHour >= employee.workingShift.startHour || newStartHour < employee.workingShift.endHour) &&
                       (newEndHour >= employee.workingShift.startHour || newEndHour < employee.workingShift.endHour);
        } else {
          // Normal working hours
          isValidTime = newStartHour >= employee.workingShift.startHour && newEndHour <= employee.workingShift.endHour;
        }
        
        if (!isValidTime) {
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
          error: (error) => {
            const errorMessage = error.error?.message || 'Greška pri čuvanju termina!';
            this.snackBar.open(errorMessage, 'Zatvori', {
              duration: 4000,
            });
          },
        });
      },
    });
  }

  // ===== CLICK HANDLER =====
  // Handle clicks on empty time slots to create new appointments (supports overnight shifts)
  onEmptyColumnClick(emp: Employee, event: MouseEvent): void {
    if (this.isDragging) return;
    if (!emp.workingShift) return;

    const empColRect = (
      event.currentTarget as HTMLElement
    ).getBoundingClientRect();
    const localY = event.clientY - empColRect.top;
    
    // Calculate appointment start time based on mouse position (supports overnight shifts)
    let appointmentStart: number;
    
    if (this.workStartHour > this.workEndHour) {
      // Overnight shifts: calculate position relative to total working hours
      const totalWorkingHours = (24 - this.workStartHour) + this.workEndHour;
      const minutesFromTop = (localY / this.gridBodyHeight) * (totalWorkingHours * 60);
      const snappedMinutes = Math.round(minutesFromTop / 15) * 15;
      
      if (snappedMinutes < (24 - this.workStartHour) * 60) {
        // First part: after start hour
        appointmentStart = this.workStartHour + snappedMinutes / 60;
      } else {
        // Second part: before end hour
        const secondPartMinutes = snappedMinutes - (24 - this.workStartHour) * 60;
        appointmentStart = secondPartMinutes / 60;
      }
    } else {
      // Normal working hours
      const minutesFromTop = (localY / this.gridBodyHeight) * this.totalMinutes;
      const snappedMinutes = Math.round(minutesFromTop / 15) * 15;
      appointmentStart = this.workStartHour + snappedMinutes / 60;
    }
    


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
          endHour: result.endHour,
          service: result.service,
          client: result.client,
          facility: result.facility || this.selectedFacility,
          tenant: this.authService.getCurrentUser()!.tenant!,
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
          error: (error) => {
            const errorMessage = error.error?.message || 'Greška pri čuvanju termina!';
            this.snackBar.open(errorMessage, 'Zatvori', {
              duration: 4000,
            });
          },
        });
      }
    });
  }

  // ===== APPOINTMENT INTERACTION =====
  // Handle clicks on existing appointments to edit/delete with proper guards
  onAppointmentClick(ap: Appointment, event: MouseEvent): void {
    if (this.isDragging || this.justResized || this.isResizing) return;
    const target = event.currentTarget as HTMLElement;
    if (target.getAttribute('data-dragging') === 'true') return;
    
    // Ako je naplaćen, otvori preview dialog
    if ((ap as any).paid || (ap as any).sale?.fiscal?.status === 'success') {
      this.openAppointmentPreview(ap);
      return;
    }

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
          error: (error) => {
            const errorMessage = error.error?.message || 'Greška pri izmeni termina!';
            this.snackBar.open(errorMessage, 'Zatvori', {
              duration: 4000,
            });
          },
        });
      }
    });
  }

  // ===== OVERLAP LOGIC =====
  // Returns all appointments that overlap with the given one (including itself) for UI layout
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

  // Returns stable index of appointment in overlap group (sorted by id) for UI positioning
  getAppointmentOverlapIndex(ap: Appointment, employeeId: string): number {
    const overlapping = this.getOverlappingAppointments(ap, employeeId)
      .map((a) => a.id)
      .sort(); // Stable by id
    return overlapping.indexOf(ap.id);
  }

  // Returns number of overlapped appointments in that group for UI width calculation
  getAppointmentOverlapCount(ap: Appointment, employeeId: string): number {
    return this.getOverlappingAppointments(ap, employeeId).length;
  }

  // Track appointment by ID for ngFor optimization and performance
  trackByAppointmentId(index: number, ap: Appointment) {
    return ap.id;
  }

  // Get all appointments for a specific employee for UI rendering
  getAppointmentsForEmployee(employeeId: string): Appointment[] {
    return this.appointments.filter((a) => a.employee._id === employeeId);
  }

  // ===== SCHEDULE LOADING =====
  // Load schedule data, update work hours, and force change detection
  loadSchedule(date: Date): void {
    // Proveri da li je selectedFacility postavljen
    if (!this.selectedFacility) {
      console.warn('No facility selected, skipping schedule load');
      this.loading = false;
      return;
    }

    this.loading = true;
    this.appointmentsService.getScheduleSimple(date, this.selectedFacility).subscribe({
      next: (data) => {
        this.employees = data.employees;
        this.appointments = data.appointments;
        
        const currentFacility = this.facilities.find(f => f._id === this.selectedFacility);
        if (currentFacility) {
          this.updateWorkHours(currentFacility);
        }
        
        this.loading = false;
        // Only force change detection; interact init will happen once elements appear
        this.cd.detectChanges();
        this.interactReady = false;
        setTimeout(() => this.ensureInitialInteract(), 0);
      },
      error: (err) => {
        this.loading = false;
        console.error('Schedule loading error:', err);
      },
    });
  }

  // ===== DATE NAVIGATION =====
  // Handle date changes, reset state, and load schedule
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

  // Set date to today and load schedule
  setToday(): void {
    const today = new Date();
    this.dateControl.setValue(today);
    this.onDateChange(today);
  }

  // Shift date by specified number of days and load schedule
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

  openBulkAppointments(): void {
    if (!this.selectedDate || !this.selectedFacility) {
      this.snackBar.open('Izaberi datum i objekat', 'Zatvori', { duration: 2000 });
      return;
    }
    const dialogRef = this.dialog.open(BulkAppointmentsDialogComponent, {
      width: '1000px',
      maxWidth: '95vw',
      panelClass: 'bulk-appointments-wide',
      data: {
        employees: this.employees,
        clients: this.clients,
        services: this.services,
        facilityId: this.selectedFacility,
        date: this.selectedDateStr,
        existingAppointments: this.appointments
      }
    });

    dialogRef.afterClosed().subscribe((res) => {
      if (res?.created?.length) {
        // Refresh schedule to reflect new items
        this.loadSchedule(this.selectedDate!);
        this.snackBar.open(`Kreirano ${res.created.length} termina`, 'Zatvori', { duration: 3000 });
      }
    });
  }

  /**
   * Pokreće proces naplate termina iz rasporeda:
   * 1. Priprema podatke
   * 2. Proverava da li postoji otvorena blagajnička sesija
   * 3. Ako ne postoji, automatski otvara sesiju
   * 4. Otvara POS checkout dijalog
   * 5. Obradjuje rezultat naplate
   * 6. Loguje i prikazuje greške
   */
  async onPayAppointment(ap: any, event: MouseEvent) {
    event.stopPropagation();

    // Ako je već naplaćen, otvori preview dialog umesto checkout-a
    if (ap.paid || ap.sale?.fiscal?.status === 'success') {
      this.openAppointmentPreview(ap);
      return;
    }

    // 1. Priprema podataka
    const currentUser = this.authService.getCurrentUser();
    const facilityId = ap.facility?._id || ap.facility;
    if (!currentUser || !facilityId) {
      this.snackBar.open('Nedostaju podaci o korisniku ili objektu.', 'Zatvori', { duration: 2000 });
      return;
    }

    try {
      // 2. Provera otvorene sesije
      const getSessionsPayload = {
        status: 'open',
        facility: facilityId,
        employee: currentUser.userId!
      };
      console.log('[POS] getSessions payload:', getSessionsPayload);
      const sessions = await firstValueFrom(this.posService.getSessions(getSessionsPayload));
      console.log('[POS] getSessions result:', sessions);
      let session: CashSession | null = sessions && sessions.length ? sessions[0] : null;

      // 3. Automatsko otvaranje sesije ako ne postoji
      if (!session) {
        const openSessionPayload = {
          facility: facilityId,
          openingFloat: 0 // Nema početnog float-a za naplatu appointmenta
        };
        console.log('[POS] openSession payload:', openSessionPayload);
        const sessionResult = await firstValueFrom(this.posService.openSession(openSessionPayload));
        // Get the full session data after opening
        session = await firstValueFrom(this.posService.getSession(sessionResult.id));
        console.log('[POS] openSession result:', session);
        this.snackBar.open('Blagajnička sesija je automatski otvorena.', 'Zatvori', { duration: 2000 });
      }

      // 4. Otvaranje POS checkout dijaloga
      const dialogData = {
        appointment: ap,
        client: ap.client,
        facility: ap.facility,
        total: ap.service?.price || 0,
        articles: [],
        tenant: currentUser.tenant,
        session
      };
      const dialogRef = this.dialog.open(PosCheckoutComponent, {
        data: dialogData,
        panelClass: 'custom-appointment-dialog',
        backdropClass: 'custom-backdrop',
      });

      // 5. Obrada rezultata naplate - sesija se uvek zatvaranja
      dialogRef.afterClosed().subscribe((res) => {
        if (res && res.id) {
          // Uspešna naplata - sesija se automatski zatvaranja u backend-u
          ap.paid = true;
          ap.sale = res.id;
          this.snackBar.open('Termin uspešno naplaćen i sesija zatvorena!', 'Zatvori', { duration: 3000 });
          this.cd.detectChanges();
        } else if (session && (session as any)._id) {
          // Dijalog zatvoren bez naplate (ESC, klik pored, Cancel) - zatvori sesiju
          const sessionId = (session as any)._id;
          const closeData = {
            closingCount: 0,
            note: 'Session closed after dialog cancellation'
          };
          this.posService.closeSession(sessionId, closeData).subscribe({
            next: () => {
              this.snackBar.open('Sesija zatvorena', 'Zatvori', { duration: 2000 });
            },
            error: (err) => {
              console.error('[POS] Error closing session:', err);
              this.snackBar.open('Greška pri zatvaranju sesije', 'Zatvori', { duration: 2000 });
            }
          });
        }
      });
    } catch (err: any) {
      // 6. Error handling
      console.error('[POS] Error in onPayAppointment:', err);
      this.snackBar.open(err?.error?.message || 'Greška pri otvaranju blagajničke sesije.', 'Zatvori', { duration: 3000 });
    }
  }

  // ===== APPOINTMENT PREVIEW =====
  // Otvori preview dialog za naplaćene termine
  openAppointmentPreview(ap: any) {
    const status = ap.sale?.fiscal?.status === 'success' ? 'Fiskalizovano' : 'Naplaćeno';
    
    const dialogData = {
      appointment: ap,
      status: status,
      isPaid: true,
      readonly: true,
      // Dodaj potrebne podatke za dialog
      services: this.services,
      clients: this.clients,
      facilities: this.facilities,
      employee: ap.employee?._id || ap.employee,
      facility: ap.facility?._id || ap.facility,
      service: ap.service?._id || ap.service,
      client: ap.client?._id || ap.client,
      appointmentStart: ap.startHour,
      appointmentEnd: ap.endHour
    };

    const dialogRef = this.dialog.open(AppointmentDialogComponent, {
      data: dialogData,
      panelClass: 'custom-appointment-dialog',
      backdropClass: 'custom-backdrop',
    });

    dialogRef.afterClosed().subscribe(() => {
      // Preview dialog se samo zatvara, nema akcija
    });
  }

  // ===== UTILITY FUNCTIONS =====
  // Format time for display (e.g., 17.5 -> "17:30") with proper padding
  formatTime(time: number): string {
    const h = Math.floor(time);
    const m = Math.round((time - h) * 60);
    return `${h}:${m < 10 ? '0' + m : m}`;
  }

  // ===== POSITION CALCULATIONS =====
  // Calculate top position for appointment blocks (supports overnight shifts) in percentage
  calculateTop(startHour: number): number {
    let totalWorkingHours: number;
    let relativeStartHour: number;
    
    if (this.workStartHour > this.workEndHour) {
      // Overnight shifts
      totalWorkingHours = (24 - this.workStartHour) + this.workEndHour;
      
      if (startHour >= this.workStartHour) {
        // First part: after start hour
        relativeStartHour = startHour - this.workStartHour;
      } else {
        // Second part: before end hour
        relativeStartHour = (24 - this.workStartHour) + startHour;
      }
    } else {
      // Normal working hours
      totalWorkingHours = this.workEndHour - this.workStartHour;
      relativeStartHour = startHour - this.workStartHour;
    }
    
    return (relativeStartHour / totalWorkingHours) * 100;
  }

  // Calculate height for appointment blocks (supports overnight shifts) in percentage
  calculateHeight(startHour: number, endHour: number): number {
    let totalWorkingHours: number;
    
    if (this.workStartHour > this.workEndHour) {
      // Overnight shifts
      totalWorkingHours = (24 - this.workStartHour) + this.workEndHour;
    } else {
      // Normal working hours
      totalWorkingHours = this.workEndHour - this.workStartHour;
    }
    
    return ((endHour - startHour) / totalWorkingHours) * 100;
  }

  // ===== OVERLAY CALCULATIONS =====
  // Calculate top position for overlay elements (supports overnight shifts) in percentage
  calculateOverlayTop(hour: number): number {
    let totalWorkingHours: number;
    let relativeHour: number;
    
    if (this.workStartHour > this.workEndHour) {
      // Overnight shifts
      totalWorkingHours = (24 - this.workStartHour) + this.workEndHour;
      
      if (hour >= this.workStartHour) {
        // First part: after start hour
        relativeHour = hour - this.workStartHour;
      } else {
        // Second part: before end hour
        relativeHour = (24 - this.workStartHour) + hour;
      }
    } else {
      // Normal working hours
      totalWorkingHours = this.workEndHour - this.workStartHour;
      relativeHour = hour - this.workStartHour;
    }
    
    return (relativeHour / totalWorkingHours) * 100;
  }

  // Calculate height for overlay elements (supports overnight shifts) in percentage
  calculateOverlayHeight(startHour: number, endHour: number): number {
    let totalWorkingHours: number;
    
    if (this.workStartHour > this.workEndHour) {
      // Overnight shifts
      totalWorkingHours = (24 - this.workStartHour) + this.workEndHour;
    } else {
      // Normal working hours
      totalWorkingHours = this.workEndHour - this.workStartHour;
    }
    
    return ((endHour - startHour) / totalWorkingHours) * 100;
  }

  // ===== VALIDATION METHODS =====
  // Check if employee column is disabled (no working shift)
  isColumnDisabled(emp: Employee): boolean {
    return !emp.workingShift;
  }

  // Check if slot is within employee working hours (supports overnight shifts)
  isSlotAvailable(emp: Employee, slotHour: number): boolean {
    if (!emp.workingShift) return false;
    
    const startHour = emp.workingShift.startHour;
    const endHour = emp.workingShift.endHour;
    
    if (startHour > endHour) {
      // Overnight shifts: slot must be >= startHour OR < endHour
      return slotHour >= startHour || slotHour < endHour;
    } else {
      // Normal working hours
      return slotHour >= startHour && slotHour < endHour;
    }
  }

  // Check if slot is covered by existing appointments (supports overnight shifts)
  isSlotCovered(emp: Employee, t: number): boolean {
    const appointments = this.getAppointmentsForEmployee(emp._id || '');
    return appointments.some((ap) => {
      const startHour = ap.startHour;
      const endHour = ap.endHour;
      
      if (startHour > endHour) {
        // Overnight appointments: slot must be >= startHour OR < endHour
        return t >= startHour || t < endHour;
      } else {
        // Normal appointments
        return t >= startHour && t < endHour;
      }
    });
  }

  // ===== WORK HOURS MANAGEMENT =====
  // Update working hours based on facility settings and force change detection
  updateWorkHours(facility: Facility): void {
    if (facility.openingHour && facility.closingHour) {
      this.workStartHour = parseFloat(facility.openingHour);
      this.workEndHour = parseFloat(facility.closingHour);
      this.cd.detectChanges(); // Force change detection
    }
  }

  private activeResize = {
    apId: '' as string,
    startY: 0 as number,
    startHeightPx: 0 as number,
    totalWorkingHours: 0 as number,
    originalEndHour: 0 as number,
    originalHeightPx: 0 as number,
    outOfBounds: false as boolean,
  };

  onResizeStart(ev: MouseEvent | TouchEvent, ap: Appointment): void {
    ev.stopPropagation();
    ev.preventDefault();
    
    if ((ap as any).paid || (ap as any).sale?.fiscal?.status === 'success') return;

    const target = (ev.currentTarget as HTMLElement)?.parentElement as HTMLElement; // appointment-block
    if (!target) return;

    const pointerY = (ev instanceof TouchEvent ? ev.touches[0].clientY : (ev as MouseEvent).clientY);
    const rect = target.getBoundingClientRect();

    const totalWorkingHours = this.workStartHour > this.workEndHour
      ? (24 - this.workStartHour) + this.workEndHour
      : this.workEndHour - this.workStartHour;

    this.activeResize = {
      apId: ap.id!,
      startY: pointerY,
      startHeightPx: rect.height,
      totalWorkingHours,
      originalEndHour: ap.endHour,
      originalHeightPx: rect.height,
      outOfBounds: false,
    };

    this.isResizing = true;

    const move = (e: MouseEvent | TouchEvent) => {
      const clientY = (e instanceof TouchEvent ? e.touches[0].clientY : (e as MouseEvent).clientY);
      const dy = clientY - this.activeResize.startY;
      const minHeight = (0.5 / this.activeResize.totalWorkingHours) * this.gridBodyHeight;
      let newHeight = Math.max(minHeight, this.activeResize.startHeightPx + dy);

      const a = this.appointments.find(x => x.id === this.activeResize.apId);
      if (!a) return;

      const step = 5 / 60;
      const employee = this.employees.find(e2 => e2._id === a.employee._id) || this.employees.find(e2 => e2 === a.employee);

      if (employee && employee.workingShift) {
        let maxEnd = employee.workingShift.endHour;
        if (employee.workingShift.startHour > employee.workingShift.endHour) {
          maxEnd = (a.startHour >= employee.workingShift.startHour) ? 24 : employee.workingShift.endHour;
        }
        const maxDuration = Math.max(0.5, maxEnd - a.startHour);
        const maxHeightPx = (maxDuration / this.activeResize.totalWorkingHours) * this.gridBodyHeight;
        newHeight = Math.min(newHeight, maxHeightPx);
      }

      target.style.height = `${newHeight}px`;

      const duration = (newHeight / this.gridBodyHeight) * this.activeResize.totalWorkingHours;
      let snapped = Math.max(0.5, Math.round(duration / step) * step);

      if (employee && employee.workingShift) {
        let maxEnd = employee.workingShift.endHour;
        if (employee.workingShift.startHour > employee.workingShift.endHour) {
          maxEnd = (a.startHour >= employee.workingShift.startHour) ? 24 : employee.workingShift.endHour;
        }
        if (a.startHour + snapped > maxEnd) {
          snapped = maxEnd - a.startHour;
        }
      }

      a.endHour = a.startHour + snapped;
      this.cd.detectChanges();
    };

    let saveTimeout: any;
    const triggerSave = () => {
      clearTimeout(saveTimeout);
      saveTimeout = setTimeout(() => {
        const a = this.appointments.find(x => x.id === this.activeResize.apId);
        if (!a) return;
        const employee = this.employees.find(e2 => e2._id === a.employee._id) || this.employees.find(e2 => e2 === a.employee);
        if (!employee || !employee.workingShift) return;

        const within = employee.workingShift.startHour > employee.workingShift.endHour
          ? ((a.startHour >= employee.workingShift.startHour || a.startHour < employee.workingShift.endHour) &&
             (a.endHour >= employee.workingShift.startHour || a.endHour < employee.workingShift.endHour))
          : (a.startHour >= employee.workingShift.startHour && a.endHour <= employee.workingShift.endHour);
        if (!within) {
          if (employee.workingShift.startHour > employee.workingShift.endHour) {
            if (a.startHour < employee.workingShift.startHour && a.startHour >= employee.workingShift.endHour) a.startHour = employee.workingShift.startHour;
            if (a.endHour > employee.workingShift.endHour && a.endHour <= employee.workingShift.startHour) a.endHour = employee.workingShift.endHour;
          } else {
            a.endHour = Math.min(Math.max(a.endHour, employee.workingShift.startHour + 0.5), employee.workingShift.endHour);
          }
          this.cd.detectChanges();
        }

        const dto: UpdateAndCreateAppointmentDto = {
          employee: a.employee._id!,
          client: a.client._id!,
          service: a.service._id!,
          facility: a.facility._id!,
          tenant: this.authService.getCurrentUser()!.tenant!,
          startHour: a.startHour,
          endHour: a.endHour,
          date: this.selectedDateStr,
        };
        this.appointmentsService.updateAppointment(a.id!, dto).subscribe({
          next: () => this.snackBar.open('Termin sačuvan!', 'Zatvori', { duration: 1200 }),
          error: (error) => {
            const errorMessage = error.error?.message || 'Greška pri čuvanju termina!';
            this.snackBar.open(errorMessage, 'Zatvori', { duration: 4000 });
          },
        });
      }, 120);
    };

    const up = () => {
      this.isResizing = false;
      window.removeEventListener('mousemove', move, { capture: true } as any);
      window.removeEventListener('mouseup', up, { capture: true } as any);
      window.removeEventListener('touchmove', move, { capture: true } as any);
      window.removeEventListener('touchend', up, { capture: true } as any);
      triggerSave();
    };

    window.addEventListener('mousemove', move, { passive: false, capture: true });
    window.addEventListener('mouseup', up, { passive: true, capture: true });
    window.addEventListener('touchmove', move, { passive: false, capture: true });
    window.addEventListener('touchend', up, { passive: true, capture: true });
  }
}
