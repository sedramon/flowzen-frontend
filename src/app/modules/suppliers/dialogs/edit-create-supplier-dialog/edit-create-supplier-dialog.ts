import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormField, MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Supplier } from '../../../../models/Supplier';
import { AuthService } from '../../../../core/services/auth.service';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatSelect, MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-edit-create-supplier-dialog',
  standalone: true,
  imports: [CommonModule, MatFormFieldModule, ReactiveFormsModule, FormsModule, MatButtonModule, MatInputModule, FlexLayoutModule, MatSelectModule],
  templateUrl: './edit-create-supplier-dialog.html',
  styleUrl: './edit-create-supplier-dialog.scss'
})
export class EditCreateSupplierDialog implements OnInit {

  isEditMode = false;
  supplierForm! : FormGroup<{
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
      contactEmail: ['', Validators.required],
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

    this.supplierForm.get('tenant')?.setValue(this.authService.getCurrentUser()!.tenant!);
  }


  save() {
    if (this.supplierForm.invalid) {
      return;
    }

    this.dialogRef.close(this.supplierForm.value)
  }

  close() {
    this.dialogRef.close();
  }

}
