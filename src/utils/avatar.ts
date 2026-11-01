// Google Account / Material profile avatar colors
const GOOGLE_AVATAR_COLORS = [
  '#1A73E8', // Google Blue
  '#D93025', // Google Red
  '#1E8E3E', // Google Green
  '#9334E6', // Google Purple
  '#E8710A', // Google Deep Orange
  '#007B83', // Google Teal
  '#E52592', // Google Pink / Magenta
  '#1967D2', // Royal Blue
  '#0B8043', // Forest Green
  '#C5221F', // Crimson
  '#7627BB', // Deep Violet
  '#00897B', // Cyan Teal
];

const AVATAR_COLOR_MAP_KEY = 'trustnews_avatar_colors_v1';

export function getFirstLetter(nameOrEmail?: string | null): string {
  const cleaned = (nameOrEmail || '')
    .replace(/^@+/, '')
    .trim();
  if (!cleaned) return 'U';
  const match = cleaned.match(/[a-zA-Z0-9]/);
  return (match ? match[0] : cleaned[0]).toUpperCase();
}

export function getAvatarColor(seed?: string | null): string {
  const cleanSeed = (seed || 'default_user').trim().toLowerCase();

  if (typeof window !== 'undefined') {
    try {
      const raw = window.localStorage.getItem(AVATAR_COLOR_MAP_KEY);
      const map: Record<string, string> = raw ? JSON.parse(raw) : {};
      if (map[cleanSeed] && GOOGLE_AVATAR_COLORS.includes(map[cleanSeed])) {
        return map[cleanSeed];
      }
      // Pick one random color for this user and persist it so it remains consistent
      const randomColor =
        GOOGLE_AVATAR_COLORS[Math.floor(Math.random() * GOOGLE_AVATAR_COLORS.length)];
      map[cleanSeed] = randomColor;
      window.localStorage.setItem(AVATAR_COLOR_MAP_KEY, JSON.stringify(map));
      return randomColor;
    } catch {
      // Fall back to deterministic hash if localStorage is unavailable
    }
  }

  let hash = 0;
  for (let i = 0; i < cleanSeed.length; i++) {
    hash = cleanSeed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % GOOGLE_AVATAR_COLORS.length;
  return GOOGLE_AVATAR_COLORS[index];
}

export function generateGoogleStyleAvatarUrl(
  nameOrEmail?: string | null,
  seed?: string | null
): string {
  const letter = getFirstLetter(nameOrEmail);
  const bgColor = getAvatarColor(seed || nameOrEmail || letter);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" width="96" height="96"><rect width="96" height="96" fill="${bgColor}"/><text x="50%" y="52%" dominant-baseline="central" text-anchor="middle" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="48" font-weight="600">${letter}</text></svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function resolveUserAvatarUrl(
  photoURL?: string | null,
  nameOrEmail?: string | null,
  seed?: string | null
): string {
  if (photoURL && photoURL.trim().length > 0) {
    return photoURL;
  }
  return generateGoogleStyleAvatarUrl(nameOrEmail, seed);
}
