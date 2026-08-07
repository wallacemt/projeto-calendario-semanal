<script setup lang="ts">
import { computed, ref } from 'vue'
import { Season } from '@aniweek/shared'
import { Calendar, Landmark, Palette, Globe, ChevronDown } from 'lucide-vue-next'
import { env } from '../../../lib/env'
import { seasonMeta } from '../../../lib/season-meta'
import { useThemeStore } from '../../../stores/theme'
import AuthProviderButton from '../../auth/components/AuthProviderButton.vue'
import IconGoogle from '../../auth/components/icons/IconGoogle.vue'
import IconGithub from '../../auth/components/icons/IconGithub.vue'
import HankoLabel from '../components/HankoLabel.vue'
import HankoStamp from '../components/HankoStamp.vue'
import KanjiWatermark from '../components/KanjiWatermark.vue'
import SectionDivider from '../components/SectionDivider.vue'

const API_URL = env.VITE_API_URL

// theme.season já vem resolvido no boot do App.vue (fetchCurrentSeason() —
// rota pública, roda mesmo sem sessão), então a landing nunca precisa
// buscar isso sozinha.
const theme = useThemeStore()
const currentSeasonMeta = computed(() => seasonMeta[theme.season])
const currentYear = new Date().getFullYear()

// Pétala cai bem em qualquer estação (sakura), mas o símbolo muda —
// reaproveita o mesmo dado que já dirige o resto do tema sazonal.
const PARTICLE_EMOJI: Record<Season, string> = {
  [Season.WINTER]: '❄️',
  [Season.SPRING]: '🌸',
  [Season.SUMMER]: '✨',
  [Season.FALL]: '🍂',
}
const particleEmoji = computed(() => PARTICLE_EMOJI[theme.season])

// Trilha de temporadas do hero — não vem do mockup original, é uma
// diferenciação própria: em vez de decoração genérica, mostra a própria
// mecânica central do produto (um calendário por temporada) como peça
// visual, reaproveitando o mesmo seasonMeta que já dirige o resto do app.
const SEASON_ORDER = [Season.WINTER, Season.SPRING, Season.SUMMER, Season.FALL] as const
const seasonRail = computed(() =>
  SEASON_ORDER.map((s) => ({ season: s, ...seasonMeta[s], current: s === theme.season })),
)

// Glow radial sutil por seção, na paleta da estação atual — mesma receita do
// starfield do AuthHeroPanel, sem os pontos de estrela (aqui é só cor).
function sectionGlow(posA: string, posB: string) {
  return {
    backgroundImage: `radial-gradient(circle at ${posA}, color-mix(in srgb, var(--season-accent-1) 13%, transparent), transparent 45%), radial-gradient(circle at ${posB}, color-mix(in srgb, var(--season-accent-2) 11%, transparent), transparent 45%)`,
  }
}

function loginWithProvider(provider: 'google' | 'github') {
  window.location.href = `${API_URL}/auth/oauth/${provider}`
}

const FEATURES = [
  {
    icon: Calendar,
    title: 'Calendário por temporada',
    desc: 'Board seg→dom + backlog. Um calendário novo pra cada estação, sem perder o que já assistiu.',
  },
  {
    icon: Landmark,
    title: 'Museu & Estatísticas',
    desc: 'Toda vez que termina um anime, ele entra na sua vitrine — com nota, comentário e métricas.',
  },
  {
    icon: Palette,
    title: 'Temas personalizáveis',
    desc: 'Cores e background por estação. Winter, Spring, Summer, Fall — ou o seu próprio.',
  },
  {
    icon: Globe,
    title: 'Social & Compartilhamento',
    desc: 'Compartilhe seu calendário view-only, siga outros fãs e reaja ao que estão assistindo.',
  },
]

const STEPS = [
  { num: '01', title: 'Escolha a temporada', desc: 'Winter, Spring, Summer ou Fall — crie o calendário do ano.' },
  { num: '02', title: 'Monte seu board', desc: 'Adicione animes em cada dia da semana, ou no backlog.' },
  { num: '03', title: 'Arraste e acompanhe', desc: 'Drag-and-drop entre dias, progresso de episódio em tempo real.' },
  { num: '04', title: 'Guarde no museu', desc: 'Terminou? Vai pra vitrine com nota, comentário e estatísticas.' },
]

