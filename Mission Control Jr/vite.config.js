import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';
import { MISSIONS, missionById } from './mission-registry.js';

const cleanMissionRoutes = new Map(MISSIONS.map(mission=>[`/${mission.path}`,mission]));
const cleanPageRoutes = new Map([['/campaign','/campaign.html'],['/mission-map','/index.html?view=mission-map']]);
function rewriteMissionRoutes(request, response, next) {
  if (request.url) {
    const url = new URL(request.url, 'http://localhost');
    const route=url.pathname.replace(/\/$/,'');
    if (route==='/index.html') {
      const mission=missionById(url.searchParams.get('mission'));
      const destination=mission
        ? `/${mission.path}${url.searchParams.has('sampler')?'?sampler=1':''}`
        : url.searchParams.get('view')==='mission-map' ? '/mission-map' : '/';
      response.writeHead(301,{Location:destination});
      response.end();
      return;
    }
    const mission=cleanMissionRoutes.get(route);
    const page=cleanPageRoutes.get(route);
    if ((mission||page)&&url.pathname.endsWith('/')) {
      response.writeHead(301,{Location:`${route}${url.search}`});
      response.end();
      return;
    }
    if (mission) {
      request.url=mission.id==='extended'
        ? `/base-boss.html${url.search}`
        : `/index.html?mission=${encodeURIComponent(mission.id)}${url.searchParams.has('sampler')?'&sampler=1':''}`;
      return next();
    }
    if (page) {
      request.url=`${page}${url.search}`;
      return next();
    }
    if (route==='/extended') {
      response.writeHead(301,{Location:`/base-boss${url.search}`});
      response.end();
      return;
    }
  }
  next();
}

function cleanChapterRoutes() {
  return {
    name: 'mission-control-clean-chapter-routes',
    configureServer(server) { server.middlewares.use(rewriteMissionRoutes); },
    configurePreviewServer(server) { server.middlewares.use(rewriteMissionRoutes); },
    generateBundle() {
      for (const name of ['ASSET-REFERENCES.md', 'LEARNING-OBJECTIVES.md']) {
        this.emitFile({type:'asset', fileName:name, source:readFileSync(new URL(`./${name}`, import.meta.url))});
      }
      this.emitFile({
        type: 'asset',
        fileName: '_redirects',
        source: [
          ...MISSIONS.flatMap(mission=>[
            `/${mission.path}/ /${mission.path} 301`,
            mission.id==='extended'
              ? `/${mission.path} /${mission.file} 200`
              : `/${mission.path} /index.html?mission=${mission.id} 200`,
          ]),
          '/campaign/ /campaign 301',
          '/campaign /campaign.html 200',
          '/mission-map/ /mission-map 301',
          '/mission-map /index.html?view=mission-map 200',
          ...MISSIONS.map(mission=>`/index.html?mission=${mission.id} /${mission.path} 301`),
          '/index.html?view=mission-map /mission-map 301',
          '/index.html / 301',
          '/extended /base-boss 301',
        ].join('\n')+'\n',
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
        baseBoss: fileURLToPath(new URL('./base-boss.html',import.meta.url)),
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
