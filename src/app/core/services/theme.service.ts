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
    
    // Slušaj promene korisnika i učitaj temu kada se korisnik uloguje
    this.userSubscription = this.authService.user$.pipe(
      filter(user => user !== null), // Čekaj dok se korisnik ne učita
      take(1), // Uzmi samo prvi put kada se korisnik učita
      switchMap(user => {
        if (!user) {
          return of(null);
        }
        return this.loadThemeForUser(user.userId!, user.tenantId || this.authService.getCurrentTenantId() || '');
      }),
      catchError(err => {
        console.error('[ThemeService] Error loading theme:', err);
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
      console.warn('[ThemeService] Missing tenantId or userId, using system theme', { tenantId, userId });
      this.applyTheme('system');
      return of(null);
    }

    console.log('[ThemeService] Loading theme for user', { userId, tenantId });

    return this.settingsService.getEffectiveSettings(tenantId, userId).pipe(
      switchMap(settings => {
        if (!settings) {
          console.warn('[ThemeService] No settings returned, using system theme');
          this.applyTheme('system');
          return of(null);
        }

        const theme = (settings.theme as Theme) || 'system';
        console.log('[ThemeService] Loaded theme from settings:', { theme, settings });
        this.currentThemeSubject.next(theme);
        this.applyTheme(theme);
        return of(theme);
      }),
      catchError(err => {
        console.error('[ThemeService] Error loading theme settings:', {
          error: err,
          message: err?.message,
          status: err?.status,
          userId,
          tenantId
        });
        console.warn('[ThemeService] Falling back to system theme');
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
      console.log('[ThemeService] No user found, using system theme');
      this.applyTheme('system');
      return;
    }

    const tenantId = this.authService.getCurrentTenantId();
    const userId = currentUser.userId;

    if (!tenantId || !userId) {
      console.warn('[ThemeService] Missing tenantId or userId, using system theme');
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

    // Console log za debugging
    console.log(`[ThemeService] Tema promenjena na: ${theme} (primenjeno: ${appliedTheme})`);
    console.log(`[ThemeService] HTML data-theme: ${htmlElement.getAttribute('data-theme')}`);
    console.log(`[ThemeService] HTML klase: ${htmlElement.className}`);
    console.log(`[ThemeService] Body klase: ${bodyElement.className}`);
    
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
    if (!currentUser) {
      this.applyTheme('system');
      return;
    }

    const tenantId = this.authService.getCurrentTenantId();
    const userId = currentUser.userId;

    if (!tenantId || !userId) {
      this.applyTheme('system');
      return;
    }

    // Učitaj temu direktno bez čekanja na observable
    this.loadThemeForUser(userId, tenantId).subscribe();
  }
}

