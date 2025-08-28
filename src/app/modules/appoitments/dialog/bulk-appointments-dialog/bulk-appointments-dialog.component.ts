import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { trigger, style, animate, transition, keyframes } from '@angular/animations';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { Employee } from '../../../../models/Employee';
import { Client } from '../../../../models/Client';
import { Service } from '../../../../models/Service';
import { Appointment } from '../../../../models/Appointment';
import { AppointmentsService } from '../../services/appointment.service';

export interface BulkAppointmentsDialogData {
  employees: Employee[];
  clients: Client[];
  services: Service[];
  facilityId: string;
  date: string;
  existingAppointments: Appointment[];
}

interface ParsedAppointmentDraft {
  employeeId?: string;
  clientId?: string;
  serviceId?: string;
  startHour?: number;
  endHour?: number;
  startTimeString?: string;
  endTimeString?: string;
  error?: string;
}

@Component({
  selector: 'app-bulk-appointments-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatSnackBarModule,
  ],
  templateUrl: './bulk-appointments-dialog.component.html',
  styleUrls: ['./bulk-appointments-dialog.component.scss'],
  animations: [
    trigger('dialogPop', [
      transition(':enter', [
        animate('250ms cubic-bezier(0.68, -0.55, 0.265, 1.55)', keyframes([
          style({ transform: 'scale(0.95)', opacity: 0, offset: 0 }),
          style({ transform: 'scale(1.05)', opacity: 1, offset: 0.7 }),
          style({ transform: 'scale(1)', opacity: 1, offset: 1 })
        ]))
      ])
    ])
  ]
})
export class BulkAppointmentsDialogComponent {
  drafts: ParsedAppointmentDraft[] = [];
  errors: string[] = [];
  loading = false;
  
  // Ultra Fast Bulk Generator Configuration
  bulkGenerator = {
    employeeIds: [] as string[],
    serviceId: undefined as string | undefined,
    startTime: '09:00',
    endTime: '17:00',
    slotMinutes: 60,
    gapMinutes: 0
  };

  constructor(
    private snackBar: MatSnackBar,
    private apptService: AppointmentsService,
    public dialogRef: MatDialogRef<BulkAppointmentsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: BulkAppointmentsDialogData,
  ) {
  }

  get validDrafts() { 
    return this.drafts.filter(d => !d.error) as Required<ParsedAppointmentDraft>[]; 
  }

  import() {
    if (!this.validDrafts.length) return;
    
    this.loading = true;
    const body = this.validDrafts.map(d => ({
      employee: d.employeeId!,
      client: d.clientId!,
      service: d.serviceId!,
      facility: this.data.facilityId,
      date: this.data.date,
      startHour: d.startHour!,
      endHour: d.endHour!,
      tenant: '' // will be injected in service layer
    }));

    this.apptService.bulkCreateAppointments(body as any).subscribe({
      next: (created: any) => {
        this.snackBar.open(`Kreirano ${created.length} termina`, 'Zatvori', { duration: 3000 });
        this.dialogRef.close({ created });
      },
      error: (err) => {
        this.loading = false;
        this.snackBar.open('Greška pri masovnom unosu termina', 'Zatvori', { duration: 3000 });
      }
    });
  }

  onServiceChange(d: ParsedAppointmentDraft) {
    if (!d.startHour || d.endHour) return;
    const service = this.data.services.find(s => s._id === d.serviceId);
    if (service) {
      d.endHour = this.addMinutes(d.startHour, service.durationMinutes);
    }
  }

  generate() {
    // This method is replaced by megaGenerate() - kept for compatibility
    this.megaGenerate();
  }

  addRow() {
    const draft: ParsedAppointmentDraft = {};
    if (this.bulkGenerator.employeeIds?.length) {
      draft.employeeId = this.bulkGenerator.employeeIds[0]; // Use first selected employee
    }
    if (this.bulkGenerator.serviceId) draft.serviceId = this.bulkGenerator.serviceId;
    const startBase = this.parseTime(this.bulkGenerator.startTime);
    if (startBase != null) {
      draft.startHour = startBase;
      const svc = this.data.services.find(s => s._id === (draft.serviceId || this.bulkGenerator.serviceId));
      const dur = svc?.durationMinutes || this.bulkGenerator.slotMinutes || 30;
      draft.endHour = this.addMinutes(startBase, dur);
      draft.startTimeString = this.formatTime(startBase);
      draft.endTimeString = this.formatTime(draft.endHour);
    }
    draft.error = this.validateDraft(draft);
    this.drafts.push(draft);
  }

  removeDraft(index: number) {
    this.drafts.splice(index, 1);
  }

  clearDrafts() {
    this.drafts = [];
  }

  private validateDraft(d: ParsedAppointmentDraft): string | undefined {
    if (!d.employeeId) return 'Nedostaje zaposleni';
    if (!d.clientId) return 'Nedostaje klijent';
    if (!d.serviceId) return 'Nedostaje usluga';
    if (d.startHour == null || d.endHour == null) return 'Neispravno vreme';
    if (d.endHour <= d.startHour) return 'Kraj mora biti posle početka';

    const emp = this.data.employees.find(e => e._id === d.employeeId);
    if (!emp?.workingShift) return 'Zaposleni nema radnu smenu';

    // Validate within working shift (supports overnight if needed)
    const sh = emp.workingShift;
    const within = sh.startHour <= sh.endHour
      ? (d.startHour >= sh.startHour && d.endHour <= sh.endHour)
      : // overnight: either both on first part or both on second part
        ((d.startHour >= sh.startHour || d.endHour <= sh.endHour));
    if (!within) return 'Vreme van radne smene';

    // Overlap is allowed per request
    
    return undefined;
  }

