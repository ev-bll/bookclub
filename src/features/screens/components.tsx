import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, BookOpen, Check, ChevronLeft, Plus, Search, SlidersHorizontal, Star, Trash2, X } from "lucide-react";
import { SEARCH_SUGGESTIONS } from "../../constants/books";
import { getBookSynopsis, searchBooks } from "../library/api/openLibrary";
import { degreesToRadians as rad, piePath } from "../wheel/utils/wheel";
import { resolveGoogleBooksCover } from "../../services/googleBooks";
import type { Book } from "../../types/book";

function CoverImage({ book, style }: { book: Book; style?: React.CSSProperties }) {
  const [src, setSrc] = useState<string | null>(book.coverUrl);
  const triedGB       = React.useRef(false);

  useEffect(() => {
    setSrc(book.coverUrl);
    triedGB.current = false;
  }, [book.id]);

  if (!src) return null;
  return (
    <img
      key={src}
      src={src}
      alt={book.title}
      style={style}
      onError={async e => {
        (e.currentTarget as HTMLImageElement).style.visibility = "hidden";
        if (triedGB.current) { setSrc(null); return; }
        triedGB.current = true;
        const gb = await resolveGoogleBooksCover(book.title, book.author);
        setSrc(gb);
      }}
    />
  );
}

function StatusBar() {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 32px 4px", color: "rgba(44,26,14,0.5)" }}>
      <span style={{ fontSize: 13, fontFamily: "DM Sans, sans-serif", fontWeight: 600 }}>9:41</span>
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        <svg width="16" height="11" viewBox="0 0 16 11" fill="currentColor">
          <rect x="0" y="5" width="2.5" height="6" rx="0.5" opacity="0.4" />
          <rect x="4" y="3" width="2.5" height="8" rx="0.5" opacity="0.65" />
          <rect x="8" y="1" width="2.5" height="10" rx="0.5" opacity="0.85" />
          <rect x="12" y="0" width="2.5" height="11" rx="0.5" />
        </svg>
        <svg width="14" height="11" viewBox="0 0 14 11" fill="currentColor">
          <circle cx="7" cy="9.5" r="1.4" />
          <path d="M3.5 6.5Q5 4.5 7 4.5Q9 4.5 10.5 6.5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.7" />
          <path d="M1 4Q3.5 1 7 1Q10.5 1 13 4" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.4" />
        </svg>
        <svg width="25" height="12" viewBox="0 0 25 12" fill="none">
          <rect x="0.5" y="0.5" width="21" height="11" rx="3.5" stroke="currentColor" strokeOpacity="0.35" />
          <rect x="2" y="2" width="17" height="8" rx="2" fill="currentColor" />
          <path d="M23 4.5C23.8 4.8 24.5 5.4 24.5 6S23.8 7.2 23 7.5Z" fill="currentColor" fillOpacity="0.4" />
        </svg>
      </div>
    </div>
  );
}

// ─── BookWheelSVG ─────────────────────────────────────────────────────────────

const CX = 150, CY = 150, WR = 134, IR = 52;

