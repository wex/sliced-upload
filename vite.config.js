import { defineConfig } from "vite";

export default defineConfig({
    build: {
        lib: {
            entry: './src/sliced-upload.ts',
            name: 'SlicedUpload',
            fileName: (format) => `sliced-upload.min.js`,
            formats: ['umd'],
        }
    },
});