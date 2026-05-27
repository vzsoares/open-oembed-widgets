import Alpine from "alpinejs";
import { applyThemeFromQuery } from "../../lib/theme";
import {
    type Card,
    fetchCard,
    type GitHubConfig,
    parseGitHubConfig,
} from "./github";

applyThemeFromQuery();

const config = parseGitHubConfig(window.location.search);

interface GitHubWidget {
    config: GitHubConfig;
    loading: boolean;
    failed: boolean;
    card: Card | null;
    init(): void;
    load(): Promise<void>;
}

Alpine.data(
    "githubWidget",
    (): GitHubWidget => ({
        config,
        loading: true,
        failed: false,
        card: null,

        init() {
            void this.load();
        },

        async load() {
            this.loading = true;
            this.failed = false;
            try {
                this.card = await fetchCard(this.config);
            } catch {
                this.failed = true;
            } finally {
                this.loading = false;
            }
        },
    }),
);

Alpine.start();
