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
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDeleteDialogComponent } from '../../dialogs/confirm-delete-dialog/confirm-delete-dialog.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CreateEditFacilityDialog } from './dialogs/create-edit-facility-dialog/create-edit-facility-dialog';
import { catchError, EMPTY, filter, forkJoin, switchMap, tap } from 'rxjs';
import { EffectiveSettings, RawSettings } from '../../models/Settings';
import { MatFormField, MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    MatCardModule,
    FlexLayoutModule,
    MatIconModule,
    MatDividerModule,
    MatButtonModule,
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule
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

  effectiveSettings: EffectiveSettings | null = null;
  tenantRaw: RawSettings | null = null;
  userRaw: RawSettings | null = null;

  tenantForm!: FormGroup;
  userForm!: FormGroup;

  loading = false;
  savingTenant = false;
  savingUser = false;
  error?: string;

  selectedSection: string = 'general';
  sectionTitle: string = 'General';
  sectionIcon: string = 'settings';

  private tenantId!: string;
  private userId!: string;

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
    private snackBar: MatSnackBar,
    private fb: FormBuilder
  ) { }

  ngOnInit(): void {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return;

    this.tenantId = currentUser.tenant!;
    this.userId = currentUser.userId!;

    // facilities
    this.settingsService.getAllFacilities(this.tenantId).subscribe({
      next: (data) => (this.dataSourceFacilities.data = data),
      error: (err) => console.error('Error fetching facilities:', err),
    });

    // settings
    this.loadSettings();
  }

  ngAfterViewInit(): void {
    const pagArray = this.paginators.toArray();
    if (pagArray.length > 0) {
      console.log('SETTING PAGINATOR FOR FACILITIES');
      this.dataSourceFacilities.paginator = pagArray[0];
    }
  }

  openAddFacilityDialog() {
    const dialogRef = this.dialog.open(CreateEditFacilityDialog, {
      width: '800px'
    })

    dialogRef.afterClosed().pipe(
      filter(result => !!result),
      switchMap((result) => this.settingsService.createFacility(result)),
      tap((newFacility) => {
        this.dataSourceFacilities.data = [
          ...this.dataSourceFacilities.data,
          newFacility
        ],
          this.snackBar.open('Succesfully created facility', 'Okay', { duration: 2000 })
      }),
      catchError(err => {
        console.warn('Failed to create facility!', err);
        this.snackBar.open('Failed to create facility', 'Okay', { duration: 2000 })
        return EMPTY;
      })
    ).subscribe();
  }

  editFacility(facility: Facility) {
    const dialogRef = this.dialog.open(CreateEditFacilityDialog, {
      width: '800px',
      data: facility
    })

    dialogRef.afterClosed().pipe(
      filter(result => !!result),
      switchMap((result) => this.settingsService.updateFacility(facility._id!, result)),
      tap((updatedFacility) => {
        this.dataSourceFacilities.data = this.dataSourceFacilities.data.map(f => f._id === facility._id ? updatedFacility : f)
        this.snackBar.open('Succesfully updated facility', 'Okay', { duration: 2000 })
      }),
      catchError(err => {
        console.warn('Failed to create facility!', err);
        this.snackBar.open('Failed to create facility', 'Okay', { duration: 2000 })
        return EMPTY;
      })
    ).subscribe();
  }

  deleteFacility(facility: Facility) {
    const dialogRef = this.dialog.open(ConfirmDeleteDialogComponent, {
      width: '500px',
      height: '250px',
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


  private loadSettings() {
    this.loading = true;
    forkJoin({
      tenantRaw: this.settingsService.getTenantSettingsRaw(this.tenantId),
      userRaw: this.settingsService.getUserSettingsRaw(this.tenantId, this.userId),
      effective: this.settingsService.getEffectiveSettings(this.tenantId, this.userId),
    }).subscribe({
      next: ({ tenantRaw, userRaw, effective }) => {
        this.tenantRaw = tenantRaw ?? {};
        this.userRaw = userRaw ?? {};
        this.effectiveSettings = effective;
        this.initForms();
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load settings';
        console.error(err);
        this.loading = false;
      },
    });
  }

  private initForms() {
    this.tenantForm = this.fb.group({
      language: [this.tenantRaw?.language ?? null],
      currency: [this.tenantRaw?.currency ?? null],
      theme: [this.tenantRaw?.theme ?? null],
      landingPage: [this.tenantRaw?.landingPage ?? null],
      navbarShortcutsCsv: [(this.tenantRaw?.navbarShortcuts ?? []).join(', ')],
    });

    this.userForm = this.fb.group({
      language: [this.userRaw?.language ?? null],
      currency: [this.userRaw?.currency ?? null],
      theme: [this.userRaw?.theme ?? null],
      landingPage: [this.userRaw?.landingPage ?? null],
      navbarShortcutsCsv: [(this.userRaw?.navbarShortcuts ?? []).join(', ')],
    });
  }

  private parseShortcutsCsv(val: string | null | undefined) {
    const arr = (val ?? '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
    return arr.length ? arr : null;
  }

  saveUserSettings() {
    if (!this.userForm) return;
    this.savingUser = true;

    const f = this.userForm.value;

    const payload = {
      language: (f.language ?? null) === '' ? null : f.language ?? null,
      currency: (f.currency ?? null) === '' ? null : f.currency ?? null,
      theme: (f.theme ?? null) === '' ? null : f.theme ?? null,
      landingPage: (f.landingPage ?? '').trim() || null,
      navbarShortcuts: this.parseShortcutsCsv(f.navbarShortcutsCsv)
    };

    this.settingsService.upsertUserSettings(this.tenantId, this.userId, payload)
      .pipe(
        tap(() => this.snackBar.open('Personal settings saved', 'OK', { duration: 1500 })),
        switchMap(() => this.settingsService.getEffectiveSettings(this.tenantId, this.userId)),
        tap(eff => (this.effectiveSettings = eff)),
        switchMap(() => this.settingsService.getUserSettingsRaw(this.tenantId, this.userId)),
        tap(raw => (this.userRaw = raw))
      )
      .subscribe({
        next: () => (this.savingUser = false),
        error: err => {
          console.error(err);
          this.snackBar.open('Failed to save personal settings', 'OK', { duration: 2000 });
          this.savingUser = false;
        }
      });
  }

  saveTenantSettings() {
    if (!this.tenantForm) return;
    this.savingTenant = true;

    const f = this.tenantForm.value;

    const payload = {
      language: (f.language ?? '').trim() || null,
      currency: (f.currency ?? '').trim() || null,
      theme: (f.theme ?? '').trim() || null,
      landingPage: (f.landingPage ?? '').trim() || null,
      navbarShortcuts: this.parseShortcutsCsv(f.navbarShortcutsCsv)
    };

    this.settingsService.upsertTenantSettings(this.tenantId, payload)
      .pipe(
        tap(() => this.snackBar.open('Tenant settings saved', 'OK', { duration: 1500 })),
        switchMap(() => this.settingsService.getEffectiveSettings(this.tenantId, this.userId)),
        tap(eff => (this.effectiveSettings = eff)),
        switchMap(() => this.settingsService.getTenantSettingsRaw(this.tenantId)),
        tap(raw => (this.tenantRaw = raw))
      )
      .subscribe({
        next: () => (this.savingTenant = false),
        error: err => {
          console.error(err);
          this.snackBar.open('Failed to save tenant settings', 'OK', { duration: 2000 });
          this.savingTenant = false;
        }
      });
  }

  resetTenantForm(): void {
    this.tenantForm.reset({
      language: this.tenantRaw?.language ?? null,
      currency: this.tenantRaw?.currency ?? null,
      theme: this.tenantRaw?.theme ?? null,
      landingPage: this.tenantRaw?.landingPage ?? null,
      navbarShortcutsCsv: (this.tenantRaw?.navbarShortcuts ?? []).join(', ')
    });
  }

  resetUserForm(): void {
    this.userForm.reset({
      language: this.userRaw?.language ?? null,
      currency: this.userRaw?.currency ?? null,
      theme: this.userRaw?.theme ?? null,
      landingPage: this.userRaw?.landingPage ?? null,
      navbarShortcutsCsv: (this.userRaw?.navbarShortcuts ?? []).join(', ')
    });
  }

  clearUserOverrides(): void {
    this.userForm.setValue({
      language: null,
      currency: null,
      theme: null,
      landingPage: null,
      navbarShortcutsCsv: ''
    });
    this.saveUserSettings();
  }
} 