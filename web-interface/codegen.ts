import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
	schema: "../src/api/graphql/schema.ts",
	documents: "graphql/operations.graphql",
	generates: {
		"graphql/generated.ts": {
			plugins: [
				{ add: { content: "/* eslint-disable */\n// @ts-nocheck" } },
				"typescript",
				"typescript-operations",
				"typed-document-node",
			],
			config: {
				useTypeImports: true,
			},
		},
	},
};

export default config;
