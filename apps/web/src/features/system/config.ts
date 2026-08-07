import type { RouteLocationRaw } from 'vue-router'

export interface SystemStateAction {
  label: string
  to?: RouteLocationRaw
  /** Ação sem navegação — hoje só 'reload'. */
  action?: 'reload'
}

export interface SystemStateConfig {
  tag: string
  code: string
  /** Hex — usado tanto na cor do código quanto (via color-mix) no glow de fundo. */
  accent: string
  image: string
  title: string
  desc: string
  primary: SystemStateAction
  secondary?: SystemStateAction
}

// ponytail: sem link de "status da plataforma" — não existe status page ainda,
// um link morto seria pior que não ter secondary. Adiciona quando existir.
export const SYSTEM_STATES = {
  notFound: {
    tag: 'Parece que alguem se perdeu',
    code: '404',
    accent: '#A78BFA',
    image: '/system/404.png',
    title: 'Esse episódio não existe.',
    desc: 'A página que você procura saiu do ar — ou nunca foi ao ar. Bora voltar pro seu calendário.',
    primary: { label: 'Voltar ao início', to: { name: 'home' } },
  },
  serverError: {
    tag: 'Alguem esqueceu um ponto e vírgula denovo!',
    code: '500',
    accent: '#FBBF24',
    image: '/system/500.png',
    title: 'Deu tela azul aqui.',
    desc: 'Algo quebrou do nosso lado. Já fomos avisados e estamos resolvendo — tenta de novo em um minuto.',
    primary: { label: 'Tentar de novo', action: 'reload' },
  },
  forbidden: {
    tag: 'Calma meu chefe!',
    code: '403',
    accent: '#F87171',
    image: '/system/403.png',
    title: 'Essa área é só para convidados.',
    desc: 'Você não tem permissão para ver este calendário ou conteúdo. Peça acesso a quem compartilhou o link.',
    primary: { label: 'Voltar ao início', to: { name: 'home' } },
  },
  maintenance: {
    tag: 'Tá todo mundo de férias, menos o app.',
    code: '🛠️',
    accent: '#5EEAD4',
    image: '/system/maintance.png',
    title: 'Voltamos já da pausa pra estúdio.',
    desc: 'Estamos fazendo uma manutenção rápida para melhorar o app. Previsão de volta: poucos minutos.',
    primary: { label: 'Atualizar página', action: 'reload' },
  },
  sessionExpired: {
    tag: 'Ops, acho que você dormiu no teclado.',
    code: '⏳',
    accent: '#C4B5FD',
    image: '/system/session_expired.png',
    title: 'Sua sessão tirou uma soneca.',
    desc: 'Por segurança, você foi desconectado após um tempo de inatividade. Entre novamente para continuar.',
    primary: { label: 'Entrar novamente', to: { name: 'login' } },
    secondary: { label: 'Ir para a home', to: { name: 'home' } },
  },
} as const satisfies Record<string, SystemStateConfig>
