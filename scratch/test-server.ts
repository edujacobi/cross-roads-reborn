import { startApiServer, stopApiServer } from "../src/api/server";

async function test() {
	console.log("Starting test API server on port 3099...");
	const server = await startApiServer(3099);

	console.log("Testing /health...");
	const healthRes = await fetch("http://localhost:3099/health");
	const healthJson = await healthRes.json();
	console.log("Health response:", healthJson);

	console.log("Testing /graphql introspection...");
	const gqlRes = await fetch("http://localhost:3099/graphql", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			query: "{ __typename }",
		}),
	});
	const gqlJson = await gqlRes.json();
	console.log("GraphQL response:", gqlJson);

	console.log("Stopping API server...");
	await stopApiServer();
	console.log("API Server test completed successfully!");
	process.exit(0);
}

test().catch((err) => {
	console.error("Test failed:", err);
	process.exit(1);
});
