import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
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
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-edit-role-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatCheckboxModule,
    MatInputModule,
    MatButtonModule,
    MatDialogModule,
    FlexLayoutModule,
    MatIconModule,
    MatCardModule,
    MatTooltipModule,
  ],
  templateUrl: './edit-role-dialog.component.html',
  styleUrls: ['./edit-role-dialog.component.scss'],
})
export class EditRoleDialogComponent implements OnInit {
  roleForm = new FormGroup({
    name: new FormControl<string>('', [Validators.required]),
    modules: new FormGroup({}), // Dynamic FormGroup for modules
  });

  allScopes: any[] = [];
  scopeGroups: Record<string, Record<string, string>> = {}; // module -> { action -> scopeId }
  uniqueModules: string[] = [];

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
        const existingScopeIds = this.normalizeIds(
          this.data.role.availableScopes
        );
        this.initializeModulesForm(existingScopeIds);
      },
      error: (err) => console.error(err),
    });
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
    for (const scope of this.allScopes) {
      const match = scope.name.match(/^scope_(\w+):(\w+)$/);
      if (!match) continue;
      const [, module, action] = match;
      if (!this.scopeGroups[module]) {
        this.scopeGroups[module] = {};
      }
      this.scopeGroups[module][action] = scope._id || scope.id;
    }
    this.uniqueModules = Object.keys(this.scopeGroups).sort();
  }

  private initializeModulesForm(existingScopeIds: string[]) {
    const modulesFormGroup = new FormGroup({});
    
    for (const module of this.uniqueModules) {
      const actionsFormGroup = new FormGroup({});
      const actionsMap = this.scopeGroups[module];
      
      for (const action of Object.keys(actionsMap)) {
        const scopeId = actionsMap[action];
        const isSelected = existingScopeIds.includes(scopeId);
        actionsFormGroup.addControl(action, new FormControl(isSelected));
      }
      
      modulesFormGroup.addControl(module, actionsFormGroup);
    }
    
    this.roleForm.setControl('modules', modulesFormGroup);
  }

  cancel(): void {
    this.dialogRef.close();
  }

  save(): void {
    const selectedScopeIds: string[] = [];
    const modulesFormGroup = this.roleForm.get('modules') as FormGroup;
    
    for (const module of this.uniqueModules) {
      const actionsFormGroup = modulesFormGroup.get(module) as FormGroup;
      const actionsMap = this.scopeGroups[module];
      
      for (const [action, checked] of Object.entries(actionsFormGroup.value)) {
        if (checked && actionsMap[action]) {
          selectedScopeIds.push(actionsMap[action]);
        }
      }
    }

    const tenantId = typeof this.data.role.tenant === 'string' 
      ? this.data.role.tenant 
      : this.data.role.tenant?._id || this.data.role.tenant?.id || this.data.role.tenant;

    this.dialogRef.close({
      name: this.roleForm.get('name')?.value || '',
      availableScopes: selectedScopeIds,
      tenant: tenantId,
    });
  }

  selectAllForModule(module: string) {
    const modulesFormGroup = this.roleForm.get('modules') as FormGroup;
    const actionsFormGroup = modulesFormGroup.get(module) as FormGroup;
    
    Object.keys(this.scopeGroups[module]).forEach(action => {
      actionsFormGroup.get(action)?.setValue(true);
    });
  }

  deselectAllForModule(module: string) {
    const modulesFormGroup = this.roleForm.get('modules') as FormGroup;
    const actionsFormGroup = modulesFormGroup.get(module) as FormGroup;
    
    Object.keys(this.scopeGroups[module]).forEach(action => {
      actionsFormGroup.get(action)?.setValue(false);
    });
  }

  getModuleActions(module: string): string[] {
    return Object.keys(this.scopeGroups[module] || {});
  }

  allSelectedForModule(module: string): boolean {
    const modulesFormGroup = this.roleForm.get('modules') as FormGroup;
    const actionsFormGroup = modulesFormGroup.get(module) as FormGroup;
    const allActions = Object.keys(this.scopeGroups[module] || {});
    
    if (allActions.length === 0) return false;
    
    return allActions.every(action => {
      return actionsFormGroup.get(action)?.value === true;
    });
  }

  someSelectedForModule(module: string): boolean {
    const modulesFormGroup = this.roleForm.get('modules') as FormGroup;
    const actionsFormGroup = modulesFormGroup.get(module) as FormGroup;
    const allActions = Object.keys(this.scopeGroups[module] || {});
    
    if (allActions.length === 0) return false;
    
    const selectedCount = allActions.filter(action => {
      return actionsFormGroup.get(action)?.value === true;
    }).length;
    
    return selectedCount > 0 && selectedCount < allActions.length;
  }

  get totalSelectedCount(): number {
    let count = 0;
    const modulesFormGroup = this.roleForm.get('modules') as FormGroup;
    
    for (const module of this.uniqueModules) {
      const actionsFormGroup = modulesFormGroup.get(module) as FormGroup;
      const actionsMap = this.scopeGroups[module];
      
      for (const action of Object.keys(actionsMap)) {
        if (actionsFormGroup.get(action)?.value === true) {
          count++;
        }
      }
    }
    
    return count;
  }

  selectAllScopes() {
    this.uniqueModules.forEach(module => {
      this.selectAllForModule(module);
    });
  }

  deselectAllScopes() {
    this.uniqueModules.forEach(module => {
      this.deselectAllForModule(module);
    });
  }

  get allSelected(): boolean {
    return this.totalSelectedCount === this.allScopes.length && this.allScopes.length > 0;
  }

  get someSelected(): boolean {
    const selected = this.totalSelectedCount;
    return selected > 0 && selected < this.allScopes.length;
  }

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

  getModuleDisplayName(module: string): string {
    return module
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  getModuleIcon(module: string): string {
    const iconMap: { [key: string]: string } = {
      appointments: 'event',
      clients: 'people',
      employees: 'person',
      services: 'build',
      facilities: 'business',
      pos: 'point_of_sale',
      sales: 'shopping_cart',
      products: 'inventory',
      reports: 'assessment',
      analytics: 'analytics',
      settings: 'settings',
      user_administration: 'admin_panel_settings',
      tenants: 'apartment',
      roles: 'account_box',
      scopes: 'security'
    };
    
    return iconMap[module.toLowerCase()] || 'folder';
  }

  getActionIcon(action: string): string {
    const iconMap: { [key: string]: string } = {
      access: 'lock_open',
      read: 'visibility',
      create: 'add',
      update: 'edit',
      delete: 'delete',
      cancel: 'cancel',
      sale: 'point_of_sale',
      refund: 'undo',
      session: 'event',
      report: 'bar_chart',
      settings: 'settings',
      cash_management: 'account_balance',
      cash_reports: 'assessment',
      cash_analytics: 'analytics'
    };
    
    return iconMap[action] || 'check_box';
  }
}
