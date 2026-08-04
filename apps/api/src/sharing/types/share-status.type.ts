import type {
  CalendarShare,
  ShareGrant,
  User,
} from '../../../generated/prisma/client';

export interface ShareGrantResponse {
  id: string;
  userId: string;
  username: string;
  avatarUrl: string | null;
  since: Date;
}

export interface ShareStatusResponse {
  active: boolean;
  token: string;
  grants: ShareGrantResponse[];
}

// Identificação do dono na página pública (M9 — pedido explícito: "de quem
// é esse calendário?"). Só o que já é público em qualquer outro lugar do
// app (username/avatar/bio) — nunca email, mesmo esse endpoint sendo
// @Public() (ver SharingController.getPublic).
export interface PublicOwnerResponse {
  username: string;
  avatarUrl: string | null;
  bio: string | null;
}

export function toPublicOwner(user: User): PublicOwnerResponse {
  return {
    username: user.username,
    avatarUrl: user.avatarUrl,
    bio: user.bio,
  };
}

export type ShareWithGrants = CalendarShare & {
  grants: (ShareGrant & { user: User })[];
};

export function toShareStatusResponse(
  share: ShareWithGrants,
): ShareStatusResponse {
  return {
    active: share.active,
    token: share.token,
    grants: share.grants.map((grant) => ({
      id: grant.id,
      userId: grant.user.id,
      username: grant.user.username,
      avatarUrl: grant.user.avatarUrl,
      since: grant.createdAt,
    })),
  };
}
