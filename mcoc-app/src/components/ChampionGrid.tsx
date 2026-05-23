"use client";

import { useMemo, useState } from "react";
import { ChampionCard } from "./ChampionCard";
import { champions } from "@/lib/data";
import { CLASS_LIST } from "@/lib/types";
import type { ChampionClass } from "@/lib/types";

export function ChampionGrid() {
  const [q, setQ] = useState("");
  const [cls, setCls] = useState<ChampionClass | "all">("all");

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return champions.filter((c) => {
      if (cls !== "all" && c.class !== cls) return false;
      if (ql && !c.title.toLowerCase().includes(ql)) return false;
      return true;
    });
  }, [q, cls]);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <input
          type="text"
          placeholder="Find a champion..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="px-3 py-2 bg-ink-soft border border-ink-mid rounded-md text-sm flex-1 min-w-[220px] focus:outline-none focus:border-chrome-soft"
        />
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setCls("all")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
              cls === "all" ? "bg-chrome text-ink border-chrome" : "border-ink-mid text-chrome-soft hover:text-chrome"
            }`}
          >
            All
          </button>
          {CLASS_LIST.map((k) => (
            <button
              key={k}
              onClick={() => setCls(k)}
              className={`class-${k.toLowerCase()} px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                cls === k ? "" : "opacity-60 hover:opacity-100"
              }`}
              style={
                cls === k
                  ? { background: "var(--c)", color: "#0a0a12", borderColor: "var(--c)" }
                  : { borderColor: "var(--c)", color: "var(--c-glow)" }
              }
            >
              {k}
            </button>
          ))}
        </div>
        <div className="text-sm text-chrome-soft">{filtered.length} of {champions.length}</div>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-8 gap-2">
        {filtered.map((c) => (
          <ChampionCard key={c.slug} c={c} />
        ))}
      </div>
    </div>
  );
}
