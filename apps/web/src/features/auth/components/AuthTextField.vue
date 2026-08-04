<script setup lang="ts">
defineProps<{
  id: string
  label: string
  type?: string
  placeholder?: string
  autocomplete?: string
  required?: boolean
}>()

const model = defineModel<string>({ required: true })
</script>

<template>
  <div>
    <div class="mb-1.5 flex items-center justify-between">
      <label :for="id" class="text-[12.5px] text-[#b4b8c6]">{{ label }}</label>
      <slot name="label-action" />
    </div>
    <div class="relative">
      <input :id="id" v-model="model" :type="type ?? 'text'" :placeholder="placeholder" :autocomplete="autocomplete"
        :required="required"
        class="font-sans h-11.5 w-full rounded-md border border-white/10 bg-white/4 px-3.5 text-sm text-[#f5f6fa] placeholder:text-white/30 focus:border-transparent focus:ring-2 focus:ring-[var(--brand-primary)] focus:outline-none" />
      <div v-if="$slots.trailing" class="absolute inset-y-0 right-3 flex items-center">
        <slot name="trailing" />
      </div>

    </div>
  </div>
</template>
