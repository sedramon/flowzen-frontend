import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CheckboxModule } from 'primeng/checkbox';
import { TooltipModule } from 'primeng/tooltip';
import { ScopeService } from '../../../../core/services/scope.service';
import { AuthService } from '../../../../core/services/auth.service';
import { trigger, style, animate, transition, keyframes } from '@angular/animations';

@Component({
  selector: 'app-add-role-dialog',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    MatDialogModule, 
    ButtonModule,
    InputTextModule,
    CheckboxModule,
    TooltipModule
  ],
  templateUrl: './add-role-dialog.component.html',
  styleUrl: './add-role-dialog.component.scss',
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
export class AddRoleDialogComponent implements OnInit {

  roleForm = new FormGroup({
    name: new FormControl<string>('', [Validators.required]),
    modules: new FormGroup({}),
    tenant: new FormControl<string>('', [Validators.required])
  });

  allScopes: any[] = [];
  scopeGroups: Record<string, Record<string, string>> = {};
  uniqueModules: string[] = [];

  constructor(
    public dialogRef: MatDialogRef<AddRoleDialogComponent>,
    private http: HttpClient,
    private scopeService: ScopeService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.getAllScopes();
    this.roleForm.get('tenant')?.setValue(this.authService.requireCurrentTenantId());
  }

  getAllScopes() {
    this.scopeService.fetchScopes().subscribe(
      (scopes) => {
        this.allScopes = scopes;
        this.groupScopes();
        this.initializeModulesForm();
      },
      (error) => {
        console.error('Error fetching scopes:', error);
      }
    );
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

  private initializeModulesForm() {
    const modulesFormGroup = new FormGroup({});
    
    for (const module of this.uniqueModules) {
      const actionsFormGroup = new FormGroup({});
      const actionsMap = this.scopeGroups[module];
      
      for (const action of Object.keys(actionsMap)) {
        actionsFormGroup.addControl(action, new FormControl(false));
      }
      
      modulesFormGroup.addControl(module, actionsFormGroup);
    }
    
    this.roleForm.setControl('modules', modulesFormGroup);
  }

  closeDialog() {
    this.dialogRef.close(false);
  }

  createRole() {
    if (this.roleForm.controls['name'].invalid) {
      Object.keys(this.roleForm.controls).forEach(key => {
        this.roleForm.get(key)?.markAsTouched();
      });
      return;
    }

    if (this.totalSelectedCount === 0) {
      return;
    }

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

    const role = {
      name: this.roleForm.get('name')?.value || '',
      availableScopes: selectedScopeIds,
      tenant: this.roleForm.get('tenant')?.value || ''
    }

    this.dialogRef.close(role);
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
      access: 'Pristup',
      read: 'Čitanje',
      create: 'Kreiranje',
      update: 'Ažuriranje',
      delete: 'Brisanje',
      sale: 'Prodaja',
      refund: 'Povrat',
      session: 'Sesije',
      report: 'Izveštaji',
      settings: 'Podešavanja',
      cash_management: 'Kasa',
      cash_reports: 'Izveštaji kase',
      cash_analytics: 'Analitika kase'
    };
    
    return displayTexts[action] || action.charAt(0).toUpperCase() + action.slice(1);
  }

  getActionTooltip(action: string): string {
    const tooltipTexts: { [key: string]: string } = {
      access: 'Kontrola pristupa',
      read: 'Pristup čitanju',
      create: 'Pristup kreiranju',
      update: 'Pristup ažuriranju',
      delete: 'Pristup brisanju',
      sale: 'Upravljanje prodajom',
      refund: 'Upravljanje povratima',
      session: 'Upravljanje sesijama',
      report: 'Pristup izveštajima',
      settings: 'Pristup podešavanjima',
      cash_management: 'Upravljanje kasom',
      cash_reports: 'Izveštaji i analitika kase',
      cash_analytics: 'Analitika i uvidi kase'
    };
    
    return tooltipTexts[action] || action.charAt(0).toUpperCase() + action.slice(1);
  }

  getModuleDisplayName(module: string): string {
    const displayNames: { [key: string]: string } = {
      appointments: 'Termini',
      clients: 'Klijenti',
      employees: 'Zaposleni',
      services: 'Usluge',
      facilities: 'Objekti',
      pos: 'Kasa',
      sales: 'Prodaja',
      products: 'Proizvodi',
      reports: 'Izveštaji',
      analytics: 'Analitika',
      settings: 'Podešavanja',
      user_administration: 'Administracija korisnika',
      tenants: 'Tenanti',
      roles: 'Uloge',
      scopes: 'Dozvole'
    };
    
    return displayNames[module] || module
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  getModuleIcon(module: string): string {
    const iconMap: { [key: string]: string } = {
      appointments: 'pi-calendar',
      clients: 'pi-users',
      employees: 'pi-user',
      services: 'pi-wrench',
      facilities: 'pi-building',
      pos: 'pi-shopping-cart',
      sales: 'pi-dollar',
      products: 'pi-box',
      reports: 'pi-chart-bar',
      analytics: 'pi-chart-line',
      settings: 'pi-cog',
      user_administration: 'pi-shield',
      tenants: 'pi-building-columns',
      roles: 'pi-id-card',
      scopes: 'pi-lock'
    };
    
    return iconMap[module.toLowerCase()] || 'pi-folder';
  }

  getActionIcon(action: string): string {
    const iconMap: { [key: string]: string } = {
      access: 'pi-lock-open',
      read: 'pi-eye',
      create: 'pi-plus',
      update: 'pi-pencil',
      delete: 'pi-trash',
      cancel: 'pi-times',
      sale: 'pi-shopping-cart',
      refund: 'pi-undo',
      session: 'pi-calendar',
      report: 'pi-chart-bar',
      settings: 'pi-cog',
      cash_management: 'pi-wallet',
      cash_reports: 'pi-file',
      cash_analytics: 'pi-chart-line'
    };
    
    return iconMap[action] || 'pi-check-square';
  }
}
