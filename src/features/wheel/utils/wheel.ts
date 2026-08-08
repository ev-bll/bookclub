import type { Book } from "../../../types/book";

export const WHEEL_CENTER = 150;
export const WHEEL_RADIUS = 134;
export const WHEEL_INNER_RADIUS = 52;

const radians = (degrees: number) => (degrees * Math.PI) / 180;

export function piePath(index: number, total: number, radius: number, centerX: number, centerY: number): string {
  const segment = 360 / total;
  const start = -90 + index * segment;
  const end = start + segment;
  const largeArc = segment > 180 ? 1 : 0;
  const x1 = centerX + radius * Math.cos(radians(start));
  const y1 = centerY + radius * Math.sin(radians(start));
  const x2 = centerX + radius * Math.cos(radians(end));
  const y2 = centerY + radius * Math.sin(radians(end));
  return `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
}

export function degreesToRadians(degrees: number) {
  return radians(degrees);
}

export function winnerFromRotation(rotation: number, books: Book[]): Book {
  const segment = 360 / books.length;
  const normalized = (360 - ((rotation % 360 + 360) % 360)) % 360;
  return books[Math.floor(normalized / segment) % books.length];
}
