import { create } from 'zustand'

export type ToastContent = string | { title: string; description?: string }

export type ToastItem = {
  id: number
  title: string
  description: string | null
}

type ToastState = {
  toasts: ToastItem[]
  show: (content: ToastContent) => void
  hide: (id: number) => void
}

export const TOAST_AUTO_HIDE_MS = 5000
let nextId = 0

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  show: (content) => {
    const id = ++nextId
    const title = typeof content === 'string' ? content : content.title
    const description = typeof content === 'string' ? null : (content.description ?? null)
    set((state) => ({
      toasts: [...state.toasts, { id, title, description }],
    }))
    setTimeout(() => get().hide(id), TOAST_AUTO_HIDE_MS)
  },
  hide: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }))
  },
}))
