declare const require: any;
declare const __dirname: string;
declare const module: any;
declare const process: any;
declare const Buffer: any;

const fs = require("fs");
const path = require("path");

type SkillInput = {
	image?: string;
	width?: number;
	transparentAsSpace?: boolean;
	mode?: "pixel" | "single-cell";
	singleCellChar?: string;
	shortcode?: string;
	singleCellAssetsDir?: string;
	fontFamily?: string;
};

type SkillOutput = {
	imagePath: string;
	width: number;
	emoji: string;
	mode: "pixel" | "single-cell";
	renderHints?: {
		requiresCustomRendering: boolean;
		codepoint: string;
		shortcode: string;
		fallbackText: string;
		assets?: {
			svgPath: string;
			fontPath: string;
				woff2Path: string;
			fontFamily: string;
		};
	};
};

type CliOutputMode = "full" | "emoji" | "json";

type CliOptions = {
	input: SkillInput;
	output: CliOutputMode;
};

const IMAGE_EXTS = new Set([".png", ".jpg", ".jpeg", ".webp", ".bmp"]);
const IMAGE_DIR_NAME = "img";

const EMOJI_PALETTE = [
	{ emoji: "⬛", rgb: [20, 20, 20] as const },
	{ emoji: "🟫", rgb: [132, 94, 49] as const },
	{ emoji: "🟧", rgb: [243, 156, 18] as const },
	{ emoji: "🟨", rgb: [252, 220, 77] as const },
	{ emoji: "🟩", rgb: [76, 175, 80] as const },
	{ emoji: "🟦", rgb: [66, 165, 245] as const },
	{ emoji: "🟪", rgb: [171, 71, 188] as const },
	{ emoji: "⬜", rgb: [240, 240, 240] as const }
];

type RasterCell = {
	r: number;
	g: number;
	b: number;
	a: number;
};

type RasterGrid = {
	width: number;
	height: number;
	cells: RasterCell[];
};

type RasterLoadOptions = {
	trimToColorBounds?: boolean;
};

function colorDistance(r: number, g: number, b: number, c: readonly [number, number, number]): number {
	const dr = r - c[0];
	const dg = g - c[1];
	const db = b - c[2];
	return dr * dr + dg * dg + db * db;
}

function nearestEmoji(r: number, g: number, b: number): string {
	let bestEmoji = "⬛";
	let bestDistance = Number.POSITIVE_INFINITY;

	for (const entry of EMOJI_PALETTE) {
		const d = colorDistance(r, g, b, entry.rgb);
		if (d < bestDistance) {
			bestDistance = d;
			bestEmoji = entry.emoji;
		}
	}

	return bestEmoji;
}

function pickRandomItem<T>(items: T[]): T {
	const index = Math.floor(Math.random() * items.length);
	return items[index];
}

function pickImageFile(baseDir: string, preferred?: string): string {
	const imageDir = path.join(baseDir, IMAGE_DIR_NAME);

	if (preferred) {
		const directCandidate = path.isAbsolute(preferred) ? preferred : path.join(baseDir, preferred);
		const imageDirCandidate = path.isAbsolute(preferred) ? preferred : path.join(imageDir, preferred);
		if (fs.existsSync(directCandidate)) {
			return directCandidate;
		}
		if (fs.existsSync(imageDirCandidate)) {
			return imageDirCandidate;
		}
		throw new Error(`指定图片不存在: ${preferred}`);
	}

	if (!fs.existsSync(imageDir) || !fs.statSync(imageDir).isDirectory()) {
		throw new Error(`未找到图片目录: ${imageDir}`);
	}

	const files = fs.readdirSync(imageDir) as string[];
	const candidates = files.filter((name: string) => IMAGE_EXTS.has(path.extname(name).toLowerCase()));

	if (candidates.length === 0) {
		throw new Error(`img 目录下未找到图片文件，请放入图片（png/jpg/jpeg/webp/bmp）。`);
	}

	return path.join(imageDir, pickRandomItem(candidates));
}

