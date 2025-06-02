export interface Service {
    _id?: string;
    name: string;
    price: number;
    durationMinutes: number;
    description?: string;
    discountedPrice?: string;
    isActive: boolean;
    tenant: string;
}