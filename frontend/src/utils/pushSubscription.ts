/**
 * Подписка на браузерные push-уведомления (Web Push API).
 * Требует: HTTPS (или localhost), VITE_VAPID_PUBLIC_KEY в env, зарегистрированный service worker (PWA).
 * Чтобы уведомления отображались при получении push, в SW должен быть обработчик события 'push'
 * (например при использовании Vite PWA injectManifest с кастомным sw).
 */
import { type PushSubscriptionPayload, notificationsApi } from '@/api/notifications'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined

function urlBase64ToArrayBuffer(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const output = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i++) {
    output[i] = rawData.charCodeAt(i)
  }
  return output.buffer.slice(output.byteOffset, output.byteOffset + output.byteLength) as ArrayBuffer
}

export function isPushSupported(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  )
}

export function getNotificationPermission(): NotificationPermission {
  if (typeof Notification === 'undefined') return 'denied'
  return Notification.permission
}

/** Запросить разрешение и подписаться на push, отправить подписку на бэкенд. Возвращает сообщение об успехе или ошибке. */
export async function subscribeToPush(): Promise<{ ok: boolean; message: string }> {
  if (!VAPID_PUBLIC_KEY?.trim()) {
    return { ok: false, message: 'Push not configured (missing VAPID public key)' }
  }
  if (!isPushSupported()) {
    return { ok: false, message: 'Push notifications are not supported in this browser' }
  }
  let permission = Notification.permission
  if (permission === 'default') {
    permission = await Notification.requestPermission()
  }
  if (permission !== 'granted') {
    return { ok: false, message: 'Notification permission denied' }
  }
  const reg = await navigator.serviceWorker.ready
  const existing = await reg.pushManager.getSubscription()
  if (existing) {
    try {
      await notificationsApi.pushSubscribe(subscriptionToPayload(existing))
      return { ok: true, message: 'Already subscribed' }
    } catch {
      existing.unsubscribe().catch(() => {})
    }
  }
  const key = urlBase64ToArrayBuffer(VAPID_PUBLIC_KEY)
  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: key,
  })
  try {
    await notificationsApi.pushSubscribe(subscriptionToPayload(sub))
    return { ok: true, message: 'Subscribed to push notifications' }
  } catch (e) {
    sub.unsubscribe().catch(() => {})
    const msg = e && typeof e === 'object' && 'message' in e ? String((e as Error).message) : 'Request failed'
    return { ok: false, message: msg }
  }
}

function subscriptionToPayload(sub: PushSubscription): PushSubscriptionPayload {
  const json = sub.toJSON()
  const keys = json.keys
  if (!keys?.p256dh || !keys?.auth) throw new Error('Invalid subscription keys')
  return {
    endpoint: json.endpoint!,
    keys: { p256dh: keys.p256dh, auth: keys.auth },
  }
}
