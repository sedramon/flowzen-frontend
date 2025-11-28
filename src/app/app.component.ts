import { Component, OnInit } from '@angular/core';
import { LayoutComponent } from "./layout/layout.component";
import { Router, RouterOutlet } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import { ThemeService } from './core/services/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit{
  title = 'colegenzi mission';

  constructor(
    private authService: AuthService, 
    private router: Router,
    private themeService: ThemeService
  ) {}

  ngOnInit(): void {
      // Inicijalizuj temu (ThemeService će automatski učitati settings)
      this.themeService.refreshTheme();

      if(!this.authService.isLoggedIn()) {
        this.router.navigate(['/login']);
      }
  }
}
