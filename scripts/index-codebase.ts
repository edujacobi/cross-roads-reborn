import * as fs from "fs";
import * as path from "path";
import ts from "typescript";

// Define interface structures for the graph
interface GraphNode {
	id: string;
	type: "file" | "class" | "method" | "function" | "command";
	name: string;
	filePath: string;
	startLine?: number;
	endLine?: number;
	description?: string;
	className?: string;
}

interface GraphEdge {
	source: string;
	target: string;
	type: "IMPORTS" | "DEFINES" | "CALLS";
}

// Relative path helper
function getRelativePath(absolutePath: string): string {
	return path.relative(process.cwd(), absolutePath).replace(/\\/g, "/");
}

// Find all TS files recursively in a directory
function getTsFiles(dir: string): string[] {
	let results: string[] = [];
	if (!fs.existsSync(dir)) return results;
	const list = fs.readdirSync(dir);
	for (const file of list) {
		const filePath = path.join(dir, file);
		const stat = fs.statSync(filePath);
		if (stat && stat.isDirectory()) {
			results = results.concat(getTsFiles(filePath));
		}
		else if (filePath.endsWith(".ts") && !filePath.endsWith(".d.ts")) {
			results.push(filePath);
		}
	}
	return results;
}

// Helper to check if a node is nested inside any function/arrow definition
function isInsideFunction(node: ts.Node): boolean {
	let parent = node.parent;
	while (parent) {
		if (
			ts.isArrowFunction(parent) ||
			ts.isFunctionExpression(parent) ||
			ts.isFunctionDeclaration(parent) ||
			ts.isMethodDeclaration(parent)
		) {
			return true;
		}
		parent = parent.parent;
	}
	return false;
}

// Extract slash command metadata from file AST
function extractCommandInfo(sourceFile: ts.SourceFile): { name: string; description: string } {
	let name = path.basename(sourceFile.fileName, ".ts");
	let description = "";

	function visitNode(node: ts.Node) {
		if (ts.isCallExpression(node) && !isInsideFunction(node)) {
			const exp = node.expression;
			if (ts.isPropertyAccessExpression(exp)) {
				if (exp.name.text === "setName" && node.arguments.length > 0) {
					const arg = node.arguments[0];
					if (ts.isStringLiteral(arg)) {
						name = arg.text;
					}
				}
				else if (exp.name.text === "setDescription" && node.arguments.length > 0) {
					const arg = node.arguments[0];
					if (ts.isStringLiteral(arg)) {
						description = arg.text;
					}
				}
			}
		}
		ts.forEachChild(node, visitNode);
	}

	visitNode(sourceFile);
	return { name, description };
}

