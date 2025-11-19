import { Component, OnInit } from '@angular/core';
import { Client } from '../../../models/Client';
import { ClientsService } from '../services/clients.service';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserAdministrationService } from '../../user-administration/services/user-administration.service';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../models/User';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { DividerModule } from 'primeng/divider';
import { MenuModule } from 'primeng/menu';
import { MenuItem } from 'primeng/api';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { FloatLabelModule } from 'primeng/floatlabel';

@Component({
  selector: 'app-client-detail-view',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    CardModule,
    InputTextModule,
    ToastModule,
    DividerModule,
    MenuModule,
    ProgressSpinnerModule,
    FloatLabelModule
  ],
  providers: [MessageService],
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
  sectionTitle: string = 'Detalji klijenta';
  hasChanged: boolean = false;
  availableUsers: User[] = [];
  allUsers: User[] = [];
  connectedUser: User | null = null;
  isLoadingUsers: boolean = true;
  userMenuItems: MenuItem[] = [];

  constructor(
    private clientsService: ClientsService,
    private usersService: UserAdministrationService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private messageService: MessageService
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
    const tenantId = this.authService.getCurrentTenantId();
    if (tenantId) {
      this.loadAllUsers(tenantId);
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
        const tenantId = this.authService.getCurrentTenantId();
        if (tenantId) {
          this.clientsService.getClientsAll(tenantId).subscribe({
            next: (clients: Client[]) => {
              // Filter out already connected users (except current user if connected)
              const connectedUserIds = clients
                .filter(c => c.user && c._id !== this.client._id)
                .map(c => c.user);
              
              this.availableUsers = this.allUsers.filter(u => 
                !connectedUserIds.includes(u._id)
              );
              this.buildUserMenuItems();
              this.isLoadingUsers = false;
            }
          });
        } else {
          this.isLoadingUsers = false;
        }
      }
    });
  }

  buildUserMenuItems() {
    this.userMenuItems = this.availableUsers.map(user => ({
      label: user.name,
      icon: 'pi pi-user',
      command: () => this.connectUser(user._id!)
    }));
  }

  loadConnectedUser(userId: string) {
    const tenantId = this.authService.getCurrentTenantId();
    if (!tenantId) {
      throw new Error('Tenant ID nije dostupan za trenutno prijavljenog korisnika.');
    }
    this.usersService.fetchUsers(tenantId).subscribe({
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
        this.showToast('Klijent uspešno povezan sa User nalogom');
        this.clientsService.getClientById(this.clientId).subscribe((client) => {
          this.client = client;
          if (client.user) {
            this.loadConnectedUser(client.user);
          }
        });
        // Refresh available users
        const tenantId = this.authService.getCurrentTenantId();
        if (tenantId) {
          this.loadAllUsers(tenantId);
        }
      },
      error: (error) => {
        console.error('Error connecting user:', error);
        this.showToast('Greška pri povezivanju', true);
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
        this.showToast('User nalog uspešno diskonektovan');
        this.client.user = undefined;
        this.connectedUser = null;
        // Refresh available users
        const tenantId = this.authService.getCurrentTenantId();
        if (tenantId) {
          this.loadAllUsers(tenantId);
        }
      },
      error: (error) => {
        console.error('Error disconnecting user:', error);
        this.showToast('Greška pri diskonektovanju', true);
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
        this.sectionTitle = 'Detalji klijenta';
        break;
      case 'bills':
        this.sectionTitle = 'Računi klijenta';
        break;
      case 'appointments':
        this.sectionTitle = 'Termini klijenta';
        break;
      case 'remarks':
        this.sectionTitle = 'Napomene o klijentu';
        break;
    }
  }

  saveClient() {
    this.clientsService
      .updateClient(this.client._id!, this.client)
      .subscribe((updatedClient) => {
        this.client = updatedClient;
        this.hasChanged = false;
        this.showToast(`Klijent "${this.client.firstName} ${this.client.lastName}" uspešno ažuriran`);
      })
  }

  showToast(message: string, isError: boolean = false) {
    this.messageService.add({
      severity: isError ? 'error' : 'success',
      summary: isError ? 'Greška' : 'Uspešno',
      detail: message,
      life: 3000
    });
  }
}
