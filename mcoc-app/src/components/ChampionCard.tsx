import Link from "next/link";
import { CLASS_KEY } from "@/lib/types";
import type { Champion } from "@/lib/types";

export function ChampionCard({ c, compact = false }: { c: Champion; compact?: boolean }) {
  const cls = c.class ? CLASS_KEY[c.class] : "";
  return (
    <Link
      href={`/champion/${c.slug}/`}
      className={`class-${cls} class-card block group`}
      title={c.title}
    >
      <div className="aspect-square w-full bg-ink-soft relative">
        {c.portrait ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={c.portrait}
            alt={c.title}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center text-chrome-dim text-xs">
            {c.title.slice(0, 2)}
          </div>
        )}
        <div className="absolute top-1 right-1">
          <span className="class-chip">{c.class ?? "?"}</span>
        </div>
      </div>
      {!compact && (
        <div className="p-2.5">
          <div className="font-display font-semibold text-sm leading-tight truncate">{c.title}</div>
          {c.signature_ability && (
            <div className="text-[10px] text-chrome-soft truncate mt-0.5" style={{ color: "var(--c-glow)" }}>
              {c.signature_ability}
            </div>
          )}
        </div>
      )}
    </Link>
  );
}
