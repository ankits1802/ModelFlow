import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Basic nanoid-like function if actual package isn't installed/preferred
// For production, `npm install nanoid` is recommended.
export const nanoid = (size = 21) => {
  let id = "";
  const bytes = crypto.getRandomValues(new Uint8Array(size));
  while (size--) {
    const byte = bytes[size] & 61; // 61 is the largest index for the alphabet
    if (byte < 36) {
      // `0-9a-z`
      id += byte.toString(36);
    } else if (byte < 62) {
      // `A-Z`
      id += (byte - 26).toString(36).toUpperCase();
    } else {
      // `_` or `-` (or other symbols if alphabet changes)
      // to stay within URL-safe characters, often '-' is used
      id += '-'; 
    }
  }
  return id;
};
