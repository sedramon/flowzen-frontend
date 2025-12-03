export interface Agent {
  id: string;
  name: string;
  slug: string;
  description: string;
  minionImage: string; // URL do AI Minion avatar slike
  embedCode: string; // Voiceflow embed kod (direktno HTML)
  tags: string[];
  createdAt: string;
  updatedAt?: string;
  isActive: boolean;
  workspaceId?: string;
  agentType: 'internal' | 'client'; // Tip agenta - za Flowzen ili za klijente
  clientId?: string; // ID klijenta ako je agentType === 'client'
  accentColor?: string; // Akcent boja agenta (npr. '#39ff14' za zelenu, '#00cfff' za plavu)
  secondaryAccentColor?: string; // Sekundarna akcent boja za gradient efekte
}

