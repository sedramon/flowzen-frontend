import {
  AfterViewInit,
  Component,
  OnInit,
  QueryList,
  ViewChild,
  ViewChildren,
} from '@angular/core';
import { SettingsService } from './services/settings.service';
import { Facility } from '../../models/Facility';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { AuthService } from '../../core/services/auth.service';
import { MatCardModule } from '@angular/material/card';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule, NgSwitchCase } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDeleteDialogComponent } from '../../dialogs/confirm-delete-dialog/confirm-delete-dialog.component';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    MatCardModule,
    FlexLayoutModule,
    MatIconModule,
    MatDividerModule,
    MatButtonModule,
    NgSwitchCase,
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
  ],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
})
export class SettingsComponent implements OnInit, AfterViewInit {
  facilities: Facility[] = [];

  dataSourceFacilities = new MatTableDataSource<Facility>(this.facilities);
  displayedColumFacilities: string[] = [
    'name',
    'address',
    'openingHour',
    'closingHour',
    'actions',
  ];

  selectedSection: string = 'general';
  sectionTitle: string = 'General';
  sectionIcon: string = 'settings';

  @ViewChildren(MatPaginator) paginators!: QueryList<MatPaginator>;
  @ViewChild('facilitySort', { static: false })
  set facilitySort(ms: MatSort) {
    if (ms) {
      this.dataSourceFacilities.sort = ms;
    }
  }

  constructor(
    private settingsService: SettingsService,
    private authService: AuthService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      // Ako iz nekog razloga korisnik nije dostupan, uradi fallback (npr. redirect ili error)
      return;
    }

    this.settingsService.getAllFacilities(currentUser.tenant).subscribe({
      next: (data) => {
        console.log('Facilities fetched:', data);
        this.dataSourceFacilities.data = data;
      },
      error: (err) => {
        console.error('Error fetching users:', err);
      },
    });
  }

  ngAfterViewInit(): void {
    const pagArray = this.paginators.toArray();
    if (pagArray.length > 0) {
      console.log('SETTING PAGINATOR FOR FACILITIES');
      this.dataSourceFacilities.paginator = pagArray[0];
    }
  }

  openAddFacilityDialog() {}

  deleteFacility(facility: Facility) {
    const dialogRef = this.dialog.open(ConfirmDeleteDialogComponent, {
      data: {
        title: 'Delete Facility',
        message: `Are you sure you want to delete ${facility.name}?`,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.settingsService.deleteFacility(facility._id!).subscribe({
          next: () => {
            this.dataSourceFacilities.data = this.dataSourceFacilities.data.filter(
              (f) => f._id !== facility._id
            );
            this.snackBar.open('Facility deleted successfully!', 'Close', { duration: 2000 });
          },
          error: (err) => {
            this.snackBar.open('Failed to delete facility', 'Close', { duration: 2000 });
          },
        });
      }
    })
  }

  selectSection(section: string) {
    this.selectedSection = section;
    switch (section) {
      case 'general':
        this.sectionTitle = 'General';
        this.sectionIcon = 'settings';
        break;
      case 'facilities':
        this.sectionTitle = 'Facilities';
        this.sectionIcon = 'business';
        break;
    }
  }
} 