function BookWheelSVG({ books, rotation, spinning }: { books: Book[]; rotation: number; spinning: boolean }) {
  const [failedCovers, setFailedCovers] = useState<Set<string>>(new Set());
  useEffect(() => {
    books.forEach(b => {
      if (!b.coverUrl) return;
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        if (img.naturalWidth < 10) {
          setFailedCovers(prev => new Set(prev).add(b.id));
        }
      };
      img.onerror = () => setFailedCovers(prev => new Set(prev).add(b.id));
      img.src = b.coverUrl;
    });
  }, [books.map(b => b.id).join(",")]);
  const n       = books.length;
  const sdeg    = n > 0 ? 360 / n : 360;
  const coverR  = (WR + IR) / 2;
  const imgSize = Math.max(WR - IR + 40, 2 * WR * Math.sin(rad(sdeg / 2)) + 20);
  const titleSz = sdeg >= 50 ? 8.5 : 7;
  const textR1  = IR + 22;
  const lgS     = (IR / WR * 100).toFixed(1);
  const lgE     = ((IR + 52) / WR * 100).toFixed(1);
  const lights  = Array.from({ length: 18 }, (_, i) => {
    const a = (360 / 18) * i - 90;
    return { x: CX + (WR + 13) * Math.cos(rad(a)), y: CY + (WR + 13) * Math.sin(rad(a)), big: i % 3 === 0 };
  });

  return (
    <svg width="300" height="300" viewBox="0 0 300 300" style={{ overflow: "visible" }}>
      <defs>
        {books.map((b, i) => (
          <linearGradient key={i} id={`wsg${i}-${n}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={b.c1} /><stop offset="100%" stopColor={b.c2} />
          </linearGradient>
        ))}
        {books.map((_, i) => (
          <clipPath key={i} id={`wcp${i}-${n}`}>
            <path d={piePath(i, n, WR, CX, CY)} />
          </clipPath>
        ))}
        {books.map((_, i) => {
          const startA = -90 + i * sdeg;
          const endA   = startA + sdeg;
          const r      = textR1;
          const x1 = CX + r * Math.cos(rad(startA));
          const y1 = CY + r * Math.sin(rad(startA));
          const x2 = CX + r * Math.cos(rad(endA));
          const y2 = CY + r * Math.sin(rad(endA));
          const large = sdeg > 180 ? 1 : 0;
          return (
            <path key={i} id={`warc${i}-${n}`}
              d={`M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`}
              fill="none" />
          );
        })}
        <radialGradient id="innerLight" cx={CX} cy={CY} r={WR} gradientUnits="userSpaceOnUse">
          <stop offset={`${lgS}%`} stopColor="rgba(253,248,238,0.95)" />
          <stop offset={`${lgE}%`} stopColor="rgba(253,248,238,0.0)" />
        </radialGradient>
        <radialGradient id="rim" cx={CX} cy={CY} r={WR} gradientUnits="userSpaceOnUse">
          <stop offset="68%" stopColor="rgba(0,0,0,0)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.26)" />
        </radialGradient>
        <radialGradient id="btnFill" cx="38%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#FFFDF8" /><stop offset="100%" stopColor="#F2E8D8" />
        </radialGradient>
        <filter id="wglow" x="-25%" y="-25%" width="150%" height="150%">
          <feDropShadow dx="0" dy="6" stdDeviation="16" floodColor="#6B3010" floodOpacity="0.22" />
        </filter>
      </defs>
      <circle cx={CX} cy={CY} r={WR + 28} fill="none" stroke="rgba(244,162,97,0.10)" strokeWidth="40" />
      {lights.map((lt, i) => (
        <circle key={i} cx={lt.x} cy={lt.y} r={lt.big ? 3.2 : 2}
          fill={lt.big ? "#F4A261" : "#FCD9A8"} opacity={lt.big ? 0.82 : 0.5} />
      ))}
      <g filter="url(#wglow)" style={{ transformOrigin: `${CX}px ${CY}px`, transform: `rotate(${rotation}deg)`, transition: spinning ? "transform 4s cubic-bezier(0.08, 0.82, 0.18, 1)" : "none", willChange: "transform" }}>
        {books.map((b, i) => {
          const mid = -90 + (i + 0.5) * sdeg;
          const rot = mid + 90;
          const sx  = CX + coverR * Math.cos(rad(mid));
          const sy  = CY + coverR * Math.sin(rad(mid));
          return (
            <g key={b.id}>
              <path d={piePath(i, n, WR, CX, CY)} fill={`url(#wsg${i}-${n})`} />
              <g clipPath={`url(#wcp${i}-${n})`}>
                {(!b.coverUrl || failedCovers.has(b.id)) && (
                  <path d={piePath(i, n, WR, CX, CY)} fill={b.c1} />
                )}
                {b.coverUrl && !failedCovers.has(b.id) && (
                  <g transform={`rotate(${rot}, ${sx}, ${sy})`}>
                    <image href={b.coverUrl} x={sx - imgSize / 2} y={sy - imgSize / 2}
                      width={imgSize} height={imgSize} preserveAspectRatio="xMidYMid slice" />
                  </g>
                )}
                {b.coverUrl && !failedCovers.has(b.id) && <path d={piePath(i, n, WR, CX, CY)} fill="url(#innerLight)" />}
                <path d={piePath(i, n, WR, CX, CY)} fill="url(#rim)" />
              </g>
              <path d={piePath(i, n, WR, CX, CY)} fill="none" stroke="rgba(253,248,239,0.6)" strokeWidth="1.5" />
              {sdeg >= 26 && (
                <text fontSize={titleSz} fontFamily="Playfair Display, serif" fontWeight="700"
                  fill={failedCovers.has(b.id) || !b.coverUrl ? "rgba(255,255,255,0.92)" : "#2C1A0E"}>
                  <textPath href={`#warc${i}-${n}`} startOffset="50%" textAnchor="middle">
                    {b.short}
                  </textPath>
                </text>
              )}
            </g>
          );
        })}
      </g>
      <circle cx={CX} cy={CY} r={WR + 0.5} fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2.5" />
      <circle cx={CX} cy={CY} r={WR - 0.5} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="1" />
      <circle cx={CX} cy={CY} r={IR + 7}   fill="rgba(181,100,58,0.07)" />
      <circle cx={CX} cy={CY} r={IR + 2}   fill="rgba(181,100,58,0.14)" stroke="rgba(181,100,58,0.22)" strokeWidth="1" />
      <circle cx={CX} cy={CY} r={IR}        fill="url(#btnFill)" />
      <text x={CX} y={CY - 6} textAnchor="middle" dominantBaseline="middle"
        fontSize={10} fontFamily="Playfair Display, serif" fontWeight="700" fill="#B5643A" letterSpacing="0.10em">GIRAR</text>
      <text x={CX} y={CY + 6} textAnchor="middle" dominantBaseline="middle"
        fontSize={5} fontFamily="DM Sans, sans-serif" fontWeight="400" fill="#8A7060">para elegir</text>
    </svg>
  );
}

