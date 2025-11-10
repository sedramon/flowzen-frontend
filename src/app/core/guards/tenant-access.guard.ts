import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class TenantAccessGuard implements CanActivate {
  constructor(private readonly authService: AuthService, private readonly router: Router) {}

  canActivate(
    _route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot,
  ): boolean | UrlTree {
    const access = this.authService.getTenantAccessState();

    if (access.allowed) {
      this.authService.clearAccessRestrictionState();
      return true;
    }

    this.authService.setAccessRestrictionState({
      ...access,
      allowed: false,
      redirectUrl: state.url,
    });

    return this.router.parseUrl('/access-restriction');
  }
}
