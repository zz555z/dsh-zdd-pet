# 合并上游规则（dsh-zdd-pet ← PC2005-cloud/dsh-pet）

> 本 fork 是 [PC2005-cloud/dsh-pet](https://github.com/PC2005-cloud/dsh-pet) 的二次开发分支。
> 这份文档记录**合并上游时的固定套路与已踩过的坑**，下次同步直接照着做。
> 记录时间：2026-11-10（合并上游 v0.4.7，即本 fork v0.5.0）。

---

## 0. 先分清两个"远程"

| remote | 指向 | 角色 |
| --- | --- | --- |
| `origin` | `zz555z/dsh-zdd-pet`（本 fork 自己的仓库） | **发布目标**，一般已经同步，不需要合 |
| 上游 | `PC2005-cloud/dsh-pet` | **真正有新东西的地方**，每次要合的是它 |

合并前先确认：

```bash
git fetch https://github.com/PC2005-cloud/dsh-pet.git main:refs/remotes/upstream/main
git rev-list --left-right --count refs/remotes/upstream/main...main   # 左=上游独有 右=本地独有
git merge-base HEAD refs/remotes/upstream/main                          # 分叉点
```

两边都有独有提交 = 分叉，必须做**真合并**（不是 fast-forward），也必须**保留双方功能**。

---

## 1. 铁律：两侧功能取并集

合并 = 把上游的新能力**加进**fork，同时**保住 fork 的二开特性**。
任何"为了消冲突而删掉一边"的解法都是回归。

- fork 的二开（截至 v0.5.0）：气泡任务进度、心情/亲密度、番茄钟、随机小事件、主动关心 + 长期记忆、任务完成提示、任务彩蛋、余额告急演出、启动吉祥话、节日演出、点击台词、宠物作息、任务完成庆祝、气泡表情包总开关
- 上游的能力：语音播报（说与听）、待办清单、睡觉/梦话、头像上传、8 语言设置页、动作频率、移动端效果（倾斜/摇一摇/震动）、通用单选下拉、接触面物理模型、角色参考图接口、第三方记忆扩展点

---

## 2. 命名归一（最大的坑）

### 规则

fork 曾把插件包目录 `dsh-pet/` 改名为 `dsh-zdd-pet/`，并把 **`dsh-pet*` 前缀的标识符全量改名**为 `dsh-zdd-pet*`：

- 路由段：`/dsh-pet-7340` → `/dsh-zdd-pet-7340`
- CSS 类族：`dsh-pet-cfg__*` / `dsh-pet-mp__*` / `dsh-pet-sel__*` → `dsh-zdd-pet-*`
- 桥接 / IPC / 事件名：`dsh-pet-bridge:` → `dsh-zdd-pet-bridge:`
- 客户端服务名：`petApi7340` → `petApiZdd`
- token 头：`X-DSH-Pet-Token` → `X-DSH-Zdd-Pet-Token`
- 临时目录 / 文件名前缀：`dsh-pet-log-` → `dsh-zdd-pet-log-`

**`dsh-pet` 之外的词不动**：`.pet-bubble` / `.pet-hit` / `.pet-stage` / `.pet-bub-*` 这类是另一套命名，两边都没改，别顺手改。

### 为什么是全量改

fork 的 HEAD 上 `src/` 与 `runtime/` 里**一个 `dsh-pet` 都不剩**（`git grep -c 'dsh-pet' HEAD -- dsh-zdd-pet/src` 返回 0）。
所以合并后的判定标准很硬：

```bash
git grep -c 'dsh-pet' -- dsh-zdd-pet/src dsh-zdd-pet/runtime   # 必须全是 0
```

### 怎么执行

**上游新增的文件一定带旧名**（上游根本不知道 fork 改过名），所以合并完必须全量扫一遍：

```bash
# 只扫 src/ 和 runtime/：tools/、scripts/、.gitignore 里的 dsh-pet 是 fork 有意保留的
grep -rl 'dsh-pet' --include='*.ts' --include='*.tsx' --include='*.js' --include='*.mjs' \
      --include='*.html' dsh-zdd-pet/src dsh-zdd-pet/runtime
```

替换规则（保后缀、整体换前缀）：

- `dsh-pet` → `dsh-zdd-pet`
- `X-DSH-Pet-Token` → `X-DSH-Zdd-Pet-Token`
- 上游的客户端服务名 → fork 的服务名

**服务名要从 git blob 里程序化取**，不要手打（两边的字面量长得像但不等价）：

```bash
git show HEAD:dsh-zdd-pet/src/client/app.ts | grep -oE "ctx\.provide\('[^']+'"
```

### 目录改名 vs 标识符改名是两件事

| | 怎么解决 |
| --- | --- |
| **目录** `dsh-pet/` ↔ `dsh-zdd-pet/` | 靠 git 的**目录改名检测**：上游新增的文件会自动落到 `dsh-zdd-pet/` 下。**不用手动搬**。 |
| **标识符** `dsh-pet-*` | git 不管，**必须自己扫**。 |

> 别试图"先把上游的目录也改名再合"——实测会炸出 696 个 rename/rename 冲突，比原方案差得多。

---

## 3. 同名不同义的字段（最容易翻车）

上游和 fork 可能用**同一个名字表示两件事**。这次就撞上：

| 名字 | 上游的含义 | fork 的含义 | 解法 |
| --- | --- | --- | --- |
| `whisperHold` | `BubbleHoldState` **对象**（收起计划状态机） | **布尔**（是否常驻气泡） | fork 的语义迁到新字段 `whisperHoldKind`（`'confirm' \| 'complete' \| null`），上游的字段名保持原义、只由 `applyWhisperHold` 维护 |

**合并前必查**：两边同名标识符，逐个看**语义**而不是看名字。

```bash
# 找出两边都有的字段，人工比对语义
git show HEAD:dsh-zdd-pet/src/xxx.ts | grep -oE '\b[a-zA-Z]+\b' | sort -u > /tmp/fork.txt
git show refs/remotes/upstream/main:dsh-pet/src/xxx.ts | grep -oE '\b[a-zA-Z]+\b' | sort -u > /tmp/up.txt
comm -12 /tmp/fork.txt /tmp/up.txt
```

---

## 4. API / 文档层

| 层 | 规则 |
| --- | --- |
| 路由段 | 取 **fork 的值**（包名决定路由段）。上游若把 `ROUTE_PATH` 改名成 `ROUTE_SEGMENT` 并加了挂载前缀支持（`mountPrefixOf` / `routePathOf`），**改名保留、值取 fork 的、两个导出都要有**（宿主要 `ROUTE_SEGMENT`，客户端要 `ROUTE_PATH`，别导成两个同名常量） |
| openapi.yaml | 上游通常是**路径超集** → 取上游的路径集，但**保留 fork 独有的参数**（这次是 `POST /bubble/clear` 的 `messageId`）。改完必须跑 `npm run check:openapi` |
| API.md / README / CONFIG.md | 取上游的**超集内容**，再把 fork 的二开说明**加回去**（这次 README 补进了上游的语音/待办/睡觉/移动端四条能力，CONFIG.md 的字段表做成两边并集） |
| 包名 / npm badge / 仓库链接 | 归 fork（`dsh-zdd-pet`、`zz555z/dsh-zdd-pet`） |
| 上游仓库地址 | `github.com/PC2005-cloud/dsh-pet` 这类**指向上游**的链接保留原样 |

### 文档路径也要跟着改名

`@module dsh-pet/src/...` → `@module dsh-zdd-pet/src/...`，Markdown 里的 `dsh-pet/assets/...` → `dsh-zdd-pet/assets/...`。

---

## 5. 设置页文案（locale）

上游把单文件 `locales.ts` 拆成了 `locales/` 目录（zh/en/ja/es/fr/de/ru/pt 八种语言）。

- **键集以 `zh.ts` 为真源**，每种语言都是 `Record<Key, string>`，少一个键就是**类型错误**
- fork 的新键（这次 80 个）必须**补齐全部 8 种语言**，不能只补 zh/en
- 占位符 `{name}` `{n}` `{profile}` `{profileDir}` **逐字保留**，且位置要符合该语言习惯
- 校验：

```bash
node -e "
const fs=require('fs');
function getObj(f,n){let t=fs.readFileSync(f,'utf8').replace(/import type .*;/g,'').replace(/export type Key = keyof typeof zh;/,'');
const i=t.indexOf('export const '+n),eq=t.indexOf('=',i),ob=t.indexOf('{',eq);let d=0,q=null,j=ob;
for(;j<t.length;j++){const c=t[j];if(q){if(c==='\\\\'){j++;continue}if(c===q)q=null;continue}
if(c===\"'\"||c==='\"'||c==='\`'){q=c;continue}if(c==='{')d++;else if(c==='}'){d--;if(!d)break}}
return new Function('return '+t.slice(ob,j+1))();}
const zh=getObj('src/client/settings/locales/zh.ts','zh');
const L=getObj('src/client/settings/locales/ja.ts','ja');
console.log('zh',Object.keys(zh).length,'ja',Object.keys(L).length);
console.log('missing:',Object.keys(zh).filter(k=>!(k in L)));
console.log('extra:',Object.keys(L).filter(k=>!(k in zh)));"
```

---

## 6. 配置文件 config.jsonc

键取**并集**（这次：上游 29 键 + fork 14 键 = 43 键）。
合并完用仓库自己的解析器验一遍：

```bash
node --experimental-strip-types -e "
import('./src/host/config/jsonc.ts').then(m=>{
  const d=m.readJsonc('assets/config.jsonc');
  console.log('keys',Object.keys(d).length);});"
```

---

## 7. 执行顺序（照这个顺序做，别乱）

```
① 备份分支            git branch backup/pre-merge-<日期> main
② fetch 上游 + 看分叉
③ 起合并              git merge --no-commit --no-ff refs/remotes/upstream/main
④ 先解决大面积的"目录/路径"类冲突（git 自动处理的多，人工确认落位对不对）
⑤ 解决语义冲突        逐个文件取并集
⑥ 全量扫命名          dsh-pet* → dsh-zdd-pet*（src/ + runtime/）
⑦ 重建构建产物        npm run build   ← fork 把 lib/ 入库了，必须重建
⑧ 跑门禁              见下
⑨ 提交 + 打 tag + 发 npm
```

### 为什么 ⑥ 要放在 ⑤ 之后

合并时上游新增文件带的是上游的旧名。**先扫命名再解决语义冲突**，会让你在改冲突时反复面对两种写法。**先解决冲突，最后一次性扫**，冲突块里的内容也一起被扫到。

---

## 8. 门禁清单

```bash
npm run typecheck      # tsc --noEmit && tsc -p tsconfig.test.json
npm run lint
npm run check:cycles   # 导入环
npm run check:runtime  # runtime/electron-helper 的独立 eslint 配置
npm run format:check
npm run check:openapi
npm test               # 单元测试
npm run test:ui        # Playwright（需要 npx playwright install chromium）
npm run build          # 重建 lib/（prepack 会自动跑）
```

### 关键：**用上游做基线**

全量测试里出现 `not ok` 时，**先判断是不是合并引入的**：

```bash
# 把上游拉到临时目录，跑同一套测试
mkdir -p /tmp/upfull && git archive refs/remotes/upstream/main dsh-pet | tar -x -C /tmp/upfull
cd /tmp/upfull/dsh-pet && ln -s <本仓库>/dsh-zdd-pet/node_modules node_modules
npm test 2>&1 | grep -E "^# (tests|pass|fail|cancelled)"
```

这次的结果：上游 2454 项 / 0 失败 / 11 取消，合并后 2622 项 / 0 失败 / 11 取消，**失败集合逐条一致** → 说明那 9 条 `not ok` 是上游自身在 node:test 并行下的产物，不是合并引入。

> `npm test` 的 `fail 0` + 有 `not ok` 行是正常的：那几条是 `cancelledByParent`（父套件超时），计在 cancelled 里。

---

## 9. 人工核对清单（工具抓不到的部分）

桌面运行时（`runtime/electron-helper/*.js`）**几乎没有直接测试覆盖**，合并完必须手工核对：

- [ ] 同名标识符的**语义**两边一致？（见 §3）
- [ ] 状态字段的**读写配对**：谁写、谁读，初始化在哪
- [ ] **赋值语句的位置**：会不会落在某个早退分支之后，导致读到过期值？
- [ ] 同一件事**是不是起了两份定时器**？（后写的覆盖前一个句柄，前一个再也 clear 不掉）
- [ ] 跨半边的类名/常量是否同源（`src/shared` ↔ `runtime` ↔ `src/client`）
- [ ] 合并进来的新依赖是否装上了（`pnpm install --frozen-lockfile`）

---

## 10. 发布

```bash
npm run build && npm run prepack        # 完整门禁
npm publish --tag latest
```

**两个坑**：

1. **npm 可能把版本放进 staged 状态**——`npm publish` 打印 `+ pkg@1.0.0` 且退出码 0，但 registry 查不到。**别重复发布**（会撞 `Cannot publish over previously staged version`）。正确姿势是查带认证的 `dist-tags`：
   ```bash
   curl -sS -H "Authorization: Bearer $(grep _authToken ~/.npmrc | cut -d= -f2)" \
        https://registry.npmjs.org/<pkg> | python3 -m json.tool | head -20
   ```
   staged 版本**约两分钟后自动放行**。如果被 staged 了，需要在 npm 网站上确认发布。
2. **tag 别撞上游已占用的名字**。上游已用 `v0.4.3 / v0.4.6 / v0.4.7` 等，fork 自己的 tag 是 `v0.4.0 / v0.4.1 / v0.4.2`。所以这次把版本号提到 **0.5.0**。

### tag 惯例

用**附注 tag**，中文摘要，跟 `v0.4.2` 的格式对齐：

```bash
git tag -a v0.5.0 <commit> -m "v0.5.0：合入上游 v0.4.7，保留全部二开特性"
git push origin v0.5.0
```

只推分支不推 tag（`git push origin main`）就不会误发版本。

---

## 11. 本次合并的实际结果（供下次对照）

| | 合并前 | 合并后 |
| --- | --- | --- |
| 版本 | v0.4.2 | v0.5.0 |
| 提交数 | — | +118（上游 117 + 合并提交 1） |
| 文件变更 | — | 688 个（+97770 / -7289） |
| `src/` 文件数 | 461 | 652 |
| `lib/` 体积 | 3.9 MB | 6.2 MB |
| 路由数 | 33 | 43 |
| locale 键数 | 238 × 2 语言 | 300 × 8 语言 |
| config.jsonc 键数 | 29 | 43 |
| 测试 | 2622 项 / 0 失败 / 11 取消（与上游基线一致） | 同 |

### 本次实际踩到的坑（都已修）

1. **上游新增文件带旧命名** —— 200+ 个文件需要扫
2. **`whisperHold` 同名不同义** —— fork 的布尔语义被冲掉了上游的状态机
3. **`this.bubbleSlot = slot` 落在早退之后** —— 隐藏的气泡仍被当成可点的任务气泡
4. **两个定时器抢同一槽位** —— 后写的覆盖句柄，前一个清不掉
5. **`tools/cordis-probe` 的服务名对不上** —— 那是 fork 合并前就有的 bug，探针在 fork 上从来就取不到服务
6. **npm staged 版本** —— 打印成功但 registry 查不到，约两分钟自动放行
7. **上游 tag 占用** —— `v0.4.7` 已被上游占用，版本号因此提到 `0.5.0`
