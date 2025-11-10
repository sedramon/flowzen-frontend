import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { BehaviorSubject, Subject, combineLatest, distinctUntilChanged, filter, map, takeUntil } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { TenantAccessState } from '../../models/TenantAccessState';

interface AccessRestrictionDisplay {
  title: string;
  reason: string;
}

@Component({
  selector: 'app-access-restriction',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  templateUrl: './access-restriction.component.html',
  styleUrls: ['./access-restriction.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccessRestrictionComponent implements OnInit, OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroy$ = new Subject<void>();
  private readonly revealDelay = 520;

  private readonly displayStateSubject = new BehaviorSubject<AccessRestrictionDisplay | null>(null);
  private readonly revealSubject = new BehaviorSubject<boolean>(false);

  readonly vm$ = combineLatest([
    this.displayStateSubject.asObservable().pipe(
      filter((display): display is AccessRestrictionDisplay => display !== null),
      distinctUntilChanged(
        (previous, current) =>
          previous.title === current.title && previous.reason === current.reason,
      ),
    ),
    this.revealSubject.asObservable(),
  ]).pipe(map(([display, showContent]) => ({ display, showContent })));

  private readonly prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  private overlayTimer: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    const initialState =
      this.authService.getAccessRestrictionState() ?? this.authService.getTenantAccessState();

    if (initialState.allowed) {
      const fallbackTarget = initialState.tenantId ? '/home' : '/admin/overview';
      this.router.navigate([fallbackTarget]);
      return;
    }

    this.updateDisplay(initialState);

    this.authService.accessRestriction$
      .pipe(takeUntil(this.destroy$))
      .subscribe((state) => {
        if (state && !state.allowed) {
          this.updateDisplay(state);
        }
      });
  }

  ngOnDestroy(): void {
    if (this.overlayTimer) {
      clearTimeout(this.overlayTimer);
      this.overlayTimer = null;
    }
    this.destroy$.next();
    this.destroy$.complete();
    this.displayStateSubject.complete();
    this.revealSubject.complete();
  }

  logout(): void {
    this.authService.logout();
  }

  private updateDisplay(state: TenantAccessState): void {
    const display = this.mapStateToDisplay(state);
    this.displayStateSubject.next(display);

    if (this.overlayTimer) {
      clearTimeout(this.overlayTimer);
      this.overlayTimer = null;
    }

    this.revealSubject.next(false);

    if (this.prefersReducedMotion) {
      this.revealSubject.next(true);
      return;
    }

    this.overlayTimer = setTimeout(() => {
      this.revealSubject.next(true);
      this.overlayTimer = null;
    }, this.revealDelay);
  }

  private mapStateToDisplay(state: TenantAccessState): AccessRestrictionDisplay {
    const tenantName = state.tenantName ?? 'Tenant';
    const genericMessage = `Pristup za "${tenantName}" trenutno nije dostupan.`;

    switch (state.reason) {
      case 'suspended':
        return {
          title: 'ACCESS SUSPENDED',
          reason: state.message ?? `Tenant "${tenantName}" je suspendovan.`,
        };
      case 'license-expired':
        return {
          title: 'LICENSE EXPIRED',
          reason: state.message ?? `Licenca za "${tenantName}" je istekla.`,
        };
      case 'license-inactive':
        return {
          title: 'LICENSE LOCKED',
          reason: state.message ?? `Licenca za "${tenantName}" je deaktivirana.`,
        };
      case 'pending':
        return {
          title: 'ACTIVATION PENDING',
          reason: state.message ?? `Aktivacija tenanta "${tenantName}" je u toku.`,
        };
      case 'missing-tenant':
        return {
          title: 'ACCESS BLOCKED',
          reason: state.message ?? 'Tenant nije dodeljen ovom nalogu.',
        };
      case 'unauthenticated':
      default:
        return {
          title: 'ACCESS RESTRICTED',
          reason: state.message ?? genericMessage,
        };
    }
  }
}
