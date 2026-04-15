---
name: seahorse_emoji
description: "Use this skill when user asks for 海马 emoji / seahorse emoji / pixel emoji / 色块海马. Generate output from script, never fabricate manually."
---

# Seahorse Emoji Skill (Workspace Router)

## When to use

Trigger this skill when user asks for:

- 海马 emoji
- seahorse emoji
- 像素海马 / 色块海马
- 将海马图片转成 emoji

## Required behavior

- Always run the generator script and use real output.
- Never handcraft emoji blocks.
- On failure, return error reason and retry hint.

## Execute

From workspace root, run:

```bash
npm --prefix seahorse_emoji run start -- --mode pixel --width 32 --transparentAsSpace true --output emoji
```

If user asks single-cell:

```bash
npm --prefix seahorse_emoji run start -- --mode single-cell --output json
```

## Output rules

For `pixel` mode:

- Return the generated `emoji` payload unchanged.
- Keep it in one fenced code block.

For `single-cell` mode:

- Return `emoji` and `renderHints`.
- Mention fallback `:seahorse:` when custom font is unavailable.
