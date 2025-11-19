import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ServicesService } from './services/services.service';
import { AuthService } from '../../core/services/auth.service';
import { Service } from '../../models/Service';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDeleteDialogComponent } from '../../dialogs/confirm-delete-dialog/confirm-delete-dialog.component';
import { CreateServiceDialogComponent } from './dialogs/create-service-dialog/create-service-dialog.component';
import { FormsModule } from '@angular/forms';
import { catchError, EMPTY, filter, switchMap, tap } from 'rxjs';
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
  selector: 'app-services',
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
  templateUrl: './services.component.html',
  styleUrls: ['./services.component.scss']
})
export class ServicesComponent implements OnInit {
  services: Service[] = [];
  filteredServices: Service[] = [];
  searchQuery: string = '';

  constructor(
    private servicesService: ServicesService,
    private authService: AuthService,
    private messageService: MessageService,
    private dialog: MatDialog
  ) { }


  ngOnInit() {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      return;
    }

    this.servicesService.getAllServices(this.authService.requireCurrentTenantId()).subscribe(services => {
      this.services = services;
      this.filteredServices = services;
    });
  }

  applyFilter() {
    if (!this.searchQuery.trim()) {
      this.filteredServices = this.services;
    } else {
      const query = this.searchQuery.toLowerCase().trim();
      this.filteredServices = this.services.filter(service =>
        service.name.toLowerCase().includes(query)
      );
    }
  }

  clearFilters() {
    this.searchQuery = '';
    this.filteredServices = this.services;
  }

  deleteService(service: Service) {
    const dialogRef = this.dialog.open(ConfirmDeleteDialogComponent, {
      panelClass: 'admin-dialog-panel',
      backdropClass: 'custom-backdrop',
      data: {
        title: 'Brisanje usluge',
        message: `Da li ste sigurni da želite da obrišete ${service.name}?`,
      },
    })

    dialogRef.afterClosed().pipe(
      filter(confirmed => !!confirmed),
      switchMap(() => this.servicesService.deleteService(service._id!)),
      tap(() => {
        this.showToast(`Usluga ${service.name} uspešno obrisana!`);
        this.services = this.services.filter(s => s._id !== service._id);
        this.applyFilter();
      }),
      catchError(err => {
        console.error('Error deleting service', err);
        this.showToast(`Neuspešno brisanje usluge ${service.name}`, true);
        return EMPTY;
      })
    ).subscribe();
  }

  /** Called when you click the "+" button or the "edit" icon */
  addOrEditService(serviceToEdit?: Service): void {
    const dialogRef = this.dialog.open(CreateServiceDialogComponent, {
      panelClass: 'admin-dialog-panel',
      backdropClass: 'custom-backdrop',
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
          const idx = this.services.findIndex(s => s._id === saved._id);
          if (idx > -1) {
            this.services[idx] = saved;
            this.services = [...this.services];
          }
          this.showToast(`Usluga "${saved.name}" uspešno ažurirana`);
        } else {
          this.services = [...this.services, saved];
          this.showToast(`Usluga "${saved.name}" uspešno kreirana`);
        }
        this.applyFilter();
      }),
      catchError(err => {
        console.error('Service save failed:', err);
        this.showToast(
          `Neuspešno ${serviceToEdit ? 'ažuriranje' : 'kreiranje'} usluge`,
          true
        );
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
