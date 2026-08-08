import { useCallback, useMemo, useState } from "react";
import { WHEEL_SPIN_DURATION_MS, winnerFromRotation } from "../utils/wheel";
import type { Book } from "../../../types/book";

export function useWheel(library: Book[], activeIds: Set<string>) {
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState<Book | null>(null);
  const [showWinner, setShowWinner] = useState(false);
  const activeBooks = useMemo(() => library.filter((book) => activeIds.has(book.id)), [library, activeIds]);

  const reset = useCallback(() => {
    setRotation(0);
    setShowWinner(false);
  }, []);

  const spin = useCallback(() => {
    if (spinning || activeBooks.length < 2) return;
    const next = rotation + 1800 + Math.floor(Math.random() * 1080);
    setRotation(next);
    setSpinning(true);
    setShowWinner(false);
    window.setTimeout(() => {
      setSpinning(false);
      setWinner(winnerFromRotation(next, activeBooks));
      setShowWinner(true);
    }, WHEEL_SPIN_DURATION_MS);
  }, [activeBooks, rotation, spinning]);

  return { activeBooks, rotation, spinning, winner, showWinner, setShowWinner, reset, spin, setSpinning };
}
