import { useCallback, useEffect, useState } from "react";
import type { Book } from "../../../types/book";

const LIBRARY_KEY = "mpl-library";
const ACTIVE_BOOKS_KEY = "mpl-active";

function readLibrary(): Book[] {
  try {
    return JSON.parse(localStorage.getItem(LIBRARY_KEY) ?? "[]") as Book[];
  } catch {
    return [];
  }
}

function readActiveIds(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(ACTIVE_BOOKS_KEY) ?? "[]") as string[]);
  } catch {
    return new Set();
  }
}

export function useLibrary() {
  const [library, setLibrary] = useState<Book[]>(readLibrary);
  const [activeIds, setActiveIds] = useState<Set<string>>(readActiveIds);

  useEffect(() => {
    localStorage.setItem(LIBRARY_KEY, JSON.stringify(library));
  }, [library]);

  useEffect(() => {
    localStorage.setItem(ACTIVE_BOOKS_KEY, JSON.stringify([...activeIds]));
  }, [activeIds]);

  const addBook = useCallback((book: Book) => {
    setLibrary((current) => current.some((item) => item.id === book.id) ? current : [...current, book]);
    setActiveIds((current) => new Set([...current, book.id]));
  }, []);

  const removeBook = useCallback((id: string) => {
    setLibrary((current) => current.filter((book) => book.id !== id));
    setActiveIds((current) => {
      const next = new Set(current);
      next.delete(id);
      return next;
    });
  }, []);

  const toggleActive = useCallback((id: string) => {
    setActiveIds((current) => {
      if (current.size === 1 && current.has(id)) return current;
      const next = new Set(current);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => setActiveIds(new Set(library.map((book) => book.id))), [library]);
  const selectOne = useCallback(() => {
    if (activeIds.size > 1 && library.length > 0) setActiveIds(new Set([library[0].id]));
  }, [activeIds, library]);

  return { library, activeIds, addBook, removeBook, toggleActive, selectAll, selectOne };
}
