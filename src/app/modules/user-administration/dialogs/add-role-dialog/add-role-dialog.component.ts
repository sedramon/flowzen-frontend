import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, Inject, OnInit } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ScopeService } from '../../../../core/services/scope.service';
import { Role } from '../../../../models/Role';
import { Scope } from '../../../../models/Scope';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-add-role-dialog',
  standalone: true,
  imports: [CommonModule, MatFormFieldModule, MatSelectModule, ReactiveFormsModule, MatButtonModule, MatDialogModule, MatInputModule, FlexLayoutModule],
  templateUrl: './add-role-dialog.component.html',
  styleUrl: './add-role-dialog.component.scss'
})
export class AddRoleDialogComponent implements OnInit {

  roleForm = new FormGroup({
    name: new FormControl<string>('', [Validators.required]),
    availableScopes: new FormControl<Scope[]>([], [Validators.required]), // Ensure it's an array
    tenant: new FormControl<string>('', [Validators.required])
  });

  allScopes: any[] = []; // Holds all available scopes

  constructor(
    public dialogRef: MatDialogRef<AddRoleDialogComponent>,
    private http: HttpClient,
    private scopeService: ScopeService,
    private authService: AuthService
  ) {

    
  }

  ngOnInit(): void {
    this.getAllScopes();

    this.roleForm.get('tenant')?.setValue(this.authService.getCurrentUser()!.tenant!);
  }

  getAllScopes() {
    this.scopeService.fetchScopes().subscribe(
      (scopes) => {
        this.allScopes = scopes;
      },
      (error) => {
        console.error('Error fetching scopes:', error);
      }
    );
  }



  closeDialog() {
    this.dialogRef.close(false);
  }

  createRole() {
    const role: Role = {
      name: this.roleForm.get('name')?.value || '',
      availableScopes: this.roleForm.get('availableScopes')?.value || [],
      tenant: this.roleForm.get('tenant')?.value || ''
    }

    this.dialogRef.close(role);
  }

}
