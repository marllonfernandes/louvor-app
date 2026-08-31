/**
 * Utilitários para extrair, buscar dados e embutir vídeos e playlists do YouTube
 */

export interface YoutubeDetails {
  videoId: string;
  title: string;
  parsedTitle: string;
  parsedArtist: string;
  authorName: string;
  thumbnailUrl: string;
}

export interface YoutubePlaylistItem {
  videoId: string;
  title: string;
  artist: string;
  url: string;
  thumbnailUrl: string;
}

export interface YoutubePlaylistDetails {
  playlistId: string;
  title: string;
  total: number;
  items: YoutubePlaylistItem[];
}

/**
 * Extrai o ID de 11 caracteres de qualquer URL válida do YouTube
 * Suporta: watch?v=, youtu.be/, /embed/, /v/, /shorts/, /live/, music.youtube.com, etc.
 */
export function getYoutubeId(url: string): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();

  // Se já for um ID de 11 caracteres puro
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  try {
    const urlObj = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);

    // youtu.be/ID
    if (urlObj.hostname.includes('youtu.be')) {
      const pathId = urlObj.pathname.slice(1).split('/')[0]?.split('?')[0];
      if (pathId && /^[a-zA-Z0-9_-]{11}$/.test(pathId)) {
        return pathId;
      }
    }

    // ?v=ID (youtube.com, music.youtube.com, m.youtube.com)
    const vParam = urlObj.searchParams.get('v');
    if (vParam && /^[a-zA-Z0-9_-]{11}$/.test(vParam)) {
      return vParam;
    }

    // /embed/ID, /v/ID, /shorts/ID, /live/ID
    const pathParts = urlObj.pathname.split('/').filter(Boolean);
    for (let i = 0; i < pathParts.length; i++) {
      const segment = pathParts[i];
      if (['embed', 'v', 'shorts', 'live'].includes(segment) && pathParts[i + 1]) {
        const candidate = pathParts[i + 1].split('?')[0].split('&')[0];
        if (/^[a-zA-Z0-9_-]{11}$/.test(candidate)) {
          return candidate;
        }
      }
    }
  } catch {
    // Fallback com RegExp caso a URL não seja parseada pela API URL
  }

  // Regex robusta para capturar ID do YouTube em outros casos
  const regExp = /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|shorts\/|live\/|watch\?v=|watch\?.+&v=))([\w-]{11})/;
  const match = trimmed.match(regExp);
  return match && match[1]?.length === 11 ? match[1] : null;
}

/**
 * Extrai o ID da Playlist (ex: PLxxxx) de qualquer link do YouTube
 */
export function getYoutubePlaylistId(url: string): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();

  // Se já for o ID puro (geralmente começa com PL, RD, UU, etc.)
  if (/^[a-zA-Z0-9_-]{10,40}$/.test(trimmed) && !trimmed.includes('/') && !trimmed.includes('.')) {
    return trimmed;
  }

  try {
    const urlObj = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
    const listParam = urlObj.searchParams.get('list');
    if (listParam) return listParam;

    if (urlObj.pathname.includes('/playlist/')) {
      const parts = urlObj.pathname.split('/playlist/')[1]?.split('?')[0];
      if (parts) return parts;
    }
  } catch {
    // Fallback
  }

  const listMatch = trimmed.match(/[?&]list=([a-zA-Z0-9_-]+)/);
  if (listMatch) return listMatch[1];

  return null;
}

/**
 * Retorna a URL de embed compatível com as regras do YouTube
 */
export function getYoutubeEmbedUrl(url: string): string | null {
  const videoId = getYoutubeId(url);
  if (!videoId) return null;

  return `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`;
}

/**
 * Retorna a URL da imagem de capa (thumbnail) do vídeo
 */
export function getYoutubeThumbnail(
  url: string,
  quality: 'default' | 'mq' | 'hq' | 'sd' | 'maxres' = 'hq'
): string | null {
  const videoId = getYoutubeId(url);
  if (!videoId) return null;

  const qualityFilename = {
    default: 'default.jpg',
    mq: 'mqdefault.jpg',
    hq: 'hqdefault.jpg',
    sd: 'sddefault.jpg',
    maxres: 'maxresdefault.jpg'
  }[quality];

  return `https://img.youtube.com/vi/${videoId}/${qualityFilename}`;
}

/**
 * Limpa títulos de vídeos de louvor, removendo termos desnecessários
 */
