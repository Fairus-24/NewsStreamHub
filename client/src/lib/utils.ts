import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatDistanceToNow, format } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  if (!date) return '';
  let dateObj: Date;
  if (typeof date === 'string') {
    // Try to parse Firestore Timestamp string or ISO string
    if (/^\d+$/.test(date)) {
      // If date is a number string (timestamp in seconds or ms)
      const num = Number(date);
      dateObj = new Date(num > 1e12 ? num : num * 1000);
    } else {
      dateObj = new Date(date);
    }
  } else {
    dateObj = date;
  }
  if (isNaN(dateObj.getTime())) return '';
  return formatDistanceToNow(dateObj, { addSuffix: true });
}

export function formatFullDate(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return format(dateObj, "MMMM d, yyyy • h:mm a");
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
}

export function getReadingTime(content: string): number {
  const wordsPerMinute = 200;
  const words = content.trim().split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
}

export function formatViewCount(count: number): string {
  if (count < 1000) return count.toString();
  return `${(count / 1000).toFixed(1)}k`;
}
