import React, { useEffect, useState } from "react";
import { hasApiKey, IMAGE_BASE_URL, BACKDROP_BASE_URL } from "./config.js";
import { getTrending, getTopRated, getByGenre, searchMovies, GENRES } from "./api/tmdb.js";

const ROW_DEFS = [
  { name: "Trending Now", fetcher: getTrending },
  { name: "Top Rated", fetcher: getTopRated },
  { name: "Action", fetcher: () => getByGenre(GENRES.action) },
  { name: "Comedy", fetcher: () => getByGenre(GENRES.comedy) },
  { name: "Horror", fetcher: () => getByGenre(GENRES.horror) },
  { name: "Documentaries", fetcher: () => getByGenre(GENRES.documentary) },
];

function MissingApiKeyNotice() {
  return (
    <div className="notice">
      <h2>Add a TMDB API key to load real movies</h2>
      <p>
        This app pulls live catalog data from{" "}
        <a href="https://www.themoviedb.org/" target="_blank" rel="noreferrer">
          The Movie Database (TMDB)
        </a>
        . Get a free API key at{" "}
        <a href="https://www.themoviedb.org/settings/api" target="_blank" rel="noreferrer">
          themoviedb.org/settings/api
        </a>
        , then create <code>app/.env</code> from <code>app/.env.example</code> and set:
      </p>
      <pre>VITE_TMDB_API_KEY=your_key_here</pre>
      <p>Restart <code>npm run dev</code> (or rebuild the Docker image) after adding it.</p>
    </div>
  );
}

function MovieCard({ movie }) {
  const poster = movie.poster_path ? `${IMAGE_BASE_URL}${movie.poster_path}` : null;
  return (
    <div className="card" title={movie.title}>
      {poster ? (
        <img src={poster} alt={movie.title} loading="lazy" />
      ) : (
        <div className="card-fallback">{movie.title}</div>
      )}
      <span className="card-title">{movie.title}</span>
    </div>
  );
}

function Row({ name, movies }) {
  if (!movies || movies.length === 0) return null;
  return (
    <section className="row">
      <h2>{name}</h2>
      <div className="row-scroll">
        {movies.map((m) => (
          <MovieCard key={m.id} movie={m} />
        ))}
      </div>
    </section>
  );
}

export default function App() {
  const [rows, setRows] = useState([]);
  const [hero, setHero] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!hasApiKey()) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        const results = await Promise.all(ROW_DEFS.map((r) => r.fetcher()));
        if (cancelled) return;

        const builtRows = ROW_DEFS.map((r, i) => ({
          name: r.name,
          movies: results[i].results || [],
        }));
        setRows(builtRows);

        const trending = builtRows[0]?.movies || [];
        if (trending.length > 0) {
          const pick = trending[Math.floor(Math.random() * Math.min(trending.length, 10))];
          setHero(pick);
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSearch(e) {
    e.preventDefault();
    const q = query.trim();
    if (!q) {
      setSearchResults(null);
      return;
    }
    setSearching(true);
    try {
      const data = await searchMovies(q);
      setSearchResults(data.results || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setSearching(false);
    }
  }

  const heroBackdrop = hero?.backdrop_path ? `${BACKDROP_BASE_URL}${hero.backdrop_path}` : null;

  return (
    <div className="app">
      <header
        className="hero"
        style={heroBackdrop ? { backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.5), rgba(11,11,15,1)), url(${heroBackdrop})` } : undefined}
      >
        <div className="nav">
          <span className="brand">STREAMFLIX</span>
          <form onSubmit={handleSearch} className="search-form">
            <input
              type="text"
              placeholder="Search movies..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button type="submit">{searching ? "..." : "Search"}</button>
          </form>
        </div>

        {hero && (
          <div className="hero-content">
            <h1>{hero.title}</h1>
            <p>{hero.overview}</p>
          </div>
        )}
        {!hero && !loading && hasApiKey() && (
          <div className="hero-content">
            <h1>StreamFlix</h1>
            <p>A live movie catalog, powered by TMDB and deployed by the CI/CD pipeline.</p>
          </div>
        )}
      </header>

      <main>
        {!hasApiKey() && <MissingApiKeyNotice />}

        {hasApiKey() && loading && <p className="status">Loading movies...</p>}

        {hasApiKey() && error && (
          <p className="status error">Could not load movies: {error}</p>
        )}

        {searchResults !== null && (
          <Row name={`Search results for "${query}"`} movies={searchResults} />
        )}

        {!loading &&
          !error &&
          rows.map((row) => <Row key={row.name} name={row.name} movies={row.movies} />)}
      </main>

      <footer>
        <p>Demo app for the Jenkins DevSecOps CI/CD pipeline project. Movie data via TMDB.</p>
      </footer>
    </div>
  );
}
