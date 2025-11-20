import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject, takeUntil } from 'rxjs';
import { AdminScopesService } from '../../services/admin-scopes.service';
import { AdminScope } from '../../models/admin-scope.model';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import {
  ScopeDialogComponent,
  ScopeDialogData,
  ScopeDialogResult,
} from './dialogs/scope-dialog.component';
import { AdminNotificationsService } from '../../shared/services/admin-notifications.service';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../shared/dialogs/confirm-dialog.component';

type ScopeFilter = 'all' | 'global' | 'tenant';

interface ScopeGroup {
  key: 'global' | 'tenant';
  label: string;
  description: string;
  icon: string;
  scopes: AdminScope[];
}

interface ScopeSegments {
  namespace: string;
  action: string;
}

const SCOPE_GROUP_META: Record<'global' | 'tenant', Omit<ScopeGroup, 'key' | 'scopes'>> = {
  global: {
    label: 'Globalni scope-ovi',
    description: 'Primenjuje se na celoj platformi; zahtevaju globalne privilegije.',
    icon: 'public',
  },
  tenant: {
    label: 'Tenant scope-ovi',
    description: 'Aktiviraju se unutar jednog tenant konteksta.',
    icon: 'apartment',
  },
};
import { Clipboard, ClipboardModule } from '@angular/cdk/clipboard';

