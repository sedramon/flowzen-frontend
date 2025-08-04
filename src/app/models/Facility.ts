export interface Facility {
  _id?: string;
  name: string;
  address: string;
  openingHour: string;
  closingHour: string;
  tenant: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class FacilityUtils {
  // Convert time string to number (supports formats: "08:00", "8.5", "8,5", "8")
  static convertTimeStringToNumber(timeString: string): number {
    const cleanTime = timeString.trim();
    
    if (cleanTime.includes(':')) {
      const [hours, minutes] = cleanTime.split(':').map(Number);
      return hours + (minutes / 60);
    }
    
    if (cleanTime.includes('.') || cleanTime.includes(',')) {
      return parseFloat(cleanTime.replace(',', '.'));
    }
    
    return parseFloat(cleanTime);
  }

  // Get opening hour as number from facility
  static getOpeningHourAsNumber(facility: Facility): number {
    return this.convertTimeStringToNumber(facility.openingHour);
  }

  // Get closing hour as number from facility
  static getClosingHourAsNumber(facility: Facility): number {
    return this.convertTimeStringToNumber(facility.closingHour);
  }

  // Format number back to time string (HH:MM format)
  static formatNumberToTimeString(hourNumber: number): string {
    const hours = Math.floor(hourNumber);
    const minutes = Math.round((hourNumber - hours) * 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }
}