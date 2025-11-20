import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { forkJoin, Subject } from 'rxjs';
import { finalize, takeUntil } from 'rxjs/operators';
import { AdminTenantsService } from '../../services/admin-tenants.service';
import { AdminTenantOverview } from '../../models/admin-tenant.model';
import { AdminAuditService } from '../../services/admin-audit.service';
import { AdminAuditLog } from '../../models/admin-audit-log.model';
import { AdminNotificationsService } from '../../shared/services/admin-notifications.service';

interface OverviewStat {
  icon: string;
  label: string;
  value: string;
  trend: string;
  accent: 'blue' | 'purple' | 'teal' | 'amber';
}

interface InsightCard {
  title: string;
  description: string;
  icon: string;
  accent: 'audit' | 'warning' | 'success';
  action?: string;
}

interface RecentActivity {
  actor: string;
  action: string;
  meta: string;
  timeAgo: string;
  icon: string;
  tone: 'default' | 'critical' | 'positive';
}

interface SummaryMetric {
  label: string;
  value: string;
  subtitle: string;
  progress: number;
  accent: 'primary' | 'warn' | 'accent';
}

interface QuickAction {
  label: string;
  description: string;
  icon: string;
  route: string;
  color: 'primary' | 'accent';
}

interface RecentTenantView {
  name: string;
  status: string;
  createdAt: string;
  license: string;
}

@Component({
  selector: 'app-admin-overview',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatDividerModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
  ],
  templateUrl: './admin-overview.component.html',
  styleUrl: './admin-overview.component.scss',
})
export class AdminOverviewComponent implements OnInit, OnDestroy {
  loading = false;
  overview: AdminTenantOverview | null = null;
  stats: OverviewStat[] = [];
  insights: InsightCard[] = [];
  recentActivity: RecentActivity[] = [];
  summaryMetrics: SummaryMetric[] = [];
  quickActions: QuickAction[] = [];
  recentTenants: RecentTenantView[] = [];

  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly tenantsService: AdminTenantsService,
    private readonly auditService: AdminAuditService,
    private readonly notifications: AdminNotificationsService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  refresh(): void {
    this.loadData();
  }

