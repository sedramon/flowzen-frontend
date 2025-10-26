import { Component, OnInit } from '@angular/core';
import { Client } from '../../../models/Client';
import { ClientsService } from '../services/clients.service';
import { ActivatedRoute } from '@angular/router';
import { CommonModule, NgSwitchCase } from '@angular/common';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatIconButton, MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { UserAdministrationService } from '../../user-administration/services/user-administration.service';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../models/User';

@Component({
  selector: 'app-client-detail-view',
  standalone: true,
  imports: [
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    FlexLayoutModule,
    CommonModule,
    MatPaginatorModule,
    MatTableModule,
    MatSortModule,
    MatIconModule,
    MatDividerModule,
    MatSnackBarModule,
    MatChipsModule,
    MatDividerModule,
    MatCardModule,
    MatButtonModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    FormsModule,
    ReactiveFormsModule,
    MatIconModule,
    NgSwitchCase
  ],
  templateUrl: './client-detail-view.component.html',
  styleUrl: './client-detail-view.component.scss',
})
/**
 * Client Detail View Component
 * 
 * Komponenta za prikaz i editovanje detalja klijenta.
 * Glavne funkcionalnosti:
 * - Editovanje klijenta (ime, email, telefon, adresa)
 * - Povezivanje klijenta sa User nalogom (mapping Client entity sa User entity)
 * - Diskonektovanje User naloga
 * - Promena povezanog User naloga
 */
export class ClientDetailViewComponent implements OnInit {
  private clientId!: string;
  client!: Client;
  selectedSection: 'details'|'bills'|'appointments'|'remarks' = 'details';
  sectionTitle: string = 'Client Details';
  hasChanged: boolean = false;
  availableUsers: User[] = [];
  allUsers: User[] = [];
  connectedUser: User | null = null;
  isLoadingUsers: boolean = true;

  constructor(
    private clientsService: ClientsService,
    private usersService: UserAdministrationService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.clientId = this.route.snapshot.paramMap.get('id')!;

    this.clientsService.getClientById(this.clientId).subscribe((client) => {
      this.client = client;
      if (client.user) {
        this.loadConnectedUser(client.user);
      }
    });

    // Load available users
    const currentUser = this.authService.getCurrentUser();
    if (currentUser?.tenant) {
      this.loadAllUsers(currentUser.tenant);
    }
  }

  /**
   * Učitava sve dostupne User naloge sa rolom 'client'.
   * Filtrira naloge da prikaže samo one koji NISU povezani sa drugim klijentima.
   */
  loadAllUsers(tenant: string) {
    this.usersService.fetchUsers(tenant).subscribe({
      next: (users: User[]) => {
        this.allUsers = users.filter(u => {
          const role = typeof u.role === 'object' ? u.role.name : u.role;
          return role === 'client' || role === 'Client';
        });

        // Load all clients to check which users are already connected
        const currentUser = this.authService.getCurrentUser();
        if (currentUser?.tenant) {
          this.clientsService.getClientsAll(currentUser.tenant).subscribe({
            next: (clients: Client[]) => {
              // Filter out already connected users (except current user if connected)
              const connectedUserIds = clients
                .filter(c => c.user && c._id !== this.client._id)
                .map(c => c.user);
              
              this.availableUsers = this.allUsers.filter(u => 
                !connectedUserIds.includes(u._id)
              );
              this.isLoadingUsers = false;
            }
          });
        } else {
          this.isLoadingUsers = false;
        }
      }
    });
  }

  loadConnectedUser(userId: string) {
    this.usersService.fetchUsers(this.authService.getCurrentUser()?.tenant!).subscribe({
      next: (users: User[]) => {
        this.connectedUser = users.find(u => u._id === userId) || null;
      }
    });
  }

  /**
   * Povezuje klijenta sa User nalogom.
   * Omogućava User nalog da se prijavi i vidi podatke o klijentu.
   */
  connectUser(userId: string) {
    this.clientsService.connectUserToClient(this.clientId, userId).subscribe({
      next: () => {
        this.showSnackbar('Klijent uspešno povezan sa User nalogom');
        this.clientsService.getClientById(this.clientId).subscribe((client) => {
          this.client = client;
          if (client.user) {
            this.loadConnectedUser(client.user);
          }
        });
        // Refresh available users
        const currentUser = this.authService.getCurrentUser();
        if (currentUser?.tenant) {
          this.loadAllUsers(currentUser.tenant);
        }
      },
      error: (error) => {
        console.error('Error connecting user:', error);
        this.showSnackbar('Greška pri povezivanju', true);
      }
    });
  }

  /**
   * Diskonektuje User nalog od klijenta.
   * Nakon diskonektovanja, User nalog više neće moći da pristupi klijent podacima.
   */
  disconnectUser() {
    this.clientsService.disconnectUserFromClient(this.clientId).subscribe({
      next: () => {
        this.showSnackbar('User nalog uspešno diskonektovan');
        this.client.user = undefined;
        this.connectedUser = null;
        // Refresh available users
        const currentUser = this.authService.getCurrentUser();
        if (currentUser?.tenant) {
          this.loadAllUsers(currentUser.tenant);
        }
      },
      error: (error) => {
        console.error('Error disconnecting user:', error);
        this.showSnackbar('Greška pri diskonektovanju', true);
      }
    });
  }

  goBack(): void {
    window.history.back();
  }

  selectSection(section: 'details'|'bills'|'appointments'|'remarks') {
    this.selectedSection = section;
    switch (section) {
      case 'details':
        this.sectionTitle = 'Client Details';
        break;
      case 'bills':
        this.sectionTitle = 'Client Bills';
        break;
      case 'appointments':
        this.sectionTitle = 'Client Appointments';
        break;
      case 'remarks':
        this.sectionTitle = 'Client Remarks';
        break;
    }
  }

  saveClient() {
    this.clientsService
      .updateClient(this.client._id!, this.client)
      .subscribe((updatedClient) => {
        this.client = updatedClient;
        this.hasChanged = false;
        this.showSnackbar(`Client "${this.client.firstName} ${this.client.lastName}" updated successfully`);
      })
  }

  showSnackbar(message: string, isError: boolean = false) {
    this.snackBar.open(message, 'Close', {
      duration: 3000, // 3 seconds
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
      panelClass: isError ? ['snackbar-error'] : ['snackbar-success'] // Ensure it's an array
    });
  }
}
