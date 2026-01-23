import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function formatIndianDate(dateString: string | Date): string {
    if (!dateString) return "";
    const date = new Date(dateString);

    // Options for "Friday, 23 January 2026, 7:30 PM"
    // 'en-IN' usually formats as DD/MM/YYYY, so we might need custom options
    return date.toLocaleString("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "numeric",
        minute: "numeric",
        hour12: true
    });
}
