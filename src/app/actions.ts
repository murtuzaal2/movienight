'use server';

import { revalidatePath } from 'next/cache';
import type { SearchResult, TMDBSearchResult } from '@/lib/types';
import { getFirestore } from 'firebase-admin/firestore';
import { getFirebaseAdminApp } from '@/firebase/admin';

// This is a server-side file. We use firebase-admin here.

// --- TMDB API ---
const TMDB_ACCESS_TOKEN = process.env.NEXT_PUBLIC_TMDB_ACCESS_TOKEN;
const TMDB_API_BASE_URL = 'https://api.themoviedb.org/3';

async function tmdbFetch(path: string, params: Record<string, string> = {}) {
  if (!TMDB_ACCESS_TOKEN) {
    throw new Error('TMDB Access Token is not configured.');
  }

  const url = new URL(`${TMDB_API_BASE_URL}/${path}`);
  Object.entries(params).forEach(([key, value]) =>
    url.searchParams.append(key, value)
  );

  const options = {
    method: 'GET',
    headers: {
      accept: 'application/json',
      Authorization: `Bearer ${TMDB_ACCESS_TOKEN}`,
    },
  };

  try {
    const response = await fetch(url.toString(), options);
    if (!response.ok) {
      console.error(
        `TMDB API Error: ${response.status} ${response.statusText}`
      );
      const errorBody = await response.text();
      console.error('Error Body:', errorBody);
      return null;
    }
    return response.json();
  } catch (error) {
    console.error('Failed to fetch from TMDB:', error);
    return null;
  }
}

function formatTMDBSearchResult(result: TMDBSearchResult): SearchResult {
  const year = result.release_date ? result.release_date.split('-')[0] : 'N/A';
  return {
    id: result.id.toString(),
    title: result.title,
    year: year,
    posterUrl: result.poster_path
      ? `https://image.tmdb.org/t/p/w500${result.poster_path}`
      : 'https://picsum.photos/seed/placeholder/500/750', // Fallback
    posterHint: 'movie poster',
  };
}

// --- FIRESTORE SERVER ACTIONS ---

/**
 * Searches for movies on TMDB.
 * This is a server action that can be called from client components.
 */
export async function searchMovies(query: string): Promise<SearchResult[]> {
  if (!query) return [];

  const data = await tmdbFetch('search/movie', {
    query: query,
    include_adult: 'false',
    language: 'en-US',
    page: '1',
  });

  if (data && data.results) {
    return data.results.slice(0, 10).map(formatTMDBSearchResult);
  }

  return [];
}

/**
 * Adds a movie to a user's list in Firestore.
 * IMPORTANT: This is a client-callable action and does not use the non-blocking helpers.
 * It's designed to be called from a form action.
 */
export async function addMovie(formData: FormData) {
  const adminApp = getFirebaseAdminApp();
  const db = getFirestore(adminApp);

  try {
    const movieData = JSON.parse(
      formData.get('movieData') as string
    ) as SearchResult;
    const addedBy = formData.get('addedBy') as string; // User ID (UID)
    const socialLink = formData.get('socialLink') as string;

    if (!movieData || !addedBy) {
      throw new Error('Missing movie data or user ID.');
    }

    const movieRef = db
      .collection('users')
      .doc(addedBy)
      .collection('movies')
      .doc(movieData.id);

    // Using `set` with `merge: true` is safe and allows creating/updating.
    await movieRef.set(
      {
        id: movieData.id,
        title: movieData.title,
        year: movieData.year,
        posterUrl: movieData.posterUrl,
        posterHint: movieData.posterHint,
        addedBy: addedBy,
        socialLink: socialLink || '',
        status: 'To Watch',
        createdAt: new Date(),
      },
      { merge: true }
    );
  } catch (error) {
    console.error('Failed to add movie:', error);
    // In a real app, you might return an error state.
    // For now, we just log it.
    return { error: 'Failed to add movie.' };
  }

  revalidatePath('/');
}
