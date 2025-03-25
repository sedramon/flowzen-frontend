import { CommonModule } from '@angular/common';
import { Component, OnInit, AfterViewInit, OnDestroy, ElementRef, ViewChild, ChangeDetectorRef, HostBinding } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router, NavigationStart } from '@angular/router';
import interact from 'interactjs';
import { trigger, state, style, transition, animate, keyframes, query, stagger } from '@angular/animations';
import { Employee, Appointment, ScheduleService } from './services/schedule.service';
import { Subscription } from 'rxjs';

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
    FlexLayoutModule
  ],
  templateUrl: './appoitments.component.html',
  styleUrls: ['./appoitments.component.scss'],
  animations: [
    // Animacija za slide-in pri ulasku elementa
    trigger('slideIn', [
      transition(':enter', [
        animate('0.5s ease-in', keyframes([
          style({ opacity: 0, transform: 'translateY(20px)', offset: 0 }),
          style({ opacity: 1, transform: 'translateY(0)', offset: 1 })
        ]))
      ])
    ]),
    // Animacije za naslov i datepicker (pomak ulevo/udesno)
    trigger('titleAnim', [
      state('centered', style({ transform: 'translateX(0)' })),
      state('spaced', style({ transform: 'translateX(-100px)' })),
      transition('centered => spaced', animate('0.5s ease-out')),
      transition('spaced => centered', animate('0.5s ease-in'))
    ]),
    trigger('dateAnim', [
      state('centered', style({ transform: 'translateX(0)' })),
      state('spaced', style({ transform: 'translateX(100px)' })),
      transition('centered => spaced', animate('0.5s ease-out')),
      transition('spaced => centered', animate('0.5s ease-in'))
    ]),
    // Animacija za promenu rasporeda – samo ulazna animacija (fade-in)
    trigger('scheduleChange', [
      transition(':enter', [
        query('.employee-column', [
          style({ opacity: 0 }),
          stagger(100, [
            animate('0.5s ease-out', style({ opacity: 1 }))
          ])
        ])
      ])
    ])
  ]
})
export class AppoitmentsComponent implements OnInit, AfterViewInit {

  @ViewChild('timeColumn', { static: false }) timeColumnRef!: ElementRef;
  @ViewChild('employeeColumns', { static: false }) employeeColumnsRef!: ElementRef;

  dateControl = new FormControl(null);
  selectedDate: Date | null = null;
  // Kontrola prikaza rasporeda u DOM-u
  animateSchedule: boolean = false;
  toolbarState: 'centered' | 'spaced' = 'centered';

  timeSlots: number[] = Array.from({ length: 29 }, (_, i) => 8 + i * 0.5);

  employees: Employee[] = [];
  appointments: Appointment[] = [];

  private totalMinutes = 14 * 60;
  gridBodyHeight: number = 1020;

  dragOffset: { [id: number]: { x: number; y: number } } = {};

  // Nova promenljiva koja kontroliše animacije na nivou cele komponente

  private mouseMoveListener = (ev: MouseEvent) => {
    if (window.getSelection) {
      window.getSelection()?.removeAllRanges();
    }
    ev.preventDefault();
  };

  constructor(
    private cd: ChangeDetectorRef,
    private scheduleService: ScheduleService,
    private router: Router
  ) {}

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    const boundingFn = () => {
      const timeR = this.timeColumnRef.nativeElement.getBoundingClientRect();
      const colsR = this.employeeColumnsRef.nativeElement.getBoundingClientRect();
      return {
        top: colsR.top,
        left: timeR.right,
        bottom: colsR.bottom,
        right: colsR.right
      };
    };

