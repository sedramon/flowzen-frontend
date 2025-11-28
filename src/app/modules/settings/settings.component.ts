import { Component, OnInit } from '@angular/core';
import { SettingsService } from './services/settings.service';
import { Facility } from '../../models/Facility';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDeleteDialogComponent } from '../../dialogs/confirm-delete-dialog/confirm-delete-dialog.component';
import { CreateEditFacilityDialog } from './dialogs/create-edit-facility-dialog/create-edit-facility-dialog';
import { catchError, EMPTY, filter, forkJoin, switchMap, tap } from 'rxjs';
import { EffectiveSettings, RawSettings } from '../../models/Settings';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { DividerModule } from 'primeng/divider';
import { TooltipModule } from 'primeng/tooltip';
import { FloatLabelModule } from 'primeng/floatlabel';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    CardModule,
    TableModule,
    ToastModule,
    InputTextModule,
    SelectModule,
    DividerModule,
    TooltipModule,
    FloatLabelModule,
    ProgressSpinnerModule
  ],
  providers: [MessageService],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
})
export class SettingsComponent implements OnInit {
  facilities: Facility[] = [];

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
  sectionTitle: string = 'Opšta podešavanja';
  sectionIcon: string = 'settings';

  private tenantId!: string;
  private userId!: string;

  constructor(
    private settingsService: SettingsService,
    private authService: AuthService,
    private themeService: ThemeService,
    private dialog: MatDialog,
    private messageService: MessageService,
    private fb: FormBuilder
  ) { }

  ngOnInit(): void {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return;

    this.tenantId = this.authService.requireCurrentTenantId();
    this.userId = currentUser.userId!;

    // facilities
    this.settingsService.getAllFacilities(this.tenantId).subscribe({
      next: (data) => (this.facilities = data),
      error: (err) => console.error('Error fetching facilities:', err),
    });

    // settings
    this.loadSettings();
  }

  openAddFacilityDialog() {
    const dialogRef = this.dialog.open(CreateEditFacilityDialog, {
      width: '800px'
    })

    dialogRef.afterClosed().pipe(
      filter(result => !!result),
      switchMap((result) => this.settingsService.createFacility(result)),
      tap((newFacility) => {
        this.facilities = [...this.facilities, newFacility];
        this.showToast('Objekat uspešno kreiran');
      }),
      catchError(err => {
        console.warn('Failed to create facility!', err);
        this.showToast('Neuspešno kreiranje objekta', true);
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
        this.facilities = this.facilities.map(f => f._id === facility._id ? updatedFacility : f);
        this.showToast('Objekat uspešno ažuriran');
      }),
      catchError(err => {
        console.warn('Failed to update facility!', err);
        this.showToast('Neuspešno ažuriranje objekta', true);
        return EMPTY;
      })
    ).subscribe();
  }

  deleteFacility(facility: Facility) {
    const dialogRef = this.dialog.open(ConfirmDeleteDialogComponent, {
      panelClass: 'admin-dialog-panel',
      backdropClass: 'custom-backdrop',
      data: {
        title: 'Brisanje objekta',
        message: `Da li ste sigurni da želite da obrišete ${facility.name}?`,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.settingsService.deleteFacility(facility._id!).subscribe({
          next: () => {
            this.facilities = this.facilities.filter((f) => f._id !== facility._id);
            this.showToast('Objekat uspešno obrisan!');
          },
          error: (err) => {
            this.showToast('Neuspešno brisanje objekta', true);
          },
        });
      }
    })
  }

  selectSection(section: string) {
    this.selectedSection = section;
    switch (section) {
      case 'general':
        this.sectionTitle = 'Opšte';
        this.sectionIcon = 'settings';
        break;
      case 'facilities':
        this.sectionTitle = 'Objekti';
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
        this.error = 'Neuspešno učitavanje podešavanja';
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
        tap(() => this.showToast('Lična podešavanja sačuvana')),
        switchMap(() => this.settingsService.getEffectiveSettings(this.tenantId, this.userId)),
        tap(eff => {
          this.effectiveSettings = eff;
          // Ažuriraj temu kada se promene settings
          const themeToApply = (eff.theme as any) || 'system';
          this.themeService.setTheme(themeToApply);
          
          // Toast poruka za promenu teme
          const themeLabels: Record<string, string> = {
            'light': 'Svetla',
            'dark': 'Tamna',
            'system': 'Sistemska'
          };
          this.showToast(`Tema promenjena na: ${themeLabels[themeToApply] || themeToApply}`);
        }),
        switchMap(() => this.settingsService.getUserSettingsRaw(this.tenantId, this.userId)),
        tap(raw => (this.userRaw = raw))
      )
      .subscribe({
        next: () => (this.savingUser = false),
        error: err => {
          console.error(err);
          this.showToast('Neuspešno čuvanje ličnih podešavanja', true);
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
        tap(() => this.showToast('Podrazumevana podešavanja sačuvana')),
        switchMap(() => this.settingsService.getEffectiveSettings(this.tenantId, this.userId)),
        tap(eff => {
          this.effectiveSettings = eff;
          // Ažuriraj temu kada se promene settings
          const themeToApply = (eff.theme as any) || 'system';
          this.themeService.setTheme(themeToApply);
          
          // Toast poruka za promenu teme
          const themeLabels: Record<string, string> = {
            'light': 'Svetla',
            'dark': 'Tamna',
            'system': 'Sistemska'
          };
          this.showToast(`Tema promenjena na: ${themeLabels[themeToApply] || themeToApply}`);
        }),
        switchMap(() => this.settingsService.getTenantSettingsRaw(this.tenantId)),
        tap(raw => (this.tenantRaw = raw))
      )
      .subscribe({
        next: () => (this.savingTenant = false),
        error: err => {
          console.error(err);
          this.showToast('Neuspešno čuvanje podrazumevanih podešavanja', true);
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

  showToast(message: string, isError: boolean = false) {
    this.messageService.add({
      severity: isError ? 'error' : 'success',
      summary: isError ? 'Greška' : 'Uspešno',
      detail: message,
      life: 3000
    });
  }
} 