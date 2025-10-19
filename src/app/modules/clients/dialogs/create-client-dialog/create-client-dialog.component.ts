import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormField, MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-create-client-dialog',
  standalone: true,
  imports: [CommonModule, MatFormFieldModule, ReactiveFormsModule, MatButtonModule, MatDialogModule, MatInputModule, FlexLayoutModule],
  templateUrl: './create-client-dialog.component.html',
  styleUrl: './create-client-dialog.component.scss'
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
    this.clientForm.get('tenant')?.setValue(this.authService.getCurrentUser()!.tenant!);
  }

  createClient() {
    const client = this.clientForm.value;

    this.dialogRef.close(client);
  }

  closeDialog() {
    this.dialogRef.close();
  }

}
