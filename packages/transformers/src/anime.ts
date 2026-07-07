// ─── Jikan → internal Anime transformer ──────────────────────────────────────

import type { Anime, AnimeRelation, Character } from '@omozoku/types';
import type { JikanAnime, JikanCharacter, JikanRelation } from '@omozoku/api-clients';

function mapStatus(raw: string): Anime['status'] {
  const map: Record<string, Anime['status']> = {
    'Finished Airing': 'Finished Airing',
    'Currently Airing': 'Currently Airing',
    'Not yet aired': 'Not yet aired',
  };
  return map[raw] ?? 'Unknown';
}

function mapType(raw: string): Anime['type'] {
  const valid: Anime['type'][] = ['TV', 'Movie', 'OVA', 'ONA', 'Special', 'Music'];
  return (valid.includes(raw as Anime['type']) ? raw : 'Unknown') as Anime['type'];
}

function mapRating(raw: string | null): Anime['rating'] {
  if (!raw) return 'Unknown';
  if (raw.startsWith('G -')) return 'G';
  if (raw.startsWith('PG-13')) return 'PG-13';
  if (raw.startsWith('PG -')) return 'PG';
  if (raw.startsWith('R+ -')) return 'R+';
  if (raw.startsWith('Rx')) return 'Rx';
  if (raw.startsWith('R -')) return 'R';
  return 'Unknown';
}

export function transformAnime(raw: JikanAnime): Anime {
  return {
    id: raw.mal_id,
    title: raw.title,
    titleEnglish: raw.title_english,
    titleJapanese: raw.title_japanese,
    synopsis: raw.synopsis,
    status: mapStatus(raw.status),
    type: raw.type ? mapType(raw.type) : 'Unknown',
    rating: raw.rating ? mapRating(raw.rating) : 'Unknown',
    episodes: raw.episodes ?? null,
    score: raw.score ?? null,
    scoredBy: raw.scored_by ?? null,
    rank: raw.rank ?? null,
    popularity: raw.popularity ?? null,
    members: raw.members ?? null,
    year: raw.year ?? null,
    season: (raw.season as Anime['season']) ?? null,
    duration: raw.duration ?? null,
    genres: raw.genres?.map((g) => ({ id: g.mal_id, name: g.name })) ?? [],
    studios: raw.studios?.map((s) => ({ id: s.mal_id, name: s.name })) ?? [],
    images: {
      jpg: {
        large: raw.images?.jpg?.large_image_url ?? '',
        medium: raw.images?.jpg?.image_url ?? '',
        small: raw.images?.jpg?.small_image_url ?? '',
      },
      webp: raw.images?.webp && {
        large: raw.images.webp.large_image_url,
        medium: raw.images.webp.image_url,
        small: raw.images.webp.small_image_url,
      },
    } as any,
    trailerUrl: raw.trailer?.youtube_id ? `https://youtube.com/watch?v=${raw.trailer.youtube_id}` : null,
    trailerImage: raw.trailer?.images?.maximum_image_url ?? null,
    airing: raw.airing ?? false,
    airingStart: raw.aired?.from ?? null,
    airingEnd: raw.aired?.to ?? null,
    source: raw.source,
  };
}

export function transformRelations(raw: JikanRelation[]): AnimeRelation[] {
  return raw.map((r) => ({
    relation: r.relation,
    entries: r.entry.map((e) => ({ id: e.mal_id, title: e.name, type: e.type })),
  }));
}

export function transformCharacters(raw: JikanCharacter[]): Character[] {
  return raw.map((c) => ({
    id: c.character.mal_id,
    name: c.character.name,
    role: c.role === 'Main' ? 'Main' : 'Supporting',
    image: c.character.images.jpg.image_url ?? null,
    voiceActors: c.voice_actors.map((va) => ({
      name: va.person.name,
      language: va.language,
      image: va.person.images.jpg.image_url ?? null,
    })),
  }));
}
