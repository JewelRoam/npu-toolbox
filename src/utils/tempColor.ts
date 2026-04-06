/**
 * Temperature color classes based on Celsius value.
 * Shared across Header, HardwareInfo, and any future components.
 */
export function tempColor(temp: number): string {
  if (temp <= 0) return 'text-gray-400 dark:text-gray-500'
  if (temp < 45) return 'text-blue-500'
  if (temp < 65) return 'text-green-500'
  if (temp < 80) return 'text-amber-500'
  return 'text-red-500'
}