function WheelSection({ books, rotation, spinning, onSpin }: {
  books: Book[]; rotation: number; spinning: boolean; onSpin: () => void;
}) {
  const canSpin = books.length >= 2;
  return (
    <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", userSelect: "none" }}>
      <div style={{ marginBottom: -6, zIndex: 10, position: "relative" }}>
        <svg width="26" height="22" viewBox="0 0 26 22">
          <path d="M13 20 L2 4 Q13 -3 24 4 Z" fill="#B5643A" />
          <path d="M13 18 L6 6 Q13 0 20 6 Z" fill="#C4956A" />
          <circle cx="13" cy="20" r="3" fill="#B5643A" />
        </svg>
      </div>
      <div style={{ position: "relative", display: "inline-block" }}>
        <BookWheelSVG books={books} rotation={rotation} spinning={spinning} />
        <button onClick={onSpin} disabled={spinning || !canSpin}
          style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 107, height: 107, borderRadius: "50%", background: !canSpin ? "radial-gradient(circle at 38% 32%, #C0A890, #9A8070)" : spinning ? "radial-gradient(circle at 38% 32%, #C47A50, #9A3E22)" : "radial-gradient(circle at 38% 32%, #D4845A, #A04A28)", boxShadow: (spinning || !canSpin) ? "0 2px 10px rgba(181,100,58,0.2)" : "0 5px 22px rgba(181,100,58,0.48), 0 0 0 4px rgba(197,149,106,0.22), inset 0 1px 3px rgba(255,255,255,0.28)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: (spinning || !canSpin) ? "default" : "pointer", transition: "all 0.3s", border: "none" }}
          onMouseDown={e => { if (canSpin && !spinning) (e.currentTarget as HTMLElement).style.transform = "translate(-50%, -50%) scale(0.94)"; }}
          onMouseUp={e => { (e.currentTarget as HTMLElement).style.transform = "translate(-50%, -50%) scale(1)"; }}>
          <span style={{ fontFamily: "Playfair Display, serif", fontSize: 13, fontWeight: 700, letterSpacing: "0.2em", color: "rgba(255,255,255,0.95)" }}>
            {spinning ? "···" : "GIRAR"}
          </span>
          {!spinning && canSpin && (
            <span style={{ fontFamily: "DM Sans, sans-serif", fontSize: 7.5, color: "rgba(255,255,255,0.62)", textAlign: "center", lineHeight: 1.3, marginTop: 3, paddingInline: 10 }}>
              Elegir mi próxima lectura
            </span>
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Shared overlays ──────────────────────────────────────────────────────────

function BookDetailPanel({ book, inLibrary, onAdd, onRemove, onClose }: {
  book: Book; inLibrary: boolean;
  onAdd?: (b: Book) => void;
  onRemove?: (id: string) => void;
  onClose: () => void;
}) {
  const [desc, setDesc]               = useState<string | null>(null);
  const [descLoading, setDescLoading] = useState(true);

  useEffect(() => {
    setDesc(null); setDescLoading(true);
    getBookSynopsis(book.id)
      .then(setDesc)
      .catch(() => {})
      .finally(() => setDescLoading(false));
  }, [book.id]);

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}
        onClick={onClose} style={{ position: "absolute", inset: 0, zIndex: 60, background: "rgba(44,26,14,0.42)" }} />
      <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 260 }}
        style={{ position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 70, background: "#FDF9F1", borderRadius: "32px 32px 0 0", maxHeight: "90%", display: "flex", flexDirection: "column", boxShadow: "0 -10px 50px rgba(44,26,14,0.18)" }}>
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 0" }}>
          <div style={{ width: 38, height: 4, borderRadius: 99, background: "rgba(139,100,70,0.2)" }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 22px 0" }}>
          <span style={{ fontFamily: "DM Sans, sans-serif", fontSize: 10.5, fontWeight: 600, color: "#B5643A", letterSpacing: "0.1em" }}>DETALLES DEL LIBRO</span>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: "50%", border: "none", cursor: "pointer", background: "rgba(181,100,58,0.10)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={14} color="#B5643A" />
          </button>
        </div>
        <div style={{ overflowY: "auto", flex: 1, padding: "16px 22px 0", scrollbarWidth: "none" }}>
          <div style={{ display: "flex", gap: 18, marginBottom: 20 }}>
            <div style={{ width: 96, flexShrink: 0, height: 140, borderRadius: 14, overflow: "hidden", background: `linear-gradient(155deg, ${book.c1}, ${book.c2})`, boxShadow: "0 10px 28px rgba(44,26,14,0.22)" }}>
              <CoverImage book={book} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            </div>
            <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <h2 style={{ fontFamily: "Playfair Display, serif", fontSize: 16.5, fontWeight: 600, color: "#2C1A0E", lineHeight: 1.3, margin: "0 0 5px" }}>{book.title}</h2>
              <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: 13, color: "#8A7060", margin: book.year ? "0 0 3px" : "0 0 12px" }}>{book.author}</p>
              {book.year && <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: 12, color: "#A08878", margin: "0 0 12px" }}>{book.year}</p>}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {book.subjects.map((s, i) => (
                  <span key={i} style={{ fontFamily: "DM Sans, sans-serif", fontSize: 10, fontWeight: 600, padding: "3px 10px", borderRadius: 99, background: "rgba(181,100,58,0.12)", color: "#B5643A" }}>{s}</span>
                ))}
                {book.rating > 0 && (
                  <span style={{ display: "flex", alignItems: "center", gap: 3, fontFamily: "DM Sans, sans-serif", fontSize: 10, fontWeight: 500, padding: "3px 10px", borderRadius: 99, background: "rgba(244,162,97,0.12)", color: "#C4884A" }}>
                    <Star size={8} color="#F4A261" fill="#F4A261" />{book.rating.toFixed(1)}
                  </span>
                )}
                {book.pages > 0 && <span style={{ fontFamily: "DM Sans, sans-serif", fontSize: 10, fontWeight: 500, padding: "3px 10px", borderRadius: 99, background: "rgba(139,100,70,0.08)", color: "#8A7060" }}>{book.pages} págs.</span>}
              </div>
            </div>
          </div>
          {book.publisher && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ padding: "11px 14px", borderRadius: 16, background: "rgba(197,149,106,0.10)", border: "1px solid rgba(181,100,58,0.10)" }}>
                <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: 9, fontWeight: 600, color: "#B5643A", letterSpacing: "0.08em", margin: "0 0 3px" }}>EDITORIAL</p>
                <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: 12.5, color: "#2C1A0E", margin: 0, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{book.publisher}</p>
              </div>
            </div>
          )}
          <div style={{ height: 1, background: "rgba(139,100,70,0.10)", marginBottom: 18 }} />
          <div style={{ marginBottom: 28 }}>
            <h3 style={{ fontFamily: "Playfair Display, serif", fontSize: 15, fontWeight: 600, color: "#2C1A0E", margin: "0 0 12px" }}>Sinopsis</h3>
            {descLoading ? (
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0" }}>
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
                  style={{ width: 18, height: 18, borderRadius: "50%", border: "2px solid rgba(181,100,58,0.15)", borderTopColor: "#B5643A", flexShrink: 0 }} />
                <span style={{ fontFamily: "DM Sans, sans-serif", fontSize: 12, color: "rgba(139,100,70,0.55)" }}>Cargando sinopsis...</span>
              </div>
            ) : desc ? (
              <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: 13.5, color: "#4A3420", lineHeight: 1.75, margin: 0 }}>{desc}</p>
            ) : (
              <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: 13.5, color: "rgba(139,100,70,0.5)", lineHeight: 1.7, margin: 0, fontStyle: "italic" }}>No hay sinopsis disponible.</p>
            )}
          </div>
        </div>
        <div style={{ padding: "12px 22px 32px", borderTop: "1px solid rgba(139,100,70,0.08)", background: "#FDF9F1" }}>
          {onRemove ? (
            <button onClick={() => { onRemove(book.id); onClose(); }}
              style={{ width: "100%", padding: "15px 0", borderRadius: 20, border: "none", cursor: "pointer", background: "rgba(181,100,58,0.09)", fontFamily: "DM Sans, sans-serif", fontSize: 15, fontWeight: 600, color: "#B5643A", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <Trash2 size={16} strokeWidth={2} /> Eliminar de mi biblioteca
            </button>
          ) : (
            <button onClick={() => { if (!inLibrary && onAdd) onAdd(book); onClose(); }}
              style={{ width: "100%", padding: "15px 0", borderRadius: 20, border: "none", cursor: "pointer", background: inLibrary ? "rgba(124,145,112,0.18)" : "linear-gradient(135deg, #B5643A, #C4956A)", fontFamily: "DM Sans, sans-serif", fontSize: 15, fontWeight: 600, color: inLibrary ? "#7C9170" : "white", boxShadow: inLibrary ? "none" : "0 5px 18px rgba(181,100,58,0.35)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              {inLibrary ? <><Check size={16} strokeWidth={2.5} /> Ya en tu biblioteca</> : <><Plus size={16} strokeWidth={2.2} /> Añadir a mi biblioteca</>}
            </button>
          )}
        </div>
      </motion.div>
    </>
  );
}

function FilterPanel({ library, activeIds, onToggle, onSelectAll, onSelectNone, onClose }: {
  library: Book[]; activeIds: Set<string>; onToggle: (id: string) => void;
  onSelectAll: () => void; onSelectNone: () => void; onClose: () => void;
}) {
  const count = activeIds.size;
  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} onClick={onClose}
        style={{ position: "absolute", inset: 0, zIndex: 40, background: "rgba(44,26,14,0.35)" }} />
      <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 28, stiffness: 260 }}
        style={{ position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 50, background: "#FDF9F1", borderRadius: "32px 32px 0 0", boxShadow: "0 -10px 50px rgba(44,26,14,0.15)", display: "flex", flexDirection: "column", maxHeight: "82%" }}>
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 0" }}>
          <div style={{ width: 38, height: 4, borderRadius: 99, background: "rgba(139,100,70,0.2)" }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 22px 0" }}>
          <div>
            <h2 style={{ fontFamily: "Playfair Display, serif", fontSize: 20, fontWeight: 600, color: "#2C1A0E", margin: 0 }}>Filtrar ruleta</h2>
            <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: 12, color: "#8A7060", margin: "2px 0 0" }}>{count} {count === 1 ? "libro" : "libros"} activos</p>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: "50%", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(181,100,58,0.10)" }}>
            <X size={14} color="#B5643A" />
          </button>
        </div>
        <div style={{ display: "flex", gap: 8, padding: "12px 22px 0" }}>
          <button onClick={onSelectAll} style={{ flex: 1, padding: "8px 12px", borderRadius: 12, border: "none", cursor: "pointer", background: count === library.length ? "rgba(181,100,58,0.15)" : "rgba(139,100,70,0.08)", fontFamily: "DM Sans, sans-serif", fontSize: 12, fontWeight: 500, color: count === library.length ? "#B5643A" : "#8A7060" }}>Todos</button>
          <button onClick={onSelectNone} disabled={count <= 1} style={{ flex: 1, padding: "8px 12px", borderRadius: 12, border: "none", cursor: count > 1 ? "pointer" : "default", background: "rgba(139,100,70,0.08)", fontFamily: "DM Sans, sans-serif", fontSize: 12, fontWeight: 500, color: count > 1 ? "#8A7060" : "rgba(139,100,70,0.3)" }}>Ninguno</button>
        </div>
        <div style={{ height: 1, background: "rgba(139,100,70,0.1)", margin: "14px 22px 0" }} />
        <div style={{ overflowY: "auto", flex: 1, padding: "8px 16px 16px" }}>
          {library.map(book => {
            const active = activeIds.has(book.id);
            const isLast = active && count === 1;
            return (
              <button key={book.id} onClick={() => { if (!isLast) onToggle(book.id); }} disabled={isLast}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 14, padding: "11px 10px", borderRadius: 18, border: "none", cursor: isLast ? "default" : "pointer", background: active ? "rgba(181,100,58,0.07)" : "transparent", marginBottom: 2 }}>
                <div style={{ width: 36, height: 48, borderRadius: 8, flexShrink: 0, overflow: "hidden", background: `linear-gradient(155deg, ${book.c1}, ${book.c2})`, opacity: active ? 1 : 0.38, boxShadow: active ? "0 3px 10px rgba(44,26,14,0.2)" : "none" }}>
                  <CoverImage book={book} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
                <div style={{ flex: 1, textAlign: "left", minWidth: 0 }}>
                  <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: 13.5, fontWeight: 500, color: active ? "#2C1A0E" : "#A09080", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{book.title}</p>
                  <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: 11, color: active ? "#8A7060" : "#BBA898", margin: "2px 0 0" }}>{book.author}</p>
                </div>
                <div style={{ width: 24, height: 24, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: active ? "#B5643A" : "rgba(139,100,70,0.15)", border: active ? "none" : "1.5px solid rgba(139,100,70,0.25)" }}>
                  {active && <Check size={13} color="white" strokeWidth={2.5} />}
                </div>
              </button>
            );
          })}
        </div>
        <div style={{ padding: "12px 22px 32px" }}>
          <button onClick={onClose} style={{ width: "100%", padding: "15px 0", borderRadius: 20, border: "none", cursor: "pointer", background: "linear-gradient(135deg, #B5643A, #C4956A)", fontFamily: "DM Sans, sans-serif", fontSize: 15, fontWeight: 600, color: "white", boxShadow: "0 5px 18px rgba(181,100,58,0.35)" }}>
            Aplicar · {count} {count === 1 ? "libro" : "libros"}
          </button>
        </div>
      </motion.div>
    </>
  );
}

