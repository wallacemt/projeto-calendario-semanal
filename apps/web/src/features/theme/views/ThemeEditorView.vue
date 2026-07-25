<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { Check, ImagePlus, Loader2, Sparkles, Trash2 } from 'lucide-vue-next'
import { Season } from '@aniweek/shared'
import AppShell from '../../../components/AppShell.vue'
import AwSelect from '../../../components/AwSelect.vue'
import { seasonMeta } from '../../../lib/season-meta'
import { useThemeStore } from '../../../stores/theme'
import ThemeLivePreview from '../components/ThemeLivePreview.vue'
import { useThemeEditorStore } from '../store'
import type { ThemeDto } from '../api'

const store = useThemeEditorStore()
const runtime = useThemeStore()
onMounted(() => store.fetch())

// Mesmos 4 presets + 8 swatches do mockup M7 (AnimeWeek Temas.dc.html) — só
// os campos que o editor de fato deixa o usuário mexer (ver comentário no
// Theme model do schema.prisma).
const PRESETS = [
  { id: 'nebula', name: 'Nébula', accent: '#8B5CF6', accent2: '#4F8EF7' },
  { id: 'sakura', name: 'Sakura', accent: '#EC4899', accent2: '#F472B6' },
  { id: 'oceano', name: 'Oceano', accent: '#0EA5E9', accent2: '#22D3EE' },
  { id: 'ember', name: 'Ember', accent: '#F97316', accent2: '#F59E0B' },
] as const

const SWATCHES = ['#8B5CF6', '#4F8EF7', '#EC4899', '#0EA5E9', '#22D3EE', '#F97316', '#5EEAD4', '#F43F5E']

const seasonOptions = [
  { value: '', label: 'Nenhuma (tema livre)' },
  ...Object.values(Season).map((s) => ({ value: s as string, label: `${seasonMeta[s].emoji} ${seasonMeta[s].label}` })),
]

const form = reactive({
  name: '',
  accent: PRESETS[0].accent as string,
  accent2: PRESETS[0].accent2 as string,
  season: '',
})

function pickPreset(p: (typeof PRESETS)[number]) {
  form.accent = p.accent
  form.accent2 = p.accent2
}
function pickSwatch(hex: string) {
  form.accent = hex
  form.accent2 = hex
}

const bgFile = ref<File | null>(null)
const bgPreviewUrl = ref<string | null>(null)
function onBgFileChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0] ?? null
  if (bgPreviewUrl.value) URL.revokeObjectURL(bgPreviewUrl.value)
  bgFile.value = file
  bgPreviewUrl.value = file ? URL.createObjectURL(file) : null
}

async function saveTheme() {
  if (!form.name.trim()) return
  const created = await store.create({
    name: form.name.trim(),
    accent: form.accent,
    accent2: form.accent2,
    season: form.season === '' ? undefined : (form.season as Season),
  })
  if (bgFile.value) {
    await store.uploadBgImage(created.id, bgFile.value)
    if (bgPreviewUrl.value) URL.revokeObjectURL(bgPreviewUrl.value)
    bgFile.value = null
    bgPreviewUrl.value = null
  }
  form.name = ''
  form.season = ''
}

const renamingId = ref<string | null>(null)
const renameValue = ref('')
function startRename(t: ThemeDto) {
  renamingId.value = t.id
  renameValue.value = t.name
}
async function commitRename(id: string) {
  const name = renameValue.value.trim()
  renamingId.value = null
  if (name) await store.rename(id, name)
}
</script>

