import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import type { UpdateProfileInput } from '@aniweek/shared';
import sharp from 'sharp';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../common/storage/storage.service';
import { toProfileResponse, type ProfileResponse } from './types/profile.type';

const AVATAR_BUCKET = 'avatars';
// Quadrado pequeno o bastante pra um avatar de sidebar/card — reprocessar
// para um tamanho fixo também limita o custo de storage por upload.
const AVATAR_SIZE = 320;

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async getProfile(userId: string): Promise<ProfileResponse> {
    const user = await this.findUserOrThrow(userId);
    return toProfileResponse(user);
  }

  async updateProfile(
    userId: string,
    input: UpdateProfileInput,
  ): Promise<ProfileResponse> {
    if (input.username) {
      const existing = await this.prisma.user.findUnique({
        where: { username: input.username },
      });
      if (existing && existing.id !== userId) {
        throw new ConflictException('Usuário já em uso');
      }
    }
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: input,
      include: { oauthAccounts: true },
    });
    return toProfileResponse(user);
  }

  async deleteAccount(userId: string): Promise<void> {
    // onDelete: Cascade em refreshTokens/oauthAccounts (schema.prisma) — não
    // precisa deletar em cascata na mão, o Postgres cuida.
    await this.prisma.user.delete({ where: { id: userId } });
  }

  async uploadAvatar(
    userId: string,
    file: Express.Multer.File,
  ): Promise<{ avatarUrl: string }> {
    // "Validar MIME real" (issue M2.2/Lawliet) = decodificar de verdade, não
    // confiar em file.mimetype (vem do header Content-Type do multipart,
    // controlado pelo cliente). Se o sharp não conseguir decodificar, o
    // arquivo não é a imagem que ele diz ser — rejeita.
    const processed = await sharp(file.buffer)
      .resize(AVATAR_SIZE, AVATAR_SIZE, { fit: 'cover' })
      .webp({ quality: 82 })
      .toBuffer()
      .catch(() => {
        throw new UnprocessableEntityException(
          'Arquivo não é uma imagem válida',
        );
      });

    const path = `${userId}.webp`;
    await this.storage.upload(AVATAR_BUCKET, path, processed, 'image/webp');
    const avatarUrl = this.storage.getPublicUrl(AVATAR_BUCKET, path);

    await this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
    });
    return { avatarUrl };
  }

  private async findUserOrThrow(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { oauthAccounts: true },
    });
    if (!user) throw new NotFoundException('Usuário não encontrado');
    return user;
  }
}
