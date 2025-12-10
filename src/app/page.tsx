'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { MovieList } from "@/components/movie-list";
import { AddMovieForm } from "@/components/add-movie-form";
import { Film } from "lucide-react";
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { UserAvatar } from '@/components/user-avatar';
import { collection, query, where } from 'firebase/firestore';
import type { Movie } from '@/lib/types';


export default function Home() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();

  // Memoize the query to prevent re-renders
  const moviesQuery = useMemoFirebase(() => {
    if (!user) return null;
    // We can create more complex queries here later, e.g., for shared lists
    return collection(firestore, 'users', user.uid, 'movies');
  }, [firestore, user]);

  // Use the useCollection hook to get real-time movie data
  const { data: movies, isLoading: isLoadingMovies } = useCollection<Movie>(moviesQuery);


  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Film className="h-12 w-12 text-primary animate-spin" />
      </div>
    );
  }


  return (
    <main className="min-h-screen bg-background font-body text-foreground">
      <div className="container mx-auto p-4 md:p-8">
        <header className="mb-12 flex flex-col items-center">
          <div className="w-full flex justify-end">
            <UserAvatar />
          </div>
          <div className="flex items-center gap-4 mb-6">
            <Film className="h-10 w-10 md:h-12 md:w-12 text-primary" />
            <h1 className="text-4xl md:text-6xl font-headline font-bold text-center tracking-tighter">
              Film Collab
            </h1>
          </div>
          <p className="max-w-2xl text-center text-muted-foreground mb-8">
            A shared movie watchlist for you and a friend. Search for a movie, add a social link, and keep track of what to watch and what you've watched.
          </p>
          <div className="w-full max-w-2xl">
            <AddMovieForm />
          </div>
        </header>
        
        <MovieList initialMovies={movies || []} isLoading={isLoadingMovies} />
      </div>
    </main>
  );
}