<template>
  <AppShell title="Editor de Temas" subtitle="Personalize as cores da sua experiência">
    <div class="flex flex-col gap-5 overflow-hidden p-8 lg:h-[calc(100%-4rem)] lg:flex-row">
      <!-- LEFT: controls -->
      <div class="flex w-full flex-col gap-5 overflow-y-auto pr-1 lg:w-105 lg:flex-shrink-0">
        <!-- Meus temas -->
        <div class="glass rounded-[18px] p-6">
          <div class="font-display mb-1 text-[14.5px] font-bold text-white">Meus temas</div>
          <p class="mb-4 text-xs leading-relaxed text-(--ink-text-faint)">
            "Automático" segue a estação atual — se um tema estiver pinado a ela, ele entra sozinho.
          </p>

          <div class="grid grid-cols-2 gap-3">
            <button
              type="button"
              class="rounded-[14px] p-3.5 text-left transition-colors"
              :style="{
                border: `1.5px solid ${runtime.activeTheme === null ? '#5EEAD4' : 'rgba(255,255,255,0.08)'}`,
                background: runtime.activeTheme === null ? 'rgba(94,234,212,0.08)' : 'rgba(255,255,255,0.02)',
              }"
              @click="store.activate(null)"
            >
              <div class="mb-2.5 flex h-10 items-center justify-center rounded-[9px]" style="background: rgba(255,255,255,0.06)">
                <Sparkles :size="16" class="text-(--ink-text-muted)" />
              </div>
              <div class="flex items-center justify-between">
                <span class="text-[12.5px] font-semibold text-(--ink-text)">Automático</span>
                <Check v-if="runtime.activeTheme === null" :size="13" class="text-[#5EEAD4]" />
              </div>
            </button>

            <div
              v-for="t in store.themes"
              :key="t.id"
              class="group relative rounded-[14px] p-3.5"
              :style="{
                border: `1.5px solid ${runtime.activeTheme?.id === t.id ? t.accent : 'rgba(255,255,255,0.08)'}`,
                background: runtime.activeTheme?.id === t.id ? `${t.accent}1a` : 'rgba(255,255,255,0.02)',
              }"
            >
              <button
                type="button"
                class="mb-2.5 h-10 w-full rounded-[9px]"
                :style="{ background: `linear-gradient(135deg,${t.accent},${t.accent2})` }"
                @click="store.activate(t.id)"
              />
              <div class="flex items-center justify-between gap-1">
                <input
                  v-if="renamingId === t.id"
                  v-model="renameValue"
                  class="w-full bg-transparent text-[12.5px] font-semibold text-(--ink-text) outline-none"
                  autofocus
                  @blur="commitRename(t.id)"
                  @keyup.enter="commitRename(t.id)"
                />
                <span v-else class="truncate text-[12.5px] font-semibold text-(--ink-text)" @dblclick="startRename(t)">
                  {{ t.name }}
                </span>
                <div class="flex flex-shrink-0 items-center gap-1">
                  <Check v-if="runtime.activeTheme?.id === t.id" :size="12" :style="{ color: t.accent }" />
                  <button type="button" class="text-(--ink-text-faint) opacity-0 group-hover:opacity-100 hover:text-(--ink-error)" @click="store.remove(t.id)">
                    <Trash2 :size="12" />
                  </button>
                </div>
              </div>
              <div v-if="t.season" class="mt-1 text-[10.5px] text-(--ink-text-faint)">{{ seasonMeta[t.season].emoji }} {{ seasonMeta[t.season].label }}</div>
            </div>

            <div v-if="store.loading" class="col-span-2 py-4 text-center text-xs text-(--ink-text-faint)">Carregando temas...</div>
            <div v-else-if="store.themes.length === 0" class="col-span-2 py-4 text-center text-xs text-(--ink-text-faint)">
              Nenhum tema salvo ainda — crie um abaixo.
            </div>
          </div>
        </div>

        <!-- Criar novo tema -->
        <div class="glass rounded-[18px] p-6">
          <div class="font-display mb-1 text-[14.5px] font-bold text-white">Criar novo tema</div>
          <p class="mb-4 text-xs leading-relaxed text-(--ink-text-faint)">Escolha um preset ou monte sua própria combinação de cores.</p>

          <form class="flex flex-col gap-4" @submit.prevent="saveTheme">
            <input v-model="form.name" type="text" placeholder="Nome do tema" maxlength="40" class="aw-input" />

            <div class="grid grid-cols-2 gap-2.5">
              <button
                v-for="p in PRESETS"
                :key="p.id"
                type="button"
                class="rounded-[10px] p-2.5 text-left"
                :style="{ border: `1.5px solid ${form.accent === p.accent && form.accent2 === p.accent2 ? p.accent2 : 'rgba(255,255,255,0.08)'}` }"
                @click="pickPreset(p)"
              >
                <div class="mb-1.5 h-7 rounded-md" :style="{ background: `linear-gradient(135deg,${p.accent},${p.accent2})` }" />
                <span class="text-[11.5px] font-medium text-(--ink-text)">{{ p.name }}</span>
              </button>
            </div>

            <div class="flex flex-wrap gap-2">
              <button
                v-for="hex in SWATCHES"
                :key="hex"
                type="button"
                class="flex h-8 w-8 items-center justify-center rounded-[9px]"
                :style="{ background: hex, border: `2px solid ${form.accent.toLowerCase() === hex.toLowerCase() ? '#fff' : 'transparent'}` }"
                @click="pickSwatch(hex)"
              >
                <Check v-if="form.accent.toLowerCase() === hex.toLowerCase()" :size="13" class="text-white" style="filter: drop-shadow(0 1px 2px rgba(0,0,0,0.5))" />
              </button>
            </div>

            <label class="block">
              <span class="mb-1 block text-[11.5px] text-(--ink-text-faint)">Aplicar automaticamente na estação</span>
              <AwSelect v-model="form.season" :options="seasonOptions" />
            </label>

            <label class="flex cursor-pointer items-center gap-2.5 rounded-[10px] border border-dashed px-3 py-2.5 text-[12.5px] text-(--ink-text-muted)" style="border-color: rgba(255,255,255,0.15)">
              <ImagePlus :size="15" />
              {{ bgFile ? bgFile.name : 'Imagem de fundo (opcional)' }}
              <input type="file" accept="image/*" class="hidden" @change="onBgFileChange" />
            </label>
            <img v-if="bgPreviewUrl" :src="bgPreviewUrl" alt="" class="h-24 w-full rounded-[10px] object-cover" />

            <button
              type="submit"
              :disabled="store.saving || !form.name.trim()"
              class="flex h-10.5 items-center justify-center gap-2 rounded-[10px] text-[13px] font-bold text-white disabled:opacity-50"
              style="background: linear-gradient(135deg, #8b5cf6, #4f8ef7)"
            >
              <Loader2 v-if="store.saving" :size="15" class="animate-spin" />
              {{ store.saving ? 'Salvando...' : 'Salvar tema' }}
            </button>
          </form>
        </div>
      </div>

      <!-- RIGHT: live preview -->
      <ThemeLivePreview :accent="form.accent" :accent2="form.accent2" :bg-image-url="bgPreviewUrl" />
    </div>
  </AppShell>
</template>

<style scoped>
.aw-input {
  width: 100%;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.04);
  padding: 0.55rem 0.75rem;
  font-size: 13px;
  color: var(--ink-text);
  outline: none;
}
.aw-input:focus {
  border-color: rgba(139, 92, 246, 0.5);
}
</style>
