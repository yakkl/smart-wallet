import { log } from "$lib/plugins/Logger";

export type Timestamp = string | number | Date | undefined;

export interface FormatTimestampOptions {
  placeholder?: string;
  locale?: string;
  options?: Intl.DateTimeFormatOptions;
}

export function dateString() {
  return new Date().toISOString();
}

export function getTime(): number { return (new Date()).getTime(); }

export function formatDate( date: Date ): string {
  return date.toLocaleString();
}

export function formatTimestamp(
  timestamp: Timestamp,
  { placeholder = '------', locale = 'en-US', options = { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' } }: FormatTimestampOptions = {}
): string {
  try {
    if (timestamp === undefined || (typeof timestamp === 'number' && Number.isNaN(timestamp))) {
      return placeholder;
    }

    let date: Date;

    if (typeof timestamp === 'string' || typeof timestamp === 'number') {
      date = new Date(timestamp);
      if (isNaN(date.getTime())) {
        return placeholder;
      }
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else {
      return placeholder;
    }

    return new Intl.DateTimeFormat(locale, options).format(date);
  } catch (e) {
    log.error(e);
    return placeholder;
  }
}

// Example usage
// console.log(formatTimestamp('2023-07-12T14:30:00Z')); // Default formatting
// console.log(formatTimestamp(1689160200000)); // Default formatting with timestamp
// console.log(formatTimestamp(undefined)); // Default placeholder
// console.log(formatTimestamp('invalid date')); // Default placeholder with invalid date
// console.log(formatTimestamp(new Date(), { placeholder: '', locale: 'en-GB', options: { year: 'numeric', month: 'long', day: 'numeric' } })); // Custom formatting