  // Utilities
  parseTime(input?: string): number | undefined {
    if (!input) return undefined;
    const clean = input.replace(/h/gi, ':').replace(/\./g, ':');
    const m = clean.match(/^(\d{1,2})(?::(\d{1,2}))?$/);
    if (!m) return undefined;
    const h = Number(m[1]);
    const min = m[2] ? Number(m[2]) : 0;
    if (h < 0 || h > 24 || min < 0 || min > 59) return undefined;
    return h + min / 60;
  }

  addMinutes(hour: number, minutes: number): number {
    return hour + minutes / 60;
  }

  formatTime(hour?: number): string {
    if (hour == null) return '';
    const h = Math.floor(hour);
    const m = Math.round((hour - h) * 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  }

  updateTimeFromString(d: ParsedAppointmentDraft, which: 'start' | 'end') {
    const timeString = which === 'start' ? d.startTimeString : d.endTimeString;
    if (timeString) {
      const parsed = this.parseTime(timeString);
      if (parsed !== undefined) {
        if (which === 'start') {
          d.startHour = parsed;
        } else {
          d.endHour = parsed;
        }
        d.error = this.validateDraft(d);
      }
    }
  }

  // Ultra Fast Bulk Generation Methods
  
  setTimeTemplate(minutes: number) {
    this.bulkGenerator.slotMinutes = minutes;
  }
  
  calculateTotalSlots(): number {
    if (!this.bulkGenerator.employeeIds?.length || !this.bulkGenerator.startTime || !this.bulkGenerator.endTime) {
      return 0;
    }
    
    const start = this.parseTime(this.bulkGenerator.startTime) || 0;
    const end = this.parseTime(this.bulkGenerator.endTime) || 0;
    const totalMinutes = (end - start) * 60;
    
    // Use service duration if available, otherwise use slot template
    const service = this.data.services.find(s => s._id === this.bulkGenerator.serviceId);
    const slotDuration = service?.durationMinutes || this.bulkGenerator.slotMinutes;
    const slotWithGap = slotDuration + this.bulkGenerator.gapMinutes;
    const slotsPerEmployee = Math.floor(totalMinutes / slotWithGap);
    
    return slotsPerEmployee * this.bulkGenerator.employeeIds.length;
  }
  
  megaGenerate() {
    if (!this.bulkGenerator.employeeIds?.length) {
      this.snackBar.open('Odaberi najmanje jednog zaposlenog', 'Zatvori', { duration: 2000 });
      return;
    }
    
    if (!this.bulkGenerator.serviceId) {
      this.snackBar.open('Odaberi uslugu', 'Zatvori', { duration: 2000 });
      return;
    }
    
    const start = this.parseTime(this.bulkGenerator.startTime);
    const end = this.parseTime(this.bulkGenerator.endTime);
    
    if (!start || !end || end <= start) {
      this.snackBar.open('Neispravan vremenski opseg', 'Zatvori', { duration: 2000 });
      return;
    }
    
    this.drafts = []; // Clear existing drafts
    
    const service = this.data.services.find(s => s._id === this.bulkGenerator.serviceId);
    const slotDuration = service?.durationMinutes || this.bulkGenerator.slotMinutes;
    const totalMinutes = (end - start) * 60;
    const slotWithGap = slotDuration + this.bulkGenerator.gapMinutes;
    const slotsPerEmployee = Math.floor(totalMinutes / slotWithGap);
    
    // Generate for each employee
    for (const employeeId of this.bulkGenerator.employeeIds) {
      for (let i = 0; i < slotsPerEmployee; i++) {
        const slotStart = start + (i * slotWithGap) / 60;
        const slotEnd = slotStart + slotDuration / 60;
        
        const draft: ParsedAppointmentDraft = {
          employeeId,
          serviceId: this.bulkGenerator.serviceId,
          startHour: slotStart,
          endHour: slotEnd,
          startTimeString: this.formatTime(slotStart),
          endTimeString: this.formatTime(slotEnd)
        };
        
        draft.error = this.validateDraft(draft);
        this.drafts.push(draft);
      }
    }
    
    this.snackBar.open(`Generisano ${this.drafts.length} termina!`, 'Zatvori', { duration: 2000 });
  }
  
  quickScenario(scenario: 'morning' | 'afternoon' | 'fullday') {
    switch (scenario) {
      case 'morning':
        this.bulkGenerator.startTime = '09:00';
        this.bulkGenerator.endTime = '13:00';
        break;
      case 'afternoon':
        this.bulkGenerator.startTime = '13:00';
        this.bulkGenerator.endTime = '17:00';
        break;
      case 'fullday':
        this.bulkGenerator.startTime = '09:00';
        this.bulkGenerator.endTime = '17:00';
        break;
    }
    
    // Set default slot if not set
    if (!this.bulkGenerator.slotMinutes) {
      this.bulkGenerator.slotMinutes = 60;
    }
    
    this.snackBar.open(`Postavljen ${scenario} scenario`, 'Zatvori', { duration: 1500 });
  }
  
  // End of BulkAppointmentsDialogComponent
}