export function cleanSongTitle(text: string): string {
  return text
    .replace(/[\(\[\{]?(vídeo oficial|video oficial|clipe oficial|official video|official music video|audio oficial|áudio oficial|ao vivo|live session|live|acústico|acoustic|lyric video|letra|legendado)[\)\]\}]?/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/**
 * Tenta separar Artista e Título de strings comuns do YouTube
 */
export function parseSongTitleAndArtist(rawTitle: string, authorName: string = ''): { title: string; artist: string } {
  const cleaned = cleanSongTitle(rawTitle);

  // Separadores comuns: " - ", " – ", " — ", " | ", " // "
  const separators = [' - ', ' – ', ' — ', ' | ', ' // ', ' : '];
  for (const sep of separators) {
    if (cleaned.includes(sep)) {
      const parts = cleaned.split(sep).map(p => p.trim()).filter(Boolean);
      if (parts.length >= 2) {
        return {
          artist: parts[0],
          title: parts.slice(1).join(' - ')
        };
      }
    }
  }

  const cleanedAuthor = authorName
    .replace(/ - Topic$/i, '')
    .replace(/ Oficial$/i, '')
    .replace(/ Canal Oficial$/i, '')
    .trim();

  return {
    title: cleaned || rawTitle,
    artist: cleanedAuthor || 'Artista'
  };
}

/**
 * Busca metadados do vídeo usando a API oficial e gratuita oEmbed do YouTube
 */
export async function fetchYoutubeDetails(url: string): Promise<YoutubeDetails | null> {
  const videoId = getYoutubeId(url);
  if (!videoId) return null;

  const defaultThumbnail = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

  try {
    const oembedEndpoint = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    const res = await fetch(oembedEndpoint);

    if (res.ok) {
      const data = await res.json();
      const rawTitle: string = data.title || '';
      const authorName: string = data.author_name || '';
      const thumbnailUrl: string = data.thumbnail_url || defaultThumbnail;

      const { title, artist } = parseSongTitleAndArtist(rawTitle, authorName);

      return {
        videoId,
        title: rawTitle,
        parsedTitle: title,
        parsedArtist: artist,
        authorName,
        thumbnailUrl
      };
    }
  } catch (err) {
    console.warn('Não foi possível obter dados completos via oEmbed:', err);
  }

  return {
    videoId,
    title: '',
    parsedTitle: '',
    parsedArtist: '',
    authorName: '',
    thumbnailUrl: defaultThumbnail
  };
}

/**
 * Busca e extrai os vídeos de uma playlist do YouTube
 */
export async function fetchYoutubePlaylist(urlOrId: string): Promise<YoutubePlaylistDetails | null> {
  const playlistId = getYoutubePlaylistId(urlOrId);
  if (!playlistId) return null;

  // 1. Tenta via Backend Endpoint (/api/youtube/playlist)
  try {
    const backendRes = await fetch(`/api/youtube/playlist?id=${encodeURIComponent(playlistId)}`);
    if (backendRes.ok) {
      const data = await backendRes.json();
      if (data.items && Array.isArray(data.items) && data.items.length > 0) {
        return data as YoutubePlaylistDetails;
      }
    }
  } catch {
    // Backend pode estar em outra porta ou modo dev vite
  }

  // 2. Fallback direto para Invidious API
  const invidiousEndpoints = [
    `https://inv.nadeko.net/api/v1/playlists/${encodeURIComponent(playlistId)}`,
    `https://invidious.nerdvpn.de/api/v1/playlists/${encodeURIComponent(playlistId)}`,
    `https://yt.artemislena.eu/api/v1/playlists/${encodeURIComponent(playlistId)}`
  ];

  for (const invUrl of invidiousEndpoints) {
    try {
      const invRes = await fetch(invUrl, { signal: AbortSignal.timeout(4500) });
      if (invRes.ok) {
        const invJson: any = await invRes.json();
        if (invJson.videos && Array.isArray(invJson.videos) && invJson.videos.length > 0) {
          const items: YoutubePlaylistItem[] = invJson.videos.map((v: any) => {
            const { title, artist } = parseSongTitleAndArtist(v.title || '', v.author || '');
            return {
              videoId: v.videoId,
              title,
              artist,
              url: `https://www.youtube.com/watch?v=${v.videoId}`,
              thumbnailUrl: v.videoThumbnails?.slice(-1)[0]?.url || `https://img.youtube.com/vi/${v.videoId}/hqdefault.jpg`
            };
          });

          return {
            playlistId,
            title: invJson.title || 'Playlist do YouTube',
            total: items.length,
            items
          };
        }
      }
    } catch {
      // continua
    }
  }

  // 3. Fallback via CORS Proxy com Feed RSS
  try {
    const feedUrl = `https://www.youtube.com/feeds/videos.xml?playlist_id=${encodeURIComponent(playlistId)}`;
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(feedUrl)}`;
    
    const res = await fetch(proxyUrl);
    if (res.ok) {
      const xmlText = await res.text();
      const titleMatch = xmlText.match(/<title>([\s\S]*?)<\/title>/);
      const playlistTitle = titleMatch ? titleMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim() : 'Playlist do YouTube';

      const entries = xmlText.split('<entry>');
      const items: YoutubePlaylistItem[] = [];

      for (let i = 1; i < entries.length; i++) {
        const block = entries[i];
        const idMatch = block.match(/<yt:videoId>(.*?)<\/yt:videoId>/);
        const entryTitleMatch = block.match(/<title>([\s\S]*?)<\/title>/);
        const authorMatch = block.match(/<name>([\s\S]*?)<\/name>/);

        if (idMatch && entryTitleMatch) {
          const videoId = idMatch[1].trim();
          const rawTitle = entryTitleMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim();
          const authorName = authorMatch ? authorMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim() : '';

          const { title, artist } = parseSongTitleAndArtist(rawTitle, authorName);

          items.push({
            videoId,
            title,
            artist,
            url: `https://www.youtube.com/watch?v=${videoId}`,
            thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
          });
        }
      }

      if (items.length > 0) {
        return {
          playlistId,
          title: playlistTitle,
          total: items.length,
          items
        };
      }
    }
  } catch (err) {
    console.warn('Erro ao carregar playlist no fallback RSS:', err);
  }

  return null;
}
