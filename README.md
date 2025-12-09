# Film Collab

Welcome to Film Collab! This is a shared movie watchlist application built with Next.js, allowing you and a friend to create and manage a collaborative list of movies.

## Features

-   **Search for Movies**: Find any movie using the TMDB API.
-   **Collaborative Watchlist**: Two users, 'User A' and 'User B', can add movies to the same lists.
-   **Track Watch Status**: Keep track of which movies are 'To Watch' and which ones have been 'Watched'.
-   **Add Social Links**: Share a related TikTok or Instagram link with each movie you add.
-   **User-Specific Entries**: Both users can add the same movie to the list, and it will be tracked separately for each user.
-   **Remove Movies**: Easily remove movies from the list.

## Tech Stack

-   **Framework**: Next.js (App Router)
-   **Styling**: Tailwind CSS & shadcn/ui
-   **Movie Data**: The Movie Database (TMDB) API
-   **Fonts**: Google Fonts (Space Grotesk & Space Mono)

## Getting Started

The main application page is `src/app/page.tsx`. Server-side logic for fetching and modifying data can be found in `src/app/actions.ts`.