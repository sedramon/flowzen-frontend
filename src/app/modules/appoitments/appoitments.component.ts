import { CommonModule } from '@angular/common';
import { Component, OnInit, AfterViewInit, ElementRef, ViewChild, ChangeDetectorRef } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import interact from 'interactjs';
import { trigger, state, style, transition, animate } from '@angular/animations';

interface Employee {
  id: number;
  name: string;
  avatarUrl: string;
}

interface Appointment {
  id: number;
  employeeId: number;
  startHour: number; // npr. 9.0 = 09:00, 9.5 = 09:30, itd.
  endHour: number;
  serviceName: string;
}

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
    trigger('fadeIn', [
      state('void', style({ opacity: 0 })),
      transition(':enter', [
        animate('0.5s ease-in', style({ opacity: 1 }))
      ])
    ])
  ]
})
export class AppoitmentsComponent implements OnInit, AfterViewInit {

  @ViewChild('timeColumn', { static: false }) timeColumnRef!: ElementRef;
  @ViewChild('employeeColumns', { static: false }) employeeColumnsRef!: ElementRef;

  dateControl = new FormControl(new Date());
  selectedDate: Date = new Date();

  // Polusatni intervali (8:00 - 22:00 => 29 elemenata)
  timeSlots: number[] = Array.from({ length: 29 }, (_, i) => 8 + i * 0.5);

  employees: Employee[] = [
    { id: 1, name: 'Milan',  avatarUrl: 'https://i.pravatar.cc/50?u=Milan' },
    { id: 2, name: 'Jovana', avatarUrl: 'https://i.pravatar.cc/50?u=Jovana' },
    { id: 3, name: 'Petar',  avatarUrl: 'https://i.pravatar.cc/50?u=Petar' },
    { id: 4, name: 'Ana',    avatarUrl: 'https://i.pravatar.cc/50?u=Ana' },
    { id: 5, name: 'Marko',  avatarUrl: 'https://i.pravatar.cc/50?u=Marko' },
    { id: 6, name: 'Ivana',  avatarUrl: 'https://i.pravatar.cc/50?u=Ivana' },
    { id: 7, name: 'Stefan', avatarUrl: 'https://i.pravatar.cc/50?u=Stefan' },
    { id: 8, name: 'Marija', avatarUrl: 'https://i.pravatar.cc/50?u=Marija' }
  ];
  
  appointments: Appointment[] = [
    { id: 101, employeeId: 1, startHour: 8,  endHour: 10, serviceName: 'Usluga A' },
    { id: 102, employeeId: 2, startHour: 9,  endHour: 10, serviceName: 'Usluga B' },
    { id: 103, employeeId: 2, startHour: 11, endHour: 12, serviceName: 'Usluga C' },
    { id: 104, employeeId: 3, startHour: 15, endHour: 17, serviceName: 'Usluga D' },
    { id: 105, employeeId: 1, startHour: 18, endHour: 20, serviceName: 'Usluga E' },
    { id: 106, employeeId: 1, startHour: 14, endHour: 15, serviceName: 'Usluga F' },
    { id: 107, employeeId: 4, startHour: 10, endHour: 11, serviceName: 'Usluga G' },
    { id: 108, employeeId: 5, startHour: 12, endHour: 13, serviceName: 'Usluga H' },
    { id: 109, employeeId: 6, startHour: 9,  endHour: 11, serviceName: 'Usluga I' },
    { id: 110, employeeId: 7, startHour: 16, endHour: 18, serviceName: 'Usluga J' },
    { id: 111, employeeId: 8, startHour: 8,  endHour: 9,  serviceName: 'Usluga K' },
    { id: 112, employeeId: 8, startHour: 13, endHour: 14, serviceName: 'Usluga L' }
  ];

  // 840 minuta (14 sati) – (od 8 do 22)
  private totalMinutes = 14 * 60;
  gridBodyHeight: number = 1020;

  // Za drag – čuvamo offset klika unutar elementa
  dragOffset: { [id: number]: { x: number; y: number } } = {};

  // Privatni listener za brisanje selekcije
  private mouseMoveListener: any = (ev: MouseEvent) => {
    if (window.getSelection) {
      window.getSelection()?.removeAllRanges();
    }
    ev.preventDefault();
  };

  constructor(private cd: ChangeDetectorRef) {}

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    // Funkcija za dinamički bounding box: 
    // ograničava boxove da se kreću unutar prostora kolona zaposlenih (od desne ivice time-column do desne ivice employee-columns)
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

    interact('.appointment-block')
      .draggable({
        inertia: false,
        autoScroll: false,
        modifiers: [
          interact.modifiers.restrictRect({
            restriction: boundingFn,
            endOnly: false
          })
        ],
        listeners: {
          start: (event) => {
            const target = event.target as HTMLElement;
            const apId = +(target.getAttribute('data-appointment-id') || 0);
            const rect = target.getBoundingClientRect();
            this.dragOffset[apId] = {
              x: event.clientX - rect.left,
              y: event.clientY - rect.top
            };
            document.addEventListener('mousemove', this.mouseMoveListener, { passive: false });
          },
          move: (event) => {
            const target = event.target as HTMLElement;
            let transform = target.style.transform || 'translate(0px,0px)';
            const match = transform.match(/translate\(([-\d.]+)px,\s*([-\d.]+)px\)/);
            let prevX = match ? parseFloat(match[1]) : 0;
            let prevY = match ? parseFloat(match[2]) : 0;
            const newX = prevX + event.dx;
            const newY = prevY + event.dy;
            target.style.transform = `translate(${newX}px, ${newY}px)`;
            // Live reordering: provjera preklapanja u realnom vremenu
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
          interact.modifiers.restrictEdges({
            outer: boundingFn,
            endOnly: true
          }),
          interact.modifiers.restrictSize({
            min: { width: 40, height: (0.5 / 14) * this.gridBodyHeight }
          })
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

            // Calculate the new height
            let newHeightPx = event.rect.height;
            let newDuration = (newHeightPx / this.gridBodyHeight) * 14;
            // Minimum duration is 0.5h (one cell)
            if (newDuration < 0.5) newDuration = 0.5;

            // Restriction: if there is a next box, the maximum duration is until its start
            const colApps = this.appointments.filter(a => a.employeeId === ap.employeeId).sort((a, b) => a.startHour - b.startHour);
            const currentIndex = colApps.findIndex(a => a.id === apId);
            let maxAllowedDuration = 22 - ap.startHour; // if it's the last one, until 22:00
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

            // Adjust the positions of the boxes below
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
    // Uzimamo sve appointment-e za tu kolonu i sortiramo po startHour
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
    // Ako zadnji box prelazi granicu, pomakni sve gore (opcionalno)
    let last = colApps[colApps.length - 1];
    if (last && last.endHour > 22) {
      const diff = last.endHour - 22;
      for (let ap of colApps) {
        ap.startHour = Math.max(8, ap.startHour - diff);
        ap.endHour = Math.max(ap.startHour + 0.25, ap.endHour - diff);
      }
    }
  }

  onDateChange(dateValue: Date | null): void {
    if (dateValue) {
      this.selectedDate = dateValue;
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
