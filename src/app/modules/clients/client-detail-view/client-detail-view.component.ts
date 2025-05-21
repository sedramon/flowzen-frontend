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
    FormsModule,
    ReactiveFormsModule,
    MatIconModule,
    NgSwitchCase
  ],
  templateUrl: './client-detail-view.component.html',
  styleUrl: './client-detail-view.component.scss',
})
export class ClientDetailViewComponent implements OnInit {
  private clientId!: string;
  client!: Client;
  selectedSection: 'details'|'bills'|'appointments'|'remarks' = 'details';
  sectionTitle: string = 'Client Details';
  hasChanged: boolean = false;

  constructor(
    private clientsService: ClientsService,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.clientId = this.route.snapshot.paramMap.get('id')!;

    this.clientsService.getClientById(this.clientId).subscribe((client) => {
      this.client = client;
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