function WinnerModal({ book, onClose, onSpin }: { book: Book; onClose: () => void; onSpin: () => void }) {
  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} onClick={onClose}
        style={{ position: "absolute", inset: 0, zIndex: 40, background: "rgba(44,26,14,0.38)" }} />
      <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 28, stiffness: 260 }}
        style={{ position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 50, background: "#FDF9F1", borderRadius: "32px 32px 0 0", padding: "0 22px 34px", boxShadow: "0 -10px 50px rgba(44,26,14,0.15)" }}>
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 20px" }}>
          <div style={{ width: 38, height: 4, borderRadius: 99, background: "rgba(139,100,70,0.2)" }} />
        </div>
        <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: 11, color: "#B5643A", fontWeight: 600, textAlign: "center", letterSpacing: "0.12em", marginBottom: 16 }}>✨ EL DESTINO HA ELEGIDO</p>
        <div style={{ display: "flex", gap: 18, alignItems: "flex-start", marginBottom: 22 }}>
          <div style={{ width: 90, height: 126, borderRadius: 18, flexShrink: 0, overflow: "hidden", background: `linear-gradient(155deg, ${book.c1}, ${book.c2})`, boxShadow: "0 10px 28px rgba(44,26,14,0.28)", position: "relative", display: "flex", alignItems: "flex-end", justifyContent: "center", paddingBottom: 10 }}>
            <BookOpen size={26} strokeWidth={1.2} color="rgba(255,255,255,0.35)" />
            <CoverImage book={book} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", display: "block" } as React.CSSProperties} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 10 }}>
              {book.subjects.map((s, i) => (
                <span key={i} style={{ fontFamily: "DM Sans, sans-serif", fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", padding: "3px 10px", borderRadius: 99, background: "rgba(181,100,58,0.12)", color: "#B5643A" }}>{s}</span>
              ))}
            </div>
            <h2 style={{ fontFamily: "Playfair Display, serif", fontSize: 19, fontWeight: 600, color: "#2C1A0E", lineHeight: 1.25, margin: "0 0 5px" }}>{book.title}</h2>
            <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: 13, color: "#8A7060", margin: "0 0 12px" }}>{book.author}</p>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              {book.pages > 0 && <span style={{ fontFamily: "DM Sans, sans-serif", fontSize: 12, color: "#8A7060" }}>{book.pages} págs.</span>}
              {book.rating > 0 && <span style={{ display: "flex", alignItems: "center", gap: 4, fontFamily: "DM Sans, sans-serif", fontSize: 12, color: "#8A7060" }}><Star size={11} color="#F4A261" fill="#F4A261" /> {book.rating.toFixed(1)}</span>}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <button onClick={onClose}
            style={{ width: "100%", padding: "15px 0", borderRadius: 20, border: "none", cursor: "pointer", background: "linear-gradient(135deg, #B5643A, #C4956A)", fontFamily: "DM Sans, sans-serif", fontSize: 15, fontWeight: 600, color: "white", boxShadow: "0 5px 18px rgba(181,100,58,0.38)" }}
            onMouseDown={e => { (e.currentTarget as HTMLElement).style.transform = "scale(0.97)"; }}
            onMouseUp={e => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}>
            ¡Empezar a leer este libro!
          </button>
          <button onClick={() => { onClose(); setTimeout(onSpin, 200); }}
            style={{ width: "100%", padding: "14px 0", borderRadius: 20, border: "none", cursor: "pointer", background: "rgba(181,100,58,0.10)", fontFamily: "DM Sans, sans-serif", fontSize: 14, fontWeight: 500, color: "#B5643A" }}
            onMouseDown={e => { (e.currentTarget as HTMLElement).style.transform = "scale(0.97)"; }}
            onMouseUp={e => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}>
            Girar de nuevo
          </button>
        </div>
      </motion.div>
    </>
  );
}

