/**
 * Waitlist Entry Model
 * 
 * Interface za listu čekanja kada termini nisu dostupni.
 * 
 * Polja:
 * - client: Klijent koji čeka termin
 * - employee: Zaposleni za koga se čeka
 * - service: Usluga za koju se čeka
 * - facility: Lokacija
 * - date: Preferirani datum
 * - startHour/endHour: Preferirano vreme
 * - isNotified: Da li je klijent obavešten da je termin dostupan
 * - claimToken: Unique token za prihvatanje termina
 * - isClaimed: Da li je termin već prihvaćen
 */
import { Client } from './Client';
import { Employee } from './Employee';
import { Facility } from './Facility';
import { Service } from './Service';
import { Tenant } from './Tenant';

export interface WaitlistEntry {
  id: string;
  client: Client;
  employee: Employee;
  facility: Facility;
  service: Service;
  tenant: Tenant;
  date: string;
  startHour: number;
  endHour: number;
  isNotified: boolean;
  notificationSentAt?: Date;
  claimToken?: string;
  claimExpiresAt?: Date;
  isClaimed: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
