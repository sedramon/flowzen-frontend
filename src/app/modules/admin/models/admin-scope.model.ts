export interface AdminScope {
  _id: string;
  name: string;
  description?: string;
  category?: 'tenant' | 'global';
  createdAt?: string;
  updatedAt?: string;
}


