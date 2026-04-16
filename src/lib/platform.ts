import { Capacitor } from '@capacitor/core'

export const isNative = Capacitor.isNativePlatform()
export const isWeb = !isNative

export const getWebUrl = () => {
  // If we're in development, use the localhost URL
  if (import.meta.env.DEV) return 'http://localhost:5173'
  
  // In production, we assume the web version is hosted at snapmoment.app
  // You can adjust this to your actual production domain
  return 'https://snapmoment.app'
}
