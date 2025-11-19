import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { AuthService } from '../../../../core/services/auth.service';
import { trigger, style, animate, transition, keyframes } from '@angular/animations';

@Component({
  selector: 'app-create-client-dialog',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    MatDialogModule, 
    ButtonModule,
    InputTextModule
  ],
  templateUrl: './create-client-dialog.component.html',
  styleUrl: './create-client-dialog.component.scss',
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
export class CreateClientDialogComponent implements OnInit {
  clientForm = new FormGroup({
    firstName: new FormControl<string>('', [Validators.required]),
    lastName: new FormControl<string>('', [Validators.required]),
    contactPhone: new FormControl<string>('', [Validators.required, Validators.pattern(/^\d{10}$/)]),
    contactEmail: new FormControl<string>('', [Validators.required, Validators.email]),
    address: new FormControl<string>('', [Validators.required]),
    tenant: new FormControl<string>('', [Validators.required])
  })

  constructor(private authService: AuthService, private dialogRef: MatDialogRef<CreateClientDialogComponent>) { }

  ngOnInit(): void {
    this.clientForm.get('tenant')?.setValue(this.authService.requireCurrentTenantId());
  }

  createClient() {
    if (this.clientForm.valid) {
      const client = this.clientForm.value;
      this.dialogRef.close(client);
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.clientForm.controls).forEach(key => {
        this.clientForm.get(key)?.markAsTouched();
      });
    }
  }

  closeDialog() {
    this.dialogRef.close();
  }
}
