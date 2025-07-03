import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

@Component({
  selector: 'app-edit-working-day-dialog',
  standalone: true,
  templateUrl: './edit-working-day-dialog.component.html',
  styleUrls: ['./edit-working-day-dialog.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatSlideToggleModule
  ]
})
export class EditWorkingDayDialogComponent {
  form: FormGroup;
  shiftTypes = [
    { value: 'morning', label: 'Jutarnja', time: '08:00-14:00' },
    { value: 'afternoon', label: 'Popodnevna', time: '14:00-20:00' },
    { value: 'evening', label: 'Večernja', time: '16:00-22:00' },
    { value: 'full', label: 'Cela smena', time: '08:00-20:00' }
  ];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dialogRef: MatDialogRef<EditWorkingDayDialogComponent>,
    private fb: FormBuilder
  ) {
    this.form = this.fb.group({
      works: [!!data.shift.shiftType, []],
      shiftType: [data.shift.shiftType || 'morning', []],
      note: [data.shift.note || '', [Validators.maxLength(200)]]
    });
  }

  save() {
    if (this.form.valid) {
      const { works, shiftType, note } = this.form.value;
      this.dialogRef.close(
        works
          ? { shiftType, note }
          : { shiftType: null, note }
      );
    }
  }
}
