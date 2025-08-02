import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormField, MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Supplier } from '../../../../models/Supplier';
import { AuthService } from '../../../../core/services/auth.service';
import { FlexLayoutModule } from '@angular/flex-layout';

@Component({
  selector: 'app-edit-create-supplier-dialog',
  imports: [CommonModule, MatFormFieldModule, ReactiveFormsModule, FormsModule, MatButtonModule, MatInputModule, FlexLayoutModule],
  templateUrl: './edit-create-supplier-dialog.html',
  styleUrl: './edit-create-supplier-dialog.scss'
})
export class EditCreateSupplierDialog implements OnInit {

  isEditMode = false;
  supplierForm = new FormGroup({
    name: new FormControl<string>('', [Validators.required]),
    address: new FormControl<string>('', [Validators.required]),
    contactPhone: new FormControl<string>('', [Validators.required]),
    contactEmail: new FormControl<string>('', [Validators.required]),
    tenant: new FormControl<string>('', [Validators.required])
  });

  constructor(
    private dialogRef: MatDialogRef<EditCreateSupplierDialog>,
    @Inject(MAT_DIALOG_DATA) public data: Supplier | null,
    private authService: AuthService
  ) {
  }


  ngOnInit(): void {
    if(this.data){
      this.isEditMode = true;
      this.supplierForm.patchValue({
        name: this.data.name,
        address: this.data.address,
        contactPhone: this.data.contactPhone,
        contactEmail: this.data.contactEmail
      })
    }

    this.supplierForm.get('tenant')?.setValue(this.authService.getCurrentUser()!.tenant);
  }


  save() {
    if(this.supplierForm.invalid){
      return;
    }

    this.dialogRef.close(this.supplierForm.value)
  }

  close() {
    this.dialogRef.close();
  }

}
