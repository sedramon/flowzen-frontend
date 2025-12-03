import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { Agent } from '../../../../models/Agent';
import { FlowzenAiService } from '../../services/flowzen-ai.service';
import { AgentEmbedComponent } from '../agent-embed/agent-embed.component';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { BadgeModule } from 'primeng/badge';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-agent-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    AgentEmbedComponent,
    CardModule,
    TagModule,
    BadgeModule,
    ButtonModule
  ],
  templateUrl: './agent-detail.component.html',
  styleUrl: './agent-detail.component.scss',
})
export class AgentDetailComponent implements OnInit, OnDestroy {
  agent: Agent | undefined;
  private subscription: Subscription = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private flowzenAiService: FlowzenAiService
  ) {}

  ngOnInit() {
    const agentId = this.route.snapshot.paramMap.get('id');
    if (agentId) {
      const sub = this.flowzenAiService.getAgentById(agentId).subscribe((agent) => {
        this.agent = agent;
        if (!agent) {
          // Agent not found, redirect to dashboard
          this.router.navigate(['/flowzen-ai']);
        }
      });
      this.subscription.add(sub);
    }
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  goBack() {
    this.router.navigate(['/flowzen-ai']);
  }

  getAccentColor(): string {
    return this.agent?.accentColor || '#00cfff';
  }

  getSecondaryAccentColor(): string {
    return this.agent?.secondaryAccentColor || '#0099cc';
  }

  hexToRgb(hex: string): string {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
      : '0, 207, 255';
  }
}

