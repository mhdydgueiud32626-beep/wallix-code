import React, { useMemo, useState, useEffect } from "react";

export type WallpaperCategory = {
  id: string;
  title: string;
  image: string;
  special?: "gold";
};

export type WallpaperCategoryBarProps = {
  categories?: WallpaperCategory[];
  activeCategory?: string;
  onCategoryChange?: (categoryId: string) => void;
  onMoreClick?: () => void;
  className?: string;
};

export const DEFAULT_WALLPAPER_CATEGORIES: WallpaperCategory[] = [
  {
    id: "all",
    title: "All Wallpapers",
    image:
      "https://images.unsplash.com/photo-1519608487953-e999c86e7455?w=120&h=120&fit=crop&q=80",
  },
  {
    id: "4k",
    title: "4K",
    image:
      "https://images.unsplash.com/photo-1496171367470-9ed9a91ea931?w=120&h=120&fit=crop&q=80",
  },
  {
    id: "8k-ultra",
    title: "8K Ultra",
    image:
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&h=120&fit=crop&q=80",
    special: "gold",
  },
  {
    id: "anime",
    title: "Anime",
    image:
      "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=120&h=120&fit=crop&q=80",
  },
  {
    id: "nature",
    title: "Nature",
    image:
      "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=120&h=120&fit=crop&q=80",
  },
  {
    id: "space",
    title: "Space & Nebula",
    image:
      "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=120&h=120&fit=crop&q=80",
  },
  {
    id: "shaders",
    title: "Shaders",
    image:
      "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=120&h=120&fit=crop&q=80",
  },
  {
    id: "gaming",
    title: "Gaming",
    image:
      "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=120&h=120&fit=crop&q=80",
  },
  {
    id: "cars",
    title: "Cars",
    image:
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=120&h=120&fit=crop&q=80",
  },
  {
    id: "cyberpunk",
    title: "Cyberpunk",
    image:
      "https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=120&h=120&fit=crop&q=80",
  },
  {
    id: "minimalist",
    title: "Minimalist 3D",
    image:
      "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=120&h=120&fit=crop&q=80",
  },
  {
    id: "amoled",
    title: "Dark AMOLED",
    image:
      "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=120&h=120&fit=crop&q=80",
  },
  {
    id: "3d",
    title: "3D Spatial",
    image:
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&h=120&fit=crop&q=80",
  },
  {
    id: "architecture",
    title: "Architecture",
    image:
      "https://images.unsplash.com/photo-1544644181-1484b3fdfc62?w=120&h=120&fit=crop&q=80",
  },
  {
    id: "live-video",
    title: "Live Video",
    image:
      "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=120&h=120&fit=crop&q=80",
  },
  {
    id: "abstract",
    title: "Abstract 3D",
    image:
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&h=120&fit=crop&q=80",
  },
];

const MAX_CATEGORIES = 40;
const BATCH_SIZE = 10;
const INITIAL_BATCH = 10;

