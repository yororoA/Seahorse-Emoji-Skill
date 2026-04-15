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
4. Export font files:
   - Web: `SeahorseEmoji.woff2`
   - Desktop/terminal: `SeahorseEmoji.ttf`

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

## 4. VS Code Editor Display

Install `SeahorseEmoji.ttf` in OS first, then set VS Code font fallback.

`settings.json`:

```json
{
  "editor.fontFamily": "SeahorseEmoji, Cascadia Code, Consolas, monospace",
  "terminal.integrated.fontFamily": "SeahorseEmoji, Cascadia Mono, Consolas, monospace"
}
```

If chat panel is rendered by a fixed UI font, you may only see fallback text there.

## 5. CLI / Terminal Display

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

## 6. Runtime Fallback Strategy (important)

Recommended priority:
1. Try single-cell marker (`U+E000`).
2. If glyph missing (tofu box / unknown char), render `:seahorse:`.
3. If rich output allowed, render pixel-art block emoji.

## 7. With Your Current Script

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

## 8. What is not possible

- You cannot create a new global Unicode emoji by code alone.
- "One-cell custom emoji" always requires platform rendering control (font or shortcode system).
