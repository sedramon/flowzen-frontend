import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subscription, filter, take, switchMap, catchError, of } from 'rxjs';
import { SettingsService } from '../../modules/settings/services/settings.service';
import { AuthService } from './auth.service';
import { Theme } from '../../models/Settings';

@Injectable({
  providedIn: 'root'
})
export class ThemeService implements OnDestroy {
  private currentThemeSubject = new BehaviorSubject<Theme | null>(null);
  public currentTheme$: Observable<Theme | null> = this.currentThemeSubject.asObservable();

  private settingsSubscription?: Subscription;
  private userSubscription?: Subscription;
  private systemThemeQuery?: MediaQueryList;
  private systemThemeListener?: (e: MediaQueryListEvent) => void;

  constructor(
    private settingsService: SettingsService,
    private authService: AuthService
  ) {
    // Primeni default temu odmah
    this.applyTheme('system');
    
    // Slušaj promene korisnika I validaciju sesije pre učitavanja teme
    this.userSubscription = this.authService.getSessionValidationStatus$().pipe(
      filter(status => status === 'valid'), // Čekaj da se sesija validira
      take(1), // Uzmi samo prvi put kada je validacija završena
      switchMap(() => {
        const user = this.authService.getCurrentUser();
        
        if (!user) {
          this.applyTheme('system');
          return of(null);
        }
        
        const tenantId = user.tenantId || this.authService.getCurrentTenantId() || '';
        const userId = user.userId;
        
        if (!tenantId || !userId) {
          this.applyTheme('system');
          return of(null);
        }
        
        return this.loadThemeForUser(userId, tenantId);
      }),
      catchError(err => {
        this.applyTheme('system');
        return of(null);
      })
    ).subscribe();
  }

  ngOnDestroy(): void {
    this.settingsSubscription?.unsubscribe();
    this.userSubscription?.unsubscribe();
    if (this.systemThemeQuery && this.systemThemeListener) {
      this.systemThemeQuery.removeEventListener('change', this.systemThemeListener);
    }
  }

  /**
   * Učitava temu za određenog korisnika
   */
  private loadThemeForUser(userId: string, tenantId: string): Observable<Theme | null> {
    if (!tenantId || !userId) {
      this.applyTheme('system');
      return of(null);
    }

    return this.settingsService.getEffectiveSettings(tenantId, userId).pipe(
      switchMap(settings => {
        if (!settings) {
          this.applyTheme('system');
          return of(null);
        }

        const theme = (settings.theme as Theme) || 'system';
        this.currentThemeSubject.next(theme);
        this.applyTheme(theme);
        return of(theme);
      }),
      catchError(err => {
        this.applyTheme('system');
        return of(null);
      })
    );
  }

  /**
   * Inicijalizuje temu na osnovu korisničkih postavki
   * Sada koristi user$ observable umesto direktnog poziva
   */
  private initializeTheme(): void {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      // Ako korisnik nije ulogovan, koristi sistemsku temu
      this.applyTheme('system');
      return;
    }

    const tenantId = this.authService.getCurrentTenantId();
    const userId = currentUser.userId;

    if (!tenantId || !userId) {
      this.applyTheme('system');
      return;
    }

    // Učitaj effective settings i primeni temu
    this.loadThemeForUser(userId, tenantId).subscribe();
  }

  /**
   * Postavlja temu programski (koristi se kada korisnik promeni temu u settings)
   */
  setTheme(theme: Theme | null): void {
    const themeToApply = theme || 'system';
    this.currentThemeSubject.next(themeToApply);
    this.applyTheme(themeToApply);
  }

  /**
   * Primena teme na DOM
   */
  private applyTheme(theme: Theme): void {
    const htmlElement = document.documentElement;
    const bodyElement = document.body;

    // Ukloni postojeće klase
    htmlElement.classList.remove('theme-light', 'theme-dark', 'theme-system');
    bodyElement.classList.remove('theme-light', 'theme-dark', 'theme-system');

    let appliedTheme: string;

    if (theme === 'system') {
      // Za 'system', koristi tamnu temu kao default
      htmlElement.classList.add('theme-system');
      bodyElement.classList.add('theme-system');
      htmlElement.setAttribute('data-theme', 'dark');
      htmlElement.style.colorScheme = 'dark';
      appliedTheme = 'dark (sistemska - default)';
    } else if (theme === 'light') {
      htmlElement.classList.add('theme-light');
      bodyElement.classList.add('theme-light');
      htmlElement.setAttribute('data-theme', 'light');
      htmlElement.style.colorScheme = 'light';
      appliedTheme = 'light';
    } else if (theme === 'dark') {
      htmlElement.classList.add('theme-dark');
      bodyElement.classList.add('theme-dark');
      htmlElement.setAttribute('data-theme', 'dark');
      htmlElement.style.colorScheme = 'dark';
      appliedTheme = 'dark';
    } else {
      appliedTheme = 'nepoznata';
    }
    
    // Force reflow da osiguramo da se stilovi primene
    void htmlElement.offsetHeight;
    
    // Emituj event za toast (ako je potrebno)
    this.notifyThemeChange(theme, appliedTheme);
  }

  /**
   * Emituje event za notifikaciju promene teme
   */
  private notifyThemeChange(selectedTheme: Theme, appliedTheme: string): void {
    // Možemo koristiti custom event ili BehaviorSubject za toast
    const event = new CustomEvent('theme-changed', {
      detail: {
        selectedTheme,
        appliedTheme,
        timestamp: new Date()
      }
    });
    window.dispatchEvent(event);
  }

  /**
   * Postavlja listener za promene sistemske teme
   * Napomena: Sistemska tema je sada uvek dark, ali zadržavamo listener za buduće promene
   */
  private setupSystemThemeListener(): void {
    // Sistemska tema je sada uvek dark, ali možemo zadržati listener za buduće promene
    // Trenutno ne postavljamo listener jer sistemska tema je uvek dark
  }

  /**
   * Osvežava temu (koristi se nakon što korisnik promeni settings)
   */
  refreshTheme(): void {
    const currentUser = this.authService.getCurrentUser();
    
    // Ako nema korisnika, koristi sistemsku temu
    if (!currentUser) {
      this.applyTheme('system');
      return;
    }

    // Proveri status validacije sesije
    const validationStatus = this.authService.getSessionValidationStatus$();
    
    validationStatus.pipe(
      filter(status => status !== 'pending'), // Čekaj da se validacija završi
      take(1),
      switchMap(status => {
        if (status !== 'valid') {
          this.applyTheme('system');
          return of(null);
        }
        
        const user = this.authService.getCurrentUser();
        if (!user) {
          this.applyTheme('system');
          return of(null);
        }
        
        const tenantId = this.authService.getCurrentTenantId();
        const userId = user.userId;

        if (!tenantId || !userId) {
          this.applyTheme('system');
          return of(null);
        }

        return this.loadThemeForUser(userId, tenantId);
      }),
      catchError(err => {
        this.applyTheme('system');
        return of(null);
      })
    ).subscribe();
  }
}