export const WallpaperCategoryBar: React.FC<WallpaperCategoryBarProps> = ({
  categories = DEFAULT_WALLPAPER_CATEGORIES,
  activeCategory = "all",
  onCategoryChange,
  onMoreClick,
  className = "",
}) => {
  const [localActive, setLocalActive] = useState(activeCategory);

  const selectedCategory = useMemo(
    () => (activeCategory ?? localActive).toLowerCase(),
    [activeCategory, localActive]
  );

  // Deduplicate categories by category.id, validate non-empty id/title, and cap at MAX_CATEGORIES
  const sanitizedCategories = useMemo(() => {
    const seenIds = new Set<string>();
    const result: WallpaperCategory[] = [];

    for (const cat of categories) {
      if (!cat || !cat.id || !cat.title) continue;
      const normalizedId = cat.id.toLowerCase();
      if (!seenIds.has(normalizedId)) {
        seenIds.add(normalizedId);
        result.push(cat);
        if (result.length >= MAX_CATEGORIES) break;
      }
    }
    return result;
  }, [categories]);

  const maxAllowed = sanitizedCategories.length;

  // Track progressive visible count in batches of 10
  const [visibleCount, setVisibleCount] = useState<number>(() =>
    Math.min(INITIAL_BATCH, maxAllowed)
  );

  // Auto-expand batch if activeCategory index is beyond current visible count
  useEffect(() => {
    const activeIdx = sanitizedCategories.findIndex(
      (c) => c.id.toLowerCase() === selectedCategory
    );
    if (activeIdx >= 0 && activeIdx >= visibleCount) {
      const requiredBatch = Math.min(
        Math.ceil((activeIdx + 1) / BATCH_SIZE) * BATCH_SIZE,
        maxAllowed
      );
      setVisibleCount((prev) => Math.max(prev, requiredBatch));
    }
  }, [selectedCategory, sanitizedCategories, visibleCount, maxAllowed]);

  const handleCategoryClick = (categoryId: string) => {
    setLocalActive(categoryId);
    onCategoryChange?.(categoryId);
  };

  const handleMoreClick = () => {
    setVisibleCount((prev) => Math.min(prev + BATCH_SIZE, maxAllowed, MAX_CATEGORIES));
    onMoreClick?.();
  };

  const visibleCategories = sanitizedCategories.slice(0, visibleCount);
  const hasMore = visibleCount < maxAllowed && visibleCount < MAX_CATEGORIES;

  return (
    <div
      className={[
        "w-full",
        "overflow-x-auto overflow-y-hidden",
        "scrollbar-none no-scrollbar",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div
        className="
          flex min-w-max items-center
          gap-2.5
          rounded-2xl
          border border-white/[0.08]
          bg-[#0b0f17]/80
          px-3 py-2
          backdrop-blur-xl
          shadow-lg shadow-black/40
        "
      >
        {visibleCategories.map((category) => {
          const isActive = selectedCategory === category.id.toLowerCase();
          const isGold = category.special === "gold";

          return (
            <button
              key={category.id}
              type="button"
              onClick={() => handleCategoryClick(category.id)}
              aria-pressed={isActive}
              className={[
                "group shrink-0 cursor-pointer select-none",
                "inline-flex items-center justify-center",
                "gap-2",
                "rounded-full",
                "border",
                "px-3.5 py-1.5",
                "text-[13px] font-medium",
                "leading-none",
                "transition-all duration-200 ease-out",
                "whitespace-nowrap",
                "focus:outline-none",
                "focus-visible:ring-2 focus-visible:ring-cyan-400/60",
                "active:scale-95",
                isActive
                  ? isGold
                    ? [
                        "border-amber-300/90",
                        "bg-gradient-to-r from-amber-400/20 to-yellow-300/10",
                        "text-amber-100 font-semibold",
                        "shadow-[0_0_14px_rgba(251,191,36,0.4)]",
                      ].join(" ")
                    : [
                        "border-cyan-400",
                        "bg-cyan-400/15",
                        "text-white font-semibold",
                        "shadow-[0_0_14px_rgba(0,242,254,0.45)]",
                      ].join(" ")
                  : isGold
                  ? [
                      "border-amber-500/25",
                      "bg-amber-950/20",
                      "text-amber-200/80",
                      "hover:border-amber-400/50",
                      "hover:bg-amber-900/30",
                      "hover:text-amber-100",
                    ].join(" ")
                  : [
                      "border-white/10",
                      "bg-white/5",
                      "text-[#e5e7eb]",
                      "hover:border-white/20",
                      "hover:bg-white/10",
                      "hover:text-white",
                      "hover:shadow-[0_0_10px_rgba(255,255,255,0.06)]",
                    ].join(" "),
              ].join(" ")}
            >
              {/* Category Thumbnail */}
              <span
                className={[
                  "relative shrink-0",
                  "h-7 w-7",
                  "overflow-hidden rounded-full",
                  "border",
                  isActive
                    ? isGold
                      ? "border-amber-200/60"
                      : "border-cyan-300/50"
                    : isGold
                    ? "border-amber-400/30"
                    : "border-white/10",
                ].join(" ")}
              >
                <img
                  src={category.image}
                  alt=""
                  draggable={false}
                  className="
                    h-full w-full
                    object-cover
                    transition-transform duration-200
                    group-hover:scale-110
                  "
                />

                <span
                  className="
                    pointer-events-none
                    absolute inset-0
                    rounded-full
                    bg-gradient-to-br
                    from-white/20
                    via-transparent
                    to-black/20
                  "
                />
              </span>

              <span className="max-w-[160px] truncate">
                {category.title}
              </span>
            </button>
          );
        })}

        {/* Progressive More Button */}
        {hasMore && (
          <button
            type="button"
            onClick={handleMoreClick}
            aria-label="Show more wallpaper categories"
            className="
              group shrink-0 cursor-pointer select-none
              inline-flex items-center gap-1.5
              rounded-full
              border border-white/10
              bg-white/5
              px-3.5 py-1.5
              text-[13px] font-medium
              text-white/75
              transition-all duration-200
              hover:border-white/20
              hover:bg-white/10
              hover:text-white
              active:scale-95
              focus:outline-none
              focus-visible:ring-2 focus-visible:ring-cyan-400/60
            "
          >
            <span>More...</span>

            <svg
              viewBox="0 0 20 20"
              fill="none"
              className="
                h-3.5 w-3.5
                transition-transform duration-200
                group-hover:translate-x-0.5
              "
              aria-hidden="true"
            >
              <path
                d="M7.5 4.5L13 10L7.5 15.5"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

export default WallpaperCategoryBar;
