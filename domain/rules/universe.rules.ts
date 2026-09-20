export const UNIVERSE_RULES = {
  TOP: {
    TARGET_SIZE: 50,
    MIN_MARKET_CAP: 10_000_000_000,
    MIN_DAILY_VOLUME: 1_000_000,
  },

  MID: {
    TARGET_SIZE: 100,
    MIN_MARKET_CAP: 2_000_000_000,
    MAX_MARKET_CAP: 10_000_000_000,
    MIN_DAILY_VOLUME: 500_000,
  },

  REGIONS: [
    "us",
    "de",
    "fr",
    "nl",
    "es",
    "gb",
    "it",
    "ch",
    "be",
    "pt",
    "no",
    "se",
    "dk",
    "fi",
  ],

  TOP_CANDIDATES_PER_REGION: 50,
  MID_CANDIDATES_PER_REGION: 100,
} as const;