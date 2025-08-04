import { Client } from './Client';
import { Employee } from './Employee';
import { Service } from './Service';
import { Tenant } from './Tenant';
import { Facility } from './Facility';

export interface Appointment {
  id?: string;
  employee: Employee;
  client: Client;
  service: Service;
  tenant: Tenant;
  facility: Facility;
  startHour: number;
  endHour: number;
  date: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UpdateAndCreateAppointmentDto {
  employee: string;
  client: string;
  service: string;
  tenant: string;
  facility: string;
  startHour: number;
  endHour: number;
  date: string;
}