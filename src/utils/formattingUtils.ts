/**
 * Utility functions for formatting data for display.
 */

/**
 * Formats a number, abbreviating thousands with 'K'.
 * Null or undefined values return an empty string.
 * Numbers >= 1000 or <= -1000 are formatted to one decimal place with 'K' (e.g., 1.3K, -2.5K).
 * Other numbers are formatted with zero decimal places.
 * @param value The number to format.
 * @returns The formatted string representation of the number.
 */
export const formatNumberAbbreviated = (value: number | null | undefined): string => {
    if (value === null || value === undefined) {
      return '';
    }
  
    const absValue = Math.abs(value);
  
    if (absValue >= 1000) {
      // Divide by 1000, format to one decimal place, and add 'K'
      return `${(value / 1000).toFixed(1)}K`;
    } else {
      // Format with zero decimal places for values less than 1000
      return value.toFixed(0);
    }
  };