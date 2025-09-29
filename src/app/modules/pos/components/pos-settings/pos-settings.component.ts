import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { PosService } from '../../services/pos.service';
import { AuthService } from '../../../../core/services/auth.service';

interface PaymentMethod {
  enabled: boolean;
  label: string;
}

interface FiscalizationSettings {
  enabled: boolean;
  provider: 'none' | 'device' | 'cloud';
  timeout: number;
  retryCount: number;
}

interface ReceiptTemplate {
  header: string;
  footer: string;
  showQR: boolean;
  showFiscalNumber: boolean;
}

@Component({
  selector: 'app-pos-settings',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatSlideToggleModule,
    MatTabsModule,
    MatTooltipModule,
    ReactiveFormsModule
  ],
  templateUrl: './pos-settings.component.html',
  styleUrl: './pos-settings.component.scss',
  providers: [AuthService, PosService]
})
export class PosSettingsComponent implements OnInit {
  settingsForm: FormGroup;
  loading = false;
  saving = false;
  currentFacility: any = null;
  facilities: any[] = [];

  constructor(
    private fb: FormBuilder,
    private posService: PosService,
    @Inject(AuthService) private authService: AuthService,
    private snackBar: MatSnackBar
  ) {
    this.settingsForm = this.fb.group({
      facility: ['', Validators.required],
      paymentMethods: this.fb.group({
        cash: this.fb.group({
          enabled: [true],
          label: ['Gotovina']
        }),
        card: this.fb.group({
          enabled: [true],
          label: ['Kartica']
        }),
        voucher: this.fb.group({
          enabled: [false],
          label: ['Voucher']
        }),
        gift: this.fb.group({
          enabled: [false],
          label: ['Poklon bon']
        }),
        bank: this.fb.group({
          enabled: [false],
          label: ['Bankovni transfer']
        }),
        other: this.fb.group({
          enabled: [false],
          label: ['Ostalo']
        })
      }),
      defaultTaxRate: [20, [Validators.required, Validators.min(0), Validators.max(100)]],
      maxDiscountPercent: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
      allowNegativePrice: [false],
      receiptNumberFormat: ['FAC-YYYYMMDD-####', Validators.required],
      fiscalization: this.fb.group({
        enabled: [false],
        provider: ['none'],
        timeout: [5000, [Validators.required, Validators.min(1000)]],
        retryCount: [3, [Validators.required, Validators.min(1), Validators.max(10)]]
      }),
      receiptTemplate: this.fb.group({
        header: [''],
        footer: [''],
        showQR: [false],
        showFiscalNumber: [true]
      })
    });
  }

  ngOnInit(): void {
    this.loadFacilities();
  }

  loadFacilities(): void {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return;

    this.posService.getFacilities(currentUser.tenant).subscribe({
      next: (facilities) => {
        this.facilities = facilities;
        if (facilities.length > 0) {
          this.currentFacility = facilities[0];
          this.settingsForm.patchValue({ facility: facilities[0]._id });
          this.loadSettings();
        }
      },
      error: (error) => {
        console.error('Error loading facilities:', error);
        this.snackBar.open('Greška pri učitavanju objekata', 'Zatvori', { duration: 3000 });
      }
    });
  }

  loadSettings(): void {
    if (!this.currentFacility) return;

    this.loading = true;
    this.posService.getSettings(this.currentFacility._id).subscribe({
      next: (settings) => {
        if (settings) {
          this.settingsForm.patchValue(settings);
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading settings:', error);
        this.snackBar.open('Greška pri učitavanju podešavanja', 'Zatvori', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  onFacilityChange(facilityId: string): void {
    this.currentFacility = this.facilities.find(f => f._id === facilityId);
    this.loadSettings();
  }

  saveSettings(): void {
    if (this.settingsForm.invalid) {
      this.snackBar.open('Molimo popunite sva obavezna polja', 'Zatvori', { duration: 3000 });
      return;
    }

    this.saving = true;
    const settingsData = {
      ...this.settingsForm.value,
      facility: this.currentFacility._id,
      tenant: this.authService.getCurrentUser()?.tenant
    };

    this.posService.updateSettings(settingsData).subscribe({
      next: () => {
        this.snackBar.open('Podešavanja uspešno sačuvana', 'Zatvori', { duration: 2000 });
        this.saving = false;
      },
      error: (error) => {
        console.error('Error saving settings:', error);
        this.snackBar.open('Greška pri čuvanju podešavanja', 'Zatvori', { duration: 3000 });
        this.saving = false;
      }
    });
  }

  resetToDefaults(): void {
    this.settingsForm.patchValue({
      paymentMethods: {
        cash: { enabled: true, label: 'Gotovina' },
        card: { enabled: true, label: 'Kartica' },
        voucher: { enabled: false, label: 'Voucher' },
        gift: { enabled: false, label: 'Poklon bon' },
        bank: { enabled: false, label: 'Bankovni transfer' },
        other: { enabled: false, label: 'Ostalo' }
      },
      defaultTaxRate: 20,
      maxDiscountPercent: 0,
      allowNegativePrice: false,
      receiptNumberFormat: 'FAC-YYYYMMDD-####',
      fiscalization: {
        enabled: false,
        provider: 'none',
        timeout: 5000,
        retryCount: 3
      },
      receiptTemplate: {
        header: '',
        footer: '',
        showQR: false,
        showFiscalNumber: true
      }
    });
  }

  getPaymentMethods(): string[] {
    return Object.keys(this.settingsForm.get('paymentMethods')?.value || {});
  }

  getFiscalProviders() {
    return [
      { value: 'none', label: 'Bez fiskalizacije' },
      { value: 'device', label: 'Fiskalni uređaj' },
      { value: 'cloud', label: 'Cloud servis' }
    ];
  }
}
