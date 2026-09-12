import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
export default defineConfig({plugins:[react()],base:'./',resolve:{alias:{'@':fileURLToPath(new URL('.',import.meta.url))}},build:{outDir:'pages-dist',emptyOutDir:true},define:{'process.env.NODE_ENV':'"production"'}});
