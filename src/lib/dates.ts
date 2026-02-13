/**
 * IST Date Utilities
 * All cron jobs and date comparisons should use IST (UTC+5:30) 
 * since the user base is in India.
 */

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

/**
 * Get the current date string (YYYY-MM-DD) in IST timezone.
 */
export function getISTDateString(date?: Date): string {
    const d = date || new Date();
    const istDate = new Date(d.getTime() + IST_OFFSET_MS);
    return istDate.toISOString().split('T')[0];
}

/**
 * Convert an ISO timestamp string to IST date string (YYYY-MM-DD).
 */
export function toISTDateString(isoString: string): string {
    return getISTDateString(new Date(isoString));
}
