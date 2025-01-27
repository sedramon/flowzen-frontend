import { Injectable } from "@angular/core";
import { AuthService } from "../services/auth.service";
import { ActivatedRouteSnapshot, Router } from "@angular/router";

@Injectable({
    providedIn: 'root'
})
export class ScopeGuard {
    constructor(private authService: AuthService, private router: Router) {}

    canActivate(route: ActivatedRouteSnapshot): boolean {
        const requiredScope = route.data['scope']; // Get the required scope from route data
        const userScopes = this.authService.getScopes(); // Fetch the user's scopes from AuthService

    if (userScopes && userScopes.includes(requiredScope)) {
      return true; // User has the required scope, allow access
    }

    // Redirect to unauthorized page if the scope is missing
    this.router.navigate(['/unauthorized']);
    return false;
    }
}