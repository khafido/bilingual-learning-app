import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function localStorageGet<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") return defaultValue
  
  try {
    const item = window.localStorage.getItem(key)
    return item ? JSON.parse(item) : defaultValue
  } catch (error) {
    console.warn(`Error reading localStorage key "${key}":`, error)
    return defaultValue
  }
}

export function localStorageSet<T>(key: string, value: T): void {
  if (typeof window === "undefined") return
  
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.warn(`Error setting localStorage key "${key}":`, error)
  }
}

export function localStorageRemove(key: string): void {
  if (typeof window === "undefined") return
  
  try {
    window.localStorage.removeItem(key)
  } catch (error) {
    console.warn(`Error removing localStorage key "${key}":`, error)
  }
}
