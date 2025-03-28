
/**
 * Converts an array of selected values to an object with boolean flags
 * @param selectedValues Array of selected option values
 * @param allOptions Array of all possible option values
 * @returns Object with keys as option values and boolean values indicating selection
 */
export function selectedArrayToObject<T extends string>(
  selectedValues: string[], 
  allOptions: T[]
): Record<T, boolean> {
  const result = {} as Record<T, boolean>;
  
  allOptions.forEach(option => {
    result[option as T] = selectedValues.includes(option);
  });
  
  return result;
}