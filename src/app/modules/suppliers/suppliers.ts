import { Component, OnInit } from '@angular/core';
import { SuppliersService } from './services/suppliers.service';
import { AuthService } from '../../core/services/auth.service';
import { CommonModule } from '@angular/common';
import { Supplier } from '../../models/Supplier';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDeleteDialogComponent } from '../../dialogs/confirm-delete-dialog/confirm-delete-dialog.component';
import { catchError, EMPTY, filter, switchMap, tap } from 'rxjs';
import { EditCreateSupplierDialog } from './dialogs/edit-create-supplier-dialog/edit-create-supplier-dialog';
import { ShowActivityDialog } from './dialogs/show-activity-dialog/show-activity-dialog';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-suppliers',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    CardModule,
    TagModule,
    ToastModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    TooltipModule
  ],
  providers: [MessageService],
  templateUrl: './suppliers.html',
  styleUrl: './suppliers.scss'
})
export class Suppliers implements OnInit {
  suppliers: Supplier[] = [];
  filteredSuppliers: Supplier[] = [];
  
  filterValues = {
    name: '',
    contactEmail: '',
    contactPhone: '',
    address: '',
    city: ''
  };

  constructor(
    private suppliersService: SuppliersService,
    private authService: AuthService,
    private dialog: MatDialog,
    private messageService: MessageService
  ) { }

  ngOnInit(): void {
    this.suppliersService.getAllSuppliers(this.authService.requireCurrentTenantId()).subscribe(
      s => {
        this.suppliers = s;
        this.filteredSuppliers = s;
      }
    );
  }

  applyFilter() {
    this.filteredSuppliers = this.suppliers.filter(supplier => {
      const matchName = !this.filterValues.name || 
        supplier.name?.toLowerCase().includes(this.filterValues.name.toLowerCase());
      const matchEmail = !this.filterValues.contactEmail || 
        supplier.contactEmail?.toLowerCase().includes(this.filterValues.contactEmail.toLowerCase());
      const matchPhone = !this.filterValues.contactPhone || 
        supplier.contactPhone?.toLowerCase().includes(this.filterValues.contactPhone.toLowerCase());
      const matchAddress = !this.filterValues.address || 
        supplier.address?.toLowerCase().includes(this.filterValues.address.toLowerCase());
      const matchCity = !this.filterValues.city || 
        supplier.city?.toLowerCase().includes(this.filterValues.city.toLowerCase());

      return matchName && matchEmail && matchPhone && matchAddress && matchCity;
    });
  }

  clearFilters() {
    this.filterValues = {
      name: '',
      contactEmail: '',
      contactPhone: '',
      address: '',
      city: ''
    };
    this.filteredSuppliers = this.suppliers;
  }


  editSupplier(supplier: Supplier) {
    const dialogRef = this.dialog.open(EditCreateSupplierDialog, {
      panelClass: 'admin-dialog-panel',
      backdropClass: 'custom-backdrop',
      data: supplier
    })

    dialogRef.afterClosed().pipe(
      filter(result => !!result),
      switchMap((result) => this.suppliersService.updateSupplier(supplier._id!, result)),
      tap((updatedSupplier) => {
        this.showToast('Dobavljač uspešno ažuriran');
        const idx = this.suppliers.findIndex(s => s._id === supplier._id);
        if (idx > -1) {
          this.suppliers[idx] = updatedSupplier;
          this.suppliers = [...this.suppliers];
        }
        this.applyFilter();
      }),
      catchError(err => {
        console.error('Error updating supplier:', err);
        this.showToast('Neuspešno ažuriranje dobavljača', true);
        return EMPTY;
      })
    ).subscribe();
  }

  deleteSupplier(supplier: Supplier) {
    const dialogRef = this.dialog.open(ConfirmDeleteDialogComponent, {
      panelClass: 'admin-dialog-panel',
      backdropClass: 'custom-backdrop',
      data: {
        title: 'Brisanje dobavljača',
        message: `Da li ste sigurni da želite da obrišete ${supplier.name}?`,
      }
    })

    dialogRef.afterClosed().pipe(
      filter(confirmed => !!confirmed),
      switchMap(() => this.suppliersService.deleteSupplier(supplier._id!)),
      tap(() => {
        this.suppliers = this.suppliers.filter(s => s._id !== supplier._id);
        this.applyFilter();
        this.showToast('Dobavljač uspešno obrisan');
      }),
      catchError(err => {
        console.error('Error deleting supplier:', err);
        this.showToast('Neuspešno brisanje dobavljača', true);
        return EMPTY;
      })
    ).subscribe();
  }

  activitySupplier() {
    const dialogRef = this.dialog.open(ShowActivityDialog, {
      width: '600px'
    })
  }

  addSupplier() {
    const dialogRef = this.dialog.open(EditCreateSupplierDialog, {
      panelClass: 'admin-dialog-panel',
      backdropClass: 'custom-backdrop'
    })

    dialogRef.afterClosed().pipe(
      filter(result => !!result),
      switchMap((result) => this.suppliersService.createSupplier(result)),
      tap((newSupplier) => {
        this.showToast('Dobavljač uspešno kreiran');
        this.suppliers = [...this.suppliers, newSupplier];
        this.applyFilter();
      }),
      catchError(err => {
        console.error('Error creating supplier:', err);
        this.showToast('Neuspešno kreiranje dobavljača', true);
        return EMPTY;
      })
    ).subscribe();
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
