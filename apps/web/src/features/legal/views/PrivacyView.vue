<script setup lang="ts">
const SECTIONS = [
  { href: '#privacidade', label: 'Política de Privacidade' },
  { href: '#dados-coletados', label: 'Dados coletados' },
  { href: '#uso-dados', label: 'Como usamos os dados' },
  { href: '#base-legal', label: 'Base legal' },
  { href: '#compartilhamento', label: 'Compartilhamento' },
  { href: '#seus-direitos', label: 'Seus direitos' },
  { href: '#retencao', label: 'Retenção e exclusão' },
  { href: '#termos', label: 'Termos de Uso' },
  { href: '#conta', label: 'Sua conta' },
  { href: '#uso-aceitavel', label: 'Uso aceitável' },
  { href: '#disponibilidade', label: 'Disponibilidade' },
  { href: '#contato', label: 'Contato' },
]

const DATA_ITEMS = [
  { icon: '👤', title: 'Dados de cadastro', desc: 'Nome, e-mail e foto de perfil (via conta própria, Google ou GitHub).' },
  { icon: '📺', title: 'Dados de uso', desc: 'Calendário montado, progresso de episódios, avaliações e comentários no museu.' },
  { icon: '⚙️', title: 'Preferências', desc: 'Tema escolhido, notificações ativadas, idioma da interface.' },
  { icon: '📊', title: 'Dados técnicos', desc: 'Endereço IP, tipo de dispositivo e logs de acesso, para segurança e diagnóstico.' },
]

const RIGHTS = [
  'Confirmar a existência de tratamento',
  'Acessar seus dados',
  'Corrigir dados incompletos ou desatualizados',
  'Solicitar anonimização ou exclusão',
  'Portabilidade dos dados',
  'Revogar consentimento a qualquer momento',
]
</script>

