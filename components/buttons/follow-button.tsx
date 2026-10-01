"use client";

import { useState } from "react";
import { Bookmark } from "lucide-react";
import { useWatchlist } from "@/context/watchlist-context";
import { UI_TEXT } from "@/domain/literales.constantes";

interface FollowButtonProps {
  ticker: string;
  className?: string;
  size?: number;
  showLabel?: boolean;
}

export function FollowButton({
  ticker,
  className = "",
  size = 16,
  showLabel = false,
}: FollowButtonProps) {
  const { isFollowing, isReady, toggleFollow } = useWatchlist();
  const [pending, setPending] = useState(false);
  const following = isFollowing(ticker);

  const label = following
    ? UI_TEXT.table.values.followActive
    : UI_TEXT.table.values.followInactive;
  const disabled = !isReady || pending;

  return (
    <button
      type="button"
      onClick={async (e) => {
        e.stopPropagation();
        setPending(true);
        try {
          await toggleFollow(ticker);
        } finally {
          setPending(false);
        }
      }}
      disabled={disabled}
      aria-label={`${label}: ${ticker}`}
      aria-pressed={following}
      aria-busy={disabled}
      title={!isReady ? "Cargando seguimiento..." : label}
      className={`group inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg p-1.5 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-300 disabled:cursor-wait disabled:opacity-50 ${
        following
          ? "border border-indigo-200 bg-indigo-50/80 text-indigo-600 hover:bg-indigo-100/80"
          : "text-slate-300 hover:bg-slate-100 hover:text-indigo-600"
      } ${className}`}
    >
      <Bookmark
        size={size}
        className={`transition-all duration-150 ${
          following
            ? "fill-indigo-500 text-indigo-600"
            : "group-hover:text-indigo-600"
        }`}
        aria-hidden="true"
      />
      {showLabel && (
        <span
          className={`text-xs font-medium ${
            following ? "text-indigo-700" : "text-slate-500"
          }`}
        >
          {following ? UI_TEXT.table.values.unfollow : UI_TEXT.table.columns.follow}
        </span>
      )}
    </button>
  );
}
