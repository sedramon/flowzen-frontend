import {
  Component, OnInit, OnDestroy, ElementRef, ViewChild,
  ViewChildren,
  QueryList,
  AfterViewInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ServicesService } from './services/services.service';
import { AuthService } from '../../core/services/auth.service';
import { Service } from '../../models/Service';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDeleteDialogComponent } from '../../dialogs/confirm-delete-dialog/confirm-delete-dialog.component';
import { CreateServiceDialogComponent } from './dialogs/create-service-dialog/create-service-dialog.component';
import { MatChipsModule } from '@angular/material/chips';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { catchError, EMPTY, filter, switchMap, tap } from 'rxjs';


@Component({
  selector: 'app-services',
  standalone: true,
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    FlexLayoutModule,
    MatCardModule,
    MatIconModule,
    MatDividerModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatButtonModule,
    MatChipsModule,
    ReactiveFormsModule,
    FormsModule
  ],
  templateUrl: './services.component.html',
  styleUrls: ['./services.component.scss'],
  animations: [
  ]
})
export class ServicesComponent implements OnInit, AfterViewInit, OnDestroy {
  dataSourceServices = new MatTableDataSource<Service>([]);
  displayedColumnsServices: string[] = ['name', 'price', 'durationMinutes', 'active', 'actions'];

  searchQuery: string = '';

  @ViewChildren(MatPaginator) paginators!: QueryList<MatPaginator>;
  @ViewChild('servicesSort')
  set servicesSort(ms: MatSort) {
    if (ms) {
      this.dataSourceServices.sort = ms;
    }
  }



  constructor(
    private servicesService: ServicesService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) { }


  ngOnInit() {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      // Ako iz nekog razloga korisnik nije dostupan, uradi fallback (npr. redirect ili error)
      return;
    }

    this.servicesService.getAllServices(currentUser.tenant!).subscribe(services => {
      this.dataSourceServices.data = services;

      this.dataSourceServices.filterPredicate = (data: Service) => {
        const matchesName = data.name.toLowerCase().includes(this.searchQuery.toLowerCase());

        return matchesName;
      }
    });

  }

  ngAfterViewInit(): void {
    if (this.paginators.length) {
      this.dataSourceServices.paginator = this.paginators.first;
    }
  }

  ngOnDestroy() {

  }

  applyFilter() {
    this.dataSourceServices.filter = '' + Math.random();
  }

  clearFilters() {
    this.searchQuery = '';
    this.applyFilter();
  }

  deleteService(service: Service) {
    const dialogRef = this.dialog.open(ConfirmDeleteDialogComponent, {
      width: '500px',
      height: '250px',
      data: {
        title: 'Delete Facility',
        message: `Are you sure you want to delete ${service.name}?`,
      },
    })

    dialogRef.afterClosed().pipe(
      filter(confirmed => !!confirmed),
      switchMap(() => this.servicesService.deleteService(service._id!)),
      tap(() => {
        this.showSnackbar(`Service ${service.name} deleted succesfully!`)
        this.dataSourceServices.data = this.dataSourceServices.data.filter(s => s._id !== service._id)
      }),
      catchError(err => {
        console.error('Error deleting service', err)
        this.showSnackbar(`Failed to delete ${service.name} service`, true);
        return EMPTY;
      })
    ).subscribe();
  }

  /** Called when you click the “+” button or the “edit” icon */
  addOrEditService(serviceToEdit?: Service): void {
  const dialogRef = this.dialog.open(CreateServiceDialogComponent, {
    width: '600px',
    data: serviceToEdit ?? null
  });

  dialogRef.afterClosed().pipe(
    filter(result => !!result),
    switchMap((result) =>
      serviceToEdit
        ? this.servicesService.updateService(serviceToEdit._id!, result)
        : this.servicesService.createService(result)
    ),
    tap((saved) => {
      if (serviceToEdit) {
        const data = [...this.dataSourceServices.data];
        const idx = data.findIndex(s => s._id === saved._id);
        if (idx > -1) data[idx] = saved;
        this.dataSourceServices.data = data;
        this.showSnackbar(`Service "${saved.name}" updated successfully`);
      } else {
        this.dataSourceServices.data = [
          ...this.dataSourceServices.data,
          saved
        ];
        this.showSnackbar(`Service "${saved.name}" created successfully`);
      }
    }),
    catchError(err => {
      console.error('Service save failed:', err);
      this.showSnackbar(
        `Failed to ${serviceToEdit ? 'update' : 'create'} service`,
        true
      );
      return EMPTY;
    })
  )
  .subscribe();
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
