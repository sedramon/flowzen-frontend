export interface Client {
    _id?: string
    firstName: string
    lastName: string
    contactEmail: string
    contactPhone: string
    address: string
    tenant: string
    user?: string
    createdAt?: Date
    updatedAt?: Date
}