    // Konfiguracija interact.js za drag & drop i resizable
    interact('.appointment-block')
      .draggable({
        inertia: false,
        autoScroll: false,
        modifiers: [
          interact.modifiers.restrictRect({ restriction: boundingFn, endOnly: false })
        ],
        listeners: {
          start: (event) => {
            const target = event.target as HTMLElement;
            const apId = +(target.getAttribute('data-appointment-id') || 0);
            const rect = target.getBoundingClientRect();
            this.dragOffset[apId] = { x: event.clientX - rect.left, y: event.clientY - rect.top };
            document.addEventListener('mousemove', this.mouseMoveListener, { passive: false });
          },
          move: (event) => {
            const target = event.target as HTMLElement;
            const match = target.style.transform.match(/translate\(([-\d.]+)px,\s*([-\d.]+)px\)/);
            const prevX = match ? parseFloat(match[1]) : 0;
            const prevY = match ? parseFloat(match[2]) : 0;
            const newX = prevX + event.dx;
            const newY = prevY + event.dy;
            target.style.transform = `translate(${newX}px, ${newY}px)`;
            const apId = +(target.getAttribute('data-appointment-id') || 0);
            const ap = this.appointments.find(a => a.id === apId);
            if (ap) {
              this.fixOverlapsLive(ap.employeeId);
              this.cd.detectChanges();
            }
          },
          end: (event) => {
            event.target.style.transform = 'none';
            document.removeEventListener('mousemove', this.mouseMoveListener);
            const apId = +(event.target.getAttribute('data-appointment-id') || 0);
            const ap = this.appointments.find(a => a.id === apId);
            if (ap) {
              this.fixOverlapsLive(ap.employeeId);
              this.cd.detectChanges();
            }
          }
        }
      })
      .resizable({
        edges: { bottom: '.resize-handle' },
        modifiers: [
          interact.modifiers.restrictEdges({ outer: boundingFn, endOnly: true }),
          interact.modifiers.restrictSize({ min: { width: 40, height: (0.5 / 14) * this.gridBodyHeight } })
        ],
        inertia: false,
        listeners: {
          start: (event) => {
            document.addEventListener('mousemove', this.mouseMoveListener, { passive: false });
          },
          move: (event) => {
            const target = event.target as HTMLElement;
            const apId = +(target.getAttribute('data-appointment-id') || 0);
            const ap = this.appointments.find(a => a.id === apId);
            if (!ap) return;
            let newHeightPx = event.rect.height;
            let newDuration = (newHeightPx / this.gridBodyHeight) * 14;
            if (newDuration < 0.5) newDuration = 0.5;
            const colApps = this.appointments.filter(a => a.employeeId === ap.employeeId).sort((a, b) => a.startHour - b.startHour);
            const currentIndex = colApps.findIndex(a => a.id === apId);
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
            target.style.height = newHeightPx + 'px';
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
            const apId = +(event.target.getAttribute('data-appointment-id') || 0);
            const ap = this.appointments.find(a => a.id === apId);
            if (ap) {
              this.fixOverlapsLive(ap.employeeId);
              this.cd.detectChanges();
            }
          }
        }
      });

    interact('.employee-column').dropzone({
      accept: '.appointment-block',
      overlap: 0.5,
      ondrop: (event) => {
        const empEl = event.target as HTMLElement;
        const employeeId = +(empEl.getAttribute('data-employee-id') || 0);
        const appointmentEl = event.relatedTarget as HTMLElement;
        const apId = +(appointmentEl.getAttribute('data-appointment-id') || 0);
        const ap = this.appointments.find(a => a.id === apId);
        if (!ap) return;
        const colRect = empEl.getBoundingClientRect();
        const pointerY = event.dragEvent.clientY;
        const offsetY = this.dragOffset[apId]?.y || 0;
        let localY = pointerY - colRect.top - offsetY;
        const minutesFromTop = (localY / this.gridBodyHeight) * this.totalMinutes;
        const snappedMinutes = Math.round(minutesFromTop);
        const newStartHour = 8 + snappedMinutes / 60;
        const duration = ap.endHour - ap.startHour;
        ap.startHour = newStartHour;
        ap.endHour = newStartHour + duration;
        if (ap.startHour < 8) {
          ap.endHour += (8 - ap.startHour);
          ap.startHour = 8;
        }
        if (ap.endHour > 22) {
          ap.startHour -= (ap.endHour - 22);
          ap.endHour = 22;
        }
        ap.employeeId = employeeId;
        appointmentEl.style.transform = 'none';
        this.fixOverlapsLive(employeeId);
        this.cd.detectChanges();
      }
    });
  }

  private fixOverlapsLive(employeeId: number): void {
    let colApps = this.appointments.filter(a => a.employeeId === employeeId);
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
    this.scheduleService.getSchedule(date).subscribe(data => {
      this.employees = data.employees;
      this.appointments = data.appointments;
      this.cd.detectChanges();
    });
  }

  onDateChange(dateValue: Date | null): void {
    if (dateValue) {
      // Ako je izabran novi datum (različit od trenutnog)
      if (!this.selectedDate || dateValue.getTime() !== this.selectedDate.getTime()) {
        // Pokreni animaciju za nestajanje trenutnog rasporeda
        this.animateSchedule = false;
        // Sačekaj da se izlazna animacija završi (500ms)
        setTimeout(() => {
          // Nakon izlazne animacije, postavi novi datum i učitaj raspored
          this.selectedDate = dateValue;
          this.toolbarState = 'spaced';
          this.employees = [];
          this.appointments = [];
          this.cd.detectChanges();
          this.loadSchedule(dateValue);
          // Omogući prikaz novog rasporeda uz ulaznu animaciju
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

  getAppointmentsForEmployee(employeeId: number): Appointment[] {
    return this.appointments.filter(a => a.employeeId === employeeId);
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
