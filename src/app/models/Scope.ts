export interface Scope {
    _id?: string;
    name: string;
    description: string;
    category?: 'tenant' | 'global';
}