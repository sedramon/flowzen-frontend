import {
  Component, OnInit, OnDestroy, ElementRef, ViewChild, 
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ServicesService } from './services/services.service';
import { AuthService } from '../../core/services/auth.service';
import { Service } from '../../models/Service';


@Component({
  selector: 'app-services',
  standalone: true,
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatInputModule
  ],
  templateUrl: './services.component.html',
  styleUrls: ['./services.component.scss'],
  animations: [
  ]
})
export class ServicesComponent implements OnInit, OnDestroy {
  services: Service[] = [];


  @ViewChild('addCircleElement') addCircleElement!: ElementRef;
  @ViewChild('serviceName') serviceInput!: ElementRef;


  constructor(
    private servicesService: ServicesService,
    private authService : AuthService
  ) {}

  ngOnInit() {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      // Ako iz nekog razloga korisnik nije dostupan, uradi fallback (npr. redirect ili error)
      return;
    }

    this.servicesService.getAllServices(currentUser.tenant).subscribe(services => {
      this.services = services;
    });

  }

  ngOnDestroy() {
    
  }


}
