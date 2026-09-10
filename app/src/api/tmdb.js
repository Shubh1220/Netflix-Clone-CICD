import { TMDB_API_KEY, TMDB_BASE_URL } from "../config.js";

async function tmdbFetch(path, params = {}) {
  const url = new URL(`${TMDB_BASE_URL}${path}`);
  url.searchParams.set("api_key", TMDB_API_KEY);
  url.searchParams.set("language", "en-US");
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`TMDB request failed: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

// Genre IDs are TMDB's fixed movie-genre ids: https://developer.themoviedb.org/reference/genre-movie-list
export const GENRES = {
  action: 28,
  comedy: 35,
  horror: 27,
  documentary: 99,
};

export function getTrending() {
  return tmdbFetch("/trending/movie/week");
}

export function getTopRated() {
  return tmdbFetch("/movie/top_rated");
}

export function getByGenre(genreId) {
  return tmdbFetch("/discover/movie", { with_genres: genreId, sort_by: "popularity.desc" });
}

export function searchMovies(query) {
  return tmdbFetch("/search/movie", { query });
}
