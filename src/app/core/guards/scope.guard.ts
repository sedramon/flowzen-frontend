import { Injectable } from "@angular/core";
import { AuthService } from "../services/auth.service";
import { ActivatedRouteSnapshot, Router } from "@angular/router";
import { map, Observable, take } from "rxjs";

@Injectable({
    providedIn: 'root'
})
export class ScopeGuard {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): Observable<boolean> {
    // singular 'scope' for one required permission per route
    const requiredScope = route.data['scope'] as string;

    return this.authService.user$.pipe(
      take(1),
      map(user => {

        if (user?.scopes && user.scopes.includes(requiredScope)) {
          return true;
        }

        // no permission → kick them out
        this.router.navigate(['/unauthorized']);
        return false;
      })
    );
  }
}