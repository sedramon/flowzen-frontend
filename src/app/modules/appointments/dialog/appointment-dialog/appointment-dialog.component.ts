import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { trigger, style, animate, transition, keyframes } from '@angular/animations';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { Service } from '../../../../models/Service';
import { Client } from '../../../../models/Client';
import { Employee } from '../../../../models/Employee';
import { Facility } from '../../../../models/Facility';

export interface AppointmentDialogData {
  appointmentStart: number;
  appointmentEnd?: number;
  service?: string;
  services: Service[];
  client?: string;
  clients: Client[];
  employee: string;
  facility?: string;
  facilities?: Facility[];
  // Dodatni podaci za preview
  appointment?: any;
  status?: string;
  isPaid?: boolean;
  readonly?: boolean;
}

@Component({
  selector: 'app-appointment-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule
  ],
  templateUrl: './appointment-dialog.component.html',
  styleUrls: ['./appointment-dialog.component.scss'],
  animations: [
    // Pop animacija: manji overshoot efekat koji se sada primenjuje samo na unutrašnji box
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
export class AppointmentDialogComponent implements OnInit {
  constructor(
    public dialogRef: MatDialogRef<AppointmentDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AppointmentDialogData
  ) {}

  selectedService!: string;
  selectedHour!: number;
  selectedMinute!: number;
  selectedClient!: string;
  selectedFacility!: string;
  endHour!: number;
  endMinute!: number;
  hours: number[] = [];
  minutes: number[] = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
  isFacilityDisabled: boolean = true;
  
  // Preview mode properties
  isPreviewMode: boolean = false;
  appointmentData: any = null;

  ngOnInit(): void {
    console.log(this.data);
    
    // Proveri da li je preview mode
    if (this.data.readonly && this.data.appointment) {
      this.isPreviewMode = true;
      this.appointmentData = this.data.appointment;
      this.loadPreviewData();
      return;
    }
    
    // Normalni edit mode
    for (let i = 8; i <= 22; i++) {
      this.hours.push(i);
    }
    if (this.data.appointmentStart) {
      this.selectedHour = Math.floor(this.data.appointmentStart);
      this.selectedMinute = Math.round((this.data.appointmentStart - this.selectedHour) * 60);
    } else {
      this.selectedHour = 8;
      this.selectedMinute = 0;
    }
    // Dodaj za end
    if (this.data.appointmentEnd) {
      this.endHour = Math.floor(this.data.appointmentEnd);
      this.endMinute = Math.round((this.data.appointmentEnd - this.endHour) * 60);
    } else {
      this.endHour = this.selectedHour + 1;
      this.endMinute = this.selectedMinute;
    }
    this.selectedService = this.data.service || '';
    this.selectedClient = this.data.client || '';
    
    // Set facility - first check if it exists in the list
    if (this.data.facility && this.data.facilities) {
      const facilityExists = this.data.facilities.some(f => f._id === this.data.facility);
      this.selectedFacility = facilityExists ? this.data.facility : '';
    } else {
      this.selectedFacility = this.data.facility || '';
    }
    
    // If no facility is selected, but facilities exist, select the first one
    if (!this.selectedFacility && this.data.facilities && this.data.facilities.length > 0) {
      this.selectedFacility = this.data.facilities[0]._id || '';
    }
    
    // Omogući facility field nakon inicijalizacije (samo ako nije već postavljen)
    if (!this.data.facility) {
      setTimeout(() => {
        this.isFacilityDisabled = false;
      }, 100);
    }
  }

  // Učitaj podatke za preview mode
  loadPreviewData() {
    if (!this.appointmentData) return;
    
    // Inicijalizuj hours array za preview mode
    for (let i = 8; i <= 22; i++) {
      this.hours.push(i);
    }
    
    // Učitaj vremenske podatke
    this.selectedHour = Math.floor(this.appointmentData.startHour);
    this.selectedMinute = Math.round((this.appointmentData.startHour - this.selectedHour) * 60);
    this.endHour = Math.floor(this.appointmentData.endHour);
    this.endMinute = Math.round((this.appointmentData.endHour - this.endHour) * 60);
    
    // Učitaj ostale podatke
    this.selectedService = this.appointmentData.service?._id || this.appointmentData.service;
    this.selectedClient = this.appointmentData.client?._id || this.appointmentData.client;
    this.selectedFacility = this.appointmentData.facility?._id || this.appointmentData.facility;
  }

  onSave(): void {
    // U preview mode-u ne dozvoli čuvanje
    if (this.isPreviewMode) {
      return;
    }
    
    // Check if facility is selected
    if (!this.selectedFacility) {
      return; // Angular form will show error
    }
    
    this.dialogRef.close({
      service: this.selectedService,
      client: this.selectedClient,
      facility: this.selectedFacility,
      startHour: this.selectedHour + this.selectedMinute / 60,
      endHour: this.endHour + this.endMinute / 60
    });
  }


  onCancel(): void {
    this.dialogRef.close();
  }

  onDelete(): void {
    // U preview mode-u ne dozvoli brisanje
    if (this.isPreviewMode) {
      return;
    }
    
    this.dialogRef.close({ delete: true });
  }
}

