import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  // Carrega as variáveis de ambiente baseadas no mode (ex: production)
  const env = loadEnv(mode, process.cwd(), '');
  
  console.log('\n=========================================');
  console.log('🔥 VITE BUILD ENV DEBUG 🔥');
  console.log(`- Mode: ${mode}`);
  console.log(`- Diretório (cwd): ${process.cwd()}`);
  console.log(`- VITE_FIREBASE_API_KEY: ${env.VITE_FIREBASE_API_KEY ? '✅ DEFINIDA' : '❌ FALTANDO'}`);
  console.log(`- VITE_FIREBASE_PROJECT_ID: ${env.VITE_FIREBASE_PROJECT_ID ? '✅ DEFINIDA' : '❌ FALTANDO'}`);
  console.log('=========================================\n');

  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'prompt',
        includeAssets: ['icon.svg', 'apple-touch-icon-180x180.png'],
        manifest: {
          name: 'Louvor App - Ministério de Louvor',
          short_name: 'Louvor App',
          description: 'App Moderno para Gestão do Ministério de Louvor, Escalas, Repertório e Equipes.',
          theme_color: '#10b981',
          background_color: '#090d16',
          display: 'standalone',
          orientation: 'portrait',
          icons: [
            { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
            { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
            { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
          ]
        }
      })
    ],
    server: {
      port: 5173,
      host: true
    },
    preview: {
      port: 8080,
      host: true
    }
  };
});
