import { Client } from "./Client";
import { Employee } from "./Employee";
import { Service } from "./Service";
import { Tenant } from "./Tenant";

export interface Appointment {
    id?: string;
    employee: Employee;
    client: Client;
    tenant: Tenant;
    service: Service;
    startHour: number;
    endHour: number;
    date: string;
}

export interface UpdateAndCreateAppointmentDto {
  employee: string;
  client:   string;
  service:  string;
  tenant:   string;
  date:     string;
  startHour: number;
  endHour:   number;
}