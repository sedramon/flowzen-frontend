import { Supplier } from "./Supplier";
import { Tenant } from "./Tenant";

export interface Article {
    _id: string,
    name: string,
    unitOfMeasure: string,
    price: number,
    salePrice: number | null;
    isOnSale: boolean;
    code: string;
    taxRates: number;
    supplier: Supplier | null;
    tenant: Tenant;
    isActive: boolean;
    remark: string;
}

export interface CreateArticleDto {
    name: string;
    unitOfMeasure: string;
    price: number;
    salePrice?: number | null;
    isOnSale?: boolean;
    code?: string;
    taxRates?: number;
    supplier?: string | null;
    tenant: string;
    isActive?: boolean;
    remark?: string;
}

export type UpdateArticleDto = Partial<CreateArticleDto>;