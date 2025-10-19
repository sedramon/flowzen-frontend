import { Component, Inject, OnInit } from '@angular/core';
import { AuthService } from '../../../../core/services/auth.service';
import { Facility } from '../../../../models/Facility';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-create-edit-facility-dialog',
  imports: [CommonModule, MatFormFieldModule, ReactiveFormsModule, FormsModule, MatButtonModule, MatInputModule, FlexLayoutModule, MatSelectModule],
  templateUrl: './create-edit-facility-dialog.html',
  styleUrl: './create-edit-facility-dialog.scss'
})
export class CreateEditFacilityDialog implements OnInit {

  isEditMode: boolean = false;

  facilityForm = new FormGroup({
    name: new FormControl<string>('', [Validators.required]),
    address: new FormControl<string>('', [Validators.required]),
    openingHour: new FormControl<string>('', [Validators.required]),
    closingHour: new FormControl<string>('', [Validators.required]),
    tenant: new FormControl<string>('',[Validators.required])
  })

  constructor(
    private authService: AuthService,
    @Inject(MAT_DIALOG_DATA) public data: Facility | null,
    private dialogRef: MatDialogRef<CreateEditFacilityDialog>
  ) {}

  ngOnInit(): void {
    if(this.data){
      this.isEditMode = true;
      this.facilityForm.patchValue({
        name: this.data.name,
        address: this.data.address,
        openingHour: this.data.openingHour,
        closingHour: this.data.closingHour
      })
    }

    this.facilityForm.get('tenant')?.setValue(this.authService.getCurrentUser()!.tenant!);
  }

  save(){
    if(this.facilityForm.invalid) {
      return;
    }

    this.dialogRef.close(this.facilityForm.value)
  }

  close(){
    this.dialogRef.close();
  }
}