function main() {
	console.log("Starting codebase indexing...");

	// Locate files to index
	const workspaceDir = process.cwd();
	const srcDir = path.join(workspaceDir, "src");

	const tsFiles = getTsFiles(srcDir);
	console.log(`Found ${tsFiles.length} TypeScript files to parse.`);

	// Load tsconfig.json compiler options
	const tsconfigPath = path.join(workspaceDir, "tsconfig.json");
	let compilerOptions: ts.CompilerOptions = {};
	if (fs.existsSync(tsconfigPath)) {
		const tsconfigParsed = ts.readConfigFile(tsconfigPath, ts.sys.readFile);
		const config = ts.parseJsonConfigFileContent(tsconfigParsed.config, ts.sys, workspaceDir);
		compilerOptions = config.options;
	}

	// Create compiler program and type checker
	const program = ts.createProgram(tsFiles, compilerOptions);
	const checker = program.getTypeChecker();

	const nodes: GraphNode[] = [];
	const edges: GraphEdge[] = [];
	const posMap = new Map<string, string>(); // key: "filepath:startPos", value: node.id

	// Add File Nodes and define nodes
	for (const file of tsFiles) {
		const relativePath = getRelativePath(file);
		const sourceFile = program.getSourceFile(file);
		if (!sourceFile) continue;

		const lines = sourceFile.text.split(/\r?\n/).length;
		nodes.push({
			id: `file:${relativePath}`,
			type: "file",
			name: path.basename(file),
			filePath: relativePath,
			startLine: 1,
			endLine: lines
		});
	}

	// ----------------------------------------------------
	// FIRST PASS: Extract all definitions (Classes, Methods, Functions, Commands)
	// ----------------------------------------------------
	for (const file of tsFiles) {
		const sourceFile = program.getSourceFile(file);
		if (!sourceFile) continue;
		const relativePath = getRelativePath(file);

		let isCommand = false;
		let commandName = "";
		let commandDesc = "";
		if (relativePath.startsWith("src/bot/commands/")) {
			isCommand = true;
			const info = extractCommandInfo(sourceFile);
			commandName = info.name;
			commandDesc = info.description;
		}

		if (isCommand) {
			const cmdId = `command:${commandName}`;
			nodes.push({
				id: cmdId,
				type: "command",
				name: commandName,
				filePath: relativePath,
				description: commandDesc
			});
			edges.push({
				source: `file:${relativePath}`,
				target: cmdId,
				type: "DEFINES"
			});
		}

		function visit(node: ts.Node) {
			if (ts.isClassDeclaration(node) && node.name) {
				const className = node.name.text;
				const classId = `class:${relativePath}:${className}@${node.getStart()}`;
				const { line: startLine } = sourceFile!.getLineAndCharacterOfPosition(node.getStart());
				const { line: endLine } = sourceFile!.getLineAndCharacterOfPosition(node.getEnd());

				nodes.push({
					id: classId,
					type: "class",
					name: className,
					filePath: relativePath,
					startLine: startLine + 1,
					endLine: endLine + 1
				});
				posMap.set(`${relativePath}:${node.getStart()}`, classId);

				edges.push({
					source: `file:${relativePath}`,
					target: classId,
					type: "DEFINES"
				});

				// Traverse methods inside the class
				ts.forEachChild(node, (child) => {
					if (ts.isMethodDeclaration(child) && child.name) {
						const methodName = child.name.getText();
						const methodId = `method:${relativePath}:${className}#${methodName}@${child.getStart()}`;
						const { line: mStartLine } = sourceFile!.getLineAndCharacterOfPosition(child.getStart());
						const { line: mEndLine } = sourceFile!.getLineAndCharacterOfPosition(child.getEnd());

						nodes.push({
							id: methodId,
							type: "method",
							name: methodName,
							className: className,
							filePath: relativePath,
							startLine: mStartLine + 1,
							endLine: mEndLine + 1
						});
						posMap.set(`${relativePath}:${child.getStart()}`, methodId);

						edges.push({
							source: classId,
							target: methodId,
							type: "DEFINES"
						});
					}
				});
			}
			else if (ts.isFunctionDeclaration(node) && node.name) {
				const funcName = node.name.text;
				const funcId = `function:${relativePath}:${funcName}@${node.getStart()}`;
				const { line: startLine } = sourceFile!.getLineAndCharacterOfPosition(node.getStart());
				const { line: endLine } = sourceFile!.getLineAndCharacterOfPosition(node.getEnd());

				nodes.push({
					id: funcId,
					type: "function",
					name: funcName,
					filePath: relativePath,
					startLine: startLine + 1,
					endLine: endLine + 1
				});
				posMap.set(`${relativePath}:${node.getStart()}`, funcId);

				edges.push({
					source: `file:${relativePath}`,
					target: funcId,
					type: "DEFINES"
				});
			}
			else if (ts.isVariableDeclaration(node) && node.name && node.initializer &&
				(ts.isArrowFunction(node.initializer) || ts.isFunctionExpression(node.initializer))) {
				const funcName = node.name.getText();
				const funcId = `function:${relativePath}:${funcName}@${node.getStart()}`;
				const { line: startLine } = sourceFile!.getLineAndCharacterOfPosition(node.getStart());
				const { line: endLine } = sourceFile!.getLineAndCharacterOfPosition(node.getEnd());

				nodes.push({
					id: funcId,
					type: "function",
					name: funcName,
					filePath: relativePath,
					startLine: startLine + 1,
					endLine: endLine + 1
				});
				posMap.set(`${relativePath}:${node.getStart()}`, funcId);

				edges.push({
					source: `file:${relativePath}`,
					target: funcId,
					type: "DEFINES"
				});
			}
			else if (ts.isMethodDeclaration(node) && node.name && ts.isObjectLiteralExpression(node.parent)) {
				const funcName = node.name.getText();
				const funcId = `function:${relativePath}:${funcName}@${node.getStart()}`;
				const { line: startLine } = sourceFile!.getLineAndCharacterOfPosition(node.getStart());
				const { line: endLine } = sourceFile!.getLineAndCharacterOfPosition(node.getEnd());

				nodes.push({
					id: funcId,
					type: "function",
					name: funcName,
					filePath: relativePath,
					startLine: startLine + 1,
					endLine: endLine + 1
				});
				posMap.set(`${relativePath}:${node.getStart()}`, funcId);

				edges.push({
					source: `file:${relativePath}`,
					target: funcId,
					type: "DEFINES"
				});

				if (isCommand && funcName === "execute") {
					edges.push({
						source: `command:${commandName}`,
						target: funcId,
						type: "CALLS"
					});
				}
			}
			else if (ts.isPropertyAssignment(node) && node.name && node.initializer &&
				(ts.isArrowFunction(node.initializer) || ts.isFunctionExpression(node.initializer)) &&
				ts.isObjectLiteralExpression(node.parent)) {
				const funcName = node.name.getText();
				const funcId = `function:${relativePath}:${funcName}@${node.getStart()}`;
				const { line: startLine } = sourceFile!.getLineAndCharacterOfPosition(node.getStart());
				const { line: endLine } = sourceFile!.getLineAndCharacterOfPosition(node.getEnd());

				nodes.push({
					id: funcId,
					type: "function",
					name: funcName,
					filePath: relativePath,
					startLine: startLine + 1,
					endLine: endLine + 1
				});
				posMap.set(`${relativePath}:${node.getStart()}`, funcId);

				edges.push({
					source: `file:${relativePath}`,
					target: funcId,
					type: "DEFINES"
				});

				if (isCommand && funcName === "execute") {
					edges.push({
						source: `command:${commandName}`,
						target: funcId,
						type: "CALLS"
					});
				}
			}

			if (!ts.isClassDeclaration(node)) {
				ts.forEachChild(node, visit);
			}
		}

		ts.forEachChild(sourceFile, visit);
	}

	// ----------------------------------------------------
	// SECOND PASS: Extract all relationships (Imports & Calls)
	// ----------------------------------------------------
	for (const file of tsFiles) {
		const sourceFile = program.getSourceFile(file);
		if (!sourceFile) continue;
		const relativePath = getRelativePath(file);

		function visit(node: ts.Node, currentContextId: string) {
			let nextContextId = currentContextId;

			const currentPosKey = `${relativePath}:${node.getStart()}`;
			if (posMap.has(currentPosKey)) {
				const mappedId = posMap.get(currentPosKey)!;
				if (mappedId.startsWith("method:") || mappedId.startsWith("function:")) {
					nextContextId = mappedId;
				}
			}

			// 1. Process Imports
			if (ts.isImportDeclaration(node)) {
				const moduleSpecifier = node.moduleSpecifier;
				if (ts.isStringLiteral(moduleSpecifier)) {
					const symbol = checker.getSymbolAtLocation(moduleSpecifier);
					if (symbol) {
						const decls = symbol.getDeclarations();
						if (decls && decls.length > 0) {
							const targetFile = decls[0].getSourceFile().fileName;
							const targetRelative = getRelativePath(targetFile);
							if (targetRelative.includes("src")) {
								const edgeExists = edges.some(e =>
									e.source === `file:${relativePath}` &&
									e.target === `file:${targetRelative}` &&
									e.type === "IMPORTS"
								);
								if (!edgeExists && relativePath !== targetRelative) {
									edges.push({
										source: `file:${relativePath}`,
										target: `file:${targetRelative}`,
										type: "IMPORTS"
									});
								}
							}
						}
					}
				}
			}

			// Helper to add call edge
			function addCallEdge(calleeSymbol: ts.Symbol | undefined) {
				if (!calleeSymbol) return;
				const decls = calleeSymbol.getDeclarations();
				if (!decls) return;
				for (const decl of decls) {
					const declFile = decl.getSourceFile().fileName;
					const declRelative = getRelativePath(declFile);
					if (declRelative.includes("src")) {
						const declPosKey = `${declRelative}:${decl.getStart()}`;
						if (posMap.has(declPosKey)) {
							const targetId = posMap.get(declPosKey)!;
							const edgeExists = edges.some(e =>
								e.source === nextContextId &&
								e.target === targetId &&
								e.type === "CALLS"
							);
							if (!edgeExists && nextContextId !== targetId) {
								edges.push({
									source: nextContextId,
									target: targetId,
									type: "CALLS"
								});
							}
						}
					}
				}
			}

			// 2. Process Calls
			if (ts.isCallExpression(node)) {
				let symbol = checker.getSymbolAtLocation(node.expression);
				if (!symbol && ts.isPropertyAccessExpression(node.expression)) {
					symbol = checker.getSymbolAtLocation(node.expression.name);
				}
				addCallEdge(symbol);
			}

			// 3. Process Constructor Calls (NewExpression)
			if (ts.isNewExpression(node)) {
				const symbol = checker.getSymbolAtLocation(node.expression);
				addCallEdge(symbol);
			}

			ts.forEachChild(node, (child) => visit(child, nextContextId));
		}

		ts.forEachChild(sourceFile, (child) => visit(child, `file:${relativePath}`));
	}

	// ----------------------------------------------------
	// POST-PROCESSING: Calculate Statistics, Hotspots, and Dead Code
	// ----------------------------------------------------
	const inDegree = new Map<string, number>();
	const outDegree = new Map<string, number>();

	for (const node of nodes) {
		inDegree.set(node.id, 0);
		outDegree.set(node.id, 0);
	}

	for (const edge of edges) {
		if (edge.type === "CALLS") {
			inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
			outDegree.set(edge.source, (outDegree.get(edge.source) || 0) + 1);
		}
	}

	// Hotspots: Methods/functions with the most incoming calls
	const hotspots = nodes
		.filter(n => n.type === "method" || n.type === "function")
		.map(n => ({ id: n.id, name: n.name, type: n.type, filePath: n.filePath, count: inDegree.get(n.id) || 0 }))
		.filter(h => h.count > 0)
		.sort((a, b) => b.count - a.count)
		.slice(0, 10);

	// Dead Code Candidates: Methods or functions with 0 incoming calls
	// Note: We exclude:
	// - "execute" functions (which are bot command execution entry points)
	// - "main" or exported functions in entry points (like src/index.ts)
	// - Methods on Database models (Sequelize models/schemas, since they are called by Sequelize or are model hooks/configs)
	// - Interfaces/Types
	const deadCode = nodes
		.filter(n => n.type === "method" || n.type === "function")
		.filter(n => {
			if (n.name === "execute") return false;
			if (n.filePath.startsWith("src/core/database/")) return false; // db structures
			if (n.filePath === "src/index.ts") return false; // entry point
			const incoming = inDegree.get(n.id) || 0;
			return incoming === 0;
		})
		.map(n => ({ name: n.name, type: n.type, filePath: n.filePath, startLine: n.startLine, id: n.id }));

	// Write JSON Graph output
	const graphOutput = { nodes, edges };
	const graphPath = path.join(workspaceDir, "codebase_graph.json");
	fs.writeFileSync(graphPath, JSON.stringify(graphOutput, null, 2).replace(/\n/g, "\r\n"), "utf-8");
	console.log(`Saved JSON graph to ${graphPath}`);

	// Write human-readable Markdown index
	const markdownPath = path.join(workspaceDir, "codebase_index.md");
	const mdContent = generateMarkdownIndex(nodes, edges, hotspots, deadCode);
	fs.writeFileSync(markdownPath, mdContent.replace(/\n/g, "\r\n"), "utf-8");
	console.log(`Saved Markdown index to ${markdownPath}`);

	// Write interactive HTML graph explorer
	const htmlPath = path.join(workspaceDir, "codebase_graph.html");
	const htmlContent = generateHtmlGraph(nodes, edges);
	fs.writeFileSync(htmlPath, htmlContent.replace(/\n/g, "\r\n"), "utf-8");
	console.log(`Saved HTML graph explorer to ${htmlPath}`);

	console.log("Codebase indexing completed successfully!");
}

