/* eslint-disable */
import { 
  jikanGetAnime, 
  jikanGetCharacters, 
  jikanGetAnimePictures,
  jikanGetRecommendations,
  getCache, 
  CacheKeys, 
  CacheTTL 
} from '@omozoku/api-clients';
import { transformAnime, transformCharacters } from '@omozoku/transformers';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { scoreBg } from '@/lib/utils';
import { Play, Star, Hash, Users, TrendingUp } from 'lucide-react';
import type { Anime, Character } from '@omozoku/types';
import { PosterCard } from '@/components/PosterCard';
import { OmoButton } from '@/components/ui/OmoButton';

export const runtime = 'nodejs';

async function fetchAnimeDetail(id: number) {
  const cache = getCache();
  const cacheKey = CacheKeys.anime(id);

  const cached = await cache.get(cacheKey);
  if (cached) return cached as { anime: Anime; characters: Character[]; recommendations: Anime[]; pictures: any[] };

  try {
    const [animeRaw, charsRaw, picsRaw, recsRaw] = await Promise.allSettled([
      jikanGetAnime(id),
      jikanGetCharacters(id),
      jikanGetAnimePictures(id),
      jikanGetRecommendations(id),
    ]);

    if (animeRaw.status === 'rejected') return null;

    const anime = transformAnime(animeRaw.value);
    const characters = charsRaw.status === 'fulfilled' ? transformCharacters(charsRaw.value) : [];
    const pictures = picsRaw.status === 'fulfilled' ? picsRaw.value.data : [];
    
    // Transform recommendations (they come nested in .entry)
    const recommendations = recsRaw.status === 'fulfilled' 
      ? recsRaw.value.data.map(r => transformAnime(r.entry)).slice(0, 14) 
      : [];

    const payload = { anime, characters, recommendations, pictures };
    
    // Only cache if all secondary fetches succeeded
    if (charsRaw.status === 'fulfilled' && picsRaw.status === 'fulfilled' && recsRaw.status === 'fulfilled') {
      await cache.set(cacheKey, payload, CacheTTL.anime);
    }
    
    return payload;
  } catch (err) {
    console.error(`Failed to fetch anime ${id}`, err);
    return null;
  }
}

