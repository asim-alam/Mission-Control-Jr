import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

const chapterRoutes = new Set(['/orbit', '/storm', '/rover', '/extended']);
function rewriteChapterRoutes(_request, _response, next) {
  if (_request.url) {
    const url = new URL(_request.url, 'http://localhost');
    if (chapterRoutes.has(url.pathname)) _request.url = `/index.html${url.search}`;
  }
  next();
}

function cleanChapterRoutes() {
  return {
    name: 'mission-control-clean-chapter-routes',
    configureServer(server) { server.middlewares.use(rewriteChapterRoutes); },
    configurePreviewServer(server) { server.middlewares.use(rewriteChapterRoutes); },
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: '_redirects',
        source: '/orbit /index.html 200\n/storm /index.html 200\n/rover /index.html 200\n/extended /index.html 200\n',
      });
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [cleanChapterRoutes()],
  build: {
    rolldownOptions: {
      input: {
        game: fileURLToPath(new URL('./index.html',import.meta.url)),
        storm: fileURLToPath(new URL('./storm.html',import.meta.url)),
        mission2: fileURLToPath(new URL('./mission2.html',import.meta.url)),
        orbit: fileURLToPath(new URL('./orbit.html',import.meta.url)),
        campaign: fileURLToPath(new URL('./campaign.html',import.meta.url)),
        models: fileURLToPath(new URL('./models.html',import.meta.url)),
      },
    },
  },
});
