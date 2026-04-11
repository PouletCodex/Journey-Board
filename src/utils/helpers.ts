/**
 * Format a Date object into YYYY-MM-DD string (consistent date key format)
 */
export const formatDateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

/**
 * Generate a simple unique ID
 */
export const uid = (): string => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

/**
 * Clamp string length and trim whitespace
 */
export const clampStr = (value: string, maxLength = 1000): string => {
  return (value || "").trim().substring(0, maxLength);
};

/**
 * Format number with commas
 */
export const formatNumber = (num: number): string => {
  return num.toLocaleString();
};
