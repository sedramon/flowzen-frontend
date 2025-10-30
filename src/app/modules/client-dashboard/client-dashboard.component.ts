import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';

import { AuthService } from '../../core/services/auth.service';
import { AppointmentsService } from '../appointments/services/appointment.service';
import { ClientsService } from '../clients/services/clients.service';
import { JoinWaitlistDialogComponent } from './dialogs/join-waitlist-dialog/join-waitlist-dialog.component';
import { ConfirmDeleteDialogComponent } from '../../dialogs/confirm-delete-dialog/confirm-delete-dialog.component';
import { Appointment } from '../../models/Appointment';
import { WaitlistEntry } from '../../models/WaitlistEntry';

@Component({
  selector: 'app-client-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDialogModule,
    MatSnackBarModule
  ],
  templateUrl: './client-dashboard.component.html',
  styleUrl: './client-dashboard.component.scss'
})
/**
 * Client Dashboard Component
 * 
 * Glavna komponenta za self-service klijent funkcionalnost.
 * Omogućava klijentima da:
 * - Vide svoje zakazane termine
 * - Zakazuju nove termine
 * - Otkazuju termine
 * - Prijave se na listu čekanja (waitlist)
 * - Prihvataju ponuđene termine sa liste čekanja
 * 
 * Auto-refresh: Dashboard se automatski osvežava svakih 15 sekundi
 */
export class ClientDashboardComponent implements OnInit, OnDestroy {
  user: any;
  appointments: Appointment[] = [];
  waitlistEntries: WaitlistEntry[] = [];
  private refreshInterval: any;

  constructor(
    private authService: AuthService,
    private appointmentService: AppointmentsService,
    private clientsService: ClientsService,
    private snackBar: MatSnackBar,
    private router: Router,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.user = this.authService.getCurrentUser();
    this.loadAppointments();
    this.loadWaitlistEntries();
    
    // Auto-refresh svakih 15 sekundi
    this.refreshInterval = setInterval(() => {
      this.loadAppointments();
      this.loadWaitlistEntries();
    }, 15000);
  }

