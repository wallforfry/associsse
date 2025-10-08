import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const nonNullable = <T>(value: T): value is NonNullable<T> =>
  value !== null && value !== undefined
