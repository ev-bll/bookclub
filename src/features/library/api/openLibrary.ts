import { FALLBACK_COLORS } from "../../../constants/books";
import type { Book, OpenLibraryDocument } from "../../../types/book";

const SUBJECT_TRANSLATIONS: [RegExp, string][] = [
  [/fiction/i, "Ficción"], [/non.?fiction/i, "No ficción"], [/novel/i, "Novela"],
  [/short stor/i, "Cuentos"], [/horror|terror/i, "Terror"], [/romance/i, "Romance"],
  [/thriller/i, "Thriller"], [/mystery|detective/i, "Misterio"], [/crime/i, "Crimen"],
  [/fantasy/i, "Fantasía"], [/science fiction|sci.fi/i, "Ciencia ficción"], [/adventure/i, "Aventura"],
  [/historical/i, "Histórico"], [/biography|memoir/i, "Biografía"], [/autobiography/i, "Autobiografía"],
  [/self.help/i, "Autoayuda"], [/poetry|poems/i, "Poesía"], [/children|juvenile/i, "Infantil"],
  [/young adult/i, "Juvenil"], [/graphic novel/i, "Novela gráfica"], [/comic/i, "Cómic"],
  [/philosophy/i, "Filosofía"], [/psychology/i, "Psicología"], [/history/i, "Historia"],
  [/politics/i, "Política"], [/economics/i, "Economía"], [/science/i, "Ciencia"],
  [/nature/i, "Naturaleza"], [/travel/i, "Viajes"], [/cooking|food/i, "Gastronomía"],
  [/art/i, "Arte"], [/music/i, "Música"], [/sport/i, "Deporte"], [/war/i, "Guerra"],
  [/love/i, "Amor"], [/family/i, "Familia"], [/coming.of.age/i, "Iniciática"],
  [/dystop/i, "Distopía"], [/utop/i, "Utopía"], [/mythology/i, "Mitología"],
  [/magic/i, "Magia"], [/supernatural/i, "Sobrenatural"], [/gothic/i, "Gótico"],
  [/classic/i, "Clásico"], [/literature/i, "Literatura"], [/drama/i, "Drama"],
  [/humor|comedy/i, "Humor"], [/satire/i, "Sátira"], [/religion|spiritual/i, "Espiritualidad"],
  [/lgbtq|queer/i, "LGBTQ+"], [/feminist/i, "Feminismo"],
];

function translateSubject(subject: string): string {
  const clean = subject.split(/[-–—]/)[0].trim();
  for (const [pattern, translation] of SUBJECT_TRANSLATIONS) {
    if (pattern.test(clean)) return translation;
  }
  return clean.length > 22 ? `${clean.slice(0, 20)}…` : clean;
}

function toBook(doc: OpenLibraryDocument, index: number): Book {
  const title = doc.title ?? "Sin título";
  const words = title.split(/\s+/);
  const colors = FALLBACK_COLORS[index % FALLBACK_COLORS.length];
  const rawGenre = doc.subject?.[0]?.split(/[-–—]/)[0]?.trim() ?? "Literatura";
  return {
    id: doc.key.replace("/works/", ""), title,
    short: words.length <= 2 ? title : words.slice(0, 2).join(" "),
    author: doc.author_name?.[0] ?? "Autor desconocido",
    coverUrl: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg` : null,
    c1: colors[0], c2: colors[1], pages: doc.number_of_pages_median ?? 0,
    genre: rawGenre.length > 22 ? `${rawGenre.slice(0, 20)}…` : rawGenre,
    subjects: [...new Set((doc.subject ?? []).map(translateSubject))].slice(0, 5),
    rating: doc.ratings_average ? Math.round(doc.ratings_average * 10) / 10 : 0,
    publisher: doc.publisher?.[0], year: doc.first_publish_year,
  };
}

export async function searchBooks(query: string): Promise<Book[]> {
  const response = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=10`);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json() as { docs?: OpenLibraryDocument[] };
  return (data.docs ?? []).filter((document) => document.title).map(toBook);
}

export async function getBookSynopsis(bookId: string): Promise<string | null> {
  const response = await fetch(`https://openlibrary.org/works/${bookId}.json`);
  const data = await response.json() as { description?: string | { value?: string } };
  const description = data.description;
  const raw = typeof description === "string" ? description : description?.value ?? null;
  if (!raw) return null;

  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=es&dt=t&q=${encodeURIComponent(raw)}`;
    const translation = await fetch(url).then((result) => result.json()) as [Array<[string]>];
    return translation[0]?.map(([text]) => text).join("") ?? raw;
  } catch {
    return raw;
  }
}
