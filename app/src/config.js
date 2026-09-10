// Reads the TMDB API key from the environment at build time (Vite inlines
// any VITE_-prefixed variable into the client bundle). Get a free key at:
// https://www.themoviedb.org/settings/api
export const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY || "";
export const TMDB_BASE_URL = "https://api.themoviedb.org/3";
export const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";
export const BACKDROP_BASE_URL = "https://image.tmdb.org/t/p/original";

export const hasApiKey = () => Boolean(TMDB_API_KEY);
