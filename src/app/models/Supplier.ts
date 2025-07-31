import { Tenant } from "./Tenant";

export interface Supplier {
    _id?: string;
    name: string;
    address: string;
    contactPhone: string;
    contactEmail: string;
    tenant: Tenant;
}

export interface CreateAndUpdateSupplierDto {
    name: string;
    address: string;
    contactPhone: string;
    contactEmail: string;
    tenant: string;
}