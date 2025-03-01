import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, Inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldControl, MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Scope } from '../../../../models/Scope';
import { ScopeService } from '../../../../core/services/scope.service';
import { FlexLayoutModule } from '@angular/flex-layout';

@Component({
  selector: 'app-edit-role-dialog',
  standalone: true,
  imports: [CommonModule, MatFormFieldModule, MatSelectModule, ReactiveFormsModule, MatButtonModule, MatDialogModule, MatInputModule, FlexLayoutModule],
  templateUrl: './edit-role-dialog.component.html',
  styleUrl: './edit-role-dialog.component.scss'
})
export class EditRoleDialogComponent {
  roleForm = new FormGroup({
    name: new FormControl<string>('', [Validators.required]),
    availableScopes: new FormControl<string[]>([], [Validators.required]) // Ensure it's an array
  });

  allScopes: any[] = []; // Holds all available scopes

  constructor(
    public dialogRef: MatDialogRef<EditRoleDialogComponent>,
    private http: HttpClient,
    private scopeService: ScopeService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.roleForm = new FormGroup({
      name: new FormControl<string>(data.role.name || ''), // Ensure non-null name
      availableScopes: new FormControl<string[]>([]) // Initialize empty until scopes load
    });

    this.getAllScopes();
  }

  getAllScopes() {
    this.scopeService.fetchScopes().subscribe(
      (scopes) => {
        this.allScopes = scopes;

        // Set the selected scopes after loading all scopes
        const selectedScopeIds = this.data.role.availableScopes.map((s: any) => s._id);
        this.roleForm.controls.availableScopes.setValue(selectedScopeIds);
      },
      (error) => {
        console.error('Error fetching scopes:', error);
      }
    );
  }

  updateRole() {
    const updatedData = {
      name: this.roleForm.get('name')?.value || '',
      availableScopes: this.roleForm.get('availableScopes')?.value || [],
      tenant: this.data.role.tenant
    };
  
    // Close the dialog and pass the updated role data back to the parent component
    this.dialogRef.close(updatedData);
  }
  

  closeDialog() {
    this.dialogRef.close();
  }
}
