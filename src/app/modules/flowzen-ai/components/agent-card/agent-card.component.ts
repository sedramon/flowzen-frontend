import { Component, Input, Output, EventEmitter, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Agent } from '../../../../models/Agent';
import { TagModule } from 'primeng/tag';
import { BadgeModule } from 'primeng/badge';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-agent-card',
  standalone: true,
  imports: [
    CommonModule,
    TagModule,
    BadgeModule,
    CardModule,
    ButtonModule,
    TooltipModule
  ],
  templateUrl: './agent-card.component.html',
  styleUrl: './agent-card.component.scss',
})
export class AgentCardComponent {
  @Input() agent!: Agent;
  @Output() previewClick = new EventEmitter<Agent>();
  @ViewChild('cardContent', { static: false }) cardContent!: ElementRef<HTMLElement>;
  
  isNavigating = false;

  constructor(private router: Router) {}

  onPreviewClick(event: Event) {
    event.stopPropagation();
    this.previewClick.emit(this.agent);
  }

  getAgentDetailUrl(): string {
    return `/flowzen-ai/${this.agent.id}`;
  }

  onCardClick(event: Event) {
    if (this.isNavigating) {
      event.preventDefault();
      return;
    }

    this.isNavigating = true;
    const target = event.currentTarget as HTMLElement;
    
    // Add exit animation class
    target.classList.add('navigating');
    
    // Navigate after animation
    setTimeout(() => {
      this.router.navigate([this.getAgentDetailUrl()]).then(() => {
        this.isNavigating = false;
      }).catch(() => {
        this.isNavigating = false;
        target.classList.remove('navigating');
      });
    }, 400); // Match animation duration
  }

  getAccentColor(): string {
    return this.agent.accentColor || '#00cfff';
  }

  getSecondaryAccentColor(): string {
    return this.agent.secondaryAccentColor || '#0099cc';
  }

  hexToRgb(hex: string): string {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
      : '0, 207, 255';
  }
}