<template>
  <div class="min-h-screen bg-(--ink-bg) text-(--ink-text)">
    <header class="flex h-[76px] items-center justify-between border-b border-white/6 px-6 md:px-12">
      <div class="flex items-center gap-2.5">
        <img src="/android-chrome-192x192.png" class="h-7 w-7 object-contain" alt="" />
        <span class="font-display text-[17px] font-extrabold text-white">AnimeWeek</span>
      </div>
      <RouterLink :to="{ name: 'home' }" class="text-[13.5px] text-(--ink-text-muted) hover:text-(--ink-text)">
        ← Voltar para o início
      </RouterLink>
    </header>

    <div class="px-6 pt-4 pb-8 md:px-12">

      <h1 class="font-display mb-2.5 text-[32px] font-extrabold text-white md:text-[38px]">
        Privacidade &amp; Termos de Uso
      </h1>
      <p class="max-w-xl text-[15px] leading-[1.7] text-(--ink-text-muted)">
        Última atualização: 5 de agosto de 2026. Este documento explica como o AnimeWeek coleta, usa e protege seus
        dados, e as regras de uso do serviço.
      </p>
    </div>

    <div class="flex flex-col gap-10 px-6 pb-20 md:flex-row md:px-12">
      <nav class="flex shrink-0 flex-col gap-1 md:sticky md:top-6 md:w-56 md:self-start">
        <span class="mb-1.5 text-[11px] font-bold tracking-[0.06em] text-(--ink-text-faint)">NESTA PÁGINA</span>
        <a v-for="s in SECTIONS" :key="s.href" :href="s.href"
          class="rounded-lg px-2.5 py-1.5 text-[13px] text-(--ink-text-muted) transition hover:bg-(--brand-primary)/10 hover:text-(--ink-text)">
          {{ s.label }}
        </a>
      </nav>

      <div class="flex max-w-2xl flex-col gap-9">
        <section id="privacidade" class="flex flex-col gap-3.5">
          <h2 class="font-display flex items-center gap-2.5 text-[22px] font-extrabold text-white">
            <span class="h-1.5 w-1.5 rounded-full bg-(--brand-primary)" />
            1. Política de Privacidade
          </h2>
          <p class="text-[14.5px] leading-[1.8] text-(--ink-text-muted)">
            O AnimeWeek ("nós") respeita sua privacidade e trata seus dados pessoais em conformidade com a Lei Geral
            de Proteção de Dados (Lei nº 13.709/2018 — LGPD). Ao usar o serviço, você concorda com as práticas
            descritas abaixo.
          </p>
        </section>

        <section id="dados-coletados" class="flex flex-col gap-3">
          <h3 class="text-[17px] font-bold text-(--ink-text)">1.1 Quais dados coletamos</h3>
          <div v-for="d in DATA_ITEMS" :key="d.title"
            class="flex gap-3 rounded-xl border border-white/6 bg-white/3 p-3.5">
            <span class="shrink-0 text-base">{{ d.icon }}</span>
            <div>
              <div class="mb-0.5 text-[13.5px] font-bold text-(--ink-text)">{{ d.title }}</div>
              <div class="text-[13px] leading-[1.6] text-(--ink-text-muted)">{{ d.desc }}</div>
            </div>
          </div>
        </section>

        <section id="uso-dados" class="flex flex-col gap-3">
          <h3 class="text-[17px] font-bold text-(--ink-text)">1.2 Como usamos seus dados</h3>
          <ul class="flex flex-col gap-2 pl-5 text-[14px] leading-[1.7] text-(--ink-text-muted)">
            <li class="list-disc">Autenticação e manutenção da sua conta (login via e-mail, Google ou GitHub);</li>
            <li class="list-disc">Sincronização do seu calendário, progresso, museu e temas entre dispositivos;</li>
            <li class="list-disc">Envio de notificações sobre episódios novos, quando ativadas por você;</li>
            <li class="list-disc">Melhorias no produto a partir de métricas de uso agregadas e anonimizadas;</li>
            <li class="list-disc">Cumprimento de obrigações legais ou requisições de autoridades competentes.</li>
          </ul>
          <p class="text-[13.5px] leading-[1.7] text-(--ink-text-faint)">
            Nunca vendemos seus dados pessoais a terceiros. Não usamos seus dados para publicidade de terceiros.
          </p>
        </section>

        <section id="base-legal" class="flex flex-col gap-3">
          <h3 class="text-[17px] font-bold text-(--ink-text)">1.3 Base legal para o tratamento</h3>
          <p class="text-[14px] leading-[1.8] text-(--ink-text-muted)">
            Tratamos seus dados com base na execução do contrato de uso do serviço (art. 7º, V da LGPD), no seu
            consentimento explícito para funcionalidades opcionais como notificações (art. 7º, I), e no legítimo
            interesse para prevenção de fraude e segurança da plataforma (art. 7º, IX).
          </p>
        </section>

        <section id="compartilhamento" class="flex flex-col gap-3">
          <h3 class="text-[17px] font-bold text-(--ink-text)">1.4 Compartilhamento com terceiros</h3>
          <p class="text-[14px] leading-[1.8] text-(--ink-text-muted)">
            Utilizamos provedores de infraestrutura (hospedagem e banco de dados) e a API pública Jikan/MyAnimeList
            para dados de animes. Esses provedores processam dados sob contratos de confidencialidade e apenas na
            medida necessária para operar o serviço. Calendários compartilhados por você (link view-only) ficam
            visíveis a quem receber o link, até que você o revogue.
          </p>
        </section>

        <section id="seus-direitos" class="flex flex-col gap-3">
          <h3 class="text-[17px] font-bold text-(--ink-text)">1.5 Seus direitos como titular</h3>
          <div class="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <div v-for="r in RIGHTS" :key="r" class="flex items-start gap-2 rounded-lg border p-3"
              style="background: color-mix(in srgb, var(--brand-primary) 6%, transparent); border-color: color-mix(in srgb, var(--brand-primary) 15%, transparent)">
              <span class="shrink-0 text-[13px] text-(--brand-primary)">✓</span>
              <span class="text-[13px] leading-[1.6] text-(--ink-text)">{{ r }}</span>
            </div>
          </div>
          <p class="text-[13.5px] leading-[1.7] text-(--ink-text-faint)">
            Para exercer qualquer um desses direitos, acesse Configurações → Privacidade no app, ou entre em contato
            pelo e-mail
            <a href="mailto:privacidade@animeweek.app"
              class="text-(--brand-primary) hover:text-(--brand-secondary)">privacidade@animeweek.app</a>. Respondemos
            em até 15 dias.
          </p>
        </section>

        <section id="retencao" class="flex flex-col gap-3">
          <h3 class="text-[17px] font-bold text-(--ink-text)">1.6 Retenção e exclusão</h3>
          <p class="text-[14px] leading-[1.8] text-(--ink-text-muted)">
            Seus dados ficam armazenados enquanto sua conta estiver ativa. Ao solicitar a exclusão da conta, removemos
            seus dados pessoais em até 30 dias, exceto informações que precisemos manter por obrigação legal (ex.:
            registros fiscais).
          </p>
        </section>

        <div class="h-px bg-white/7" />

        <section id="termos" class="flex flex-col gap-3.5">
          <h2 class="font-display flex items-center gap-2.5 text-[22px] font-extrabold text-white">
            <span class="h-1.5 w-1.5 rounded-full bg-(--color-accent)" />
            2. Termos de Uso
          </h2>
          <p class="text-[14.5px] leading-[1.8] text-(--ink-text-muted)">
            Ao criar uma conta no AnimeWeek, você concorda com as regras abaixo. Se não concordar, não utilize o
            serviço.
          </p>
        </section>

        <section id="conta" class="flex flex-col gap-3">
          <h3 class="text-[17px] font-bold text-(--ink-text)">2.1 Sua conta</h3>
          <p class="text-[14px] leading-[1.8] text-(--ink-text-muted)">
            Você é responsável por manter a confidencialidade das suas credenciais. O serviço é gratuito e destinado a
            maiores de 13 anos. Menores entre 13 e 18 anos devem usar com autorização de um responsável legal.
          </p>
        </section>

        <section id="uso-aceitavel" class="flex flex-col gap-3">
          <h3 class="text-[17px] font-bold text-(--ink-text)">2.2 Uso aceitável</h3>
          <ul class="flex flex-col gap-2 pl-5 text-[14px] leading-[1.7] text-(--ink-text-muted)">
            <li class="list-disc">Não usar o serviço para fins ilegais ou para violar direitos de terceiros;</li>
            <li class="list-disc">Não tentar acessar contas de outros usuários ou explorar falhas de segurança;</li>
            <li class="list-disc">Não automatizar coleta de dados da plataforma (scraping) sem autorização;</li>
            <li class="list-disc">
              Conteúdos e metadados de animes exibidos pertencem aos seus respectivos detentores de direitos — o
              AnimeWeek apenas organiza e referencia essas informações.
            </li>
          </ul>
        </section>

        <section id="disponibilidade" class="flex flex-col gap-3">
          <h3 class="text-[17px] font-bold text-(--ink-text)">2.3 Disponibilidade e alterações</h3>
          <p class="text-[14px] leading-[1.8] text-(--ink-text-muted)">
            O serviço é fornecido "como está", sem garantia de disponibilidade contínua. Podemos alterar, suspender ou
            descontinuar funcionalidades a qualquer momento, com aviso prévio quando razoavelmente possível.
            Alterações relevantes a estes termos serão comunicadas por e-mail ou aviso no app.
          </p>
        </section>

        <section id="contato" class="flex flex-col gap-2.5 rounded-2xl border border-white/7 bg-white/3 p-5.5">
          <h3 class="text-[16px] font-bold text-(--ink-text)">Dúvidas ou solicitações</h3>
          <p class="text-[13.5px] leading-[1.7] text-(--ink-text-muted)">
            Encarregado de Dados (DPO):
            <a href="mailto:privacidade@animeweek.app"
              class="text-(--brand-primary) hover:text-(--brand-secondary)">privacidade@animeweek.app</a><br />
            Suporte geral:
            <a href="mailto:suporte@animeweek.app"
              class="text-(--brand-primary) hover:text-(--brand-secondary)">suporte@animeweek.app</a>
          </p>
        </section>
      </div>
    </div>

    <div class="border-t border-white/5 px-6 py-5 text-center text-[11.5px] text-(--ink-text-faint)">
      © 2026 AnimeWeek. Feito por um dev.
    </div>
  </div>
</template>
