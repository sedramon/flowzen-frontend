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
import { PosService } from '../../../services/pos.service';
import { AuthService } from '../../../../../core/services/auth.service';
import { Facility } from '../../../../../models/Facility';

interface PaymentMethod {
  enabled: boolean;
  label: string;
}

interface PosSettings {
  facility: string;
  paymentMethods: {
    [key: string]: PaymentMethod;
  };
  defaultTaxRate: number;
  maxDiscountPercent: number;
  allowNegativePrice: boolean;
  receiptNumberFormat: string;
  receiptTemplate?: {
    header: string;
    footer: string;
    showQR: boolean;
    showFiscalNumber: boolean;
  };
  fiscalization: {
    enabled: boolean;
    provider: string;
    timeout: number;
    retryCount: number;
  };
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
  settingsForm!: FormGroup;
  loading = false;
  saving = false;
  currentFacility: Facility | null = null;
  facilities: Facility[] = [];

  // Payment methods configuration
  paymentMethodsConfig = [
    { key: 'cash', defaultLabel: 'Gotovina', defaultEnabled: true },
    { key: 'card', defaultLabel: 'Kartica', defaultEnabled: true },
    { key: 'voucher', defaultLabel: 'Vaučer', defaultEnabled: false },
    { key: 'gift', defaultLabel: 'Poklon bon', defaultEnabled: false },
    { key: 'bank', defaultLabel: 'Bankovni transfer', defaultEnabled: false },
    { key: 'other', defaultLabel: 'Ostalo', defaultEnabled: false }
  ];

  // Fiscal providers
  fiscalProviders = [
    { value: 'none', label: 'Bez fiskalizacije' },
    { value: 'device', label: 'Fiskalni uređaj' },
    { value: 'cloud', label: 'Cloud servis' }
  ];

  constructor(
    private fb: FormBuilder,
    private posService: PosService,
    @Inject(AuthService) private authService: AuthService,
    private snackBar: MatSnackBar
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    this.loadFacilities();
  }

  /**
   * Inicijalizuje formu sa default vrednostima
   */

  initializeForm(): void {
    // Initialize payment methods group
    const paymentMethodsGroup: any = {};
    this.paymentMethodsConfig.forEach(method => {
      paymentMethodsGroup[method.key] = this.fb.group({
        enabled: [method.defaultEnabled],
        label: [method.defaultLabel]
      });
    });

    // Initialize main form
    this.settingsForm = this.fb.group({
      facility: [''],
      paymentMethods: this.fb.group(paymentMethodsGroup),
      defaultTaxRate: [20, [Validators.required, Validators.min(0), Validators.max(100)]],
      maxDiscountPercent: [50, [Validators.required, Validators.min(0), Validators.max(100)]],
      allowNegativePrice: [false],
      receiptNumberFormat: ['FAC-YYYYMMDD-####', Validators.required],
      header: [''],
      footer: [''],
      showQR: [true],
      showFiscalNumber: [true],
      fiscalization: this.fb.group({
        enabled: [false],
        provider: ['none'],
        timeout: [5000, [Validators.required, Validators.min(1000)]],
        retryCount: [3, [Validators.required, Validators.min(1), Validators.max(10)]]
      })
    });
  }

  /**
   * Učitava dostupne objekte za trenutnog korisnika
   */
  loadFacilities(): void {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      this.loading = false;
      return;
    }