  ngOnDestroy(): void {
    // Očisti interval kada se komponenta uništi
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  /**
   * Učitava appointmente za prijavljenog klijenta.
   * Prvo pronalazi Client profil povezan sa trenutnim User nalogom,
   * zatim učitava sve appointmente za tog klijenta.
   */
  loadAppointments(): void {
    const user = this.authService.getCurrentUser();
    
    if (!user || !user.userId || !user.tenant) {
      console.log('No user logged in');
      this.appointments = [];
      return;
    }
    
    const userId = user.userId;
    const tenantId = user.tenant;
    
    // Get client ID connected to this user
    this.clientsService.getClientByUserId(userId).subscribe({
      next: (client: any) => {
        if (!client) {
          console.log('No client profile found for this user');
          this.appointments = [];
          return;
        }

        // Load appointments for this client
        this.appointmentService.getClientAppointments(client._id || client.id, tenantId!).subscribe({
          next: (appointments: any[]) => {
            this.appointments = appointments;
          },
          error: (error: any) => {
            console.error('Error loading appointments:', error);
          }
        });
      },
      error: (error: any) => {
        console.error('Error loading client profile:', error);
      }
    });
  }

  /**
   * Učitava sve waitlist entries za prijavljenog klijenta.
   * Waitlist entries su termini za koje se klijent prijavio da čeka.
   */
  loadWaitlistEntries(): void {
    const user = this.authService.getCurrentUser();
    
    if (!user || !user.userId || !user.tenant) {
      this.waitlistEntries = [];
      return;
    }
    
    // Get client ID connected to this user
    this.clientsService.getClientByUserId(user.userId).subscribe({
      next: (client: any) => {
        if (!client) {
          this.waitlistEntries = [];
          return;
        }

        const clientId = client._id || client.id;
        
        this.appointmentService.getClientWaitlist(clientId).subscribe({
          next: (entries: any[]) => {
            this.waitlistEntries = entries.map((entry: any) => ({
              id: entry._id || entry.id,
              client: entry.client,
              employee: entry.employee,
              facility: entry.facility,
              service: entry.service,
              tenant: entry.tenant,
              date: entry.preferredDate,
              startHour: entry.preferredStartHour,
              endHour: entry.preferredEndHour,
              isNotified: entry.isNotified,
              isClaimed: entry.isClaimed,
              claimToken: entry.claimToken,
              createdAt: entry.createdAt,
              updatedAt: entry.updatedAt,
              slotStatus: entry.slotStatus,
              isSlotOccupied: entry.isSlotOccupied
            }));
          },
          error: (error: any) => {
            console.error('Error loading waitlist entries:', error);
          }
        });
      },
      error: (error: any) => {
        console.error('Error loading client profile:', error);
      }
    });
  }

  /**
   * Formatira datum u srpskom formatu (dd.mm.yyyy)
   */
  formatDate(date: string | Date): string {
    const d = new Date(date);
    return d.toLocaleDateString('sr-RS');
  }

  /**
   * Formatira sat (broj) u format HH:MM (npr. 14.5 -> "14:30")
   */
  formatTime(hour: number): string {
    const h = Math.floor(hour);
    const m = Math.round((hour - h) * 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  cancelAppointment(appointment: Appointment): void {
    const dialogRef = this.dialog.open(ConfirmDeleteDialogComponent, {
      data: { message: 'Da li ste sigurni da želite da otkažete ovaj termin?' }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.appointmentService.cancelAppointment(appointment.id!).subscribe({
          next: () => {
            this.snackBar.open('Termin je otkazan', 'Zatvori', { duration: 3000 });
            
            // Instant refresh za appointments i waitlist (vidi se slot status odmah)
            this.loadAppointments();
            this.loadWaitlistEntries();
            
            // Delayed refresh za waitlist da backend stigne da završi notifikaciju
            // Backend automatski notifikuje waitlist nakon otkazivanja,
            // ali treba vreme da se proces završi i update-uje isNotified: true
            // Ovaj drugi refresh omogućava da dugme "Prihvati termin" postane enabled
            setTimeout(() => {
              this.loadWaitlistEntries();
            }, 1500);
          },
          error: (error: any) => {
            this.snackBar.open('Greška pri otkazivanju termina', 'Zatvori', { duration: 3000 });
            console.error('Error canceling appointment:', error);
          }
        });
      }
    });
  }

  joinWaitlist(): void {
    const dialogRef = this.dialog.open(JoinWaitlistDialogComponent, {
      width: '550px',
      maxWidth: '90vw'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadWaitlistEntries();
      }
    });
  }

  /**
   * Prihvata termin sa waitlista kada se oslobodi.
   * claimToken se generiše kada termin postane dostupan i klijent biva obavešten.
   */
  claimAppointment(entry: WaitlistEntry): void {
    if (!entry.claimToken) {
      this.snackBar.open('Nemate novih ponuda za termin', 'Zatvori', { duration: 3000 });
      return;
    }

    const dialogRef = this.dialog.open(ConfirmDeleteDialogComponent, {
      data: { message: 'Da li želite da prihvatite ovaj termin?' }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const user = this.authService.getCurrentUser();
        
        // Get client ID connected to this user
        this.clientsService.getClientByUserId(user?.userId!).subscribe({
          next: (client: any) => {
            if (!client) {
              this.snackBar.open('Klijent profil nije pronađen', 'Zatvori', { duration: 3000 });
              return;
            }

            const clientId = client._id || client.id;
            
            this.appointmentService.claimAppointmentFromWaitlist(entry.claimToken!, clientId).subscribe({
              next: (response: any) => {
                if (response.success) {
                  this.snackBar.open('Termin je uspešno zakazan!', 'Zatvori', { duration: 3000 });
                  this.loadAppointments();
                  this.loadWaitlistEntries();
                } else {
                  this.snackBar.open(response.message || 'Greška pri prihvatanju termina', 'Zatvori', { duration: 3000 });
                }
              },
              error: (error: any) => {
                this.snackBar.open('Greška pri prihvatanju termina', 'Zatvori', { duration: 3000 });
                console.error('Error claiming appointment:', error);
              }
            });
          },
          error: (error: any) => {
            console.error('Error loading client profile:', error);
            this.snackBar.open('Greška pri učitavanju klijent profila', 'Zatvori', { duration: 3000 });
          }
        });
      }
    });
  }

  removeFromWaitlist(entry: WaitlistEntry): void {
    const dialogRef = this.dialog.open(ConfirmDeleteDialogComponent, {
      data: { message: 'Da li ste sigurni da želite da se uklonite sa liste čekanja?' }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const user = this.authService.getCurrentUser();
        
        // Get client ID connected to this user
        this.clientsService.getClientByUserId(user?.userId!).subscribe({
          next: (client: any) => {
            if (!client) {
              this.snackBar.open('Klijent profil nije pronađen', 'Zatvori', { duration: 3000 });
              return;
            }

            const clientId = client._id || client.id;
            
            this.appointmentService.removeFromWaitlist(entry.id, clientId).subscribe({
              next: () => {
                this.snackBar.open('Uklonjeni ste sa liste čekanja', 'Zatvori', { duration: 3000 });
                this.loadWaitlistEntries();
              },
              error: (error: any) => {
                this.snackBar.open('Greška pri uklanjanju sa liste čekanja', 'Zatvori', { duration: 3000 });
                console.error('Error removing from waitlist:', error);
              }
            });
          },
          error: (error: any) => {
            console.error('Error loading client profile:', error);
            this.snackBar.open('Greška pri učitavanju klijent profila', 'Zatvori', { duration: 3000 });
          }
        });
      }
    });
  }
}