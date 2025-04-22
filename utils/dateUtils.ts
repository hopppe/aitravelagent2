interface DateRange {
  start: string;
  end: string;
}

/**
 * Format a date range into a readable string
 */
export function formatDateRange(dateRange: DateRange): string {
  const startDate = new Date(dateRange.start);
  const endDate = new Date(dateRange.end);
  
  const options: Intl.DateTimeFormatOptions = { 
    month: 'short', 
    day: 'numeric'
  };
  
  // Add year if the dates are in different years
  if (startDate.getFullYear() !== endDate.getFullYear()) {
    options.year = 'numeric';
  }
  
  const formattedStart = startDate.toLocaleDateString('en-US', options);
  
  // Use full options for end date
  options.year = 'numeric';
  const formattedEnd = endDate.toLocaleDateString('en-US', options);
  
  return `${formattedStart} - ${formattedEnd}`;
} 