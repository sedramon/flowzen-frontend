import {
  Component, OnInit, OnDestroy, ElementRef, ViewChild, HostListener
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ServicesService } from './services/services.service';

export interface Service {
  _id?: string;
  name: string;
  // Koristimo staticAngle za raspored servisa oko orbite
  staticAngle: number;
  startX?: number;
  startY?: number;
  flyInState?: 'fromEdge' | 'fromCenter';
}

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
    // Animacija za otvaranje/zatvaranje plus kruga
    trigger('expandCircle', [
      state('closed', style({ width: '60px', height: '60px', zIndex: 10 })),
      state('open', style({ width: '250px', height: '250px', borderRadius: '50%', zIndex: 10 })),
      transition('closed <=> open', animate('0.3s ease-in-out'))
    ]),
    // Animacija za prikazivanje/sklanjanje input polja
    trigger('fadeInInput', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(15px)' }),
        animate('0.3s ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('0.2s ease-in', style({ opacity: 0, transform: 'translateY(15px)' }))
      ])
    ]),
    // Animacija ulaska/izlaska servisa (npr. kada dolaze sa strane ili iz centra, te pri brisanju)
    trigger('flyIn', [
      // Dolazak sa ivice
      transition('void => fromEdge', [
        style({
          transform: 'translate({{startX}}px, {{startY}}px) scale(0.5)',
          opacity: 0
        }),
        animate('0.8s ease-out', style({
          transform: 'none',
          opacity: 1
        }))
      ], { params: { startX: 0, startY: 0 } }),
      // Dolazak iz centra
      transition('void => fromCenter', [
        style({
          transform: 'scale(0)',
          opacity: 0
        }),
        animate('0.5s ease-out', style({
          transform: 'none',
          opacity: 1
        }))
      ]),
      // Izlazak – pad prema dnu i smanjenje
      transition(':leave', [
        animate('0.8s ease-in', style({
          opacity: 0,
          transform: 'translateY(100vh) scale(0.5)'
        }))
      ])
    ])
  ]
})
export class ServicesComponent implements OnInit, OnDestroy {
  services: Service[] = [];
  isAdding = false;
  radius = 200;
  currentRotation = 0;
  private animationFrameId: number | null = null;

  @ViewChild('addCircleElement') addCircleElement!: ElementRef;
  @ViewChild('serviceName') serviceInput!: ElementRef;


  constructor(
    private servicesService: ServicesService,
    private elRef: ElementRef
  ) {}

  ngOnInit() {
    this.loadServices();
    this.animate();
  }

  ngOnDestroy() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  animate() {
    this.currentRotation = (this.currentRotation + 0.2) % 360;
    this.animationFrameId = requestAnimationFrame(() => this.animate());
  }

  loadServices() {
    this.servicesService.getAllServices().subscribe(services => {
      this.services = services.map((service, index) => {
        const staticAngle = index * (360 / Math.max(services.length, 1));
        // Generišemo slučajne koordinate za flyIn animaciju (npr. ±500px)
        const randomX = (Math.random() - 0.5) * 1000;
        const randomY = (Math.random() - 0.5) * 1000;
        return {
          ...service,
          staticAngle,
          startX: randomX,
          startY: randomY,
          flyInState: 'fromEdge'
        };
      });
    });
  }

  toggleAddService() {
    this.isAdding = !this.isAdding;
    if (this.isAdding) {
      setTimeout(() => {
        this.serviceInput?.nativeElement.focus();
      }, 0);
    }
  }

  addService(name: string) {
    if (!name.trim()) return;
    const staticAngle = this.services.length * (360 / Math.max(this.services.length + 1, 1));
    const newService: Service = {
      name,
      staticAngle,
      startX: 0,
      startY: 0,
      flyInState: 'fromCenter'
    };
    this.servicesService.createService(newService).subscribe(addedService => {
      this.services.push({
        ...addedService,
        staticAngle,
        flyInState: 'fromCenter',
        startX: 0,
        startY: 0
      });
      this.rearrangeServices();
      this.isAdding = false;
    });
  }

  deleteService(id: string) {
    this.servicesService.deleteService(id).subscribe(() => {
      this.services = this.services.filter(service => service._id !== id);
      setTimeout(() => {
        this.rearrangeServices();
      }, 800);
    });
  }

  rearrangeServices() {
    this.services.forEach((service, index) => {
      service.staticAngle = index * (360 / Math.max(this.services.length, 1));
    });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (this.isAdding && this.addCircleElement &&
        !this.addCircleElement.nativeElement.contains(event.target)) {
      this.isAdding = false;
    }
  }
}