const CONS = [
  'Sem lembrete de episódio novo',
  'Progresso desatualiza fácil',
  'Zero histórico visual por temporada',
  'Não dá pra arrastar entre dias',
]
const PROS = [
  'Board por dia da semana, sempre atual',
  'Progresso de episódio com 1 clique',
  'Museu com posters, nota e comentário',
  'Drag-and-drop nativo entre dias',
]

const FAQS = [
  {
    id: 'f1',
    question: 'O AnimeWeek é gratuito?',
    answer:
      'Sim. Criar conta, montar calendário e usar o museu é grátis. Login social via Google e GitHub também.',
  },
  {
    id: 'f2',
    question: 'De onde vêm os dados dos animes?',
    answer:
      'Buscamos e cacheamos direto da base do MyAnimeList (via Jikan), então título, poster e sinopse ficam sempre atualizados.',
  },
  {
    id: 'f3',
    question: 'Posso continuar um anime na temporada seguinte?',
    answer:
      'Sim — ao criar o calendário da nova estação, você importa os animes ainda em andamento da temporada anterior com o progresso preservado.',
  },
  {
    id: 'f4',
    question: 'Meus dados ficam salvos se eu trocar de dispositivo?',
    answer:
      'Sim, sua conta guarda tudo no servidor — calendário, progresso, museu e temas acompanham você em qualquer aparelho.',
  },
  {
    id: 'f5',
    question: 'Outras pessoas podem ver meu calendário?',
    answer: 'Só se você compartilhar. O link é view-only e pode ser revogado a qualquer momento.',
  },
  {
    id: 'f6',
    question: 'Preciso instalar algum aplicativo?',
    answer: 'Não — o AnimeWeek funciona direto no navegador, com layout responsivo para celular.',
  },
]

const PETALS = [
  { left: '6%', size: 16, dur: '9s', delay: '0s', drift: '30px' },
  { left: '18%', size: 12, dur: '11s', delay: '2s', drift: '-20px' },
  { left: '32%', size: 18, dur: '8s', delay: '4s', drift: '40px' },
  { left: '47%', size: 13, dur: '10s', delay: '1s', drift: '-30px' },
  { left: '61%', size: 20, dur: '12s', delay: '3s', drift: '25px' },
  { left: '74%', size: 14, dur: '9.5s', delay: '5s', drift: '-15px' },
  { left: '85%', size: 17, dur: '10.5s', delay: '1.5s', drift: '35px' },
  { left: '93%', size: 12, dur: '8.5s', delay: '3.5s', drift: '-25px' },
]

// ponytail: transform/opacity só, sem filter:blur() no reveal — blur força
// repaint pesado em listas longas (aqui é só 1 página, mas mantém o hábito).
const REVEAL_HIDDEN = { opacity: 0, y: 32 }
const revealShown = (delay = 0) => ({ opacity: 1, y: 0, transition: { duration: 600, delay } })

const openFaq = ref<string | null>('f1')
function toggleFaq(id: string) {
  openFaq.value = openFaq.value === id ? null : id
}
</script>

