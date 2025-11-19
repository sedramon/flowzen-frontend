import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Subscription, tap } from 'rxjs';
import { Client } from '../../models/Client';
import { ClientsService } from './services/clients.service';
import { MatDialog } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CreateClientDialogComponent } from './dialogs/create-client-dialog/create-client-dialog.component';
import { Router } from '@angular/router';
import { ConfirmDeleteDialogComponent } from '../../dialogs/confirm-delete-dialog/confirm-delete-dialog.component';
import { AuthService } from '../../core/services/auth.service';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TooltipModule } from 'primeng/tooltip';
import { Paginator, PaginatorModule } from 'primeng/paginator';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';

@Component({
  selector: 'app-clients',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    CardModule,
    ToastModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    TooltipModule,
    PaginatorModule,
    DatePickerModule,
    SelectModule
  ],
  providers: [MessageService],
  templateUrl: './clients.component.html',
  styleUrl: './clients.component.scss',
})
export class ClientsComponent implements OnInit, OnDestroy {
  clients: Client[] = [];
  
  sortBy: string = '';
  sortDir: 'asc' | 'desc' = 'desc';

  sortOptions = [
    { label: 'Ime', value: 'firstName' },
    { label: 'Prezime', value: 'lastName' },
    { label: 'Kreirano', value: 'createdAt' },
    { label: 'Ažurirano', value: 'updatedAt' },
  ];

  totalItems = 0;
  searchQuery = '';
  createdFrom?: Date;
  createdTo?: Date;
  
  // Pagination
  currentPage = 0;
  pageSize = 10;

  private tenantId!: string;
  private subs = new Subscription();

  @ViewChild('paginator') paginator!: Paginator;

  constructor(
    private clientsService: ClientsService,
    private dialog: MatDialog,
    private messageService: MessageService,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    const tenantId = this.authService.getCurrentTenantId();
    if (!tenantId) {
      throw new Error('Tenant ID nije dostupan za trenutno prijavljenog korisnika.');
    }
    this.tenantId = tenantId;
    
    // Initial load
    this.loadPage();
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }

  loadPage() {
    const page = this.currentPage + 1;
    const limit = this.pageSize;

    this.clientsService
      .getClients(
        this.tenantId,
        this.searchQuery,
        page,
        limit,
        this.sortBy,
        this.sortDir,
        this.createdFrom,
        this.createdTo
      )
      .subscribe(({ data, total }) => {
        this.clients = data;
        this.totalItems = total;
      });
  }

  onPageChange(event: any) {
    this.currentPage = event.page;
    this.pageSize = event.rows;
    this.loadPage();
  }

  onSearchClick() {
    this.currentPage = 0;
    this.loadPage();
  }
  
  onDateRangeChange() {
    this.currentPage = 0;
    this.loadPage();
  }

  onSortChange() {
    this.currentPage = 0;
    this.loadPage();
  }

  clearFilters() {
    this.searchQuery = '';
    this.createdFrom = undefined;
    this.createdTo = undefined;
    this.sortBy = '';
    this.sortDir = 'desc';
    this.currentPage = 0;
    this.loadPage();
  }

  openAddClientDialog() {
    const dialogRef = this.dialog.open(CreateClientDialogComponent, {
      panelClass: 'admin-dialog-panel',
      backdropClass: 'custom-backdrop',
    });

    dialogRef.afterClosed().subscribe((client) => {
      if (client) {
        this.clientsService.createClient(client).subscribe(
          (createdClient) => {
            this.showToast(
              `Klijent "${client.firstName} ${client.lastName}" uspešno kreiran`
            );
            this.loadPage(); // Reload to refresh data
          },
          (error) => {
            console.error('Error creating client:', error);
            this.showToast('Neuspešno kreiranje klijenta', true);
          }
        );
      }
    });
  }

  deleteClient(id: string) {
    const dialogRef = this.dialog.open(ConfirmDeleteDialogComponent, {
      panelClass: 'admin-dialog-panel',
      backdropClass: 'custom-backdrop',
      data: {
        title: 'Brisanje klijenta',
        message: `Da li ste sigurni da želite da obrišete ovog klijenta?`,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.clientsService.deleteClient(id).subscribe(
          () => {
            this.showToast('Klijent uspešno obrisan');
            this.loadPage(); // Reload to refresh data
          },
          (error) => {
            console.error('Error deleting client:', error);
            this.showToast('Neuspešno brisanje klijenta', true);
          }
        );
      }
    });
  }

  openClientDetailView(client: Client) {
    this.router.navigate(['/clients', client._id]);
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
