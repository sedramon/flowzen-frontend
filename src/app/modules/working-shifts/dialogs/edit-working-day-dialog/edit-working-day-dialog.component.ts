import { Component } from '@angular/core';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { CheckboxModule } from 'primeng/checkbox';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-edit-working-day-dialog',
  standalone: true,
  templateUrl: './edit-working-day-dialog.component.html',
  styleUrls: ['./edit-working-day-dialog.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    CheckboxModule
  ]
})
export class EditWorkingDayDialogComponent {
  form: FormGroup;
  shiftTypes: any[] = [];

  constructor(
    public ref: DynamicDialogRef,
    public config: DynamicDialogConfig,
    private fb: FormBuilder
  ) {
    const data = this.config.data;
    this.shiftTypes = data.shiftTypes || [
      { value: 'morning', label: 'Jutarnja', time: '08:00-14:00' },
      { value: 'afternoon', label: 'Popodnevna', time: '14:00-20:00' },
      { value: 'evening', label: 'Večernja', time: '16:00-22:00' },
      { value: 'full', label: 'Cela smena', time: '08:00-20:00' }
    ];

    this.form = this.fb.group({
      works: [!!data.shift.shiftType, []],
      shiftType: [data.shift.shiftType || 'morning', []],
      note: [data.shift.note || '', [Validators.maxLength(200)]]
    });
  }

  save() {
    if (this.form.valid) {
      const { works, shiftType, note } = this.form.value;
      this.ref.close(
        works
          ? { shiftType, note }
          : { shiftType: null, note }
      );
    }
  }

  cancel() {
    this.ref.close();
  }
}
