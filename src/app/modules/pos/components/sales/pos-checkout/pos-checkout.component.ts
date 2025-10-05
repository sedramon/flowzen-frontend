import { Component, Inject, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCardModule } from '@angular/material/card';
import { CommonModule, DecimalPipe } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { PosService } from '../../../services/pos.service';
import { 
  CreateSaleRequest, 
  SaleResponse, 
  SaleItem, 
  SalePayment, 
  SaleSummary 
} from '../../../../../models/Sale';
import { Article } from '../../../../../models/Article';
import { Appointment } from '../../../../../models/Appointment';
import { Client } from '../../../../../models/Client';
import { Facility } from '../../../../../models/Facility';

/**
 * Payment Method Interface
 */
interface PaymentMethodOption {
  value: 'cash' | 'card' | 'voucher' | 'gift' | 'bank' | 'other';
  label: string;
}

/**
 * Checkout Dialog Data Interface
 */
interface CheckoutDialogData {
  appointment?: Appointment;
  articles?: Article[];
  client?: Client;
  total?: number;
  facility?: Facility;
  tenant?: string;
}

/**
 * POS Checkout Component
 * 
 * Komponenta za kreiranje novih prodaja u POS sistemu.
 * Omogućava dodavanje stavki, konfiguraciju plaćanja i kreiranje sale transakcije.
 */
@Component({
  selector: 'app-pos-checkout',
  templateUrl: './pos-checkout.component.html',
  styleUrls: ['./pos-checkout.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatCardModule
  ],
  providers: [DecimalPipe],
})
export class PosCheckoutComponent implements OnInit, OnDestroy {
  // ============================================================================
  // INPUTS & OUTPUTS
  // ============================================================================

  @Input() appointment?: Appointment;
  @Input() articles: Article[] = [];
  @Input() client?: Client;
  @Input() total: number = 0;
  @Input() facility?: Facility;
  @Output() success = new EventEmitter<SaleResponse>();
  @Output() error = new EventEmitter<Error>();

  // ============================================================================
  // COMPONENT STATE
  // ============================================================================

  form!: FormGroup;
  loading = false;
  errorMsg = '';
  successMsg = '';
  availableArticles: Article[] = [];
  private destroy$ = new Subject<void>();

  // ============================================================================
  // CONSTANTS
  // ============================================================================

  readonly paymentMethods: PaymentMethodOption[] = [
    { value: 'cash', label: 'Keš' },
    { value: 'card', label: 'Kartica' },
    { value: 'voucher', label: 'Vaučer' },
    { value: 'gift', label: 'Poklon' },
    { value: 'bank', label: 'Bank Transfer' },
    { value: 'other', label: 'Ostalo' },
  ];

  readonly defaultTaxRate = 20;
  readonly minPaymentAmount = 1;

  // ============================================================================
  // CONSTRUCTOR & LIFECYCLE
  // ============================================================================