<template>
  <div class="min-h-screen bg-(--ink-bg) text-(--ink-text)" >

    <!-- NAV -->
    <header
      class="glass sticky top-2 z-20 flex h-19 items-center justify-between px-6 md:px-12   rounded-2xl mx-auto">
      <div class="flex items-center gap-2.5  ">
        <img src="/android-chrome-192x192.png" class="h-7 w-7 object-contain" alt="" />
        <span class="font-display text-[17px] font-extrabold text-white">AnimeWeek</span>
      </div>
      <nav class="hidden items-center gap-9 text-[13.5px] text-(--ink-text-muted) md:flex">
        <a href="#features" class="hover:text-(--ink-text)">Recursos</a>
        <a href="#how" class="hover:text-(--ink-text)">Como funciona</a>
        <a href="#faq" class="hover:text-(--ink-text)">FAQ</a>
      </nav>
      <div class="flex items-center gap-3">
        <RouterLink :to="{ name: 'login' }" class="text-[13px] text-(--ink-text-muted) hover:text-(--ink-text)">
          Entrar
        </RouterLink>
        <RouterLink :to="{ name: 'register' }"
          class="rounded-md px-4.5 py-2.5 text-[13px] font-bold text-white transition hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(139,92,246,0.4)]"
          style="background: linear-gradient(135deg, var(--brand-primary), var(--brand-secondary))">
          Criar conta
        </RouterLink>
      </div>
    </header>
    <!-- HERO — imagem no background da seção (não em card), com overlay de
           gradiente pro texto continuar legível (mesma receita do body em
           style.css: gradiente escuro por cima da imagem). -->
    <section class="relative flex items-center overflow-hidden px-6 py-24 md:px-12 md:py-8 *:min-h-[calc(100vh-136px)]"
      style="
          background-image:
            linear-gradient(115deg, rgba(5, 6, 11, 0.94) 0%, rgba(5, 6, 11, 0.72) 42%, rgba(5, 6, 11, 0.45) 100%),
            url('/hero2.png');
          background-size: cover;
          background-position: center;
        ">
      <KanjiWatermark char="週刊" vertical :size="120" :opacity="0.16" class="top-6 right-8 z-0 hidden lg:block" />
      <div class="landing-petals pointer-events-none absolute inset-0 overflow-hidden">
        <span v-for="(p, i) in PETALS" :key="i" class="landing-petal"
          :style="{ left: p.left, fontSize: `${p.size}px`, animationDuration: p.dur, animationDelay: p.delay, '--drift': p.drift }">{{
            particleEmoji }}</span>
      </div>
      <div v-motion class="relative z-10 max-w-xl" :initial="{ opacity: 0, y: 20 }"
        :enter="{ opacity: 1, y: 0, transition: { duration: 700 } }">
        <div class="mb-6 flex items-center gap-2.5">
          <HankoStamp char="新" size="md" />
          <div
            class="glass inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[12.5px] text-(--ink-text-muted)">
            {{ currentSeasonMeta.emoji }} Temporada {{ currentSeasonMeta.label }} {{ currentYear }} já disponível
          </div>
        </div>
        <h1
          class="font-display mb-2.5 text-[38px] leading-[1.15] font-extrabold text-wrap-pretty text-white md:text-[3rem]">
          Seu backlog de anime,<br />organizado por temporada.
        </h1>
        <p class="mb-4 text-[15.5px]" style="font-family: serif; font-style: italic; color: #b9a8e8">
          四季を通して、あなたの物語 — cada estação, sua própria maratona.
        </p>
        <p class="mb-6 text-[16px] leading-[1.7] text-(--ink-text-muted)">
          Monte seu board seg→dom, arraste episódios entre dias, acompanhe progresso e guarde tudo num museu quando
          terminar. Chega de planilha e print de lista.
        </p>
        <div class="mb-3 flex flex-col gap-3 sm:flex-row">
          <AuthProviderButton label="Continuar com Google" @click="loginWithProvider('google')">
            <template #icon>
              <IconGoogle />
            </template>
          </AuthProviderButton>
          <AuthProviderButton label="Continuar com GitHub" @click="loginWithProvider('github')">
            <template #icon>
              <IconGithub />
            </template>
          </AuthProviderButton>
        </div>
        <p class="text-[12.5px] text-(--ink-text-faint)">
          ou
          <RouterLink :to="{ name: 'register' }" class="text-(--brand-primary) hover:text-(--brand-secondary)">
            crie uma conta com e-mail
          </RouterLink>
          — grátis
        </p>
      </div>
      <!-- Trilha de temporadas: não é decoração emprestada, é a própria mecânica
             do produto (1 calendário por estação) virando peça visual do hero. -->
      <div
        class="absolute top-1/2 right-10 z-10 hidden -translate-y-1/2 flex-col items-end justify-center gap-5 xl:flex">
        <div v-for="s in seasonRail" :key="s.season" class="flex items-center gap-3">
          <div class="flex flex-col items-end" :class="s.current ? 'opacity-100' : 'opacity-40'">
            <span class="text-[11px] font-bold text-(--ink-text)">{{ s.label }}</span>
            <span class="font-mono text-[9.5px] text-(--ink-text-faint)">{{ s.range }}</span>
          </div>
          <div class="flex h-8 w-8 items-center justify-center rounded-full border text-[13px] transition-all" :style="s.current
            ? 'border-color: var(--brand-primary); background: color-mix(in srgb, var(--brand-primary) 25%, transparent); box-shadow: 0 0 16px color-mix(in srgb, var(--brand-primary) 55%, transparent)'
            : 'border-color: rgba(255,255,255,0.12); background: rgba(255,255,255,0.03)'
            ">
            {{ s.emoji }}
          </div>
        </div>
      </div>
    </section>

    <SectionDivider />

    <!-- FEATURES -->
    <section id="features" class="relative overflow-hidden px-6 py-20 md:px-12 md:py-24"
      :style="sectionGlow('8% 15%', '95% 85%')">
      <KanjiWatermark char="特徴" :size="220" class="right-0 -bottom-12 hidden lg:block" />

      <div v-motion class="relative mx-auto mb-12 max-w-xl text-center" :initial="REVEAL_HIDDEN"
        :visibleOnce="revealShown()">
        <HankoLabel char="録" label="RECURSOS" />
        <h2 class="font-display mt-3 text-[28px] font-extrabold text-wrap-pretty text-white md:text-[30px]">
          Tudo que uma temporada de anime precisa
        </h2>
      </div>
      <div class="mx-auto grid max-w-5xl grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div v-for="(f, i) in FEATURES" :key="f.title" v-motion
          class="glass rounded-2xl p-6 transition hover:-translate-y-2 hover:border-(--brand-secondary)/45"
          :initial="REVEAL_HIDDEN" :visibleOnce="revealShown(i * 90)">
          <div class="mb-4 flex h-11 w-11 items-center justify-center rounded-xl"
            style="background: color-mix(in srgb, var(--brand-primary) 18%, transparent)">
            <component :is="f.icon" class="h-5 w-5 text-(--brand-secondary)" />
          </div>
          <div class="font-display mb-2 text-[15.5px] font-bold text-(--ink-text)">{{ f.title }}</div>
          <div class="text-[12.5px] leading-[1.6] text-(--ink-text-faint)">{{ f.desc }}</div>
        </div>
      </div>
    </section>

    <SectionDivider />

    <!-- HOW IT WORKS -->
    <section id="how" class="relative px-6 py-20 md:px-12 md:py-24" :style="sectionGlow('92% 10%', '5% 90%')">
      <div v-motion class="mx-auto mb-14 max-w-xl text-center" :initial="REVEAL_HIDDEN" :visibleOnce="revealShown()">
        <HankoLabel char="順" label="COMO FUNCIONA" />
        <h2 class="font-display mt-3 text-[28px] font-extrabold text-wrap-pretty text-white md:text-[30px]">
          Do primeiro episódio ao museu
        </h2>
      </div>
      <div class="relative mx-auto grid max-w-4xl grid-cols-2 gap-6 lg:grid-cols-4">
        <div v-for="(s, i) in STEPS" :key="s.num" v-motion class="flex flex-col gap-3" :initial="REVEAL_HIDDEN"
          :visibleOnce="revealShown(i * 90)">
          <div
            class="flex h-8 w-8 items-center justify-center rounded-full border-2 text-[13px] font-extrabold text-(--brand-secondary)"
            style="background: var(--ink-bg); border-color: color-mix(in srgb, var(--brand-primary) 50%, transparent)">
            {{ s.num }}
          </div>
          <div class="text-[14.5px] font-bold text-(--ink-text)">{{ s.title }}</div>
          <div class="text-[12.5px] leading-[1.6] text-(--ink-text-faint)">{{ s.desc }}</div>
        </div>
      </div>
    </section>

    <SectionDivider />

    <!-- COMPARISON -->
    <section class="relative px-6 py-20 md:px-12 md:py-24" :style="sectionGlow('15% 85%', '90% 20%')">
      <div v-motion class="mx-auto mb-14 max-w-xl text-center" :initial="REVEAL_HIDDEN" :visibleOnce="revealShown()">
        <HankoLabel char="較" label="POR QUE NÃO SÓ UMA PLANILHA" />
        <h2 class="font-display mt-3 text-[28px] font-extrabold text-wrap-pretty text-white md:text-[30px]">
          Sua lista merece mais que uma célula
        </h2>
      </div>
      <div class="mx-auto flex max-w-3xl flex-col gap-5 sm:flex-row">
        <div v-motion class="glass flex-1 rounded-2xl p-6" :initial="{ opacity: 0, x: -28 }"
          :visibleOnce="{ opacity: 1, x: 0, transition: { duration: 600 } }">
          <div class="mb-4 text-[13px] font-bold text-(--ink-text-faint)">📋 Planilha / lista manual</div>
          <div v-for="c in CONS" :key="c" class="flex gap-2.5 py-2 text-[13px] text-(--ink-text-muted)">
            <span class="text-(--ink-error)">✕</span>{{ c }}
          </div>
        </div>
        <div v-motion class="glass flex-1 rounded-2xl p-6"
          style="border-color: color-mix(in srgb, var(--brand-primary) 30%, transparent)"
          :initial="{ opacity: 0, x: 28 }" :visibleOnce="{ opacity: 1, x: 0, transition: { duration: 600 } }">
          <div class="mb-4 text-[13px] font-bold text-(--brand-secondary)">🌐 AnimeWeek</div>
          <div v-for="p in PROS" :key="p" class="flex gap-2.5 py-2 text-[13px] text-(--ink-text)">
            <span class="text-(--color-success)">✓</span>{{ p }}
          </div>
        </div>
      </div>
    </section>

    <SectionDivider />

    <!-- FAQ -->
    <section id="faq" class="relative px-6 py-20 md:px-12 md:py-24" :style="sectionGlow('10% 20%', '88% 80%')">
      <div v-motion class="mx-auto mb-12 max-w-xl text-center" :initial="REVEAL_HIDDEN" :visibleOnce="revealShown()">
        <HankoLabel char="問" label="FAQ" />
        <h2 class="font-display mt-3 text-[28px] font-extrabold text-wrap-pretty text-white md:text-[30px]">
          Perguntas frequentes
        </h2>
      </div>
      <div class="mx-auto flex max-w-2xl flex-col gap-2.5">
        <div v-for="q in FAQS" :key="q.id"
          class="glass overflow-hidden rounded-xl transition hover:border-(--brand-secondary)/35">
          <button type="button"
            class="flex w-full items-center justify-between px-5 py-4.5 text-left transition hover:bg-white/3"
            @click="toggleFaq(q.id)">
            <span class="text-[14px] font-semibold text-(--ink-text)">{{ q.question }}</span>
            <ChevronDown class="h-4 w-4 shrink-0 text-(--ink-text-faint) transition-transform duration-250"
              :class="{ 'rotate-180': openFaq === q.id }" />
          </button>
          <div class="grid transition-[grid-template-rows] duration-300"
            :style="{ gridTemplateRows: openFaq === q.id ? '1fr' : '0fr' }">
            <!-- O padding tem que ficar neste wrapper interno, não no item de
                 grid que colapsa: padding não encolhe com grid-template-rows
                 0fr (só o miolo de conteúdo encolhe), então deixá-lo no
                 próprio item de grid sempre sobra como um resíduo visível
                 mesmo fechado — min-h-0 sozinho não resolve isso. -->
            <div class="min-h-0 overflow-hidden">
              <p class="px-5 pb-4.5 text-[13px] leading-[1.7] text-(--ink-text-muted)">
                {{ q.answer }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <SectionDivider />

    <!-- FINAL CTA -->
    <section class="px-6 pt-34 pb-20 md:px-12" style="
          background-image:
            linear-gradient(115deg, rgba(5, 6, 11, 0.92) 5%, rgba(5, 6, 11, 0.55) 55%, rgba(5, 6, 11, 0.3) 100%),
            url('/cta_hero_image.png');
          background-size: cover;
          background-position: center;
          border-color: color-mix(in srgb, var(--brand-primary) 35%, transparent);
        " :initial="{ opacity: 0, scale: 0.94 }"
      :visibleOnce="{ opacity: 1, scale: 1, transition: { duration: 600 } }">
      <div v-motion
        class="relative mx-auto flex max-w-4xl flex-col items-center gap-7 overflow-hidden rounded-3xl  p-10 text-center sm:flex-row sm:justify-between sm:p-14 sm:text-left">
        <!-- 続く = "continua" — a placa de fim de episódio antes do próximo,
             literal demais pra não usar aqui. -->
        <KanjiWatermark char="続く" vertical :size="72" :opacity="0.12"
          class="top-0 left-1/2 -translate-x-1/2 hidden sm:block" />

        <div class="relative z-10">
          <div
            class="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/25 px-3 py-1 text-[11.5px] text-(--ink-text-muted)">
            {{ currentSeasonMeta.emoji }} Temporada {{ currentSeasonMeta.label }} já rolando
          </div>
          <h3 class="font-display mb-2 max-w-md text-[26px] leading-tight font-extrabold text-wrap-pretty text-white">
            Pare de esquecer episódio. Comece a maratonar com organização.
          </h3>
          <p class="max-w-sm text-[14px] text-(--ink-text-muted)">
            Um minuto pra montar seu primeiro calendário. Grátis pra sempre no essencial, sem cartão de crédito.
          </p>
          <div class="relative mt-4 z-10 flex  shrink-0 gap-3">
            <AuthProviderButton label="Google" @click="loginWithProvider('google')">
              <template #icon>
                <IconGoogle />
              </template>
            </AuthProviderButton>
            <AuthProviderButton label="GitHub" @click="loginWithProvider('github')">
              <template #icon>
                <IconGithub />
              </template>
            </AuthProviderButton>
          </div>
        </div>
      </div>
    </section>

    <!-- FOOTER -->
    <footer class="relative overflow-hidden border-t border-white/6 px-6 py-11 md:px-12">
      <KanjiWatermark char="終" :size="130" class="top-0 right-6 hidden md:block" />

      <div class="relative mx-auto flex max-w-5xl flex-col gap-10 sm:flex-row sm:justify-between">
        <div class="max-w-[280px]">
          <div class="mb-3 flex items-center gap-2">
            <img src="/android-chrome-192x192.png" class="h-6 w-6 object-contain" alt="" />
            <span class="font-display text-[15px] font-extrabold text-white">AnimeWeek</span>
          </div>
          <p class="text-[12px] leading-[1.6] text-(--ink-text-faint)">
            Organize seus animes por temporada, dia da semana e progresso.
          </p>
        </div>
        <div class="flex gap-12">
          <div class="flex flex-col gap-2.5">
            <span class="mb-1 text-[11.5px] font-bold text-(--ink-text-faint)">PRODUTO</span>
            <a href="#features" class="text-[12.5px] text-(--ink-text-muted) hover:text-(--ink-text)">Recursos</a>
            <a href="#how" class="text-[12.5px] text-(--ink-text-muted) hover:text-(--ink-text)">Como funciona</a>
            <a href="#faq" class="text-[12.5px] text-(--ink-text-muted) hover:text-(--ink-text)">FAQ</a>
          </div>
          <div class="flex flex-col gap-2.5">
            <span class="mb-1 text-[11.5px] font-bold text-(--ink-text-faint)">LEGAL</span>
            <RouterLink :to="{ name: 'privacy', hash: '#privacidade' }"
              class="text-[12.5px] text-(--ink-text-muted) hover:text-(--ink-text)">
              Privacidade
            </RouterLink>
            <RouterLink :to="{ name: 'privacy', hash: '#termos' }"
              class="text-[12.5px] text-(--ink-text-muted) hover:text-(--ink-text)">
              Termos de uso
            </RouterLink>
          </div>
        </div>
      </div>
      <div class="relative mt-10 flex items-center justify-center gap-2 text-[11.5px] text-(--ink-text-faint)">
        <HankoStamp char="完" />
        © 2026 AnimeWeek. Feito por um dev.
      </div>
    </footer>
  </div>
</template>

<style scoped>
/* Decorativo, só desta página — pétalas caindo no hero. Reveal-on-scroll de
   verdade (v-motion :visibleOnce acima) roda em JS via IntersectionObserver,
   não em CSS: animation-timeline:view() (o approach do mock original) ainda
   não tem suporte no Firefox/Safari. */
.landing-petal {
  position: absolute;
  top: -30px;
  user-select: none;
  filter: drop-shadow(0 2px 3px rgba(0, 0, 0, 0.2));
  animation-name: aw-petal-fall;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
}

@keyframes aw-petal-fall {
  0% {
    transform: translate(0, -30px) rotate(0deg);
    opacity: 0;
  }

  10% {
    opacity: 0.85;
  }

  85% {
    opacity: 0.75;
  }

  100% {
    transform: translate(var(--drift, 40px), 620px) rotate(300deg);
    opacity: 0;
  }
}
</style>
