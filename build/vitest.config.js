"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vite_tsconfig_paths_1 = __importDefault(require("vite-tsconfig-paths"));
const config_1 = require("vitest/config");
exports.default = (0, config_1.defineConfig)({
    plugins: [(0, vite_tsconfig_paths_1.default)()],
    test: {
        globals: true,
        environment: "node",
        include: ["tests/**/*.test.ts"],
        coverage: {
            provider: "v8",
            reporter: ["text", "json", "html"],
            include: ["src/core/models/**/*.ts"],
        },
    },
});
//# sourceMappingURL=vitest.config.js.map