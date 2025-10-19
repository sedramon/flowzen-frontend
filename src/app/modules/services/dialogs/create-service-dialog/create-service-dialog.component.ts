import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { Service } from '../../../../models/Service';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AuthService } from '../../../../core/services/auth.service';
import { MatCheckboxModule } from '@angular/material/checkbox';

@Component({
  selector: 'app-create-service-dialog',
  standalone: true,
  imports: [CommonModule, MatFormFieldModule, ReactiveFormsModule, MatButtonModule, MatDialogModule, MatInputModule, FlexLayoutModule, MatCheckboxModule],
  templateUrl: './create-service-dialog.component.html',
  styleUrl: './create-service-dialog.component.scss'
})
export class CreateServiceDialogComponent implements OnInit {
  isEditMode = false;

  serviceForm = new FormGroup({
    name: new FormControl<string>('', [Validators.required]),
    price: new FormControl<number | null>(null, [
      Validators.required,
      Validators.min(0)
    ]),
    durationMinutes: new FormControl<number | null>(null, [
      Validators.required,
      Validators.min(1)
    ]),
    isActive: new FormControl<boolean | null>(null, [Validators.required]),
    tenant: new FormControl<string>('', [Validators.required])
  });

  constructor(
    private dialogRef: MatDialogRef<CreateServiceDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Service | null,
    private authService: AuthService
  ) { }

 ngOnInit(): void {
    if (this.data) {
      this.isEditMode = true;
      this.serviceForm.patchValue({
        name: this.data.name,
        price: this.data.price,
        isActive: this.data.isActive,
        durationMinutes: this.data.durationMinutes
      });
    }

    this.serviceForm.get('tenant')?.setValue(this.authService.getCurrentUser()!.tenant!);
  }

  save(): void {
    if (this.serviceForm.invalid) {
      return;
    }

    // Just grab the form values: { name, price, durationMinutes }
    const formValue = this.serviceForm.value as {
      name: string;
      price: number;
      durationMinutes: number;
      isActive: boolean;
      tenant: string
    };

    // Return only the “body” fields. Parent will attach the _id if needed.
    this.dialogRef.close({
      name: formValue.name,
      price: formValue.price,
      durationMinutes: formValue.durationMinutes,
      isActive: formValue.isActive,
      tenant: formValue.tenant
    } as Service);
  }

  close(): void {
    this.dialogRef.close();
  }
}