// Generate an interactive HTML visualization using Vis.js
function generateHtmlGraph(nodes: GraphNode[], edges: GraphEdge[]): string {
	const colors = {
		command: { background: "#10b981", border: "#059669", highlight: { background: "#34d399", border: "#10b981" } },
		file: { background: "#3b82f6", border: "#2563eb", highlight: { background: "#60a5fa", border: "#3b82f6" } },
		class: { background: "#a855f7", border: "#7c3aed", highlight: { background: "#c084fc", border: "#a855f7" } },
		method: { background: "#f43f5e", border: "#e11d48", highlight: { background: "#fb7185", border: "#f43f5e" } },
		function: { background: "#f59e0b", border: "#d97706", highlight: { background: "#fbbf24", border: "#f59e0b" } }
	};

	const visNodes = nodes.map(n => {
		const label = n.type === "command" ? `/${n.name}` : n.name;
		const color = colors[n.type] || colors.function;
		return {
			id: n.id,
			label: label,
			group: n.type,
			color: {
				background: color.background,
				border: color.border,
				highlight: color.highlight,
				hover: color.highlight
			},
			shape: n.type === "file" ? "box" : "dot",
			size: n.type === "file" || n.type === "class" ? 18 : 12,
			font: { color: "#ffffff", size: 12 },
			title: `${n.type.toUpperCase()}: ${n.name}\nFile: ${n.filePath}`
		};
	});

	const visEdges = edges.map((e, idx) => {
		let color = "#475569"; // slate-600
		let dashes = false;
		if (e.type === "IMPORTS") {
			color = "#3b82f6"; // blue
			dashes = true;
		}
		else if (e.type === "DEFINES") {
			color = "#a855f7"; // purple
		}
		else if (e.type === "CALLS") {
			color = "#f43f5e"; // rose
		}
		return {
			id: `edge-${idx}`,
			from: e.source,
			to: e.target,
			arrows: e.type === "CALLS" || e.type === "IMPORTS" ? { to: { enabled: true, scaleFactor: 0.5 } } : undefined,
			color: { color: color, highlight: "#38bdf8", hover: "#38bdf8" },
			dashes: dashes,
			width: 1.5,
			title: e.type
		};
	});

	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<title>Codebase Knowledge Graph Explorer</title>
	<script type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/vis-network/9.1.9/standalone/umd/vis-network.min.js"></script>
	<style>
		body {
			margin: 0;
			padding: 0;
			background-color: #0f172a;
			color: #f8fafc;
			font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
			display: flex;
			height: 100vh;
			overflow: hidden;
		}
		.sidebar-left {
			width: 300px;
			background-color: #1e293b;
			border-right: 1px solid #334155;
			display: flex;
			flex-direction: column;
			box-sizing: border-box;
		}
		.sidebar-right {
			width: 360px;
			background-color: #1e293b;
			border-left: 1px solid #334155;
			display: flex;
			flex-direction: column;
			box-sizing: border-box;
		}
		.main-content {
			flex: 1;
			position: relative;
		}
		.header {
			padding: 16px;
			background-color: #1e293b;
			border-bottom: 1px solid #334155;
			display: flex;
			flex-direction: column;
			gap: 4px;
		}
		.header h1 {
			margin: 0;
			font-size: 16px;
			font-weight: 600;
			color: #38bdf8;
		}
		#network {
			position: absolute;
			top: 0;
			left: 0;
			right: 0;
			bottom: 0;
			background-color: #0f172a;
		}
		.panel-section {
			padding: 16px;
			border-bottom: 1px solid #334155;
		}
		.panel-title {
			font-size: 12px;
			font-weight: 600;
			color: #94a3b8;
			margin-bottom: 12px;
			text-transform: uppercase;
			letter-spacing: 0.05em;
		}
		.checkbox-group {
			display: flex;
			flex-direction: column;
			gap: 8px;
		}
		.checkbox-label {
			display: flex;
			align-items: center;
			gap: 8px;
			font-size: 13px;
			cursor: pointer;
		}
		.search-box {
			width: 100%;
			padding: 8px 12px;
			background-color: #0f172a;
			border: 1px solid #334155;
			border-radius: 6px;
			color: #f8fafc;
			box-sizing: border-box;
			font-size: 13px;
			outline: none;
		}
		.search-box:focus {
			border-color: #38bdf8;
		}
		.btn {
			width: 100%;
			padding: 8px 12px;
			background-color: #38bdf8;
			border: none;
			border-radius: 6px;
			color: #0f172a;
			font-weight: 600;
			cursor: pointer;
			font-size: 13px;
			transition: background-color 0.2s;
			text-align: center;
			box-sizing: border-box;
		}
		.btn:hover {
			background-color: #0ea5e9;
		}
		.btn-secondary {
			background-color: #334155;
			color: #f8fafc;
			margin-top: 8px;
		}
		.btn-secondary:hover {
			background-color: #475569;
		}
		.details-body {
			flex: 1;
			overflow-y: auto;
			padding: 16px;
		}
		.node-title {
			font-size: 18px;
			font-weight: bold;
			color: #f8fafc;
			margin-bottom: 8px;
			word-break: break-all;
		}
		.node-meta {
			font-size: 12px;
			color: #94a3b8;
			margin-bottom: 16px;
			line-height: 1.5;
		}
		.neighbor-list {
			list-style: none;
			padding: 0;
			margin: 0;
			display: flex;
			flex-direction: column;
			gap: 6px;
		}
		.neighbor-item {
			padding: 8px;
			background-color: #0f172a;
			border: 1px solid #334155;
			border-radius: 4px;
			font-size: 12px;
			cursor: pointer;
			transition: border-color 0.2s;
			word-break: break-all;
			display: flex;
			flex-direction: column;
			gap: 2px;
		}
		.neighbor-item:hover {
			border-color: #38bdf8;
		}
		.neighbor-name {
			font-weight: 600;
			color: #f8fafc;
		}
		.neighbor-file {
			font-size: 10px;
			color: #94a3b8;
		}
		.badge {
			display: inline-block;
			padding: 2px 6px;
			border-radius: 4px;
			font-size: 10px;
			font-weight: bold;
			text-transform: uppercase;
			margin-bottom: 8px;
		}
		.badge-command { background-color: #10b981; color: #0f172a; }
		.badge-file { background-color: #3b82f6; color: #ffffff; }
		.badge-class { background-color: #a855f7; color: #ffffff; }
		.badge-method { background-color: #f43f5e; color: #ffffff; }
		.badge-function { background-color: #f59e0b; color: #0f172a; }
		
		.stats-list {
			display: flex;
			flex-direction: column;
			gap: 8px;
			font-size: 13px;
		}
		.stats-item {
			display: flex;
			justify-content: space-between;
			border-bottom: 1px dashed #334155;
			padding-bottom: 4px;
		}
		.legend-item {
			display: flex;
			align-items: center;
			gap: 8px;
			font-size: 12px;
			margin-bottom: 6px;
		}
		.legend-color {
			width: 12px;
			height: 12px;
			border-radius: 50%;
		}
	</style>
</head>
<body>
	<!-- Left Sidebar: Controls & Stats -->
	<div class="sidebar-left">
		<div class="header">
			<h1>Codebase Explorer</h1>
			<div style="font-size: 11px; color: #94a3b8;">cross-roads-reborn knowledge graph</div>
		</div>
		
		<div class="panel-section">
			<div class="panel-title">Node Search</div>
			<input type="text" id="searchBox" class="search-box" placeholder="Type node name..." oninput="onSearchChange(this.value)" />
		</div>
		
		<div class="panel-section">
			<div class="panel-title">Node Type Filter</div>
			<div class="checkbox-group">
				<label class="checkbox-label"><input type="checkbox" id="filter-command" checked onchange="toggleFilter('command', this.checked)"> Commands</label>
				<label class="checkbox-label"><input type="checkbox" id="filter-file" checked onchange="toggleFilter('file', this.checked)"> Files</label>
				<label class="checkbox-label"><input type="checkbox" id="filter-class" checked onchange="toggleFilter('class', this.checked)"> Classes</label>
				<label class="checkbox-label"><input type="checkbox" id="filter-method" onchange="toggleFilter('method', this.checked)"> Methods</label>
				<label class="checkbox-label"><input type="checkbox" id="filter-function" onchange="toggleFilter('function', this.checked)"> Functions</label>
			</div>
		</div>

		<div class="panel-section">
			<div class="panel-title">Legend</div>
			<div class="legend-item"><div class="legend-color" style="background-color: #10b981;"></div>Commands</div>
			<div class="legend-item"><div class="legend-color" style="background-color: #3b82f6; border-radius: 2px;"></div>Files</div>
			<div class="legend-item"><div class="legend-color" style="background-color: #a855f7;"></div>Classes</div>
			<div class="legend-item"><div class="legend-color" style="background-color: #f43f5e;"></div>Methods</div>
			<div class="legend-item"><div class="legend-color" style="background-color: #f59e0b;"></div>Functions</div>
		</div>

		<div class="panel-section" style="border-bottom: none; margin-top: auto;">
			<button class="btn btn-secondary" onclick="resetPhysics()">Reset Physics</button>
		</div>
	</div>

	<!-- Center Network Canvas -->
	<div class="main-content">
		<div id="network"></div>
	</div>

	<!-- Right Sidebar: Selected Node Details -->
	<div class="sidebar-right">
		<div class="panel-section" style="border-bottom: 1px solid #334155; background-color: #1e293b;">
			<div class="panel-title" style="margin-bottom: 0;">Details</div>
		</div>
		<div class="details-body" id="details-panel">
			<div style="color: #94a3b8; font-size: 13px; text-align: center; margin-top: 40px;">
				Click a node in the graph to view details and call pathways.
			</div>
		</div>
	</div>

	<!-- Embedded Node/Edge Data -->
	<script type="text/javascript">
		// Globals to prevent ReferenceErrors
		let enabledTypes = {
			command: true,
			file: true,
			class: true,
			method: false,
			function: false
		};
		let isolatedNodeId = null;
		let nodesDataSet;
		let edgesDataSet;
		let nodesView;
		let network;

		const rawNodes = ${JSON.stringify(visNodes)};
		const rawEdges = ${JSON.stringify(visEdges)};
		const originalNodesData = ${JSON.stringify(nodes)};

		nodesDataSet = new vis.DataSet(rawNodes);
		edgesDataSet = new vis.DataSet(rawEdges);

		nodesView = new vis.DataView(nodesDataSet, {
			filter: function (node) {
				if (isolatedNodeId) {
					if (node.id === isolatedNodeId) return true;
					// Show direct neighbors
					const isConnected = rawEdges.some(e => 
						(e.from === isolatedNodeId && e.to === node.id) || 
						(e.to === isolatedNodeId && e.from === node.id)
					);
					return isConnected;
				}
				return enabledTypes[node.group];
			}
		});

		const container = document.getElementById('network');
		const data = {
			nodes: nodesView,
			edges: edgesDataSet
		};

		const options = {
			nodes: {
				borderWidth: 2,
				shadow: true
			},
			edges: {
				smooth: {
					type: 'continuous',
					forceDirection: 'none',
					roundness: 0.5
				}
			},
			layout: {
				improvedLayout: false
			},
			physics: {
				forceAtlas2Based: {
					gravitationalConstant: -35,
					centralGravity: 0.01,
					springLength: 120,
					springConstant: 0.08
				},
				solver: 'forceAtlas2Based',
				stabilization: {
					iterations: 100
				}
			},
			interaction: {
				hover: true,
				zoomView: true
			}
		};

		network = new vis.Network(container, data, options);

		network.on("selectNode", function (params) {
			if (params.nodes.length > 0) {
				showNodeDetails(params.nodes[0]);
			}
		});

		network.on("deselectNode", function () {
			clearNodeDetails();
		});

		function toggleFilter(type, checked) {
			enabledTypes[type] = checked;
			if (nodesView) {
				nodesView.refresh();
			}
		}

		function onSearchChange(val) {
			if (!val || !network) return;
			const query = val.toLowerCase();
			const match = rawNodes.find(n => n.label.toLowerCase().includes(query));
			if (match) {
				network.selectNodes([match.id]);
				network.focus(match.id, { scale: 1.2, animation: true });
				showNodeDetails(match.id);
			}
		}

		function showNodeDetails(nodeId) {
			const node = originalNodesData.find(n => n.id === nodeId);
			if (!node) return;

			const panel = document.getElementById("details-panel");
			
			// Find callers and callees
			const callers = rawEdges.filter(e => e.to === nodeId).map(e => {
				const callerNode = rawNodes.find(n => n.id === e.from);
				const callerOriginal = originalNodesData.find(n => n.id === e.from);
				return { id: e.from, label: callerNode ? callerNode.label : e.from, type: callerOriginal ? callerOriginal.type : 'file', file: callerOriginal ? callerOriginal.filePath : '' };
			});

			const callees = rawEdges.filter(e => e.from === nodeId).map(e => {
				const calleeNode = rawNodes.find(n => n.id === e.to);
				const calleeOriginal = originalNodesData.find(n => n.id === e.to);
				return { id: e.to, label: calleeNode ? calleeNode.label : e.to, type: calleeOriginal ? calleeOriginal.type : 'file', file: calleeOriginal ? calleeOriginal.filePath : '' };
			});

			let html = \`<div class="badge badge-\${node.type}">\${node.type}</div>\`;
			html += \`<div class="node-title">\${node.name}</div>\`;
			
			html += \`<div class="node-meta">\`;
			html += \`<strong>File:</strong> \${node.filePath}<br/>\`;
			if (node.startLine) {
				html += \`<strong>Lines:</strong> \${node.startLine} - \${node.endLine}<br/>\`;
			}
			if (node.description) {
				html += \`<br/><em>\${node.description}</em><br/>\`;
			}
			html += \`</div>\`;

			html += \`<div style="display: flex; gap: 8px; margin-bottom: 20px;">\`;
			if (isolatedNodeId === nodeId) {
				html += \`<button class="btn btn-secondary" style="margin-top:0;" onclick="unisolateNode()">Reset Trace</button>\`;
			} else {
				html += \`<button class="btn" onclick="isolateNode('\${nodeId}')">Trace Pathways</button>\`;
			}
			html += \`</div>\`;

			// Callers
			html += \`<div class="panel-title">Incoming Dependencies / Callers (\${callers.length})</div>\`;
			if (callers.length > 0) {
				html += \`<ul class="neighbor-list" style="margin-bottom: 20px;">\`;
				callers.forEach(c => {
					const labelPrefix = c.type === 'command' ? '/' : '';
					html += \`<li class="neighbor-item" onclick="jumpToNode('\${c.id}')">
						<span class="neighbor-name">\${labelPrefix}\${c.label}</span>
						<span class="neighbor-file">\${c.file}</span>
					</li>\`;
				});
				html += \`</ul>\`;
			} else {
				html += \`<p style="font-size:12px; color:#94a3b8; margin-bottom:20px;">No incoming calls or imports.</p>\`;
			}

			// Callees
			html += \`<div class="panel-title">Outgoing Dependencies / Callees (\${callees.length})</div>\`;
			if (callees.length > 0) {
				html += \`<ul class="neighbor-list">\`;
				callees.forEach(c => {
					const labelPrefix = c.type === 'command' ? '/' : '';
					html += \`<li class="neighbor-item" onclick="jumpToNode('\${c.id}')">
						<span class="neighbor-name">\${labelPrefix}\${c.label}</span>
						<span class="neighbor-file">\${c.file}</span>
					</li>\`;
				});
				html += \`</ul>\`;
			} else {
				html += \`<p style="font-size:12px; color:#94a3b8;">No outgoing calls or imports.</p>\`;
			}

			panel.innerHTML = html;
		}

		function clearNodeDetails() {
			const panel = document.getElementById("details-panel");
			panel.innerHTML = \`<div style="color: #94a3b8; font-size: 13px; text-align: center; margin-top: 40px;">
				Click a node in the graph to view details and call pathways.
			</div>\`;
		}

		function jumpToNode(nodeId) {
			const node = rawNodes.find(n => n.id === nodeId);
			if (node) {
				if (!enabledTypes[node.group] && !isolatedNodeId) {
					document.getElementById("filter-" + node.group).checked = true;
					toggleFilter(node.group, true);
				}
				network.selectNodes([nodeId]);
				network.focus(nodeId, { scale: 1.2, animation: true });
				showNodeDetails(nodeId);
			}
		}

		function isolateNode(nodeId) {
			isolatedNodeId = nodeId;
			nodesView.refresh();
			network.focus(nodeId, { scale: 1.0, animation: true });
			showNodeDetails(nodeId);
		}

		function unisolateNode() {
			const currentId = isolatedNodeId;
			isolatedNodeId = null;
			nodesView.refresh();
			if (currentId) {
				network.selectNodes([currentId]);
				showNodeDetails(currentId);
			}
		}

		function resetPhysics() {
			network.stabilize();
		}
	</script>
</body>
</html>`;
}

function generateMarkdownIndex(
	nodes: GraphNode[],
	edges: GraphEdge[],
	hotspots: Array<{ name: string; type: string; filePath: string; count: number }>,
	deadCode: Array<{ name: string; type: string; filePath: string; startLine?: number }>
): string {
	const commands = nodes.filter(n => n.type === "command");
	const classes = nodes.filter(n => n.type === "class");
	const functions = nodes.filter(n => n.type === "function");
	const methods = nodes.filter(n => n.type === "method");
	const models = classes.filter(c => c.filePath.startsWith("src/core/models/"));
	const dbSchemas = classes.filter(c => c.filePath.startsWith("src/core/database/"));
	const uiBuilders = classes.filter(c => c.filePath.startsWith("src/bot/ui/"));
	const sharedUtils = functions.filter(f => f.filePath.startsWith("src/shared/"));

	let md = `# Codebase Architecture Index & Knowledge Graph\r\n\r\n`;
	md += `This is a generated index mapping the structural layout, relationships, and dependencies of the \`cross-roads-reborn\` codebase. AI agents and developers should read this index first to quickly locate classes, methods, and functions without scanning individual files recursively.\r\n\r\n`;

	md += `## 📊 Statistics\r\n\r\n`;
	md += `* **Total Indexed Files**: ${nodes.filter(n => n.type === "file").length}\r\n`;
	md += `* **Total Slash Commands**: ${commands.length}\r\n`;
	md += `* **Total Classes**: ${classes.length}\r\n`;
	md += `* **Total Functions**: ${functions.length}\r\n`;
	md += `* **Total Methods**: ${methods.length}\r\n`;
	md += `* **Dependencies (Imports/Calls)**: ${edges.length}\r\n\r\n`;

	md += `## 🤖 Bot Commands ("Frontend")\r\n\r\n`;
	md += `Slash commands are located in \`src/bot/commands/\`. They define user interactions and delegate execution to the backend models.\r\n\r\n`;
	md += `| Command | Description | Source File |\r\n`;
	md += `| :--- | :--- | :--- |\r\n`;
	for (const cmd of commands) {
		md += `| \`/${cmd.name}\` | ${cmd.description || "*No description*"} | [${path.basename(cmd.filePath)}](file:///${process.cwd().replace(/\\/g, "/")}/${cmd.filePath}) |\r\n`;
	}
	md += `\r\n`;

	md += `## 🧠 Core Models ("Backend")\r\n\r\n`;
	md += `Models encapsulate the RPG game rules, status management, and business logic.\r\n\r\n`;
	md += `| Model Class | Methods | Source File |\r\n`;
	md += `| :--- | :--- | :--- |\r\n`;
	for (const model of models) {
		const mMethods = nodes.filter(n => n.type === "method" && n.className === model.name && n.filePath === model.filePath);
		const methodList = mMethods.map(m => `\`${m.name}()\``).join(", ") || "*None*";
		md += `| **${model.name}** | ${methodList} | [${path.basename(model.filePath)}](file:///${process.cwd().replace(/\\/g, "/")}/${model.filePath}) |\r\n`;
	}
	md += `\r\n`;

	md += `## 🗃️ Database Tables & Schemas\r\n\r\n`;
	md += `Sequelize database models representing the SQLite database schema are located in \`src/core/database/\`.\r\n\r\n`;
	md += `| Schema Class | Table Name Guess | Source File |\r\n`;
	md += `| :--- | :--- | :--- |\r\n`;
	for (const schema of dbSchemas) {
		md += `| **${schema.name}** | \`${schema.name.toLowerCase()}\` | [${path.basename(schema.filePath)}](file:///${process.cwd().replace(/\\/g, "/")}/${schema.filePath}) |\r\n`;
	}
	md += `\r\n`;

	md += `## 🎨 UI Canvas Builders & Registries\r\n\r\n`;
	md += `Classes and registries used to build, render, and present visual layouts for discord responses are located in \`src/bot/ui/\`.\r\n\r\n`;
	md += `| Class | Source File |\r\n`;
	md += `| :--- | :--- |\r\n`;
	for (const ui of uiBuilders) {
		md += `| **${ui.name}** | [${path.basename(ui.filePath)}](file:///${process.cwd().replace(/\\/g, "/")}/${ui.filePath}) |\r\n`;
	}
	md += `\r\n`;

	md += `## 🛠️ Shared Utilities\r\n\r\n`;
	md += `Shared logic, utilities, and logging mechanisms are located in \`src/shared/\`.\r\n\r\n`;
	md += `| Utility Name | Source File |\r\n`;
	md += `| :--- | :--- |\r\n`;
	for (const f of sharedUtils) {
		md += `| \`${f.name}()\` | [${path.basename(f.filePath)}](file:///${process.cwd().replace(/\\/g, "/")}/${f.filePath}) |\r\n`;
	}
	md += `\r\n`;

	md += `## 🔥 Hotspots (Most Called Methods/Functions)\r\n\r\n`;
	md += `These are the most frequently called functions/methods in the codebase, indicating critical nodes.\r\n\r\n`;
	md += `| Rank | Method/Function Name | Source Location | Incoming Calls |\r\n`;
	md += `| :--- | :--- | :--- | :--- |\r\n`;
	let rank = 1;
	for (const hs of hotspots) {
		md += `| #${rank++} | \`${hs.name}\` | [${path.basename(hs.filePath)}](file:///${process.cwd().replace(/\\/g, "/")}/${hs.filePath}) | ${hs.count} |\r\n`;
	}
	md += `\r\n`;

	md += `## 🔍 Dead Code Candidates\r\n\r\n`;
	md += `These local methods/functions have **zero** incoming calls within the project files. (Note: some may be exported/public interfaces or triggered dynamically, so exercise judgment before removing them).\r\n\r\n`;
	md += `| Name | Type | Source File |\r\n`;
	md += `| :--- | :--- | :--- |\r\n`;
	for (const dc of deadCode.slice(0, 25)) { // Limit to 25 items for readability
		const lineStr = dc.startLine ? `#L${dc.startLine}` : "";
		md += `| \`${dc.name}\` | ${dc.type} | [${path.basename(dc.filePath)}${lineStr}](file:///${process.cwd().replace(/\\/g, "/")}/${dc.filePath}${lineStr}) |\r\n`;
	}
	if (deadCode.length > 25) {
		md += `| ... and ${deadCode.length - 25} more items | | |\r\n`;
	}
	md += `\r\n`;

	return md;
}

main();
