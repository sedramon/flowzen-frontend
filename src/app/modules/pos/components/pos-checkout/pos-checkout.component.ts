import { Component, Inject, Input, Output, EventEmitter } from '@angular/core';
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
import { PosService } from '../../services/pos.service';

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
export class PosCheckoutComponent {
  @Input() appointment: any;
  @Input() articles: any[] = [];
  @Input() client: any;
  @Input() total: number = 0;
  @Input() facility: any;
  @Output() success = new EventEmitter<any>();
  @Output() error = new EventEmitter<any>();

  form: FormGroup;
  loading = false;
  errorMsg = '';
  successMsg = '';
  availableArticles: any[] = [];

  paymentMethods = [
    { value: 'cash', label: 'Keš' },
    { value: 'card', label: 'Kartica' },
    { value: 'voucher', label: 'Vaučer' },
    { value: 'bank', label: 'Bank Transfer' },
    { value: 'other', label: 'Ostalo' },
  ];

  constructor(
    private fb: FormBuilder,
    private posService: PosService,
    public dialogRef: MatDialogRef<PosCheckoutComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.form = this.fb.group({
      items: this.fb.array([]),
      payments: this.fb.array([
        this.fb.group({
          method: ['cash', Validators.required],
          amount: [this.data?.total || 0, [Validators.required, Validators.min(1)]],
        }),
      ]),
      discount: [0],
      note: [''],
    });
    
    // Dodaj uslugu iz appointment-a
    if (data?.appointment) {
      this.items.push(
        this.fb.group({
          refId: [data.appointment.service._id],
          name: [data.appointment.service.name],
          qty: [1],
          unitPrice: [data.appointment.service.price],
          type: ['service'],
        })
      );
    }
    
    // Ne dodaj artikle za novu prodaju - korisnik će ih dodati ručno
    
    // Učitaj dostupne artikle za dodavanje
    this.loadAvailableArticles();
  }

  get items() {
    return this.form.get('items') as FormArray;
  }
  get payments() {
    return this.form.get('payments') as FormArray;
  }

  // Učitaj dostupne artikle
  loadAvailableArticles() {
    const currentUser = this.data?.tenant || '';
    this.posService.getArticles(currentUser).subscribe({
      next: (articles) => {
        this.availableArticles = articles;
      },
      error: (err) => {
        console.error('Error loading articles:', err);
      }
    });
  }

  // Dodaj artikal u korpu
  addArticle(article: any) {
    const existingItem = this.items.controls.find(
      (item: any) => item.get('refId')?.value === article._id
    );
    
    if (existingItem) {
      // Ako artikal već postoji, povećaj količinu
      const currentQty = existingItem.get('qty')?.value || 0;
      existingItem.get('qty')?.setValue(currentQty + 1);
    } else {
      // Dodaj novi artikal
      this.items.push(
        this.fb.group({
          refId: [article._id],
          name: [article.name],
          qty: [1, [Validators.required, Validators.min(1)]],
          unitPrice: [article.price, Validators.required],
          type: ['product'],
        })
      );
    }
  }

  // Ukloni artikal iz korpe
  removeItem(index: number) {
    this.items.removeAt(index);
  }

  addPayment() {
    this.payments.push(
      this.fb.group({
        method: ['cash', Validators.required],
        amount: [0, [Validators.required, Validators.min(1)]],
      })
    );
  }
  removePayment(i: number) {
    if (this.payments.length > 1) this.payments.removeAt(i);
  }

  get totalSum() {
    return this.items.value.reduce((sum: number, i: any) => sum + i.qty * i.unitPrice, 0) - (this.form.value.discount || 0);
  }

  submit() {
    console.log('Submit clicked, form valid:', this.form.valid, 'items length:', this.items.length);
    if (this.form.invalid) {
      console.log('Form is invalid:', this.form.errors);
      return;
    }
    if (this.items.length === 0) {
      this.errorMsg = 'Dodajte bar jednu stavku za naplatu';
      return;
    }
    this.loading = true;
    this.errorMsg = '';

    // Pripremi items sa svim potrebnim poljima
    const items = this.items.value.map((item: any) => {
      const qty = Number(item.qty) || 1;
      const unitPrice = Number(item.unitPrice) || 0;
      const discount = typeof item.discount === 'number' ? item.discount : (this.form.value.discount || 0);
      const taxRate = typeof item.taxRate === 'number' ? item.taxRate : 20;
      const total = (qty * unitPrice) - discount;
      return {
        ...item,
        qty,
        unitPrice,
        discount,
        taxRate,
        total,
      };
    });

    // Izračunaj summary
    const subtotal = items.reduce((sum: number, i: any) => sum + (i.qty * i.unitPrice), 0);
    const discountTotal = items.reduce((sum: number, i: any) => sum + (i.discount || 0), 0);
    const taxTotal = items.reduce((sum: number, i: any) => sum + ((i.total || 0) * (i.taxRate || 0) / 100), 0);
    const grandTotal = items.reduce((sum: number, i: any) => sum + (i.total || 0), 0);
    const summary = {
      subtotal,
      discountTotal,
      taxTotal,
      tip: 0,
      grandTotal,
      note: this.form.value.note || '',
    };

    const payload: any = {
      facility: this.data?.facility?._id || this.data?.facility,
      appointment: this.data?.appointment?.id,
      client: this.data?.client?._id,
      items,
      payments: this.payments.value,
      summary,
    };

    this.posService.createSale(payload).subscribe({
      next: (res) => {
        this.loading = false;
        this.successMsg = 'Račun uspešno izdat!';
        this.success.emit(res);
        setTimeout(() => this.dialogRef.close(res), 1000);
      },
      error: (err) => {
        this.loading = false;
        this.errorMsg = err?.error?.message || 'Greška pri naplati.';
        this.error.emit(err);
      },
    });
  }
}
