import { defineStore } from 'pinia'

export interface Toast {
  id: number
  message: string
  type: 'error' | 'success'
}

let nextId = 0

// Store global (mesmo motivo de auth/theme ficarem em stores/ e não numa
// feature): erro de API pode acontecer em qualquer tela, então o toast
// precisa ser acionável de qualquer store/componente sem import circular.
export const useToastStore = defineStore('toast', {
  state: () => ({
    toasts: [] as Toast[],
  }),
  actions: {
    push(message: string, type: Toast['type'] = 'error') {
      const id = nextId++
      this.toasts.push({ id, message, type })
      setTimeout(() => this.dismiss(id), 4000)
    },
    dismiss(id: number) {
      this.toasts = this.toasts.filter((t) => t.id !== id)
    },
  },
})
