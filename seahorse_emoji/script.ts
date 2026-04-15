declare const require: any;
declare const __dirname: string;

const fs = require("fs");
const path = require("path");

type SkillInput = {
	image?: string;
	width?: number;
	transparentAsSpace?: boolean;
};

type SkillOutput = {
	imagePath: string;
	width: number;
	emoji: string;
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

/**
 * 将图片转换为 emoji 像素画
 * 依赖：npm i jimp
 */
export async function convertImageToEmoji(input: SkillInput = {}): Promise<SkillOutput> {
	const width = Math.max(8, Math.min(80, input.width ?? 24));
	const transparentAsSpace = input.transparentAsSpace ?? true;
	const baseDir = __dirname;
	const imagePath = pickImageFile(baseDir, input.image);

	const jimpModule = require("jimp");
	const Jimp = (jimpModule as any).default ?? jimpModule;
	const image = await Jimp.read(imagePath);

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
		emoji: lines.join("\n")
	};
}

/**
 * 常见 Skill 入口（不同平台可按需改名）
 */
export default async function main(input: SkillInput = {}): Promise<SkillOutput> {
	return convertImageToEmoji(input);
}

