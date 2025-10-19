import {
  AfterViewInit,
  Component,
  OnDestroy,
  OnInit,
  QueryList,
  ViewChild,
  ViewChildren,
} from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { Observable, of, Subscription, tap } from 'rxjs';
import { Client } from '../../models/Client';
import { ClientsService } from './services/clients.service';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatIconButton, MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatOption, provideNativeDateAdapter } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { CreateClientDialogComponent } from './dialogs/create-client-dialog/create-client-dialog.component';
import { Router } from '@angular/router';
import { ConfirmDeleteDialogComponent } from '../../dialogs/confirm-delete-dialog/confirm-delete-dialog.component';
import { AuthService } from '../../core/services/auth.service';
import { PagedResponse } from '../../models/PagedResponse';
import {
  MatDatepicker,
  MatDatepickerModule,
  MatDateRangePicker,
} from '@angular/material/datepicker';

@Component({
  selector: 'app-clients',
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
    MatIconButton,
    MatDividerModule,
    MatSnackBarModule,
    MatChipsModule,
    MatDividerModule,
    MatCardModule,
    MatButtonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDatepickerModule,
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './clients.component.html',
  styleUrl: './clients.component.scss',
})
export class ClientsComponent implements OnInit, AfterViewInit, OnDestroy {
  dataSourceClients = new MatTableDataSource<Client>([]);
  displayedColumnsClients: string[] = [
    'firstName',
    'lastName',
    'contactEmail',
    'contactPhone',
    'createdAt',
    'updatedAt',
    'actions',
  ];

  sortBy: string = '';
  sortDir: 'asc' | 'desc' = 'desc';

  sortOptions = [
    { value: 'firstName', view: 'First Name' },
    { value: 'lastName', view: 'Last Name' },
    { value: 'createdAt', view: 'Created At' },
    { value: 'updatedAt', view: 'Updated At' },
  ];

  totalItems = 0;
  searchQuery = '';
  createdFrom?: Date;
  createdTo?: Date;

  private tenantId!: string;
  private subs = new Subscription();

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private clientsService: ClientsService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    const user = this.authService.getCurrentUser();
    if (!user) return;
    this.tenantId = user.tenant!;
  }

  ngAfterViewInit() {
    // paginator
    this.subs.add(
      this.paginator.page.pipe(tap(() => this.loadPage())).subscribe()
    );

    // initial load
    this.loadPage();
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }

  loadPage() {
  const page  = this.paginator.pageIndex + 1;
  const limit = this.paginator.pageSize || 25;

  this.clientsService
    .getClients(
      this.tenantId,
      this.searchQuery,
      page,
      limit,
      this.sortBy,     // send from dropdown
      this.sortDir,    // send from dropdown
      this.createdFrom,
      this.createdTo
    )
    .subscribe(({ data, total }) => {
      this.dataSourceClients.data = data;
      this.totalItems             = total;
    });
}

  onSearchClick() {
    this.paginator.firstPage();
    this.loadPage();
  }
  onDateRangeChange(from: Date | null, to: Date | null) {
    this.createdFrom = from ?? undefined;
    this.createdTo = to ?? undefined;
    this.paginator.firstPage();
    this.loadPage();
  }

  onSortChange() {
    this.paginator.firstPage();
    this.loadPage();
  }

  clearFilters() {
    this.searchQuery = '';
    this.createdFrom = undefined;
    this.createdTo = undefined;
    this.paginator.firstPage();
    this.loadPage();
  }

  // stub methods for dialogs/actions
  openAddClientDialog() {
    const dialogRef = this.dialog.open(CreateClientDialogComponent, {
      width: '600px',
    });

    dialogRef.afterClosed().subscribe((client) => {
      if (client) {
        this.clientsService.createClient(client).subscribe(
          (createdClient) => {
            this.showSnackbar(
              `Client "${client.firstName} ${client.lastName}" created successfully`
            );
            this.dataSourceClients.data = [
              ...this.dataSourceClients.data,
              createdClient,
            ];
          },
          (error) => {
            console.error('Error creating client:', error);
            this.showSnackbar('Failed to create client', true);
          }
        );
      }
    });
  }

  deleteClient(id: string) {
    const dialogRef = this.dialog.open(ConfirmDeleteDialogComponent, {
      width: '500px',
      height: '250px',
      data: {
        title: 'Delete Facility',
        message: `Are you sure you want to delete?`,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.clientsService.deleteClient(id).subscribe(
          () => {
            this.showSnackbar(`Client deleted successfully`);
            this.dataSourceClients.data = this.dataSourceClients.data.filter(
              (client) => client._id !== id
            );
          },
          (error) => {
            console.error('Error deleting client:', error);
            this.showSnackbar('Failed to delete client', true);
          }
        );
      }
    });
  }

  openClientDetailView(client: Client) {
    this.router.navigate(['/clients', client._id]);
  }

  showSnackbar(message: string, isError: boolean = false) {
    this.snackBar.open(message, 'Close', {
      duration: 3000, // 3 seconds
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
      panelClass: isError ? ['snackbar-error'] : ['snackbar-success'], // Ensure it's an array
    });
  }
}
