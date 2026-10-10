import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  base: './',
  build: {
    rolldownOptions: {
      input: {
        game: fileURLToPath(new URL('./index.html',import.meta.url)),
        campaign: fileURLToPath(new URL('./campaign.html',import.meta.url)),
        models: fileURLToPath(new URL('./models.html',import.meta.url)),
      },
    },
  },
});
