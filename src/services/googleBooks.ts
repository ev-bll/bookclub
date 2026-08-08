export async function resolveGoogleBooksCover(title: string, author: string): Promise<string | null> {
  try {
    const query = encodeURIComponent(`${title} ${author}`);
    const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${query}&maxResults=3`);
    const data = await response.json() as { items?: Array<{ volumeInfo?: { imageLinks?: { thumbnail?: string; smallThumbnail?: string } } }> };
    for (const item of data.items ?? []) {
      const image = item.volumeInfo?.imageLinks?.thumbnail ?? item.volumeInfo?.imageLinks?.smallThumbnail;
      if (image) return image.replace("http:", "https:").replace("zoom=1", "zoom=2");
    }
  } catch {
    // A missing Google Books cover should not prevent the fallback cover from rendering.
  }
  return null;
}