  constructor(
    private readonly fb: FormBuilder,
    private readonly posService: PosService,
    public readonly dialogRef: MatDialogRef<PosCheckoutComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CheckoutDialogData
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    this.initializeAppointmentItems();
    this.loadAvailableArticles();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ============================================================================
  // INITIALIZATION METHODS
  // ============================================================================

  /**
   * Initialize reactive form
   */
  private initializeForm(): void {
    this.form = this.fb.group({
      items: this.fb.array([]),
      payments: this.fb.array([
        this.fb.group({
          method: ['cash', Validators.required],
          amount: [this.data?.total || 0, [Validators.required, Validators.min(this.minPaymentAmount)]],
        }),
      ]),
      discount: [0, [Validators.min(0)]],
      note: [''],
    });
  }

  /**
   * Initialize appointment items if provided
   */
  private initializeAppointmentItems(): void {
    if (this.data?.appointment?.service) {
      this.items.push(
        this.fb.group({
          refId: [this.data.appointment.service._id, Validators.required],
          name: [this.data.appointment.service.name, Validators.required],
          qty: [1, [Validators.required, Validators.min(1)]],
          unitPrice: [this.data.appointment.service.price, [Validators.required, Validators.min(0)]],
          discount: [0, [Validators.min(0)]],
          taxRate: [this.defaultTaxRate, [Validators.required, Validators.min(0), Validators.max(100)]],
          type: ['service'],
        })
      );
    }
  }

  // ============================================================================
  // FORM GETTERS
  // ============================================================================

  get items(): FormArray {
    return this.form.get('items') as FormArray;
  }

  get payments(): FormArray {
    return this.form.get('payments') as FormArray;
  }

  /**
   * Calculate total sum of all items
   */
  get totalSum(): number {
    const itemsTotal = this.items.value.reduce((sum: number, item: SaleItem) => {
      const qty = Number(item.qty) || 0;
      const unitPrice = Number(item.unitPrice) || 0;
      const discount = Number(item.discount) || 0;
      return sum + (qty * unitPrice) - discount;
    }, 0);
    
    const globalDiscount = Number(this.form.value.discount) || 0;
    return itemsTotal - globalDiscount;
  }

  // ============================================================================
  // DATA LOADING METHODS
  // ============================================================================

  /**
   * Load available articles for selection
   */
  private loadAvailableArticles(): void {
    const tenant = this.data?.tenant || '';
    if (!tenant) {
      console.warn('No tenant provided for loading articles');
      return;
    }

    this.posService.getArticles(tenant)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (articles: Article[]) => {
          this.availableArticles = articles || [];
        },
        error: (err: Error) => {
          console.error('Error loading articles:', err);
          this.availableArticles = [];
        }
      });
  }

  // ============================================================================
  // ITEM MANAGEMENT METHODS
  // ============================================================================

  /**
   * Add article to cart
   * @param article - Article to add
   */
  addArticle(article: Article): void {
    if (!article || !article._id) {
      console.error('Invalid article provided');
      return;
    }

    const existingItemIndex = this.items.controls.findIndex(
      (control) => control.get('refId')?.value === article._id
    );
    
    if (existingItemIndex >= 0) {
      // Increase quantity of existing item
      const existingItem = this.items.at(existingItemIndex);
      const currentQty = Number(existingItem.get('qty')?.value) || 0;
      existingItem.get('qty')?.setValue(currentQty + 1);
    } else {
      // Add new item
      this.items.push(this.createItemFormGroup(article));
    }
  }

  /**
   * Create form group for item
   * @param article - Article data
   * @returns FormGroup for item
   */
  private createItemFormGroup(article: Article): FormGroup {
    return this.fb.group({
      refId: [article._id, Validators.required],
      name: [article.name, Validators.required],
      qty: [1, [Validators.required, Validators.min(1)]],
      unitPrice: [article.price, [Validators.required, Validators.min(0)]],
      discount: [0, [Validators.min(0)]],
      taxRate: [this.defaultTaxRate, [Validators.required, Validators.min(0), Validators.max(100)]],
      type: ['product'],
    });
  }

  /**
   * Remove item from cart
   * @param index - Index of item to remove
   */
  removeItem(index: number): void {
    if (index >= 0 && index < this.items.length) {
      this.items.removeAt(index);
    }
  }

  // ============================================================================
  // PAYMENT MANAGEMENT METHODS
  // ============================================================================

  /**
   * Add new payment method
   */
  addPayment(): void {
    this.payments.push(
      this.fb.group({
        method: ['cash', Validators.required],
        amount: [0, [Validators.required, Validators.min(this.minPaymentAmount)]],
      })
    );
  }

  /**
   * Remove payment method
   * @param index - Index of payment to remove
   */
  removePayment(index: number): void {
    if (this.payments.length > 1 && index >= 0 && index < this.payments.length) {
      this.payments.removeAt(index);
    }
  }

  // ============================================================================
  // SUBMISSION METHODS
  // ============================================================================

  /**
   * Submit form and create sale
   */
  submit(): void {
    if (!this.validateForm()) {
      return;
    }

    this.loading = true;
    this.clearMessages();

    const saleData = this.prepareSaleData();
    
    this.posService.createSale(saleData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: SaleResponse) => {
          this.handleSuccess(response);
        },
        error: (error: Error) => {
          this.handleError(error);
        }
      });
  }

  /**
   * Validate form before submission
   * @returns True if form is valid
   */
  private validateForm(): boolean {
    if (this.form.invalid) {
      console.warn('Form is invalid:', this.form.errors);
      this.errorMsg = 'Molimo popunite sva obavezna polja';
      return false;
    }

    if (this.items.length === 0) {
      this.errorMsg = 'Dodajte bar jednu stavku za naplatu';
      return false;
    }

    const paymentTotal = this.payments.value.reduce((sum: number, payment: SalePayment) => 
      sum + (Number(payment.amount) || 0), 0
    );

    if (paymentTotal < this.totalSum) {
      this.errorMsg = 'Ukupno plaćanje mora biti veće ili jednako ukupnoj sumi';
      return false;
    }

    return true;
  }

  /**
   * Prepare sale data for backend
   * @returns Sale request data
   */
  private prepareSaleData(): CreateSaleRequest {
    const processedItems = this.processItems();
    const summary = this.calculateSummary(processedItems);
    
    return {
      facility: typeof this.data?.facility === 'string' 
        ? this.data.facility 
        : this.data?.facility?._id || '',
      appointment: this.data?.appointment?.id,
      client: this.data?.client?._id,
      items: processedItems,
      payments: this.payments.value,
      summary,
      note: this.form.value.note || ''
    };
  }

  /**
   * Process items with proper calculations
   * @returns Processed items array
   */
  private processItems(): SaleItem[] {
    return this.items.value.map((item: any) => {
      const qty = Number(item.qty) || 1;
      const unitPrice = Number(item.unitPrice) || 0;
      const discount = Number(item.discount) || 0;
      const taxRate = Number(item.taxRate) || this.defaultTaxRate;
      const total = (qty * unitPrice) - discount;
      
      return {
        refId: item.refId,
        type: item.type,
        name: item.name,
        qty,
        unitPrice,
        discount,
        taxRate,
        total
      };
    });
  }

  /**
   * Calculate sale summary
   * @param items - Processed items
   * @returns Sale summary
   */
  private calculateSummary(items: SaleItem[]): SaleSummary {
    const subtotal = items.reduce((sum: number, item: SaleItem) => 
      sum + (item.qty * item.unitPrice), 0
    );
    
    const discountTotal = items.reduce((sum: number, item: SaleItem) => 
      sum + (item.discount || 0), 0
    );
    
    const taxTotal = items.reduce((sum: number, item: SaleItem) => 
      sum + ((item.total || 0) * (item.taxRate || 0) / 100), 0
    );
    
    const grandTotal = items.reduce((sum: number, item: SaleItem) => 
      sum + (item.total || 0), 0
    );

    return {
      subtotal,
      discountTotal,
      taxTotal,
      tip: 0,
      grandTotal
    };
  }

  /**
   * Handle successful sale creation
   * @param response - Sale response
   */
  private handleSuccess(response: SaleResponse): void {
    this.loading = false;
    this.successMsg = 'Račun uspešno izdat!';
    this.success.emit(response);
    
    setTimeout(() => {
      this.dialogRef.close(response);
    }, 1000);
  }

  /**
   * Handle sale creation error
   * @param error - Error object
   */
  private handleError(error: Error): void {
    this.loading = false;
    this.errorMsg = this.getErrorMessage(error);
    this.error.emit(error);
  }

  /**
   * Get user-friendly error message
   * @param error - Error object
   * @returns Error message
   */
  private getErrorMessage(error: any): string {
    if (error?.error?.message) {
      return error.error.message;
    }
    if (error?.message) {
      return error.message;
    }
    return 'Greška pri naplati. Molimo pokušajte ponovo.';
  }

  /**
   * Clear error and success messages
   */
  private clearMessages(): void {
    this.errorMsg = '';
    this.successMsg = '';
  }
}
