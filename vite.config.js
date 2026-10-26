import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    // Puerto propio para no chocar con otros proyectos que usan el 3000.
    port: 5180,
    // Permite abrir el piloto desde el celular en la misma red wifi.
    host: true,
  },
  preview: {
    port: 5181,
    host: true,
  },
});
