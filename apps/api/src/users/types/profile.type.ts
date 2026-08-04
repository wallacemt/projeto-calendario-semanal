import {
  toPublicUser,
  type PublicUser,
} from '../../auth/types/public-user.type';
import type {
  AuthProvider,
  OAuthAccount,
  User,
} from '../../../generated/prisma/client';

// Stats "básicas" do RF-02 (M2.1). Só o total de animes no calendário —
// stats completas (episódios, gêneros) são do M8, sobre modelos que ainda
// não existem (Calendar/WatchedAnime seguem comentados no schema).
export interface ProfileStats {
  totalAnimesInCalendar: number;
}

export interface ProfileResponse extends PublicUser {
  stats: ProfileStats;
  connectedProviders: AuthProvider[];
}

type UserWithOAuth = User & { oauthAccounts: OAuthAccount[] };

export function toProfileResponse(user: UserWithOAuth): ProfileResponse {
  return {
    ...toPublicUser(user),
    // TODO(M4): substituir por contagem real assim que Calendar/CalendarEntry existirem.
    stats: { totalAnimesInCalendar: 0 },
    connectedProviders: user.oauthAccounts.map((account) => account.provider),
  };
}
