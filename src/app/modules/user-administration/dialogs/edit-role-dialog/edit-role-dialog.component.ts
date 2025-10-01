import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import {
  MatDialogModule,
  MAT_DIALOG_DATA,
  MatDialogRef,
} from '@angular/material/dialog';
import { FlexLayoutModule } from '@angular/flex-layout';
import { ScopeService } from '../../../../core/services/scope.service';
import { MatIconModule } from '@angular/material/icon';
import { MatCard, MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';

@Component({
  selector: 'app-edit-role-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatCheckboxModule,
    MatInputModule,
    MatButtonModule,
    MatDialogModule,
    FlexLayoutModule,
    MatIconModule,
    MatCardModule,
    MatToolbarModule,
  ],
  templateUrl: './edit-role-dialog.component.html',
  styleUrls: ['./edit-role-dialog.component.scss'],
})
export class EditRoleDialogComponent implements OnInit {
  /** The reactive form */
  roleForm = new FormGroup({
    name: new FormControl<string>('', Validators.required),
    entity: new FormControl<string>('', Validators.required),
    actions: new FormGroup({}), // This will be dynamically populated
  });

  allScopes: any[] = [];
  scopeGroups: Record<string, Record<string, string>> = {};
  uniqueEntities: string[] = [];

  existingScopeIds: string[] = [];

  constructor(
    public dialogRef: MatDialogRef<EditRoleDialogComponent>,
    private scopeService: ScopeService,
    @Inject(MAT_DIALOG_DATA) public data: { role: any }
  ) {}

  ngOnInit(): void {
    this.roleForm.controls.name.setValue(this.data.role.name || '');

    this.scopeService.fetchScopes().subscribe({
      next: (scopes) => {
        this.allScopes = scopes;
        this.groupScopes();
        this.existingScopeIds = this.normalizeIds(
          this.data.role.availableScopes
        );

        this.prefillFromExisting();

        this.roleForm.controls.entity.valueChanges.subscribe((entity) =>
          this.populateActionsFor(entity!)
        );
      },
      error: (err) => console.error(err),
    });
  }

  get availableActions(): string[] {
    const entity = this.roleForm.controls.entity.value;
    return entity && this.scopeGroups[entity]
      ? Object.keys(this.scopeGroups[entity])
      : [];
  }

  private normalizeIds(raw: any[]): string[] {
    return raw
      .map((s) => {
        if (!s._id) return null;
        if (typeof s._id === 'string') return s._id;
        if (typeof s._id === 'object' && '$oid' in s._id) return s._id.$oid;
        if (typeof s._id.toString === 'function') return s._id.toString();
        return null;
      })
      .filter((x): x is string => !!x);
  }

  private groupScopes() {
    this.scopeGroups = {};
    for (const s of this.allScopes) {
      const m = s.name.match(/^scope_(\w+):(\w+)$/);
      if (!m) continue;
      const [, entity, action] = m;
      this.scopeGroups[entity] ||= {};
      this.scopeGroups[entity][action] = s._id;
    }
    this.uniqueEntities = Object.keys(this.scopeGroups);
  }

  private prefillFromExisting() {
    for (const entity of this.uniqueEntities) {
      const actionsMap = this.scopeGroups[entity];
      if (
        !Object.values(actionsMap).some((id) =>
          this.existingScopeIds.includes(id)
        )
      )
        continue;

      this.roleForm.controls.entity.setValue(entity);
      this.populateActionsFor(entity);
      break;
    }
  }

  private populateActionsFor(entity: string) {
    const actionsMap = this.scopeGroups[entity] || {};
    // Dinamički generiši FormGroup za sve akcije ovog entiteta
    const controls: { [key: string]: FormControl } = {};
    for (const action of Object.keys(actionsMap)) {
      controls[action] = new FormControl(false);
    }
    // Zameni postojeći FormGroup novim
    this.roleForm.setControl('actions', new FormGroup(controls));
    // Popuni vrednosti na osnovu postojeće role
    for (const action of Object.keys(actionsMap)) {
      const scopeId = actionsMap[action];
      this.roleForm.get(['actions', action])?.setValue(this.existingScopeIds.includes(scopeId));
    }
  }

  save(): void {
    const entity = this.roleForm.controls.entity.value!;
    const actions = (this.roleForm.controls.actions as FormGroup)
      .value as Record<string, boolean>;

    const selectedForModule: string[] = [];
    for (const [action, checked] of Object.entries(actions)) {
      const id = this.scopeGroups[entity]?.[action];
      if (checked && id) selectedForModule.push(id);
    }

    const allForModule = Object.values(this.scopeGroups[entity] || {});

    const filtered = this.existingScopeIds.filter(
      (id) => !allForModule.includes(id)
    );

    const updatedFullIds = [...filtered, ...selectedForModule];

    this.dialogRef.close({
      name: this.roleForm.controls.name.value,
      availableScopes: updatedFullIds,
      tenant: this.data.role.tenant,
    });
  }

  cancel(): void {
    this.dialogRef.close();
  }

  /**
   * Vraća skraćeni tekst za prikaz action-a
   */
  getActionDisplayText(action: string): string {
    const displayTexts: { [key: string]: string } = {
      access: 'Access',
      read: 'Read',
      create: 'Create',
      update: 'Update',
      delete: 'Delete',
      sale: 'Sales',
      refund: 'Refund',
      session: 'Sessions',
      report: 'Reports',
      settings: 'Settings',
      cash_management: 'Cash Mgmt',
      cash_reports: 'Cash Reports',
      cash_analytics: 'Cash Analytics'
    };
    
    return displayTexts[action] || action.charAt(0).toUpperCase() + action.slice(1);
  }

  /**
   * Vraća puni tekst za tooltip
   */
  getActionTooltip(action: string): string {
    const tooltipTexts: { [key: string]: string } = {
      access: 'Access Control',
      read: 'Read Access',
      create: 'Create Access',
      update: 'Update Access',
      delete: 'Delete Access',
      sale: 'Sales Management',
      refund: 'Refund Management',
      session: 'Session Management',
      report: 'Report Access',
      settings: 'Settings Access',
      cash_management: 'Cash Management Dashboard',
      cash_reports: 'Cash Reports & Analytics',
      cash_analytics: 'Cash Analytics & Insights'
    };
    
    return tooltipTexts[action] || action.charAt(0).toUpperCase() + action.slice(1);
  }
}
