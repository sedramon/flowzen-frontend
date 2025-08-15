// models/Settings.ts
export type Theme = 'light' | 'dark' | 'system';

export interface EffectiveSettings {
  currency: string | null;
  language: string | null;
  theme: string | null;
  navbarShortcuts: string[] | null;
  landingPage: string | null;
}
export interface RawSettings {
  _id?: string;
  tenant?: string;
  type?: 'tenant' | 'user';
  user?: string | null;
  createdAt?: string;
  updatedAt?: string;
  currency?: string;
  language?: string;
  theme?: Theme;
  navbarShortcuts?: string[];
  landingPage?: string;
}

export interface UpsertSettingsDto {
  tenant: string;
  type: 'tenant' | 'user';
  user?: string | null;
  currency?: string;
  language?: string;
  theme?: Theme;
  navbarShortcuts?: string[];
  landingPage?: string;
}