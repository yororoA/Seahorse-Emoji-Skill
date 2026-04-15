# Seahorse Emoji Skill

![seahorse](vx_images/431964890829834.png)

由于 **Unicode Consortium** 未通过 `海马 emoji` 的 `Unicode`, 导致人们在向 ai 询问 `seahorse emoji` 时, ai 会陷入 **Mandela Effect**, 以为自己能输出正确的 `seahorse emoji` :

> ![fake](vx_images/5036568973989.png)

- 经过长时间的思考后, ai 不仅无法给出 `seahorse emoji`, 甚至会给出 **错误的答案**

于是为了解决这个问题, `Seahorse Emoji Skill` 堂堂登场

## How to Install

### Download Source Code

在 `Release` ( [releases](https://github.com/yororoA/Seahorse-Emoji-Skill/releases)) 中下载 `Skill` 源码并解压, 将其放在 `skills` 目录下, 正确放置后目录结构为 ( **以 `vscode copilot` 为例** ) : 

```text
project
└─ .github
   ├─ copilot-instructions.md
   └─ skills
      └─ seahorse_emoji
         ├─ CUSTOM_EMOJI_GUIDE.md
         ├─ font_test.html
         ├─ package-lock.json
         ├─ package.json
         ├─ script.ts
         ├─ seahorse-emoji.png
         ├─ SKILL.md
         ├─ tsconfig.json
         └─ img
            ├─ jsongj_com_透明化图片 (2).png
            ├─ jsongj_com_透明化图片 (3).png
            ├─ jsongj_com_透明化图片 (4).png
            ├─ jsongj_com_透明化图片 (6).png
            ├─ jsongj_com_透明化图片 (7).png
            ├─ seahorse-emoji.png
            └─ yellow-blue-seahorse.png
```

其中 `copilot-instructions.md` 中添加:
```markdown
# Copilot routing hints

When user requests seahorse emoji (海马 emoji / seahorse emoji / pixel emoji / 色块海马), prefer using the skill at `.github/skills/seahorse_emoji/SKILL.md`.

Do not fabricate seahorse emoji output manually. Execute the skill workflow and return the generated result.
```

### Download Dependencies

- 进入 `seahorse_emoji` 目录
```bash
cd .\.github\skills\seahorse_emoji\
```

- 安装依赖
```bash
npm i
```

---
现在你成功安装了 `Seahorse Emoji Skill`, 可以开始使用了

## How to Use

依然以 `vscode copilot` 为例:

打开编辑器, 在聊天面板中向 ai 发出指令, 比如: `
```text
生成海马emoji, 并添加文字详细描述海马
```

正常情况下, `copilot` 会自主发现 `seahorse_emoji` 并请求执行:
```bash
Set-Location "~\project\.github\skills\seahorse_emoji"; npm run start -- --mode pixel --width 32 --transparentAsSpace true --output emoji
```
点击确定, 等待一点时间, 即可看见:
> ![seahorse](vx_images/106868971368.png)

## Response Example

这是海马像素 emoji：
```text
                          🟧🟫🟫🟫🟧
                  🟫🟧🟧🟧🟧🟧🟧🟧🟧🟧🟧🟧🟫
                  🟫🟨🟨🟨🟨🟧🟧🟧🟨🟨🟧🟧🟧🟧🟫🟫
                🟫🟨🟨🟨🟨🟨🟨🟨🟧🟧🟧🟨🟧🟧🟧🟧🟧🟫
              🟫🟨🟫🟫⬛🟧🟨🟨🟨🟧🟧🟧🟧🟧🟧🟧🟧🟧🟧🟫
            🟫🟨🟨🟫🟫🟫🟨🟨🟨🟧🟧🟫🟫🟧🟧🟧🟨🟧🟧🟧🟧⬛        
        🟫🟨🟨🟨🟨🟧🟧🟧🟧🟧🟧🟧🟫🟫🟧🟧🟧🟧🟧🟧🟧🟧🟫⬛        
🟫🟨🟨🟧🟧🟧🟧🟫🟫🟫🟫🟫🟫🟫🟫    🟧🟨🟨🟧🟧🟧🟧🟧🟧🟫
  🟫🟧🟫⬛                    🟫🟨🟨🟨🟨🟨🟨🟧🟧🟧🟫🟫
                          🟫🟨🟨🟨🟨🟧🟨🟧🟧🟧🟧🟧⬛
                    🟫🟨🟨🟨🟨🟨🟨🟨🟨🟨🟨🟧🟧🟧🟫
                🟨🟨🟨🟨🟨🟨🟨🟧🟨🟨🟨🟨🟧🟧🟧🟫
            🟨🟨🟨🟨🟨🟨🟨🟨🟨🟨🟨🟧🟧🟧🟧🟧🟧🟫
          🟨🟨🟨🟨🟨🟨🟨🟨🟨🟨🟨🟨🟨🟧🟧🟧🟧🟫🟫🟧🟨🟨🟨🟨🟨    
        🟨🟨🟨🟨🟨🟨🟨🟧🟧🟨🟨🟨🟨🟨🟧🟧🟧🟧🟫🟧🟧🟨🟨🟨🟨🟨    
        🟧🟧🟨🟨🟨🟨🟧🟨🟨🟨🟧🟧🟧🟧🟧🟧🟧🟫🟫🟧🟨🟨🟨🟨🟨🟨🟧  
      🟫🟨🟨🟨🟨🟨🟧🟨🟨🟨🟨🟧🟧🟧🟧🟧🟫🟫🟫🟧🟧🟨🟨🟨🟨🟨🟫🟫🟫
    🟫🟧🟨🟨🟨🟨🟨🟨🟨🟨🟨🟧🟧🟧🟧🟧🟫🟫⬛  🟫🟧🟨🟨🟨🟨        
      🟧🟧🟧🟧🟧🟧🟧🟧🟧🟧🟧🟧🟧🟧🟫🟫⬛      🟧🟧  🟫🟫        
      🟧🟧🟨🟨🟧🟧🟧🟧🟧🟧🟧🟫🟫🟫🟫⬛          🟫
      🟫🟧🟧🟧🟧🟧🟧🟧🟧🟫🟫⬛
      🟫🟧🟨🟧🟧🟧🟧🟧🟫
        🟫🟧🟧🟧🟧🟫🟫              🟫
        🟫🟧🟧🟧🟧🟧🟫          🟧🟧🟧🟧🟧⬛
          🟫🟫🟧🟧🟧🟧🟫        🟧🟧🟧🟫🟧🟧
            ⬛🟫🟧🟧🟧🟧🟫⬛      🟫🟫🟫🟧🟫
                ⬛🟫🟧🟧🟧🟧🟧🟧🟧🟧🟧🟧🟫
                      ⬛🟫🟫🟫🟫🟫🟫🟫⬛
```
海马是硬骨鱼纲海龙科鱼类，头部像小马、身体直立、尾巴可卷曲抓附海草或珊瑚。它们通常栖息在浅海海草床、红树林与珊瑚礁边缘，依靠伪装和缓慢摆动背鳍移动。海马以小型甲壳类和浮游生物为食，属于伏击型捕食者。其最显著特征是“雄性育儿”：雌海马将卵产入雄海马育儿囊，受精与胚胎发育多在雄体内完成，最后由雄海马“分娩”幼体。海马对栖息地破坏、海洋污染和过度捕捞较敏感，因此在生态保护中具有较高关注度。


