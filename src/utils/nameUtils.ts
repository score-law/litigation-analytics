/**
 * Name Utility Functions
 *
 * This file contains utility functions for mapping IDs to names
 * for courts, judges, charges, and other entities.
 */

import { courts, judges } from '@/data';
import { Charge } from '@/types';

/**
 * Gets the court name for a given court ID
 *
 * @param courtId - The ID of the court
 * @returns The name of the court, or "Unknown Court" if not found
 */
export function getCourtName(courtId: number): string {
  const court = courts.find((c) => c.id === courtId);
  return court ? court.name : 'Unknown Court';
}

/**
 * Gets the judge name for a given judge ID
 *
 * @param judgeId - The ID of the judge
 * @returns The name of the judge, or "Unknown Judge" if not found
 */
export function getJudgeName(judgeId: number): string {
  const judge = judges.find((j) => j.id === judgeId);
  return judge ? judge.name : 'Unknown Judge';
}

/**
 * Gets the charge name for a given charge ID
 * Fetches from API when needed
 *
 * @param chargeId - The ID of the charge
 * @returns The name of the charge, or a placeholder
 */
export function getChargeName(chargeId: number): string {
  if (chargeId === 0) return 'Any Charge';
  
  // For non-zero IDs, trigger a fetch in the background
  // and return a placeholder immediately
  const placeholderName = `Charge #${chargeId}`;
  
  // Fetch the charge data asynchronously and update the DOM when it's ready
  fetch(`/api/charges?chargeId=${chargeId}`)
    .then(response => {
      if (!response.ok) throw new Error('Failed to fetch charge name');
      return response.json();
    })
    .then(data => {
      // Find and update elements displaying this charge name
      const elements = document.querySelectorAll(`[data-charge-id="${chargeId}"]`);
      elements.forEach(el => {
        el.textContent = data.name;
      });
    })
    .catch(error => {
      console.error(`Error fetching charge name for ID ${chargeId}:`, error);
    });
  
  return placeholderName;
}

/**
 * Creates a formatted specification title from court, judge, and charge IDs.
 * - If all IDs are 0, displays "Global"
 * - Otherwise, only displays IDs that are not 0
 *
 * @param courtId - The ID of the court (0 if unspecified)
 * @param judgeId - The ID of the judge (0 if unspecified)
 * @param chargeId - The ID of the charge (0 if unspecified)
 * @param chargeName - Optional name of the charge (if already fetched)
 * @returns A formatted specification title string
 */
export function formatSpecificationTitle(
  courtId: number,
  judgeId: number,
  chargeId: number,
  chargeName?: string
): string {
  // If all IDs are 0, return "Global"
  if (courtId === 0 && judgeId === 0 && chargeId === 0) {
    return 'Global';
  }

  const segments: string[] = [];

  // Only add judge name if judgeId is non-zero
  if (judgeId !== 0) {
    segments.push(getJudgeName(judgeId));
  }

  // Only add court name if courtId is non-zero
  if (courtId !== 0) {
    segments.push(getCourtName(courtId));
  }

  // Only add charge name if chargeId is non-zero
  if (chargeId !== 0) {
    // Use provided charge name if available, otherwise use a placeholder
    segments.push(chargeName || `Charge #${chargeId}`);
  }

  // If everything is 0 or missing, default to 'Global'
  if (segments.length === 0) {
    return 'Global';
  }

  // Otherwise, join the non-empty specifications with " | "
  return segments.join(' | ');
}