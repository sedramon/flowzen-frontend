import { Injectable } from "@angular/core";
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from "@angular/router";
import { AuthService } from "../services/auth.service";
import { map, Observable, take } from "rxjs";

@Injectable({
    providedIn: 'root',
  })
  export class AuthGuard implements CanActivate {
    constructor(private authService: AuthService, private router: Router) {}
  
    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
      return this.authService.user$.pipe(
        take(1), // Uzmi samo poslednje stanje korisnika
        map(user => {
          if (user) {
            return true; // Dozvoli pristup ako je korisnik ulogovan
          }
          this.router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
          return false;
        })
      );
    }
  }