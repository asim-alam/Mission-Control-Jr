import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';
import { MISSIONS } from './mission-registry.js';

const chapterRoutes = new Set(MISSIONS.map(mission=>`/${mission.id}`));
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
      for (const name of ['ASSET-REFERENCES.md', 'LEARNING-OBJECTIVES.md']) {
        this.emitFile({type:'asset', fileName:name, source:readFileSync(new URL(`./${name}`, import.meta.url))});
      }
      this.emitFile({
        type: 'asset',
        fileName: '_redirects',
        source: MISSIONS.map(mission=>`/${mission.id} /index.html 200`).join('\n')+'\n',
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
        sources: fileURLToPath(new URL('./sources.html',import.meta.url)),
        expansion: fileURLToPath(new URL('./expansion.html',import.meta.url)),
        greenhouse: fileURLToPath(new URL('./greenhouse.html',import.meta.url)),
        earthDelay: fileURLToPath(new URL('./earth-delay.html',import.meta.url)),
        lunarSunlight: fileURLToPath(new URL('./lunar-sunlight.html',import.meta.url)),
        lunarDust: fileURLToPath(new URL('./lunar-dust.html',import.meta.url)),
        lunarRelay: fileURLToPath(new URL('./lunar-relay.html',import.meta.url)),
      },
    },
  },
});
