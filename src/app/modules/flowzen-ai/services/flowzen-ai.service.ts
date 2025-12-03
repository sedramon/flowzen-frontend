import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, catchError, map, tap } from 'rxjs';
import { Agent } from '../../../models/Agent';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class FlowzenAiService {
  private readonly apiUrl = `${environment.apiUrl}/agents`;
  private agentsSubject = new BehaviorSubject<Agent[]>([]);
  public agents$ = this.agentsSubject.asObservable();
  private useApi = true; // Flag to track if API is available

  // Mock data for MVP (fallback)
  private mockAgents: Agent[] = [
    // Elixir Group agent (client) - zelena tema za agronomiju
    {
      id: 'elixir-agronomy-001',
      name: 'Elixir Agronomy Minion',
      slug: 'elixir-agronomy-minion',
      description: 'Agronomy AI specialist for Elixir Group. Expert in crop management, soil analysis, and agricultural consulting.',
      minionImage: '/assets/minions/elixir_ai_minon.png',
      embedCode: '<iframe src="[VOICEFLOW_EMBED_URL]" width="100%" height="600" frameborder="0"></iframe>',
      tags: ['agronomy', 'agriculture', 'elixir-group'],
      createdAt: new Date().toISOString(),
      isActive: true,
      workspaceId: undefined,
      agentType: 'client',
      clientId: 'elixir-group-id',
      accentColor: '#39ff14', // Vibrantna zelena za agronomiju
      secondaryAccentColor: '#2dcc70' // Tamnija zelena za gradient
    },
    // Flowzen AI Minion (internal) - plava tema za IT podršku
    {
      id: 'flowzen-ai-001',
      name: 'Flowzen AI Minion',
      slug: 'flowzen-ai-minion',
      description: 'Internal Flowzen AI assistant for platform management and user guidance.',
      minionImage: '/assets/minions/flowzen_ai_minon.png',
      embedCode: '<iframe src="[VOICEFLOW_EMBED_URL]" width="100%" height="600" frameborder="0"></iframe>',
      tags: ['internal', 'flowzen', 'platform'],
      createdAt: new Date().toISOString(),
      isActive: true,
      workspaceId: undefined,
      agentType: 'internal',
      clientId: undefined,
      accentColor: '#00cfff', // Vibrantna plava za IT podršku
      secondaryAccentColor: '#0099cc' // Tamnija plava za gradient
    }
  ];

  constructor(private http: HttpClient) {
    console.log('[FlowzenAiService] Constructor: Initializing service');
    console.log('[FlowzenAiService] Mock agents count:', this.mockAgents.length);
    console.log('[FlowzenAiService] Mock agents:', this.mockAgents);
    // Try to load from API, fallback to mock if fails
    this.loadAgentsFromAPI();
  }

  private loadAgentsFromAPI(): void {
    console.log('[FlowzenAiService] loadAgentsFromAPI: Starting API call to', this.apiUrl);
    this.http.get<Agent[]>(this.apiUrl).pipe(
      map(agents => {
        console.log('[FlowzenAiService] loadAgentsFromAPI: API response received', agents);
        const mappedAgents = agents.map(agent => this.mapAgentFromAPI(agent));
        console.log('[FlowzenAiService] loadAgentsFromAPI: Mapped agents', mappedAgents);
        return mappedAgents;
      }),
      tap(agents => {
        // If API returns empty array, use mock data instead
        if (agents.length === 0) {
          console.log('[FlowzenAiService] loadAgentsFromAPI: API returned empty array, using mock data');
          console.log('[FlowzenAiService] loadAgentsFromAPI: Mock agents count:', this.mockAgents.length);
          console.log('[FlowzenAiService] loadAgentsFromAPI: Mock agents:', this.mockAgents);
          this.useApi = false;
          this.agentsSubject.next(this.mockAgents);
          console.log('[FlowzenAiService] loadAgentsFromAPI: Agents subject updated with mock data');
        } else {
          console.log('[FlowzenAiService] loadAgentsFromAPI: Using API data, agents count:', agents.length);
          this.useApi = true;
          this.agentsSubject.next(agents);
          console.log('[FlowzenAiService] loadAgentsFromAPI: Agents subject updated with', agents);
        }
      }),
      catchError(error => {
        console.warn('[FlowzenAiService] loadAgentsFromAPI: API not available, using mock data', error);
        console.log('[FlowzenAiService] loadAgentsFromAPI: Mock agents count:', this.mockAgents.length);
        console.log('[FlowzenAiService] loadAgentsFromAPI: Mock agents:', this.mockAgents);
        this.useApi = false;
        this.agentsSubject.next(this.mockAgents);
        console.log('[FlowzenAiService] loadAgentsFromAPI: Agents subject updated with mock data');
        return of(this.mockAgents);
      })
    ).subscribe();
  }

  private mapAgentFromAPI(agent: any): Agent {
    return {
      id: agent._id || agent.id,
      name: agent.name,
      slug: agent.slug,
      description: agent.description,
      minionImage: agent.minionImage,
      embedCode: agent.embedCode,
      tags: agent.tags || [],
      createdAt: agent.createdAt || new Date().toISOString(),
      updatedAt: agent.updatedAt,
      isActive: agent.isActive !== undefined ? agent.isActive : true,
      workspaceId: agent.workspaceId,
      agentType: agent.agentType || 'internal',
      clientId: agent.clientId,
      accentColor: agent.accentColor || '#00cfff',
      secondaryAccentColor: agent.secondaryAccentColor || '#0099cc'
    };
  }

  getAllAgents(): Observable<Agent[]> {
    console.log('[FlowzenAiService] getAllAgents: Called, useApi:', this.useApi);
    console.log('[FlowzenAiService] getAllAgents: Current agents subject value:', this.agentsSubject.value);
    
    if (this.useApi) {
      console.log('[FlowzenAiService] getAllAgents: Using API');
      return this.http.get<Agent[]>(this.apiUrl).pipe(
        map(agents => {
          console.log('[FlowzenAiService] getAllAgents: API response', agents);
          const mappedAgents = agents.map(agent => this.mapAgentFromAPI(agent));
          console.log('[FlowzenAiService] getAllAgents: Mapped agents', mappedAgents);
          return mappedAgents;
        }),
        tap(agents => {
          // If API returns empty array, use mock data instead
          if (agents.length === 0) {
            console.log('[FlowzenAiService] getAllAgents: API returned empty array, using mock data');
            this.useApi = false;
            this.agentsSubject.next(this.mockAgents);
            console.log('[FlowzenAiService] getAllAgents: Agents subject updated with mock data');
          } else {
            console.log('[FlowzenAiService] getAllAgents: Updating agents subject with', agents);
            this.agentsSubject.next(agents);
          }
        }),
        map(agents => {
          // Return mock data if API returned empty array
          if (agents.length === 0) {
            console.log('[FlowzenAiService] getAllAgents: Returning mock agents instead of empty array');
            return this.mockAgents;
          }
          return agents;
        }),
        catchError(error => {
          console.warn('[FlowzenAiService] getAllAgents: API error, using cached/mock data', error);
          this.useApi = false;
          const currentAgents = this.agentsSubject.value;
          // If current agents is empty, use mock data
          if (currentAgents.length === 0) {
            console.log('[FlowzenAiService] getAllAgents: Current agents is empty, using mock data');
            this.agentsSubject.next(this.mockAgents);
            return of(this.mockAgents);
          }
          console.log('[FlowzenAiService] getAllAgents: Returning cached agents', currentAgents);
          return this.agents$;
        })
      );
    }
    
    console.log('[FlowzenAiService] getAllAgents: Using cached/mock data, returning agents$');
    const currentAgents = this.agentsSubject.value;
    // If current agents is empty, use mock data
    if (currentAgents.length === 0) {
      console.log('[FlowzenAiService] getAllAgents: Current agents is empty, using mock data');
      this.agentsSubject.next(this.mockAgents);
      return of(this.mockAgents);
    }
    return this.agents$;
  }

  getAgentById(id: string): Observable<Agent | undefined> {
    if (this.useApi) {
      return this.http.get<Agent>(`${this.apiUrl}/${id}`).pipe(
        map(agent => this.mapAgentFromAPI(agent)),
        catchError(error => {
          console.warn('API error, trying local cache', error);
          return this.agents$.pipe(
            map(agents => agents.find(a => a.id === id))
          );
        })
      );
    }
    return this.agents$.pipe(
      map(agents => agents.find(a => a.id === id))
    );
  }

  getAgentBySlug(slug: string): Observable<Agent | undefined> {
    return new Observable((observer) => {
      this.agents$.subscribe((agents) => {
        const agent = agents.find((a) => a.slug === slug);
        observer.next(agent);
        observer.complete();
      });
    });
  }

  getAgentsByType(type: 'internal' | 'client'): Observable<Agent[]> {
    return new Observable((observer) => {
      this.agents$.subscribe((agents) => {
        const filtered = agents.filter((a) => a.agentType === type);
        observer.next(filtered);
        observer.complete();
      });
    });
  }

  getAgentsByClient(clientId: string): Observable<Agent[]> {
    return new Observable((observer) => {
      this.agents$.subscribe((agents) => {
        const filtered = agents.filter((a) => a.clientId === clientId);
        observer.next(filtered);
        observer.complete();
      });
    });
  }

  createAgent(agent: Omit<Agent, 'id' | 'createdAt'>): Observable<Agent> {
    if (this.useApi) {
      const createDto = {
        name: agent.name,
        slug: agent.slug,
        description: agent.description,
        minionImage: agent.minionImage,
        embedCode: agent.embedCode,
        tags: agent.tags || [],
        isActive: agent.isActive !== undefined ? agent.isActive : true,
        workspaceId: agent.workspaceId,
        agentType: agent.agentType || 'internal',
        clientId: agent.clientId,
        accentColor: agent.accentColor || '#00cfff',
        secondaryAccentColor: agent.secondaryAccentColor || '#0099cc'
      };

      return this.http.post<Agent>(this.apiUrl, createDto).pipe(
        map(createdAgent => this.mapAgentFromAPI(createdAgent)),
        tap(newAgent => {
          const currentAgents = this.agentsSubject.value;
          this.agentsSubject.next([...currentAgents, newAgent]);
        }),
        catchError(error => {
          console.error('Failed to create agent via API', error);
          // Fallback to local creation
          const newAgent: Agent = {
            ...agent,
            id: Date.now().toString(),
            createdAt: new Date().toISOString(),
          };
          const currentAgents = this.agentsSubject.value;
          this.agentsSubject.next([...currentAgents, newAgent]);
          return of(newAgent);
        })
      );
    }

    // Fallback to local creation
    const newAgent: Agent = {
      ...agent,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    const currentAgents = this.agentsSubject.value;
    this.agentsSubject.next([...currentAgents, newAgent]);
    return of(newAgent);
  }

  updateAgent(id: string, updates: Partial<Agent>): Observable<Agent> {
    if (this.useApi) {
      const updateDto: any = {};
      if (updates.name !== undefined) updateDto.name = updates.name;
      if (updates.slug !== undefined) updateDto.slug = updates.slug;
      if (updates.description !== undefined) updateDto.description = updates.description;
      if (updates.minionImage !== undefined) updateDto.minionImage = updates.minionImage;
      if (updates.embedCode !== undefined) updateDto.embedCode = updates.embedCode;
      if (updates.tags !== undefined) updateDto.tags = updates.tags;
      if (updates.isActive !== undefined) updateDto.isActive = updates.isActive;
      if (updates.workspaceId !== undefined) updateDto.workspaceId = updates.workspaceId;
      if (updates.agentType !== undefined) updateDto.agentType = updates.agentType;
      if (updates.clientId !== undefined) updateDto.clientId = updates.clientId;
      if (updates.accentColor !== undefined) updateDto.accentColor = updates.accentColor;
      if (updates.secondaryAccentColor !== undefined) updateDto.secondaryAccentColor = updates.secondaryAccentColor;

      return this.http.put<Agent>(`${this.apiUrl}/${id}`, updateDto).pipe(
        map(agent => this.mapAgentFromAPI(agent)),
        tap(updatedAgent => {
          const currentAgents = this.agentsSubject.value;
          const index = currentAgents.findIndex(a => a.id === id);
          if (index !== -1) {
            const newAgents = [...currentAgents];
            newAgents[index] = updatedAgent;
            this.agentsSubject.next(newAgents);
          }
        }),
        catchError(error => {
          console.error('Failed to update agent via API', error);
          // Fallback to local update
          return this.updateAgentLocal(id, updates);
        })
      );
    }

    return this.updateAgentLocal(id, updates);
  }

  private updateAgentLocal(id: string, updates: Partial<Agent>): Observable<Agent> {
    const currentAgents = this.agentsSubject.value;
    const index = currentAgents.findIndex((a) => a.id === id);

    if (index === -1) {
      throw new Error(`Agent with id ${id} not found`);
    }

    const updatedAgent: Agent = {
      ...currentAgents[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    const newAgents = [...currentAgents];
    newAgents[index] = updatedAgent;
    this.agentsSubject.next(newAgents);

    return of(updatedAgent);
  }

  deleteAgent(id: string): Observable<void> {
    if (this.useApi) {
      return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
        tap(() => {
          const currentAgents = this.agentsSubject.value;
          const filteredAgents = currentAgents.filter((a) => a.id !== id);
          this.agentsSubject.next(filteredAgents);
        }),
        catchError(error => {
          console.error('Failed to delete agent via API', error);
          // Fallback to local delete
          const currentAgents = this.agentsSubject.value;
          const filteredAgents = currentAgents.filter((a) => a.id !== id);
          this.agentsSubject.next(filteredAgents);
          return of(undefined);
        })
      );
    }

    const currentAgents = this.agentsSubject.value;
    const filteredAgents = currentAgents.filter((a) => a.id !== id);
    this.agentsSubject.next(filteredAgents);
    return of(undefined);
  }

  toggleAgentStatus(id: string): Observable<Agent> {
    if (this.useApi) {
      return this.http.patch<Agent>(`${this.apiUrl}/${id}/toggle-status`, {}).pipe(
        map(agent => this.mapAgentFromAPI(agent)),
        tap(updatedAgent => {
          const currentAgents = this.agentsSubject.value;
          const index = currentAgents.findIndex(a => a.id === id);
          if (index !== -1) {
            const newAgents = [...currentAgents];
            newAgents[index] = updatedAgent;
            this.agentsSubject.next(newAgents);
          }
        }),
        catchError(error => {
          console.error('Failed to toggle agent status via API', error);
          // Fallback to local toggle
          const currentAgents = this.agentsSubject.value;
          const agent = currentAgents.find((a) => a.id === id);
          if (!agent) {
            throw new Error(`Agent with id ${id} not found`);
          }
          return this.updateAgent(id, { isActive: !agent.isActive });
        })
      );
    }

    const currentAgents = this.agentsSubject.value;
    const agent = currentAgents.find((a) => a.id === id);

    if (!agent) {
      throw new Error(`Agent with id ${id} not found`);
    }

    return this.updateAgent(id, { isActive: !agent.isActive });
  }
}

