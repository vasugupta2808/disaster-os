import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges Tailwind class names safely.
 *
 * Why not just template-string concatenation: if two conditional classes
 * conflict (e.g. "p-2" from a default prop and "p-4" from an override),
 * plain string concatenation applies both and CSS specificity/order decides
 * the winner unpredictably. twMerge understands Tailwind's own class
 * groups and resolves the conflict deterministically - the later class
 * wins, every time. Every Shadcn component is built expecting this.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
