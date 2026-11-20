import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import { compileScript, parse } from "@vue/compiler-sfc";
import ts from "typescript";
import { createSSRApp } from "vue";
import { renderToString } from "vue/server-renderer";

function loadComponent(path) {
	const source = readFileSync(new URL(path, import.meta.url), "utf8");
	const { descriptor } = parse(source);
	const script = compileScript(descriptor, { id: "base-input-test", inlineTemplate: true });
	const code = ts.transpileModule(script.content, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
	const component = { exports: {} };
	const require = createRequire(import.meta.url);
	new Function("require", "module", "exports", code)(
		(id) => id === "~/components/ui/ValidationChecklist.vue"
			? loadComponent("../components/ui/ValidationChecklist.vue")
			: require(id),
		component,
		component.exports,
	);
	return component.exports;
}

const BaseInput = loadComponent("../components/ui/BaseInput.vue").default;
const BaseButton = loadComponent("../components/ui/BaseButton.vue").default;
const validationSource = readFileSync(new URL("../utils/inputValidation.ts", import.meta.url), "utf8");
const validationCode = ts.transpileModule(validationSource, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const validation = { exports: {} };
new Function("exports", validationCode)(validation.exports);
const { gangNamePattern, nicknameRules } = validation.exports;

test("forwards native attributes to the input alongside declared props", async () => {
	const html = await renderToString(createSSRApp(BaseInput, {
		id: "nickname",
		modelValue: "Alice",
		required: true,
		minlength: 3,
		name: "nickname",
		pattern: "[A-Za-z]+",
		"aria-describedby": "nickname-help",
		autocomplete: "off",
		spellcheck: "false",
	}));
	const input = html.match(/<input\b[^>]*>/)?.[0];
	assert.ok(input);
	for (const attribute of [
		'id="nickname"',
		'value="Alice"',
		"required",
		'minlength="3"',
		'name="nickname"',
		'pattern="[A-Za-z]+"',
		'aria-describedby="nickname-help"',
		'autocomplete="off"',
		'spellcheck="false"',
	]) assert.ok(input.includes(attribute), `Missing ${attribute}`);
});

test("links the rules and updates their status for different values", async () => {
	const rules = {
		length: { label: "Pelo menos 3 caracteres", validate: (value) => value.length >= 3 },
		letters: { label: "Apenas letras", validate: (value) => /^[A-Za-z]+$/.test(value) },
	};
	const render = (value) => renderToString(createSSRApp(BaseInput, {
		id: "nickname",
		modelValue: value,
		rules,
		"aria-describedby": "help",
	}));
	const empty = await render("");
	assert.match(empty, /aria-describedby="help nickname-rules"/);
	assert.doesNotMatch(empty, /validation-checklist__rule--(valid|invalid)/);

	const partial = await render("Ab1");
	assert.match(partial, /validation-checklist__rule--valid/);
	assert.match(partial, /validation-checklist__rule--invalid/);
	assert.match(partial, /Não atendido:/);

	const valid = await render("Alice");
	assert.doesNotMatch(valid, /validation-checklist__rule--invalid/);
});

test("nickname rules match the accepted nickname format", () => {
	const valid = (value) => Object.values(nicknameRules).every((rule) => rule.validate(value));
	for (const value of ["Ana", "Ana Maria", "abcdefghijklmnopqr"]) assert.ok(valid(value), value);
	for (const value of ["", "Ab", "abcdefghijklmnopqrs", " Ana", "Ana ", "Ana  Maria", "Ana1", "Ana-Maria"]) {
		assert.ok(!valid(value), value);
	}
});

test("gang name pattern matches the Discord command's accepted characters", () => {
	const pattern = new RegExp(`^(?:${gangNamePattern})$`);
	for (const value of ["Cross Roads", "Gang 7", "Gang\t7"]) assert.ok(pattern.test(value), value);
	for (const value of ["Cross-Roads", "Gang!", "Gangüe"]) assert.ok(!pattern.test(value), value);
});

test("the nickname modal's submit button can target its form", async () => {
	const app = createSSRApp(BaseButton, { type: "submit", form: "self-nickname-form" });
	app.component("NuxtLink", { render: () => null });
	const html = await renderToString(app);
	assert.match(html, /<button\b[^>]*type="submit"/);
	assert.match(html, /<button\b[^>]*form="self-nickname-form"/);
});
