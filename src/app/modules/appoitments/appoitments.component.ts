import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatNativeDateModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { CdkDragDrop } from '@angular/cdk/drag-drop';

interface Employee {
  id: number;
  name: string;
  avatarUrl: string;
}

interface Appointment {
  id: number;
  employeeId: number;
  startHour: number; // npr. 9.0 = 09:00, 9.5 = 09:30, 9.0167 = 09:01 itd.
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
    FlexLayoutModule,
    DragDropModule
  ],
  templateUrl: './appoitments.component.html',
  styleUrls: ['./appoitments.component.scss']
})
export class AppoitmentsComponent implements OnInit {

  dateControl = new FormControl(new Date());
  selectedDate: Date = new Date();

  // Za prikaz u vremenskoj koloni (polusatni intervali, 29 elemenata: 8:00..22:00)
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
    { id: 101, employeeId: 1, startHour: 8,   endHour: 10, serviceName: 'Usluga A' },
    { id: 102, employeeId: 2, startHour: 9,   endHour: 10, serviceName: 'Usluga B' },
    { id: 103, employeeId: 2, startHour: 11,  endHour: 12, serviceName: 'Usluga C' },
    { id: 104, employeeId: 3, startHour: 15,  endHour: 17, serviceName: 'Usluga D' },
    { id: 105, employeeId: 1, startHour: 18,  endHour: 20, serviceName: 'Usluga E' },
    { id: 106, employeeId: 1, startHour: 14,  endHour: 15, serviceName: 'Usluga F' },
    { id: 107, employeeId: 4, startHour: 10,  endHour: 11, serviceName: 'Usluga G' },
    { id: 108, employeeId: 5, startHour: 12,  endHour: 13, serviceName: 'Usluga H' },
    { id: 109, employeeId: 6, startHour: 9,   endHour: 11, serviceName: 'Usluga I' },
    { id: 110, employeeId: 7, startHour: 16,  endHour: 18, serviceName: 'Usluga J' },
    { id: 111, employeeId: 8, startHour: 8,   endHour: 9,  serviceName: 'Usluga K' },
    { id: 112, employeeId: 8, startHour: 13,  endHour: 14, serviceName: 'Usluga L' }
  ];

  // 14 sati = 840 minuta (od 8 do 22)
  private totalMinutes = 840;

  // Za resize
  resizingAppointment: Appointment | null = null;
  initialResizeY: number = 0;
  initialEndHour: number = 0;

  // Grid body visina mora odgovarati SCSS-u, npr. 1020px
  gridBodyHeight: number = 1020;

  // Drop list IDs – povezuju sve kolone
  dropListIds: string[] = [];

  constructor() { }

  ngOnInit(): void {
    this.dropListIds = this.employees.map(emp => 'employee-' + emp.id);
  }

  onDateChange(dateValue: Date | null): void {
    if (dateValue) {
      this.selectedDate = dateValue;
      // Osveži podatke, ako je potrebno.
    }
  }

  getAppointmentsForEmployee(employeeId: number): Appointment[] {
    return this.appointments.filter(ap => ap.employeeId === employeeId);
  }

  formatTime(time: number): string {
    const hours = Math.floor(time);
    const minutes = Math.round((time - hours) * 60);
    const mm = minutes < 10 ? '0' + minutes : minutes;
    return `${hours}:${mm}`;
  }

  calculateTop(startHour: number): number {
    return ((startHour - 8) / 14) * 100;
  }

  calculateHeight(startHour: number, endHour: number): number {
    return ((endHour - startHour) / 14) * 100;
  }

  onDrop(event: CdkDragDrop<Appointment[]>, employee: Employee): void {
    const appointment: Appointment = event.item.data;
    const containerRect = event.container.element.nativeElement.getBoundingClientRect();
    let dropY: number;
    if ('clientY' in event.event) {
      dropY = (event.event as MouseEvent).clientY - containerRect.top;
    } else {
      dropY = (event.event as TouchEvent).touches[0].clientY - containerRect.top;
    }
    const minutesFromTop = (dropY / this.gridBodyHeight) * this.totalMinutes;
    const snappedMinutes = Math.round(minutesFromTop);
    const newStartHour = 8 + snappedMinutes / 60;
    const duration = appointment.endHour - appointment.startHour;
    appointment.startHour = newStartHour;
    appointment.endHour = newStartHour + duration;
    if (appointment.startHour < 8) {
      appointment.endHour += (8 - appointment.startHour);
      appointment.startHour = 8;
    }
    if (appointment.endHour > 22) {
      appointment.startHour -= (appointment.endHour - 22);
      appointment.endHour = 22;
    }
    appointment.employeeId = employee.id;
  }

  onDragStarted(appointment: Appointment): void {
    // Opcionalno: Možeš dodati logiku da original bude sakriven (ako nije već rešenje placeholder-om)
  }

  onDragEnded(appointment: Appointment): void {
    // Opcionalno: Resetuj stanje, ako je potrebno
  }

  onResizeMouseDown(event: MouseEvent, appointment: Appointment): void {
    event.stopPropagation();
    event.preventDefault();
    this.resizingAppointment = appointment;
    this.initialResizeY = event.clientY;
    this.initialEndHour = appointment.endHour;
    document.addEventListener('mousemove', this.onResizing);
    document.addEventListener('mouseup', this.onResizeEnd);
  }

  onResizing = (event: MouseEvent): void => {
    if (!this.resizingAppointment) return;
    const deltaY = event.clientY - this.initialResizeY;
    const deltaMinutes = (deltaY / this.gridBodyHeight) * this.totalMinutes;
    let newEndHour = this.initialEndHour + deltaMinutes / 60;
    const totalEndMinutes = newEndHour * 60;
    const snappedEndMinutes = Math.round(totalEndMinutes);
    newEndHour = snappedEndMinutes / 60;
    const minEnd = this.resizingAppointment.startHour + 1 / 60;
    if (newEndHour < minEnd) { newEndHour = minEnd; }
    if (newEndHour > 22) { newEndHour = 22; }
    this.resizingAppointment.endHour = newEndHour;
  };

  onResizeEnd = (event: MouseEvent): void => {
    this.resizingAppointment = null;
    document.removeEventListener('mousemove', this.onResizing);
    document.removeEventListener('mouseup', this.onResizeEnd);
  };
}