function resolveSearchDirs(): string[] {
	const dirs = [__dirname, process.cwd()];
	const unique: string[] = [];
	for (const dir of dirs) {
		if (!unique.includes(dir)) {
			unique.push(dir);
		}
	}
	return unique;
}

function pickImageFromDirs(preferred?: string): string {
	if (preferred) {
		const searchDirs = resolveSearchDirs();
		for (const dir of searchDirs) {
			const candidate = path.isAbsolute(preferred) ? preferred : path.join(dir, preferred);
			if (fs.existsSync(candidate)) {
				return candidate;
			}
		}
		throw new Error(`指定图片不存在: ${preferred}`);
	}

	const errors: string[] = [];
	for (const dir of resolveSearchDirs()) {
		try {
			return pickImageFile(dir);
		} catch (err: any) {
			errors.push(`${dir}: ${err?.message ?? "未知错误"}`);
		}
	}

	throw new Error(`未找到可用图片。已搜索目录: ${errors.join(" | ")}`);
}

function countGraphemes(value: string): number {
	if (!value) {
		return 0;
	}

	const segmenterCtor = (Intl as any).Segmenter;
	if (typeof segmenterCtor === "function") {
		const segmenter = new segmenterCtor("zh", { granularity: "grapheme" });
		let count = 0;
		for (const _ of segmenter.segment(value)) {
			count++;
		}
		return count;
	}

	return Array.from(value).length;
}

function normalizeSingleCellChar(value?: string): string {
	const candidate = value ?? "\uE000";
	if (countGraphemes(candidate) !== 1) {
		throw new Error("singleCellChar 必须是单个可见字符（1 个字形簇）。");
	}
	return candidate;
}

function toCodepointLabel(value: string): string {
	const cp = value.codePointAt(0);
	if (!cp) {
		return "UNKNOWN";
	}
	return `U+${cp.toString(16).toUpperCase().padStart(4, "0")}`;
}

function trimImageToColorBounds(image: any): void {
	const alphaThreshold = 16;
	const w = image.bitmap.width;
	const h = image.bitmap.height;
	let minX = w;
	let minY = h;
	let maxX = -1;
	let maxY = -1;

	for (let y = 0; y < h; y++) {
		for (let x = 0; x < w; x++) {
			const idx = (w * y + x) * 4;
			const a = image.bitmap.data[idx + 3];
			if (a >= alphaThreshold) {
				if (x < minX) minX = x;
				if (y < minY) minY = y;
				if (x > maxX) maxX = x;
				if (y > maxY) maxY = y;
			}
		}
	}

	if (maxX < minX || maxY < minY) {
		throw new Error("图片中未检测到可见颜色区域（非透明像素）。");
	}

	const cropW = maxX - minX + 1;
	const cropH = maxY - minY + 1;
	image.crop(minX, minY, cropW, cropH);
}

async function loadRasterGrid(imagePath: string, width: number, options: RasterLoadOptions = {}): Promise<RasterGrid> {
	const jimpModule = require("jimp");
	const Jimp = (jimpModule as any).default ?? jimpModule;
	const image = await Jimp.read(imagePath);

	if (!image.bitmap.width || !image.bitmap.height) {
		throw new Error("图片尺寸无效，无法转换。请更换一张正常图片。");
	}

	if (options.trimToColorBounds) {
		trimImageToColorBounds(image);
	}

	const targetHeight = Math.max(8, Math.round((image.bitmap.height / image.bitmap.width) * width * 0.55));
	image.resize(width, targetHeight);

	const cells: RasterCell[] = [];
	for (let y = 0; y < image.bitmap.height; y++) {
		for (let x = 0; x < image.bitmap.width; x++) {
			const idx = (image.bitmap.width * y + x) * 4;
			const data = image.bitmap.data;
			cells.push({
				r: data[idx],
				g: data[idx + 1],
				b: data[idx + 2],
				a: data[idx + 3]
			});
		}
	}

	return {
		width: image.bitmap.width,
		height: image.bitmap.height,
		cells
	};
}

