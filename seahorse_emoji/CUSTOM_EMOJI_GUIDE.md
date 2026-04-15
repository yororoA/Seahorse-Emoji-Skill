# Custom Single-Cell Seahorse Emoji Guide

Goal: make seahorse look like one emoji cell in CLI/editor/API outputs.

Core idea:

- Output one marker character (default `U+E000`, Private Use Area).
- Client side maps that codepoint to a custom glyph (font or shortcode renderer).
- Fallback to `:seahorse:` or pixel-art when glyph mapping is unavailable.

## 1. API Contract (recommended)

Return both the marker and fallback metadata.

```json
{
  "emoji": "\uE000",
  "mode": "single-cell",
  "renderHints": {
    "requiresCustomRendering": true,
    "codepoint": "U+E000",
    "shortcode": ":seahorse:",
    "fallbackText": "Fallback to :seahorse: or pixel-art when glyph is missing"
  }
}
```

Rules:

- `emoji` is always one grapheme.
- Keep `shortcode` stable (`:seahorse:`) for cross-platform fallback.

## 2. Build a Seahorse Font (minimum flow)

You need one custom font containing glyph `U+E000`.

Steps:

1. Prepare a monochrome or color seahorse vector (`seahorse.svg`).
2. Open IcoMoon (or FontForge).
3. Import SVG, assign codepoint `E000`.
4. Export font files.

- Web: `SeahorseEmoji.woff2`
- Desktop/terminal: `SeahorseEmoji.ttf`

With current script, `single-cell` mode can auto-generate:

- `generated/seahorse-E000.svg`
- `generated/SeahorseEmoji-E000.ttf`
- `generated/SeahorseEmoji-E000.woff2`

Notes:

- PUA codepoints (`E000`-`F8FF`) are not standard Unicode emoji.
- If another font also uses `U+E000`, keep your custom font first in font-family.

## 3. Web / App Renderer

Use your custom font first, then normal emoji fonts.

```css
@font-face {
  font-family: "SeahorseEmoji";
  src: url("/fonts/SeahorseEmoji.woff2") format("woff2");
  font-display: swap;
}

.emoji-cell {
  font-family: "SeahorseEmoji", "Apple Color Emoji", "Segoe UI Emoji", sans-serif;
  font-size: 1em;
  line-height: 1;
}
```

```ts
export function renderSeahorseCell(text: string): string {
  // Optional shortcode fallback replacement.
  return text.replace(/:seahorse:/g, "\uE000");
}
```

### 3.1 Web 自动加载（推荐）

如果你能拿到 `renderHints.assets.woff2Path` 对应的可访问 URL（例如 `/assets/SeahorseEmoji-E000.woff2`），可在前端启动时自动注册字体：

```ts
type SingleCellHints = {
  codepoint: string;
  shortcode: string;
  assets?: {
    woff2Path?: string;
    fontFamily?: string;
  };
};

const loadedFonts = new Set<string>();

export async function ensureSeahorseFont(hints: SingleCellHints, toPublicUrl: (assetPath: string) => string) {
  const family = hints.assets?.fontFamily || "SeahorseEmoji";
  const woff2Path = hints.assets?.woff2Path;
  if (!woff2Path) {
    return false;
  }

  if (loadedFonts.has(family)) {
    return true;
  }

  const face = new FontFace(family, `url(${toPublicUrl(woff2Path)}) format("woff2")`, {
    style: "normal",
    weight: "400"
  });

  await face.load();
  document.fonts.add(face);
  loadedFonts.add(family);
  return true;
}

export function applySingleCellMapping(text: string, hints: SingleCellHints): string {
  // 如果后端有时候返回 shortcode，可在这里统一替换。
  return text.replaceAll(hints.shortcode, "\uE000");
}
```

渲染时给目标元素设置：

```css
.seahorse-emoji {
  font-family: "SeahorseEmoji", "Apple Color Emoji", "Segoe UI Emoji", sans-serif;
}
```

### 3.2 Electron 自动加载

Electron 通常建议通过 `preload` 暴露一个“安全 URL”给渲染层，再复用 Web 的 `FontFace` 逻辑。

`preload.ts` 示例：

```ts
import { contextBridge } from "electron";
import { pathToFileURL } from "url";

contextBridge.exposeInMainWorld("seahorseAssets", {
  toFileUrl(assetPath: string) {
    return pathToFileURL(assetPath).toString();
  }
});
```

渲染层：

```ts
const ok = await ensureSeahorseFont(renderHints, (assetPath) => window.seahorseAssets.toFileUrl(assetPath));
if (!ok) {
  // fallback: shortcode or pixel mode
}
```

## 4. VS Code / Cursor 客户端

### 4.1 Extension Webview（可自动加载）

如果你自己做 VS Code/Cursor 扩展并使用 Webview，可以自动加载字体。

关键点：本地文件路径不能直接塞给 Webview，需转成 `webview.asWebviewUri(...)`。

扩展侧示例：

```ts
import * as vscode from "vscode";

function toWebviewFontUri(webview: vscode.Webview, extensionUri: vscode.Uri, relPath: string) {
  const fontUri = vscode.Uri.joinPath(extensionUri, relPath);
  return webview.asWebviewUri(fontUri);
}
```

在 HTML 中注入：

```html
<style>
@font-face {
  font-family: "SeahorseEmoji";
  src: url("__WOFF2_URI__") format("woff2");
  font-display: swap;
}
.seahorse-emoji {
  font-family: "SeahorseEmoji", "Segoe UI Emoji", sans-serif;
}
</style>
```

### 4.2 VS Code/Cursor 的原生聊天面板（通常不可控）

原生聊天面板字体往往不可由扩展直接注入，因此无法保证自动映射私有码位字形。

可行策略：

- 在你可控的 Webview/页面里显示单字符 emoji。
- 在不可控面板里回退 `:seahorse:` 或 `pixel`。

## 5. VS Code Editor Display

Install `SeahorseEmoji.ttf` in OS first, then set VS Code font fallback.

`settings.json`:

```json
{
  "editor.fontFamily": "SeahorseEmoji, Cascadia Code, Consolas, monospace",
  "terminal.integrated.fontFamily": "SeahorseEmoji, Cascadia Mono, Consolas, monospace"
}
```

If chat panel is rendered by a fixed UI font, you may only see fallback text there.

Important:

- Skill can output marker Unicode (e.g. `\uE000`) automatically.
- But glyph mapping is a rendering concern. You still need client-side font loading or shortcode replacement.

## 6. CLI / Terminal Display

Terminal support differs by renderer.

Minimum path on Windows Terminal:

1. Install `SeahorseEmoji.ttf` in Windows.
2. Set profile `font.face` to include your font first.
3. Print marker `\uE000`.

PowerShell quick check:

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Write-Output "\uE000"
```

If terminal does not honor fallback fonts, use fallback strategy:

- show `:seahorse:`
- or call your existing `pixel` mode.

## 7. Runtime Fallback Strategy (important)

Recommended priority:

1. Try single-cell marker (`U+E000`).
2. If glyph missing (tofu box / unknown char), render `:seahorse:`.
3. If rich output allowed, render pixel-art block emoji.

## 8. With Your Current Script

Already supported:

```bash
npm run start -- --mode single-cell
```

Optional custom marker:

```bash
npm run start -- --mode single-cell --singleCellChar "\uE000" --shortcode ":seahorse:"
```

Pixel fallback:

```bash
npm run start -- --mode pixel --width 24
```

## 9. What is not possible

- You cannot create a new global Unicode emoji by code alone.
- "One-cell custom emoji" always requires platform rendering control (font or shortcode system).
