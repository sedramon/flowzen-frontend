import { AfterViewInit, Component, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { SuppliersService } from './services/suppliers.service';
import { AuthService } from '../../core/services/auth.service';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatNoDataRow, MatTableDataSource, MatTableModule } from '@angular/material/table';
import { Supplier } from '../../models/Supplier';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDeleteDialogComponent } from '../../dialogs/confirm-delete-dialog/confirm-delete-dialog.component';
import { catchError, EMPTY, filter, switchMap, tap } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { EditCreateSupplierDialog } from './dialogs/edit-create-supplier-dialog/edit-create-supplier-dialog';

@Component({
  selector: 'app-suppliers',
  imports: [
    CommonModule,
    MatCardModule,
    FlexLayoutModule, 
    MatIconModule, 
    MatDividerModule, 
    MatFormFieldModule, 
    MatInputModule, 
    MatButtonModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatIconModule
  ],
  templateUrl: './suppliers.html',
  styleUrl: './suppliers.scss'
})
export class Suppliers implements OnInit, AfterViewInit {
  dataSourceSuppliers = new MatTableDataSource<Supplier>([]);
  displayedColumnsSuppliers = ['name', 'address', 'contactEmail', 'contactPhone', 'actions'];

  @ViewChildren(MatPaginator) paginators!: QueryList<MatPaginator>;
  @ViewChild('suppliersSort')
  set suppliersSort(ms: MatSort) {
    if (ms) {
      this.dataSourceSuppliers.sort = ms;
    }
  }


  constructor(private suppliersService: SuppliersService, private authService: AuthService, private dialog: MatDialog, private snackBar: MatSnackBar) { }
  
  ngOnInit(): void {
    this.suppliersService.getAllSuppliers(this.authService.getCurrentUser()!.tenant).subscribe(
      s => this.dataSourceSuppliers.data = s
    );
  }

  ngAfterViewInit(): void {
    if (this.paginators.length) {
      this.dataSourceSuppliers.paginator = this.paginators.first;
    }
  }

  applyFilters() { }

  editSupplier(supplier: Supplier){
    const dialogRef = this.dialog.open(EditCreateSupplierDialog, {
      width: '600px',
      data: supplier
    })

    dialogRef.afterClosed().pipe(
      filter(result => !!result),
      switchMap((result) => this.suppliersService.updateSupplier(supplier._id!, result)),
      tap((updateSupplier) => {
        this.snackBar.open('Supplier update succesfully', 'Okay', {duration: 2000})
        this.dataSourceSuppliers.data = this.dataSourceSuppliers.data.map(s => s._id === supplier._id ? updateSupplier : s);
      }),
      catchError(err => {
        console.error('Error updating supplier:', err);
        this.snackBar.open('Failed to update supplier', 'Okay', {duration: 2000});
        return EMPTY;
      })
    ).subscribe();
  }

  deleteSupplier(supplier: Supplier) {
    const dialogRef = this.dialog.open(ConfirmDeleteDialogComponent, {
      width: '500px',
      height: '250px'
    })

    dialogRef.afterClosed().pipe(
      filter(confirmed => !!confirmed),
      switchMap(() => this.suppliersService.deleteSupplier(supplier._id!)),
      tap(() => {
        this.snackBar.open('Supplier deleted succesfully', 'Okay', {duration: 2000});
        this.dataSourceSuppliers.data = this.dataSourceSuppliers.data.filter(s => s._id !== supplier._id);
      }),
      catchError(err => {
        console.error('Error deleteing supplier:', err);
        this.snackBar.open('Failed to delete supplier', 'Okay', {duration: 2000})
        return EMPTY;
      })
    ).subscribe();
  }

  activitySupplier(){}

  addSuplier(){
    const dialogRef = this.dialog.open(EditCreateSupplierDialog,{
      width: '600px'
    })

    dialogRef.afterClosed().pipe(
      filter(result => !!result),
      switchMap((result) => this.suppliersService.createSupplier(result)),
      tap((newSupplier) => {
        this.snackBar.open('Supplier created succesfully', 'Okay', {duration: 2000});
        this.dataSourceSuppliers.data = [
          ...this.dataSourceSuppliers.data,
          newSupplier
        ]
      }),
      catchError(err => {
        console.error('Error creating supplier:', err);
        this.snackBar.open('Failed to create supplier', 'Okay', {duration: 2000});
        return EMPTY;
      })
    ).subscribe();
  }
}