  private loadData(): void {
    this.loading = true;

    forkJoin({
      overview: this.tenantsService.getOverview(),
      audit: this.auditService.listLogs({ limit: 5, page: 1 }),
    })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.loading = false)),
      )
      .subscribe({
        next: ({ overview, audit }) => {
          this.overview = overview;
          this.stats = this.buildStats(overview, audit.total);
          this.insights = this.buildInsights(overview);
          this.recentActivity = this.buildRecentActivity(audit.items);
          this.summaryMetrics = this.buildSummaryMetrics(overview);
          this.quickActions = this.buildQuickActions(overview);
          this.recentTenants = this.buildRecentTenants(overview);
        },
        error: (error) => {
          console.error('[AdminOverviewComponent] Failed to load data', error);
          this.notifications.error('Greška pri učitavanju pregleda global admina.');
        },
      });
  }

  private buildStats(overview: AdminTenantOverview, auditCount: number): OverviewStat[] {
    return [
      {
        icon: 'apartment',
        label: 'Aktivni tenanti',
        value: (overview.active ?? 0).toString(),
        trend: `${overview.total ?? 0} ukupno`,
        accent: 'blue',
      },
      {
        icon: 'groups',
        label: 'Tenanti na čekanju',
        value: (overview.pending ?? 0).toString(),
        trend: `${overview.suspended ?? 0} suspendovanih`,
        accent: 'purple',
      },
      {
        icon: 'vpn_key',
        label: 'Licence uskoro ističu',
        value: (overview.licensesExpiringSoon ?? 0).toString(),
        trend: '30 dana horizont',
        accent: 'teal',
      },
      {
        icon: 'gpp_maybe',
        label: 'Audit zapisi danas',
        value: auditCount.toString(),
        trend: 'Poslednjih 5 aktivnosti',
        accent: 'amber',
      },
    ];
  }

  private buildInsights(overview: AdminTenantOverview): InsightCard[] {
    const expiring = overview.licensesExpiringSoon ?? 0;

    return [
      {
        title: 'Obnova licenci',
        description:
          expiring > 0
            ? `${expiring} tenant${expiring === 1 ? '' : 'a'} zahteva pregled licenci u narednih 30 dana.`
            : 'Sve licence su uredne u narednih 30 dana.',
        icon: 'event_available',
        accent: expiring > 0 ? 'warning' : 'success',
        action: expiring > 0 ? 'Pregledaj licence' : undefined,
      },
      {
        title: 'Onboarding tenanata',
        description:
          overview.pending > 0
            ? `${overview.pending} tenant${overview.pending === 1 ? '' : 'a'} čeka aktivaciju.`
            : 'Nema tenanata na čekanju.',
        icon: 'hourglass_bottom',
        accent: overview.pending > 0 ? 'audit' : 'success',
        action: overview.pending > 0 ? 'Pregledaj pending' : undefined,
      },
      {
        title: 'Globalna stabilnost',
        description:
          overview.suspended > 0
            ? `${overview.suspended} tenant${overview.suspended === 1 ? '' : 'a'} trenutno suspendovan.`
            : 'Nema suspendovanih tenanata.',
        icon: 'rocket_launch',
        accent: overview.suspended > 0 ? 'audit' : 'success',
        action: overview.suspended > 0 ? 'Pregledaj suspendovane' : undefined,
      },
    ];
  }

  private buildRecentActivity(auditLogs: AdminAuditLog[]): RecentActivity[] {
    return auditLogs.map((log) => {
      const performer =
        typeof log.performedBy === 'string'
          ? log.performedBy
          : log.performedBy?.name || log.performedBy?.email || 'System';

      const target = log.tenant?.name
        ? `Tenant: ${log.tenant.name}`
        : log.targetType && log.targetId
        ? `${log.targetType} · ${log.targetId}`
        : 'Global';

      return {
        actor: performer,
        action: log.action,
        meta: target,
        timeAgo: new Date(log.createdAt).toLocaleString(),
        icon: this.mapIcon(log.action),
        tone: log.action.includes('suspend')
          ? 'critical'
          : log.action.includes('delete')
          ? 'critical'
          : log.action.includes('create')
          ? 'positive'
          : 'default',
      };
    });
  }

  private mapIcon(action: string): string {
    if (action.includes('tenant')) {
      return 'domain';
    }
    if (action.includes('user')) {
      return 'manage_accounts';
    }
    if (action.includes('scope')) {
      return 'tune';
    }
    return 'history';
  }

  private buildSummaryMetrics(overview: AdminTenantOverview): SummaryMetric[] {
    const total = overview.total ?? 0;
    const active = overview.active ?? 0;
    const pending = overview.pending ?? 0;
    const suspended = overview.suspended ?? 0;
    const licensesExpiring = overview.licensesExpiringSoon ?? 0;

    const pct = (value: number) => (total > 0 ? Math.round((value / total) * 100) : 0);

    return [
      {
        label: 'Aktivni tenant-i',
        value: `${active}/${total}`,
        subtitle: `${pct(active)}% aktivno`,
        progress: pct(active),
        accent: 'primary',
      },
      {
        label: 'Na čekanju',
        value: `${pending}`,
        subtitle: `${pct(pending)}% čeka aktivaciju`,
        progress: pct(pending),
        accent: 'accent',
      },
      {
        label: 'Suspendovani',
        value: `${suspended}`,
        subtitle: `${pct(suspended)}% privremeno stopirano`,
        progress: pct(suspended),
        accent: 'warn',
      },
      {
        label: 'Licence uskoro ističu',
        value: `${licensesExpiring}`,
        subtitle: '30 dana horizont',
        progress: total > 0 ? Math.min(100, Math.round((licensesExpiring / total) * 100)) : 0,
        accent: 'warn',
      },
    ];
  }

  private buildQuickActions(overview: AdminTenantOverview): QuickAction[] {
    const total = overview.total ?? 0;
    return [
      {
        label: 'Kreiraj tenant',
        description: 'Brzi pristup onboarding formi.',
        icon: 'add_business',
        route: '/admin/tenants',
        color: 'accent',
      },
      {
        label: 'Pogledaj superadmin tim',
        description: 'Uredi globalne korisnike i dozvole.',
        icon: 'admin_panel_settings',
        route: '/admin/users',
        color: 'primary',
      },
      {
        label: 'Kontroliši scope-ove',
        description: 'Revizija globalnih i tenant prava.',
        icon: 'tune',
        route: '/admin/scopes',
        color: 'accent',
      },
      {
        label: 'Audit log feed',
        description: `Poslednjih ${total > 0 ? 'akcija' : 'zapisa'} superadmina.`,
        icon: 'history',
        route: '/admin/audit',
        color: 'primary',
      },
    ];
  }

  private buildRecentTenants(overview: AdminTenantOverview): RecentTenantView[] {
    if (!overview.recentTenants?.length) {
      return [];
    }

    return overview.recentTenants.map((tenant) => ({
      name: tenant.name,
      status: tenant.status ?? 'unknown',
      createdAt: tenant.createdAt ? new Date(tenant.createdAt).toLocaleDateString() : '—',
      license:
        tenant.hasActiveLicense === false
          ? 'Bez licence'
          : tenant.licenseExpiryDate
          ? `Ističe ${new Date(tenant.licenseExpiryDate).toLocaleDateString()}`
          : 'Aktivna',
    }));
  }

  navigate(route: string): void {
    this.router.navigateByUrl(route);
  }
}

