import { Tenant } from "./Tenant";

export interface Supplier {
    _id?: string;
    name: string;
    address: string;
    city: string;
    contactPhone: string;
    contactEmail: string;
    contactLandline?: string;
    contactPerson?: string;
    pib?: string;
    remark?: string;
    isActive: boolean;
    tenant: Tenant;
}

export interface CreateAndUpdateSupplierDto {
    name: string;
    address: string;
    city: string
    contactPhone: string;
    contactEmail: string;
    contactLandline?: string;
    contactPerson?: string;
    pib?: string;
    remark?: string;
    isActive: boolean;
    tenant: string;
}