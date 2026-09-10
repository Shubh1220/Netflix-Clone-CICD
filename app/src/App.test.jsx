import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

vi.mock("./config.js", () => ({
  hasApiKey: vi.fn(),
  IMAGE_BASE_URL: "https://image.tmdb.org/t/p/w500",
  BACKDROP_BASE_URL: "https://image.tmdb.org/t/p/original",
}));

vi.mock("./api/tmdb.js", () => ({
  getTrending: vi.fn(),
  getTopRated: vi.fn(),
  getByGenre: vi.fn(),
  searchMovies: vi.fn(),
  GENRES: { action: 28, comedy: 35, horror: 27, documentary: 99 },
}));

import App from "./App.jsx";
import { hasApiKey } from "./config.js";
import { getTrending, getTopRated, getByGenre } from "./api/tmdb.js";

describe("App", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows the API key notice when no key is configured", async () => {
    hasApiKey.mockReturnValue(false);

    render(<App />);

    expect(screen.getByText("STREAMFLIX")).toBeInTheDocument();
    expect(
      screen.getByText(/Add a TMDB API key to load real movies/i)
    ).toBeInTheDocument();
  });

  it("loads and renders movie rows when a key is configured", async () => {
    hasApiKey.mockReturnValue(true);
    const sampleMovie = {
      id: 1,
      title: "Sample Movie",
      overview: "A sample overview.",
      poster_path: "/sample.jpg",
      backdrop_path: "/sample-backdrop.jpg",
    };
    getTrending.mockResolvedValue({ results: [sampleMovie] });
    getTopRated.mockResolvedValue({ results: [sampleMovie] });
    getByGenre.mockResolvedValue({ results: [sampleMovie] });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("Trending Now")).toBeInTheDocument();
    });

    expect(screen.getAllByTitle("Sample Movie").length).toBeGreaterThan(0);
    expect(screen.getByText("Top Rated")).toBeInTheDocument();
  });

  it("shows an error message if the TMDB request fails", async () => {
    hasApiKey.mockReturnValue(true);
    getTrending.mockRejectedValue(new Error("network down"));
    getTopRated.mockResolvedValue({ results: [] });
    getByGenre.mockResolvedValue({ results: [] });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/Could not load movies/i)).toBeInTheDocument();
    });
  });
});
