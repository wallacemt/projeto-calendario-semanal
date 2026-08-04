import type { Theme } from '../../../generated/prisma/client';

export interface ThemeResponse {
  id: string;
  name: string;
  accent: string;
  accent2: string;
  bgImageUrl: string | null;
  season: Theme['season'];
  createdAt: Date;
}

export function toThemeResponse(theme: Theme): ThemeResponse {
  return {
    id: theme.id,
    name: theme.name,
    accent: theme.accent,
    accent2: theme.accent2,
    bgImageUrl: theme.bgImageUrl,
    season: theme.season,
    createdAt: theme.createdAt,
  };
}
