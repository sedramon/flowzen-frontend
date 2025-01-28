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
        const requiredScope = route.data['scope'];
    
        return this.authService.user$.pipe(
          take(1),
          map(user => {
            if (user?.role?.availableScopes.some(scope => scope.name === requiredScope)) {
              return true; // Dozvoli pristup ako korisnik ima traženi scope
            }
    
            this.router.navigate(['/unauthorized']);
            return false; // Odbij pristup
          })
        );
      }
}