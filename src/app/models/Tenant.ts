export interface Tenant {
    _id: string;
    name: string;
    companyType?: string | null;
    street?: string | null;
    city?: string | null;
    country?: string | null;
    contactEmail?: string | null;
    contactPhone?: string | null;
    MIB?: string | null;
    PIB?: string | null;
    hasActiveLicense?: boolean;
    licenseStartDate?: string | null;
    licenseExpiryDate?: string | null;
}