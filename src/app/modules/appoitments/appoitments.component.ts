import { CommonModule } from '@angular/common';
import {
  Component,
  OnInit,
  AfterViewInit,
  ElementRef,
  ViewChild,
  ChangeDetectorRef,
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
  Employee,
  Appointment,
  ScheduleService,
} from './services/schedule.service';
import {
  Service,
  ServicesService,
} from '../services/services/services.service';
import { MatDialog } from '@angular/material/dialog';
import {
  AppointmentDialogComponent,
  AppointmentDialogData,
} from './dialog/appointment-dialog.component';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-appoitments',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatFormFieldModule,
    MatInputModule,
    MatToolbarModule,
    MatCardModule,
    FlexLayoutModule,
    MatIconModule
  ],
  templateUrl: './appoitments.component.html',
  styleUrls: ['./appoitments.component.scss'],
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
        query('.employee-column', [
          style({ opacity: 0 }),
          stagger(100, [animate('0.5s ease-out', style({ opacity: 1 }))]),
        ]),
      ]),
    ]),
  ],
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

  timeSlots: number[] = Array.from({ length: 29 }, (_, i) => 8 + i * 0.5);

  employees: Employee[] = [];
  appointments: Appointment[] = [];
  services: Service[] = [];

  private totalMinutes = 14 * 60;
  gridBodyHeight: number = 1020;

  // Čuvamo offsete tokom drag operacije
  dragOffset: { [id: number]: { x: number; y: number } } = {};

  // Sprečavamo default ponašanje selektovanja teksta
  private mouseMoveListener = (ev: MouseEvent) => {
    if (window.getSelection) {
      window.getSelection()?.removeAllRanges();
    }
    ev.preventDefault();
  };

  get selectedDateStr(): string {
    return this.selectedDate
      ? this.selectedDate.toISOString().split('T')[0]
      : '';
  }

  constructor(
    private cd: ChangeDetectorRef,
    private scheduleService: ScheduleService,
    private readonly servicesService: ServicesService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.servicesService.getAllServices().subscribe((data: any[]) => {
      this.services = data.map((item) => ({
        id: item._id,
        name: item.name,
      }));
      console.log('Services loaded:', this.services);
    });

    const today = new Date();
    this.dateControl.setValue(today);
    this.onDateChange(today); // manually trigger date load
  }

  isDragging = false;

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

    // KONFIGURACIJA DRAGGABLE ELEMENTA POMOĆU INTERACT.JS
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
            // POSTAVLJAMO BOX DA BUDE ISPOD OSTALIH - IZMENJENO
            target.style.zIndex = '1';
            const apId = +(target.getAttribute('data-appointment-id') || 0);
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
            const apId = +(target.getAttribute('data-appointment-id') || 0);
            const ap = this.appointments.find((a) => a.id === apId);
            if (ap) {
              this.fixOverlapsLive(ap.employeeId);
              this.cd.detectChanges();
            }
          },
          end: (event) => {
            const target = event.target as HTMLElement;
            // PRIVREMENO ISKLJUČUJEMO TRANSITION - IZMENJENO
            target.style.transition = 'none';
            target.style.transform = 'none';
            document.removeEventListener('mousemove', this.mouseMoveListener);
            // ZADRŽAVAMO NIŽI Z-INDEX - IZMENJENO
            target.style.zIndex = '1';
            // FORCE REFLOW I PONOVNO UKLJUČIVANJE TRANSITION
            void target.offsetWidth;
            target.style.transition = 'transform 0.1s ease';
            const apId = +(target.getAttribute('data-appointment-id') || 0);
            const ap = this.appointments.find((a) => a.id === apId);
            if (ap) {
              this.fixOverlapsLive(ap.employeeId);
              this.cd.detectChanges();
            }
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
            document.addEventListener('mousemove', this.mouseMoveListener, {
              passive: false,
            });
          },
          move: (event) => {
            const target = event.target as HTMLElement;
            const apId = +(target.getAttribute('data-appointment-id') || 0);
            const ap = this.appointments.find((a) => a.id === apId);
            if (!ap) return;
            let newHeightPx = event.rect.height;
            // IZMENJENO: ZAOKRUŽIVANJE DUŽINE TERMINA NA 5 MINUTA
            const fiveMinuteFraction = 5 / 60; // 5 MINUTA U SATIMA
            let computedDuration = (newHeightPx / this.gridBodyHeight) * 14;
            let newDuration =
              Math.round(computedDuration / fiveMinuteFraction) *
              fiveMinuteFraction;
            if (newDuration < 0.5) {
              newDuration = 0.5;
              newHeightPx = (newDuration / 14) * this.gridBodyHeight;
            }
            ap.endHour = ap.startHour + newDuration;
            target.style.height = newHeightPx + 'px';
            const colApps = this.appointments
              .filter((a) => a.employeeId === ap.employeeId)
              .sort((a, b) => a.startHour - b.startHour);
            const currentIndex = colApps.findIndex((a) => a.id === apId);
            let maxAllowedDuration = 22 - ap.startHour;
            if (currentIndex >= 0 && currentIndex < colApps.length - 1) {
              const next = colApps[currentIndex + 1];
              maxAllowedDuration = next.startHour - ap.startHour;
            }
            if (newDuration > maxAllowedDuration) {
              newDuration = maxAllowedDuration;
              newHeightPx = (newDuration / 14) * this.gridBodyHeight;
            }
            ap.endHour = ap.startHour + newDuration;
            for (let i = currentIndex + 1; i < colApps.length; i++) {
              let prev = colApps[i - 1];
              let curr = colApps[i];
              if (curr.startHour < prev.endHour) {
                const duration = curr.endHour - curr.startHour;
                curr.startHour = prev.endHour;
                curr.endHour = curr.startHour + duration;
              }
            }
            this.cd.detectChanges();
          },
          end: (event) => {
            document.removeEventListener('mousemove', this.mouseMoveListener);
            const apId = +(
              event.target.getAttribute('data-appointment-id') || 0
            );
            const ap = this.appointments.find((a) => a.id === apId);
            if (ap) {
              this.fixOverlapsLive(ap.employeeId);
              this.cd.detectChanges();
            }
          },
        },
      });

    interact('.employee-column').dropzone({
      accept: '.appointment-block',
      overlap: 0.5,
      ondrop: (event) => {
        const empEl = event.target as HTMLElement;
        const employeeId = +(empEl.getAttribute('data-employee-id') || 0);
        const employee = this.employees.find((e) => e.id === employeeId);
        const appointmentEl = event.relatedTarget as HTMLElement;
        const apId = +(appointmentEl.getAttribute('data-appointment-id') || 0);
        const ap = this.appointments.find((a) => a.id === apId);
        if (!ap) return;

        if (employee && !employee.workingDays.includes(this.selectedDateStr)) {
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

        // Pronađi sve termine za tog zaposlenog, osim trenutnog
        const colApps = this.appointments
          .filter((a) => a.employeeId === employeeId && a.id !== apId)
          .sort((a, b) => a.startHour - b.startHour);

        // Proveri da li postoji preklapanje sa nekim terminom
        let overlap = colApps.find(other =>
          newStartHour < other.endHour && newEndHour > other.startHour
        );

        if (overlap) {
          // Ako je gornja ivica box1 iznad gornje ivice box2 (overlap.startHour)
          if (newStartHour < overlap.startHour) {
            // Samo snap-uj box1 da bude odmah iznad box2, bez pomeranja box2
            newEndHour = overlap.startHour;
            newStartHour = newEndHour - duration;
            // Ako bi time izašao iz radnog vremena, snap-uj na minimum
            if (newStartHour < 8) {
              newStartHour = 8;
              newEndHour = 8 + duration;
            }
          } else {
            // Ako je gornja ivica box1 ispod gornje ivice box2, snap-uj box1 ispod box2
            newStartHour = overlap.endHour;
            newEndHour = newStartHour + duration;
            // Ako bi time izašao iz radnog vremena, snap-uj na maksimum
            if (newEndHour > 22) {
              newEndHour = 22;
              newStartHour = 22 - duration;
            }
          }
        }

        // Ograniči na radno vreme
        if (newStartHour < 8) {
          newEndHour += 8 - newStartHour;
          newStartHour = 8;
        }
        if (newEndHour > 22) {
          newStartHour -= newEndHour - 22;
          newEndHour = 22;
        }

        ap.startHour = newStartHour;
        ap.endHour = newEndHour;
        ap.employeeId = employeeId;
        appointmentEl.style.transform = 'none';
        appointmentEl.style.zIndex = '1';
        this.cd.detectChanges();
      },
    });
  }

  onEmptyColumnClick(emp: Employee, event: MouseEvent): void {
    if (this.isDragging) return;
    // AKO JE EMPLOYEE NEAKTIVAN (NPR. NIJE RADNI DAN), NE OTVARAJ DIJALOG
    if (!emp.workingDays.includes(this.selectedDateStr)) {
      return;
    }

    // IZRAČUNAJ (OPCIONO) POČETNO VREME NA OSNOVU POZICIJE KLIKA
    const empColRect = (
      event.currentTarget as HTMLElement
    ).getBoundingClientRect();
    const localY = event.clientY - empColRect.top;
    const minutesFromTop = (localY / this.gridBodyHeight) * this.totalMinutes;
    // IZMENJENO: ZAOKRUŽIVANJE POČETKA TERMINA NA 5 MINUTA
    const snappedMinutes = Math.round(minutesFromTop / 5) * 5;
    const appointmentStart = 8 + snappedMinutes / 60;

    // KREIRANJE PODATAKA ZA DIJALOG
    const dialogData: AppointmentDialogData = {
      employeeId: emp.id,
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
        // PREMA VRAĆENIM PODACIMA, KREIRAJ NOVI TERMIN
        const newAp: Appointment = {
          id: Math.floor(Math.random() * 10000), // GENERIŠI ID
          employeeId: emp.id,
          startHour: result.startHour,
          endHour: result.startHour + 1, // PRETPOSTAVI DA TRAJE 1 SAT; MODIFIKUJ PO POTREBI
          serviceName: result.service,
          date: this.selectedDateStr,
        };
        this.appointments.push(newAp);
        this.fixOverlapsLive(emp.id);
        this.cd.detectChanges();
      }
    });
  }

  onAppointmentClick(ap: Appointment, event: MouseEvent): void {
    console.log('EDIT', ap); // Dodaj ovo za debug
    if (this.isDragging) return;
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
      if (result) {
        ap.startHour = result.startHour;
        ap.endHour = result.endHour;
        ap.serviceName = result.service;
        this.fixOverlapsLive(ap.employeeId);
        this.cd.detectChanges();
      }
    });
  }

  private fixOverlapsLive(employeeId: number): void {
    let colApps = this.appointments.filter((a) => a.employeeId === employeeId);
    colApps.sort((a, b) => a.startHour - b.startHour);
    for (let i = 0; i < colApps.length - 1; i++) {
      let current = colApps[i];
      let next = colApps[i + 1];
      if (current.endHour > next.startHour) {
        const duration = next.endHour - next.startHour;
        next.startHour = current.endHour;
        next.endHour = next.startHour + duration;
      }
    }
    let last = colApps[colApps.length - 1];
    if (last && last.endHour > 22) {
      const diff = last.endHour - 22;
      for (let ap of colApps) {
        ap.startHour = Math.max(8, ap.startHour - diff);
        ap.endHour = Math.max(ap.startHour + 0.25, ap.endHour - diff);
      }
    }
  }

  loadSchedule(date: Date): void {
    this.scheduleService.getSchedule(date).subscribe((data) => {
      console.log('Loaded schedule data:', data);
      this.employees = data.employees;
      this.appointments = data.appointments;
      this.cd.detectChanges();
    });
  }

  onDateChange(dateValue: Date | null): void {
    if (dateValue) {
      if (
        !this.selectedDate ||
        dateValue.getTime() !== this.selectedDate.getTime()
      ) {
        this.animateSchedule = false;
        setTimeout(() => {
          this.selectedDate = dateValue;
          this.toolbarState = 'spaced';
          this.employees = [];
          this.appointments = [];
          this.cd.detectChanges();
          this.loadSchedule(dateValue);
          this.animateSchedule = true;
          this.cd.detectChanges();
        }, 500);
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
    const current = this.dateControl.value;
    if (!current) return;

    const next = new Date(current);
    next.setDate(current.getDate() + deltaDays);

    this.dateControl.setValue(next);
    this.onDateChange(next);
  }

  getAppointmentsForEmployee(employeeId: number): Appointment[] {
    return this.appointments.filter((a) => a.employeeId === employeeId);
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
}
