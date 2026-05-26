import { defineConfig, searchForWorkspaceRoot } from "vite";

export default defineConfig({
    server: {
        fs: {
            allow: [searchForWorkspaceRoot(process.cwd())],
            strict: false, // Disable strict file serving restrictions
        },
    },
});
