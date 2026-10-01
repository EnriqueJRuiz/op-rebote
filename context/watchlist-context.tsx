"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { createBrowserClient } from "@supabase/ssr";

interface WatchlistContextType {
  followedTickers: string[];
  isReady: boolean;
  isFollowing: (ticker: string) => boolean;
  toggleFollow: (ticker: string) => Promise<void>;
  follow: (ticker: string) => Promise<void>;
  unfollow: (ticker: string) => Promise<void>;
  count: number;
}

const STORAGE_KEY = "op_rebote_watchlist";
const WATCHLIST_TABLE = "seguimiento";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const WatchlistContext = createContext<WatchlistContextType | null>(null);

export function WatchlistProvider({ children }: { children: ReactNode }) {
  const [followedTickers, setFollowedTickers] = useState<string[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let active = true;

    const migrateLegacyWatchlist = async (currentUserId: string) => {
      let legacyTickers: string[] = [];
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        const parsed: unknown = stored ? JSON.parse(stored) : [];
        if (Array.isArray(parsed)) {
          legacyTickers = [...new Set(
            parsed
              .filter((ticker): ticker is string => typeof ticker === "string")
              .map((ticker) => ticker.trim().toUpperCase())
              .filter(Boolean)
          )];
        }
      } catch (error) {
        console.warn("No se pudo leer la lista local de seguimiento:", error);
        return;
      }

      if (legacyTickers.length === 0) return;

      const { error } = await supabase
        .from(WATCHLIST_TABLE)
        .upsert(
          legacyTickers.map((ticker) => ({ user_id: currentUserId, ticker })),
          { onConflict: "user_id,ticker", ignoreDuplicates: true }
        );

      if (!error) {
        localStorage.removeItem(STORAGE_KEY);
        return;
      }

      if (error.code === "23503") {
        const tickersToRetry: string[] = [];
        for (const ticker of legacyTickers) {
          const { error: tickerError } = await supabase
            .from(WATCHLIST_TABLE)
            .upsert(
              { user_id: currentUserId, ticker },
              { onConflict: "user_id,ticker", ignoreDuplicates: true }
            );
          if (tickerError && tickerError.code !== "23503") {
            tickersToRetry.push(ticker);
          }
        }

        if (tickersToRetry.length > 0) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(tickersToRetry));
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
        return;
      }

      console.warn("No se pudo migrar la lista local de seguimiento:", error.message);
    };

    const loadWatchlist = async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError) throw authError;
        if (!user) return;

        if (active) setUserId(user.id);
        await migrateLegacyWatchlist(user.id);

        const { data, error } = await supabase
          .from(WATCHLIST_TABLE)
          .select("ticker")
          .eq("user_id", user.id);
        if (error) throw error;

        if (active) {
          setFollowedTickers(
            [...new Set((data ?? []).map(({ ticker }) => ticker.trim().toUpperCase()))]
          );
        }
      } catch (error) {
        console.warn("No se pudo cargar la lista de seguimiento:", error);
      } finally {
        if (active) setIsReady(true);
      }
    };

    void loadWatchlist();
    return () => {
      active = false;
    };
  }, []);

  const isFollowing = (ticker: string) => {
    if (!ticker) return false;
    return followedTickers.includes(ticker.trim().toUpperCase());
  };

  const setFollowed = async (ticker: string, shouldFollow: boolean) => {
    if (!ticker || !isReady || !userId) return;
    const normalized = ticker.trim().toUpperCase();
    const wasFollowing = followedTickers.includes(normalized);
    if (wasFollowing === shouldFollow) return;

    setFollowedTickers((current) => shouldFollow
      ? [...current, normalized]
      : current.filter((currentTicker) => currentTicker !== normalized));

    try {
      const { error } = shouldFollow
        ? await supabase
          .from(WATCHLIST_TABLE)
          .upsert(
            { user_id: userId, ticker: normalized },
            { onConflict: "user_id,ticker", ignoreDuplicates: true }
          )
        : await supabase
          .from(WATCHLIST_TABLE)
          .delete()
          .eq("user_id", userId)
          .eq("ticker", normalized);

      if (error) throw error;
    } catch (error) {
      setFollowedTickers((current) => {
        if (current.includes(normalized) !== shouldFollow) return current;
        return wasFollowing
          ? [...current, normalized]
          : current.filter((currentTicker) => currentTicker !== normalized);
      });
      console.warn(`No se pudo actualizar el seguimiento de ${normalized}:`, error);
    }
  };

  const follow = (ticker: string) => setFollowed(ticker, true);
  const unfollow = (ticker: string) => setFollowed(ticker, false);
  const toggleFollow = (ticker: string) => setFollowed(ticker, !isFollowing(ticker));

  return (
    <WatchlistContext.Provider
      value={{
        followedTickers: isReady ? followedTickers : [],
        isReady,
        isFollowing,
        toggleFollow,
        follow,
        unfollow,
        count: isReady ? followedTickers.length : 0,
      }}
    >
      {children}
    </WatchlistContext.Provider>
  );
}

export function useWatchlist() {
  const context = useContext(WatchlistContext);
  if (!context) {
    throw new Error("useWatchlist debe utilizarse dentro de un WatchlistProvider");
  }
  return context;
}
