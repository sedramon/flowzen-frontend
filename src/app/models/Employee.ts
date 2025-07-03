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
    avatarUrl?: string;
    workingShift?: {
        date: string;
        shiftType: string;
        startHour: number;
        endHour: number;
        note?: string;
    };
}