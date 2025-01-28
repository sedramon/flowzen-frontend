import { Component } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { FlexLayoutModule } from '@angular/flex-layout';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [FlexLayoutModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {
  user: any;

  constructor() {}

  ngOnInit(): void {

  }
}
