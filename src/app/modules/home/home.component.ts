import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    CardModule,
    InputTextModule,
    FormsModule
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit {
  user: any;
  email: string = '';
  
  // Animated stats
  stats = [
    { value: 0, target: 1200, label: 'Zakazanih termina', icon: 'pi-calendar' },
    { value: 0, target: 350, label: 'Aktivnih klijenata', icon: 'pi-users' },
    { value: 0, target: 50, label: 'Zaposlenih', icon: 'pi-briefcase' }
  ];

  features = [
    {
      icon: 'pi-calendar-plus',
      title: 'Lako zakazivanje',
      description: 'Zakažite, premestite ili otkažite termin sa samo nekoliko klikova.'
    },
    {
      icon: 'pi-users',
      title: 'Upravljanje klijentima',
      description: 'Čuvajte profile klijenata, istoriju i beleške na jednom mestu.'
    },
    {
      icon: 'pi-chart-bar',
      title: 'Uvidi i izveštaji',
      description: 'Pratite svoje performanse sa ugrađenom analitikom.'
    }
  ];

  testimonials = [
    {
      text: 'Flowzen je potpuno transformisao način na koji upravljamo rezervacijama—tako intuitivan!',
      author: 'Sara',
      role: 'Vlasnica salona'
    },
    {
      text: 'Naš tim voli analitičku tablu za praćenje performansi.',
      author: 'Marko',
      role: 'Menadžer spa centra'
    },
    {
      text: 'Upravljanje klijentima nikada nije bilo lakše. Toplo preporučujem.',
      author: 'Lisa',
      role: 'Stomatološka klinika'
    }
  ];

  constructor(public authService: AuthService) {}

  ngOnInit(): void {
    // Animate stats on load
    setTimeout(() => this.animateStats(), 500);
  }

  animateStats() {
    this.stats.forEach((stat, index) => {
      const duration = 2000;
      const steps = 50;
      const increment = stat.target / steps;
      let current = 0;

      const timer = setInterval(() => {
        current += increment;
        if (current >= stat.target) {
          stat.value = stat.target;
          clearInterval(timer);
        } else {
          stat.value = Math.floor(current);
        }
      }, duration / steps);
    });
  }

  subscribe() {
    if (this.email) {
      console.log('Subscribing:', this.email);
      // Add your subscription logic here
      this.email = '';
    }
  }
}
