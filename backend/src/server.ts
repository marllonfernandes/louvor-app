import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';

// Carrega variáveis de ambiente (.env) se existirem
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// -----------------------------------------------------------------------------
// 1. CONFIGURAÇÕES & TIPOS
// -----------------------------------------------------------------------------
const app = express();
const PORT = parseInt(process.env.PORT || '8080', 10);
const HOST = '0.0.0.0';

// -----------------------------------------------------------------------------
// 2. UTILITÁRIOS
// -----------------------------------------------------------------------------
function cleanSongTitle(text: string): string {
  return text
    .replace(/[\(\[\{]?(vídeo oficial|video oficial|clipe oficial|official video|official music video|audio oficial|áudio oficial|ao vivo|live session|live|acústico|acoustic|lyric video|letra|legendado)[\)\]\}]?/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function parseSongTitleAndArtist(rawTitle: string, authorName: string = ''): { title: string; artist: string } {
  const cleaned = cleanSongTitle(rawTitle);

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

// -----------------------------------------------------------------------------
// 3. MIDDLEWARES PADRÃO
// -----------------------------------------------------------------------------
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Localização dos arquivos estáticos do frontend (public/)
const publicPath = path.resolve(__dirname, '../public');

// -----------------------------------------------------------------------------
// 4. ROTAS DE OBSERVABILIDADE & HEALTHCHECK
// -----------------------------------------------------------------------------
app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    service: 'louvor-app-backend',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString()
  });
});

app.get('/api/info', (_req: Request, res: Response) => {
  res.status(200).json({
    app: 'Louvor App - Ministério de Louvor',
    version: '1.0.0',
    status: 'online',
    cloudRun: true
  });
});

// -----------------------------------------------------------------------------
// 4.1 ENDPOINT DE IMPORTAÇÃO DE PLAYLIST DO YOUTUBE
// -----------------------------------------------------------------------------
app.get('/api/youtube/playlist', async (req: Request, res: Response): Promise<void> => {
  try {
    const rawInput = (req.query.url as string || req.query.id as string || '').trim();
    if (!rawInput) {
      res.status(400).json({ error: 'Parâmetro "url" ou "id" da playlist é obrigatório.' });
      return;
    }

    // Extrai o ID da playlist
    let playlistId = rawInput;
    if (rawInput.includes('list=')) {
      const match = rawInput.match(/list=([a-zA-Z0-9_-]+)/);
      if (match) playlistId = match[1];
    } else if (rawInput.includes('/playlist/')) {
      const match = rawInput.match(/\/playlist\/([a-zA-Z0-9_-]+)/);
      if (match) playlistId = match[1];
    }

    // 1. Tenta instâncias Invidious (JSON puro de alta velocidade)
    const invidiousInstances = [
      `https://inv.nadeko.net/api/v1/playlists/${encodeURIComponent(playlistId)}`,
      `https://invidious.nerdvpn.de/api/v1/playlists/${encodeURIComponent(playlistId)}`,
      `https://yt.artemislena.eu/api/v1/playlists/${encodeURIComponent(playlistId)}`
    ];

    for (const instUrl of invidiousInstances) {
      try {
        const invRes = await fetch(instUrl, {
          signal: AbortSignal.timeout(4500),
          headers: { 'Accept': 'application/json' }
        });

        if (invRes.ok) {
          const invJson: any = await invRes.json();
          if (invJson.videos && Array.isArray(invJson.videos) && invJson.videos.length > 0) {
            const items = invJson.videos.map((v: any) => {
              const { title, artist } = parseSongTitleAndArtist(v.title || '', v.author || '');
              return {
                videoId: v.videoId,
                title,
                artist,
                url: `https://www.youtube.com/watch?v=${v.videoId}`,
                thumbnailUrl: v.videoThumbnails?.slice(-1)[0]?.url || `https://img.youtube.com/vi/${v.videoId}/hqdefault.jpg`
              };
            });

            res.status(200).json({
              playlistId,
              title: invJson.title || 'Playlist do YouTube',
              total: items.length,
              items
            });
            return;
          }
        }
      } catch {
        // Tenta próxima instância
      }
    }

    // 2. Fallback para YouTube RSS Feed
    const rssUrl = `https://www.youtube.com/feeds/videos.xml?playlist_id=${encodeURIComponent(playlistId)}`;
    const response = await fetch(rssUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (response.ok) {
      const xmlText = await response.text();
      const playlistTitleMatch = xmlText.match(/<title>([\s\S]*?)<\/title>/);
      const playlistTitle = playlistTitleMatch ? playlistTitleMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim() : 'Playlist do YouTube';

      const entries = xmlText.split('<entry>');
      const items: Array<{
        videoId: string;
        title: string;
        artist: string;
        url: string;
        thumbnailUrl: string;
      }> = [];

      for (let i = 1; i < entries.length; i++) {
        const block = entries[i];
        const idMatch = block.match(/<yt:videoId>(.*?)<\/yt:videoId>/);
        const titleMatch = block.match(/<title>([\s\S]*?)<\/title>/);
        const authorMatch = block.match(/<name>([\s\S]*?)<\/name>/);

        if (idMatch && titleMatch) {
          const videoId = idMatch[1].trim();
          const rawTitle = titleMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim();
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
        res.status(200).json({
          playlistId,
          title: playlistTitle,
          total: items.length,
          items
        });
        return;
      }
    }

    res.status(404).json({
      error: 'Playlist não encontrada ou privada. Verifique se o link da playlist está como Pública ou Não Listada no YouTube.'
    });
  } catch (error) {
    console.error('Erro ao processar playlist do YouTube:', error);
    res.status(500).json({ error: 'Erro interno ao processar a playlist do YouTube.' });
  }
});

// -----------------------------------------------------------------------------
// 5. SERVINDO ARQUIVOS ESTÁTICOS DO FRONTEND (SPA)
// -----------------------------------------------------------------------------
if (fs.existsSync(publicPath)) {
  console.log(`📁 Servindo frontend estático a partir de: ${publicPath}`);
  app.use(express.static(publicPath));

  // Roteamento SPA: Qualquer rota não reconhecida pela API entrega index.html
  app.get('*', (req: Request, res: Response, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    const indexPath = path.join(publicPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).send('Frontend build not found');
    }
  });
} else {
  console.log(`ℹ️ Diretório public/ não encontrado em ${publicPath}. Operando em modo API pura.`);
  app.get('/', (_req: Request, res: Response) => {
    res.json({
      message: 'Louvor App Backend API está online.',
      endpoints: ['/api/health', '/api/info', '/api/youtube/playlist']
    });
  });
}

// -----------------------------------------------------------------------------
// 6. INICIALIZAÇÃO DO SERVIDOR (Cloud Run / Local)
// -----------------------------------------------------------------------------
const server = app.listen(PORT, HOST, () => {
  console.log(`🚀 Servidor Louvor App rodando em http://${HOST}:${PORT}`);
  console.log(`📡 Ambiente: ${process.env.NODE_ENV || 'development'}`);
});

// Tratamento de Encerramento Gracioso (Graceful Shutdown para Cloud Run)
function handleShutdown(signal: string) {
  console.log(`\n🛑 Sinal ${signal} recebido. Encerrando servidor graciosamente...`);
  server.close(() => {
    console.log('✅ Servidor HTTP encerrado.');
    process.exit(0);
  });

  // Força encerramento se travar por mais de 10s
  setTimeout(() => {
    console.error('⚠️ Encerramento forçado após timeout.');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

export default app;
