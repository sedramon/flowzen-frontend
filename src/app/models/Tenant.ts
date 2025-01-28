export interface Tenant {
    id: number;
    name: string;
    companyType: string;
    street: string;
    city: string;
    country: string;
    contactEmail: string;
    contanctPhone: string;
    MIB: string;
    PIB: string;
    hasActiveLicense: boolean;
    licenseStartDate: Date;
    licenseExpiryDate: Date;
}