    this.loading = true;
    this.posService.getFacilities(currentUser.tenant).subscribe({
      next: (facilities) => {
        this.facilities = facilities;
        if (facilities.length > 0) {
          this.currentFacility = facilities[0];
          this.settingsForm.patchValue({ facility: facilities[0]._id });
          this.loadSettings();
        } else {
          this.loading = false;
        }
      },
      error: (error) => {
        console.error('Error loading facilities:', error);
        this.snackBar.open('Greška pri učitavanju objekata', 'Zatvori', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  /**
   * Učitava postavke za selektovani objekat
   */
  loadSettings(): void {
    if (!this.currentFacility) {
      this.loading = false;
      return;
    }

    this.loading = true;

    // Load settings from API
    this.posService.getSettings(this.currentFacility._id || '')
      .subscribe({
        next: (response: any) => {
          // Extract settings from backend response format
          const settings = response?.data || response;
          
          // Check if we have valid settings data
          if (!settings || typeof settings !== 'object') {
            this.loading = false;
            return;
          }
          
          // Prepare form data with proper structure
          const formData = {
            facility: settings.facility || this.currentFacility?._id || '',
            paymentMethods: settings.paymentMethods || {
              cash: { enabled: true, label: 'Gotovina' },
              card: { enabled: true, label: 'Kartica' },
              voucher: { enabled: false, label: 'Vaučer' },
              gift: { enabled: false, label: 'Poklon bon' },
              bank: { enabled: false, label: 'Bankovni transfer' },
              other: { enabled: false, label: 'Ostalo' }
            },
            defaultTaxRate: settings.defaultTaxRate || 20,
            maxDiscountPercent: settings.maxDiscountPercent || 50,
            allowNegativePrice: settings.allowNegativePrice || false,
            receiptNumberFormat: settings.receiptNumberFormat || 'FAC-YYYYMMDD-####',
            header: settings.receiptTemplate?.header || '',
            footer: settings.receiptTemplate?.footer || '',
            showQR: settings.receiptTemplate?.showQR || true,
            showFiscalNumber: settings.receiptTemplate?.showFiscalNumber || true,
            fiscalization: settings.fiscalization || {
              enabled: false,
              provider: 'none',
              timeout: 5000,
              retryCount: 3
            }
          };
          
          this.settingsForm.patchValue(formData);
          
          // Mark form as pristine after loading (not dirty)
          this.settingsForm.markAsPristine();
          
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading settings:', error);
          this.snackBar.open('Greška pri učitavanju postavki', 'Zatvori', { duration: 3000 });
          
          // Fallback to default settings
          const defaultSettings = {
            facility: this.currentFacility?._id || '',
            paymentMethods: {
              cash: { enabled: true, label: 'Gotovina' },
              card: { enabled: true, label: 'Kartica' },
              voucher: { enabled: false, label: 'Vaučer' },
              gift: { enabled: false, label: 'Poklon bon' },
              bank: { enabled: false, label: 'Bankovni transfer' },
              other: { enabled: false, label: 'Ostalo' }
            },
            defaultTaxRate: 20,
            maxDiscountPercent: 50,
            allowNegativePrice: false,
            receiptNumberFormat: 'FAC-YYYYMMDD-####',
            header: 'Dobrodošli u Flowzen Salon',
            footer: 'Hvala vam na poseti!',
            showQR: true,
            showFiscalNumber: true,
            fiscalization: {
              enabled: false,
              provider: 'none',
              timeout: 5000,
              retryCount: 3
            }
          };
          
          this.settingsForm.patchValue(defaultSettings);
          this.settingsForm.markAsPristine();
          this.loading = false;
        }
      });
  }

  /**
   * Handler za promenu objekta
   */
  onFacilityChange(facilityId: string): void {
    this.currentFacility = this.facilities.find(f => f._id === facilityId) || null;
    if (this.currentFacility) {
      this.loadSettings();
    }
  }

  /**
   * Čuva postavke na backend
   */
  saveSettings(): void {
    if (this.settingsForm.invalid) {
      this.snackBar.open('Molimo popunite sva obavezna polja', 'Zatvori', { duration: 3000 });
      return;
    }

    if (!this.currentFacility) {
      this.snackBar.open('Izaberite objekat', 'Zatvori', { duration: 3000 });
      return;
    }

    this.saving = true;
    const formValue = this.settingsForm.value;
    const currentUser = this.authService.getCurrentUser();
    
    const settingsData = {
      facility: this.currentFacility._id,
      paymentMethods: formValue.paymentMethods,
      defaultTaxRate: formValue.defaultTaxRate,
      maxDiscountPercent: formValue.maxDiscountPercent,
      allowNegativePrice: formValue.allowNegativePrice,
      receiptNumberFormat: formValue.receiptNumberFormat,
      fiscalization: formValue.fiscalization,
      receiptTemplate: {
        header: formValue.header || '',
        footer: formValue.footer || '',
        showQR: formValue.showQR || false,
        showFiscalNumber: formValue.showFiscalNumber || true
      },
      tenant: currentUser?.tenant
    };

    // Save settings via API
    this.posService.updateSettings(settingsData)
      .subscribe({
        next: (response) => {
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

  /**
   * Vraća postavke na default vrednosti
   */
  resetToDefaults(): void {
    const defaultPaymentMethods: any = {};
    this.paymentMethodsConfig.forEach(method => {
      defaultPaymentMethods[method.key] = {
        enabled: method.defaultEnabled,
        label: method.defaultLabel
      };
    });

    const defaultSettings = {
      paymentMethods: defaultPaymentMethods,
      defaultTaxRate: 20,
      maxDiscountPercent: 50,
      allowNegativePrice: false,
      receiptNumberFormat: 'FAC-YYYYMMDD-####',
      header: '',
      footer: '',
      showQR: true,
      showFiscalNumber: true,
      fiscalization: {
        enabled: false,
        provider: 'none',
        timeout: 5000,
        retryCount: 3
      }
    };
    
    this.settingsForm.patchValue(defaultSettings);

    this.snackBar.open('Podešavanja vraćena na podrazumevano', 'Zatvori', { duration: 2000 });
  }

  /**
   * Helper metode za template
   */
  getPaymentMethodKeys(): string[] {
    return this.paymentMethodsConfig.map(m => m.key);
  }

  getPaymentMethodControl(key: string, field: string) {
    return this.settingsForm.get(`paymentMethods.${key}.${field}`);
  }

  getFiscalProviders() {
    return this.fiscalProviders;
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('sr-RS', {
      style: 'currency',
      currency: 'RSD'
    }).format(amount);
  }
}