@Component({
  selector: 'app-admin-scopes',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonToggleModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    ClipboardModule,
  ],
  templateUrl: './admin-scopes.component.html',
  styleUrl: './admin-scopes.component.scss',
})
export class AdminScopesComponent implements OnInit, OnDestroy {
  filterForm: FormGroup;
  loading = false;
  scopes: AdminScope[] = [];
  filteredScopes: AdminScope[] = [];
  scopeGroups: ScopeGroup[] = [];
  processing = new Set<string>();

  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly fb: FormBuilder,
    private readonly scopesService: AdminScopesService,
    private readonly notifications: AdminNotificationsService,
    private readonly dialog: MatDialog,
    private readonly clipboard: Clipboard,
  ) {
    this.filterForm = this.fb.group({
      search: [''],
      category: ['all'],
    });
  }

  ngOnInit(): void {
    this.loadScopes();

    this.filterForm.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((value) => {
      this.runLocalFilter(value.search, value.category);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  clearSearch(): void {
    this.filterForm.patchValue({ search: '' }, { emitEvent: true });
  }

  refresh(): void {
    this.loadScopes();
  }

  openCreateDialog(): void {
    const dialogRef = this.dialog.open<ScopeDialogComponent, undefined, ScopeDialogResult>(
      ScopeDialogComponent,
      {
        width: '900px',
        maxWidth: '92vw',
        disableClose: true,
        panelClass: 'admin-dialog-panel',
      },
    );

    dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe((result) => {
      if (result) {
        this.createScope(result);
      }
    });
  }

  openEditDialog(scope: AdminScope): void {
    const dialogRef = this.dialog.open<ScopeDialogComponent, ScopeDialogData, ScopeDialogResult>(
      ScopeDialogComponent,
      {
        width: '900px',
        maxWidth: '92vw',
        disableClose: true,
        panelClass: 'admin-dialog-panel',
        data: { scope },
      },
    );

    dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe((result) => {
      if (result) {
        this.updateScope(scope._id || scope.name, result);
      }
    });
  }

  confirmDelete(scope: AdminScope): void {
    const dialogRef = this.dialog.open<ConfirmDialogComponent, ConfirmDialogData, boolean>(
      ConfirmDialogComponent,
      {
        width: '900px',
        maxWidth: '92vw',
        disableClose: true,
        panelClass: 'admin-dialog-panel',
        data: {
          title: 'Obriši scope',
          description: `Potvrdi brisanje scope-a <strong>${scope.name}</strong>. Ova akcija je nepovratna.`,
          confirmLabel: 'Obriši',
          confirmColor: 'warn',
        },
      },
    );

    dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe((confirmed) => {
      if (confirmed) {
        this.deleteScope(scope._id || scope.name);
      }
    });
  }

  isProcessing(id: string): boolean {
    return this.processing.has(id);
  }

  isProcessingScope(scope: AdminScope): boolean {
    return this.processing.has(this.getScopeIdentifier(scope));
  }

  trackScopeId(_index: number, scope: AdminScope): string {
    return this.getScopeIdentifier(scope);
  }

  copyScopeName(scope: AdminScope): void {
    const identifier = scope.name;
    if (this.clipboard.copy(identifier)) {
      this.notifications.info('Scope je kopiran u clipboard.');
    } else {
      this.notifications.error('Clipboard nije dostupan.');
    }
  }

  getScopeSegments(scope: AdminScope): ScopeSegments {
    const stripped = scope.name.replace(/^scope[_\-]?/, '');
    const [namespaceRaw = stripped, actionRaw = 'access'] = stripped.split(':');

    return {
      namespace: this.toTitleCase(namespaceRaw),
      action: this.toTitleCase(actionRaw),
    };
  }

  private loadScopes(): void {
    this.loading = true;

    const category = this.filterForm.value.category as ScopeFilter;

    this.scopesService
      .listScopes(category === 'all' ? undefined : category)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (scopes) => {
          this.scopes = scopes;
          this.runLocalFilter(this.filterForm.value.search, category);
          this.processing.clear();
          this.loading = false;
        },
        error: (error) => {
          console.error('[AdminScopesComponent] Failed to load scopes', error);
          this.notifications.error('Greška pri učitavanju scope definicija.');
          this.processing.clear();
          this.loading = false;
        },
      });
  }

  private runLocalFilter(search?: string, category?: ScopeFilter): void {
    const normalized = search?.toLowerCase().trim() ?? '';
    const effectiveFilter = category ?? (this.filterForm.value.category as ScopeFilter);

    this.filteredScopes = this.scopes.filter((scope) => {
      const matchSearch =
        !normalized ||
        scope.name.toLowerCase().includes(normalized) ||
        (scope.description ?? '').toLowerCase().includes(normalized);

      const scopeCategory = scope.category ?? 'tenant';
      const isCategoryFilterActive = effectiveFilter !== undefined && effectiveFilter !== 'all';
      const matchCategory = !isCategoryFilterActive || scopeCategory === effectiveFilter;

      return matchSearch && matchCategory;
    });

    this.scopeGroups = (['global', 'tenant'] as const)
      .map((key) => ({
        key,
        ...SCOPE_GROUP_META[key],
        scopes: this.filteredScopes.filter((scope) => (scope.category ?? 'tenant') === key),
      }))
      .filter((group) => group.scopes.length > 0);
  }

  private createScope(payload: ScopeDialogResult): void {
    this.loading = true;
    this.scopesService
      .createScope(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.notifications.success('Scope je kreiran.');
          this.loadScopes();
        },
        error: (error) => {
          this.logError('[AdminScopesComponent] Failed to create scope', error);
          this.notifications.error('Kreiranje scope-a nije uspelo.');
          this.loading = false;
        },
      });
  }

  private updateScope(scopeId: string, payload: ScopeDialogResult): void {
    this.processing.add(scopeId);
    this.scopesService
      .updateScope(scopeId, payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.notifications.success('Scope je ažuriran.');
          this.loadScopes();
        },
        error: (error) => {
          this.logError('[AdminScopesComponent] Failed to update scope', error);
          this.notifications.error('Ažuriranje scope-a nije uspelo.');
          this.processing.delete(scopeId);
        },
      });
  }

  private deleteScope(scopeId: string): void {
    this.processing.add(scopeId);
    this.scopesService
      .deleteScope(scopeId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.notifications.success('Scope je obrisan.');
          this.loadScopes();
        },
        error: (error) => {
          this.logError('[AdminScopesComponent] Failed to delete scope', error);
          this.notifications.error('Brisanje scope-a nije uspelo.');
          this.processing.delete(scopeId);
        },
      });
  }

  private getScopeIdentifier(scope: AdminScope): string {
    return scope._id || scope.name;
  }

  private toTitleCase(value: string): string {
    if (!value) {
      return '—';
    }
    return value
      .split(/[_\s-]+/)
      .filter(Boolean)
      .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
      .join(' ');
  }

  private logError(context: string, error: unknown): void {
    if (error instanceof Error) {
      console.error(context, error);
    } else {
      console.error(context, String(error));
    }
  }
}