function rasterToEmojiLines(raster: RasterGrid, transparentAsSpace: boolean): string[] {
	const lines: string[] = [];
	for (let y = 0; y < raster.height; y++) {
		let row = "";
		for (let x = 0; x < raster.width; x++) {
			const cell = raster.cells[y * raster.width + x];
			if (transparentAsSpace && cell.a < 80) {
				row += "  ";
			} else {
				row += nearestEmoji(cell.r, cell.g, cell.b);
			}
		}
		lines.push(row);
	}
	return lines;
}

function ensureDir(dirPath: string): string {
	if (!fs.existsSync(dirPath)) {
		fs.mkdirSync(dirPath, { recursive: true });
	}
	return dirPath;
}

function makeSafeCodepointSuffix(singleCellChar: string): string {
	const cp = singleCellChar.codePointAt(0);
	if (!cp) {
		return "UNKNOWN";
	}
	return cp.toString(16).toUpperCase().padStart(4, "0");
}

function rasterToSvg(raster: RasterGrid, outputPath: string): string {
	const pixelSize = 16;
	const viewWidth = raster.width * pixelSize;
	const viewHeight = raster.height * pixelSize;
	const rects: string[] = [];

	for (let y = 0; y < raster.height; y++) {
		for (let x = 0; x < raster.width; x++) {
			const cell = raster.cells[y * raster.width + x];
			if (cell.a < 16) {
				continue;
			}

			const opacity = Number((cell.a / 255).toFixed(4));
			const base = `<rect x="${x * pixelSize}" y="${y * pixelSize}" width="${pixelSize}" height="${pixelSize}" fill="rgb(${cell.r},${cell.g},${cell.b})"`;
			if (opacity >= 1) {
				rects.push(`${base} />`);
			} else {
				rects.push(`${base} fill-opacity="${opacity}" />`);
			}
		}
	}

	const svg = [
		`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${viewWidth} ${viewHeight}" shape-rendering="crispEdges">`,
		...rects,
		"</svg>"
	].join("\n");

	fs.writeFileSync(outputPath, svg, "utf8");
	return outputPath;
}

function buildGlyphPathFromRaster(raster: RasterGrid): any {
	const opentype = require("opentype.js");
	const glyphPath = new opentype.Path();

	const em = 1024;
	const cellSize = Math.max(1, Math.floor(em / Math.max(raster.width, raster.height)));
	const drawWidth = raster.width * cellSize;
	const drawHeight = raster.height * cellSize;
	const offsetX = Math.floor((em - drawWidth) / 2);
	const offsetY = Math.floor((em - drawHeight) / 2);

	for (let y = 0; y < raster.height; y++) {
		for (let x = 0; x < raster.width; x++) {
			const cell = raster.cells[y * raster.width + x];
			if (cell.a < 100) {
				continue;
			}

			const x0 = offsetX + x * cellSize;
			const y0 = offsetY + (raster.height - y - 1) * cellSize;
			const x1 = x0 + cellSize;
			const y1 = y0 + cellSize;

			glyphPath.moveTo(x0, y0);
			glyphPath.lineTo(x1, y0);
			glyphPath.lineTo(x1, y1);
			glyphPath.lineTo(x0, y1);
			glyphPath.close();
		}
	}

	return glyphPath;
}

function rasterToFont(
	raster: RasterGrid,
	singleCellChar: string,
	fontPath: string,
	fontFamily: string
): string {
	const opentype = require("opentype.js");
	const codePoint = singleCellChar.codePointAt(0);
	if (!codePoint) {
		throw new Error("singleCellChar 码位无效，无法生成字体。");
	}

	const notdef = new opentype.Glyph({
		name: ".notdef",
		unicode: 0,
		advanceWidth: 1024,
		path: new opentype.Path()
	});

	const glyph = new opentype.Glyph({
		name: "seahorse",
		unicode: codePoint,
		advanceWidth: 1024,
		path: buildGlyphPathFromRaster(raster)
	});

	const font = new opentype.Font({
		familyName: fontFamily,
		styleName: "Regular",
		unitsPerEm: 1024,
		ascender: 1024,
		descender: 0,
		glyphs: [notdef, glyph]
	});

	const buffer = Buffer.from(font.toArrayBuffer());
	fs.writeFileSync(fontPath, buffer);
	return fontPath;
}

