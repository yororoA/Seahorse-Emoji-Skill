declare const require: any;
declare const __dirname: string;
declare const module: any;
declare const process: any;

const fs = require("fs");
const path = require("path");

type SkillInput = {
	image?: string;
	width?: number;
	transparentAsSpace?: boolean;
	mode?: "pixel" | "single-cell";
	singleCellChar?: string;
	shortcode?: string;
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
	};
};

const IMAGE_EXTS = new Set([".png", ".jpg", ".jpeg", ".webp", ".bmp"]);

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

function pickImageFile(baseDir: string, preferred?: string): string {
	if (preferred) {
		const p = path.isAbsolute(preferred) ? preferred : path.join(baseDir, preferred);
		if (!fs.existsSync(p)) {
			throw new Error(`指定图片不存在: ${p}`);
		}
		return p;
	}

	const files = fs.readdirSync(baseDir) as string[];
	const candidates = files.filter((name: string) => IMAGE_EXTS.has(path.extname(name).toLowerCase()));

	if (candidates.length === 0) {
		throw new Error("当前目录下未找到图片文件，请放入海马图片（png/jpg/jpeg/webp/bmp）。");
	}

	const seahorseFirst = candidates.sort((a: string, b: string) => {
		const aScore = /海马|seahorse/i.test(a) ? 0 : 1;
		const bScore = /海马|seahorse/i.test(b) ? 0 : 1;
		return aScore - bScore || a.localeCompare(b, "zh-CN");
	});

	return path.join(baseDir, seahorseFirst[0]);
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

/**
 * 将图片转换为 emoji 像素画
 * 依赖：npm i jimp
 */
export async function convertImageToEmoji(input: SkillInput = {}): Promise<SkillOutput> {
	const width = Math.max(8, Math.min(80, input.width ?? 24));
	const transparentAsSpace = input.transparentAsSpace ?? true;
	const mode = input.mode ?? "pixel";
	const imagePath = pickImageFromDirs(input.image);
	const shortcode = input.shortcode ?? ":seahorse:";

	if (mode === "single-cell") {
		const singleCellChar = normalizeSingleCellChar(input.singleCellChar);
		return {
			imagePath,
			width,
			emoji: singleCellChar,
			mode,
			renderHints: {
				requiresCustomRendering: true,
				codepoint: toCodepointLabel(singleCellChar),
				shortcode,
				fallbackText: "若客户端不支持私有码位字体，请回退到 :seahorse: 或多行像素图。"
			}
		};
	}

	const jimpModule = require("jimp");
	const Jimp = (jimpModule as any).default ?? jimpModule;
	const image = await Jimp.read(imagePath);
	if (!image.bitmap.width || !image.bitmap.height) {
		throw new Error("图片尺寸无效，无法转换。请更换一张正常图片。");
	}

	// 终端字符纵向更“高”，这里做一次纵横比修正
	const targetHeight = Math.max(8, Math.round((image.bitmap.height / image.bitmap.width) * width * 0.55));

	image.resize(width, targetHeight);

	const lines: string[] = [];
	for (let y = 0; y < image.bitmap.height; y++) {
		let row = "";
		for (let x = 0; x < image.bitmap.width; x++) {
			const idx = (image.bitmap.width * y + x) * 4;
			const data = image.bitmap.data;
			const r = data[idx];
			const g = data[idx + 1];
			const b = data[idx + 2];
			const a = data[idx + 3];

			if (transparentAsSpace && a < 80) {
				row += "  ";
			} else {
				row += nearestEmoji(r, g, b);
			}
		}
		lines.push(row);
	}

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

function parseCliInput(args: string[]): SkillInput {
	const input: SkillInput = {};

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

		throw new Error(`未知参数: ${arg}`);
	}

	return input;
}

if (require.main === module) {
	const cliInput = parseCliInput(process.argv.slice(2));

	main(cliInput).then((output) => {
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
		}
	}).catch((err) => {
		console.error("发生错误:", err.message);
	});
}