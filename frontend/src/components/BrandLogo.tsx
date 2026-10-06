import Image from "next/image";

type BrandLogoProps = {
  size?: "sm" | "md" | "lg" | "hero";
  showWordmark?: boolean;
  className?: string;
};

const sizes = {
  sm: { box: "h-9 w-9", img: 36 },
  md: { box: "h-10 w-10", img: 40 },
  lg: { box: "h-14 w-14", img: 56 },
  hero: { box: "h-24 w-24 sm:h-28 sm:w-28", img: 160 },
};

export function BrandLogo({
  size = "md",
  showWordmark = false,
  className = "",
}: BrandLogoProps) {
  const s = sizes[size];

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div
        className={`relative overflow-hidden rounded-xl border border-[var(--gold)]/25 shadow-[var(--shadow)] ${s.box}`}
      >
        <Image
          src="/logo.png"
          alt="Sync"
          width={s.img}
          height={s.img}
          className="h-full w-full object-contain"
          priority
        />
      </div>
      {showWordmark && (
        <>
          <span className="font-display mt-3 text-3xl text-[var(--gold-bright)]">
            Sync
          </span>
          <span className="mt-1 text-xs uppercase tracking-[0.25em] text-[var(--text-dim)]">
            Kitchen Dashboard
          </span>
        </>
      )}
    </div>
  );
}
