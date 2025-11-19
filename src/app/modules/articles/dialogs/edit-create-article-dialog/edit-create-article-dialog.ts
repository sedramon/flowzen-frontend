import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { CheckboxModule } from 'primeng/checkbox';
import { AuthService } from '../../../../core/services/auth.service';
import { trigger, style, animate, transition, keyframes } from '@angular/animations';

@Component({
  selector: 'app-edit-create-article-dialog',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    MatDialogModule, 
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    SelectModule,
    CheckboxModule
  ],
  templateUrl: './edit-create-article-dialog.html',
  styleUrl: './edit-create-article-dialog.scss',
  animations: [
    trigger('dialogPop', [
      transition(':enter', [
        animate('250ms cubic-bezier(0.68, -0.55, 0.265, 1.55)', keyframes([
          style({ transform: 'scale(0.95)', opacity: 0, offset: 0 }),
          style({ transform: 'scale(1)', opacity: 1, offset: 1 })
        ]))
      ])
    ])
  ]
})
export class EditCreateArticleDialog implements OnInit {
  isEditMode = false;

  articleForm!: FormGroup<{
    name: FormControl<string>;
    unitOfMeasure: FormControl<string>;
    price: FormControl<number | null>;
    salePrice: FormControl<number | null>;
    isOnSale: FormControl<boolean>;
    code: FormControl<string>;
    taxRates: FormControl<number>;
    supplier: FormControl<string | null>;
    tenant: FormControl<string>;
    isActive: FormControl<boolean>;
    remark: FormControl<string>;
  }>;

  unitOptions = [
    { label: 'Komad', value: 'piece' },
    { label: 'Kilogram', value: 'kg' },
    { label: 'Litar', value: 'liter' },
    { label: 'Kutija', value: 'box' },
    { label: 'Mililitar', value: 'mililiter' }
  ];

  taxRateOptions = [
    { label: '0%', value: 0 },
    { label: '20%', value: 20 }
  ];

  supplierOptions: { label: string; value: string }[] = [];

  constructor(
    private dialogRef: MatDialogRef<EditCreateArticleDialog>,
    private fb: FormBuilder,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    // Initialize supplier options
    if (this.data?.suppliers) {
      this.supplierOptions = this.data.suppliers.map((supplier: any) => ({
        label: supplier.name,
        value: supplier._id
      }));
    }

    this.articleForm = this.fb.group({
      name: ['', Validators.required],
      unitOfMeasure: ['', Validators.required],
      price: [null, Validators.required],
      salePrice: [null],
      isOnSale: [false],
      code: [''],
      taxRates: [0],
      supplier: [null],
      tenant: ['', Validators.required],
      isActive: [true],
      remark: [''],
    }) as typeof this.articleForm;

    this.articleForm.get('tenant')!.setValue(this.authService.requireCurrentTenantId());

    if (this.data?.article) {
      this.isEditMode = true;

      const { supplier, tenant, ...rest } = this.data.article;
      this.articleForm.patchValue(rest);

      this.articleForm.get('supplier')!
        .setValue(supplier?._id ?? null);
    }
  }

  close() {
    this.dialogRef.close();
  }

  save() {
    if (this.articleForm.invalid) {
      // Mark all fields as touched to show validation errors
      Object.keys(this.articleForm.controls).forEach(key => {
        this.articleForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.dialogRef.close(this.articleForm.value);
  }
}
