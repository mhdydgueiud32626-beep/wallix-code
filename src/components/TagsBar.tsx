import React, { useState } from "react";
import { motion } from "motion/react";

export interface TagsBarProps {
  tags?: string[];
  activeTag?: string;
  onTagChange?: (tag: string) => void;
  className?: string;
}

export const DEFAULT_TAGS = [
  "All",
  "#Live",
  "#Anime",
  "#Nature",
  "#60 Fps",
  "#Custom Upload",
  "#Cyberpunk",
];

export const TagsBar: React.FC<TagsBarProps> = ({
  tags = DEFAULT_TAGS,
  activeTag: controlledActiveTag,
  onTagChange,
  className = "",
}) => {
  // Strict single-selection state
  const [internalActiveTag, setInternalActiveTag] = useState("All");

  const activeTag = controlledActiveTag !== undefined ? controlledActiveTag : internalActiveTag;

  const handleTagClick = (tag: string) => {
    setInternalActiveTag(tag);
    onTagChange?.(tag);
  };

  return (
    <div className={`w-full overflow-x-auto scrollbar-none no-scrollbar ${className}`}>
      <div className="flex min-w-max items-center gap-2 py-0.5">
        <span className="text-xs font-semibold text-slate-400 shrink-0 select-none pr-1">
          Tags:
        </span>
        {tags.map((tag) => {
          const isActive = activeTag === tag;

          return (
            <button
              key={tag}
              type="button"
              onClick={() => handleTagClick(tag)}
              aria-pressed={isActive}
              className="relative shrink-0 rounded-full px-3.5 py-1 text-xs sm:text-[13px] font-medium outline-none cursor-pointer select-none transition-transform active:scale-95"
            >
              {/* Active background / glow */}
              {isActive && (
                <motion.span
                  layoutId="active-tag-light"
                  className="
                    absolute inset-0
                    rounded-full
                    border border-cyan-400
                    bg-cyan-400/10
                    shadow-[0_0_10px_rgba(6,182,212,0.5)]
                  "
                  transition={{
                    type: "spring",
                    stiffness: 420,
                    damping: 32,
                  }}
                />
              )}

              {/* Normal inactive background */}
              {!isActive && (
                <span
                  className="
                    absolute inset-0
                    rounded-full
                    border border-white/10
                    bg-white/5
                    transition-colors duration-200
                    hover:border-white/20
                    hover:bg-white/[0.08]
                  "
                />
              )}

              {/* Text */}
              <span
                className={`relative z-10 transition-colors duration-200 ${
                  isActive
                    ? "text-cyan-300 font-semibold"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {tag}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default TagsBar;
