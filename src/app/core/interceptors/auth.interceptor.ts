import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpResponse } from "@angular/common/http";
import { AuthService } from "../services/auth.service";
import { Injectable } from "@angular/core";
import { Observable, tap } from "rxjs";
import { CsrfService } from "../services/csrf.service";

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
    constructor(
        private auth: AuthService,
        private csrfService: CsrfService
    ) {}

    intercept(
        req: HttpRequest<any>,
        next: HttpHandler
    ): Observable<HttpEvent<any>> {
        // Clone request with credentials to include cookies
        let modifiedReq = req.clone({
            withCredentials: true
        });

        // Add CSRF token for state-changing methods (except login/register)
        const csrfToken = this.csrfService.getToken();
        const stateChangingMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
        const isAuthEndpoint = req.url.includes('/auth/login') || req.url.includes('/auth/register');
        
        if (csrfToken && stateChangingMethods.includes(req.method) && !isAuthEndpoint) {
            console.log('🔒 Adding CSRF token to request:', req.method, req.url);
            modifiedReq = modifiedReq.clone({
                setHeaders: {
                    'X-CSRF-Token': csrfToken
                }
            });
        } else if (stateChangingMethods.includes(req.method) && !isAuthEndpoint && !csrfToken) {
            console.warn('⚠️ No CSRF token available for request:', req.method, req.url);
        }

        // Handle the response to extract updated CSRF token
        return next.handle(modifiedReq).pipe(
            tap(event => {
                if (event instanceof HttpResponse) {
                    // Extract and store updated CSRF token from response headers
                    const newCsrfToken = event.headers.get('X-CSRF-Token');
                    if (newCsrfToken) {
                        console.log('🔄 Received new CSRF token from:', req.url);
                        this.csrfService.setToken(newCsrfToken);
                    }
                }
            })
        );
    }
}