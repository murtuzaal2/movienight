'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Film, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/card';

const TMDB_API_BASE_URL = 'https://api.themoviedb.org/3';

interface TrendingMovie {
  id: number;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  release_date: string;
}

async function fetchTrendingMovies(): Promise<TrendingMovie[]> {
  const accessToken = process.env.NEXT_PUBLIC_TMDB_ACCESS_TOKEN;
  if (!accessToken) {
    console.error('TMDB Access Token is not configured.');
    return [];
  }

  const url = `${TMDB_API_BASE_URL}/trending/movie/week`;
  const options = {
    method: 'GET',
    headers: {
      accept: 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
  };

  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      console.error(`TMDB API Error: ${response.status} ${response.statusText}`);
      return [];
    }
    const data = await response.json();
    return data.results?.slice(0, 10) || [];
  } catch (error) {
    console.error('Failed to fetch trending movies:', error);
    return [];
  }
}

export function TrendingMovies() {
  const [movies, setMovies] = useState<TrendingMovie[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadTrending() {
      setIsLoading(true);
      const trendingMovies = await fetchTrendingMovies();
      setMovies(trendingMovies);
      setIsLoading(false);
    }
    loadTrending();
  }, []);

  if (isLoading) {
    return (
      <div className="w-full py-8 bg-secondary/30 border-y-[3px] border-border">
        <div className="container mx-auto px-6">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-headline font-bold">Trending This Week</h2>
          </div>
          <div className="flex items-center justify-center py-12">
            <Film className="h-12 w-12 text-primary animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  if (movies.length === 0) {
    return null;
  }

  return (
    <div className="w-full py-8 bg-secondary/30 border-y-[3px] border-border">
      <div className="container mx-auto px-6">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-headline font-bold">Trending This Week</h2>
        </div>

        {/* Horizontal scrolling container */}
        <div className="relative">
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory">
            {movies.map((movie) => {
              const year = movie.release_date ? movie.release_date.split('-')[0] : '';
              const posterUrl = movie.poster_path
                ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
                : 'https://picsum.photos/seed/placeholder/500/750';

              return (
                <Card
                  key={movie.id}
                  className="flex-shrink-0 w-[160px] snap-start border-[3px] dark:border-2 border-border rounded-2xl overflow-hidden shadow-[4px_4px_0px_0px_hsl(var(--border))] dark:shadow-none hover:shadow-[6px_6px_0px_0px_hsl(var(--border))] hover:translate-x-[-2px] hover:translate-y-[-2px] dark:hover:shadow-none dark:hover:translate-x-0 dark:hover:translate-y-0 transition-all duration-200 bg-card"
                >
                  <div className="relative aspect-[2/3] w-full">
                    <Image
                      src={posterUrl}
                      alt={movie.title}
                      fill
                      className="object-cover"
                      sizes="160px"
                      data-ai-hint="movie poster"
                    />
                    {/* Rating badge */}
                    {movie.vote_average > 0 && (
                      <div className="absolute top-2 right-2 bg-primary/90 text-primary-foreground px-2 py-1 rounded-full text-xs font-bold border-2 border-border">
                        ⭐ {movie.vote_average.toFixed(1)}
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="font-bold text-sm line-clamp-2 mb-1">
                      {movie.title}
                    </h3>
                    <p className="text-xs text-muted-foreground">{year}</p>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Scroll hint */}
        <p className="text-xs text-muted-foreground text-center mt-2">
          Scroll to see more →
        </p>
      </div>

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
