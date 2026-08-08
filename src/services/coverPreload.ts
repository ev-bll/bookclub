import type { Book } from "../types/book";

const preloadedImages = new Map<string, HTMLImageElement>();

/** Starts image requests early so later SVG or img renders can reuse browser cache. */
export function preloadBookCovers(books: Book[], limit = 4) {
  books.slice(0, limit).forEach((book) => {
    if (!book.coverUrl) return;
    if (preloadedImages.has(book.coverUrl)) return;

    const image = new Image();
    image.decoding = "async";
    image.src = book.coverUrl;
    preloadedImages.set(book.coverUrl, image);

    // Decoding now avoids a visible pause when the same image is mounted later.
    void image.decode().catch(() => {
      preloadedImages.delete(book.coverUrl!);
    });
  });
}
