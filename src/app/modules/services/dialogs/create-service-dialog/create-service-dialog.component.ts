import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { Service } from '../../../../models/Service';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { CheckboxModule } from 'primeng/checkbox';
import { AuthService } from '../../../../core/services/auth.service';
import { trigger, style, animate, transition, keyframes } from '@angular/animations';

@Component({
  selector: 'app-create-service-dialog',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    MatDialogModule, 
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    CheckboxModule
  ],
  templateUrl: './create-service-dialog.component.html',
  styleUrl: './create-service-dialog.component.scss',
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
    isActive: new FormControl<boolean>(true, [Validators.required]),
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

    this.serviceForm.get('tenant')?.setValue(this.authService.requireCurrentTenantId());
  }

  save(): void {
    if (this.serviceForm.invalid) {
      // Mark all fields as touched to show validation errors
      Object.keys(this.serviceForm.controls).forEach(key => {
        this.serviceForm.get(key)?.markAsTouched();
      });
      return;
    }

    const formValue = this.serviceForm.value as {
      name: string;
      price: number;
      durationMinutes: number;
      isActive: boolean;
      tenant: string
    };

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
