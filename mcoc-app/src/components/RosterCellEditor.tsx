"use client";

import { useEffect, useRef, useState } from "react";
import type { RosterEntry } from "@/lib/types";

const STARS = [4, 5, 6, 7];
const RANKS = [1, 2, 3, 4, 5];

export function RosterCellEditor({
  initial,
  onSave,
  onClose,
}: {
  initial: RosterEntry;
  onSave: (e: RosterEntry) => void;
  onClose: () => void;
}) {
  const [stars, setStars] = useState<number | null>(initial.stars);
  const [rank, setRank] = useState<number | null>(initial.rank);
  const [sig, setSig] = useState<number>(initial.sig ?? 0);
  const [awakened, setAwakened] = useState(initial.awakened);
  const [ascended, setAscended] = useState(initial.ascended);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    function esc(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("keydown", esc);
    };
  }, [onClose]);

  function commit() {
    onSave({
      slug: initial.slug,
      stars,
      rank,
      sig: sig || null,
      awakened: awakened || sig > 0,
      ascended,
    });
    onClose();
  }

  return (
    <div
      ref={ref}
      className="absolute z-50 bg-ink-soft border border-chrome-soft rounded-lg p-3 shadow-2xl"
      style={{ minWidth: 240 }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="space-y-2.5">
        <div>
          <div className="text-[10px] uppercase text-chrome-dim mb-1 tracking-wide">Stars</div>
          <div className="flex gap-1">
            {STARS.map((s) => (
              <button
                key={s}
                onClick={() => setStars(s)}
                className={`flex-1 px-2 py-1 text-xs rounded border ${
                  stars === s ? "bg-cosmic text-ink border-cosmic font-semibold" : "border-ink-mid text-chrome-soft hover:border-chrome-soft"
                }`}
              >
                {s}*
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="text-[10px] uppercase text-chrome-dim mb-1 tracking-wide">Rank</div>
          <div className="flex gap-1">
            {RANKS.map((r) => (
              <button
                key={r}
                onClick={() => setRank(r)}
                className={`flex-1 px-2 py-1 text-xs rounded border ${
                  rank === r ? "bg-tech text-ink border-tech font-semibold" : "border-ink-mid text-chrome-soft hover:border-chrome-soft"
                }`}
              >
                R{r}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="text-[10px] uppercase text-chrome-dim mb-1 tracking-wide">Sig level</div>
          <input
            type="number"
            min={0}
            max={200}
            value={sig}
            onChange={(e) => setSig(Number(e.target.value))}
            className="w-full bg-ink border border-ink-mid rounded px-2 py-1 text-sm focus:outline-none focus:border-chrome-soft"
          />
        </div>
        <div className="flex gap-2 text-xs">
          <label className="flex items-center gap-1.5 cursor-pointer flex-1">
            <input
              type="checkbox"
              checked={awakened}
              onChange={(e) => setAwakened(e.target.checked)}
              className="accent-cosmic"
            />
            Awakened
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer flex-1">
            <input
              type="checkbox"
              checked={ascended}
              onChange={(e) => setAscended(e.target.checked)}
              className="accent-mystic"
            />
            Ascended
          </label>
        </div>
        <div className="flex gap-2 pt-1">
          <button
            onClick={commit}
            className="flex-1 px-3 py-1.5 bg-cosmic text-ink rounded font-semibold text-sm"
          >
            Save
          </button>
          <button
            onClick={onClose}
            className="px-3 py-1.5 border border-chrome-soft text-chrome rounded text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
