import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { Agent } from '../../../../models/Agent';
import { FlowzenAiService } from '../../services/flowzen-ai.service';
import { AgentCardComponent } from '../agent-card/agent-card.component';
import { AgentEmbedComponent } from '../agent-embed/agent-embed.component';
import { AgentEditorComponent } from '../agent-editor/agent-editor.component';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TabsModule } from 'primeng/tabs';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-flowzen-ai-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    AgentCardComponent,
    AgentEmbedComponent,
    AgentEditorComponent,
    CardModule,
    ButtonModule,
    TabsModule,
    TooltipModule
  ],
  templateUrl: './flowzen-ai-dashboard.component.html',
  styleUrl: './flowzen-ai-dashboard.component.scss',
})
export class FlowzenAiDashboardComponent implements OnInit, OnDestroy {
  agents: Agent[] = [];
  filteredAgents: Agent[] = [];
  activeTab: number | string = "0";
  previewAgent: Agent | null = null;
  showPreview = false;
  showCreateDialog = false;
  editingAgent: Agent | null = null;
  private subscription: Subscription = new Subscription();

  get totalAgents(): number {
    return this.agents.length;
  }

  get availableAgents(): number {
    return this.filteredAgents.length;
  }

  constructor(
    private flowzenAiService: FlowzenAiService,
    public router: Router
  ) {}

  ngOnInit() {
    console.log('[FlowzenAiDashboard] ngOnInit: Component initialized');
    const sub = this.flowzenAiService.getAllAgents().subscribe((agents) => {
      console.log('[FlowzenAiDashboard] ngOnInit: Agents received from service', agents);
      console.log('[FlowzenAiDashboard] ngOnInit: Agents count:', agents.length);
      this.agents = agents;
      console.log('[FlowzenAiDashboard] ngOnInit: this.agents set to', this.agents);
      this.filterAgents();
      console.log('[FlowzenAiDashboard] ngOnInit: After filterAgents, filteredAgents:', this.filteredAgents);
    });
    this.subscription.add(sub);
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  onTabChange(value: number | string) {
    this.activeTab = value;
    this.filterAgents();
  }

  filterAgents() {
    console.log('[FlowzenAiDashboard] filterAgents: Called');
    console.log('[FlowzenAiDashboard] filterAgents: activeTab:', this.activeTab);
    console.log('[FlowzenAiDashboard] filterAgents: this.agents:', this.agents);
    console.log('[FlowzenAiDashboard] filterAgents: this.agents.length:', this.agents.length);
    
    const tabValue = typeof this.activeTab === 'string' ? parseInt(this.activeTab) : this.activeTab;
    if (tabValue === 0) {
      // All agents
      console.log('[FlowzenAiDashboard] filterAgents: Showing all agents');
      this.filteredAgents = this.agents;
    } else if (tabValue === 1) {
      // Internal agents
      console.log('[FlowzenAiDashboard] filterAgents: Filtering internal agents');
      this.filteredAgents = this.agents.filter((a) => a.agentType === 'internal');
      console.log('[FlowzenAiDashboard] filterAgents: Internal agents found:', this.filteredAgents.length);
    } else if (tabValue === 2) {
      // Client agents
      console.log('[FlowzenAiDashboard] filterAgents: Filtering client agents');
      this.filteredAgents = this.agents.filter((a) => a.agentType === 'client');
      console.log('[FlowzenAiDashboard] filterAgents: Client agents found:', this.filteredAgents.length);
    }
    
    console.log('[FlowzenAiDashboard] filterAgents: Final filteredAgents:', this.filteredAgents);
    console.log('[FlowzenAiDashboard] filterAgents: filteredAgents.length:', this.filteredAgents.length);
  }

  onPreviewClick(agent: Agent) {
    this.previewAgent = agent;
    this.showPreview = true;
  }

  closePreview() {
    this.showPreview = false;
    this.previewAgent = null;
  }

  getAccentColor(): string {
    return this.previewAgent?.accentColor || '#00cfff';
  }

  getSecondaryAccentColor(): string {
    return this.previewAgent?.secondaryAccentColor || '#0099cc';
  }

  hexToRgb(hex: string): string {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
      : '0, 207, 255';
  }

  openCreateDialog() {
    this.editingAgent = null;
    this.showCreateDialog = true;
  }

  openEditDialog(agent: Agent) {
    this.editingAgent = agent;
    this.showCreateDialog = true;
  }

  closeDialog() {
    this.showCreateDialog = false;
    this.editingAgent = null;
  }

  saveAgent(agentData: Partial<Agent>) {
    if (this.editingAgent) {
      // Update existing agent
      const sub = this.flowzenAiService.updateAgent(this.editingAgent.id, agentData).subscribe({
        next: (updatedAgent) => {
          // Refresh agents list
          const sub2 = this.flowzenAiService.getAllAgents().subscribe((agents) => {
            this.agents = agents;
            this.filterAgents();
          });
          this.subscription.add(sub2);
          this.closeDialog();
        },
        error: (error) => {
          console.error('Failed to update agent:', error);
        }
      });
      this.subscription.add(sub);
    } else {
      // Create new agent
      const sub = this.flowzenAiService.createAgent(agentData as Omit<Agent, 'id' | 'createdAt'>).subscribe({
        next: (newAgent) => {
          // Refresh agents list
          const sub2 = this.flowzenAiService.getAllAgents().subscribe((agents) => {
            this.agents = agents;
            this.filterAgents();
          });
          this.subscription.add(sub2);
          this.closeDialog();
        },
        error: (error) => {
          console.error('Failed to create agent:', error);
        }
      });
      this.subscription.add(sub);
    }
  }
}