export default async function AnimePage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (isNaN(id)) notFound();

  const data = await fetchAnimeDetail(id);
  if (!data) notFound();

  const { anime, characters, recommendations, pictures } = data;
  const posterUrl = anime.images.webp?.large ?? anime.images.jpg.large ?? '';
  
  // Find a wide image for the backdrop, fallback to trailer image, fallback to poster
  const backdropUrl = 
    anime.trailerImage ?? 
    pictures.find(p => p.jpg.image_url.includes('large'))?.jpg.image_url ?? 
    posterUrl;

  return (
    <div className="min-h-dvh pb-20">
      {/* Hero Header with Full-Bleed Backdrop */}
      <div 
        className="relative h-[500px] md:h-[600px] w-full bg-bg-surface overflow-hidden"
        data-aos="fade-down"
        data-aos-duration="600"
      >
        {backdropUrl && (
          <div className="absolute inset-0 z-0">
            <Image 
              src={backdropUrl} 
              alt="" 
              fill 
              className="object-cover opacity-30 md:opacity-40" 
              priority 
            />
            {/* Gradient overlay for readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-bg-base via-bg-base/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-bg-base via-bg-base/40 to-transparent" />
          </div>
        )}
        
        <div className="relative h-full max-w-screen-2xl mx-auto px-4 md:px-6 lg:px-8 flex flex-col justify-end pb-12 z-10">
          <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-end md:items-stretch">
            {/* Poster */}
            <div 
              className="shrink-0 relative w-36 md:w-56 aspect-[2/3] rounded-card overflow-hidden shadow-2xl border border-border-subtle -mb-16 md:mb-0 z-20 hidden md:block"
              data-aos="fade-up"
              data-aos-delay="100"
            >
              {posterUrl ? (
                <Image src={posterUrl} alt={anime.title} fill className="object-cover" priority sizes="(max-width: 768px) 144px, 224px" />
              ) : (
                <div className="w-full h-full bg-bg-elevated skeleton" />
              )}
            </div>

            {/* Metadata */}
            <div className="flex-1 space-y-4 md:pb-4" data-aos="fade-up" data-aos-delay="200">
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-display font-extrabold text-text-primary leading-tight drop-shadow-lg">
                {anime.title}
              </h1>
              
              <div className="flex flex-wrap items-center gap-3 text-sm md:text-base font-body text-text-primary/90">
                {anime.score !== null && (
                  <span className={`px-2 py-0.5 rounded-pill font-extrabold tabular-nums shadow-sm ${scoreBg(Math.round(anime.score * 10))}`}>
                    {anime.score.toFixed(1)}
                  </span>
                )}
                <span>{anime.type}</span>
                <span>•</span>
                <span>{anime.year || 'Unknown Year'}</span>
                <span>•</span>
                <span>{anime.status}</span>
                {anime.episodes && (
                  <>
                    <span>•</span>
                    <span>{anime.episodes} Episodes</span>
                  </>
                )}
              </div>

              <div className="flex gap-2 flex-wrap pt-1">
                {anime.genres.map(g => (
                  <span key={g.id} className="px-3 py-1 rounded-pill bg-bg-surface/50 backdrop-blur-md border border-border-subtle text-xs text-text-primary">
                    {g.name}
                  </span>
                ))}
              </div>

              <div className="pt-4 flex gap-3">
                <OmoButton asChild variant="default" size="lg" className="bg-accent hover:bg-accent/90 shadow-lg shadow-accent/20 rounded-pill">
                  <Link href={`/watch/${anime.id}/1`} className="font-bold">
                    <Play size={20} fill="currentColor" />
                    Watch Now
                  </Link>
                </OmoButton>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-screen-2xl mx-auto px-4 md:px-6 lg:px-8 py-16 flex flex-col lg:flex-row gap-12 overflow-hidden">
        <div className="flex-1 space-y-12 min-w-0">
          {/* Inline Stat Strip */}
          <section 
            className="flex flex-wrap items-center gap-4 md:gap-6 text-sm md:text-base font-display font-medium text-text-secondary"
            data-aos="fade-up"
            data-aos-delay="300"
          >
            <div className="flex items-center gap-2 text-text-primary">
              <Star className="text-accent" size={20} />
              <span className="font-extrabold">{anime.score?.toFixed(1) || 'N/A'}</span>
            </div>
            <div className="w-px h-4 bg-border-subtle" />
            <div className="flex items-center gap-2">
              <Hash className="text-text-secondary" size={20} />
              <span>#{anime.rank || '?'} Ranked</span>
            </div>
            <div className="w-px h-4 bg-border-subtle" />
            <div className="flex items-center gap-2">
              <TrendingUp className="text-text-secondary" size={20} />
              <span>#{anime.popularity || '?'} Popularity</span>
            </div>
            <div className="w-px h-4 bg-border-subtle hidden sm:block" />
            <div className="flex items-center gap-2 hidden sm:flex">
              <Users className="text-text-secondary" size={20} />
              <span>{anime.members ? (anime.members / 1000).toFixed(1) + 'K' : 'N/A'} Members</span>
            </div>
          </section>

          {/* Synopsis */}
          <section data-aos="fade-up" data-aos-delay="400">
            <h2 className="text-2xl font-display font-extrabold mb-4">Synopsis</h2>
            <p className="text-text-secondary font-body leading-relaxed text-lg whitespace-pre-wrap max-w-[75ch]">
              {anime.synopsis || 'No synopsis available.'}
            </p>
          </section>
          
          {/* Characters Rail */}
          {characters.length > 0 && (
            <section data-aos="fade-up" data-aos-delay="500">
              <h2 className="text-2xl font-display font-extrabold mb-4">Cast & Characters</h2>
              <div className="relative" style={{ maskImage: 'linear-gradient(to right, black 90%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to right, black 90%, transparent 100%)' }}>
                <div className="scroll-rail pb-4 pr-12">
                  {characters.slice(0, 20).map(c => (
                    <div key={c.id} className="w-32 shrink-0 space-y-2 group">
                      <div className="relative w-full aspect-[2/3] rounded-card overflow-hidden bg-bg-surface border border-border-subtle">
                        {c.image ? (
                          <Image src={c.image} alt={c.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="128px" />
                        ) : (
                          <div className="absolute inset-0 skeleton" />
                        )}
                        {/* Inner gradient like PosterCard for text readability if we overlaid it, but here it just adds depth */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <div className="px-1">
                        <p className="text-sm font-semibold truncate text-text-primary group-hover:text-accent transition-colors">{c.name}</p>
                        <p className="text-xs text-text-secondary truncate">{c.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Recommendations Rail */}
          {recommendations.length > 0 && (
            <section data-aos="fade-up" data-aos-delay="600">
              <h2 className="text-2xl font-display font-extrabold mb-4">You Might Also Like</h2>
              <div className="relative" style={{ maskImage: 'linear-gradient(to right, black 90%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to right, black 90%, transparent 100%)' }}>
                <div className="scroll-rail pb-4 pr-12">
                  {recommendations.map(r => (
                    <div key={r.id} className="w-36 md:w-44 shrink-0">
                      <PosterCard anime={r} />
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}
        </div>
        
        {/* Episodes Side panel */}
        <aside 
          className="w-full lg:w-96 space-y-6"
          data-aos="fade-left"
          data-aos-delay="500"
        >
          <div className="sticky top-24 space-y-4">
            <h2 className="text-xl font-display font-extrabold">Episodes</h2>
            <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
              {Array.from({ length: Math.min(anime.episodes || 24, 100) }).map((_, i) => (
                <OmoButton asChild key={i} variant="episode" size="episode" className="group">
                  <Link href={`/watch/${anime.id}/${i + 1}`} className="flex items-center justify-between">
                    <span className="font-body text-sm font-medium">Episode {i + 1}</span>
                    <Play size={18} className="text-white/40 group-hover:text-white transition-colors" />
                  </Link>
                </OmoButton>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
