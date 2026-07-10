import type { User } from '../../../generated/prisma/client';

// Forma do usuário exposta pela API — nunca inclui passwordHash.
export interface PublicUser {
  id: string;
  email: string;
  username: string;
  avatarUrl: string | null;
  bio: string | null;
  emailVerified: boolean;
  createdAt: Date;
}

export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    avatarUrl: user.avatarUrl,
    bio: user.bio,
    emailVerified: user.emailVerified,
    createdAt: user.createdAt,
  };
}
