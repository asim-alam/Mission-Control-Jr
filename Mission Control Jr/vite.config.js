import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  base: './',
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
