import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import BookFinder from "./App";

// Mock fetch globally
beforeEach(() => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      json: () =>
        Promise.resolve({
          docs: [
            {
              key: "OL1M",
              title: "Test Book",
              author_name: ["Author One"],
              first_publish_year: 2000,
              cover_i: 12345,
              publisher: ["Test Publisher"],
            },
            {
              key: "OL2M",
              title: "Another Book",
              author_name: ["Other Author"],
              first_publish_year: 1999,
              cover_i: null,
              publisher: ["Other Publisher"],
            },
          ],
        }),
    })
  );
  localStorage.clear();
});

describe("BookFinder Component", () => {
  test("renders app title", () => {
    render(<BookFinder />);
    expect(
      screen.getByRole("heading", { name: /book finder/i })
    ).toBeInTheDocument();
  });

  test("can search and display results", async () => {
    render(<BookFinder />);

    fireEvent.change(screen.getByPlaceholderText(/enter book title/i), {
      target: { value: "Harry Potter" },
    });

    fireEvent.click(screen.getByRole("button", { name: /search books/i }));

    expect(await screen.findByText(/test book/i)).toBeInTheDocument();
    expect(screen.getByText(/author one/i)).toBeInTheDocument();
  });

  test("shows error when no books found", async () => {
    global.fetch.mockImplementationOnce(() =>
      Promise.resolve({ json: () => Promise.resolve({ docs: [] }) })
    );

    render(<BookFinder />);

    fireEvent.change(screen.getByPlaceholderText(/enter book title/i), {
      target: { value: "Unknown" },
    });
    fireEvent.click(screen.getByRole("button", { name: /search books/i }));

    expect(
      await screen.findByText(/no books found/i)
    ).toBeInTheDocument();
  });

  test("filters by author", async () => {
    render(<BookFinder />);

    fireEvent.change(screen.getByPlaceholderText(/enter book title/i), {
      target: { value: "Books" },
    });
    fireEvent.click(screen.getByRole("button", { name: /search books/i }));

    expect(await screen.findByText(/test book/i)).toBeInTheDocument();

    // Apply filter for "Author One"
    fireEvent.change(screen.getByPlaceholderText(/filter by author/i), {
      target: { value: "Author One" },
    });

    expect(screen.getByText(/test book/i)).toBeInTheDocument();
    expect(screen.queryByText(/another book/i)).not.toBeInTheDocument();
  });

  test("filters by year", async () => {
    render(<BookFinder />);

    fireEvent.change(screen.getByPlaceholderText(/enter book title/i), {
      target: { value: "Books" },
    });
    fireEvent.click(screen.getByRole("button", { name: /search books/i }));

    expect(await screen.findByText(/test book/i)).toBeInTheDocument();

    // Apply filter for year 1999
    fireEvent.change(screen.getByPlaceholderText(/filter by year/i), {
      target: { value: "1999" },
    });

    expect(screen.getByText(/another book/i)).toBeInTheDocument();
    expect(screen.queryByText(/test book/i)).not.toBeInTheDocument();
  });

  test("can add and remove favorites", async () => {
    render(<BookFinder />);

    fireEvent.change(screen.getByPlaceholderText(/enter book title/i), {
      target: { value: "Test" },
    });
    fireEvent.click(screen.getByRole("button", { name: /search books/i }));

    const favButton = await screen.findAllByText("♥");

    // Add first book to favorites
    fireEvent.click(favButton[0]);
    expect(screen.getByText(/favorites \(1\)/i)).toBeInTheDocument();

    // Switch to favorites tab
    fireEvent.click(screen.getByRole("button", { name: /favorites/i }));
    expect(await screen.findByText(/test book/i)).toBeInTheDocument();

    // Remove from favorites
    fireEvent.click(screen.getByText("♥"));
    expect(screen.getByText(/favorites \(0\)/i)).toBeInTheDocument();
  });

  test("opens and closes book modal", async () => {
    render(<BookFinder />);

    fireEvent.change(screen.getByPlaceholderText(/enter book title/i), {
      target: { value: "Test" },
    });
    fireEvent.click(screen.getByRole("button", { name: /search books/i }));

    const bookImg = await screen.findByAltText(/test book/i);

    // Open modal
    fireEvent.click(bookImg);
    expect(await screen.findByText(/first published/i)).toBeInTheDocument();

    // Close modal
    fireEvent.click(screen.getByText("×"));
    await waitFor(() =>
      expect(screen.queryByText(/first published/i)).not.toBeInTheDocument()
    );
  });

  test("load more fetches next page", async () => {
    render(<BookFinder />);

    fireEvent.change(screen.getByPlaceholderText(/enter book title/i), {
      target: { value: "More Books" },
    });
    fireEvent.click(screen.getByRole("button", { name: /search books/i }));

    expect(await screen.findByText(/test book/i)).toBeInTheDocument();

    const loadMoreButton = screen.getByRole("button", { name: /load more/i });
    fireEvent.click(loadMoreButton);

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("page=2")
    );
  });
});
