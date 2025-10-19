import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormField, MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-edit-create-article-dialog',
  imports: [CommonModule, MatFormFieldModule, ReactiveFormsModule, FormsModule, MatButtonModule, MatInputModule, FlexLayoutModule, MatSelectModule, MatCheckboxModule],
  templateUrl: './edit-create-article-dialog.html',
  styleUrl: './edit-create-article-dialog.scss'
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

  constructor(
    private dialogRef: MatDialogRef<EditCreateArticleDialog>,
    private fb: FormBuilder,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
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

    this.articleForm.get('tenant')!.setValue(this.authService.getCurrentUser()!.tenant!);

    if (this.data.article) {
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
    this.dialogRef.close(this.articleForm.value)
  }
}
