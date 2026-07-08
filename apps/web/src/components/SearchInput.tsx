/* eslint-disable */
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search as SearchIcon, X, Loader2 } from 'lucide-react';
import { useDebounce } from 'use-debounce';
import Image from 'next/image';
import Link from 'next/link';
import { OmoButton } from '@/components/ui/OmoButton';

// We fetch the internal API for live suggestions
export function SearchInput() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') ?? '';
  
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery] = useDebounce(query, 300);
  
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Sync back from URL if user navigates back
  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  // Live URL update for the main grid
  useEffect(() => {
    if (debouncedQuery !== initialQuery) {
      if (debouncedQuery) {
        router.replace(`/search?q=${encodeURIComponent(debouncedQuery)}`, { scroll: false });
      } else {
        router.replace(`/search`, { scroll: false });
      }
    }
  }, [debouncedQuery, router, initialQuery]);

  // Fetch suggestions dropdown data
  useEffect(() => {
    async function fetchSuggestions() {
      if (!debouncedQuery) {
        setSuggestions([]);
        return;
      }
      setIsLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}&limit=5`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data.results?.slice(0, 5) || []);
        }
      } catch (err) {
        // ignore
      } finally {
        setIsLoading(false);
      }
    }
    
    // Only fetch suggestions if we are focused
    if (isFocused) {
      fetchSuggestions();
    }
  }, [debouncedQuery, isFocused]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative w-full z-50" ref={wrapperRef}>
      <form 
        onSubmit={(e) => {
          e.preventDefault();
          setIsFocused(false);
          if (query) router.push(`/search?q=${encodeURIComponent(query)}`);
        }} 
        className="relative"
      >
        <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-text-secondary pointer-events-none">
          <SearchIcon size={24} />
        </div>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          placeholder="Search anime..."
          className="w-full h-14 pl-12 pr-12 rounded-card bg-bg-surface border border-border-subtle focus:border-accent focus:ring-1 focus:ring-accent outline-none text-text-primary text-lg transition-all shadow-sm"
          autoFocus
        />
        {query && (
          <OmoButton
            variant="icon"
            size="icon"
            onClick={() => {
              setQuery('');
              router.replace('/search');
            }}
            className="absolute inset-y-0 right-2 top-1/2 -translate-y-1/2 w-10 h-10 text-text-secondary hover:text-text-primary bg-transparent"
          >
            <X size={20} />
          </OmoButton>
        )}
      </form>

      {/* Suggestion Dropdown */}
      {isFocused && query && (
        <div className="absolute top-full left-0 right-0 mt-2 rounded-card bg-bg-surface border border-border-subtle shadow-2xl overflow-hidden flex flex-col max-h-[60vh] overflow-y-auto">
          {isLoading && suggestions.length === 0 ? (
            <div className="p-6 flex items-center justify-center text-text-secondary gap-2">
              <Loader2 className="animate-spin" size={20} />
              <span>Searching...</span>
            </div>
          ) : suggestions.length > 0 ? (
            <div className="flex flex-col py-2">
              {suggestions.map((anime) => (
                <OmoButton
                  asChild
                  key={anime.id}
                  variant="ghost"
                  className="w-full justify-start h-auto p-0"
                >
                  <Link
                    href={`/anime/${anime.id}`}
                    onClick={() => setIsFocused(false)}
                    className="flex items-center gap-4 px-4 py-3 w-full"
                  >
                    <div className="relative w-10 h-14 shrink-0 rounded-[6px] overflow-hidden bg-bg-elevated">
                      {anime.images?.jpg?.small && (
                        <Image src={anime.images.jpg.small} alt={anime.title} fill className="object-cover" sizes="40px" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-text-primary font-semibold truncate">{anime.title}</p>
                      <p className="text-sm text-text-secondary truncate">{anime.year || 'Unknown'} • {anime.type}</p>
                    </div>
                  </Link>
                </OmoButton>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center text-text-secondary">
              No results found for "{query}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}