function convertTtfToWoff2(ttfPath: string, woff2Path: string): string {
	const ttf2woff2Module = require("ttf2woff2");
	const ttf2woff2 = (ttf2woff2Module as any).default ?? ttf2woff2Module;
	const ttfBuffer = fs.readFileSync(ttfPath);
	const woff2Buffer = Buffer.from(ttf2woff2(ttfBuffer));
	fs.writeFileSync(woff2Path, woff2Buffer);
	return woff2Path;
}

function generateSingleCellAssets(
	raster: RasterGrid,
	singleCellChar: string,
	assetsDir?: string,
	fontFamily?: string
): { svgPath: string; fontPath: string; woff2Path: string; fontFamily: string } {
	const resolvedAssetsDir = ensureDir(
		assetsDir
			? (path.isAbsolute(assetsDir) ? assetsDir : path.join(process.cwd(), assetsDir))
			: path.join(process.cwd(), "generated")
	);
	const suffix = makeSafeCodepointSuffix(singleCellChar);
	const resolvedFontFamily = fontFamily?.trim() || "SeahorseEmoji";
	const svgPath = path.join(resolvedAssetsDir, `seahorse-${suffix}.svg`);
	const fontPath = path.join(resolvedAssetsDir, `${resolvedFontFamily}-${suffix}.ttf`);
	const woff2Path = path.join(resolvedAssetsDir, `${resolvedFontFamily}-${suffix}.woff2`);

	rasterToSvg(raster, svgPath);
	rasterToFont(raster, singleCellChar, fontPath, resolvedFontFamily);
	convertTtfToWoff2(fontPath, woff2Path);

	return {
		svgPath,
		fontPath,
		woff2Path,
		fontFamily: resolvedFontFamily
	};
}

/**
 * 将图片转换为 emoji 像素画
 * 依赖：npm i jimp
 */
export async function convertImageToEmoji(input: SkillInput = {}): Promise<SkillOutput> {
	const width = Math.max(8, Math.min(80, input.width ?? 32));
	const transparentAsSpace = input.transparentAsSpace ?? true;
	const mode = input.mode ?? "pixel";
	const imagePath = pickImageFromDirs(input.image);
	const shortcode = input.shortcode ?? ":seahorse:";
	const raster = await loadRasterGrid(imagePath, width, {
		trimToColorBounds: mode === "pixel" || mode === "single-cell"
	});

	if (mode === "single-cell") {
		const singleCellChar = normalizeSingleCellChar(input.singleCellChar);
		const assets = generateSingleCellAssets(raster, singleCellChar, input.singleCellAssetsDir, input.fontFamily);
		return {
			imagePath,
			width,
			emoji: singleCellChar,
			mode,
			renderHints: {
				requiresCustomRendering: true,
				codepoint: toCodepointLabel(singleCellChar),
				shortcode,
				fallbackText: "若客户端不支持私有码位字体，请回退到 :seahorse: 或多行像素图。",
				assets
			}
		};
	}

	const lines = rasterToEmojiLines(raster, transparentAsSpace);

	return {
		imagePath,
		width,
		emoji: lines.join("\n"),
		mode
	};
}

/**
 * 常见 Skill 入口（不同平台可按需改名）
 */
export default async function main(input: SkillInput = {}): Promise<SkillOutput> {
	return convertImageToEmoji(input);
}

function parseBoolean(value: string): boolean {
	const normalized = value.trim().toLowerCase();
	if (["1", "true", "yes", "y", "on"].includes(normalized)) {
		return true;
	}
	if (["0", "false", "no", "n", "off"].includes(normalized)) {
		return false;
	}
	throw new Error(`无效布尔参数: ${value}`);
}

