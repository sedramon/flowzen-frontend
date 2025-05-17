import { AfterViewInit, Component, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { Observable, of } from 'rxjs';
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
import { MatFormField, MatFormFieldModule, MatLabel } from '@angular/material/form-field';
import { MatOption } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { CreateClientDialogComponent } from './dialogs/create-client-dialog/create-client-dialog.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-clients',
  standalone: true,
  imports: [MatFormFieldModule, MatInputModule, MatSelectModule, FlexLayoutModule, CommonModule, MatPaginatorModule, MatTableModule, MatSortModule, MatIconModule, MatIconButton, MatDividerModule, MatSnackBarModule, MatChipsModule, MatDividerModule, MatCardModule, MatButtonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './clients.component.html',
  styleUrl: './clients.component.scss'
})
export class ClientsComponent implements OnInit, AfterViewInit {
  dataSourceClients = new MatTableDataSource<Client>([]);
  displayedColumnsClients: string[] = ['firstName', 'lastName', 'contactEmail', 'contactPhone', 'createdAt', 'updatedAt', 'actions'];
  selectedStatus: string = '';

  searchQuery = '';

  @ViewChildren(MatPaginator) paginators!: QueryList<MatPaginator>;
  @ViewChild('clientSort')
  set clientSort(ms: MatSort) {
    if (ms) {
      this.dataSourceClients.sort = ms;
    }
  }


  constructor(
    private clientsService: ClientsService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.clientsService.getAllClients().subscribe(clients => {
      this.dataSourceClients.data = clients;

      // set up combined search+status filter
      this.dataSourceClients.filterPredicate = (data: Client) => {
        const matchesName =
          data.firstName.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          data.lastName.toLowerCase().includes(this.searchQuery.toLowerCase());


        return matchesName;
      };
    });
  }

  ngAfterViewInit() {
    if (this.paginators.length) {
      this.dataSourceClients.paginator = this.paginators.first;
    }
  }

  applyFilter() {
    this.dataSourceClients.filter = '' + Math.random();
  }

  clearFilters() {
    this.searchQuery = '';
    this.applyFilter();
  }

  // stub methods for dialogs/actions
  openAddClientDialog() { 
    const dialogRef = this.dialog.open(CreateClientDialogComponent, {
      width: '600px'
    })

    dialogRef.afterClosed().subscribe((client) => {
      if (client) {
        this.clientsService.createClient(client).subscribe(
          (createdClient) => {
            this.showSnackbar(`Client "${client.firstName} ${client.lastName}" created successfully`);
            this.dataSourceClients.data = [...this.dataSourceClients.data, createdClient];
          },
          (error) => {
            console.error('Error creating client:', error);
            this.showSnackbar('Failed to create client', true);
          }
        );
      }
    });
   }


  openEditClientDialog(client: Client) { /* … */ }
  deleteClient(client: Client) { /* … */ }

  openClientDetailView(client: Client) {
    this.router.navigate(['/clients', client._id]);
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