// ─── Search components ────────────────────────────────────────────────────────

function SearchBar({ value, onChange, onClear }: { value: string; onChange: (v: string) => void; onClear: () => void }) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 320);
    return () => clearTimeout(t);
  }, []);
  return (
    <div style={{ position: "relative" }}>
      <Search size={15} color="#8A7060" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
      <input ref={inputRef} value={value} onChange={e => onChange(e.target.value)} placeholder="Busca por título o autor..."
        style={{ width: "100%", boxSizing: "border-box", padding: "13px 40px 13px 40px", borderRadius: 18, border: "1.5px solid rgba(181,100,58,0.18)", background: "rgba(255,255,255,0.75)", fontFamily: "DM Sans, sans-serif", fontSize: 14, color: "#2C1A0E", outline: "none" }} />
      {value && (
        <button onClick={onClear} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "rgba(139,100,70,0.12)", border: "none", cursor: "pointer", width: 22, height: 22, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <X size={12} color="#8A7060" />
        </button>
      )}
    </div>
  );
}

function SearchResults({ results, loading, libraryIds, onAdd, onRemove, onViewDetail }: {
  results: Book[]; loading: boolean; libraryIds: Set<string>; onAdd: (b: Book) => void; onRemove: (id: string) => void; onViewDetail: (b: Book) => void;
}) {
  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", padding: "40px 0" }}>
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
        style={{ width: 26, height: 26, borderRadius: "50%", border: "2.5px solid rgba(181,100,58,0.15)", borderTopColor: "#B5643A" }} />
    </div>
  );
  if (results.length === 0) return (
    <div style={{ textAlign: "center", padding: "40px 28px" }}>
      <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: 14, color: "#8A7060", margin: 0 }}>Sin resultados</p>
      <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: 12, color: "rgba(139,100,70,0.55)", margin: "6px 0 0" }}>Prueba con otro título o autor</p>
    </div>
  );
  return (
    <div style={{ padding: "8px 14px 12px" }}>
      {results.map(book => {
        const inLib = libraryIds.has(book.id);
        return (
          <div key={book.id} onClick={() => onViewDetail(book)}
            style={{ display: "flex", alignItems: "center", gap: 14, padding: "10px 8px", borderRadius: 16, marginBottom: 2, cursor: "pointer", transition: "background 0.15s" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(197,149,106,0.08)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
            <div style={{ width: 40, height: 56, borderRadius: 7, flexShrink: 0, overflow: "hidden", boxShadow: "0 2px 8px rgba(44,26,14,0.2)", background: `linear-gradient(155deg, ${book.c1}, ${book.c2})` }}>
              <CoverImage book={book} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontFamily: "Playfair Display, serif", fontSize: 14, fontWeight: 600, color: "#2C1A0E", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{book.title}</p>
              <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: 11.5, color: "#8A7060", margin: "2px 0 5px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{book.author}</p>
              <div style={{ display: "flex", gap: 6 }}>
                {book.pages > 0 && <span style={{ fontFamily: "DM Sans, sans-serif", fontSize: 10, color: "rgba(139,100,70,0.55)" }}>{book.pages} p.</span>}
              </div>
            </div>
            <button onClick={e => { e.stopPropagation(); inLib ? onRemove(book.id) : onAdd(book); }}
              style={{ width: 34, height: 34, borderRadius: "50%", border: "none", flexShrink: 0, cursor: "pointer", background: inLib ? "rgba(124,145,112,0.18)" : "#B5643A", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: inLib ? "none" : "0 3px 10px rgba(181,100,58,0.35)", transition: "all 0.2s" }}>
              {inLib ? <Check size={14} color="#7C9170" strokeWidth={2.5} /> : <Plus size={16} color="white" strokeWidth={2.2} />}
            </button>
          </div>
        );
      })}
    </div>
  );
}

function SearchSheet({ library, onAdd, onRemove, onViewDetail, onClose }: {
  library: Book[]; onAdd: (b: Book) => void; onRemove: (id: string) => void; onViewDetail: (b: Book) => void; onClose: () => void;
}) {
  const [query, setQuery]     = useState("");
  const [results, setResults] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const libraryIds = useMemo(() => new Set(library.map(b => b.id)), [library]);

  useEffect(() => {
    if (!query.trim()) { setResults([]); setLoading(false); return; }
    setLoading(true);
    const t = setTimeout(async () => {
      try { setResults(await searchBooks(query)); }
      catch { setResults([]); }
      finally { setLoading(false); }
    }, 500);
    return () => clearTimeout(t);
  }, [query]);

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}
        onClick={onClose} style={{ position: "absolute", inset: 0, zIndex: 40, background: "rgba(44,26,14,0.4)" }} />
      <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 260 }}
        style={{ position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 50, background: "#FDF9F1", borderRadius: "32px 32px 0 0", height: "88%", display: "flex", flexDirection: "column", boxShadow: "0 -10px 50px rgba(44,26,14,0.18)" }}>
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 4px" }}>
          <div style={{ width: 38, height: 4, borderRadius: 99, background: "rgba(139,100,70,0.2)" }} />
        </div>
        <div style={{ padding: "6px 20px 14px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <h2 style={{ fontFamily: "Playfair Display, serif", fontSize: 20, fontWeight: 600, color: "#2C1A0E", margin: 0 }}>Añadir libros</h2>
            <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: "50%", border: "none", cursor: "pointer", background: "rgba(181,100,58,0.10)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <X size={14} color="#B5643A" />
            </button>
          </div>
          <SearchBar value={query} onChange={setQuery} onClear={() => { setQuery(""); setResults([]); }} />
        </div>
        <div style={{ flex: 1, overflowY: "auto", scrollbarWidth: "none" }}>
          {!query.trim() ? (
            <div style={{ padding: "8px 22px 24px" }}>
              <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: 10.5, fontWeight: 600, color: "rgba(139,100,70,0.55)", margin: "0 0 12px", letterSpacing: "0.07em" }}>SUGERENCIAS RÁPIDAS</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {SEARCH_SUGGESTIONS.map(s => (
                  <button key={s} onClick={() => setQuery(s)}
                    style={{ fontFamily: "DM Sans, sans-serif", fontSize: 12, fontWeight: 500, padding: "8px 16px", borderRadius: 99, border: "1.5px solid rgba(181,100,58,0.2)", background: "rgba(197,149,106,0.08)", color: "#8A6050", cursor: "pointer" }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <SearchResults results={results} loading={loading} libraryIds={libraryIds} onAdd={onAdd} onRemove={onRemove} onViewDetail={onViewDetail} />
          )}
        </div>
      </motion.div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCREEN 1 — BIBLIOTECA
// ═══════════════════════════════════════════════════════════════════════════════

function LibraryCard({ book, onTap, onRemove }: { book: Book; onTap: () => void; onRemove: () => void }) {
  return (
    <div onClick={onTap}
      style={{ borderRadius: 18, overflow: "hidden", background: "#FDF9F1", boxShadow: "0 2px 12px rgba(44,26,14,0.09)", cursor: "pointer", display: "flex", flexDirection: "column" }}>
      <div style={{ height: 205, position: "relative", overflow: "hidden", background: `linear-gradient(155deg, ${book.c1}, ${book.c2})` }}>
        <CoverImage book={book} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 55%)" }} />
        <button onClick={e => { e.stopPropagation(); onRemove(); }}
          style={{ position: "absolute", top: 8, right: 8, width: 24, height: 24, borderRadius: "50%", border: "none", cursor: "pointer", background: "rgba(0,0,0,0.32)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <X size={11} color="white" strokeWidth={2.5} />
        </button>
      </div>
      <div style={{ padding: "9px 11px 12px" }}>
        <p style={{ fontFamily: "Playfair Display, serif", fontSize: 12.5, fontWeight: 600, color: "#2C1A0E", margin: 0, lineHeight: 1.3, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{book.title}</p>
        <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: 10.5, color: "#8A7060", margin: "3px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{book.author}</p>
      </div>
    </div>
  );
}

export function LibraryScreen({ library, onAdd, onRemove, onViewDetail, onGoToWheel }: {
  library: Book[];
  onAdd: (b: Book) => void;
  onRemove: (id: string) => void;
  onViewDetail: (b: Book) => void;
  onGoToWheel: () => void;
}) {
  const [showSearch, setShowSearch] = useState(false);
  const [detailBook, setDetailBook] = useState<Book | null>(null);
  const libraryIds = useMemo(() => new Set(library.map(b => b.id)), [library]);
  const canSpin    = library.length >= 2;

  const handleViewDetail = (book: Book) => {
    setDetailBook(book);
  };

  return (
    <div style={{ position: "relative", display: "flex", flexDirection: "column", height: "100%", background: "#F8F2E5" }}>
      <StatusBar />

      {/* Header */}
      <div style={{ padding: "10px 22px 0", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontFamily: "Playfair Display, serif", fontSize: 24, fontWeight: 600, color: "#2C1A0E", margin: 0 }}>Mis libros</h1>
          <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: 13, color: "#8A7060", margin: "3px 0 0" }}>
            {library.length === 0
              ? "Empieza añadiendo libros ✨"
              : `${library.length} ${library.length === 1 ? "libro" : "libros"} · todos en la ruleta`}
          </p>
        </div>
      </div>

      {/* Fake search trigger */}
      <button onClick={() => setShowSearch(true)}
        style={{ margin: "14px 18px 0", display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderRadius: 18, border: "1.5px solid rgba(181,100,58,0.15)", background: "rgba(255,255,255,0.6)", cursor: "pointer", textAlign: "left" }}>
        <Search size={14} color="#A08878" />
        <span style={{ fontFamily: "DM Sans, sans-serif", fontSize: 14, color: "#A08878" }}>Buscar un libro para añadir...</span>
      </button>

      {/* Book grid */}
      <div style={{ flex: 1, overflowY: "auto", scrollbarWidth: "none" }}>
        {library.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "48px 36px 24px" }}>
            <svg width="72" height="72" viewBox="0 0 72 72" fill="none" style={{ opacity: 0.22, marginBottom: 20 }}>
              <rect x="10" y="18" width="52" height="38" rx="8" stroke="#B5643A" strokeWidth="2.5" />
              <path d="M10 30 H62" stroke="#B5643A" strokeWidth="2" />
              <path d="M36 18 V56" stroke="#B5643A" strokeWidth="2" />
              <circle cx="36" cy="12" r="6" stroke="#B5643A" strokeWidth="2.5" />
              <path d="M33 12 L35.5 14.5 L40 9.5" stroke="#B5643A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <h3 style={{ fontFamily: "Playfair Display, serif", fontSize: 20, fontWeight: 600, color: "#2C1A0E", margin: "0 0 8px" }}>Tu biblioteca está vacía</h3>
            <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: 13.5, color: "#8A7060", margin: "0 0 28px", lineHeight: 1.65 }}>Busca los libros de tu lista de pendientes para empezar.</p>
            <button onClick={() => setShowSearch(true)}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "14px 28px", borderRadius: 18, border: "none", cursor: "pointer", background: "linear-gradient(135deg, #B5643A, #C4956A)", fontFamily: "DM Sans, sans-serif", fontSize: 14, fontWeight: 600, color: "white", boxShadow: "0 5px 18px rgba(181,100,58,0.35)" }}>
              <Search size={15} /> Buscar libros
            </button>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, padding: "14px 16px 16px" }}>
            {library.map(book => (
              <LibraryCard key={book.id} book={book}
                onTap={() => handleViewDetail(book)}
                onRemove={() => onRemove(book.id)} />
            ))}
          </div>
        )}
      </div>

      {/* CTA footer */}
      <div style={{ padding: "10px 18px 32px", background: "rgba(248,242,229,0.97)", backdropFilter: "blur(12px)", borderTop: library.length >= 2 ? "1px solid rgba(139,100,70,0.10)" : "none" }}>
        {!canSpin && library.length > 0 && (
          <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: 12, color: "#B5643A", textAlign: "center", margin: "0 0 10px", opacity: 0.75 }}>
            Añade al menos {2 - library.length} libro{library.length === 1 ? " más" : "s"} para continuar
          </p>
        )}
        {canSpin && (
          <button onClick={onGoToWheel}
            style={{ width: "100%", padding: "15px 0", borderRadius: 20, border: "none", cursor: "pointer", background: "linear-gradient(135deg, #B5643A, #C4956A)", fontFamily: "DM Sans, sans-serif", fontSize: 15, fontWeight: 600, color: "white", boxShadow: "0 5px 18px rgba(181,100,58,0.35)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
            onMouseDown={e => { (e.currentTarget as HTMLElement).style.transform = "scale(0.98)"; }}
            onMouseUp={e => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}>
            Ir a la ruleta <ArrowRight size={17} strokeWidth={2.2} />
          </button>
        )}
      </div>

      {/* Overlays */}
      <AnimatePresence>
        {showSearch && (
          <SearchSheet library={library} onAdd={onAdd} onRemove={onRemove} onViewDetail={handleViewDetail} onClose={() => setShowSearch(false)} />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {detailBook && (
          <BookDetailPanel
            book={detailBook}
            inLibrary={libraryIds.has(detailBook.id)}
            onAdd={b => { onAdd(b); setDetailBook(null); }}
            onRemove={libraryIds.has(detailBook.id) ? id => { onRemove(id); setDetailBook(null); } : undefined}
            onClose={() => setDetailBook(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
  }

// ═══════════════════════════════════════════════════════════════════════════════
// SCREEN 2 — RULETA
// ═══════════════════════════════════════════════════════════════════════════════

function BackgroundDecors() {
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 1 }}>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 65% 55% at 50% 55%, rgba(244,162,97,0.055) 0%, transparent 72%)" }} />
      <div style={{ position: "absolute", bottom: 140, left: 6, opacity: 0.18, transform: "rotate(-9deg)" }}>
        <svg width="58" height="64" viewBox="0 0 58 64" fill="none">
          <path d="M18 13 Q20 8 18 2" stroke="#B5643A" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M29 14 Q31 7 29 1" stroke="#B5643A" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M40 13 Q42 8 40 2" stroke="#B5643A" strokeWidth="2.2" strokeLinecap="round" />
          <rect x="8" y="17" width="42" height="30" rx="7" fill="#C4956A" />
          <path d="M50 25 Q62 28 62 36 Q62 46 50 47" stroke="#B5643A" strokeWidth="3.5" strokeLinecap="round" fill="none" />
          <rect x="14" y="23" width="30" height="18" rx="4" fill="#7A4A2A" opacity="0.38" />
        </svg>
      </div>
      <div style={{ position: "absolute", top: 110, right: 8, opacity: 0.2, transform: "rotate(7deg)" }}>
        <svg width="26" height="68" viewBox="0 0 26 68" fill="none">
          <path d="M13 20 Q7 14 9.5 6 Q13 0 13 0 Q13 0 16.5 6 Q19 14 13 20Z" fill="#F4A261" />
          <path d="M13 19 Q9 14 11 8 Q13 3 13 1 Q13 3 15 8 Q17 14 13 19Z" fill="#FEF3C7" />
          <line x1="13" y1="20" x2="13" y2="25" stroke="#4A3728" strokeWidth="1.5" strokeLinecap="round" />
          <rect x="6" y="25" width="14" height="36" rx="3" fill="#FDF5E8" stroke="#E8DFD0" strokeWidth="1" />
        </svg>
      </div>
    </div>
  );
}

function BookListDrawer({ books }: { books: Book[] }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setOpen(false)}
            style={{ position: "fixed", inset: 0, background: "rgba(44,26,14,0.45)", zIndex: 20 }}
          />
        )}
      </AnimatePresence>

      <div style={{ padding: "0 22px 32px", position: "relative", zIndex: 21 }}>
        <button
          onClick={() => setOpen(o => !o)}
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "11px 16px", borderRadius: 16, border: "1.5px solid rgba(181,100,58,0.18)", background: "rgba(255,255,255,0.55)", backdropFilter: "blur(8px)", cursor: "pointer" }}
        >
          <span style={{ fontFamily: "DM Sans, sans-serif", fontSize: 12, fontWeight: 600, color: "rgba(139,100,70,0.6)", letterSpacing: "0.07em" }}>
            EN LA RULETA · {books.length} {books.length === 1 ? "libro" : "libros"}
          </span>
          <ChevronLeft size={14} color="#B5643A" strokeWidth={2.5} style={{ transform: open ? "rotate(-90deg)" : "rotate(90deg)", transition: "transform 0.25s" }} />
        </button>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              style={{ position: "absolute", bottom: "calc(100% - 30px)", left: 22, right: 22, borderRadius: 16, background: "rgba(255,255,255,0.96)", backdropFilter: "blur(16px)", border: "1.5px solid rgba(181,100,58,0.15)", boxShadow: "0 -8px 32px rgba(44,26,14,0.18)", overflow: "hidden", zIndex: 22 }}
            >
              <div style={{ maxHeight: 260, overflowY: "auto", scrollbarWidth: "none" }}>
                {books.map((book, i) => (
                  <div key={book.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 16px", borderBottom: i < books.length - 1 ? "1px solid #e8ddd5" : "none" }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: `linear-gradient(135deg, ${book.c1}, ${book.c2})`, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: 13, fontWeight: 500, color: "#2C1A0E", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{book.title}</p>
                      <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: 11, color: "#8A7060", margin: 0 }}>{book.author}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}

export function WheelScreen({ library, activeIds, rotation, spinning, onSpin, onBack, onToggleActive, onSelectAll, onSelectNone, winner, showWinner, onCloseWinner }: {
  library: Book[]; activeIds: Set<string>; rotation: number; spinning: boolean;
  onSpin: () => void; onBack: () => void;
  onToggleActive: (id: string) => void; onSelectAll: () => void; onSelectNone: () => void;
  winner: Book | null; showWinner: boolean; onCloseWinner: () => void;
}) {
  const [showFilter, setShowFilter] = useState(false);
  const activeBooks = useMemo(() => library.filter(b => activeIds.has(b.id)), [library, activeIds]);
  const isFiltered  = activeBooks.length < library.length;

  return (
    <div style={{ position: "relative", height: "100%", background: "#F8F2E5" }}>
      <BackgroundDecors />
      <div style={{ position: "relative", zIndex: 2, display: "flex", flexDirection: "column", height: "100%" }}>
        <StatusBar />

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 22px" }}>
          <button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", padding: "4px 0" }}>
            <ChevronLeft size={16} color="#B5643A" strokeWidth={2} />
            <span style={{ fontFamily: "DM Sans, sans-serif", fontSize: 13, fontWeight: 500, color: "#B5643A" }}>Mis libros</span>
          </button>
          <h1 style={{ fontFamily: "Playfair Display, serif", fontSize: 16, fontWeight: 600, color: "#2C1A0E", margin: 0 }}>Mi próxima lectura</h1>
          <div style={{ width: 36 }} />
        </div>

        {/* Wheel */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 16px" }}>
          <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: 13, color: "#8A7060", margin: "0 0 10px" }}>Deja que el destino elija ✨</p>
          <WheelSection books={activeBooks} rotation={rotation} spinning={spinning} onSpin={onSpin} />
        </div>

        {/* Book list drawer */}
        <BookListDrawer books={activeBooks} />
      </div>

      <AnimatePresence>
        {showFilter && (
          <FilterPanel library={library} activeIds={activeIds} onToggle={onToggleActive} onSelectAll={onSelectAll} onSelectNone={onSelectNone} onClose={() => setShowFilter(false)} />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showWinner && winner && (
          <WinnerModal book={winner} onClose={onCloseWinner} onSpin={onSpin} />
        )}
      </AnimatePresence>
    </div>
  );
}
