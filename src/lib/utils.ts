import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { isValid, format } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateUniqueId(prefix: string) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}-${result}`;
}

export const safeFormatDate = (dateInput: any, formatString: string = 'PP'): string => {
    if (!dateInput) return 'N/A';

    let date: Date;

    // Handle Firestore Timestamp objects which have a toDate() method
    if (typeof dateInput === 'object' && dateInput !== null && typeof dateInput.toDate === 'function') {
        date = dateInput.toDate();
    } 
    // Handle ISO strings or existing Date objects
    else if (typeof dateInput === 'string' || dateInput instanceof Date) {
        date = new Date(dateInput);
    } 
    // Handle numeric timestamps (milliseconds)
    else if (typeof dateInput === 'number') {
        date = new Date(dateInput);
    } 
    else {
        return 'Invalid Date';
    }

    if (isValid(date)) {
        return format(date, formatString);
    }

    return 'Invalid Date';
};
