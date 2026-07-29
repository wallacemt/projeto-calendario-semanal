import { defineStore } from "pinia";
import type {
  MarkWatchedInput,
  UpdateEntryInput,
  Weekday,
} from "@aniweek/shared";
import { HttpError } from "../../lib/http";
import { useToastStore } from "../../stores/toast";
import {
  calendarApi,
  type CalendarBoard,
  type CalendarEntryResponse,
} from "./api";

// Lembra qual temporada o usuário estava vendo por último (M6, fora do
// blueprint) — sem isso, sair da página (reload/nova sessão) sempre
// recarregava a estação atual por data, perdendo a troca manual. localStorage
// é seguro aqui (ao contrário do access token — ADR-04): não é dado sensível,
// e getOne() no backend escopa por userId, então um id de outro usuário (ex.:
// troca de conta no mesmo navegador) só resulta num 404 tratado abaixo, nunca
// vaza dado de outra conta.
const LAST_CALENDAR_KEY = "aniweek:lastCalendarId";
function rememberCalendar(id: string) {
  localStorage.setItem(LAST_CALENDAR_KEY, id);
}

export const useCalendarStore = defineStore("calendar", {
  state: () => ({
    board: null as CalendarBoard | null,
    loading: false,
    error: null as string | null,
  }),
  actions: {
    // M6 (fora do blueprint): navegação entre estações — trocar qual
    // Calendar está carregado no board sem depender da estação "atual" por
    // data. Usado pelo SwitchSeasonModal e por createSeason() logo abaixo.
    async switchTo(calendarId: string) {
      this.loading = true;
      this.error = null;
      try {
        this.board = await calendarApi.getOne(calendarId);
        rememberCalendar(calendarId);
      } catch (err) {
        this.error =
          err instanceof HttpError ? err.message : "Erro ao carregar temporada";
      } finally {
        this.loading = false;
      }
    },

    // Cria e já troca o board pra ela — sem isso, "Nova temporada" criava o
    // registro mas o usuário não tinha como enxergar/editar o que acabou de
    // criar (load() só busca a estação atual por data).
    async createSeason(input: Parameters<typeof calendarApi.create>[0]) {
      const created = await calendarApi.create(input);
      await this.switchTo(created.id);
      return created;
    },

    async load() {
      this.loading = true;
      this.error = null;

      // Restaura a última temporada vista antes de cair pro padrão "estação
      // atual por data" — um id inválido/apagado/de outro usuário só falha
      // aqui (getOne 404) e segue pro fluxo de sempre, sem tela de erro.
      const lastId = localStorage.getItem(LAST_CALENDAR_KEY);
      if (lastId) {
        try {
          this.board = await calendarApi.getOne(lastId);
          this.loading = false;
          return;
        } catch {
          // segue pro fluxo abaixo
        }
      }

      try {
        this.board = await calendarApi.getCurrent();
        rememberCalendar(this.board.id);
      } catch (err) {
        if (err instanceof HttpError && err.status === 404) {
          // Primeira vez nesta estação: ainda não existe Calendar pra ela.
          // A estação atual já é conhecida (mesma rota pública usada no
          // boot/hero — ver stores/theme.ts), então cria na hora em vez de
          // exigir um passo manual de "criar calendário" no MVP.
          try {
            const { season, year } = await calendarApi.getCurrentSeason();
            await calendarApi.create({ season, year });
            this.board = await calendarApi.getCurrent();
            rememberCalendar(this.board.id);
          } catch (createErr) {
            this.error =
              createErr instanceof HttpError
                ? createErr.message
                : "Erro ao criar calendário";
          }
        } else {
          this.error =
            err instanceof HttpError
              ? err.message
              : "Erro ao carregar o calendário";
        }
      } finally {
        this.loading = false;
      }
    },

    async addEntry(weekday: Weekday, malId: number) {
      if (!this.board) return;
      const entry = await calendarApi.addEntry(this.board.id, {
        malId,
        weekday,
      });
      this.board.entries[weekday].push(entry);
    },

    async removeEntry(weekday: Weekday, entryId: string) {
      if (!this.board) return;
      const list = this.board.entries[weekday];
      const index = list.findIndex((e) => e.id === entryId);
      if (index === -1) return;
      // Otimista: remove da UI na hora, desfaz se a chamada falhar — evita
      // esperar o round-trip pra um "x" que quase sempre funciona.
      const [removed] = list.splice(index, 1);
      try {
        await calendarApi.removeEntry(entryId);
      } catch (err) {
        list.splice(index, 0, removed);
        useToastStore().push(
          err instanceof HttpError ? err.message : "Erro ao remover entrada","error"
        );
      }
    },

    // M5/AC-05: o VueDraggable já moveu o card entre os arrays na hora (é o
    // v-model dele) — aqui só persiste. Se falhar, resincroniza com o
    // servidor em vez de tentar desfazer o splice manualmente.
    //
    // Erro de ação (aqui, remove, updateProgress) vai pro toast, não pro
    // `this.error` — esse campo é lido pela view só pra decidir entre
    // "mostrar o board" e "mostrar tela de erro" (load() falhou, sem dado
    // nenhum pra exibir). Se uma falha de reorder setasse `this.error`, o
    // board inteiro já carregado sumiria da tela por causa de uma ação
    // pontual que não tem nada a ver com "não consegui carregar o calendário".
    async moveEntry(entryId: string, weekday: Weekday, position: number) {
      try {
        await calendarApi.moveEntry(entryId, { weekday, position });
      } catch (err) {
        useToastStore().push(
          err instanceof HttpError ? err.message : "Erro ao mover entrada","error"
        );
        await this.load();
      }
    },

    async updateProgress(
      weekday: Weekday,
      entryId: string,
      currentEpisode: number,
    ) {
      if (!this.board) return;
      const entry = this.board.entries[weekday].find((e) => e.id === entryId);
      if (!entry) return;
      const previous = {
        currentEpisode: entry.currentEpisode,
        status: entry.status,
      };
      entry.currentEpisode = currentEpisode;
      try {
        const updated = await calendarApi.updateProgress(entryId, {
          currentEpisode,
        });
        entry.status = updated.status;
      } catch (err) {
        entry.currentEpisode = previous.currentEpisode;
        entry.status = previous.status;
        useToastStore().push(
          err instanceof HttpError
            ? err.message
            : "Erro ao atualizar progresso","success"
        );
      }
    },

    // M6 (fora do blueprint): PATCH único do modal de editar card. Não
    // engole erro (ao contrário de removeEntry/updateProgress, que são
    // otimistas) — quem chama é um form de modal, o padrão aqui é o mesmo do
    // addEntry: deixa a exceção subir pra quem submeteu decidir se fecha o
    // modal ou mostra o erro e mantém aberto.
    async updateEntry(
      oldWeekday: Weekday,
      entryId: string,
      patch: UpdateEntryInput,
    ) {
      if (!this.board) return;
      const updated = await calendarApi.updateEntry(entryId, patch);
      const oldList = this.board.entries[oldWeekday];
      const idx = oldList.findIndex((e) => e.id === entryId);
      if (idx !== -1) oldList.splice(idx, 1);
      if (updated.weekday === oldWeekday && idx !== -1) {
        oldList.splice(idx, 0, updated);
      } else {
        this.board.entries[updated.weekday].push(updated);
      }
    },

    // M6 (fora do blueprint): merge local puro, sem round-trip — o form do
    // EditEntryModal já chamou PATCH /animes/:id e sabe exatamente quais
    // campos mudaram, então só espelha isso no card em vez de recarregar o
    // board inteiro por causa de 1 campo de texto.
    patchAnime(
      entryId: string,
      patch: Partial<CalendarEntryResponse["anime"]>,
    ) {
      if (!this.board) return;
      for (const list of Object.values(this.board.entries)) {
        const entry = list.find((e) => e.id === entryId);
        if (entry) {
          Object.assign(entry.anime, patch);
          return;
        }
      }
    },

    // M8 (RF-09/§6): mark-watched — cria o registro no museu (back) e fecha
    // o card como COMPLETED no board. Mesmo padrão de updateEntry: deixa a
    // exceção subir pro modal (RatingModal) decidir se fecha ou mantém aberto.
    async completeEntry(
      weekday: Weekday,
      entryId: string,
      input: MarkWatchedInput,
    ) {
      if (!this.board) return;
      const updated = await calendarApi.completeEntry(entryId, input);
      const list = this.board.entries[weekday];
      const idx = list.findIndex((e) => e.id === entryId);
      if (idx !== -1) list.splice(idx, 1, updated);
    },

    // Bulk (AC-04) — botão "Importar da temporada anterior" na topbar, 1
    // clique, sem modal. Erro/sucesso viram toast direto (não há form pra
    // manter aberto em caso de falha).
    async importPreviousBulk() {
      if (!this.board) return;
      try {
        const created = await calendarApi.importPrevious(this.board.id, {});
        for (const entry of created) {
          this.board.entries[entry.weekday].push(entry);
        }
        useToastStore().push(
          created.length > 0
            ? `${created.length} anime(s) trazido(s) da temporada anterior`
            : "Nada para trazer da temporada anterior",
          "success",
        );
      } catch (err) {
        useToastStore().push(
          err instanceof HttpError
            ? err.message
            : "Erro ao importar da temporada anterior","error"
        );
      }
    },
  },
});
