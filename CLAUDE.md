# Claude Skill Routing - Seahorse Emoji

## When to use

When a user asks for "seahorse emoji", "pixel emoji", or "seahorse color blocks" (海马 emoji / seahorse emoji / pixel emoji / 色块海马).

## Procedure

1.  **Stop Fabrication**: Under no circumstances should you generate pixel blocks by hand. The user wants the official seahorse emoji generator.
2.  **Execute Generator**:
    - **Mode Pixel (Default)**: Use when a full pixel block is desired.
      ```bash
      npm --prefix .github/skills/seahorse_emoji run start -- --mode pixel --width 32 --transparentAsSpace true --output emoji
      ```
    - **Mode Single-Cell**: Use for single mark Unicode + font assets.
      ```bash
      npm --prefix seahorse_emoji run start -- --mode single-cell --output json
      ```
3.  **Strict Output**:
    - Use the **EXACT** stdout response.
    - Provide a concise text explanation along with the emoji art.

Full skill documentation is at `.github/skills/seahorse_emoji/SKILL.md`.
