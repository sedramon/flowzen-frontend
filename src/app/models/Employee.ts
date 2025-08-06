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
    tenant: string | { _id: string; name: string }; // Support both string and object
    facilities?: Array<string | { _id: string; name: string }>; // Support both string and object arrays
    avatarUrl?: string;
    workingShift?: {
        date: string;
        shiftType: string;
        startHour: number;
        endHour: number;
        note?: string;
    };
}