import { Injectable } from "@angular/core";
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from "@angular/router";
import { AuthService } from "../services/auth.service";
import { map, Observable, take, filter, timeout, catchError, of } from "rxjs";

@Injectable({
    providedIn: 'root',
  })
  export class AuthGuard implements CanActivate {
    constructor(private authService: AuthService, private router: Router) {}
  
    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
      const currentUser = this.authService.getCurrentUser();
      
      // Ako nema korisnika u storage-u, odmah redirektuj na login
      if (!currentUser) {
        this.router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
        return of(false);
      }
      
      // Ako postoji korisnik, sačekaj validaciju sesije
      // Koristimo skipWhile da preskočimo početnu vrednost i čekamo na ažuriranje nakon validacije
      return this.authService.getSessionValidationStatus$().pipe(
        filter(status => status !== 'pending'), // Čekaj dok se ne završi validacija
        take(1),
        timeout(5000), // Timeout od 5 sekundi za validaciju
        map(status => {
          const user = this.authService.getCurrentUser();
          
          if (status === 'valid' && user) {
            return true; // Sesija je validna, dozvoli pristup
          }
          
          // Sesija nije validna ili je истекао timeout
          this.router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
          return false;
        }),
        catchError(() => {
          // U slučaju greške ili timeout-a, redirektuj na login
          this.router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
          return of(false);
        })
      );
    }
  }