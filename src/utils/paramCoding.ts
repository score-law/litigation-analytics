// Utility functions for base64 encoding/decoding selections
import { Selection } from '@/types';

/**
 * Encodes selections array to a URL-safe base64 string.
 * @param selections - Array of Selection objects.
 * @returns URL-safe base64 string.
 */
export function encodeSelectionsToBase64(selections: Array<Selection | null>): string {
    const minimalSelections = selections
      .filter(selection => selection?.type && selection?.value)
      .map(selection => ({
        type: selection!.type,
        value: {
          id: selection!.value.id,
          name: selection!.value.name,
        },
      }));
    const json = JSON.stringify(minimalSelections);
    const utf8 = new TextEncoder().encode(json);
    let b64 = typeof window !== 'undefined'
      ? window.btoa(String.fromCharCode(...utf8))
      : Buffer.from(utf8).toString('base64');
    b64 = b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    return b64;
  }
  
  /**
   * Decodes a URL-safe base64 string to a selections array.
   * @param encoded - URL-safe base64 string.
   * @returns Array of Selection objects or [null, null] on error.
   */
  export function decodeSelectionsFromBase64(encoded: string): Array<Selection | null> {
    try {
      let b64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
      while (b64.length % 4) b64 += '=';
      const bin = typeof window !== 'undefined'
        ? window.atob(b64)
        : Buffer.from(b64, 'base64').toString('binary');
      const bytes = Uint8Array.from(bin, c => c.charCodeAt(0));
      const json = new TextDecoder().decode(bytes);
      const arr = JSON.parse(json);
      if (!Array.isArray(arr)) return [null, null];
      return arr.slice(0, 2).map(sel =>
        sel && sel.type && sel.value && typeof sel.value.id !== 'undefined'
          ? sel
          : null
      );
    } catch {
      return [null, null];
    }
  }