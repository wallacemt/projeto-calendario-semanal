import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import sharp from 'sharp';
import type {
  ActivateThemeInput,
  CreateThemeInput,
  UpdateThemeInput,
} from '@aniweek/shared';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../common/storage/storage.service';
import { getCurrentSeason } from '../calendars/current-season.util';
import { toThemeResponse, type ThemeResponse } from './types/theme.type';

const BG_BUCKET = 'theme-backgrounds';
// Wide o bastante pra cobrir a viewport do board sem esticar (a mesma ideia
// do AVATAR_SIZE em UsersService, só que pra um bg de tela cheia).
const BG_WIDTH = 1920;
const BG_HEIGHT = 1080;

// Dona de Theme (M7 — RF-08/ADR-09). Resolve o "tema ativo" (getActive) —
// o único método que sabe combinar activeThemeId (override manual) com a
// estação atual (modo "auto") — o resto é CRUD simples escopado por dono.
@Injectable()
export class ThemesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async findAll(userId: string): Promise<ThemeResponse[]> {
    const themes = await this.prisma.theme.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return themes.map(toThemeResponse);
  }

  async create(
    userId: string,
    input: CreateThemeInput,
  ): Promise<ThemeResponse> {
    if (input.season) await this.assertSeasonFree(userId, input.season);

    const theme = await this.prisma.theme.create({
      data: {
        userId,
        name: input.name,
        accent: input.accent,
        accent2: input.accent2,
        season: input.season,
      },
    });
    return toThemeResponse(theme);
  }

  async update(
    id: string,
    userId: string,
    input: UpdateThemeInput,
  ): Promise<ThemeResponse> {
    // BUG: findUnique(id) não escopa por userId — qualquer usuário
    // autenticado que souber/adivinhar o id de um tema alheio consegue
    // editá-lo (IDOR). Compare com remove()/uploadBgImage() logo abaixo,
    // que usam findFirst({ id, userId }) como o resto do codebase faz.
    const existing = await this.prisma.theme.findUnique({
      where: { id, userId },
    });
    if (!existing) throw new NotFoundException('Tema não encontrado');

    if (input.season && input.season !== existing.season) {
      await this.assertSeasonFree(userId, input.season, id);
    }

    const theme = await this.prisma.theme.update({
      where: { id },
      data: {
        name: input.name,
        accent: input.accent,
        accent2: input.accent2,
        season: input.season,
      },
    });
    return toThemeResponse(theme);
  }

  async remove(id: string, userId: string): Promise<void> {
    const existing = await this.prisma.theme.findFirst({
      where: { id, userId },
    });
    if (!existing) throw new NotFoundException('Tema não encontrado');
    // onDelete: SetNull em User.activeThemeId (schema.prisma) — se este era
    // o tema ativo de alguém (só pode ser o próprio dono, temas não são
    // compartilháveis), o Postgres já devolve o user pro modo "auto" sozinho.
    await this.prisma.theme.delete({ where: { id } });
  }

  async uploadBgImage(
    id: string,
    userId: string,
    file: Express.Multer.File,
  ): Promise<{ bgImageUrl: string }> {
    const existing = await this.prisma.theme.findFirst({
      where: { id, userId },
    });
    if (!existing) throw new NotFoundException('Tema não encontrado');

    const processed = await sharp(file.buffer)
      .resize(BG_WIDTH, BG_HEIGHT, { fit: 'cover' })
      .webp({ quality: 78 })
      .toBuffer()
      .catch(() => {
        throw new UnprocessableEntityException(
          'Arquivo não é uma imagem válida',
        );
      });

    const path = `${userId}/${id}.webp`;
    await this.storage.upload(BG_BUCKET, path, processed, 'image/webp');
    const bgImageUrl = this.storage.getPublicUrl(BG_BUCKET, path);

    await this.prisma.theme.update({ where: { id }, data: { bgImageUrl } });
    return { bgImageUrl };
  }

  // Resolve o tema efetivo: override manual (activeThemeId) vence; sem
  // override, modo "auto" procura um tema pinado (season) na estação atual e
  // cai pro default hardcoded do front (tokens.css) se não achar nenhum —
  // por isso null é uma resposta válida, não um erro.
  async getActive(userId: string): Promise<ThemeResponse | null> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { activeThemeId: true },
    });

    if (user.activeThemeId) {
      const theme = await this.prisma.theme.findUnique({
        where: { id: user.activeThemeId },
      });
      if (theme) return toThemeResponse(theme);
    }

    const { season } = getCurrentSeason();
    const seasonal = await this.prisma.theme.findFirst({
      where: { userId, season },
    });
    return seasonal ? toThemeResponse(seasonal) : null;
  }

  async setActive(
    userId: string,
    input: ActivateThemeInput,
  ): Promise<{ activeThemeId: string | null }> {
    if (input.themeId) {
      const existing = await this.prisma.theme.findFirst({
        where: { id: input.themeId, userId },
      });
      if (!existing) throw new NotFoundException('Tema não encontrado');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { activeThemeId: input.themeId },
    });
    return { activeThemeId: input.themeId };
  }

  private async assertSeasonFree(
    userId: string,
    season: NonNullable<CreateThemeInput['season']>,
    excludeId?: string,
  ): Promise<void> {
    const conflict = await this.prisma.theme.findFirst({
      where: {
        userId,
        season,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
    if (conflict) {
      throw new ConflictException(
        `Já existe um tema pinado para essa estação: "${conflict.name}"`,
      );
    }
  }
}
