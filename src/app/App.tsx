import React, { useCallback, useState, useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { LibraryScreen, WheelScreen } from "../features/screens/components";
import { useLibrary } from "../features/library/hooks/useLibrary";
import { useWheel } from "../features/wheel/hooks/useWheel";
import { preloadBookCovers } from "../services/coverPreload";

type Screen = "library" | "wheel";

export default function App() {
  const { library, activeIds, addBook, removeBook: removeStoredBook, toggleActive: toggleStoredBook, selectAll: selectAllStored, selectOne } = useLibrary();
  const { activeBooks, rotation, spinning, winner, showWinner, setShowWinner, reset, spin, setSpinning } = useWheel(library, activeIds);
  const [screen, setScreen] = useState<Screen>("library");
  const [direction, setDirection] = useState<1 | -1>(1);
  const [isMobileUI, setIsMobileUI] = useState<boolean>(() => typeof window !== "undefined" ? window.innerWidth <= 480 : false);

  useEffect(() => {
    const onResize = () => setIsMobileUI(window.innerWidth <= 480);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const removeBook = useCallback((id: string) => {
    removeStoredBook(id);
    reset();
  }, [removeStoredBook, reset]);

  const removeMany = useCallback((ids: string[]) => {
    ids.forEach(id => removeStoredBook(id));
    reset();
  }, [removeStoredBook, reset]);

  const clearLibrary = useCallback(() => {
    // remove all books
    library.forEach(b => removeStoredBook(b.id));
    reset();
  }, [library, removeStoredBook, reset]);

  const toggleActive = useCallback((id: string) => {
    toggleStoredBook(id);
    reset();
  }, [reset, toggleStoredBook]);

  const selectAll = useCallback(() => {
    selectAllStored();
    reset();
  }, [reset, selectAllStored]);

  const selectNone = useCallback(() => {
    selectOne();
    reset();
  }, [reset, selectOne]);

  const goToWheel = useCallback(() => {
    preloadBookCovers(activeBooks, activeBooks.length);
    setDirection(1);
    setScreen("wheel");
  }, [activeBooks]);

  const goToLibrary = useCallback(() => {
    setDirection(-1);
    setScreen("library");
    setShowWinner(false);
    setSpinning(false);
  }, [setShowWinner, setSpinning]);

  const slideVariants = {
    enter: (value: number) => ({ x: value > 0 ? "100%" : "-100%", opacity: 0 }),
    center: { x: "0%", opacity: 1 },
    exit: (value: number) => ({ x: value > 0 ? "-100%" : "100%", opacity: 0 }),
  };

  const rootStyle: React.CSSProperties = isMobileUI
    ? { minHeight: "100vh", display: "flex", alignItems: "stretch", justifyContent: "stretch", background: "linear-gradient(145deg, #DDD0BC 0%, #C8B89E 45%, #D5C5AD 100%)", padding: 0, margin: 0 }
    : { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(145deg, #DDD0BC 0%, #C8B89E 45%, #D5C5AD 100%)", padding: 16 };

  const phoneStyle: React.CSSProperties = isMobileUI
    ? { position: "relative", width: "100vw", height: "100vh", overflow: "hidden", background: "var(--background, #F8F2E5)", borderRadius: 0 }
    : {
        position: "relative",
        width: "min(390px, 92vw)",
        aspectRatio: "390 / 844",
        height: "auto",
        maxHeight: "calc(100vh - 32px)",
        overflow: "hidden",
        boxSizing: "border-box",
        background: "var(--background, #F8F2E5)",
        borderRadius: 44,
        boxShadow: "0 40px 100px rgba(44,26,14,0.35), 0 0 0 1px rgba(139,100,70,0.15), inset 0 0 0 1px rgba(255,255,255,0.45)",
      };

  return (
    <div style={rootStyle}>
      <div style={phoneStyle}>
        <AnimatePresence initial={false} custom={direction} mode="wait">
          {screen === "library" ? (
            <motion.div key="library" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ type: "spring", damping: 32, stiffness: 300 }} style={{ position: "absolute", inset: 0, zIndex: 2 }}>
              <LibraryScreen library={library} onAdd={addBook} onRemove={removeBook} onRemoveMany={removeMany} onClearAll={clearLibrary} onViewDetail={() => {}} onGoToWheel={goToWheel} />
            </motion.div>
          ) : (
            <motion.div key="wheel" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ type: "spring", damping: 32, stiffness: 300 }} style={{ position: "absolute", inset: 0, zIndex: 2 }}>
              <WheelScreen library={library} activeIds={activeIds} rotation={rotation} spinning={spinning} onSpin={spin} onBack={goToLibrary} winner={winner} showWinner={showWinner} onCloseWinner={() => setShowWinner(false)} onGoHome={goToLibrary} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
