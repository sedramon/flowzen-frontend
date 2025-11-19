import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { Supplier } from '../../../../models/Supplier';
import { AuthService } from '../../../../core/services/auth.service';
import { trigger, style, animate, transition, keyframes } from '@angular/animations';

@Component({
  selector: 'app-edit-create-supplier-dialog',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    MatDialogModule, 
    ButtonModule,
    InputTextModule,
    SelectModule
  ],
  templateUrl: './edit-create-supplier-dialog.html',
  styleUrl: './edit-create-supplier-dialog.scss',
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
export class EditCreateSupplierDialog implements OnInit {

  isEditMode = false;
  supplierForm!: FormGroup<{
    name: FormControl<string>;
    address: FormControl<string>;
    city: FormControl<string>;
    contactPhone: FormControl<string>;
    contactEmail: FormControl<string>;
    contactLandline: FormControl<string>;
    contactPerson: FormControl<string>;
    pib: FormControl<string>;
    remark: FormControl<string>;
    tenant: FormControl<string>;
    isActive: FormControl<boolean>;
  }>;

  constructor(
    private dialogRef: MatDialogRef<EditCreateSupplierDialog>,
    @Inject(MAT_DIALOG_DATA) public data: Supplier | null,
    private authService: AuthService,
    private fb: FormBuilder
  ) {
  }

  ngOnInit(): void {
    this.supplierForm = this.fb.group({
      name: ['', Validators.required],
      address: ['', Validators.required],
      city: ['', Validators.required],
      contactPhone: ['', Validators.required],
      contactEmail: ['', [Validators.required, Validators.email]],
      contactLandline: [''],
      contactPerson: [''],
      pib: [''],
      remark: [''],
      tenant: ['', Validators.required],
      isActive: [true]
    }) as typeof this.supplierForm;

    if (this.data) {
      this.isEditMode = true;
      
      const {tenant, ...rest } = this.data;
      this.supplierForm.patchValue(rest);
    }

    this.supplierForm.get('tenant')?.setValue(this.authService.requireCurrentTenantId());
  }

  save() {
    if (this.supplierForm.invalid) {
      // Mark all fields as touched to show validation errors
      Object.keys(this.supplierForm.controls).forEach(key => {
        this.supplierForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.dialogRef.close(this.supplierForm.value);
  }

  close() {
    this.dialogRef.close();
  }
}
