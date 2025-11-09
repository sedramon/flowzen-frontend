import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  Router,
  UrlTree,
} from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class GlobalScopeGuard implements CanActivate {
  constructor(private readonly authService: AuthService, private readonly router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): boolean | UrlTree | Observable<boolean | UrlTree> | Promise<boolean | UrlTree> {
    const requiredScope = route.data['scope'] as string | undefined;

    if (!requiredScope) {
      return true;
    }

    if (this.authService.hasGlobalScope(requiredScope)) {
      return true;
    }

    return this.router.parseUrl('/unauthorized');
  }
}

