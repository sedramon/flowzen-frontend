export interface Facility {
  _id: string;
  name: string;
  address: string;
  openingHour: string;
  closingHour: string;
  tenant: string;
  createdAt?: Date;
  updatedAt?: Date;
}
