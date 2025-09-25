import React, { useState, useEffect } from "react";

export default function BookFinder() {
  const [query, setQuery] = useState("");
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [favorites, setFavorites] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);

  // Filters
  const [authorFilter, setAuthorFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");

  // Tab: "search" or "favorites"
  const [tab, setTab] = useState("search");

  // Load favorites from localStorage
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("favorites") || "[]");
    setFavorites(saved);
  }, []);

  const saveFavorites = (book) => {
    let updated;
    if (favorites.some((b) => b.key === book.key)) {
      updated = favorites.filter((b) => b.key !== book.key);
    } else {
      updated = [...favorites, book];
    }
    setFavorites(updated);
    localStorage.setItem("favorites", JSON.stringify(updated));
  };

  const searchBooks = async (e, nextPage = 1) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch(
        `https://openlibrary.org/search.json?title=${encodeURIComponent(
          query
        )}&page=${nextPage}`
      );
      const data = await res.json();

      if (data.docs && data.docs.length > 0) {
        setBooks(nextPage === 1 ? data.docs : [...books, ...data.docs]);
        setPage(nextPage);
      } else {
        setError("No books found.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Apply filters
  const filteredBooks = books.filter((book) => {
    const authorMatch = authorFilter
      ? book.author_name?.some((a) =>
          a.toLowerCase().includes(authorFilter.toLowerCase())
        )
      : true;

    const yearMatch = yearFilter
      ? book.first_publish_year === parseInt(yearFilter)
      : true;

    return authorMatch && yearMatch;
  });

  // Decide which books to display based on active tab
  const displayBooks = tab === "search" ? filteredBooks : favorites;

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 md:p-8">
      <h1 className="text-3xl font-bold text-center mb-6">📚 Book Finder</h1>

      {/* Tabs */}
      <div className="flex justify-center gap-4 mb-6">
        <button
          className={`px-4 py-2 rounded-lg font-semibold transition duration-300 ${
            tab === "search"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
          onClick={() => setTab("search")}
        >
          Search
        </button>
        <button
          className={`px-4 py-2 rounded-lg font-semibold transition duration-300 ${
            tab === "favorites"
              ? "bg-green-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
          onClick={() => setTab("favorites")}
        >
          Favorites ({favorites.length})
        </button>
      </div>

      {/* Only show search and filters when tab is "search" */}
      {tab === "search" && (
        <>
          {/* Search Form */}
          <form
            onSubmit={(e) => searchBooks(e, 1)}
            className="flex flex-col sm:flex-row justify-center mb-4 gap-2"
          >
            <input
              type="text"
              placeholder="Enter book title..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transform transition duration-300 hover:scale-105"
            >
              Search
            </button>
          </form>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row justify-center gap-2 mb-6">
            <input
              type="text"
              placeholder="Filter by author..."
              value={authorFilter}
              onChange={(e) => setAuthorFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 w-full sm:w-48 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              type="number"
              placeholder="Filter by year..."
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 w-full sm:w-32 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </>
      )}

      {loading && <p className="text-center">Loading...</p>}
      {error && <p className="text-center text-red-500">{error}</p>}

      {/* Books Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {displayBooks.map((book, index) => (
          <div
            key={book.key || index}
            className="bg-white shadow-md rounded-xl p-4 flex flex-col items-center relative cursor-pointer transform transition duration-300 hover:scale-105 hover:shadow-xl hover:translate-y-[-2px]"
          >
            {book.cover_i ? (
              <img
                src={`https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`}
                alt={book.title}
                className="w-32 h-48 object-cover rounded-md mb-3 transform transition duration-300 hover:scale-105"
                onClick={() => setSelectedBook(book)}
              />
            ) : (
              <div
                className="w-32 h-48 bg-gray-300 flex items-center justify-center rounded-md mb-3 transform transition duration-300 hover:scale-105"
                onClick={() => setSelectedBook(book)}
              >
                <span className="text-sm text-gray-600">No Cover</span>
              </div>
            )}

            <h2 className="text-lg font-semibold text-center">{book.title}</h2>
            <p className="text-sm text-gray-600">
              {book.author_name ? book.author_name.join(", ") : "Unknown Author"}
            </p>
            <p className="text-sm text-gray-500">{book.first_publish_year || "N/A"}</p>

            {/* Favorite Heart */}
            <button
              onClick={() => saveFavorites(book)}
              className={`absolute top-2 right-2 text-xl transform transition duration-300 hover:scale-125 ${
                favorites.some((b) => b.key === book.key) ? "text-red-500" : "text-gray-400"
              }`}
            >
              ♥
            </button>
          </div>
        ))}
      </div>

      {/* Load More Button (only for search tab) */}
      {tab === "search" && books.length > 0 && (
        <div className="flex justify-center mt-6">
          <button
            onClick={() => searchBooks(null, page + 1)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transform transition duration-300 hover:scale-105"
          >
            Load More
          </button>
        </div>
      )}

      {/* Book Details Modal with Fade + Scale */}
      {selectedBook && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 transition-opacity duration-500 ease-out">
          <div className="bg-white p-6 rounded-lg w-80 relative transform transition duration-500 scale-90 opacity-0 animate-fadeIn">
            <button
              className="absolute top-2 right-2 text-gray-600 text-xl"
              onClick={() => setSelectedBook(null)}
            >
              ×
            </button>
            <h2 className="text-xl font-bold mb-2">{selectedBook.title}</h2>
            <p className="text-sm mb-1">
              Author: {selectedBook.author_name ? selectedBook.author_name.join(", ") : "Unknown"}
            </p>
            <p className="text-sm mb-1">
              First Published: {selectedBook.first_publish_year || "N/A"}
            </p>
            <p className="text-sm">
              Publisher: {selectedBook.publisher ? selectedBook.publisher.join(", ") : "N/A"}
            </p>
          </div>
        </div>
      )}

      <style>
        {`
          @keyframes fadeIn {
            0% {opacity: 0; transform: scale(0.9);}
            100% {opacity: 1; transform: scale(1);}
          }
          .animate-fadeIn {
            animation: fadeIn 0.3s forwards;
          }
        `}
      </style>
    </div>
  );
}
