# Seahorse Emoji Skill

把文件夹中的海马图片转换成 emoji。支持两种模式：

- `pixel`: 多行彩色方块像素图。
- `single-cell`: 单字符输出（默认私有码位 `U+E000`），用于“看起来像 1 个 emoji”的集成方案。

## 触发条件（让 AI 更容易调用）

当用户请求以下意图时应优先调用本 Skill：

- 生成海马 emoji 像素图
- 把图片转成彩色方块 emoji
- 在回复中直接贴出海马色块

关键词示例：`海马 emoji`、`seahorse emoji`、`pixel emoji`、`色块图`、`用方块拼海马`

## 调用规范（默认走 pixel）

- 若用户没有特别说明，使用：`mode=pixel`。
- 建议默认参数：`width=24`，`transparentAsSpace=true`。
- 若用户要求更清晰，可把 `width` 调到 `28~40`。

调用示例（伪代码）：

```ts
const result = await main({
  mode: "pixel",
  width: 24,
  transparentAsSpace: true
});
```

## 回复规范（关键）

当 `mode=pixel` 时，AI 回复必须遵守：

- 将 `result.emoji` 原样放入回复。
- 不要改写、翻译、压缩、转义、折叠该字符串。
- 不要在每行前添加 `-`、编号或引用符号。
- 可在色块前后加一行简短说明，但色块本体必须完整保留。

推荐回复模板：

```text
这是海马像素 emoji：
{result.emoji}
```

如果调用失败，再回复错误原因和可重试参数，不要伪造色块结果。

## 依赖

- `jimp`

## 输入参数

- `image` (可选): 图片文件名或绝对路径。
  - 不传时，会自动在当前目录找第一张图片（优先文件名包含“海马”或 `seahorse`）。
- `width` (可选): 输出宽度，默认 `24`，范围 `8 ~ 80`。
- `transparentAsSpace` (可选): 透明像素是否输出为空格，默认 `true`。
- `mode` (可选): `pixel` 或 `single-cell`，默认 `pixel`。
- `singleCellChar` (可选): `single-cell` 模式输出的单字符，默认 `\uE000`。
- `shortcode` (可选): `single-cell` 模式下的回退短代码，默认 `:seahorse:`。

## 输出

- `imagePath`: 实际使用的图片路径。
- `width`: 实际宽度。
- `emoji`: 转换后的 emoji 多行字符串。
- `mode`: 实际输出模式。
- `renderHints` (仅 `single-cell`): 渲染提示（是否需要自定义渲染、码位、短代码、回退说明）。

## 行为说明

1. 自动读取海马图片。
2. 当 `mode=pixel` 时：按比例缩放并映射为彩色方块 emoji（`⬛🟫🟧🟨🟩🟦🟪⬜`）。
3. 当 `mode=single-cell` 时：返回 1 个字符（默认 `U+E000`）并附带渲染提示。

## 关键限制

- 纯文本协议无法凭空“发明”新的 Unicode emoji。
- `single-cell` 模式本质是“单字符标记”，要想显示成海马图标，需要客户端配合：
  - 方案 A：加载包含 `U+E000` 海马字形的自定义字体。
  - 方案 B：把 `:seahorse:` 这类短代码替换成平台自定义 emoji（类似社交软件做法）。
- 在不支持自定义字体/短代码替换的终端中，会显示为普通字符或方框。

## 使用建议

- 海马主体与背景对比越明显，效果越好。
- 若结果过粗可增大 `width`，若太宽可减小 `width`。
- 若你要“看起来只占一个字宽”，优先使用 `single-cell` 并在前端/客户端做渲染接管。
