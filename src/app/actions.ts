
"use server";

import { revalidatePath } from "next/cache";
import type { Movie, SearchResult, User, TMDBSearchResult } from "@/lib/types";

// --- TMDB API ---
const TMDB_ACCESS_TOKEN = process.env.NEXT_PUBLIC_TMDB_ACCESS_TOKEN;
const TMDB_API_BASE_URL = 'https://api.themoviedb.org/3';

async function tmdbFetch(path: string, params: Record<string, string> = {}) {
    if (!TMDB_ACCESS_TOKEN) {
        console.error("TMDB Access Token is not configured.");
        return null;
    }

    const url = new URL(`${TMDB_API_BASE_URL}/${path}`);
    Object.entries(params).forEach(([key, value]) => url.searchParams.append(key, value));

    const options = {
        method: 'GET',
        headers: {
            accept: 'application/json',
            Authorization: `Bearer ${TMDB_ACCESS_TOKEN}`
        }
    };

    try {
        const response = await fetch(url.toString(), options);
        if (!response.ok) {
            console.error(`TMDB API Error: ${response.status} ${response.statusText}`);
            const errorBody = await response.text();
            console.error("Error Body:", errorBody);
            return null;
        }
        return response.json();
    } catch (error) {
        console.error("Failed to fetch from TMDB:", error);
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
        posterHint: 'movie poster'
    };
}


// --- MOCK DATABASE ---

let movies: Movie[] = [
    {
        id: '272', // Batman Begins
        title: 'Batman Begins',
        year: '2005',
        posterUrl: 'https://image.tmdb.org/t/p/w500/sPX89Td70IDDjVr85jdSBb4rWGr.jpg',
        posterHint: 'movie poster',
        addedBy: 'User A',
        status: 'To Watch',
    },
    {
        id: '238', // The Godfather
        title: 'The Godfather',
        year: '1972',
        posterUrl: 'https://image.tmdb.org/t/p/w500/3bhkrj58Vtu7enYsRolD1fZdja1.jpg',
        posterHint: 'movie poster',
        addedBy: 'User B',
        status: 'To Watch',
    },
    {
        id: '240', // The Godfather Part II
        title: 'The Godfather Part II',
        year: '1974',
        posterUrl: 'https://image.tmdb.org/t/p/w500/hek3koDUyRQk7FIhPXsa6mT2Zc3.jpg',
        posterHint: 'movie poster',
        addedBy: 'User A',
        status: 'Watched',
    },
    {
        id: '496243', // Parasite
        title: 'Parasite',
        year: '2019',
        posterUrl: 'https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg',
        posterHint: 'movie poster',
        addedBy: 'User B',
        status: 'Watched',
        socialLink: 'https://www.instagram.com/explore/tags/parasitemovie/'
    },
];

// --- SERVER ACTIONS ---

export async function getMovies(): Promise<Movie[]> {
  // In a real app, you'd fetch this from a database.
  return Promise.resolve(movies);
}

export async function searchMovies(query: string): Promise<SearchResult[]> {
  if (!query) return [];
  
  const data = await tmdbFetch('search/movie', { query: query, include_adult: 'false', language: 'en-US', page: '1' });

  if (data && data.results) {
      return data.results.slice(0, 10).map(formatTMDBSearchResult);
  }

  return [];
}

export async function addMovie(formData: FormData) {
  try {
    const movieData = JSON.parse(formData.get("movieData") as string) as SearchResult;
    const addedBy = formData.get("addedBy") as User;
    const socialLink = formData.get("socialLink") as string;
    
    if (!movieData || !addedBy) {
        throw new Error("Missing movie data or user.");
    }

    const newMovie: Movie = {
      id: movieData.id,
      title: movieData.title,
      year: movieData.year,
      posterUrl: movieData.posterUrl,
      posterHint: movieData.posterHint,
      addedBy: addedBy,
      socialLink: socialLink || undefined,
      status: 'To Watch',
    };
    
    // Prevent adding duplicates: check for both movie ID and user
    const movieExists = movies.some(
      m => m.id === newMovie.id && m.addedBy === newMovie.addedBy
    );

    if (!movieExists) {
        movies.unshift(newMovie);
    }

  } catch (error) {
    console.error("Failed to add movie:", error);
    // In a real app, you might return an error state.
  }
  
  revalidatePath("/");
}

export async function toggleWatchStatus(movieId: string, addedBy: User) {
    const movie = movies.find(m => m.id === movieId && m.addedBy === addedBy);
    if (movie) {
        movie.status = movie.status === 'To Watch' ? 'Watched' : 'To Watch';
    }
    revalidatePath('/');
}

export async function removeMovie(movieId: string, addedBy: User) {
    const movieIndex = movies.findIndex(m => m.id === movieId && m.addedBy === addedBy);
    if (movieIndex > -1) {
        movies.splice(movieIndex, 1);
    }
    revalidatePath('/');
}
