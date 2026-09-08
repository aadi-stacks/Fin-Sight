/**
 * Formats a numerical monetary value into Indian Rupee (₹) string representation.
 * Avoids unsafe float string representations by relying on Intl.NumberFormat.
 */
export const formatCurrency = (amount: number, currency: string = 'INR'): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Formats a float ratio into a clean percentage string e.g. 24.5%
 */
export const formatPercentage = (value: number): string => {
  return `${value.toFixed(1)}%`;
};

/**
 * Formats an ISO date string into a user-friendly format e.g. "24 Aug 2026"
 */
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
};
