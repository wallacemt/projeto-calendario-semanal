import { ref, watch, type Ref } from 'vue'

// Debounce genérico de um ref — usado pela busca de "Descobrir" (M3, RF-03)
// pra não disparar 1 request por tecla. @vueuse/core não está instalado;
// setTimeout/clearTimeout resolve em poucas linhas, sem dependência nova.
export function useDebounce<T>(source: Ref<T>, delayMs = 400): Ref<T> {
  const debounced = ref(source.value) as Ref<T>
  let timer: ReturnType<typeof setTimeout>

  watch(source, (value) => {
    clearTimeout(timer)
    timer = setTimeout(() => {
      debounced.value = value
    }, delayMs)
  })

  return debounced
}
