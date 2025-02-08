import { Component, OnInit } from '@angular/core';
import { LayoutComponent } from "./layout/layout.component";
import { Router, RouterOutlet } from '@angular/router';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit{
  title = 'colegenzi mission';

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
      if(!this.authService.isLoggedIn()) {
        this.router.navigate(['/login']);
      }
  }
}