function parseCliInput(args: string[]): CliOptions {
	const input: SkillInput = {};
	let output: CliOutputMode = "full";

	for (let i = 0; i < args.length; i++) {
		const arg = args[i];

		if (arg === "--image" || arg === "-i") {
			const value = args[i + 1];
			if (!value) {
				throw new Error("参数 --image 需要提供图片路径");
			}
			input.image = value;
			i++;
			continue;
		}

		if (arg === "--width" || arg === "-w") {
			const value = args[i + 1];
			if (!value) {
				throw new Error("参数 --width 需要提供数字");
			}
			const parsed = Number.parseInt(value, 10);
			if (Number.isNaN(parsed)) {
				throw new Error(`无效宽度参数: ${value}`);
			}
			input.width = parsed;
			i++;
			continue;
		}

		if (arg === "--transparentAsSpace") {
			const value = args[i + 1];
			if (!value) {
				throw new Error("参数 --transparentAsSpace 需要 true/false");
			}
			input.transparentAsSpace = parseBoolean(value);
			i++;
			continue;
		}

		if (arg === "--no-transparentAsSpace") {
			input.transparentAsSpace = false;
			continue;
		}

		if (arg === "--mode") {
			const value = args[i + 1];
			if (!value) {
				throw new Error("参数 --mode 需要 pixel 或 single-cell");
			}
			if (value !== "pixel" && value !== "single-cell") {
				throw new Error(`无效 mode 参数: ${value}`);
			}
			input.mode = value;
			i++;
			continue;
		}

		if (arg === "--singleCellChar") {
			const value = args[i + 1];
			if (!value) {
				throw new Error("参数 --singleCellChar 需要提供字符");
			}
			input.singleCellChar = value;
			i++;
			continue;
		}

		if (arg === "--shortcode") {
			const value = args[i + 1];
			if (!value) {
				throw new Error("参数 --shortcode 需要提供短代码");
			}
			input.shortcode = value;
			i++;
			continue;
		}

		if (arg === "--singleCellAssetsDir") {
			const value = args[i + 1];
			if (!value) {
				throw new Error("参数 --singleCellAssetsDir 需要提供目录");
			}
			input.singleCellAssetsDir = value;
			i++;
			continue;
		}

		if (arg === "--fontFamily") {
			const value = args[i + 1];
			if (!value) {
				throw new Error("参数 --fontFamily 需要提供字体族名称");
			}
			input.fontFamily = value;
			i++;
			continue;
		}

		if (arg === "--output") {
			const value = args[i + 1];
			if (!value) {
				throw new Error("参数 --output 需要 full/emoji/json");
			}
			if (value !== "full" && value !== "emoji" && value !== "json") {
				throw new Error(`无效 output 参数: ${value}`);
			}
			output = value;
			i++;
			continue;
		}

		throw new Error(`未知参数: ${arg}`);
	}

	return { input, output };
}

if (require.main === module) {
	const cliOptions = parseCliInput(process.argv.slice(2));

	main(cliOptions.input).then((output) => {
		if (cliOptions.output === "emoji") {
			// Print only the emoji payload so callers can paste it directly.
			console.log(output.emoji);
			return;
		}

		if (cliOptions.output === "json") {
			console.log(JSON.stringify(output, null, 2));
			return;
		}

		console.log("图片路径:", output.imagePath);
		console.log("宽度:", output.width);
		console.log("模式:", output.mode);
		console.log("生成的表情:\n");
		console.log(output.emoji);

		if (output.renderHints) {
			console.log("\n渲染提示:");
			console.log(`- codepoint: ${output.renderHints.codepoint}`);
			console.log(`- shortcode: ${output.renderHints.shortcode}`);
			console.log(`- 说明: ${output.renderHints.fallbackText}`);
			if (output.renderHints.assets) {
				console.log(`- svg: ${output.renderHints.assets.svgPath}`);
				console.log(`- font(ttf): ${output.renderHints.assets.fontPath}`);
				console.log(`- font(woff2): ${output.renderHints.assets.woff2Path}`);
				console.log(`- fontFamily: ${output.renderHints.assets.fontFamily}`);
			}
		}
	}).catch((err) => {
		console.error("发生错误:", err.message);
	});
}