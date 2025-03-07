export interface Employee {
    _id?: string;
    firstName: string;
    lastName: string;
    contactEmail: string;
    contactPhone: string;
    dateOfBirth: Date;
    jobRole: string;
    isActive: boolean;
    includeInAppoitments: boolean;
    tenant: string;
}