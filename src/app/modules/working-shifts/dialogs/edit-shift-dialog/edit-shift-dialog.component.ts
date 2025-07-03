import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-edit-shift-dialog',
  standalone: true,
  templateUrl: './edit-shift-dialog.component.html',
  styleUrls: ['./edit-shift-dialog.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
  ]
})
export class EditShiftDialogComponent {
  form: FormGroup;
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dialogRef: MatDialogRef<EditShiftDialogComponent>,
    private fb: FormBuilder
  ) {
    this.form = this.fb.group({
      note: [data.shift.note || '', Validators.maxLength(200)]
    });
  }

  save() {
    if (this.form.valid) {
      this.dialogRef.close({ note: this.form.value.note });
    }
  }
}
