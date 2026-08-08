export interface Book {
  id: string;
  title: string;
  short: string;
  author: string;
  coverUrl: string | null;
  c1: string;
  c2: string;
  pages: number;
  genre: string;
  subjects: string[];
  rating: number;
  publisher?: string;
  year?: number;
}

export interface OpenLibraryDocument {
  key: string;
  title?: string;
  author_name?: string[];
  number_of_pages_median?: number;
  cover_i?: number;
  subject?: string[];
  ratings_average?: number;
  publisher?: string[];
  first_publish_year?: number;
}
