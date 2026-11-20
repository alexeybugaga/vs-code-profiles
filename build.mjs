// Сборка профилей VS Code (.code-profile) из исходников в src/.
// Запуск: node build.mjs  → результат в dist/.
// Зависимостей нет, нужен только Node.js 18+.
//
// Профиль = shared (для всех стеков) + layers/<слой> (из profile.json → layers) + <стек>.
//   Настройки:  shared/base.settings.jsonc + shared/file-nesting.jsonc + layers/*/settings.jsonc + <стек>/settings.jsonc
//   Расширения: shared/extensions.json + layers/*/extensions.json + <стек>/profile.json → extensions

import { mkdirSync, readFileSync, readdirSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const SRC = "src";
const DIST = "dist";

/** Минимальный парсер JSONC: убирает комментарии и висячие запятые, не трогая строки. */
function parseJsonc(text) {
	let out = "";
	let i = 0;
	while (i < text.length) {
		const ch = text[i];
		const next = text[i + 1];
		if (ch === '"') {
			let j = i + 1;
			while (j < text.length && text[j] !== '"') j += text[j] === "\\" ? 2 : 1;
			out += text.slice(i, j + 1);
			i = j + 1;
		} else if (ch === "/" && next === "/") {
			while (i < text.length && text[i] !== "\n") i++;
		} else if (ch === "/" && next === "*") {
			i = text.indexOf("*/", i + 2) + 2;
		} else {
			out += ch;
			i++;
		}
	}
	// висячие запятые перед } или ] (строки уже не содержат комментариев, но могут содержать ",}" —
	// поэтому снова идём посимвольно)
	let clean = "";
	for (let k = 0; k < out.length; k++) {
		const c = out[k];
		if (c === '"') {
			let j = k + 1;
			while (j < out.length && out[j] !== '"') j += out[j] === "\\" ? 2 : 1;
			clean += out.slice(k, j + 1);
			k = j;
		} else if (c === ",") {
			const rest = out.slice(k + 1).match(/^\s*([}\]])/);
			if (!rest) clean += c;
		} else {
			clean += c;
		}
	}
	return JSON.parse(clean);
}

const readJsonc = (path) => parseJsonc(readFileSync(path, "utf8"));

const isPlainObject = (v) => v !== null && typeof v === "object" && !Array.isArray(v);

/** Глубокое слияние объектов; массивы и примитивы заменяются. */
function merge(target, source) {
	const result = { ...target };
	for (const [key, value] of Object.entries(source)) {
		result[key] = isPlainObject(value) && isPlainObject(result[key]) ? merge(result[key], value) : value;
	}
	return result;
}

const base = readJsonc(join(SRC, "shared", "base.settings.jsonc"));
const nesting = readJsonc(join(SRC, "shared", "file-nesting.jsonc"));
const sharedExtensions = readJsonc(join(SRC, "shared", "extensions.json"));

mkdirSync(DIST, { recursive: true });

const stacks = readdirSync(SRC, { withFileTypes: true })
	.filter((d) => d.isDirectory() && existsSync(join(SRC, d.name, "profile.json")))
	.map((d) => d.name);

for (const stack of stacks) {
	const meta = readJsonc(join(SRC, stack, "profile.json"));
	const stackSettingsPath = join(SRC, stack, "settings.jsonc");
	const stackSettings = existsSync(stackSettingsPath) ? readJsonc(stackSettingsPath) : {};

	const layers = (meta.layers ?? []).map((layer) => {
		const dir = join(SRC, "layers", layer);
		const settingsPath = join(dir, "settings.jsonc");
		const extensionsPath = join(dir, "extensions.json");
		return {
			settings: existsSync(settingsPath) ? readJsonc(settingsPath) : {},
			extensions: existsSync(extensionsPath) ? readJsonc(extensionsPath) : [],
		};
	});

	const settings = [nesting, ...layers.map((l) => l.settings), stackSettings].reduce(merge, base);

	const seen = new Set();
	const extensions = [...sharedExtensions, ...layers.flatMap((l) => l.extensions), ...(meta.extensions ?? [])]
		.filter(({ id }) => !seen.has(id.toLowerCase()) && seen.add(id.toLowerCase()))
		.map(({ id, displayName }) => ({ identifier: { id }, displayName }));

	// Формат .code-profile: значения settings и extensions — JSON-строки
	// (см. IUserDataProfileTemplate в исходниках VS Code).
	const profile = {
		name: meta.name,
		...(meta.icon ? { icon: meta.icon } : {}),
		settings: JSON.stringify({ settings: JSON.stringify(settings, null, "\t") }),
		extensions: JSON.stringify(extensions),
	};

	const file = join(DIST, `${meta.name}.code-profile`);
	writeFileSync(file, JSON.stringify(profile));
	console.log(`✓ ${file}  (${Object.keys(settings).length} настроек, ${extensions.length} расширений)`);
}
