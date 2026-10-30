;(()=>{

//#region src/shared/constants.ts
const CANVAS_H = 360;
const FEET_Y = 330;
const HIT_BOX = {
	x0: 200,
	y0: 50,
	x1: 440,
	y1: 335
};
const DRAG_THRESHOLD = 5;
const SLINGSHOT_DOUBLE_MS = 200;
const PET_REF_WIDTH = 462;
const ROUTE_PATH = "/dsh-zdd-pet-7340";
const ANIMATION_EXT = ".webm";

//#endregion
//#region src/shared/menu/tree.ts
const displayMenuBranch = () => ({
	label: "显示位置",
	children: [
		{
			label: "仅网页",
			action: "set-display",
			display: "web"
		},
		{
			label: "仅桌面",
			action: "set-display",
			display: "desktop"
		},
		{
			label: "两者",
			action: "set-display",
			display: "both"
		},
		{
			label: "都不",
			action: "set-display",
			display: "none"
		}
	]
});
const pomodoroMenuBranch = () => ({
	label: "番茄钟",
	children: [
		{
			label: "开始专注",
			action: "pomodoro-start"
		},
		{
			label: "暂停",
			action: "pomodoro-pause"
		},
		{
			label: "继续",
			action: "pomodoro-resume"
		},
		{
			label: "查看剩余",
			action: "pomodoro-status"
		},
		{
			label: "跳过当前阶段",
			action: "pomodoro-skip"
		},
		{
			label: "结束番茄钟",
			action: "pomodoro-stop"
		},
		{
			label: "重置（清空轮数）",
			action: "pomodoro-reset"
		}
	]
});
const MORE_MENU_LABEL = "更多";
function readMenuItems(data, surface) {
	if (!data || typeof data !== "object") return [];
	const items = data.items;
	if (!Array.isArray(items)) return [];
	const out = [];
	for (const item of items) {
		if (!item || typeof item !== "object") continue;
		const rec = item;
		const rawTarget = rec.target;
		const target = rawTarget === "web" || rawTarget === "desktop" || rawTarget === "both" ? rawTarget : "both";
		if (target !== "both" && target !== surface) continue;
		const owner = rec.owner;
		const label = rec.label;
		if (typeof owner === "string" && owner !== "" && typeof label === "string" && label !== "") out.push({
			owner,
			label
		});
	}
	return out;
}
function buildMoreBranch(items) {
	const groups = new Map();
	for (const item of items) {
		const list = groups.get(item.owner);
		if (list) list.push(item.label);
		else groups.set(item.owner, [item.label]);
	}
	const children = [];
	for (const [owner, labels$1] of groups) if (labels$1.length === 1) children.push({
		label: labels$1[0],
		action: "third-party",
		owner
	});
	else children.push({
		label: owner,
		children: labels$1.map((label) => ({
			label,
			action: "third-party",
			owner
		}))
	});
	return children.length > 0 ? {
		label: MORE_MENU_LABEL,
		children
	} : null;
}
/** 事件名 → 分类标签（无映射时用事件名本身）。 */
const EVENT_LABELS = {
	balance: "余额档位",
	whisper: "碎碎念",
	workStatus: "工作状态"
};
const leaf = (anim) => ({
	label: anim,
	anim
});
function buildMenuTree(animations) {
	const groups = [];
	const pools = [
		["待机", animations.idle],
		["转向", animations.turn],
		["拖拽", animations.drag],
		["点击回应", animations.clicks],
		["移动", animations.moves.actions.map((m) => m.name)]
	];
	for (const [label, pool] of pools) if (pool.length) groups.push({
		label,
		children: pool.map(leaf)
	});
	const cats = (animations.categories ?? []).filter((c) => c.actions.length > 0);
	for (const c of cats) groups.push({
		label: c.id,
		children: c.actions.map(leaf)
	});
	const events = animations.events ?? {};
	for (const key of Object.keys(events)) {
		const pool = events[key] ?? [];
		const names = [];
		for (const slot of pool) if (typeof slot === "string") names.push(slot);
		else names.push(...slot);
		if (names.length) groups.push({
			label: EVENT_LABELS[key] ?? key,
			children: names.map(leaf)
		});
	}
	if (!groups.length) return [];
	return [{
		label: "动作",
		children: groups
	}];
}
function isNoMirrorAnimation(categories, anim) {
	return (categories ?? []).some((c) => c.noMirror === true && c.actions.includes(anim));
}

//#endregion
//#region src/shared/menu/css.ts
const MENU_CSS = [
	".dsh-zdd-pet-menu{position:fixed;left:0;top:0;z-index:2147483000;color:#2b2b2b;font-size:13px;line-height:1.5;",
	"font-family:'Microsoft YaHei UI','Segoe UI','PingFang SC',sans-serif;user-select:none;pointer-events:auto}",
	".dsh-zdd-pet-menu,.dsh-zdd-pet-menu *{box-sizing:border-box}",
	".dsh-zdd-pet-menu-column{position:absolute;min-width:150px;max-width:300px;padding:4px;",
	"background:rgba(255,255,255,.98);border:1px solid rgba(0,0,0,.12);border-radius:8px;",
	"box-shadow:0 8px 28px rgba(0,0,0,.2);max-height:min(62vh,460px);overflow-y:auto;",
	"scrollbar-width:thin;scrollbar-color:rgba(0,0,0,.22) transparent}",
	".dsh-zdd-pet-menu-column::-webkit-scrollbar{width:8px;height:8px}",
	".dsh-zdd-pet-menu-column::-webkit-scrollbar-track{background:transparent}",
	".dsh-zdd-pet-menu-column::-webkit-scrollbar-thumb{background:rgba(0,0,0,.16);border-radius:4px;",
	"border:2px solid transparent;background-clip:content-box}",
	".dsh-zdd-pet-menu-column::-webkit-scrollbar-thumb:hover{background:rgba(43,99,255,.4);",
	"border:2px solid transparent;background-clip:content-box}",
	".dsh-zdd-pet-menu-column::-webkit-scrollbar-corner{background:transparent}",
	".dsh-zdd-pet-menu-item{position:relative;display:flex;align-items:center;justify-content:space-between;",
	"gap:14px;padding:5px 12px;border-radius:6px;white-space:nowrap;cursor:default}",
	".dsh-zdd-pet-menu-item:hover{background:rgba(43,99,255,.14)}",
	".dsh-zdd-pet-menu-item>span:first-child{min-width:0;overflow:hidden;text-overflow:ellipsis}",
	".dsh-zdd-pet-menu-hint{color:#9aa0a6;font-size:12px;flex:none;white-space:nowrap}",
	".dsh-zdd-pet-menu-arrow{color:#9aa0a6;font-size:12px;flex:none}"
].join("");

//#endregion
//#region src/shared/menu/position.ts
/** 面板与边界、面板之间的间距（px）。 */
const PANEL_GAP = 4;
function pickPanelPosition(input) {
	const { panel, item, parent, others, clamp } = input;
	const minLeft = clamp.x + PANEL_GAP;
	const minTop = clamp.y + PANEL_GAP;
	const maxLeft = clamp.x + clamp.w - PANEL_GAP - panel.w;
	const maxTop = clamp.y + clamp.h - PANEL_GAP - panel.h;
	/** 夹进 clamp；面板比 clamp 还宽/高时贴左上角。 */
	const clampX = (v) => Math.max(minLeft, Math.min(v, Math.max(minLeft, maxLeft)));
	const clampY = (v) => Math.max(minTop, Math.min(v, Math.max(minTop, maxTop)));
	const hitsOther = (left, top) => others.some((b) => left < b.right && left + panel.w > b.left && top < b.bottom && top + panel.h > b.top);
	const fitsClamp = (left, top) => left >= minLeft - .5 && left <= maxLeft + .5 && top >= minTop - .5 && top <= maxTop + .5;
	const topAtItem = clampY(item.top);
	const topAtParent = clampY(parent.top);
	const cands = [
		{
			left: parent.right + PANEL_GAP,
			top: topAtItem
		},
		{
			left: parent.left - PANEL_GAP - panel.w,
			top: topAtItem
		},
		{
			left: parent.right + PANEL_GAP,
			top: topAtParent
		},
		{
			left: parent.left - PANEL_GAP - panel.w,
			top: topAtParent
		}
	];
	const ideal = cands.find((cd) => fitsClamp(cd.left, cd.top) && !hitsOther(cd.left, cd.top));
	if (ideal) return ideal;
	const fitted = cands.map((cd) => ({
		left: clampX(cd.left),
		top: clampY(cd.top)
	})).find((cd) => !hitsOther(cd.left, cd.top));
	if (fitted) return fitted;
	return {
		left: clampX(parent.right + PANEL_GAP),
		top: clampY(topAtItem)
	};
}

//#endregion
//#region src/shared/menu/mount.ts
function isBranchNode(n) {
	return "children" in n && Array.isArray(n.children);
}
function mountContextMenu(opts) {
	const { tree, x, y, onAction, onClose, clamp } = opts;
	const c = clamp && Number.isFinite(clamp.x + clamp.y + clamp.w + clamp.h) ? clamp : {
		x: 0,
		y: 0,
		w: window.innerWidth,
		h: window.innerHeight
	};
	const root = document.createElement("div");
	root.className = "dsh-zdd-pet-menu";
	root.style.left = "0px";
	root.style.top = "0px";
	root.addEventListener("contextmenu", (e) => e.preventDefault());
	let closed = false;
	/** 每个面板当前展开的子面板（无 = 未展开）；hideChain 会沿链清除 */
	const openChild = new Map();
	/** 指针整体离开菜单树的兜底关闭定时器（root mouseover 重新进入即取消） */
	let leaveTimer = null;
	/** 关闭某面板及其后代面板整条链（display:none + 清 openChild 链） */
	const hideChain = (panel) => {
		panel.style.display = "none";
		const child = openChild.get(panel);
		if (child) {
			openChild.delete(panel);
			hideChain(child);
		}
	};
	/** 把子面板摆到触发项旁边：优先父面板右侧，放不下翻到父面板左侧，
	*  且不与任何已展开面板重叠；贴边时夹进 clamp。 */
	const showPanel = (panel, item) => {
		const rect = item.getBoundingClientRect();
		panel.style.left = "";
		panel.style.top = "";
		panel.style.display = "block";
		const parentEl = item.parentElement;
		const pr = parentEl ? parentEl.getBoundingClientRect() : rect;
		const pick$1 = pickPanelPosition({
			panel: {
				w: panel.offsetWidth,
				h: panel.offsetHeight
			},
			item: {
				left: rect.left,
				right: rect.right,
				top: rect.top
			},
			parent: {
				left: pr.left,
				right: pr.right,
				top: pr.top
			},
			others: Array.from(root.querySelectorAll(".dsh-zdd-pet-menu-column")).filter((p) => p !== panel && p.style.display !== "none").map((p) => {
				const b = p.getBoundingClientRect();
				return {
					left: b.left,
					top: b.top,
					right: b.right,
					bottom: b.bottom
				};
			}),
			clamp: {
				x: c.x,
				y: c.y,
				w: c.w,
				h: c.h
			}
		});
		panel.style.left = pick$1.left + "px";
		panel.style.top = pick$1.top + "px";
	};
	/** 构建一层面板；分支项的子面板平级挂到 root 下、不嵌套。
	*  面板先入 DOM、子面板后入，层级越深绘制越靠上（子菜单盖在父菜单上层）。 */
	const buildPanel$1 = (nodes) => {
		const panel = document.createElement("div");
		panel.className = "dsh-zdd-pet-menu-column";
		panel.style.display = "none";
		if (clamp) panel.style.maxHeight = Math.min(460, Math.max(120, c.h - 16)) + "px";
		root.appendChild(panel);
		for (const node of nodes) {
			const item = document.createElement("div");
			item.className = "dsh-zdd-pet-menu-item";
			if (isBranchNode(node)) {
				item.classList.add("dsh-zdd-pet-menu-branch");
				const label = document.createElement("span");
				label.textContent = node.label;
				const arrow = document.createElement("span");
				arrow.className = "dsh-zdd-pet-menu-arrow";
				arrow.textContent = "▸";
				item.appendChild(label);
				item.appendChild(arrow);
				const childPanel = buildPanel$1(node.children);
				item.addEventListener("mouseenter", () => {
					const prev = openChild.get(panel);
					if (prev && prev !== childPanel) hideChain(prev);
					openChild.set(panel, childPanel);
					showPanel(childPanel, item);
				});
			} else {
				const label = document.createElement("span");
				label.textContent = node.label;
				item.appendChild(label);
				if (node.hint) {
					const hint = document.createElement("span");
					hint.className = "dsh-zdd-pet-menu-hint";
					hint.textContent = node.hint;
					item.appendChild(hint);
				}
				item.addEventListener("mouseenter", () => {
					const prev = openChild.get(panel);
					if (prev) {
						openChild.delete(panel);
						hideChain(prev);
					}
				});
				item.addEventListener("click", (e) => {
					e.preventDefault();
					e.stopPropagation();
					close();
					onAction(node);
				});
			}
			panel.appendChild(item);
		}
		return panel;
	};
	const rootPanel = buildPanel$1(tree);
	rootPanel.style.display = "block";
	document.body.appendChild(root);
	rootPanel.style.left = "";
	rootPanel.style.top = "";
	const rw = rootPanel.offsetWidth;
	const rh = rootPanel.offsetHeight;
	rootPanel.style.left = Math.max(c.x + 4, Math.min(x, c.x + c.w - rw - 4)) + "px";
	rootPanel.style.top = Math.max(c.y + 4, Math.min(y, c.y + c.h - rh - 4)) + "px";
	root.addEventListener("mouseleave", () => {
		if (leaveTimer !== null) window.clearTimeout(leaveTimer);
		leaveTimer = window.setTimeout(() => {
			leaveTimer = null;
			close();
		}, 200);
	});
	root.addEventListener("mouseover", () => {
		if (leaveTimer !== null) {
			window.clearTimeout(leaveTimer);
			leaveTimer = null;
		}
	});
	const onDocPointerDown = (e) => {
		if (closed) return;
		if (root.contains(e.target)) return;
		close();
	};
	const onDocKeyDown = (e) => {
		if (closed) return;
		if (e.key === "Escape") close();
	};
	document.addEventListener("mousedown", onDocPointerDown, true);
	document.addEventListener("keydown", onDocKeyDown, true);
	const close = () => {
		if (closed) return;
		closed = true;
		if (leaveTimer !== null) window.clearTimeout(leaveTimer);
		leaveTimer = null;
		document.removeEventListener("mousedown", onDocPointerDown, true);
		document.removeEventListener("keydown", onDocKeyDown, true);
		root.remove();
		if (onClose) onClose();
	};
	return {
		el: root,
		close
	};
}

//#endregion
//#region src/shared/tooltip.ts
const TOOLTIP_CLASS = "pet-tooltip";
const TOOLTIP_GAP_RATIO = .022;
function tooltipPlacement(cursor, tip, bounds, gap) {
	const clamp = (v, lo, hi) => hi < lo ? lo : Math.min(Math.max(v, lo), hi);
	const rightMax = bounds.x + bounds.w;
	const bottomMax = bounds.y + bounds.h;
	let x = cursor.x + gap;
	if (x + tip.w > rightMax) x = cursor.x - gap - tip.w;
	x = clamp(x, bounds.x, rightMax - tip.w);
	let y = cursor.y + gap;
	if (y + tip.h > bottomMax) y = cursor.y - gap - tip.h;
	y = clamp(y, bounds.y, bottomMax - tip.h);
	return {
		x,
		y
	};
}
const TOOLTIP_CSS = [
	".pet-tooltip{",
	"position:fixed;left:0;top:0;",
	"max-width:calc(var(--dsh-zdd-pet-size,var(--pet-size,462px))*0.8);",
	"padding:calc(var(--dsh-zdd-pet-size,var(--pet-size,462px))*0.010) calc(var(--dsh-zdd-pet-size,var(--pet-size,462px))*0.021);",
	"border-radius:calc(var(--dsh-zdd-pet-size,var(--pet-size,462px))*0.016);",
	"background:rgba(255,255,255,.96);color:#1f1f1f;",
	"border:1px solid rgba(0,0,0,.12);",
	"font-family:var(--dsh-zdd-pet-font-family,\"ShangshouSoftCandy\",\"Yuanti SC\",\"YouYuan\",\"幼圆\",\"Comic Sans MS\",\"PingFang SC\",\"Microsoft YaHei\",sans-serif);",
	"font-size:var(--dsh-zdd-pet-font-tip,calc(var(--dsh-zdd-pet-size,var(--pet-size,462px))*0.026));line-height:1.4;",
	"white-space:nowrap;overflow:hidden;text-overflow:ellipsis;",
	"box-shadow:0 calc(var(--dsh-zdd-pet-size,var(--pet-size,462px))*0.004) calc(var(--dsh-zdd-pet-size,var(--pet-size,462px))*0.013) rgba(0,0,0,.18);",
	"opacity:0;transition:opacity .12s ease;pointer-events:none;z-index:2}",
	".pet-tooltip.is-on{opacity:1}"
].join("");

//#endregion
//#region src/client/pet/css.ts
/** 宠物页面样式表。 */
const PET_CSS = [
	".dsh-zdd-pet-root{position:fixed;z-index:40;pointer-events:none;user-select:none}",
	".dsh-zdd-pet-root[data-corner=\"bottom-right\"]{right:var(--dsh-zdd-pet-mx,24px);bottom:var(--dsh-zdd-pet-my,0)}",
	".dsh-zdd-pet-root[data-corner=\"bottom-left\"]{left:var(--dsh-zdd-pet-mx,24px);bottom:var(--dsh-zdd-pet-my,0)}",
	".dsh-zdd-pet-root[data-corner=\"top-right\"]{right:var(--dsh-zdd-pet-mx,24px);top:var(--dsh-zdd-pet-my,0)}",
	".dsh-zdd-pet-root[data-corner=\"top-left\"]{left:var(--dsh-zdd-pet-mx,24px);top:var(--dsh-zdd-pet-my,0)}",
	".dsh-zdd-pet-stage{position:relative;width:var(--dsh-zdd-pet-size,462px);height:calc(var(--dsh-zdd-pet-size,462px)*9/16);pointer-events:none}",
	".dsh-zdd-pet-video{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;pointer-events:none;opacity:0;transition:opacity .18s ease;transform-origin:center}",
	".dsh-zdd-pet-video.is-front{opacity:1}",
	`.dsh-zdd-pet-hit{position:absolute;pointer-events:auto;cursor:url("${ROUTE_PATH}/pic/cursor-grab.png") 16 16, grab;z-index:1;touch-action:none;-webkit-user-select:none;-webkit-touch-callout:none}`,
	`.dsh-zdd-pet-hit.dragging{cursor:url("${ROUTE_PATH}/pic/cursor-grabbing.png") 16 16, grabbing}`,
	"@media (prefers-reduced-motion: reduce){.dsh-zdd-pet-video{transition:none}}",
	MENU_CSS,
	TOOLTIP_CSS
].join("\n");
/** 注入去重用的标记值，写在 `<style>` 的 `data-plugin-css` 上。 */
const cssTag = "dsh-zdd-pet/style.css";
function injectPetCss() {
	if (typeof document === "undefined") return;
	if (document.querySelector("style[data-plugin-css=\"" + cssTag + "\"]") !== null) return;
	const tag = document.createElement("style");
	tag.dataset.plugin = "dsh-zdd-pet";
	tag.dataset.pluginCss = cssTag;
	tag.textContent = PET_CSS;
	document.head.appendChild(tag);
}

//#endregion
//#region src/shared/physics/constants.ts
const SPRING_K = 200;
const SPRING_C = 30;
const TRAIL_KEEP_MS = 200;
const RELEASE_WINDOW_MS = 150;
const RELEASE_STALE_MS = 150;
const MIN_SPAN_MS = 20;
const SEG_MIN_DT_MS = 8;
const DEAD_ZONE_SPEED = 500;
const MAX_THROW_SPEED = 3600;
const PEAK_WEIGHT = .5;
const ACCEL_REF = 8e3;
const ACCEL_GAIN_MAX = .6;
const GRAVITY = 1400;
const RESTITUTION = .78;
const GROUND_FRICTION = 2.5;
const DEFAULT_PHYSICS = {
	gravity: GRAVITY,
	restitution: RESTITUTION,
	groundFriction: GROUND_FRICTION,
	ceilingBounce: true,
	throwPower: 1,
	petCollision: false
};
const DEFAULT_THROW_POWER = 1;
const REST_VY = 40;
const REST_VX = 15;
const MAX_STEP_DT = .05;
const SQ_SQUASH = .55;
const SQ_DURATION_MS = 220;
const SQ_SOFT_SPEED = 300;
const SQ_HARD_SPEED = 1500;
const SQ_MAX_SQUASH = .55;
const THROW_SPEED_ANCHOR = 1200;
const SLINGSHOT_REF_RATIO = .6;
const SUBSTEP_PX = 8;
const SUBSTEP_MAX = 64;
const PET_BOUNCE_E = .995;

//#endregion
//#region src/shared/physics/squash.ts
const landingSquash = (impactSpeed) => {
	const t = Math.min(Math.max((Math.abs(impactSpeed) - SQ_SOFT_SPEED) / (SQ_HARD_SPEED - SQ_SOFT_SPEED), 0), 1);
	return Math.min(.8, 1 - t * (1 - SQ_MAX_SQUASH));
};
const squashScale = (u, squash = SQ_SQUASH) => {
	if (u < .45) {
		const p$1 = u / .45;
		return 1 - (1 - squash) * p$1 * p$1;
	}
	const p = (u - .45) / .55;
	const c1 = 1.70158;
	const c3 = c1 + 1;
	const f = 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2);
	return Math.min(1.12, squash + (1 - squash) * Math.max(f, 0));
};

//#endregion
//#region src/shared/displays.ts
const rectRight = (r) => r.x + r.width;
const rectBottom = (r) => r.y + r.height;
const pointInRect = (r, x, y) => x >= r.x && x < rectRight(r) && y >= r.y && y < rectBottom(r);
const rectAtPoint = (rects, x, y) => {
	for (const r of rects) if (pointInRect(r, x, y)) return r;
	return null;
};

//#endregion
//#region src/shared/physics/throw.ts
const throwBounds = (o) => {
	const h = o.size * 9 / 16;
	return {
		minX: -o.sideAllow,
		minY: 0,
		maxX: o.W - o.size + o.sideAllow,
		maxY: o.H - h
	};
};
const throwStep = (s, dtRaw, b, physics = DEFAULT_PHYSICS) => {
	const dt = Math.min(Math.max(dtRaw, 0), MAX_STEP_DT);
	let { x, y, vx, vy } = s;
	vy += physics.gravity * dt;
	x += vx * dt;
	y += vy * dt;
	let bounced = false;
	if (x < b.minX) {
		x = b.minX;
		vx = Math.abs(vx) * physics.restitution;
		bounced = true;
	} else if (x > b.maxX) {
		x = b.maxX;
		vx = -Math.abs(vx) * physics.restitution;
		bounced = true;
	}
	if (y < b.minY) {
		if (physics.ceilingBounce) {
			y = b.minY;
			vy = Math.abs(vy) * physics.restitution;
			bounced = true;
		}
	} else if (y >= b.maxY) {
		y = b.maxY;
		vx *= Math.max(0, 1 - physics.groundFriction * dt);
		if (Math.abs(vy) < REST_VY) vy = 0;
		else vy = -Math.abs(vy) * physics.restitution;
		bounced = true;
	}
	const speed = Math.hypot(vx, vy);
	const atRest = y >= b.maxY - 1 && Math.abs(vy) < 1 && Math.abs(vx) < REST_VX || bounced && speed < REST_VY && Math.abs(vy) < 1;
	return {
		x,
		y,
		vx,
		vy,
		bounced,
		atRest
	};
};
const throwSubsteps = (vx, vy, dt) => {
	const travel = Math.hypot(vx, vy) * Math.min(Math.max(dt, 0), MAX_STEP_DT);
	if (!(travel > SUBSTEP_PX)) return 1;
	return Math.min(SUBSTEP_MAX, Math.ceil(travel / SUBSTEP_PX));
};

//#endregion
//#region src/shared/physics/spring.ts
const springStep = (v, x, target, dt, power = DEFAULT_THROW_POWER) => v + ((target - x) * SPRING_K - v * SPRING_C) * power * dt;
const softClampSpeed = (speed) => {
	if (speed <= 0) return 0;
	return MAX_THROW_SPEED * (1 - Math.exp(-speed / MAX_THROW_SPEED));
};

//#endregion
//#region src/shared/physics/release.ts
const trimTrail = (trail, now) => {
	const cutoff = now - TRAIL_KEEP_MS;
	let i = 0;
	while (i < trail.length && trail[i].t < cutoff) i++;
	return i === 0 ? trail : trail.slice(i);
};
const throwVelocity = (angleDeg, power) => {
	const speed = softClampSpeed(power * THROW_SPEED_ANCHOR);
	const rad = angleDeg * Math.PI / 180;
	return {
		vx: Math.cos(rad) * speed,
		vy: -Math.sin(rad) * speed
	};
};
const slingshotRefDist = (size) => size > 0 ? size * SLINGSHOT_REF_RATIO : 0;
const slingshotPower = (dist, size) => {
	const ref = slingshotRefDist(size);
	if (!(ref > 0) || !(dist > 0) || !Number.isFinite(dist)) return 0;
	return dist / ref;
};
const pullAngle = (pullX, pullY) => Math.atan2(pullY, -pullX) * 180 / Math.PI;
const slingshotVelocity = (angleDeg, power, throwPower = DEFAULT_THROW_POWER) => {
	const speed = THROW_SPEED_ANCHOR * Math.max(0, power) * Math.max(0, throwPower);
	if (speed === 0) return {
		vx: 0,
		vy: 0
	};
	const rad = angleDeg * Math.PI / 180;
	return {
		vx: Math.cos(rad) * speed,
		vy: -Math.sin(rad) * speed
	};
};
const estimateReleaseVelocity = (trail, now, physics = DEFAULT_PHYSICS) => {
	if (trail.length === 0) return null;
	const last = trail[trail.length - 1];
	if (now - last.t > RELEASE_STALE_MS) return null;
	const win = trail.filter((s) => now - s.t <= RELEASE_WINDOW_MS);
	if (win.length < 2) return null;
	const t0 = win[0].t;
	const x0 = win[0].x;
	const y0 = win[0].y;
	const t1 = win[win.length - 1].t;
	const x1 = win[win.length - 1].x;
	const y1 = win[win.length - 1].y;
	const spanMs = t1 - t0;
	if (spanMs < MIN_SPAN_MS) return null;
	const baseVx = (x1 - x0) / spanMs * 1e3;
	const baseVy = (y1 - y0) / spanMs * 1e3;
	const baseSpeed = Math.hypot(baseVx, baseVy);
	if (baseSpeed < 1e-6) return null;
	const segSpeeds = [];
	let px$1 = x0;
	let py = y0;
	let pt = t0;
	for (const s of win.slice(1)) {
		const dt = s.t - pt;
		if (dt >= SEG_MIN_DT_MS) {
			segSpeeds.push({
				speed: Math.hypot(s.x - px$1, s.y - py) / dt * 1e3,
				tEnd: s.t
			});
			px$1 = s.x;
			py = s.y;
			pt = s.t;
		}
	}
	const peakSpeed = segSpeeds.length ? Math.max(...segSpeeds.map((v) => v.speed)) : baseSpeed;
	let accel = 0;
	if (segSpeeds.length >= 2) {
		const lastSeg = segSpeeds[segSpeeds.length - 1];
		const firstSeg = segSpeeds[0];
		accel = (lastSeg.speed - firstSeg.speed) / Math.max((lastSeg.tEnd - firstSeg.tEnd) / 1e3, MIN_SPAN_MS / 1e3);
	}
	const speedBeforeClamp = ((1 - PEAK_WEIGHT) * baseSpeed + PEAK_WEIGHT * peakSpeed) * (1 + Math.min(Math.max(accel, 0) / ACCEL_REF, 1) * ACCEL_GAIN_MAX);
	const speed = softClampSpeed(speedBeforeClamp) * physics.throwPower;
	if (speed < DEAD_ZONE_SPEED) return null;
	return {
		vx: baseVx / baseSpeed * speed,
		vy: baseVy / baseSpeed * speed
	};
};

//#endregion
//#region src/shared/physics/collide.ts
const bodyPixelBox = (o) => {
	const h = o.size * 9 / 16;
	return {
		left: o.x + HIT_BOX.x0 / 640 * o.size,
		top: o.y + o.bottomPad + HIT_BOX.y0 / 360 * h,
		right: o.x + HIT_BOX.x1 / 640 * o.size,
		bottom: o.y + o.bottomPad + HIT_BOX.y1 / 360 * h
	};
};
const rectsOverlap = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
const collidePet = (fly, hit) => {
	const hf = fly.size * 9 / 16 / 2;
	const hh = hit.size * 9 / 16 / 2;
	const cx = hit.x + hit.size / 2 - (fly.x + fly.size / 2);
	const cy = hit.y + hh - (fly.y + hf);
	const dist = Math.hypot(cx, cy);
	if (dist < 1e-6) return null;
	const nx = cx / dist;
	const ny = cy / dist;
	const vrel = (fly.vx - hit.vx) * nx + (fly.vy - hit.vy) * ny;
	if (vrel <= 0) return null;
	const e = PET_BOUNCE_E;
	const m1 = fly.size * fly.size;
	const m2 = hit.size * hit.size;
	const v1n = fly.vx * nx + fly.vy * ny;
	const v2n = hit.vx * nx + hit.vy * ny;
	const v1n2 = ((m1 - e * m2) * v1n + (1 + e) * m2 * v2n) / (m1 + m2);
	const v2n2 = ((m2 - e * m1) * v2n + (1 + e) * m1 * v1n) / (m1 + m2);
	return {
		fvx: fly.vx - v1n * nx + v1n2 * nx,
		fvy: fly.vy - v1n * ny + v1n2 * ny,
		hvx: hit.vx - v2n * nx + v2n2 * nx,
		hvy: hit.vy - v2n * ny + v2n2 * ny
	};
};

//#endregion
//#region src/client/pet/motion/geometry.ts
function derivePetMetrics(size) {
	return {
		halfW: size / 2,
		halfH: size * 9 / 16 / 2,
		bottomPad: size * (9 / 16) * (CANVAS_H - FEET_Y) / CANVAS_H,
		sideAllow: HIT_BOX.x0 / 640 * size
	};
}
function centerToBox(center, viewport, half) {
	return {
		x: center.rx * viewport.width - half.w,
		y: center.ry * viewport.height - half.h
	};
}
function boxToRatio(box, viewport, half) {
	return {
		rx: (box.x + half.w) / viewport.width,
		ry: (box.y + half.h) / viewport.height
	};
}
const MIN_REACHABLE_PX = 24;
function clampReachableBox(box, viewport, body) {
	const inset = bodyPixelBox({
		x: 0,
		y: 0,
		size: body.size,
		bottomPad: body.bottomPad
	});
	const minX = MIN_REACHABLE_PX - inset.right;
	const maxX = viewport.width - inset.left - MIN_REACHABLE_PX;
	const minY = MIN_REACHABLE_PX - inset.bottom;
	const maxY = viewport.height - inset.top - MIN_REACHABLE_PX;
	const height = body.size * 9 / 16;
	return {
		x: clampAxis(box.x, minX, maxX, (viewport.width - body.size) / 2),
		y: clampAxis(box.y, minY, maxY, (viewport.height - height) / 2)
	};
}
/**
* 单轴夹取：视口与命中区加起来还容不下两倍下限时区间反向，改为居中，避免夹到错误的一侧。
*
* @param value - 待夹坐标（px）。
* @param lo - 允许下限（px）。
* @param hi - 允许上限（px）。
* @param centered - 区间反向时的居中坐标（px）。
* @returns 夹取后的坐标（px）。
*/
function clampAxis(value, lo, hi, centered) {
	return lo > hi ? centered : Math.min(Math.max(value, lo), hi);
}
function petStageStyle(dragging, bottomPad) {
	return dragging ? { transform: "none" } : { transform: "translateY(" + bottomPad + "px)" };
}
function petRootStyle(customPos, viewport, half) {
	if (!customPos) return {};
	return {
		left: customPos.rx * viewport.width - half.w + "px",
		top: customPos.ry * viewport.height - half.h + "px",
		right: "auto",
		bottom: "auto"
	};
}
const PET_HIT_STYLE = {
	left: HIT_BOX.x0 / 640 * 100 + "%",
	top: HIT_BOX.y0 / 360 * 100 + "%",
	width: (HIT_BOX.x1 - HIT_BOX.x0) / 640 * 100 + "%",
	height: (HIT_BOX.y1 - HIT_BOX.y0) / 360 * 100 + "%"
};

//#endregion
//#region src/client/pet/card/view.ts
/** 两路视频的共同属性：静音、内联播放并自动播放。 */
const VIDEO_PROPS = {
	muted: true,
	playsInline: true,
	autoPlay: true
};
function makeCardView(rt) {
	const { h } = rt;
	return function CardView(props) {
		const sideAllow = HIT_BOX.x0 / 640 * props.size;
		return h("div", {
			ref: props.rootRef,
			className: "dsh-zdd-pet-root",
			"data-corner": props.corner,
			"data-facing": props.facing,
			style: Object.assign({
				"--dsh-zdd-pet-size": props.size + "px",
				"--dsh-zdd-pet-mx": props.marginX - sideAllow + "px",
				"--dsh-zdd-pet-my": props.marginY + "px",
				"--dsh-zdd-pet-font-bubble": props.fontBubblePx + "px",
				"--dsh-zdd-pet-font-tip": props.fontTipPx + "px"
			}, props.rootStyle),
			children: [
				props.bubble,
				h("div", {
					ref: props.stageRef,
					className: "dsh-zdd-pet-stage",
					style: props.stageStyle,
					children: [
						h("video", Object.assign({}, VIDEO_PROPS, {
							ref: props.videoARef,
							className: "dsh-zdd-pet-video is-front"
						})),
						h("video", Object.assign({}, VIDEO_PROPS, {
							ref: props.videoBRef,
							className: "dsh-zdd-pet-video"
						})),
						h("div", {
							className: "dsh-zdd-pet-hit",
							style: PET_HIT_STYLE,
							onClick: props.onClick,
							onPointerDown: props.onPointerDown,
							onPointerMove: props.onPointerMove,
							onPointerUp: props.onPointerUp,
							onPointerCancel: props.onPointerUp,
							onPointerEnter: props.onPointerEnter,
							onPointerLeave: props.onPointerLeave,
							onContextMenu: props.onContextMenu,
							"aria-label": props.name
						})
					]
				}),
				h("div", {
					ref: props.tipRef,
					className: TOOLTIP_CLASS + (props.tipOn ? " is-on" : ""),
					"aria-hidden": "true",
					children: props.tipText ?? props.name
				})
			]
		});
	};
}

//#endregion
//#region src/shared/pickers.ts
const pick = (pool, exclude) => {
	const entries = exclude ? pool.filter((n) => n !== exclude) : pool;
	const src = entries.length ? entries : pool;
	return src[Math.floor(Math.random() * src.length)];
};
const pickSlot = (slot, exclude) => {
	if (typeof slot === "string") return slot;
	const entries = exclude === void 0 ? slot : slot.filter((n) => n !== exclude);
	const src = entries.length ? entries : slot;
	return src[Math.floor(Math.random() * src.length)];
};
const slotIncludes = (slot, anim) => typeof slot === "string" ? slot === anim : slot.includes(anim);
const poolIncludes = (pool, anim) => pool.some((slot) => slotIncludes(slot, anim));
const isEventAnim = (events, anim) => events ? Object.values(events).some((pool) => poolIncludes(pool, anim)) : false;
const nextWorkStatusAnim = (pool, current) => {
	const idx = pool.findIndex((slot$1) => slotIncludes(slot$1, current));
	if (idx === -1) return null;
	const slot = pool[idx];
	if (!Array.isArray(slot) || slot.length <= 1) return null;
	return pickSlot(slot, current);
};
const randomBetween = (min, max) => Math.floor(min + Math.random() * (max - min));
const pickWeightedCategory = (categories, facing) => {
	const cats = categories.filter((c) => c.actions.length > 0);
	if (!cats.length) return null;
	const filtered = cats.filter((c) => !(c.noMirror && facing === "right"));
	const eligible = filtered.length ? filtered : cats;
	const totalW = eligible.reduce((s, c) => s + c.weight, 0) || 1;
	let t = Math.random() * totalW;
	for (const c of eligible) {
		t -= c.weight;
		if (t <= 0) return c;
	}
	return eligible[eligible.length - 1];
};
const rollKind = (roll, w, opts) => {
	const turn = opts?.fixed ? 0 : w.turn;
	const move = opts?.fixed ? 0 : w.move;
	const topEnd = (w.idle + turn + move) / 100;
	if (roll < w.idle / 100) return "idle";
	if (roll < (w.idle + turn) / 100) return "turn";
	if (roll < topEnd) return "move";
	return "action";
};
const pickCategoryAction = (categories, idlePool, facing, current) => {
	const cat = pickWeightedCategory(categories, facing);
	if (!cat) return {
		id: "FALLBACK",
		name: pick(idlePool, current)
	};
	return {
		id: cat.id,
		name: pick(cat.actions, current)
	};
};

//#endregion
//#region src/shared/balance/tone.ts
const QUOTA_WARN_PERCENT = 70;
const QUOTA_CRIT_PERCENT = 90;
function quotaTone(percent) {
	if (percent >= QUOTA_CRIT_PERCENT) return "crit";
	if (percent >= QUOTA_WARN_PERCENT) return "warn";
	return "ok";
}

//#endregion
//#region src/shared/balance/parse.ts
const CUSTOM_TAGS = [
	"div",
	"span",
	"i",
	"b",
	"strong",
	"em",
	"img"
];
const CUSTOM_STYLE_KEYS = new Set([
	"display",
	"flex",
	"flexDirection",
	"flexWrap",
	"alignItems",
	"justifyContent",
	"gap",
	"margin",
	"marginTop",
	"marginRight",
	"marginBottom",
	"marginLeft",
	"padding",
	"paddingTop",
	"paddingRight",
	"paddingBottom",
	"paddingLeft",
	"width",
	"height",
	"minWidth",
	"maxWidth",
	"minHeight",
	"maxHeight",
	"color",
	"fontSize",
	"fontWeight",
	"fontStyle",
	"lineHeight",
	"letterSpacing",
	"textAlign",
	"textDecoration",
	"whiteSpace",
	"verticalAlign",
	"fontVariantNumeric",
	"background",
	"backgroundColor",
	"border",
	"borderTop",
	"borderBottom",
	"borderLeft",
	"borderRight",
	"borderRadius",
	"overflow",
	"opacity"
]);
/** 样式值里一律禁止的片段：外部资源、表达式、注释截断。要图请用 `img` 节点（地址另有限制）。 */
const BANNED_STYLE_VALUE = /url\(|expression|javascript:|vbscript:|@import|\\|\/\*/i;
const CUSTOM_LIMITS = {
	maxDepth: 6,
	maxNodes: 200,
	maxChildren: 24,
	maxText: 120,
	maxStyleValue: 64,
	maxSrc: 512,
	maxViews: 4
};
/**
* 递归解析并校验一个节点，把外部输入转成视图树。
*
* 任一节点不合法即整树返回 null：部分渲染会得到一棵缺了一块的气泡，比这一拍不显示更误导人；
* 单个样式属性非法只丢那一条，不值得为此整树作废。
*
* @param raw - 外部节点；类型未知，逐层校验后才进入视图树。
* @param depth - 当前深度，根为 0。
* @param budget - 全树节点计数，跨递归共享。
* @returns 合法节点；不合法返回 null，调用方据此跳过这一拍。
*/
function parseCustomNode(raw, depth, budget) {
	if (!raw || typeof raw !== "object") return null;
	if (depth >= CUSTOM_LIMITS.maxDepth) return null;
	budget.nodes += 1;
	if (budget.nodes > CUSTOM_LIMITS.maxNodes) return null;
	const n = raw;
	const tag = typeof n.tag === "string" ? n.tag : "";
	if (!CUSTOM_TAGS.includes(tag)) return null;
	const node = { tag };
	if (typeof n.text === "string" && n.text.length > 0) node.text = n.text.slice(0, CUSTOM_LIMITS.maxText);
	if (tag === "img") {
		const src = typeof n.src === "string" ? n.src.trim() : "";
		if (!/^https?:\/\//i.test(src) || src.length > CUSTOM_LIMITS.maxSrc) return null;
		node.src = src;
	}
	if (n.style && typeof n.style === "object" && !Array.isArray(n.style)) {
		const style = {};
		for (const [k, v] of Object.entries(n.style)) {
			if (!CUSTOM_STYLE_KEYS.has(k)) continue;
			if (typeof v !== "string") continue;
			const value = v.trim();
			if (value === "" || value.length > CUSTOM_LIMITS.maxStyleValue) continue;
			if (BANNED_STYLE_VALUE.test(value)) continue;
			style[k] = value;
		}
		if (Object.keys(style).length > 0) node.style = style;
	}
	if (Array.isArray(n.children)) {
		if (n.children.length > CUSTOM_LIMITS.maxChildren) return null;
		const children = [];
		for (const child of n.children) {
			const parsed = parseCustomNode(child, depth + 1, budget);
			if (parsed === null) return null;
			children.push(parsed);
		}
		if (children.length > 0) node.children = children;
	}
	return node;
}
/** 可选数字：缺省返回 undefined，出现但非法返回 null，调用方据此跳过这一拍而不是把坏数字送进展示层。 */
function optNum(value) {
	if (value === void 0 || value === null) return void 0;
	const n = Number(value);
	return Number.isFinite(n) ? n : null;
}
function toBalanceState(raw) {
	if (!raw || typeof raw !== "object") return null;
	const r = raw;
	const provider = String(r.provider ?? "unknown");
	if (r.ok !== true) {
		const reason = r.reason === "unsupported" || r.reason === "credential-missing" || r.reason === "fetch-error" ? r.reason : "fetch-error";
		return {
			provider,
			ok: false,
			reason,
			message: typeof r.message === "string" ? r.message : void 0
		};
	}
	const d = r.data;
	if (!d || typeof d !== "object") return null;
	if (r.shape === "windows") {
		const monthly = optNum(d.monthly);
		const rolling = optNum(d.rolling);
		const weekly = optNum(d.weekly);
		const rollingCapUsd = optNum(d.rollingCapUsd);
		const weeklyCapUsd = optNum(d.weeklyCapUsd);
		const monthlyCapUsd = optNum(d.monthlyCapUsd);
		if (monthly === void 0 || monthly === null) return null;
		if (rolling === null || weekly === null || rollingCapUsd === null || weeklyCapUsd === null || monthlyCapUsd === null) return null;
		return {
			provider,
			shape: "windows",
			ok: true,
			rolling,
			weekly,
			monthly,
			rollingCapUsd,
			weeklyCapUsd,
			monthlyCapUsd,
			rollingLabel: typeof d.rollingLabel === "string" && d.rollingLabel.length > 0 ? d.rollingLabel : void 0,
			rollingResetsAt: typeof d.rollingResetsAt === "string" ? d.rollingResetsAt : void 0,
			weeklyResetsAt: typeof d.weeklyResetsAt === "string" ? d.weeklyResetsAt : void 0,
			monthlyResetsAt: typeof d.monthlyResetsAt === "string" ? d.monthlyResetsAt : void 0
		};
	}
	if (r.shape === "money") {
		const raw$1 = Array.isArray(d.wallets) ? d.wallets : [];
		const wallets = [];
		for (const item of raw$1) {
			if (!item || typeof item !== "object") continue;
			const w = item;
			if (typeof w.currency !== "string" || w.currency.length === 0) continue;
			if (typeof w.total !== "string" || w.total.length === 0) continue;
			wallets.push({
				currency: w.currency,
				total: w.total,
				granted: typeof w.granted === "string" && w.granted.length > 0 ? w.granted : "0.00",
				toppedUp: typeof w.toppedUp === "string" && w.toppedUp.length > 0 ? w.toppedUp : "0.00",
				fullBalance: typeof w.fullBalance === "string" && w.fullBalance.length > 0 ? w.fullBalance : void 0
			});
		}
		if (wallets.length === 0) return null;
		return {
			provider,
			shape: "money",
			ok: true,
			wallets,
			tier: d.tier === "peak" || d.tier === "idle" ? d.tier : void 0
		};
	}
	if (r.shape === "points") {
		if (typeof d.unit !== "string" || d.unit.length === 0) return null;
		if (typeof d.total !== "string" || d.total.length === 0) return null;
		return {
			provider,
			shape: "points",
			ok: true,
			points: {
				unit: d.unit,
				total: d.total,
				full: typeof d.full === "string" && d.full.length > 0 ? d.full : void 0
			}
		};
	}
	if (r.shape === "custom") {
		let views = [];
		if (Array.isArray(d.views) && d.views.length > 0) {
			if (d.views.length > CUSTOM_LIMITS.maxViews) return null;
			for (const raw$1 of d.views) {
				const page = parseCustomNode(raw$1, 0, { nodes: 0 });
				if (!page) return null;
				views.push(page);
			}
		} else {
			const rows = parseCustomNode(d.rows, 0, { nodes: 0 });
			if (!rows) return null;
			views = [rows];
			if (d.detailRows !== void 0) {
				const detail = parseCustomNode(d.detailRows, 0, { nodes: 0 });
				if (!detail) return null;
				views.push(detail);
			}
		}
		const pct = typeof d.percent === "number" && Number.isFinite(d.percent) ? Math.max(0, Math.min(100, d.percent)) : void 0;
		return {
			provider,
			shape: "custom",
			ok: true,
			custom: {
				views,
				percent: pct
			}
		};
	}
	return null;
}

//#endregion
//#region src/shared/balance/handlers/custom.ts
const customHandler = {
	percent: (v) => v.custom?.percent,
	rows: () => [],
	detail: () => [],
	views: (v) => v.custom?.views
};

//#endregion
//#region src/shared/balance/handlers/money.ts
/**
* 各币种按自己的基准算剩余比例，相加后折算成已用百分比。
*
* 没有基准的币种跳过，不替它猜一个；一个带基准的币种都没有则返回 undefined，不播档位动画。
*/
function moneyPercent(v) {
	let remaining = 0;
	let based = 0;
	for (const w of v.wallets ?? []) {
		const total = Number(w.total);
		const full = Number(w.fullBalance);
		if (!Number.isFinite(total) || !Number.isFinite(full) || full <= 0) continue;
		remaining += total / full;
		based++;
	}
	if (based === 0) return void 0;
	return Math.max(0, Math.min(100, 100 - remaining * 100));
}
/**
* 一行「余额（峰/谷）¥x.xx」。
*
* 只显示 total 非 0 的币种：负数要显示（透支是真的欠钱），正好 0 的不占地方；CNY 优先，
* 用符号拼接、以「/」分隔；全为 0 时兜底 ¥0.00，否则气泡会空一行。档位装饰只有提供该计价
* 规则的服务商才有，没有就不加括号那一段。
*/
function moneyRows(v) {
	const visible = (v.wallets ?? []).filter((w) => Number(w.total) !== 0).sort((a, b) => (a.currency === "CNY" ? 0 : 1) - (b.currency === "CNY" ? 0 : 1));
	const amount = visible.length > 0 ? visible.map((w) => (w.currency === "USD" ? "$" : "¥") + w.total).join("/") : "¥0.00";
	if (!v.tier) return [{
		role: "label",
		text: "余额 " + amount
	}];
	return [
		{
			role: "label",
			text: "余额（"
		},
		{
			role: "tier",
			tier: v.tier,
			text: v.tier === "peak" ? "峰" : "谷"
		},
		{
			role: "label",
			text: "）" + amount
		}
	];
}
const moneyHandler = {
	percent: moneyPercent,
	rows: moneyRows
};

//#endregion
//#region src/shared/balance/handlers/points.ts
/**
* 与 money 同一套「按基准折算」的数学，数据来自 points 而非 wallets。
*
* 没有基准或基准非法则返回 undefined，不播档位动画，也不替服务商猜一个。
*/
function pointsPercent(v) {
	const total = Number(v.points?.total);
	const full = Number(v.points?.full);
	if (!Number.isFinite(total) || !Number.isFinite(full) || full <= 0) return void 0;
	return Math.max(0, Math.min(100, 100 - total / full * 100));
}
/**
* 一行「余额 800 积分」。
*
* 单位是数据带出的后缀，绝不套货币符号——$/¥ 那套判断只属于 money；0 也照常显示，0 积分是真实读数。
*/
function pointsRows(v) {
	const p = v.points;
	if (!p) return [{
		role: "label",
		text: "积分数据不可用"
	}];
	return [{
		role: "label",
		text: "余额 " + p.total + " " + p.unit
	}];
}
const pointsHandler = {
	percent: pointsPercent,
	rows: pointsRows
};

//#endregion
//#region src/shared/balance/handlers/windows.ts
const WINDOW_LABELS = {
	weekly: "周",
	monthly: "月"
};
const DEFAULT_ROLLING_LABEL = "5h";
/** 取窗口展示名：滚动窗用服务商自报值，周与月走固定表 */
function windowLabel(v, w) {
	if (w === "rolling") return v.rollingLabel ?? DEFAULT_ROLLING_LABEL;
	return WINDOW_LABELS[w];
}
/** 各窗口的满额度，全部来自数据 */
function windowQuotas(v) {
	return {
		rolling: v.rollingCapUsd,
		weekly: v.weeklyCapUsd,
		monthly: v.monthlyCapUsd
	};
}
function urgentWindow(v) {
	if (v.shape !== "windows") return void 0;
	const quotas = windowQuotas(v);
	const resets = {
		rolling: v.rollingResetsAt,
		weekly: v.weeklyResetsAt,
		monthly: v.monthlyResetsAt
	};
	const present = [
		"rolling",
		"weekly",
		"monthly"
	].filter((w) => v[w] !== void 0);
	if (present.length === 0) return void 0;
	const allQuotas = present.every((w) => {
		const quota = quotas[w];
		return quota !== void 0 && quota > 0;
	});
	let best;
	for (const w of present) {
		const percent = v[w] ?? 0;
		const quota = quotas[w];
		const cand = {
			label: windowLabel(v, w),
			percent,
			quotaUsd: quota,
			remainingUsd: allQuotas && quota !== void 0 ? quota * (100 - percent) / 100 : void 0,
			resetsAt: resets[w]
		};
		if (best === void 0) {
			best = cand;
			continue;
		}
		const moreUrgent = allQuotas ? (cand.remainingUsd ?? 0) < (best.remainingUsd ?? 0) : cand.percent > best.percent;
		if (moreUrgent) best = cand;
	}
	return best;
}
function resetInText(iso) {
	if (!iso) return "";
	const t = new Date(iso).getTime();
	if (!Number.isFinite(t)) return "";
	const delta = t - Date.now();
	if (delta <= 0) return "已重置";
	const hoursF = delta / 36e5;
	if (hoursF >= 96) return (Math.round(hoursF / 24 * 10) / 10).toFixed(1) + " 天";
	return Math.max(.1, Math.round(hoursF * 10) / 10).toFixed(1) + " 小时";
}
/** 三窗口取最大值，只有月窗口时就是它本身 */
function windowsPercent(v) {
	return Math.max(v.rolling ?? 0, v.weekly ?? 0, v.monthly ?? 0);
}
/** 把 resetInText 的三种返回翻成一句提示：空串 = 时间未知，'已重置' = 已经过点，其余 = 倒计时。 */
function resetPhrase(reset) {
	if (reset === "") return "重置时间未知";
	return reset === "已重置" ? reset : reset + "重置";
}
/** 两行：最紧迫窗口的已用百分比与重置倒计时 */
function windowsRows(v) {
	const w = urgentWindow(v);
	if (!w) return [{
		role: "label",
		text: "额度数据不可用"
	}];
	const reset = resetInText(w.resetsAt);
	return [{
		role: "label",
		text: w.label + "额度已用 " + Math.round(w.percent) + "%"
	}, {
		role: "sub",
		text: resetPhrase(reset)
	}];
}
/**
* 展开态每个存在的窗口一行：窗口名、进度条、已用百分比与重置倒计时。
*
* 只列存在的窗口，rolling 与 weekly 缺省表示该服务商没有这个窗口，不补 0、不画空条。
*/
function windowsDetail(v) {
	const resets = {
		rolling: v.rollingResetsAt,
		weekly: v.weeklyResetsAt,
		monthly: v.monthlyResetsAt
	};
	const rows = [];
	for (const w of [
		"rolling",
		"weekly",
		"monthly"
	]) {
		const percent = v[w];
		if (percent === void 0) continue;
		const reset = resetInText(resets[w]);
		const usedText = Math.round(percent) + "%";
		const resetText = resetPhrase(reset);
		rows.push({
			role: "quota",
			text: windowLabel(v, w) + " " + usedText + " " + resetText,
			label: windowLabel(v, w),
			percent,
			tone: quotaTone(percent),
			usedText,
			resetText
		});
	}
	return rows.length > 0 ? rows : windowsRows(v);
}
const windowsHandler = {
	percent: windowsPercent,
	rows: windowsRows,
	detail: windowsDetail
};

//#endregion
//#region src/shared/balance/handlers/index.ts
const HANDLERS = {
	windows: windowsHandler,
	money: moneyHandler,
	points: pointsHandler,
	custom: customHandler
};

//#endregion
//#region src/shared/balance/percent.ts
function balancePercent(v) {
	return HANDLERS[v.shape].percent(v);
}
function balanceEventIndex(p) {
	if (p === 100) return 5;
	const i = Math.floor(p / 20);
	return i < 5 ? i : 4;
}

//#endregion
//#region src/shared/balance/view.ts
/**
* 不可用状态的气泡行：显式给出原因，绝不伪造数字。
*
* 次要行为空的会被剔除——空 div 在气泡里会白占一行高度。
*/
function unavailableRows(state) {
	const rows = state.reason === "unsupported" ? [{
		role: "error",
		text: "当前服务商暂不支持余额查询"
	}, {
		role: "sub",
		text: "当前服务商：" + state.provider
	}] : state.reason === "credential-missing" ? [{
		role: "error",
		text: "缺少余额查询凭证"
	}, {
		role: "sub",
		text: state.message ?? ""
	}] : [{
		role: "error",
		text: "余额查询失败"
	}, {
		role: "sub",
		text: state.message ?? ""
	}];
	return rows.filter((r) => r.role !== "quota" && r.text !== "");
}
function balanceBubbleView(state) {
	if (!state.ok) return unavailableRows(state);
	return HANDLERS[state.shape].rows(state);
}
function balanceDetailView(state) {
	if (!state.ok) return unavailableRows(state);
	const handler = HANDLERS[state.shape];
	return handler.detail ? handler.detail(state) : handler.rows(state);
}
function customViews(state) {
	if (!state.ok || state.shape !== "custom") return void 0;
	const views = HANDLERS[state.shape].views?.(state);
	return views && views.length > 0 ? views : void 0;
}
function customClickable(state) {
	return (customViews(state)?.length ?? 0) > 1;
}

//#endregion
//#region src/shared/balance/notice.ts
function decideBalanceNotice(state, lastKey, explicit) {
	if (state.ok) return {
		show: false,
		key: null
	};
	const key = state.reason + ":" + state.provider;
	return {
		show: explicit || key !== lastKey,
		key
	};
}

//#endregion
//#region src/shared/work-status.ts
const WORK_STATUS_STATES = [
	"thinking",
	"working",
	"result",
	"waiting",
	"success",
	"error"
];
const WORK_STATUS_INDEX = {
	thinking: 0,
	working: 1,
	result: 2,
	waiting: 3,
	success: 4,
	error: 5
};
function toWorkStatus(raw) {
	if (!raw || typeof raw !== "object") return null;
	const r = raw;
	const state = r.state === null || typeof r.state === "string" && WORK_STATUS_STATES.includes(r.state) ? r.state : null;
	const p = r.progress;
	const done = Number(p?.done);
	const total = Number(p?.total);
	const progress = p && typeof p === "object" && Number.isInteger(done) && Number.isInteger(total) && total > 0 && done >= 0 ? {
		done: Math.min(done, total),
		total
	} : null;
	return {
		state,
		task: typeof r.task === "string" ? r.task : null,
		progress
	};
}
function hasTask(ws) {
	return Boolean(ws && ((ws.task ?? null) !== null || (ws.progress ?? null) !== null));
}
const PROGRESS_BAR_MAX_SLOTS = 10;
function progressBar(ws) {
	const p = ws?.progress ?? null;
	if (!p || p.total <= 0) return null;
	const slots = Math.min(p.total, PROGRESS_BAR_MAX_SLOTS);
	const filled = Math.max(0, Math.min(slots, Math.round(p.done / p.total * slots)));
	return "▰".repeat(filled) + "▱".repeat(slots - filled);
}
function progressText(ws) {
	const bar = progressBar(ws);
	const p = ws?.progress ?? null;
	if (!bar || !p) return null;
	return `${bar}  ${p.done}/${p.total}`;
}

//#endregion
//#region src/shared/state.ts
/** 叶子规范化：形状不对（非对象或 counter 非数字）→ null，不让脏数据进渲染层。 */
function normLeaf(value) {
	if (!value || typeof value !== "object") return null;
	const leaf$1 = value;
	if (typeof leaf$1.counter !== "number" || !Number.isFinite(leaf$1.counter)) return null;
	return {
		counter: leaf$1.counter,
		data: leaf$1.data ?? null
	};
}
async function fetchState(baseUrl = ROUTE_PATH + "/state", wait) {
	try {
		const url = wait ? `${baseUrl}?since=${wait.since}&timeout=${wait.timeoutMs}` : baseUrl;
		const res = await fetch(url, { cache: "no-store" });
		if (!res.ok) return null;
		const raw = await res.json().catch(() => null);
		if (!raw || typeof raw !== "object" || raw.ok === false) return null;
		const sections = {};
		const rawSections = raw.sections && typeof raw.sections === "object" ? raw.sections : {};
		for (const [name, value] of Object.entries(rawSections)) {
			const leaf$1 = normLeaf(value);
			if (leaf$1) sections[name] = leaf$1;
		}
		const pets = {};
		const rawPets = raw.pets && typeof raw.pets === "object" ? raw.pets : {};
		for (const [petId, entry] of Object.entries(rawPets)) {
			if (!entry || typeof entry !== "object") continue;
			const leaves = {};
			for (const [name, value] of Object.entries(entry)) {
				const leaf$1 = normLeaf(value);
				if (leaf$1) leaves[name] = leaf$1;
			}
			pets[petId] = leaves;
		}
		return {
			counter: typeof raw.counter === "number" && Number.isFinite(raw.counter) ? raw.counter : void 0,
			sections,
			pets
		};
	} catch {
		return null;
	}
}
/** 遍历 S 的所有叶子（sections 在前、pets 在后）。 */
function* walkLeaves(s) {
	for (const [name, leaf$1] of Object.entries(s.sections ?? {})) yield ["sections." + name, leaf$1];
	for (const [petId, leaves] of Object.entries(s.pets ?? {})) for (const [name, leaf$1] of Object.entries(leaves ?? {})) yield ["pets." + petId + "." + name, leaf$1];
}
function flattenCounters(s) {
	const out = {};
	for (const [path, leaf$1] of walkLeaves(s)) out[path] = leaf$1.counter;
	return out;
}
function takeChanged(s, baseline) {
	const out = [];
	for (const [path, leaf$1] of walkLeaves(s)) {
		if (baseline[path] === leaf$1.counter) continue;
		baseline[path] = leaf$1.counter;
		out.push({
			path,
			leaf: leaf$1
		});
	}
	return out;
}
/** 分段叶子名的全集；新增 section 叶子时与 {@link SectionLeafName} 一起改。 */
const SECTION_LEAF_NAMES = [
	"config",
	"balance",
	"workStatus",
	"notify",
	"menu"
];
/** 宠物叶子名的全集；新增宠物叶子时与 {@link PetLeafName} 一起改。 */
const PET_LEAF_NAMES = [
	"say",
	"anim",
	"position",
	"throw",
	"lock"
];
/** 把字符串收窄成分段叶子名。 */
function isSectionLeafName(name) {
	return SECTION_LEAF_NAMES.includes(name);
}
/** 把字符串收窄成宠物叶子名。 */
function isPetLeafName(name) {
	return PET_LEAF_NAMES.includes(name);
}
function resolveLeafPath(path) {
	if (path.startsWith("sections.")) {
		const name$1 = path.slice(9);
		return isSectionLeafName(name$1) ? {
			where: "section",
			name: name$1
		} : null;
	}
	if (!path.startsWith("pets.")) return null;
	const rest = path.slice(5);
	const dot = rest.lastIndexOf(".");
	if (dot <= 0) return null;
	const name = rest.slice(dot + 1);
	return isPetLeafName(name) ? {
		where: "pet",
		name,
		petId: rest.slice(0, dot)
	} : null;
}
function readBalance(leaf$1) {
	const state = toBalanceState(leaf$1.data);
	if (!state) return null;
	const manual = leaf$1.data.manual === true;
	return {
		state,
		manual
	};
}
function readSay(leaf$1) {
	if (!leaf$1.data || typeof leaf$1.data !== "object") return null;
	const d = leaf$1.data;
	if (d.clear === true) return { kind: "clear" };
	if (typeof d.text !== "string" || !d.text) return null;
	return {
		kind: "say",
		text: d.text,
		image: typeof d.image === "string" ? d.image : void 0,
		url: typeof d.url === "string" ? d.url : void 0,
		duration: typeof d.duration === "number" && Number.isFinite(d.duration) && d.duration >= 0 ? d.duration : void 0,
		anim: typeof d.anim === "boolean" ? d.anim : void 0,
		hold: typeof d.hold === "boolean" ? d.hold : void 0
	};
}
function readWorkStatus(leaf$1) {
	return toWorkStatus(leaf$1.data);
}
function readAnim(leaf$1) {
	if (!leaf$1.data || typeof leaf$1.data !== "object") return null;
	const d = leaf$1.data;
	const name = typeof d.name === "string" && d.name ? d.name : void 0;
	const url = typeof d.url === "string" && d.url ? d.url : void 0;
	if (name === void 0 && url === void 0) return null;
	return {
		name,
		url,
		playbackId: typeof d.playbackId === "string" && d.playbackId ? d.playbackId : void 0,
		facing: d.facing === "left" || d.facing === "right" ? d.facing : void 0
	};
}
function readLock(leaf$1) {
	if (!leaf$1.data || typeof leaf$1.data !== "object") return null;
	const d = leaf$1.data;
	if (d.locked === false) return { locked: false };
	if (d.locked !== true) return null;
	if (typeof d.expiresAt !== "number" || !Number.isFinite(d.expiresAt)) return null;
	return {
		locked: true,
		expiresAt: d.expiresAt
	};
}
function readPosition(leaf$1) {
	if (!leaf$1.data || typeof leaf$1.data !== "object") return null;
	const d = leaf$1.data;
	if (typeof d.x !== "number" || !Number.isFinite(d.x)) return null;
	if (typeof d.y !== "number" || !Number.isFinite(d.y)) return null;
	if (d.mode !== "instant" && d.mode !== "spring" && d.mode !== "line") return null;
	if (d.mode === "line") {
		if (typeof d.duration !== "number" || !Number.isFinite(d.duration) || d.duration < 0) return null;
		return {
			x: d.x,
			y: d.y,
			mode: "line",
			duration: d.duration
		};
	}
	return {
		x: d.x,
		y: d.y,
		mode: d.mode,
		duration: 0
	};
}
function readThrow(leaf$1) {
	if (!leaf$1.data || typeof leaf$1.data !== "object") return null;
	const d = leaf$1.data;
	if (typeof d.angle !== "number" || !Number.isFinite(d.angle)) return null;
	if (typeof d.power !== "number" || !Number.isFinite(d.power) || d.power <= 0) return null;
	return {
		angle: d.angle,
		power: d.power
	};
}
async function postAction(baseUrl, body) {
	try {
		const res = await fetch(baseUrl, {
			method: "POST",
			...body === void 0 ? {} : {
				headers: { "content-type": "application/json" },
				body: JSON.stringify(body)
			}
		});
		if (!res.ok) return false;
		const data = await res.json().catch(() => null);
		return data?.ok === true;
	} catch {
		return false;
	}
}

//#endregion
//#region src/shared/fonts.ts
const FONT_PRESETS = [
	{
		id: "candy",
		stack: "\"ShangshouSoftCandy\",\"Yuanti SC\",\"YouYuan\",\"幼圆\",\"Comic Sans MS\",\"PingFang SC\",\"Microsoft YaHei\",sans-serif"
	},
	{
		id: "yahei",
		stack: "\"Microsoft YaHei\",\"PingFang SC\",sans-serif"
	},
	{
		id: "youyuan",
		stack: "\"YouYuan\",\"Yuanti SC\",sans-serif"
	},
	{
		id: "kaiti",
		stack: "\"KaiTi\",\"STKaiti\",serif"
	},
	{
		id: "simsun",
		stack: "\"SimSun\",\"Songti SC\",serif"
	},
	{
		id: "comic",
		stack: "\"Comic Sans MS\",\"Comic Sans\",cursive"
	},
	{
		id: "system",
		stack: "system-ui,sans-serif"
	}
];
const FONT_SIZE_MIN = 4;
const FONT_SIZE_MAX = 200;
const DEFAULT_FONT = {
	family: "candy",
	size: 21,
	followPet: true
};
function fontStackOf(id) {
	return (FONT_PRESETS.find((p) => p.id === id) ?? FONT_PRESETS[0]).stack;
}
const FONT_REF_SIZE = 462;
const BUBBLE_FONT_BASE_PX = .0455 * FONT_REF_SIZE;
const TIP_FONT_BASE_PX = .026 * FONT_REF_SIZE;
function resolveFontPx(font, size) {
	const own = Number(font?.size);
	const ratio = Number.isFinite(own) && own > 0 ? own / DEFAULT_FONT.size : 1;
	const w = Number(size);
	const follow = font?.followPet !== false;
	const scale = follow && Number.isFinite(w) && w > 0 ? w / FONT_REF_SIZE : 1;
	return {
		bubble: BUBBLE_FONT_BASE_PX * ratio * scale,
		tip: TIP_FONT_BASE_PX * ratio * scale
	};
}

//#endregion
//#region src/shared/whisper.ts
function whisperBubbleView(state) {
	if (state.ok) return [{
		role: "label",
		text: state.text
	}];
	const msg = state.reason === "provider-missing" ? "当前对话未配置模型，碎碎念不可用" : "碎碎念生成失败" + (state.message ? "：" + state.message : "");
	return [{
		role: "label",
		text: msg
	}];
}
function memeImageUrl(name, base = ROUTE_PATH, assetRoot = "") {
	const root = String(assetRoot ?? "").trim();
	const prefix = root ? "/pic/memes/" + encodeURIComponent(root) : "/pic/memes";
	return base + prefix + "/" + encodeURIComponent(name) + ".png";
}
const MEME_IMG_CLASS = "pet-bub-img";
const MEME_BUBBLE_CLASS = "has-img";
const MEME_BUBBLE_CSS = [".pet-bub-img{--m:var(--f,calc(var(--dsh-zdd-pet-size,var(--pet-size,462px))*0.0455));display:block;width:calc(var(--m)*7.4725);max-width:100%;height:auto;border-radius:calc(var(--m)*0.5714);margin:0 auto calc(var(--m)*0.3736);object-fit:cover;pointer-events:none;user-select:none}", ".pet-bubble.has-img,.dsh-zdd-pet-bubble.has-img{min-width:0}"].join("");
/** 只注入一次（页面已有同一标记则跳过）。 */
let memeCssInjected = false;
function injectMemeBubbleCss() {
	if (memeCssInjected || typeof document === "undefined") return;
	memeCssInjected = true;
	if (document.querySelector("style[data-plugin-css=\"dsh-zdd-pet/meme-bubble\"]") !== null) return;
	const tag = document.createElement("style");
	tag.dataset.plugin = "dsh-zdd-pet";
	tag.dataset.pluginCss = "dsh-zdd-pet/meme-bubble";
	tag.textContent = MEME_BUBBLE_CSS;
	document.head.appendChild(tag);
}

//#endregion
//#region src/client/bubble.ts
/** 气泡内联样式：白色半透明圆泡加底部小尾巴，盒子尺寸锚字号 `--f`，位置锚宠物尺寸。
*  width:max-content 不可省：left:50% 的绝对定位盒可用宽度只有包含块一半，shrink-to-fit
*  会先被卡死；先按内容取宽，再由 max-width 收口。box-sizing 钉死 content-box，避免宿主
*  全局 border-box 把内边距算进宽度；断词用 break-word，数字与单位不会被拆行。
*/
const bubbleCss = [
	`@font-face{font-family:"ShangshouSoftCandy";src:url("${ROUTE_PATH}/font/上首软糖体.ttf") format("truetype");font-display:swap;font-weight:400}`,
	".dsh-zdd-pet-bubble{position:absolute;left:50%;transform:translateX(-50%);bottom:calc(100% - var(--dsh-zdd-pet-size)*0.108);width:max-content;min-width:calc(var(--f)*5.7143);max-width:min(calc(var(--f)*16),100%);box-sizing:content-box;padding:calc(var(--f)*0.4835) calc(var(--f)*0.6593);border-radius:calc(var(--f)*0.7692);background:rgba(255,255,255,.92);--f0:var(--dsh-zdd-pet-font-bubble,calc(var(--dsh-zdd-pet-size)*0.0455));--f:var(--f0);color:#2b2b2b;font-family:var(--dsh-zdd-pet-font-family,\"ShangshouSoftCandy\",\"Yuanti SC\",\"YouYuan\",\"幼圆\",\"Comic Sans MS\",\"PingFang SC\",\"Microsoft YaHei\",sans-serif);font-size:var(--f);line-height:1.6;z-index:3;pointer-events:none;box-shadow:0 calc(var(--f)*0.1978) calc(var(--f)*0.7692) rgba(0,0,0,.14),0 1px 3px rgba(0,0,0,.08);backdrop-filter:blur(6px);opacity:0;transition:opacity .25s ease;white-space:normal;overflow-wrap:break-word}",
	".dsh-zdd-pet-bubble::after{content:\"\";position:absolute;left:50%;bottom:calc(var(--f)*-0.3736);transform:translateX(-50%);border:calc(var(--f)*0.3736) solid transparent;border-top-color:rgba(255,255,255,.92);border-bottom:none}",
	".dsh-zdd-pet-bubble.is-on{opacity:1}",
	".dsh-zdd-pet-bubble.dsh-zdd-pet-whisper{font-size:calc(var(--f)*0.7473);min-width:calc(var(--f)*2.1978);max-width:min(calc(var(--f)*10.989),100%)}",
	".dsh-zdd-pet-bubble .pet-bub-title{font-size:calc(var(--f)*0.7692);color:rgba(43,43,43,.6);margin-bottom:calc(var(--f)*0.1978)}",
	".dsh-zdd-pet-bubble .pet-bub-row{display:flex;justify-content:space-between;gap:calc(var(--f)*0.6593);flex-wrap:wrap}",
	".dsh-zdd-pet-bubble .pet-bub-row>span{white-space:nowrap}",
	".dsh-zdd-pet-bubble .pet-bub-sub{font-size:calc(var(--f)*0.7692);color:rgba(43,43,43,.6)}",
	".dsh-zdd-pet-bubble .pet-bub-val{font-variant-numeric:tabular-nums;font-weight:650;color:#1f1f1f}",
	".dsh-zdd-pet-bubble .pet-bub-err{color:#d94f3d;font-size:calc(var(--f)*0.7692)}",
	".dsh-zdd-pet-bubble .pet-bub-tag{margin-left:calc(var(--f)*0.2857);font-size:calc(var(--f)*0.4835);color:rgba(43,43,43,.55);border:1px solid rgba(43,43,43,.25);border-radius:calc(var(--f)*0.2857);padding:0 calc(var(--f)*0.1978);vertical-align:1px}",
	".dsh-zdd-pet-bubble .pet-bub-tier{font-weight:700}",
	".dsh-zdd-pet-bubble .pet-bub-tier-peak{color:#e53935}",
	".dsh-zdd-pet-bubble .pet-bub-tier-idle{color:#2e9e4f}",
	".dsh-zdd-pet-bubble.is-clickable{pointer-events:auto;cursor:pointer}",
	".dsh-zdd-pet-bubble.is-expanded{--f:calc(var(--f0)*0.6);width:min(calc(var(--f)*21),100%);max-width:100%}",
	".dsh-zdd-pet-bubble.is-on.is-fading{opacity:0}",
	".dsh-zdd-pet-bubble .pet-bub-quota{display:flex;align-items:center;gap:calc(var(--f)*0.4);margin:calc(var(--f)*0.13) 0}",
	".dsh-zdd-pet-bubble .pet-bub-quota-label{flex:none;min-width:calc(var(--f)*1.9);font-size:calc(var(--f)*0.7692);color:rgba(43,43,43,.6)}",
	".dsh-zdd-pet-bubble .pet-bub-quota-bar{flex:1 1 auto;height:calc(var(--f)*0.5);border-radius:calc(var(--f)*0.25);background:rgba(43,43,43,.12);overflow:hidden}",
	".dsh-zdd-pet-bubble .pet-bub-quota-fill{display:block;height:100%;border-radius:inherit;background:#2e9e4f}",
	".dsh-zdd-pet-bubble .pet-bub-quota-fill.pet-bub-quota-warn{background:#e8952f}",
	".dsh-zdd-pet-bubble .pet-bub-quota-fill.pet-bub-quota-crit{background:#e53935}",
	".dsh-zdd-pet-bubble .pet-bub-quota-used{flex:none;min-width:calc(var(--f)*2.2);text-align:right;font-variant-numeric:tabular-nums;font-weight:650;color:#1f1f1f}",
	".dsh-zdd-pet-bubble .pet-bub-quota-reset{flex:none;min-width:calc(var(--f)*2.6);text-align:right;font-size:calc(var(--f)*0.7692);color:rgba(43,43,43,.6)}",
	".dsh-zdd-pet-bubble .pet-bub-prog{font-size:calc(var(--f)*0.7692);font-weight:700;color:rgba(43,43,43,.55);margin-top:calc(var(--f)*0.13);font-variant-numeric:tabular-nums;letter-spacing:calc(var(--f)*0.03)}",
	".dsh-zdd-pet-root[data-corner=\"top-left\"] .dsh-zdd-pet-bubble{left:calc(100% - var(--dsh-zdd-pet-size)*0.3125);right:auto;bottom:auto;top:50%;transform:translateY(-50%);margin-left:calc(var(--f)*0.3736)}",
	".dsh-zdd-pet-root[data-corner=\"top-left\"] .dsh-zdd-pet-bubble::after{left:calc(var(--f)*-0.3736);right:auto;top:50%;bottom:auto;transform:translateY(-50%);border:calc(var(--f)*0.3736) solid transparent;border-right-color:rgba(255,255,255,.92);border-left:none}",
	".dsh-zdd-pet-root[data-corner=\"top-right\"] .dsh-zdd-pet-bubble{right:calc(100% - var(--dsh-zdd-pet-size)*0.3125);left:auto;bottom:auto;top:50%;transform:translateY(-50%);margin-right:calc(var(--f)*0.3736)}",
	".dsh-zdd-pet-root[data-corner=\"top-right\"] .dsh-zdd-pet-bubble::after{right:calc(var(--f)*-0.3736);left:auto;top:50%;bottom:auto;transform:translateY(-50%);border:calc(var(--f)*0.3736) solid transparent;border-left-color:rgba(255,255,255,.92);border-right:none}"
].join("\n");
/** 注入气泡样式，每页只注入一次。 */
function injectBubbleCss() {
	if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=\"dsh-zdd-pet/bubble\"]") === null) {
		const tag = document.createElement("style");
		tag.dataset.plugin = "dsh-zdd-pet";
		tag.dataset.pluginCss = "dsh-zdd-pet/bubble";
		tag.textContent = bubbleCss;
		document.head.appendChild(tag);
	}
}
/** 把余额行数据映射成 React 节点数组（每行一个块，便于外部在头部插入进度角标）。 */
function rowsToNodes(h, rows) {
	if (rows.some((r) => r.role === "tier")) return [h("div", {
		key: "row",
		className: "pet-bub-row",
		children: rows.map((r, i) => {
			if (r.role === "quota") return null;
			if (r.role === "tier") return h("span", {
				key: i,
				className: "pet-bub-tier pet-bub-tier-" + r.tier,
				children: r.text
			});
			return h("span", {
				key: i,
				children: r.text
			});
		})
	})];
	return rows.map((r, i) => {
		if (r.role === "quota") return h("div", {
			key: i,
			className: "pet-bub-quota",
			children: [
				h("span", {
					key: "label",
					className: "pet-bub-quota-label",
					children: r.label
				}),
				h("span", {
					key: "bar",
					className: "pet-bub-quota-bar",
					children: h("i", {
						className: "pet-bub-quota-fill pet-bub-quota-" + r.tone,
						style: { width: Math.max(0, Math.min(100, r.percent)) + "%" }
					})
				}),
				h("span", {
					key: "used",
					className: "pet-bub-quota-used",
					children: r.usedText
				}),
				h("span", {
					key: "reset",
					className: "pet-bub-quota-reset",
					children: r.resetText
				})
			]
		});
		if (r.role === "error") return h("div", {
			key: i,
			className: "pet-bub-err",
			children: r.text
		});
		if (r.role === "sub") return h("div", {
			key: i,
			className: "pet-bub-row pet-bub-sub",
			children: r.text
		});
		return h("div", {
			key: i,
			className: "pet-bub-row",
			children: r.text
		});
	});
}
/** 把自定义节点树映射成 React 节点，与 rowsToNodes 并列。
*  行数据由插件定排版，这里把第三方定好的 tag、内联样式与文本原样映射。
*  解析层已做白名单裁剪，故不做二次校验；不用 innerHTML，没有注入面。
*  先文本后子节点，与 DOM 的 textContent + appendChild 顺序一致。
*/
function treeToNodes(h, node, key) {
	const props = { key };
	if (node.style) props.style = node.style;
	if (node.tag === "img") {
		props.src = node.src ?? "";
		props.alt = "";
		return h("img", props);
	}
	const children = [];
	if (node.text) children.push(node.text);
	for (let i = 0; i < (node.children?.length ?? 0); i++) children.push(treeToNodes(h, node.children[i], i));
	props.children = children;
	return h(node.tag, props);
}
/** 换内容前的淡出等待（ms），与 opacity 过渡同为 250ms。 */
const BALANCE_FADE_MS = 250;
function makeBalanceBubble(rt) {
	const { h, useState, useEffect } = rt;
	injectBubbleCss();
	return function BalanceBubble({ state, on, index, onCycle }) {
		const [shown, setShown] = useState(0);
		const [fading, setFading] = useState(false);
		useEffect(() => {
			if (index === shown) return;
			setFading(true);
			const timer = window.setTimeout(() => {
				setShown(index);
				setFading(false);
			}, BALANCE_FADE_MS);
			return () => window.clearTimeout(timer);
		}, [index, shown]);
		const isCustom = state.ok && state.shape === "custom";
		const views = isCustom ? customViews(state) : void 0;
		const tree = views ? views[Math.min(shown, views.length - 1)] : void 0;
		const rows = isCustom ? [] : shown > 0 ? balanceDetailView(state) : balanceBubbleView(state);
		const clickable = state.ok && (state.shape === "windows" || isCustom && customClickable(state));
		const wrap = state.ok ? "" : " dsh-zdd-pet-whisper";
		return h("div", {
			className: "dsh-zdd-pet-bubble" + wrap + (on ? " is-on" : "") + (clickable ? " is-clickable" : "") + (!isCustom && shown > 0 ? " is-expanded" : "") + (fading ? " is-fading" : ""),
			onClick: clickable ? (e) => {
				e.stopPropagation();
				onCycle();
			} : void 0,
			children: tree ? treeToNodes(h, tree, "tree") : rowsToNodes(h, rows)
		});
	};
}
function makeWhisperBubble(rt) {
	const { h } = rt;
	injectBubbleCss();
	injectMemeBubbleCss();
	return function WhisperBubble({ text, image, url, assetRoot, progress, on }) {
		const rows = whisperBubbleView({
			ok: true,
			text,
			ts: 0
		});
		const key = String(image ?? "").trim();
		const href = String(url ?? "").trim();
		const src = href || (key ? memeImageUrl(key, ROUTE_PATH, assetRoot) : "");
		const badge = String(progress ?? "").trim();
		const body = badge ? [h("div", {
			key: "prog",
			className: "pet-bub-prog",
			children: badge
		}), ...rowsToNodes(h, rows)] : rowsToNodes(h, rows);
		return h("div", {
			className: "dsh-zdd-pet-bubble dsh-zdd-pet-whisper" + (src ? " " + MEME_BUBBLE_CLASS : "") + (on ? " is-on" : ""),
			children: src ? [h("img", {
				key: "img",
				className: MEME_IMG_CLASS,
				src,
				alt: key || href
			}), ...body] : body
		});
	};
}

//#endregion
//#region src/shared/pomodoro.ts
const POMODORO_MIN_INTERVAL_MIN = 1;
const POMODORO_MAX_INTERVAL_MIN = 1440;
const POMODORO_DEFAULT_INTERVAL_MIN = 50;
const POMODORO_DEFAULT_BREAK_MIN = 5;
const POMODORO_DEFAULT_LONG_BREAK_MIN = 15;
const POMODORO_DEFAULT_ROUNDS = 4;
const DEFAULT_POMODORO = {
	enabled: false,
	intervalMin: POMODORO_DEFAULT_INTERVAL_MIN,
	breakMin: POMODORO_DEFAULT_BREAK_MIN,
	longBreakMin: POMODORO_DEFAULT_LONG_BREAK_MIN,
	roundsBeforeLongBreak: POMODORO_DEFAULT_ROUNDS,
	autoStartBreak: true,
	autoStartFocus: false
};
const POMODORO_PRESET_INTERVALS_MIN = [
	15,
	25,
	45,
	50,
	60,
	90
];
const POMODORO_PRESET_BREAKS_MIN = [
	3,
	5,
	10,
	15,
	20,
	30
];
/** 可选分钟时长校验：缺省合法；出现则必须在 1~1440。 */
function optionalMinutes(value) {
	if (value === void 0) return true;
	const n = Number(value);
	return Number.isFinite(n) && n >= POMODORO_MIN_INTERVAL_MIN && n <= POMODORO_MAX_INTERVAL_MIN;
}
function pomodoroValid(value) {
	if (!value || typeof value !== "object" || Array.isArray(value)) return false;
	const p = value;
	if (typeof p.enabled !== "boolean") return false;
	const n = Number(p.intervalMin);
	if (!Number.isFinite(n) || n < POMODORO_MIN_INTERVAL_MIN || n > POMODORO_MAX_INTERVAL_MIN) return false;
	if (!optionalMinutes(p.breakMin) || !optionalMinutes(p.longBreakMin)) return false;
	if (p.roundsBeforeLongBreak !== void 0) {
		const r = Number(p.roundsBeforeLongBreak);
		if (!Number.isInteger(r) || r < 1 || r > 24) return false;
	}
	if (p.autoStartBreak !== void 0 && typeof p.autoStartBreak !== "boolean") return false;
	if (p.autoStartFocus !== void 0 && typeof p.autoStartFocus !== "boolean") return false;
	return true;
}

//#endregion
//#region src/shared/greeting.ts
const GREETING_POOL_MIN = 1;
const GREETING_POOL_MAX = 200;
const GREETING_DEFAULT_POOL_SIZE = 100;
const DEFAULT_GREETING = {
	enabled: true,
	mode: "pool",
	poolSize: GREETING_DEFAULT_POOL_SIZE
};

//#endregion
//#region src/shared/mood.ts
const MOOD_MIN = 0;
const MOOD_MAX = 100;
const DEFAULT_MOOD = {
	enabled: true,
	initial: 60,
	touchGain: 4,
	decayPerHour: 4,
	low: 30,
	high: 70,
	happyAnim: "小幅度原地360度旋转展示",
	sadAnim: "工作状态-垂头叹气冒汗",
	texts: {
		low: [
			"哼，都不理我…",
			"有点无聊诶…",
			"陪陪我嘛…"
		],
		normal: [],
		high: [
			"好开心！",
			"摸摸头最棒啦～",
			"今天超棒的！"
		]
	}
};
function clampMood(v) {
	if (!Number.isFinite(v)) return MOOD_MIN;
	return Math.max(MOOD_MIN, Math.min(MOOD_MAX, Math.round(v)));
}
function moodTier(value, low, high) {
	const v = clampMood(value);
	if (v < low) return "low";
	if (v > high) return "high";
	return "normal";
}
function decayMood(value, elapsedMs, decayPerHour) {
	if (!Number.isFinite(elapsedMs) || elapsedMs <= 0 || !Number.isFinite(decayPerHour) || decayPerHour <= 0) return clampMood(value);
	const hours = elapsedMs / 36e5;
	return clampMood(value - hours * decayPerHour);
}
function moodLabel(tier) {
	return tier === "low" ? "有点闷" : tier === "high" ? "超开心" : "还不错";
}
function moodTextPool(params, tier, fallback = []) {
	if (!params.enabled) return fallback;
	const pool = params.texts?.[tier];
	if (Array.isArray(pool) && pool.length > 0) return pool;
	return fallback;
}
function moodValid(value) {
	if (!value || typeof value !== "object" || Array.isArray(value)) return false;
	const m = value;
	if (typeof m.enabled !== "boolean") return false;
	for (const key of [
		"initial",
		"touchGain",
		"decayPerHour",
		"low",
		"high"
	]) {
		if (m[key] === void 0) continue;
		const n = Number(m[key]);
		if (!Number.isFinite(n) || n < MOOD_MIN || n > MOOD_MAX) return false;
	}
	return true;
}
function readMoodParams(raw) {
	const d = {
		enabled: true,
		initial: 60,
		touchGain: 4,
		decayPerHour: 4,
		low: 30,
		high: 70,
		texts: {
			low: [],
			normal: [],
			high: []
		}
	};
	const o = raw && typeof raw === "object" ? raw : {};
	const num = (k, min, max) => {
		const v = Number(o[k]);
		return Number.isFinite(v) && v >= min && v <= max ? v : d[k];
	};
	const texts = o.texts && typeof o.texts === "object" ? o.texts : {};
	const arr = (v) => Array.isArray(v) ? v.filter((x) => typeof x === "string" && x.trim() !== "") : [];
	return {
		enabled: o.enabled !== false,
		initial: num("initial", 0, 100),
		touchGain: num("touchGain", 0, 100),
		decayPerHour: num("decayPerHour", 0, 100),
		low: num("low", 0, 100),
		high: num("high", 0, 100),
		happyAnim: typeof o.happyAnim === "string" ? o.happyAnim : void 0,
		sadAnim: typeof o.sadAnim === "string" ? o.sadAnim : void 0,
		texts: {
			low: arr(texts.low),
			normal: arr(texts.normal),
			high: arr(texts.high)
		}
	};
}

//#endregion
//#region src/shared/notify.ts
const NOTIFY_ICONS$1 = {
	done: "notify-done",
	error: "notify-error",
	truncated: "notify-truncated",
	approval: "notify-approval",
	question: "notify-question",
	test: "notify-test"
};
const MAX_BODY = 80;
function truncate(text) {
	return text.length > MAX_BODY ? text.slice(0, MAX_BODY) + "…" : text;
}
function frameToToast(frame) {
	switch (frame.type) {
		case "session/event": {
			const ev = frame.event ?? {};
			if (ev.type !== "turn/end") return null;
			const kind = ev.data?.reason?.kind;
			if (kind === "completed") return {
				title: "对话完成",
				body: "",
				icon: NOTIFY_ICONS$1.done
			};
			if (kind === "error") return {
				title: "生成失败",
				body: ev.data?.reason?.error?.message ?? "",
				icon: NOTIFY_ICONS$1.error
			};
			if (kind === "max-tokens") return {
				title: "输出被截断",
				body: "已达到输出 token 上限",
				icon: NOTIFY_ICONS$1.truncated
			};
			return null;
		}
		case "approval/requested": {
			const toolName = typeof frame.toolName === "string" ? frame.toolName : "";
			const reason = typeof frame.reason === "string" && frame.reason ? frame.reason : "";
			return {
				title: "正在申请权限",
				body: (toolName ? "工具「" + toolName + "」" : "") + (reason ? "：" + reason : ""),
				icon: NOTIFY_ICONS$1.approval
			};
		}
		case "question/requested": {
			const q = Array.isArray(frame.questions) && frame.questions[0]?.question || "";
			return {
				title: "模型在等你回答",
				body: q,
				icon: NOTIFY_ICONS$1.question
			};
		}
		case "host/agent-error": return {
			title: "生成失败",
			body: typeof frame.message === "string" ? frame.message : "",
			icon: NOTIFY_ICONS$1.error
		};
		default: return null;
	}
}

//#endregion
//#region src/client/notify.ts
let pageVisible = typeof document !== "undefined" && !document.hidden;
let pageFocused = typeof document !== "undefined" && document.hasFocus();
function refreshVisible() {
	pageVisible = !document.hidden;
}
function refreshFocused() {
	pageFocused = document.hasFocus();
}
/** 注册聚焦与可见性监听，返回解绑函数。 */
function initFocusTracking() {
	if (typeof document === "undefined") return () => {};
	document.addEventListener("visibilitychange", refreshVisible);
	window.addEventListener("focus", refreshFocused);
	window.addEventListener("blur", refreshFocused);
	return () => {
		document.removeEventListener("visibilitychange", refreshVisible);
		window.removeEventListener("focus", refreshFocused);
		window.removeEventListener("blur", refreshFocused);
	};
}
/** 用户是否在看本页（页面可见且持有焦点）；是则跳过通知。 */
function isPageActive() {
	return pageVisible && pageFocused;
}
/** 图标 URL；pic 路由由宿主提供（`assets/pic` → `/dsh-zdd-pet-7340/pic/<file>`）。 */
const PIC = (name) => `${ROUTE_PATH}/pic/${name}.png`;
const NOTIFY_ICONS = {
	done: PIC(NOTIFY_ICONS$1.done),
	error: PIC(NOTIFY_ICONS$1.error),
	truncated: PIC(NOTIFY_ICONS$1.truncated),
	approval: PIC(NOTIFY_ICONS$1.approval),
	question: PIC(NOTIFY_ICONS$1.question),
	test: PIC(NOTIFY_ICONS$1.test)
};
/** 当前生效的总开关；运行中可被 reloadNotifications 更新，设置页保存后即时生效。 */
let notifyEnabled = true;
/** 当前生效的会话跳转器（app.ts 注入；旧版 DSH 没有 uiWorkspace 时为 undefined）。 */
let sessionNavigator;
function wireNotificationClick(n, sessionId) {
	n.onclick = () => {
		n.close();
		if (sessionId !== void 0) try {
			sessionNavigator?.openSession(sessionId);
		} catch {}
		window.focus();
		if (!/electron/i.test(navigator.userAgent)) return;
		const frame = document.createElement("iframe");
		frame.style.display = "none";
		frame.src = "dsh://open";
		document.body.append(frame);
		setTimeout(() => frame.remove(), 1e3);
	};
}
/** 发一条系统通知；总开关关闭、环境不支持、未授权或本页正在看时静默跳过。
* 日志只在门之后记录：被拦下的触发不产生「弹窗」日志。 */
function toast(title, body, icon, sessionId) {
	if (!notifyEnabled) return;
	if (isPageActive()) return;
	if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
	console.log("[dsh-zdd-pet] 【弹窗】" + title + (body ? "：" + body : ""));
	try {
		const opts = {};
		if (body) opts.body = truncate(body);
		if (icon) opts.icon = icon;
		const n = new Notification(title, opts);
		wireNotificationClick(n, sessionId);
	} catch {}
}
/** 帧 → toast 并发出；未知帧静默跳过，帧里的 sessionId 一并透传给点击行为。 */
function toastFrame(frame) {
	const t = frameToToast(frame);
	if (!t) return;
	toast(t.title, t.body, PIC(t.icon), typeof frame.sessionId === "string" ? frame.sessionId : void 0);
}
async function requestNotificationPermission() {
	if (typeof Notification === "undefined") return {
		ok: false,
		reason: "unsupported"
	};
	if (Notification.permission === "granted") return { ok: true };
	if (Notification.permission === "denied") return {
		ok: false,
		reason: "denied"
	};
	try {
		const p = await Notification.requestPermission();
		if (p === "granted") return { ok: true };
		if (p === "denied") return {
			ok: false,
			reason: "rejected"
		};
		return {
			ok: false,
			reason: "error",
			message: "权限未授予（" + p + "）"
		};
	} catch (e) {
		return {
			ok: false,
			reason: "error",
			message: e instanceof Error ? e.message : String(e)
		};
	}
}
/** 读系统通知总开关（成品配置 main 条目）；拉取或解析失败时按开启处理，不阻塞。 */
async function readNotificationsEnabled() {
	try {
		const r = await fetch(ROUTE_PATH + "/config");
		if (!r.ok) return true;
		const d = await r.json().catch(() => null);
		return typeof d?.main?.notificationsEnabled === "boolean" ? d.main.notificationsEnabled : true;
	} catch {
		return true;
	}
}
async function reloadNotifications() {
	notifyEnabled = await readNotificationsEnabled();
}
function notifyFromFrame(frame) {
	toastFrame(frame);
}
function initNotify(navigator$1) {
	sessionNavigator = navigator$1;
	readNotificationsEnabled().then((enabled) => {
		notifyEnabled = enabled;
		if (typeof Notification !== "undefined" && enabled && Notification.permission === "default") requestNotificationPermission();
	});
	return initFocusTracking();
}

//#endregion
//#region src/client/settings/css.ts
/**
* 设置页样式表与注入入口：两族类名——`dsh-zdd-pet-mp__*`（AI 模型选择器）与 `dsh-zdd-pet-cfg__*`（配置卡片）。
* 只放伪类、悬浮、过渡与容器查询这类内联 style 表达不了的东西，其余排版走组件内联 style。
* 颜色与圆角取 `--dsw-alias-*` / `--dsw-radius-*` token；填充按钮上的白字与阴影回退值是刻意例外。
* 注入按 `data-plugin-css` 去重，同一页面重复渲染设置页不会长第二份样式。
* @module dsh-zdd-pet/src/client/settings/css
*/
/** 设置页样式表；按类名族分段拼成单段文本，行内注释标出反直觉的那几条规则。 */
const SETTINGS_CSS = [
	".dsh-zdd-pet-mp{position:relative;min-width:0;display:flex;flex-direction:column;gap:4px}",
	".dsh-zdd-pet-mp__trigger{display:flex;align-items:center;gap:6px;width:100%;max-width:340px;height:28px;padding:0 8px;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);font-size:13px;line-height:20px;text-align:left;cursor:pointer;outline:none}",
	".dsh-zdd-pet-mp__trigger:hover:not(:disabled){border-color:var(--dsw-alias-state-business-primary)}",
	".dsh-zdd-pet-mp__trigger:focus-visible{border-color:var(--dsw-alias-state-business-primary);box-shadow:0 0 0 2px var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary))}",
	".dsh-zdd-pet-mp__trigger:disabled{color:var(--dsw-alias-label-dimmed);cursor:default}",
	".dsh-zdd-pet-mp__label{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0}",
	".dsh-zdd-pet-mp__sub{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0;flex-shrink:1000;color:var(--dsw-alias-label-caption,var(--dsw-alias-label-tertiary))}",
	".dsh-zdd-pet-mp__chevron{flex:none;margin-left:auto;color:var(--dsw-alias-label-caption,var(--dsw-alias-label-tertiary));transition:transform .12s}",
	".dsh-zdd-pet-mp__chevron.is-open{transform:rotate(180deg)}",
	".dsh-zdd-pet-mp__panel{position:fixed;z-index:2147483000;display:flex;flex-direction:column;gap:4px;padding:4px;overflow:hidden;border:1px solid var(--dsw-alias-border-l1);border-radius:var(--dsw-radius-md,10px);background:var(--dsw-alias-bg-layer-1);box-shadow:var(--dsw-elevation-prominent,0 8px 30px rgba(0,0,0,.35));color:var(--dsw-alias-label-primary)}",
	".dsh-zdd-pet-mp__search{box-sizing:border-box;width:100%;height:28px;padding:0 8px;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);font-size:13px;outline:none}",
	".dsh-zdd-pet-mp__search:focus{border-color:var(--dsw-alias-state-business-primary)}",
	".dsh-zdd-pet-mp__list{display:flex;flex-direction:column;min-height:0;overflow-y:auto;scrollbar-width:thin}",
	".dsh-zdd-pet-mp__group{padding:6px 8px 2px;font-size:11px;line-height:16px;color:var(--dsw-alias-label-tertiary)}",
	".dsh-zdd-pet-mp__item{display:flex;align-items:center;gap:8px;width:100%;padding:6px 8px;border:none;border-radius:var(--dsw-radius-sm,6px);background:transparent;color:inherit;font-size:13px;line-height:20px;text-align:left;cursor:pointer}",
	".dsh-zdd-pet-mp__item:hover:not(:disabled),.dsh-zdd-pet-mp__item.is-active{background:var(--dsw-alias-interactive-bg-hover)}",
	".dsh-zdd-pet-mp__item[aria-checked=\"true\"]{color:var(--dsw-alias-state-business-primary)}",
	".dsh-zdd-pet-mp__item:disabled{color:var(--dsw-alias-label-dimmed);cursor:default}",
	".dsh-zdd-pet-mp__name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0}",
	".dsh-zdd-pet-mp__check{flex:none;margin-left:auto}",
	".dsh-zdd-pet-mp__status{padding:8px;font-size:12px;line-height:18px;color:var(--dsw-alias-label-tertiary)}",
	".dsh-zdd-pet-cfg{container-type:inline-size;display:flex;flex-direction:column;gap:12px;color:var(--dsw-alias-label-primary);font-size:13px;line-height:20px}",
	".dsh-zdd-pet-cfg__title{display:flex;align-items:center;gap:6px;margin:0;font-size:16px;font-weight:500;line-height:24px}",
	".dsh-zdd-pet-cfg__card{display:flex;flex-direction:column;gap:10px;padding:12px 14px;border:1px solid var(--dsw-alias-border-l2);border-radius:12px}",
	".dsh-zdd-pet-cfg__cardHead{display:flex;align-items:center;gap:6px;min-height:20px}",
	".dsh-zdd-pet-cfg__cardTitle{font-size:13px;font-weight:500;color:var(--dsw-alias-label-primary)}",
	".dsh-zdd-pet-cfg__grid3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px 16px;align-items:end}",
	".dsh-zdd-pet-cfg__grid4{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px 16px;align-items:end}",
	".dsh-zdd-pet-cfg__grid2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px 16px;align-items:end}",
	"@container (max-width:600px){.dsh-zdd-pet-cfg__grid4{grid-template-columns:repeat(2,minmax(0,1fr))}}",
	"@container (max-width:400px){.dsh-zdd-pet-cfg__grid2,.dsh-zdd-pet-cfg__grid3,.dsh-zdd-pet-cfg__grid4{grid-template-columns:minmax(0,1fr)}}",
	".dsh-zdd-pet-cfg__field{display:flex;flex-direction:column;gap:4px;min-width:0}",
	".dsh-zdd-pet-cfg__flabel{display:inline-flex;align-items:center;gap:5px;font-size:12px;color:var(--dsw-alias-label-secondary)}",
	".dsh-zdd-pet-cfg__inp{box-sizing:border-box;width:100%;min-height:28px;padding:4px 10px;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);font:inherit;font-size:13px;outline:none}",
	".dsh-zdd-pet-cfg__inp:focus{border-color:var(--dsw-alias-state-business-primary)}",
	".dsh-zdd-pet-cfg__inp:disabled{color:var(--dsw-alias-label-tertiary);cursor:default}",
	".dsh-zdd-pet-cfg__inp[multiple]{min-height:auto}",
	"select.dsh-zdd-pet-cfg__inp{appearance:none;-webkit-appearance:none;cursor:pointer;padding-right:26px;background-image:url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23888' d='M6 8.5 1.5 4h9z'/%3E%3C/svg%3E\");background-repeat:no-repeat;background-position:right 9px center}",
	"select.dsh-zdd-pet-cfg__inp:disabled{cursor:default;color:var(--dsw-alias-label-tertiary)}",
	".dsh-zdd-pet-cfg__persona{display:flex;flex-direction:column;gap:2px;min-width:0}",
	".dsh-zdd-pet-cfg__area{min-height:66px;resize:vertical;line-height:18px}",
	".dsh-zdd-pet-cfg__count{font-size:11px;color:var(--dsw-alias-label-tertiary);text-align:right}",
	".dsh-zdd-pet-cfg__toggle{display:flex;align-items:center;gap:6px;min-width:0;font-size:13px;color:var(--dsw-alias-label-primary)}",
	".dsh-zdd-pet-cfg__toggle>label{display:inline-flex;align-items:center;gap:6px;cursor:pointer;min-width:0}",
	".dsh-zdd-pet-cfg__toggle>label>span{overflow-wrap:anywhere}",
	".dsh-zdd-pet-cfg__toggle input[type=checkbox]{flex:none;width:16px;height:16px;margin:0;accent-color:var(--dsw-alias-state-business-primary);cursor:pointer}",
	".dsh-zdd-pet-cfg [data-tip]{position:relative}",
	".dsh-zdd-pet-cfg [data-tip]::after{display:none;content:attr(data-tip);position:absolute;left:-4px;bottom:calc(100% + 8px);width:max-content;max-width:260px;padding:6px 10px;border-radius:8px;background:var(--dsw-alias-tooltip-bg);color:#fff;font-size:12px;font-style:normal;font-weight:400;line-height:18px;text-align:left;white-space:normal;opacity:0;visibility:hidden;pointer-events:none;transition:opacity .12s ease;box-shadow:0 6px 20px rgba(0,0,0,.22);z-index:2147483000}",
	".dsh-zdd-pet-cfg [data-tip]:hover::after{display:block;opacity:1;visibility:visible}",
	".dsh-zdd-pet-cfg [data-tip][data-tip-end]::after{left:auto;right:-4px}",
	".dsh-zdd-pet-cfg__q{display:inline-flex;align-items:center;justify-content:center;flex:none;width:14px;height:14px;border:1px solid var(--dsw-alias-label-tertiary);border-radius:50%;color:var(--dsw-alias-label-tertiary);font-size:10px;font-style:normal;line-height:1;cursor:help;user-select:none}",
	".dsh-zdd-pet-cfg__btn{border:1px solid var(--dsw-alias-border-l2);background:transparent;color:var(--dsw-alias-label-primary);border-radius:8px;padding:4px 14px;font:inherit;font-size:12px;line-height:20px;cursor:pointer;white-space:nowrap}",
	".dsh-zdd-pet-cfg__btn:hover:not(:disabled):not(.is-primary){background:var(--dsw-alias-interactive-bg-hover)}",
	".dsh-zdd-pet-cfg__btn:disabled{opacity:.5;cursor:default}",
	".dsh-zdd-pet-cfg__btn.is-primary{border-color:var(--dsw-alias-button-info-fill);background:var(--dsw-alias-button-info-fill);color:#fff}",
	".dsh-zdd-pet-cfg__btn.is-primary:hover:not(:disabled){border-color:var(--dsw-alias-button-info-hover);background:var(--dsw-alias-button-info-hover)}",
	".dsh-zdd-pet-cfg__btn.is-danger{border-color:var(--dsw-alias-state-error-secondary);color:var(--dsw-alias-state-error-primary)}",
	".dsh-zdd-pet-cfg__btn.is-sm{padding:2px 10px}",
	".dsh-zdd-pet-cfg__btn.is-ghost{border-style:dashed;color:var(--dsw-alias-label-secondary)}",
	".dsh-zdd-pet-cfg__tabs{display:flex;gap:8px;flex-wrap:wrap;align-items:center}",
	".dsh-zdd-pet-cfg__tabsLabel{font-size:12px;color:var(--dsw-alias-label-secondary)}",
	".dsh-zdd-pet-cfg__kinds{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:10px}",
	".dsh-zdd-pet-cfg__tab{border:1px solid var(--dsw-alias-border-l2);background:transparent;color:var(--dsw-alias-label-primary);border-radius:8px;padding:4px 12px;font:inherit;font-size:13px;cursor:pointer}",
	".dsh-zdd-pet-cfg__tab:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover)}",
	".dsh-zdd-pet-cfg__tab:disabled{opacity:.5;cursor:default}",
	".dsh-zdd-pet-cfg__tab.is-active{border-color:var(--dsw-alias-state-business-primary);background:var(--dsw-alias-interactive-bg-active)}",
	".dsh-zdd-pet-cfg__tab.is-ghost{border-style:dashed;color:var(--dsw-alias-label-secondary)}",
	".dsh-zdd-pet-cfg__actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:4px}",
	".dsh-zdd-pet-cfg__msg{margin-left:4px;font-size:12px;color:var(--dsw-alias-state-success-primary)}",
	".dsh-zdd-pet-cfg__msg.is-err{color:var(--dsw-alias-state-error-primary)}",
	".dsh-zdd-pet-cfg__note{margin:0;font-size:12px;line-height:18px;color:var(--dsw-alias-label-tertiary)}",
	".dsh-zdd-pet-cfg__path{font-size:12px;line-height:18px;word-break:break-all;user-select:text;color:var(--dsw-alias-label-secondary)}",
	".dsh-zdd-pet-cfg__path b{color:var(--dsw-alias-label-primary);font-weight:400}",
	".dsh-zdd-pet-cfg__cmd{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,\"Courier New\",monospace;font-size:12px;line-height:18px;word-break:break-all;user-select:text;padding:6px 10px;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;background:var(--dsw-alias-interactive-bg-active);color:var(--dsw-alias-label-primary)}"
].join("\n");
/** 注入去重用的标记值，写在 `<style>` 的 `data-plugin-css` 上。 */
const settingsCssTag = "dsh-zdd-pet/settings.css";
function injectSettingsCss() {
	if (typeof document === "undefined") return;
	if (document.querySelector("style[data-plugin-css=\"" + settingsCssTag + "\"]") !== null) return;
	const tag = document.createElement("style");
	tag.dataset.plugin = "dsh-zdd-pet";
	tag.dataset.pluginCss = settingsCssTag;
	tag.textContent = SETTINGS_CSS;
	document.head.appendChild(tag);
}

//#endregion
//#region src/client/settings/ui.ts
const INPUT_CLASS = "dsh-zdd-pet-cfg__inp";
const MONO_STACK = "ui-monospace, SFMono-Regular, Menlo, Consolas, \"Courier New\", monospace";
function makeUiKit(rt) {
	const { h, t } = rt;
	/**
	* 悬浮说明的展开属性。
	*
	* @param text - 说明正文（已翻译）。
	* @param end - 气泡右对齐，给栅格最右列或贴右缘的元素用。
	*/
	const tip = (text, end = false) => end ? {
		"data-tip": text,
		"data-tip-end": ""
	} : { "data-tip": text };
	/** 问号：气泡的圆形触发元素。用 `<i>` 而不是 `<button>`——它只展示说明，点了不该有行为，也不该进 Tab 顺序。 */
	const q = (text, end = false) => h("i", {
		className: "dsh-zdd-pet-cfg__q",
		...tip(text, end),
		"aria-label": text,
		role: "img",
		children: "?"
	});
	return {
		tip,
		q,
		cardHead: (title, hint, end = false) => h("div", {
			className: "dsh-zdd-pet-cfg__cardHead",
			children: [h("span", {
				key: "t",
				className: "dsh-zdd-pet-cfg__cardTitle",
				children: title
			}), hint ? q(hint, end) : null]
		}),
		field: (label, control, hint, end = false) => h("div", {
			className: "dsh-zdd-pet-cfg__field",
			children: [h("span", {
				key: "l",
				className: "dsh-zdd-pet-cfg__flabel",
				children: hint ? [label, q(hint, end)] : label
			}), control]
		}),
		toggleCell: (label, value, disabled, onToggle, end = false) => h("div", {
			className: "dsh-zdd-pet-cfg__toggle",
			children: [h("label", {
				key: "l",
				children: [h("input", {
					key: "i",
					type: "checkbox",
					checked: value,
					disabled,
					onChange: (e) => onToggle(e.target.checked)
				}), h("span", {
					key: "t",
					children: t(label)
				})]
			}), q(t(label + "Hint"), end)]
		})
	};
}

//#endregion
//#region src/client/settings/actions.ts
function makeActions(rt) {
	const { h, t } = rt;
	const { tip, q } = makeUiKit({
		h,
		t
	});
	return function Actions(props) {
		const { busy, msg, permMsg } = props;
		return h("div", {
			className: "dsh-zdd-pet-cfg__actions",
			children: [
				h("button", {
					type: "button",
					disabled: busy,
					onClick: props.onSave,
					className: "dsh-zdd-pet-cfg__btn is-primary",
					...tip(t("saveHotkey")),
					children: t("save")
				}),
				h("button", {
					type: "button",
					disabled: busy,
					onClick: props.onSync,
					className: "dsh-zdd-pet-cfg__btn",
					children: t("sync")
				}),
				h("button", {
					type: "button",
					onClick: props.onTestNotification,
					className: "dsh-zdd-pet-cfg__btn",
					children: t("notifyTest")
				}),
				q(t("syncHint")),
				msg.text ? h("span", {
					className: "dsh-zdd-pet-cfg__msg" + (msg.kind === "err" ? " is-err" : ""),
					children: msg.text
				}) : null,
				permMsg.text ? h("span", {
					className: "dsh-zdd-pet-cfg__msg" + (permMsg.kind === "err" ? " is-err" : ""),
					children: permMsg.text
				}) : null
			]
		});
	};
}

//#endregion
//#region src/client/settings/bridge.ts
const petBridge = {
	current: [],
	reload: () => {},
	template: void 0
};

//#endregion
//#region src/client/settings/config/read.ts
/** 非负有限数才算合法；其余（`NaN`、负数、字符串）一律当作没写。 */
const nonNegative = (value) => {
	const n = Number(value);
	return Number.isFinite(n) && n >= 0 ? n : void 0;
};
/** 一对模型选择：两项都是字符串才算写全，只写一半视为没写（宿主会按非法拒绝）。 */
const readModel = (value) => {
	const model = value;
	if (!model || typeof model.provider !== "string" || typeof model.model !== "string") return void 0;
	return {
		provider: model.provider,
		model: model.model
	};
};
function readMainConfig(merged) {
	const main = merged.main;
	if (!main || !Array.isArray(main.pets)) return null;
	const pets = main.pets;
	const patch = { pets: pets.map((pet) => ({
		...pet,
		position: { ...pet.position }
	})) };
	if (typeof main.whisperPrompt === "string") patch.entryPrompt = main.whisperPrompt;
	if (typeof main.notificationsEnabled === "boolean") patch.notificationsEnabled = main.notificationsEnabled;
	if (typeof main.clickSoundEnabled === "boolean") patch.clickSoundEnabled = main.clickSoundEnabled;
	if (typeof main.bubbleImageEnabled === "boolean") patch.bubbleImageEnabled = main.bubbleImageEnabled;
	if (typeof main.confineToScreen === "boolean") patch.confineToScreen = main.confineToScreen;
	if (typeof main.trayEnabled === "boolean") patch.trayEnabled = main.trayEnabled;
	if (main.physics && typeof main.physics === "object") patch.physics = {
		...DEFAULT_PHYSICS,
		...main.physics
	};
	if (main.font && typeof main.font === "object") patch.font = {
		...DEFAULT_FONT,
		...main.font
	};
	if (main.pomodoro && typeof main.pomodoro === "object") patch.pomodoro = {
		...DEFAULT_POMODORO,
		...main.pomodoro
	};
	if (main.greeting && typeof main.greeting === "object") patch.greeting = {
		...DEFAULT_GREETING,
		...main.greeting
	};
	if (main.mood && typeof main.mood === "object") patch.mood = {
		...DEFAULT_MOOD,
		...main.mood
	};
	const whisperModel = readModel(main.whisperModel);
	if (whisperModel) patch.whisperModel = whisperModel;
	const chatModel = readModel(main.chatModel);
	if (chatModel) patch.chatModel = chatModel;
	const rounds = nonNegative(main.chatMemoryRounds);
	if (rounds !== void 0) patch.chatMemoryRounds = rounds;
	const limit = nonNegative(main.chatImageLimit);
	if (limit !== void 0) patch.chatImageLimit = limit;
	return patch;
}
function readConfigEntries(merged) {
	const main = merged.main;
	if (!main || !Array.isArray(main.pets)) return null;
	const out = [];
	for (const [key, conf] of Object.entries(merged)) {
		const pets = Array.isArray(conf?.pets) ? conf.pets : [];
		out.push({
			key,
			kind: key === "main" ? "main" : "pack",
			...typeof conf?.whisperPrompt === "string" ? { entryPrompt: conf.whisperPrompt } : {},
			pets: pets.map((pet) => ({
				...pet,
				position: { ...pet.position },
				assetRoot: key
			}))
		});
	}
	return out;
}

//#endregion
//#region src/client/settings/config/http.ts
function buildSaveBody(fields) {
	return {
		pets: fields.pets,
		notificationsEnabled: fields.notificationsEnabled,
		clickSoundEnabled: fields.clickSoundEnabled,
		bubbleImageEnabled: fields.bubbleImageEnabled,
		confineToScreen: fields.confineToScreen,
		trayEnabled: fields.trayEnabled,
		physics: fields.physics,
		whisperModel: fields.whisperModel,
		chatModel: fields.chatModel,
		chatMemoryRounds: fields.chatMemoryRounds,
		chatImageLimit: fields.chatImageLimit,
		font: fields.font,
		pomodoro: fields.pomodoro,
		greeting: fields.greeting,
		mood: fields.mood
	};
}
async function loadConfig(signal) {
	try {
		const response = await fetch(ROUTE_PATH + "/config", signal === void 0 ? {} : { signal });
		if (!response.ok) return null;
		const body = await response.json();
		if (body.ok === false) return null;
		return body;
	} catch {
		return null;
	}
}
async function loadMeta() {
	try {
		const response = await fetch(ROUTE_PATH + "/config/meta");
		if (!response.ok) return null;
		return await response.json();
	} catch {
		return null;
	}
}
async function loadModelCatalog() {
	try {
		const response = await fetch(ROUTE_PATH + "/models");
		if (!response.ok) return null;
		const body = await response.json();
		if (!body || !Array.isArray(body.providers)) return null;
		return body.providers;
	} catch {
		return null;
	}
}
async function saveConfig(body, force) {
	try {
		const response = await fetch(ROUTE_PATH + "/config" + (force === true ? "?force=1" : ""), {
			method: "PUT",
			headers: { "content-type": "application/json" },
			body: JSON.stringify(body)
		});
		const payload = await response.json().catch(() => null);
		if (payload && payload.ok === false) {
			if (payload.reason === "user-config-unparsable") return {
				kind: "corrupt",
				userFile: typeof payload.userFile === "string" ? payload.userFile : null
			};
			if (payload.reason === "bad-request" || payload.reason === "invalid-json") return { kind: "invalid" };
			return { kind: "error" };
		}
		if (!response.ok) return { kind: "error" };
		return {
			kind: "ok",
			merged: payload
		};
	} catch {
		return { kind: "error" };
	}
}
async function syncConfig() {
	try {
		const response = await fetch(ROUTE_PATH + "/config", { method: "POST" });
		if (!response.ok) return null;
		return await response.json();
	} catch {
		return null;
	}
}
async function savePetLayer(entry, pets) {
	try {
		const response = await fetch(ROUTE_PATH + "/pet-config", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({
				entry,
				pets
			})
		});
		const payload = await response.json().catch(() => null);
		if (payload && payload.ok === false) {
			if (payload.reason === "bad-request" || payload.reason === "unknown-entry") return {
				kind: "invalid",
				message: typeof payload.message === "string" ? payload.message : ""
			};
			return { kind: "error" };
		}
		if (!response.ok) return { kind: "error" };
		return {
			kind: "ok",
			merged: payload
		};
	} catch {
		return { kind: "error" };
	}
}

//#endregion
//#region src/client/settings/config/pack-writes.ts
/** 提交形状的指纹：只含会被宿主持久化的字段，位置逐子字段取。 */
function fingerprint(pet) {
	return JSON.stringify([
		pet.id,
		pet.name,
		pet.size,
		pet.balanceEnabled,
		pet.whisperEnabled,
		pet.workStatusEnabled,
		pet.fixedEnabled,
		pet.display,
		pet.position.corner,
		pet.position.marginX,
		pet.position.marginY,
		pet.whisperPrompt ?? ""
	]);
}
function diffPackWrites(loaded, current) {
	const groups = new Map();
	for (const pet of current) {
		const entry = pet.assetRoot ?? "";
		if (entry === "" || entry === "main") continue;
		const list = groups.get(entry);
		if (list) list.push(pet);
		else groups.set(entry, [pet]);
	}
	const out = [];
	for (const [entry, pets] of groups) {
		const before = loaded.find((item) => item.key === entry)?.pets ?? [];
		const unchanged = before.length === pets.length && before.every((pet, i) => fingerprint(pet) === fingerprint(pets[i]));
		if (!unchanged) out.push({
			entry,
			pets
		});
	}
	return out;
}

//#endregion
//#region src/client/settings/config/persist.ts
async function persistSettings(fields, packWrites, force, fallbackUserFile) {
	const outcome = await saveConfig(buildSaveBody(fields), force);
	if (outcome.kind === "corrupt") return {
		kind: "corrupt",
		path: outcome.userFile ?? fallbackUserFile
	};
	if (outcome.kind !== "ok") return { kind: outcome.kind };
	let merged = outcome.merged;
	const failed = [];
	for (const write of packWrites) {
		const result = await savePetLayer(write.entry, write.pets);
		if (result.kind === "ok") merged = result.merged;
		else failed.push(write.entry);
	}
	petBridge.reload(merged);
	reloadNotifications();
	return failed.length > 0 ? {
		kind: "partial",
		failed
	} : { kind: "ok" };
}
async function syncSettings() {
	const merged = await syncConfig();
	if (merged === null) return null;
	petBridge.reload(merged);
	reloadNotifications();
	return merged;
}

//#endregion
//#region src/client/settings/config/validate-form.ts
const modelPairValid = (model) => model.provider.trim() === "" === (model.model.trim() === "");
/** 宠物：宽度必须为正数、两个偏移必须是有限数（负数合法，宠物可以压出屏外）。 */
const petValid = (pet) => Number.isFinite(pet.size) && pet.size > 0 && Number.isFinite(pet.position.marginX) && Number.isFinite(pet.position.marginY);
/** 物理参数：与宿主 `physicsValid` 同名规则，客户端只覆盖数值字段（布尔项由宿主兜底）。 */
const physicsValid = (physics) => Number.isFinite(physics.gravity) && physics.gravity >= 0 && Number.isFinite(physics.restitution) && physics.restitution >= 0 && physics.restitution <= 1 && Number.isFinite(physics.groundFriction) && physics.groundFriction >= 0 && Number.isFinite(physics.throwPower) && physics.throwPower > 0;
/** 字体：种类必须在预设白名单内，字号在闭区间内。 */
const fontValid = (font) => FONT_PRESETS.some((preset) => preset.id === font.family) && Number.isFinite(font.size) && font.size >= FONT_SIZE_MIN && font.size <= FONT_SIZE_MAX;
function validateForm(values) {
	if (!values.pets.every(petValid)) return "invalid";
	if (!physicsValid(values.physics)) return "invalidPhysics";
	if (!modelPairValid(values.whisperModel) || !modelPairValid(values.chatModel)) return "invalidModel";
	if (!Number.isFinite(values.chatMemory) || values.chatMemory < 0) return "invalidChatMemory";
	if (!Number.isFinite(values.chatImageLimit) || values.chatImageLimit < 0) return "invalidChatImageLimit";
	if (!fontValid(values.font)) return "invalidFont";
	if (!pomodoroValid(values.pomodoro)) return "invalidPomodoro";
	if (!["pool", "live"].includes(values.greeting.mode)) return "invalidGreeting";
	if (!Number.isInteger(values.greeting.poolSize) || values.greeting.poolSize < GREETING_POOL_MIN || values.greeting.poolSize > GREETING_POOL_MAX) return "invalidGreeting";
	if (!moodValid(values.mood)) return "invalidMood";
	return null;
}

//#endregion
//#region src/client/settings/config/write-flow.ts
function createWriteFlow(deps) {
	const { setBusy, setMsg, setDialog, t } = deps;
	const save = async (force = false) => {
		if (deps.busy()) return;
		const fields = deps.fields();
		const invalid = validateForm({
			pets: fields.pets,
			physics: fields.physics,
			whisperModel: fields.whisperModel,
			chatModel: fields.chatModel,
			chatMemory: fields.chatMemoryRounds,
			chatImageLimit: fields.chatImageLimit,
			font: fields.font,
			pomodoro: fields.pomodoro,
			greeting: fields.greeting,
			mood: fields.mood
		});
		if (invalid !== null) {
			setMsg({
				kind: "err",
				text: t(invalid)
			});
			return;
		}
		setBusy(true);
		setMsg({
			kind: "",
			text: ""
		});
		try {
			const result = await persistSettings(fields, deps.packWrites(), force, deps.userFile());
			if (result.kind === "ok") {
				setMsg({
					kind: "ok",
					text: t("saved")
				});
				return;
			}
			if (result.kind === "corrupt") {
				setDialog({
					kind: "corrupt",
					path: result.path
				});
				return;
			}
			if (result.kind === "partial") {
				setMsg({
					kind: "err",
					text: t("savePartial").replace("{names}", result.failed.join("、"))
				});
				return;
			}
			setMsg({
				kind: "err",
				text: t(result.kind === "invalid" ? "saveInvalid" : "saveError")
			});
		} finally {
			setBusy(false);
		}
	};
	const doSync = async () => {
		setBusy(true);
		setMsg({
			kind: "",
			text: ""
		});
		try {
			const merged = await syncSettings();
			if (merged === null) {
				setMsg({
					kind: "err",
					text: t("syncError")
				});
				return;
			}
			deps.applyConfig(merged);
			setMsg({
				kind: "ok",
				text: t("saved")
			});
		} finally {
			setBusy(false);
		}
	};
	return {
		save,
		requestSync: () => setDialog({ kind: "sync" }),
		confirmDialog: () => {
			const pending = deps.dialog();
			if (pending === null) return;
			setDialog(null);
			if (pending.kind === "remove") deps.onRemove();
			else if (pending.kind === "corrupt") save(true);
			else if (pending.kind === "sync") doSync();
		}
	};
}

//#endregion
//#region src/client/settings/config/use-config-load.ts
function useConfigLoad(rt, onMerged) {
	const { useState, useEffect } = rt;
	const [loadState, setLoadState] = useState("loading");
	const [attempt, setAttempt] = useState(0);
	useEffect(() => {
		let alive = true;
		const controller = new AbortController();
		loadConfig(controller.signal).then((merged) => {
			if (!alive) return;
			if (merged === null) {
				setLoadState("error");
				return;
			}
			onMerged(merged);
			setLoadState("ready");
		}).catch(() => {
			if (alive) setLoadState("error");
		});
		return () => {
			alive = false;
			controller.abort();
		};
	}, [onMerged, attempt]);
	const retry = () => {
		setLoadState("loading");
		setAttempt((value) => value + 1);
	};
	return {
		loadState,
		retry
	};
}

//#endregion
//#region src/client/settings/dialog.ts
/** 正文文案：每个场景一句，参数就地代入。 */
function bodyText(dialog, t, selId) {
	if (dialog.kind === "remove") return t("confirmRemove").replace("{id}", selId);
	if (dialog.kind === "lastOne") return t("atLeastOne");
	if (dialog.kind === "lastOfKind") return t("lastOfKind").replace("{entry}", dialog.entry);
	if (dialog.kind === "corrupt") return t("corruptBody").replace("{path}", dialog.path);
	return t("confirmSync");
}
/** 确认按钮文案：三个可确认场景各一句。 */
function confirmLabel(kind, t) {
	if (kind === "remove") return t("remove");
	if (kind === "corrupt") return t("corruptConfirm");
	return t("sync");
}
function makeDialog(rt) {
	const { h, t } = rt;
	return function SettingsDialog(props) {
		const { dialog } = props;
		const confirmable = dialog.kind === "lastOne" || dialog.kind === "lastOfKind" ? null : dialog;
		return h("div", {
			style: {
				position: "fixed",
				inset: 0,
				zIndex: 2147483647,
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				background: "rgba(0, 0, 0, 0.45)"
			},
			onClick: props.onDismiss,
			children: h("div", {
				style: {
					width: "340px",
					maxWidth: "calc(100vw - 40px)",
					background: "var(--dsw-alias-bg-layer-1)",
					border: "1px solid var(--dsw-alias-border-l2)",
					borderRadius: "12px",
					padding: "16px 18px",
					boxShadow: "0 8px 30px rgba(0, 0, 0, 0.35)",
					display: "flex",
					flexDirection: "column",
					gap: "12px"
				},
				onClick: (e) => e.stopPropagation(),
				children: [
					h("div", {
						style: {
							fontSize: "14px",
							fontWeight: 500,
							color: "var(--dsw-alias-label-primary)"
						},
						children: t(dialog.kind === "corrupt" ? "corruptTitle" : "confirmTitle")
					}),
					h("div", {
						style: {
							fontSize: "13px",
							lineHeight: "20px",
							color: "var(--dsw-alias-label-secondary)"
						},
						children: bodyText(dialog, t, props.selId)
					}),
					h("div", {
						style: {
							display: "flex",
							gap: "8px",
							justifyContent: "flex-end"
						},
						children: confirmable === null ? [h("button", {
							key: "ok",
							type: "button",
							onClick: props.onDismiss,
							className: "dsh-zdd-pet-cfg__btn is-primary",
							children: t("ok")
						})] : [h("button", {
							key: "cancel",
							type: "button",
							onClick: props.onDismiss,
							className: "dsh-zdd-pet-cfg__btn",
							children: t("cancel")
						}), h("button", {
							key: "confirm",
							type: "button",
							onClick: props.onConfirm,
							className: "dsh-zdd-pet-cfg__btn " + (confirmable.kind === "sync" ? "is-primary" : "is-danger"),
							children: confirmLabel(confirmable.kind, t)
						})]
					})
				]
			})
		});
	};
}

//#endregion
//#region src/client/settings/font-card.ts
function makeFontCard(rt) {
	const { h, t } = rt;
	const { cardHead, field, toggleCell } = makeUiKit({
		h,
		t
	});
	return function FontCard(props) {
		const { busy, font } = props;
		return h("div", {
			className: "dsh-zdd-pet-cfg__card",
			children: [
				cardHead(t("fontTitle"), t("fontHint")),
				h("div", {
					className: "dsh-zdd-pet-cfg__grid2",
					children: [field(t("fontFamilyLabel"), h("select", {
						className: INPUT_CLASS,
						value: font.family,
						disabled: busy,
						onChange: (e) => props.onChange({ family: e.target.value }),
						children: FONT_PRESETS.map((preset) => h("option", {
							key: preset.id,
							value: preset.id,
							children: t("font." + preset.id)
						}))
					}), t("fontFamilyHint")), field(t("fontSizeLabel"), h("input", {
						type: "number",
						className: INPUT_CLASS,
						step: "1",
						min: String(FONT_SIZE_MIN),
						max: String(FONT_SIZE_MAX),
						value: String(font.size),
						disabled: busy,
						onChange: (e) => props.onChange({ size: Number(e.target.value) })
					}), t("fontSizeHint"), true)]
				}),
				h("div", {
					className: "dsh-zdd-pet-cfg__grid2",
					children: [toggleCell("fontFollowToggle", font.followPet, busy, (v) => props.onChange({ followPet: v }))]
				})
			]
		});
	};
}

//#endregion
//#region src/client/settings/global-card.ts
/** 开关的展示顺序与文案键；`end` 的用右对齐气泡（栅格右列）。 */
const TOGGLES = [
	{
		key: "notificationsEnabled",
		label: "notifyToggle"
	},
	{
		key: "clickSoundEnabled",
		label: "clickSoundToggle"
	},
	{
		key: "bubbleImageEnabled",
		label: "bubbleImageToggle"
	},
	{
		key: "confineToScreen",
		label: "confineToggle",
		end: true
	},
	{
		key: "trayEnabled",
		label: "trayToggle"
	}
];
function makeGlobalCard(rt) {
	const { h, t } = rt;
	const { cardHead, toggleCell } = makeUiKit({
		h,
		t
	});
	return function GlobalCard(props) {
		return h("div", {
			className: "dsh-zdd-pet-cfg__card",
			children: [cardHead(t("globalTitle"), t("globalHint")), h("div", {
				className: "dsh-zdd-pet-cfg__grid4",
				children: TOGGLES.map((toggle) => toggleCell(toggle.label, props.values[toggle.key], props.busy, (value) => props.onChange(toggle.key, value), toggle.end))
			})]
		});
	};
}

//#endregion
//#region src/client/settings/load-status.ts
function makeLoadStatus(rt) {
	const { h, t } = rt;
	return function LoadStatus(props) {
		if (props.loadState === "ready") return null;
		const failed = props.loadState === "error";
		return h("div", {
			role: failed ? "alert" : "status",
			className: "dsh-zdd-pet-cfg__actions",
			children: [h("span", { children: t(failed ? "loadError" : "loading") }), failed ? h("button", {
				type: "button",
				className: "dsh-zdd-pet-cfg__btn",
				onClick: props.onRetry,
				children: t("retry")
			}) : null]
		});
	};
}

//#endregion
//#region src/client/settings/model-card.ts
function makeModelCard(rt, picker) {
	const { h, t } = rt;
	const { cardHead, field } = makeUiKit({
		h,
		t
	});
	return function ModelCard(props) {
		const { busy, catalog, failed } = props;
		/** 「全局默认」的数字格：标签与问号在上、数字输入在下。 */
		const numField = (label, value, setter) => field(t(label), h("input", {
			type: "number",
			className: INPUT_CLASS,
			step: "1",
			min: "0",
			value: String(value),
			disabled: busy,
			onChange: (e) => setter(Number(e.target.value))
		}), t(label + "Hint"));
		/** 「AI 模型」的一格：标签与问号在上、单下拉选择器在下。 */
		const modelCell = (key, value, end = false) => {
			const label = t(key === "whisperModel" ? "whisperModelLabel" : "chatModelLabel");
			return field(label, h(picker, {
				label,
				value,
				disabled: busy,
				catalog,
				failed,
				onChange: (next) => props.onModelChange(key, next)
			}), t("modelFieldHint"), end);
		};
		return h("div", {
			className: "dsh-zdd-pet-cfg__card",
			children: [
				cardHead(t("modelTitle"), t("modelHint")),
				failed ? h("p", {
					className: "dsh-zdd-pet-cfg__note",
					style: { color: "var(--dsw-alias-state-error-primary)" },
					children: t("modelCatalogFailed")
				}) : null,
				h("div", {
					className: "dsh-zdd-pet-cfg__grid2",
					children: [modelCell("whisperModel", props.whisperModel), modelCell("chatModel", props.chatModel, true)]
				}),
				h("div", {
					className: "dsh-zdd-pet-cfg__grid4",
					children: [numField("chatMemory", props.chatMemory, props.onChatMemoryChange), numField("chatImageLimit", props.chatImageLimit, props.onChatImageLimitChange)]
				})
			]
		});
	};
}

//#endregion
//#region src/client/settings/picker/model-rows.ts
function matchModelQuery(text, query) {
	const needle = query.trim().toLowerCase();
	if (needle === "") return true;
	let at = 0;
	for (const char of text.toLowerCase()) {
		if (char === needle[at]) at += 1;
		if (at >= needle.length) return true;
	}
	return false;
}
function buildModelRows(groups, query) {
	const needle = query.trim().toLowerCase();
	const rows = [];
	if (needle === "") rows.push({
		kind: "follow",
		key: "__follow"
	});
	for (const group of groups) {
		const models = group.models.filter((model) => matchModelQuery(model.name + " " + model.id, needle));
		if (models.length === 0 && !(needle === "" && group.models.length === 0)) continue;
		rows.push({
			kind: "group",
			key: group.id,
			name: group.name
		});
		if (models.length === 0) {
			rows.push({
				kind: "none",
				key: group.id + "/__none"
			});
			continue;
		}
		for (const model of models) rows.push({
			kind: "model",
			key: group.id + "/" + model.id,
			provider: group.id,
			model
		});
	}
	return rows;
}
function selectableIndexes(rows) {
	return rows.map((row, index) => row.kind === "group" || row.kind === "none" ? -1 : index).filter((i) => i >= 0);
}

//#endregion
//#region src/client/settings/picker/model-picker-placement.ts
/**
* 模型选择器浮层的定位计算：把触发器的实测矩形与视口尺寸换算成浮层的 fixed 坐标。
* 下方放不下且上方更宽裕时翻到上方，左右钳制在视口内，并给出高度上限——浮层自身不进文档流。
* 纯函数，不读 `window`：矩形与视口由调用方传入，便于单测与将来的视口外定位。
* @module dsh-zdd-pet/src/client/settings/picker/model-picker-placement
*/
/** 浮层与触发器、视口边缘之间的间距。 */
const PANEL_GAP_PX = 12;
/** 浮层离触发器的偏移，避免贴着触发器边框。 */
const PANEL_OFFSET_PX = 4;
/** 浮层宽度下限：再窄就装不下「服务商 + 模型」两段文字。 */
const MIN_WIDTH_PX = 240;
/** 浮层宽度上限：再宽会横跨整个设置页。 */
const MAX_WIDTH_PX = 420;
/** 视口更窄时宁可取整屏宽度，也不留出 16px 以外的余量。 */
const MIN_AVAILABLE_WIDTH_PX = 200;
/** 视口余量：浮层左右各留 8px，不贴死屏幕边。 */
const EDGE_MARGIN_PX = 8;
/** 视口更窄时浮层宽度的兜底余量。 */
const VIEWPORT_INSET_PX = 16;
/** 浮层高度上限，超出后清单自己滚动。 */
const MAX_HEIGHT_PX = 360;
/** 下方空间小于它才考虑翻到上方，否则即使靠近底部也优先向下展开。 */
const FLIP_THRESHOLD_PX = 240;
function computePanelPlacement(anchor, viewport) {
	const below = viewport.height - anchor.bottom - PANEL_GAP_PX;
	const above = anchor.top - PANEL_GAP_PX;
	const available = Math.max(MIN_AVAILABLE_WIDTH_PX, Math.min(MAX_WIDTH_PX, viewport.width - VIEWPORT_INSET_PX));
	const width = Math.min(Math.max(anchor.width, MIN_WIDTH_PX), available);
	const left = Math.max(EDGE_MARGIN_PX, Math.min(anchor.left, viewport.width - width - EDGE_MARGIN_PX));
	const openUp = below < FLIP_THRESHOLD_PX && above > below;
	return openUp ? {
		left,
		bottom: viewport.height - anchor.top + PANEL_OFFSET_PX,
		width,
		maxHeight: Math.min(MAX_HEIGHT_PX, above)
	} : {
		left,
		top: anchor.bottom + PANEL_OFFSET_PX,
		width,
		maxHeight: Math.min(MAX_HEIGHT_PX, below)
	};
}

//#endregion
//#region src/client/settings/picker/model-picker-panel.ts
function buildModelPanel(view) {
	const { h, t } = view;
	const emptyHint = view.catalog !== null && view.catalog.length === 0 ? t("modelNoModels") : view.rows.length === 0 ? t("modelEmpty") : "";
	return h("div", {
		ref: view.panelRef,
		className: "dsh-zdd-pet-mp__panel",
		role: "menu",
		"aria-label": view.label,
		style: {
			left: view.pos.left + "px",
			top: view.pos.top === void 0 ? void 0 : view.pos.top + "px",
			bottom: view.pos.bottom === void 0 ? void 0 : view.pos.bottom + "px",
			width: view.pos.width + "px",
			maxHeight: view.pos.maxHeight + "px"
		},
		children: [searchNode(view), view.catalog === null ? statusNode(h, "loading", view.failed ? t("modelCatalogFailed") : t("modelLoading"), false) : emptyHint !== "" ? statusNode(h, "empty", emptyHint, true) : h("div", {
			key: "list",
			className: "dsh-zdd-pet-mp__list",
			role: "group",
			children: view.rows.map((row, index) => rowNode(view, row, index))
		})]
	});
}
/** 三态提示行：加载中 / 失败 / 空结果。 */
function statusNode(h, key, text, live) {
	return h("div", {
		key,
		className: "dsh-zdd-pet-mp__status",
		role: live ? "status" : void 0,
		children: text
	});
}
/** 搜索框：↑↓ 走行、Enter 选中，Esc 由浮层级的 document 监听处理。 */
function searchNode(view) {
	const { h, t } = view;
	return h("input", {
		key: "search",
		type: "text",
		className: "dsh-zdd-pet-mp__search",
		role: "searchbox",
		placeholder: t("modelSearch"),
		"aria-label": t("modelSearch"),
		value: view.query,
		disabled: view.disabled,
		onChange: (event) => view.onQueryChange(event.target.value),
		onKeyDown: view.onKeyDown
	});
}
/** 一行：分组头、提示行、模型（可选、可高亮）。 */
function rowNode(view, row, index) {
	const { h, t } = view;
	if (row.kind === "group") return h("div", {
		key: row.key,
		className: "dsh-zdd-pet-mp__group",
		children: row.name
	});
	if (row.kind === "none") return h("div", {
		key: row.key,
		className: "dsh-zdd-pet-mp__status",
		children: t("modelNone")
	});
	const checked = row.kind === "follow" ? view.value.provider === "" : view.value.provider === row.provider && view.value.model === row.model.id;
	return h("button", {
		key: row.key,
		type: "button",
		role: "menuitemradio",
		"aria-checked": checked,
		"data-row": index,
		className: "dsh-zdd-pet-mp__item" + (index === view.active ? " is-active" : ""),
		disabled: view.disabled,
		onClick: () => view.onPick(row),
		onMouseMove: () => view.onHover(index),
		children: [h("span", {
			key: "n",
			className: "dsh-zdd-pet-mp__name",
			children: row.kind === "follow" ? t("modelFollow") : row.model.name
		}), h("span", {
			key: "c",
			className: "dsh-zdd-pet-mp__check",
			children: checked ? "✓" : ""
		})]
	});
}

//#endregion
//#region src/client/settings/picker/model-picker.ts
function makeModelPicker(rt) {
	const { h, useState, useEffect, useRef, t } = rt;
	return function ModelPicker(props) {
		const [open, setOpen] = useState(false);
		const [query, setQuery] = useState("");
		const [active, setActive] = useState(0);
		const [pos, setPos] = useState(null);
		const rootRef = useRef(null);
		const panelRef = useRef(null);
		const groups = props.catalog ?? [];
		const group = groups.find((g) => g.id === props.value.provider);
		const picked = group?.models.find((m) => m.id === props.value.model);
		const isFollow = props.value.provider === "";
		const triggerLabel = isFollow ? t("modelFollow") : picked?.name ?? props.value.model;
		const triggerSub = isFollow ? "" : group?.name ?? props.value.provider + t("modelUnknown");
		const rows = buildModelRows(groups, query);
		const selectable = selectableIndexes(rows);
		const commit = (value) => {
			props.onChange(value);
			setOpen(false);
			setQuery("");
		};
		const pick$1 = (row) => {
			if (!row) return;
			if (row.kind === "follow") commit({
				provider: "",
				model: ""
			});
			else if (row.kind === "model") commit({
				provider: row.provider,
				model: row.model.id
			});
		};
		const step = (dir) => {
			if (selectable.length === 0) return;
			const at = selectable.indexOf(active);
			const next = selectable[at < 0 ? 0 : (at + dir + selectable.length) % selectable.length];
			setActive(next);
			panelRef.current?.querySelector("[data-row=\"" + next + "\"]")?.scrollIntoView({ block: "nearest" });
		};
		useEffect(() => {
			if (!open) return;
			const el = rootRef.current;
			const place = () => {
				if (!el) return;
				setPos(computePanelPlacement(el.getBoundingClientRect(), {
					width: window.innerWidth,
					height: window.innerHeight
				}));
			};
			place();
			panelRef.current?.querySelector("input")?.focus();
			const onDown = (e) => {
				const target = e.target;
				if (target && (rootRef.current?.contains(target) === true || panelRef.current?.contains(target) === true)) return;
				setOpen(false);
			};
			const onKey = (e) => {
				if (e.key === "Escape") setOpen(false);
			};
			document.addEventListener("mousedown", onDown, true);
			document.addEventListener("keydown", onKey, true);
			window.addEventListener("scroll", place, true);
			window.addEventListener("resize", place);
			return () => {
				document.removeEventListener("mousedown", onDown, true);
				document.removeEventListener("keydown", onKey, true);
				window.removeEventListener("scroll", place, true);
				window.removeEventListener("resize", place);
			};
		}, [open]);
		const toggle = () => {
			if (props.disabled) return;
			if (!open) {
				setQuery("");
				const at = rows.findIndex((r) => r.kind === "model" && r.provider === props.value.provider && r.model.id === props.value.model);
				setActive(at >= 0 ? at : 0);
			}
			setOpen(!open);
		};
		const panel = open && pos ? buildModelPanel({
			h,
			t,
			label: props.label,
			disabled: props.disabled,
			catalog: props.catalog,
			failed: props.failed,
			rows,
			active,
			query,
			value: props.value,
			pos,
			panelRef,
			onQueryChange: (value) => {
				setQuery(value);
				setActive(selectable.length > 0 ? selectable[0] : 0);
			},
			onPick: pick$1,
			onHover: setActive,
			onKeyDown: (event) => {
				if (event.key === "ArrowDown") {
					event.preventDefault();
					step(1);
				} else if (event.key === "ArrowUp") {
					event.preventDefault();
					step(-1);
				} else if (event.key === "Enter") {
					event.preventDefault();
					pick$1(rows[active]);
				}
			}
		}) : null;
		return h("div", {
			ref: rootRef,
			className: "dsh-zdd-pet-mp",
			children: [h("button", {
				key: "trigger",
				type: "button",
				className: "dsh-zdd-pet-mp__trigger",
				disabled: props.disabled,
				"aria-haspopup": "menu",
				"aria-expanded": open,
				"aria-label": t("modelTriggerAria").replace("{model}", triggerLabel),
				onClick: toggle,
				children: [
					h("span", {
						key: "l",
						className: "dsh-zdd-pet-mp__label",
						children: triggerLabel
					}),
					triggerSub ? h("span", {
						key: "s",
						className: "dsh-zdd-pet-mp__sub",
						children: triggerSub
					}) : null,
					h("span", {
						key: "c",
						className: "dsh-zdd-pet-mp__chevron" + (open ? " is-open" : ""),
						children: "▾"
					})
				]
			}), panel]
		});
	};
}

//#endregion
//#region src/client/settings/notify-test.ts
async function runNotificationTest(deps) {
	const { t, report } = deps;
	report({
		kind: "",
		text: ""
	});
	const result = await requestNotificationPermission();
	if (!result.ok) {
		const reason = result.reason === "unsupported" ? t("notifyDenyUnsupported") : result.reason === "denied" ? t("notifyDenyBlocked") : result.reason === "rejected" ? t("notifyDenyRejected") : t("notifyDenyError") + (result.message ? "：" + result.message : "");
		report({
			kind: "err",
			text: reason + (result.reason === "unsupported" ? "" : " " + t("notifyGuide"))
		});
		return;
	}
	try {
		wireNotificationClick(new Notification("测试通知", {
			body: "【dsh-zdd-pet】系统通知已就绪。",
			icon: NOTIFY_ICONS.test
		}));
	} catch {}
	report({
		kind: "ok",
		text: t("notifyTestOk")
	});
}

//#endregion
//#region src/client/settings/kind-tabs.ts
function makeKindTabs(rt) {
	const { h, t } = rt;
	return function KindTabs(props) {
		return h("div", {
			className: "dsh-zdd-pet-cfg__kinds",
			children: [h("span", {
				key: "label",
				className: "dsh-zdd-pet-cfg__tabsLabel",
				children: t("kindLabel")
			}), ...props.kinds.map((item) => h("button", {
				key: item.entry,
				type: "button",
				disabled: props.busy,
				onClick: () => props.onSelect(item.entry),
				className: "dsh-zdd-pet-cfg__tab" + (item.entry === props.kind ? " is-active" : ""),
				children: (item.kind === "main" ? t("kindMain") : item.entry) + " (" + item.count + ")"
			}))]
		});
	};
}

//#endregion
//#region src/client/settings/paths-cards.ts
function makePathsCards(rt) {
	const { h, t } = rt;
	const { cardHead } = makeUiKit({
		h,
		t
	});
	function ConfigMetaCard(props) {
		const { paths } = props;
		const line = (key, value, suffix = "") => value === void 0 ? null : h("div", {
			key,
			className: "dsh-zdd-pet-cfg__path",
			children: t(key) + "：" + value + suffix
		});
		return h("div", {
			className: "dsh-zdd-pet-cfg__card",
			children: [
				cardHead(t("configMeta"), t("configMetaHint")),
				line("defaultConfig", paths.default),
				line("userConfig", paths.user),
				line("animationDir", paths.animations),
				line("memesDir", paths.memes),
				line("logFile", paths.logs),
				paths.logs ? h("div", {
					className: "dsh-zdd-pet-cfg__note",
					children: t("logFileNote")
				}) : null
			]
		});
	}
	function StorageCard(props) {
		const { paths } = props;
		const storage = paths.storage ?? [];
		if (storage.length === 0) return null;
		const profileName = paths.profile || "<profile>";
		const pluginName = "dsh-zdd-pet";
		const profileDir = paths.user.includes("/") ? paths.user.slice(0, paths.user.lastIndexOf("/")) : "<profile 目录>";
		const fill = (text) => text.replace(/\{name\}/g, pluginName).replace(/\{profileDir\}/g, profileDir).replace(/\{profile\}/g, profileName);
		return h("div", {
			className: "dsh-zdd-pet-cfg__card",
			children: [
				cardHead(t("storageTitle"), t("storageHint")),
				...storage.map((entry) => h("div", {
					key: entry.key,
					className: "dsh-zdd-pet-cfg__path",
					children: [h("b", {
						key: "p",
						style: { fontFamily: MONO_STACK },
						children: entry.path
					}), h("span", {
						key: "d",
						children: " — " + t("storage." + entry.key) + (entry.exists === false ? t("storageMissing") : "")
					})]
				})),
				h("div", {
					key: "ut",
					className: "dsh-zdd-pet-cfg__cardTitle",
					style: { marginTop: "4px" },
					children: t("uninstallTitle")
				}),
				h("div", {
					key: "u1",
					className: "dsh-zdd-pet-cfg__note",
					children: fill(t("uninstallStep1"))
				}),
				h("div", {
					key: "u2",
					className: "dsh-zdd-pet-cfg__note",
					children: fill(t("uninstallStep2"))
				}),
				h("div", {
					key: "cmd",
					className: "dsh-zdd-pet-cfg__cmd",
					children: fill(t("uninstallCmd"))
				}),
				h("div", {
					key: "u3",
					className: "dsh-zdd-pet-cfg__note",
					children: fill(t("uninstallStep3"))
				}),
				h("div", {
					key: "u4",
					className: "dsh-zdd-pet-cfg__note",
					children: fill(t("uninstallStep4"))
				})
			]
		});
	}
	return {
		ConfigMetaCard,
		StorageCard
	};
}

//#endregion
//#region src/shared/config.ts
const PET_DISPLAYS = [
	"web",
	"desktop",
	"both",
	"none"
];
const isWebVisible = (display) => display === "web" || display === "both";
function flattenConfigPets(merged) {
	const out = [];
	for (const [entry, conf] of Object.entries(merged)) {
		const list = Array.isArray(conf?.pets) ? conf.pets : [];
		for (const p of list) out.push({
			...p,
			animations: conf.animations,
			animationWeights: conf.animationWeights,
			eventsRefreshSec: conf.eventsRefreshSec,
			physics: conf.physics,
			font: conf.font,
			confineToScreen: conf.confineToScreen,
			workStatusTexts: conf.workStatusTexts,
			clickTexts: conf.clickTexts,
			rest: conf.rest,
			celebrate: conf.celebrate,
			mood: conf.mood,
			whisperModel: conf.whisperModel,
			chatModel: conf.chatModel,
			assetRoot: entry,
			extra: entry !== "main"
		});
	}
	return out;
}

//#endregion
//#region src/client/settings/pet-card.ts
/** 四个角落的固定顺序；文案走 `corner.<corner>`。 */
const CORNERS = [
	"top-left",
	"top-right",
	"bottom-left",
	"bottom-right"
];
function makePetCard(rt) {
	const { h, t } = rt;
	const { tip, q, field, toggleCell } = makeUiKit({
		h,
		t
	});
	/** 宠物数值输入（大小 / 水平偏移 / 垂直偏移）；宽度交给栅格。 */
	const numInput = (key, value, disabled, setter) => h("input", {
		type: "number",
		className: INPUT_CLASS,
		step: key === "size" ? "10" : "1",
		min: key === "size" ? "120" : "",
		value: String(value),
		disabled,
		onChange: (e) => setter(Number(e.target.value))
	});
	return function PetCard(props) {
		const { pet, busy, msg } = props;
		if (pet === null) return h("p", {
			className: "dsh-zdd-pet-cfg__note",
			children: t("emptyPets")
		});
		return h("div", {
			className: "dsh-zdd-pet-cfg__card",
			children: [
				h("div", {
					className: "dsh-zdd-pet-cfg__cardHead",
					children: [
						h("span", {
							key: "t",
							className: "dsh-zdd-pet-cfg__cardTitle",
							children: t("petCardTitle")
						}),
						q(t("petCardHint")),
						h("div", {
							key: "acts",
							style: {
								marginLeft: "auto",
								display: "flex",
								alignItems: "center",
								gap: "6px"
							},
							children: [
								msg.text ? h("span", {
									key: "msg",
									className: "dsh-zdd-pet-cfg__msg" + (msg.kind === "err" ? " is-err" : ""),
									children: msg.text
								}) : null,
								h("button", {
									key: "sv",
									type: "button",
									onClick: props.onSave,
									disabled: busy,
									className: "dsh-zdd-pet-cfg__btn is-primary is-sm",
									...tip(t("saveHotkey")),
									children: t("save")
								}),
								h("button", {
									key: "rm",
									type: "button",
									onClick: props.onRemove,
									disabled: busy,
									className: "dsh-zdd-pet-cfg__btn is-danger is-sm",
									children: t("remove")
								})
							]
						})
					]
				}),
				h("div", {
					className: "dsh-zdd-pet-cfg__grid3",
					children: [
						field(t("nameLabel"), h("input", {
							type: "text",
							className: INPUT_CLASS,
							value: String(pet.name ?? ""),
							disabled: busy,
							maxLength: 50,
							onChange: (e) => props.onChange({ name: e.target.value })
						}), t("nameHint")),
						field(t("sizeLabel"), numInput("size", pet.size, busy, (v) => props.onChange({ size: v })), t("sizeHint")),
						field(t("displayLabel"), h("select", {
							className: INPUT_CLASS,
							value: pet.display,
							disabled: busy,
							onChange: (e) => props.onChange({ display: e.target.value }),
							children: PET_DISPLAYS.map((d) => h("option", {
								key: d,
								value: d,
								children: t("display." + d)
							}))
						}), t("displayHint"), true)
					]
				}),
				h("div", {
					className: "dsh-zdd-pet-cfg__grid3",
					children: [
						field(t("cornerLabel"), h("select", {
							className: INPUT_CLASS,
							value: pet.position.corner,
							disabled: busy,
							onChange: (e) => props.onChange({ position: { corner: e.target.value } }),
							children: CORNERS.map((c) => h("option", {
								key: c,
								value: c,
								children: t("corner." + c)
							}))
						}), t("cornerHint")),
						field(t("marginX"), numInput("marginX", pet.position.marginX, busy, (v) => props.onChange({ position: { marginX: v } })), t("marginXHint")),
						field(t("marginY"), numInput("marginY", pet.position.marginY, busy, (v) => props.onChange({ position: { marginY: v } })), t("marginYHint"), true)
					]
				}),
				h("div", {
					className: "dsh-zdd-pet-cfg__grid4",
					children: [
						toggleCell("balanceEnabled", !!pet.balanceEnabled, busy, (v) => props.onChange({ balanceEnabled: v })),
						toggleCell("whisperEnabled", !!pet.whisperEnabled, busy, (v) => props.onChange({ whisperEnabled: v })),
						toggleCell("workStatusEnabled", !!pet.workStatusEnabled, busy, (v) => props.onChange({ workStatusEnabled: v })),
						toggleCell("fixedEnabled", !!pet.fixedEnabled, busy, (v) => props.onChange({ fixedEnabled: v }), true)
					]
				}),
				field(t("personaLabel"), h("div", {
					className: "dsh-zdd-pet-cfg__persona",
					children: [h("textarea", {
						className: INPUT_CLASS + " dsh-zdd-pet-cfg__area",
						rows: 3,
						value: String(pet.whisperPrompt ?? ""),
						disabled: busy,
						placeholder: props.entryPrompt,
						onChange: (e) => props.onChange({ whisperPrompt: e.target.value })
					}), h("span", {
						className: "dsh-zdd-pet-cfg__count",
						children: t("personaCount").replace("{n}", String(String(pet.whisperPrompt ?? "").length))
					})]
				}), t("personaHint"))
			]
		});
	};
}

//#endregion
//#region src/client/settings/pet-tabs.ts
function makePetTabs(rt) {
	const { h, t } = rt;
	return function PetTabs(props) {
		return h("div", {
			className: "dsh-zdd-pet-cfg__tabs",
			children: [
				h("span", {
					key: "label",
					className: "dsh-zdd-pet-cfg__tabsLabel",
					children: t("petsLabel")
				}),
				...props.pets.map((pet) => h("button", {
					key: pet.id,
					type: "button",
					onClick: () => props.onSelect(pet.id),
					className: "dsh-zdd-pet-cfg__tab" + (pet.id === props.selId ? " is-active" : ""),
					children: (pet.name || pet.id) + " (" + pet.size + "px)"
				})),
				h("button", {
					key: "add",
					type: "button",
					onClick: props.onAdd,
					disabled: props.busy,
					className: "dsh-zdd-pet-cfg__tab is-ghost",
					children: "+ " + t("add")
				})
			]
		});
	};
}

//#endregion
//#region src/client/settings/physics-card.ts
function makePhysicsCard(rt) {
	const { h, t } = rt;
	const { cardHead, field, toggleCell } = makeUiKit({
		h,
		t
	});
	return function PhysicsCard(props) {
		const { busy, physics } = props;
		/** 物理参数的一格：标签与问号在上、数字输入在下。 */
		const physField = (key, step, min, end = false) => field(t("physics." + key), h("input", {
			type: "number",
			className: INPUT_CLASS,
			step,
			min,
			value: String(physics[key]),
			disabled: busy,
			onChange: (e) => props.onChange({ [key]: Number(e.target.value) })
		}), t("physics." + key + "Hint"), end);
		return h("div", {
			className: "dsh-zdd-pet-cfg__card",
			children: [
				cardHead(t("physicsTitle"), t("physicsHint")),
				h("div", {
					className: "dsh-zdd-pet-cfg__grid4",
					children: [
						physField("gravity", "50", "0"),
						physField("restitution", "0.01", "0"),
						physField("groundFriction", "0.1", "0"),
						physField("throwPower", "0.05", "0.05", true)
					]
				}),
				h("div", {
					className: "dsh-zdd-pet-cfg__grid2",
					children: [toggleCell("physicsCeilingBounce", physics.ceilingBounce, busy, (v) => props.onChange({ ceilingBounce: v })), toggleCell("physicsPetCollision", physics.petCollision, busy, (v) => props.onChange({ petCollision: v }), true)]
				})
			]
		});
	};
}

//#endregion
//#region src/client/settings/pomodoro-card.ts
/** 下拉值编码：「关闭」用 'off'，其余是分钟数的字符串。 */
const OFF = "off";
/** 把当前值补进预设（手改过 config 的值不能在下拉里丢失）。 */
function withCurrent(presets, current) {
	const out = [...presets];
	if (!out.includes(current)) {
		out.push(current);
		out.sort((a, b) => a - b);
	}
	return out;
}
function makePomodoroCard(rt) {
	const { h, t } = rt;
	const { cardHead, field, toggleCell } = makeUiKit({
		h,
		t
	});
	return function PomodoroCard(props) {
		const { busy, pomodoro } = props;
		const focusValue = pomodoro.enabled ? String(pomodoro.intervalMin) : OFF;
		const focusOptions = [OFF, ...withCurrent(POMODORO_PRESET_INTERVALS_MIN, pomodoro.intervalMin).map(String)];
		const breakMin = pomodoro.breakMin ?? POMODORO_DEFAULT_BREAK_MIN;
		const longBreakMin = pomodoro.longBreakMin ?? POMODORO_DEFAULT_LONG_BREAK_MIN;
		const rounds = pomodoro.roundsBeforeLongBreak ?? POMODORO_DEFAULT_ROUNDS;
		const breakOptions = withCurrent(POMODORO_PRESET_BREAKS_MIN, breakMin);
		const longOptions = withCurrent(POMODORO_PRESET_BREAKS_MIN, longBreakMin);
		const onFocus = (e) => {
			const v = e.target.value;
			if (v === OFF) props.onChange({ enabled: false });
			else props.onChange({
				enabled: true,
				intervalMin: Number(v)
			});
		};
		const onBreak = (e) => props.onChange({ breakMin: Number(e.target.value) });
		const onLongBreak = (e) => props.onChange({ longBreakMin: Number(e.target.value) });
		const onRounds = (e) => {
			const n = Number(e.target.value);
			if (Number.isFinite(n)) props.onChange({ roundsBeforeLongBreak: n });
		};
		return h("div", {
			className: "dsh-zdd-pet-cfg__card",
			children: [
				cardHead(t("pomodoroTitle"), t("pomodoroHint")),
				h("div", {
					className: "dsh-zdd-pet-cfg__grid2",
					children: [field(t("pomodoroLabel"), h("select", {
						className: INPUT_CLASS,
						value: focusValue,
						disabled: busy,
						onChange: onFocus,
						children: focusOptions.map((opt) => h("option", {
							key: opt,
							value: opt,
							children: opt === OFF ? t("pomodoroOff") : t("pomodoroEvery").replace("{n}", opt)
						}))
					}), t("pomodoroLabelHint")), field(t("pomodoroBreakLabel"), h("select", {
						className: INPUT_CLASS,
						value: String(breakMin),
						disabled: busy,
						onChange: onBreak,
						children: breakOptions.map((opt) => h("option", {
							key: opt,
							value: String(opt),
							children: t("pomodoroEvery").replace("{n}", String(opt))
						}))
					}), t("pomodoroBreakHint"))]
				}),
				h("div", {
					className: "dsh-zdd-pet-cfg__grid2",
					children: [field(t("pomodoroLongBreakLabel"), h("select", {
						className: INPUT_CLASS,
						value: String(longBreakMin),
						disabled: busy,
						onChange: onLongBreak,
						children: longOptions.map((opt) => h("option", {
							key: opt,
							value: String(opt),
							children: t("pomodoroEvery").replace("{n}", String(opt))
						}))
					}), t("pomodoroLongBreakHint")), field(t("pomodoroRoundsLabel"), h("input", {
						type: "number",
						className: INPUT_CLASS,
						min: "1",
						max: "24",
						step: "1",
						value: String(rounds),
						disabled: busy,
						onChange: onRounds
					}), t("pomodoroRoundsHint"))]
				}),
				h("div", {
					className: "dsh-zdd-pet-cfg__grid2",
					children: [toggleCell("pomodoroAutoBreak", pomodoro.autoStartBreak !== false, busy, (v) => props.onChange({ autoStartBreak: v })), toggleCell("pomodoroAutoFocus", pomodoro.autoStartFocus === true, busy, (v) => props.onChange({ autoStartFocus: v }))]
				})
			]
		});
	};
}

//#endregion
//#region src/client/settings/greeting-card.ts
function makeGreetingCard(rt) {
	const { h, t } = rt;
	const { cardHead, field, toggleCell } = makeUiKit({
		h,
		t
	});
	return function GreetingCard(props) {
		const { busy, greeting } = props;
		const poolMode = greeting.mode === "pool";
		return h("div", {
			className: "dsh-zdd-pet-cfg__card",
			children: [
				cardHead(t("greetingTitle"), t("greetingHint")),
				h("div", {
					className: "dsh-zdd-pet-cfg__grid2",
					children: [toggleCell("greetingEnabled", greeting.enabled, busy, (v) => props.onChange({ enabled: v }))]
				}),
				h("div", {
					className: "dsh-zdd-pet-cfg__grid2",
					children: [field(t("greetingMode"), h("select", {
						className: INPUT_CLASS,
						value: greeting.mode,
						disabled: busy,
						onChange: (e) => props.onChange({ mode: e.target.value === "live" ? "live" : "pool" }),
						children: [h("option", {
							key: "pool",
							value: "pool",
							children: t("greetingModePool")
						}), h("option", {
							key: "live",
							value: "live",
							children: t("greetingModeLive")
						})]
					}), t("greetingModeHint")), field(t("greetingPoolSize"), h("input", {
						type: "number",
						className: INPUT_CLASS,
						min: String(GREETING_POOL_MIN),
						max: String(GREETING_POOL_MAX),
						step: "1",
						value: String(greeting.poolSize),
						disabled: busy || !poolMode,
						onChange: (e) => props.onChange({ poolSize: Number(e.target.value) })
					}), t("greetingPoolSizeHint"), true)]
				})
			]
		});
	};
}

//#endregion
//#region src/client/settings/mood-card.ts
function makeMoodCard(rt) {
	const { h, t } = rt;
	const { cardHead, field, toggleCell } = makeUiKit({
		h,
		t
	});
	return function MoodCard(props) {
		const { busy, mood } = props;
		/** 0~100 的数字输入。 */
		const numInput = (key, value) => h("input", {
			type: "number",
			className: INPUT_CLASS,
			step: "1",
			min: "0",
			max: "100",
			value: String(value),
			disabled: busy,
			onChange: (e) => {
				const n = Number(e.target.value);
				if (Number.isFinite(n)) props.onChange({ [key]: n });
			}
		});
		return h("div", {
			className: "dsh-zdd-pet-cfg__card",
			children: [
				cardHead(t("moodTitle"), t("moodHint")),
				toggleCell("moodEnabled", mood.enabled, busy, (v) => props.onChange({ enabled: v })),
				h("div", {
					className: "dsh-zdd-pet-cfg__grid3",
					children: [
						field(t("moodInitial"), numInput("initial", mood.initial), t("moodInitialHint")),
						field(t("moodTouchGain"), numInput("touchGain", mood.touchGain), t("moodTouchGainHint")),
						field(t("moodDecay"), numInput("decayPerHour", mood.decayPerHour), t("moodDecayHint"))
					]
				}),
				h("div", {
					className: "dsh-zdd-pet-cfg__grid3",
					children: [field(t("moodLow"), numInput("low", mood.low), t("moodLowHint")), field(t("moodHigh"), numInput("high", mood.high), t("moodHighHint"))]
				})
			]
		});
	};
}

//#endregion
//#region src/client/settings/pet-draft.ts
function nextPetId(list, kind = "main") {
	const prefix = kind === "main" ? "pet" : kind;
	for (let n = 2;; n += 1) {
		const id = prefix + "-" + n;
		if (!list.some((pet) => pet.id === id)) return id;
	}
}
function draftPet(template, id) {
	return {
		id,
		name: id,
		size: template.size,
		balanceEnabled: template.balanceEnabled,
		whisperEnabled: template.whisperEnabled,
		workStatusEnabled: template.workStatusEnabled,
		fixedEnabled: template.fixedEnabled,
		display: template.display,
		position: { ...template.position }
	};
}

//#endregion
//#region src/client/settings/use-pet-list.ts
function petKinds(pets) {
	const order = [];
	const counts = new Map();
	for (const pet of pets) {
		const entry = pet.assetRoot ?? "main";
		if (!counts.has(entry)) order.push(entry);
		counts.set(entry, (counts.get(entry) ?? 0) + 1);
	}
	return order.map((entry) => ({
		entry,
		kind: entry === "main" ? "main" : "pack",
		count: counts.get(entry) ?? 0
	}));
}
function mainPetsOf(pets) {
	return pets.filter((pet) => (pet.assetRoot ?? "main") === "main");
}
function usePetList(rt, requestDialog) {
	const { useState, useCallback, useRef } = rt;
	const initial = petBridge.current;
	const [pets, setPets] = useState(initial.map((pet) => ({
		...pet,
		position: { ...pet.position }
	})));
	const [kind, setKind] = useState(initial[0]?.assetRoot ?? "main");
	const [selId, setSelId] = useState(initial[0]?.id ?? "");
	const loadedRef = useRef([]);
	const kindRef = useRef(kind);
	kindRef.current = kind;
	const update = (patch) => setPets((list) => list.map((pet) => {
		if (pet.id !== selId) return pet;
		const { position: posPatch,...rest } = patch;
		return {
			...pet,
			...rest,
			position: posPatch ? {
				...pet.position,
				...posPatch
			} : pet.position
		};
	}));
	const add = () => {
		const group = pets.filter((pet) => (pet.assetRoot ?? "main") === kind);
		const template = group[0];
		if (!template) return;
		const id = nextPetId(pets, kind);
		const draft = {
			...draftPet(template, id),
			assetRoot: kind
		};
		setPets((list) => {
			const next = [...list];
			let at = -1;
			for (let i = 0; i < next.length; i += 1) if ((next[i].assetRoot ?? "main") === kind) at = i;
			next.splice(at + 1, 0, draft);
			return next;
		});
		setSelId(id);
	};
	const remove = () => {
		const list = pets.filter((pet) => pet.id !== selId);
		setPets(list);
		setSelId(list[0]?.id ?? "");
	};
	const replace = useCallback((entries) => {
		loadedRef.current = entries;
		const loaded = entries.flatMap((entry) => entry.pets);
		const nextKind = entries.some((entry) => entry.key === kindRef.current) ? kindRef.current : entries[0]?.key ?? "main";
		setPets(loaded);
		setKind(nextKind);
		setSelId((id) => {
			if (loaded.some((pet) => pet.id === id)) return id;
			return loaded.find((pet) => (pet.assetRoot ?? "main") === nextKind)?.id ?? "";
		});
	}, []);
	const selectKind = (entry) => {
		setKind(entry);
		const first = pets.find((pet) => (pet.assetRoot ?? "main") === entry);
		if (first) setSelId(first.id);
	};
	const current = pets.find((pet) => pet.id === selId);
	const entryPrompt = loadedRef.current.find((item) => item.key === kind)?.entryPrompt ?? "";
	const requestRemove = () => {
		if (!current) return;
		const entry = current.assetRoot ?? "main";
		const groupSize = pets.filter((pet) => (pet.assetRoot ?? "main") === entry).length;
		if (groupSize <= 1) requestDialog(entry === "main" ? { kind: "lastOne" } : {
			kind: "lastOfKind",
			entry
		});
		else requestDialog({ kind: "remove" });
	};
	return {
		pets,
		mainPets: mainPetsOf(pets),
		kinds: petKinds(pets),
		kind,
		visiblePets: pets.filter((pet) => (pet.assetRoot ?? "main") === kind),
		selId,
		entryPrompt,
		select: setSelId,
		selectKind,
		update,
		add,
		requestRemove,
		remove,
		replace,
		packWrites: () => diffPackWrites(loadedRef.current, pets)
	};
}

//#endregion
//#region src/client/settings/use-remote-data.ts
function useRemoteData(rt) {
	const { useState, useEffect } = rt;
	const [paths, setPaths] = useState(null);
	const [catalog, setCatalog] = useState(null);
	const [catalogFailed, setCatalogFailed] = useState(false);
	useEffect(() => {
		let alive = true;
		loadMeta().then((meta) => {
			if (alive) setPaths(meta);
		});
		return () => {
			alive = false;
		};
	}, []);
	useEffect(() => {
		let alive = true;
		loadModelCatalog().then((groups) => {
			if (!alive) return;
			if (groups === null) setCatalogFailed(true);
			else setCatalog(groups);
		});
		return () => {
			alive = false;
		};
	}, []);
	return {
		paths,
		catalog,
		catalogFailed
	};
}

//#endregion
//#region src/client/settings/locales.ts
const NS = "pet.config";
const zh = {
	nav: "桌宠配置",
	intro: "管理多个桌宠：每个宠物可独立设置大小与位置（保存后即时生效）。",
	petCardTitle: "宠物配置",
	petCardHint: "每只宠物独立配置：名字 / 大小 / 显示位置 / 位置 / 偏移 / 四个功能开关。改完点最下面的「保存」即时生效。",
	globalTitle: "全局开关",
	globalHint: "所有宠物共用（pet pack 可在自己种类文件里单独覆盖）。这几个开关只改本地状态，随「保存」整包写入用户配置（不做即时写入）；系统通知在保存后即时重读，无需刷新页面。",
	cornerHint: "宠物贴着屏幕的哪个角（桌面端按各自显示器的工作区算）。",
	marginXHint: "距所选角落的水平距离（px），可为任意数字。",
	marginYHint: "距所选角落的垂直距离（px），可为任意数字。",
	"cmd.chat": "对话",
	"cmd.pet": "桌宠",
	"cmd.balance": "余额",
	petsLabel: "宠物列表",
	add: "添加宠物",
	remove: "删除",
	confirmRemove: "确定删除宠物「{id}」吗？",
	confirmTitle: "确认操作",
	cancel: "取消",
	ok: "知道了",
	atLeastOne: "至少保留一个宠物。",
	emptyPets: "暂无宠物，点击「添加宠物」创建。",
	sizeLabel: "大小（宽度 px）",
	sizeHint: "高度自动 = 宽度 × 9/16。",
	nameLabel: "名字",
	nameHint: "显示名：鼠标悬浮宠物时弹出，也会加进 AI 人设（你的名字是 X）。可重复，留空按宠物 id 处理。",
	personaLabel: "人设（可选）",
	personaHint: "只影响这只宠物。留空 = 跟随所属条目的人设——输入框里的灰色文字就是那份内容。实际发给模型的 system = 这段 + 自动追加的「你的名字是“<名字>”」+ 当前时间背景，所以别在这里再写名字和日期。",
	personaCount: "{n} 字",
	balanceEnabled: "余额功能",
	balanceEnabledHint: "启用后该宠物触发余额动画并显示余额气泡。",
	whisperEnabled: "碎碎念",
	whisperEnabledHint: "启用后该宠物按周期用 AI 生成一句话并播碎碎念动画（人设见下方「人设」框，留空跟随条目）。",
	workStatusEnabled: "工作状态联动",
	workStatusEnabledHint: "启用后该宠物跟随 DSH 工作状态：思考/工作中/等待确认/完成/出错时自动切对应动画并弹气泡（动画池在配置顶层，仅监听不调用模型）。",
	fixedEnabled: "宠物固定",
	fixedEnabledHint: "启用后随机动画不再让宠物自己转向或走开，只播原地待机与随机小动作；右键菜单点播、接口触发、余额/碎碎念/工作状态动画不受影响。",
	displayLabel: "显示位置",
	displayHint: "web=仅浏览器 / desktop=仅桌面 / both=两者都显示 / none=都不显示",
	"display.web": "仅浏览器",
	"display.desktop": "仅桌面",
	"display.both": "两者都显示",
	"display.none": "都不显示",
	cornerLabel: "位置",
	"corner.top-left": "左上角",
	"corner.top-right": "右上角",
	"corner.bottom-left": "左下角",
	"corner.bottom-right": "右下角",
	marginX: "水平偏移",
	marginY: "垂直偏移",
	save: "保存",
	saveHotkey: "Ctrl+S / Cmd+S",
	sync: "同步",
	confirmSync: "确定同步吗？将用项目内置的默认配置（完整字段 + 注释）覆盖用户配置，当前的自定义内容会丢失。",
	corruptTitle: "用户配置已损坏，未保存",
	corruptConfirm: "强行保存",
	corruptBody: "用户配置文件解析不了（内容已损坏，不是合法 JSON/JSONC）：{path}。继续保存会按白名单重建这个文件——它里面现有的内容（animations / physics / memes 等自定义字段）会全部丢失。取消 = 不动文件（先去把配置改回合法再保存）；确认 = 强行保存（丢弃文件里现有的内容）。",
	syncHint: "「同步」会把项目内置的默认配置（含注释与全部高级字段）写入用户配置文件，覆盖当前自定义内容；之后可直接编辑该文件。注意两点：① 文件一旦生成即为显式覆盖层——插件升级后内置默认的变化不会自动生效（除非再次同步或删除该文件）；② 在本页点「保存」会按白名单重写该文件（字段值保留，但注释会被去掉）。",
	configMeta: "高级配置（文件）",
	configMetaHint: "用户配置可覆盖宠物列表 / 动画池 / 播放权重，修改后刷新或重启生效：浏览器端刷新页面，桌面端右键宠物 →「重载配置」（重载全部桌面宠物窗口）；默认配置为完整参考。",
	defaultConfig: "默认配置（只读，完整参考）",
	userConfig: "用户配置（自定义覆盖）",
	animationDir: "动画素材目录（可自定义/扩充动画）",
	memesDir: "表情包目录（可自定义/扩充配图）",
	logFile: "日志文件（排障用，可清空）",
	logFileNote: "桌面版没有控制台，插件的运行日志（启动、桌面宠物崩溃/重启、错误与告警）全部写进这一个文件；反馈问题请附上它。单文件上限 1 MB，写满只留最新的 512 KB。",
	saved: "已保存，桌宠即时生效。",
	loadError: "加载配置失败",
	saveError: "保存配置失败，请检查服务连接、配置目录的写入权限或服务日志。",
	saveInvalid: "保存配置失败：配置内容无效，请检查后重试。",
	syncError: "同步配置失败，请检查服务连接和配置目录的写入权限。",
	loading: "正在加载配置…",
	retry: "重试",
	invalid: "请检查输入：大小需为正数，边距可为任意数字。",
	busy: "保存中…",
	extraPetsHint: "另 {n} 个种类来自 pet/ 目录文件（<名>-config.json + <名>-animation/），在上方「种类」条里切换即可修改；保存会写回各自的角色包配置，不混进 main-config.jsonc。",
	kindLabel: "种类",
	kindMain: "内置",
	lastOfKind: "「{entry}」只剩这一只，删掉就没有这个种类了。要彻底移除请直接删除该角色包文件。",
	savePartial: "主宠物已保存，但 {names} 没能写回：检查该角色包配置是否合法、目录是否可写。",
	notifyToggle: "系统通知",
	notifyToggleHint: "对话完成 / 生成失败 / 权限申请 / 用户选择，在窗口失焦时弹出系统级通知（桌面右下角）。",
	clickSoundToggle: "点击音效",
	clickSoundToggleHint: "点一下宠物播一声内置音效（assets/sound/click-duck.wav，音量 0.5；100ms 内的连续点击只响一次，多开也不会叠音）。关掉即完全静音。随「保存」写入用户配置。",
	bubbleImageToggle: "气泡表情包",
	bubbleImageToggleHint: "总开关：控制所有气泡消息是否带表情包配图——碎碎念、对话、番茄钟、任务彩蛋、余额告急演出、启动吉祥话 统一受它管。关掉 = 全部只显示文字（更安静、省 token）；开 = 各功能按自己的逻辑配图（图片映射在配置文件顶层 memes）。",
	whisperImageToggle: "碎碎念配图",
	whisperImageToggleHint: "碎碎念时从表情包池随机抽一张，连同那句话一起显示（图片映射在配置文件顶层 memes）。token：碎碎念本来就每次生成都要调一次模型，配图只是把抽中那张的名称+描述（约 100 字符 / ≈60 token）加进同一次请求，增量可忽略。",
	chatImageToggle: "对话配图",
	chatImageToggleHint: "对话时由 AI 按当前语境从表情包池挑一张配图（可不挑；图片映射在配置文件顶层 memes）。token：每条消息都要把整张清单附进请求，当前约 1.1k 字符（≈650 token，约碎碎念配图的 11 倍），并随图片数量线性增长；关掉则一个字符都不附。",
	confineToggle: "锁定在当前屏幕",
	confineToggleHint: "多屏用户：开了之后宠物只在当前所在那块屏幕内活动——甩出去的宠物只在松手时所在那块屏内弹（屏缝当墙，不飞到隔壁屏），自主漫游也只在当前所在那块屏内走（越出屏缝的那一步直接取消）。关掉则照常跨屏飞行 / 跨屏行走。只影响桌面模式——浏览器 overlay 本来就只在视口内活动。",
	trayToggle: "系统托盘",
	trayToggleHint: "桌面模式启动后在通知区域（macOS 为菜单栏）常驻一个图标，列出配置里的全部宠物，勾选就能切换显示位置——包括当前不在桌面、没有窗口可右键的那些。关掉之后要把宠物叫回桌面，只能开浏览器用设置页，或在网页端那只宠物身上右键。Windows 本来就会把它折叠进「隐藏的图标」面板。仅影响桌面模式。",
	physicsTitle: "物理（拖拽抛掷手感）",
	physicsHint: "全局默认，所有宠物共用（pet pack 可在自己种类文件里单独覆盖）；随「保存」写入用户配置（不做即时写入）。浏览器保存后即时生效，桌面端由保存重载宠物窗口后生效。",
	"physics.gravity": "重力 gravity",
	"physics.gravityHint": "px/s²，越大落得越快；0 = 无重力（抛出去匀速直线飞）",
	"physics.restitution": "弹性 restitution",
	"physics.restitutionHint": "0~1，碰壁 / 落地反弹保留的速度比例（1 = 完全弹性，0 = 撞上即停）",
	"physics.groundFriction": "地面摩擦 groundFriction",
	"physics.groundFrictionHint": "/s，落地后水平速度的衰减率；0 = 冰面不减速",
	"physics.throwPower": "总力度 throwPower",
	"physics.throwPowerHint": "> 0，弹簧跟手与甩出初速的整体倍率（1 = 默认；越大越跟手、甩得越猛）",
	physicsCeilingBounce: "顶部反弹 ceilingBounce",
	physicsCeilingBounceHint: "关掉后抛掷可飞出屏幕顶部（重力仍会把它拉回来）",
	physicsPetCollision: "宠物互撞 petCollision",
	physicsPetCollisionHint: "飞行中的宠物撞到别的宠物按动量守恒弹开（质量 ∝ 尺寸²）",
	invalidPhysics: "请检查物理参数：重力 / 地面摩擦 ≥ 0，弹性 0~1，总力度 > 0。",
	fontTitle: "外观与字体",
	fontHint: "字体种类作用于现在用软糖体的全部文字：宠物气泡、悬浮提示、对话窗、得分弹窗；字号只作用于宠物气泡与悬浮提示（对话窗与得分弹窗的字号不变）。全局默认，所有宠物共用（pet pack 可在自己种类文件里单独覆盖）；随「保存」写入用户配置，浏览器保存后即时生效，桌面端由保存重载宠物窗口后生效。",
	fontFamilyLabel: "字体",
	fontFamilyHint: "「软糖体（内置）」随插件提供；其余为系统字体，机器上没装时自动回退到字体栈里的下一个（不会空白或报错）。",
	fontSizeLabel: "字号（px）",
	fontSizeHint: "气泡正文字号；悬浮提示与气泡内的小字按既有比例派生。范围 4~200。",
	fontFollowToggle: "字号随宠物大小缩放",
	fontFollowToggleHint: "开启（默认）：宠物调大时字号等比放大，462 宽时正好是上面设定的字号；关闭：字号恒定，不随宠物大小变化。",
	invalidFont: "请检查字体设置：字体需在下拉列表内，字号需为 4~200 的数字。",
	pomodoroTitle: "番茄钟 / 久坐提醒",
	pomodoroHint: "固定间隔到点让桌宠说一句（零 token）。全局默认，所有宠物共用（pet pack 可在自己种类文件里单独覆盖）；随「保存」写入用户配置，浏览器保存后即时生效，桌面端由保存重载后生效。",
	pomodoroLabel: "久坐提醒",
	pomodoroLabelHint: "选「关闭」停用；选某个分钟数即开启，并每隔这么久让桌宠提醒你起来动动。",
	pomodoroOff: "关闭",
	pomodoroEvery: "每 {n} 分钟",
	pomodoroBreakLabel: "休息时长",
	pomodoroBreakHint: "专注结束后休息多久；到点会提醒你回来继续。",
	pomodoroLongBreakLabel: "长休息时长",
	pomodoroLongBreakHint: "每完成若干轮专注后的较长休息。",
	pomodoroRoundsLabel: "每几轮长休息",
	pomodoroRoundsHint: "完成多少轮专注后进入长休息（1~24）。",
	pomodoroAutoBreak: "专注结束自动开始休息",
	pomodoroAutoBreakHint: "开启后专注一结束就自动开始倒计时休息；关闭则等你右键继续。",
	pomodoroAutoFocus: "休息结束自动开始专注",
	pomodoroAutoFocusHint: "开启后休息一结束就自动开始下一轮专注。",
	invalidPomodoro: "请检查番茄钟：间隔需为 1~1440 的数字。",
	greetingTitle: "启动吉祥话",
	greetingHint: "每次 DSH 启动时让宠物说一句吉利话（带表情包）。模型不可用时用内置几句兜底。",
	greetingEnabled: "启用启动吉祥话",
	greetingMode: "生成方式",
	greetingModeHint: "语言池：预生成一批存本地，每次随机抽一句（省 token）；每次生成：每次启动现调模型。",
	greetingModePool: "语言池（预生成，随机抽）",
	greetingModeLive: "每次实时生成",
	greetingPoolSize: "预生成句数",
	greetingPoolSizeHint: "语言池模式下预生成几句（1~200）；仅在「语言池」模式生效。",
	invalidGreeting: "请检查吉祥话设置：预生成句数需为 1~200 的整数。",
	moodTitle: "心情 / 亲密度",
	moodHint: "摸它会开心、久不理会低落；档位影响点击台词与空闲动作（开心会撒娇、低落更易叹气/打盹）。数值按宠物分别保存在本地。全局默认，所有宠物共用；随「保存」写入用户配置，浏览器即时生效，桌面端由保存重载后生效。",
	moodEnabled: "启用心情系统",
	moodEnabledHint: "关闭后不再累计心情，点击台词直接使用 clickTexts，空闲动作也不受心情影响。",
	moodInitial: "初始心情",
	moodInitialHint: "首次启用时的心情值（0~100）。",
	moodTouchGain: "摸一下涨多少",
	moodTouchGainHint: "每次点击宠物心情上涨的点数（0~100）。",
	moodDecay: "每小时自然衰减",
	moodDecayHint: "长时间不互动，每小时掉多少点（0~100）。",
	moodLow: "低落分界",
	moodLowHint: "低于这个值算「有点闷」（0~100）。",
	moodHigh: "开心分界",
	moodHighHint: "高于这个值算「超开心」（0~100）。",
	invalidMood: "请检查心情设置：五个数值都需在 0~100 之间。",
	"font.candy": "软糖体（内置）",
	"font.yahei": "微软雅黑 / 苹方",
	"font.youyuan": "幼圆",
	"font.kaiti": "楷体",
	"font.simsun": "宋体",
	"font.comic": "漫画体",
	"font.system": "系统默认",
	modelTitle: "AI 模型与对话上下文",
	modelHint: "碎碎念与对话各自用哪个模型，以及对话每次带多少历史进上下文。选「跟随当前对话」= 用你当前对话正在用的那个模型（默认）。全局默认：对所有宠物生效，pet pack 可在自己种类文件里单独覆盖。选项与 DSH 的模型选择器同源，由宿主实时提供。",
	modelFollow: "跟随当前对话",
	modelSearch: "搜索模型…",
	modelEmpty: "没有匹配的模型。",
	modelNoModels: "没有可用的模型。",
	modelLoading: "正在刷新模型列表…",
	modelTriggerAria: "选择模型，当前 {model}",
	modelUnknown: "（当前配置，不在列表中）",
	modelNone: "该服务商没有可用模型",
	whisperModelLabel: "碎碎念模型",
	chatModelLabel: "对话模型",
	modelFieldHint: "选「跟随当前对话」= 用当前对话的模型；指定了但调用失败会自动回落到当前对话的模型重试一次。",
	invalidModel: "请检查模型设置：服务商与模型要么都选，要么都留空（跟随当前对话）。",
	modelCatalogFailed: "模型列表加载失败（刷新页面可重试）；当前配置值仍会原样保留。",
	chatMemory: "对话历史条数",
	chatMemoryHint: "每次对话请求携带的最近历史轮数（1 轮 = 1 问 1 答；0 = 不带历史，每句都是全新对话）。对话记忆本身全存不删，此值只决定截多少进上下文——越大越记得住，也越费 token。全局默认，所有宠物共用（pet pack 可在自己种类文件里单独覆盖）。",
	invalidChatMemory: "请检查对话历史条数：需为 ≥ 0 的数字。",
	chatImageLimit: "对话配图张数上限",
	chatImageLimitHint: "对话时发给模型的表情包清单最多几张（「前 N 张」= 配置里写在前面的那 N 条，想让哪几张优先被发出去就把顺序往前挪）。整张清单是每条消息都要附的，token 随张数线性增长——张数一多就是纯烧钱，限制成前 N 张，模型只从这几张里挑。0 = 不限制（全部发）。内置默认 10。全局默认，所有宠物共用（pet pack 可在自己种类文件里覆盖）。只影响对话选图：碎碎念只带抽中的那一张。",
	invalidChatImageLimit: "请检查对话配图张数上限：需为 ≥ 0 的数字（0 = 不限制）。",
	notifyTest: "测试弹窗",
	notifyTestOk: "测试通知已发送，请查看桌面右下角。",
	notifyDenyUnsupported: "当前环境不支持系统通知（浏览器无 Notification API）。",
	notifyDenyBlocked: "通知权限已被浏览器标记为「阻止」。",
	notifyDenyRejected: "你在权限询问弹窗中选择了「阻止」。",
	notifyDenyError: "申请权限时出错",
	notifyGuide: "引导：点击地址栏左侧 🔒/ⓘ →「网站设置」→「通知」→ 改为「允许」，刷新页面后重试。",
	storageTitle: "卸载与存储",
	storageHint: "插件在本机落下的全部位置。删缓存不影响使用（会自动重下/重建）；删「插件用户数据」会丢配置与对话记忆。",
	"storage.userData": "插件用户数据：自定义配置 main-config.jsonc、对话记忆 memory.json、自定义动画素材 main-animation/、文件宠物 pet/",
	"storage.electron": "桌面宠物用的 Electron 运行时（体积较大；删除后下次启用桌面模式会自动重新下载）",
	"storage.desktopCache": "桌面宠物窗口的缓存与主屏缩放缓存（可删，会自动重建）",
	"storage.electronCache": "Electron 安装包下载缓存（可删，需要时会重新下载）",
	"storage.package": "插件本体（本地源码安装：profile 依赖指向本地 dsh-zdd-pet-install 目录；卸载方式见下）",
	storageMissing: "（尚未创建）",
	uninstallTitle: "卸载方法",
	uninstallStep1: "1. 先退出 DSH（桌面宠物随之退出）；不要在桌宠运行时删除上面的文件。",
	uninstallStep2: "2. 卸载插件本体——优先在 DSH 的「插件管理」页里卸载 {name}（最省事，会同时从 profile 的依赖与 bundle 层移除）。",
	uninstallStep3: "3. 若本机没有可用的 dsh 命令（桌面应用内嵌运行时常如此），可手动卸载：编辑 {profileDir}/package.json，从 dependencies 删掉 \"{name}\"、从 dsh.profile.bundles 删掉 \"{name}\"；再删除 node_modules/{name} 目录；然后重启 DSH。",
	uninstallStep4: "4. 按需删除上面的位置：缓存类（Electron 运行时 / 桌面缓存 / 下载缓存）删了无影响，下次自动重下或重建；「插件用户数据」删了会丢配置与对话记忆（想保留请先备份其中的 main-config.jsonc）。",
	uninstallCmd: "dsh plugin --profile {profile} remove {name}"
};
const en = {
	nav: "Pet Config",
	intro: "Manage multiple pets: each pet has its own size and position (applies instantly after saving).",
	petCardTitle: "Pet",
	petCardHint: "Per-pet settings: name / size / display / corner / offsets / the four feature switches. Click \"Save\" at the bottom to apply instantly.",
	globalTitle: "Global switches",
	globalHint: "Shared by every pet (a pet pack may override them in its own kind file). These switches only change local state and are written to the user config on \"Save\" (never written immediately); system notifications re-read right after saving, no page refresh needed.",
	cornerHint: "Which screen corner the pet sticks to (per-monitor work area in desktop mode).",
	marginXHint: "Horizontal distance from the chosen corner (px); any number.",
	marginYHint: "Vertical distance from the chosen corner (px); any number.",
	"cmd.chat": "Chat",
	"cmd.pet": "Pet",
	"cmd.balance": "Balance",
	petsLabel: "Pets",
	add: "Add pet",
	remove: "Remove",
	confirmRemove: "Delete pet \"{id}\"?",
	confirmTitle: "Confirm action",
	cancel: "Cancel",
	ok: "Got it",
	atLeastOne: "Keep at least one pet.",
	emptyPets: "No pets yet — click \"Add pet\" to create one.",
	sizeLabel: "Size (width px)",
	sizeHint: "Height is automatic = width × 9/16.",
	nameLabel: "Name",
	nameHint: "Shown on hover and added to AI personas (\"your name is X\"). Duplicates allowed; empty falls back to the pet id.",
	personaLabel: "Persona (optional)",
	personaHint: "Applies to this pet only. Leave empty to follow the entry persona — the grey text inside the box is exactly that. The system prompt actually sent = this text + an appended 「your name is \"<name>\"」 line + the current time context, so do not repeat the name or the date here.",
	personaCount: "{n} chars",
	balanceEnabled: "Balance",
	balanceEnabledHint: "When enabled, this pet plays balance animations and shows the balance bubble.",
	whisperEnabled: "Whisper",
	whisperEnabledHint: "When enabled, this pet periodically generates a line via AI and plays the whisper animation (persona = the field below; empty follows the entry).",
	workStatusEnabled: "Work status",
	workStatusEnabledHint: "When enabled, this pet follows DSH work state: thinking / working / waiting / done / error switch animations and show bubbles (pool in top-level config; listening only, no model calls).",
	fixedEnabled: "Pin in place",
	fixedEnabledHint: "When enabled, the random chain no longer turns this pet or walks it away — only idle and in-place actions play. Right-click picks, API triggers and balance / whisper / work-status animations are unaffected.",
	displayLabel: "Display",
	displayHint: "web = browser only / desktop = desktop only / both = both / none = neither",
	"display.web": "Browser only",
	"display.desktop": "Desktop only",
	"display.both": "Both",
	"display.none": "Neither",
	cornerLabel: "Position",
	"corner.top-left": "Top-left",
	"corner.top-right": "Top-right",
	"corner.bottom-left": "Bottom-left",
	"corner.bottom-right": "Bottom-right",
	marginX: "Horizontal offset",
	marginY: "Vertical offset",
	save: "Save",
	saveHotkey: "Ctrl+S / Cmd+S",
	sync: "Sync",
	confirmSync: "Sync? This overwrites the user config with the bundled default config (all fields + comments); current customizations are lost.",
	corruptTitle: "User config is corrupted — not saved",
	corruptConfirm: "Save anyway",
	corruptBody: "The user config file cannot be parsed (corrupted, not valid JSON/JSONC): {path}. Saving now rebuilds it from the whitelist — everything currently in that file (animations / physics / memes …) will be lost. Cancel = leave the file untouched (fix it and save again); Confirm = save anyway (discard what is in the file).",
	syncHint: "\"Sync\" writes the bundled default config (comments + every advanced field included) to the user config file, overwriting your current customizations; the file is then directly editable. Two caveats: (1) once created, that file is an explicit override layer — later changes to the bundled defaults will not take effect automatically (until you sync again or delete the file); (2) clicking \"Save\" on this page rewrites the file from a whitelist — field values are kept, comments are dropped.",
	configMeta: "Advanced (files)",
	configMetaHint: "User config may override pets / animation pools / weights — refresh or restart to apply: refresh the page in the browser, or right-click a desktop pet → \"Reload config\" (rebuilds every desktop pet window). The default config is the complete reference.",
	defaultConfig: "Default config (read-only, complete reference)",
	userConfig: "User config (custom overrides)",
	animationDir: "Animation assets dir (add/customize animations here)",
	memesDir: "Meme images dir (add/customize images here)",
	logFile: "Log file (for troubleshooting; safe to clear)",
	logFileNote: "The DSH desktop app has no console, so every runtime log of the plugin (startup, desktop pet crashes/restarts, errors and warnings) goes into this single file — attach it when reporting a problem. It is capped at 1 MB; once full, only the latest 512 KB is kept.",
	saved: "Saved — the pets updated instantly.",
	loadError: "Failed to load config",
	saveError: "Failed to save config. Check the server connection, configuration directory write permissions and server log.",
	saveInvalid: "Failed to save config: invalid configuration. Check the values and try again.",
	syncError: "Failed to sync config. Check the server connection and configuration directory write permissions.",
	loading: "Loading config…",
	retry: "Retry",
	invalid: "Check your input: size must be positive; margins can be any number.",
	busy: "Saving…",
	extraPetsHint: "{n} more kind(s) come from files in the pet/ directory (<name>-config.json + <name>-animation/). Switch to them in the Kinds row above; Save writes back to each pack's own config, never into main-config.jsonc.",
	kindLabel: "Kinds",
	kindMain: "Built-in",
	lastOfKind: "\"{entry}\" has only this pet left — deleting it would remove the whole kind. Delete the pet pack files to remove it entirely.",
	savePartial: "Main pets saved, but {names} could not be written back: check that the pack config is valid and the directory is writable.",
	notifyToggle: "System notifications",
	notifyToggleHint: "OS-level toasts (bottom-right of the desktop) for conversation completion, failures, permission requests, and questions — only while this window is unfocused.",
	clickSoundToggle: "Click sound",
	clickSoundToggleHint: "Plays the built-in click sound (assets/sound/click-duck.wav, volume 0.5) when a pet is clicked; repeated clicks within 100ms play only once, so multiple pets never stack up. Turn it off for silence. Written to the user config together with Save.",
	bubbleImageToggle: "Bubble memes",
	bubbleImageToggleHint: "Master switch for memes in all bubble messages — whispers, chat, pomodoro, task easter eggs, balance-gag show and startup greeting all follow it. Off = text only everywhere (quieter, saves tokens); On = each feature attaches memes per its own logic (mapping lives in the top-level `memes` config field).",
	whisperImageToggle: "Whisper images",
	whisperImageToggleHint: "Attach one random meme from the pool to each whisper line (image mapping lives in the top-level `memes` config field). Tokens: a whisper already calls the model every cycle, so the image only appends the name + description of that one meme (~100 chars / ~60 tokens) to the same request — negligible.",
	chatImageToggle: "Chat images",
	chatImageToggleHint: "Let the AI pick one meme from the pool that fits the current context (optional; mapping lives in the top-level `memes` config field). Tokens: every message carries the whole catalog — currently ~1.1k chars (~650 tokens, about 11x the whisper case) and growing with the number of images; turning this off appends nothing at all.",
	confineToggle: "Lock to the current screen",
	confineToggleHint: "Multi-monitor: when on, the pet stays inside the screen it is currently on — a thrown pet bounces only inside the screen it was released on (screen seams act as walls, so it never flies to the neighbouring monitor), and autonomous wandering only walks within the screen it is currently on (a step that would cross the seam is simply cancelled). Turn this off to let it cross screens as usual. Desktop only — the browser overlay always stays inside the viewport anyway.",
	trayToggle: "System tray",
	trayToggleHint: "Shows a tray icon (notification area on Windows, menu bar on macOS) once desktop mode is running. It lists every pet in the config and toggles each one between desktop and web/none — including pets that are currently off the desktop and therefore have no window to right-click. With it off, bringing a pet back to the desktop requires opening the browser (the settings page, or right-clicking a web pet there). Windows already folds third-party icons into the \"hidden icons\" overflow. Desktop mode only.",
	physicsTitle: "Physics (drag & throw feel)",
	physicsHint: "Global default, shared by every pet (a pet pack may override it in its own kind file); written to the user config on \"Save\" (never written immediately). Applies instantly in the browser; on the desktop it applies once Save reloads the pet windows.",
	"physics.gravity": "Gravity",
	"physics.gravityHint": "px/s² — the higher, the faster it falls; 0 = weightless (flies straight forever)",
	"physics.restitution": "Bounciness",
	"physics.restitutionHint": "0–1, speed kept when bouncing off a wall or the floor (1 = perfectly elastic, 0 = stops dead)",
	"physics.groundFriction": "Ground friction",
	"physics.groundFrictionHint": "per second, horizontal damping while on the ground; 0 = frictionless ice",
	"physics.throwPower": "Throw power",
	"physics.throwPowerHint": "> 0, overall multiplier for spring tracking and release speed (1 = default; higher = tighter tracking, harder throws)",
	physicsCeilingBounce: "Ceiling bounce",
	physicsCeilingBounceHint: "Turn this off to let a throw fly out through the top of the screen (gravity still pulls it back)",
	physicsPetCollision: "Pet collisions",
	physicsPetCollisionHint: "A flying pet bounces off the others with momentum conservation (mass ∝ size²)",
	invalidPhysics: "Check the physics values: gravity / ground friction ≥ 0, bounciness 0–1, throw power > 0.",
	fontTitle: "Appearance & font",
	fontHint: "The family applies to every place that currently uses the candy font: pet bubble, hover tooltip, chat popup, score popup. The size applies only to the pet bubble and the hover tooltip (chat and score popups keep their own size). Global default, shared by every pet (a pet pack may override it in its own kind file); written to the user config on \"Save\" — instant in the browser, and on the desktop it applies once Save reloads the pet windows.",
	fontFamilyLabel: "Font",
	fontFamilyHint: "\"Candy (bundled)\" ships with the plugin; the others are system fonts. If a font is missing on this machine, it falls back to the next one in the stack (never blank, never an error).",
	fontSizeLabel: "Font size (px)",
	fontSizeHint: "Bubble body text size; the tooltip and the smaller lines inside the bubble scale proportionally. Range 4–200.",
	fontFollowToggle: "Scale font with pet size",
	fontFollowToggleHint: "On (default): the font grows with the pet — at 462 px width it is exactly the size above. Off: the size stays fixed regardless of pet size.",
	invalidFont: "Check the font settings: the family must be in the list and the size must be a number between 4 and 200.",
	pomodoroTitle: "Pomodoro / sit reminder",
	pomodoroHint: "At a fixed interval the pet says something (zero tokens). Global default shared by all pets (a pet pack can override it in its own kind file); written on Save — instant in the browser, applied after reload on desktop.",
	pomodoroLabel: "Sit reminder",
	pomodoroLabelHint: "Pick \"Off\" to disable; pick a minutes value to enable and have the pet remind you to stretch that often.",
	pomodoroOff: "Off",
	pomodoroEvery: "Every {n} min",
	pomodoroBreakLabel: "Break length",
	pomodoroBreakHint: "How long to rest after each focus session.",
	pomodoroLongBreakLabel: "Long break length",
	pomodoroLongBreakHint: "Longer rest after a few focus rounds.",
	pomodoroRoundsLabel: "Rounds per long break",
	pomodoroRoundsHint: "How many focus rounds before a long break (1–24).",
	pomodoroAutoBreak: "Auto-start break",
	pomodoroAutoBreakHint: "Start the break countdown automatically when focus ends; off means you resume it from the menu.",
	pomodoroAutoFocus: "Auto-start next focus",
	pomodoroAutoFocusHint: "Start the next focus session automatically when the break ends.",
	invalidPomodoro: "Check the Pomodoro setting: the interval must be a number between 1 and 1440.",
	greetingTitle: "Startup greeting",
	greetingHint: "At each DSH startup the pet says a lucky greeting (with a meme). Falls back to built-in lines when the model is unavailable.",
	greetingEnabled: "Enable startup greeting",
	greetingMode: "Generation mode",
	greetingModeHint: "Pool: pre-generate a batch once and pick one at random each time (saves tokens); Live: call the model each startup.",
	greetingModePool: "Pool (pre-generate, pick random)",
	greetingModeLive: "Live (each startup)",
	greetingPoolSize: "Pool size",
	greetingPoolSizeHint: "How many lines to pre-generate (1~200); only used in Pool mode.",
	invalidGreeting: "Check the greeting setting: the pool size must be an integer between 1 and 200.",
	moodTitle: "Mood / affection",
	moodHint: "Touching it cheers it up; neglect makes it gloomy. The tier affects click lines and idle behaviour (happy → shows off, low → sighs/naps sooner). The value is stored locally per pet. Global default shared by all pets; written on Save — instant in the browser, applied after reload on desktop.",
	moodEnabled: "Enable mood system",
	moodEnabledHint: "When off, mood no longer accumulates: click lines use clickTexts directly and idle behaviour ignores mood.",
	moodInitial: "Initial mood",
	moodInitialHint: "Starting value when the pet is first seen (0–100).",
	moodTouchGain: "Gain per touch",
	moodTouchGainHint: "How many points each click adds (0–100).",
	moodDecay: "Decay per hour",
	moodDecayHint: "How many points are lost per idle hour (0–100).",
	moodLow: "Low threshold",
	moodLowHint: "Below this value counts as gloomy (0–100).",
	moodHigh: "High threshold",
	moodHighHint: "Above this value counts as cheerful (0–100).",
	invalidMood: "Check the mood setting: all five values must be between 0 and 100.",
	"font.candy": "Candy (bundled)",
	"font.yahei": "Microsoft YaHei / PingFang",
	"font.youyuan": "YouYuan",
	"font.kaiti": "KaiTi",
	"font.simsun": "SimSun",
	"font.comic": "Comic Sans MS",
	"font.system": "System default",
	modelTitle: "AI models & chat context",
	modelHint: "Which model each of whisper and chat uses, and how much history every chat request carries. \"Follow current conversation\" uses the model your current conversation is on (default). Global default: applies to every pet, and a pet pack may override it in its own kind file. The options come from the same source as the DSH model picker, served live by the host.",
	modelFollow: "Follow current conversation",
	modelSearch: "Search models…",
	modelEmpty: "No matching models.",
	modelNoModels: "No models available.",
	modelLoading: "Refreshing model list…",
	modelTriggerAria: "Select model, current {model}",
	modelUnknown: " (current config, not in the list)",
	modelNone: "No models available for this provider",
	whisperModelLabel: "Whisper model",
	chatModelLabel: "Chat model",
	modelFieldHint: "\"Follow current conversation\" uses the conversation model; if a chosen model fails, the plugin falls back to the conversation model and retries once.",
	invalidModel: "Check the model settings: pick both a provider and a model, or leave both empty (follow the current conversation).",
	modelCatalogFailed: "Failed to load the model list (refresh the page to retry); your current values are kept as they are.",
	chatMemory: "Chat history rounds",
	chatMemoryHint: "How many recent rounds each chat request carries (1 round = 1 question + 1 answer; 0 = no history, every message starts fresh). The memory itself keeps everything — this only decides how much goes into the context: higher remembers more and costs more tokens. Global default, shared by every pet (a pet pack may override it in its own kind file).",
	invalidChatMemory: "Check the chat history rounds: it must be a number ≥ 0.",
	chatImageLimit: "Chat image limit",
	chatImageLimitHint: "How many memes at most are listed to the model during chat (\"first N\" = the first N you wrote in the config, so move the ones you want sent to the front). That whole list is attached to every message and tokens grow linearly with the count, so a long list is pure burn; capping it to the first N makes the model pick only among those. 0 = no limit (send everything). Built-in default 10. Global default, shared by every pet (a pet pack may override it in its own kind file). Chat only — a whisper carries just the one meme it drew.",
	invalidChatImageLimit: "Check the chat image limit: it must be a number ≥ 0 (0 = no limit).",
	notifyTest: "Test notification",
	notifyTestOk: "Test notification sent — check the bottom-right of your desktop.",
	notifyDenyUnsupported: "System notifications are not supported in this environment (no Notification API).",
	notifyDenyBlocked: "Notification permission is blocked by the browser.",
	notifyDenyRejected: "You chose \"Block\" in the permission prompt.",
	notifyDenyError: "Failed to request permission",
	notifyGuide: "Guide: click the 🔒/ⓘ icon next to the address bar → Site settings → Notifications → set to \"Allow\", then refresh and retry.",
	storageTitle: "Uninstall & storage",
	storageHint: "Every location this plugin writes to. Deleting cache folders is harmless (they re-download / rebuild); deleting \"plugin user data\" loses your config and chat memory.",
	"storage.userData": "Plugin user data: custom config main-config.jsonc, chat memory memory.json, custom animation assets main-animation/, file pets pet/",
	"storage.electron": "Electron runtime used by the desktop pet (large; re-downloaded automatically the next time desktop mode starts)",
	"storage.desktopCache": "Desktop pet window cache and primary-monitor scale cache (safe to delete, rebuilt automatically)",
	"storage.electronCache": "Electron installer download cache (safe to delete, re-downloaded when needed)",
	"storage.package": "The plugin itself (installed from local source: the profile dependency points to a local dsh-zdd-pet-install dir; see how to uninstall below)",
	storageMissing: " (not created yet)",
	uninstallTitle: "How to uninstall",
	uninstallStep1: "1. Quit DSH first (the desktop pet exits with it); do not delete these files while the pet is running.",
	uninstallStep2: "2. Remove the plugin — preferably via DSH's \"Plugin manager\" page, uninstalling {name} (easiest; also drops it from the profile dependencies and bundle layer).",
	uninstallStep3: "3. If no usable dsh command is available (common when DSH runs inside the desktop app), uninstall manually: edit {profileDir}/package.json — remove \"{name}\" from dependencies and \"{name}\" from dsh.profile.bundles; delete the node_modules/{name} directory; then restart DSH.",
	uninstallStep4: "4. Delete the locations above as needed: cache folders (Electron runtime / desktop cache / download cache) are harmless and re-download or rebuild automatically; deleting \"plugin user data\" loses your config and chat memory (back up main-config.jsonc first if you want to keep it).",
	uninstallCmd: "dsh plugin --profile {profile} remove {name}"
};

//#endregion
//#region src/client/settings.ts
function makePetConfigSection(rt) {
	const { h, useState, useEffect, useRef, useCallback, t } = rt;
	injectSettingsCss();
	const { q } = makeUiKit({
		h,
		t
	});
	const ModelPicker = makeModelPicker({
		h,
		useState,
		useEffect,
		useRef,
		t
	});
	const PetTabs = makePetTabs({
		h,
		t
	});
	const KindTabs = makeKindTabs({
		h,
		t
	});
	const PetCard = makePetCard(rt);
	const GlobalCard = makeGlobalCard(rt);
	const FontCard = makeFontCard(rt);
	const ModelCard = makeModelCard(rt, ModelPicker);
	const PhysicsCard = makePhysicsCard(rt);
	const PomodoroCard = makePomodoroCard(rt);
	const GreetingCard = makeGreetingCard(rt);
	const MoodCard = makeMoodCard(rt);
	const Actions = makeActions(rt);
	const { ConfigMetaCard, StorageCard } = makePathsCards(rt);
	const SettingsDialog = makeDialog(rt);
	const LoadStatus = makeLoadStatus({
		h,
		t
	});
	return function PetConfigSection() {
		const [saving, setBusy] = useState(false);
		const [msg, setMsg] = useState({
			kind: "",
			text: ""
		});
		const [permMsg, setPermMsg] = useState({
			kind: "",
			text: ""
		});
		const rootRef = useRef(null);
		const [dialog, setDialog] = useState(null);
		const { pets, mainPets, kinds, kind, visiblePets, selId, entryPrompt, select, selectKind, update, add, requestRemove, remove, replace, packWrites } = usePetList(rt, setDialog);
		const { paths, catalog, catalogFailed } = useRemoteData(rt);
		const [notifyEnabled$1, setNotifyEnabled] = useState(true);
		const [clickSound, setClickSound] = useState(false);
		const [bubbleImage, setBubbleImage] = useState(true);
		const [confineScreen, setConfineScreen] = useState(false);
		const [trayEnabled, setTrayEnabled] = useState(true);
		const [physics, setPhysics] = useState({ ...DEFAULT_PHYSICS });
		const [pomodoro, setPomodoro] = useState({ ...DEFAULT_POMODORO });
		const [greeting, setGreeting] = useState({ ...DEFAULT_GREETING });
		const [mood, setMood] = useState({
			...DEFAULT_MOOD,
			texts: { ...DEFAULT_MOOD.texts }
		});
		const [font, setFont] = useState({ ...DEFAULT_FONT });
		const [whisperModel, setWhisperModel] = useState({
			provider: "",
			model: ""
		});
		const [chatModel, setChatModel] = useState({
			provider: "",
			model: ""
		});
		const [chatMemory, setChatMemory] = useState(5);
		const [chatImageLimit, setChatImageLimit] = useState(10);
		const applyConfig = useCallback((merged) => {
			const entries = readConfigEntries(merged);
			const patch = readMainConfig(merged);
			if (entries === null || patch === null) throw new Error("Invalid config response");
			replace(entries);
			if (patch.notificationsEnabled !== void 0) setNotifyEnabled(patch.notificationsEnabled);
			if (patch.clickSoundEnabled !== void 0) setClickSound(patch.clickSoundEnabled);
			if (patch.bubbleImageEnabled !== void 0) setBubbleImage(patch.bubbleImageEnabled);
			if (patch.confineToScreen !== void 0) setConfineScreen(patch.confineToScreen);
			if (patch.trayEnabled !== void 0) setTrayEnabled(patch.trayEnabled);
			if (patch.physics !== void 0) setPhysics(patch.physics);
			if (patch.pomodoro !== void 0) setPomodoro(patch.pomodoro);
			if (patch.greeting !== void 0) setGreeting(patch.greeting);
			if (patch.mood !== void 0) setMood(patch.mood);
			if (patch.font !== void 0) setFont(patch.font);
			if (patch.whisperModel !== void 0) setWhisperModel(patch.whisperModel);
			if (patch.chatModel !== void 0) setChatModel(patch.chatModel);
			if (patch.chatMemoryRounds !== void 0) setChatMemory(patch.chatMemoryRounds);
			if (patch.chatImageLimit !== void 0) setChatImageLimit(patch.chatImageLimit);
		}, [replace]);
		const { loadState, retry } = useConfigLoad(rt, applyConfig);
		const busy = saving || loadState !== "ready";
		const toggleNotify = async (v) => {
			setNotifyEnabled(v);
			if (v) await requestNotificationPermission();
		};
		const testNotification = () => void runNotificationTest({
			t,
			report: setPermMsg
		});
		const cur = pets.find((p) => p.id === selId) ?? null;
		const packCount = kinds.filter((item) => item.kind === "pack").length;
		const globalFlags = {
			notificationsEnabled: notifyEnabled$1,
			clickSoundEnabled: clickSound,
			bubbleImageEnabled: bubbleImage,
			confineToScreen: confineScreen,
			trayEnabled
		};
		const globalSetters = {
			notificationsEnabled: (value) => void toggleNotify(value),
			clickSoundEnabled: setClickSound,
			bubbleImageEnabled: setBubbleImage,
			confineToScreen: setConfineScreen,
			trayEnabled: setTrayEnabled
		};
		const setGlobalFlag = (key, value) => globalSetters[key](value);
		/** 局部补丁写入：字体与物理参数都是「整段对象 + 改几个字段」。 */
		const patchFont = (patch) => setFont((current) => ({
			...current,
			...patch
		}));
		const patchPhysics = (patch) => setPhysics((current) => ({
			...current,
			...patch
		}));
		const patchPomodoro = (patch) => setPomodoro((current) => ({
			...current,
			...patch
		}));
		const patchGreeting = (patch) => setGreeting((current) => ({
			...current,
			...patch
		}));
		const patchMood = (patch) => setMood((current) => ({
			...current,
			...patch
		}));
		/** 两个模型字段各有一份状态，卡片只回传键名。 */
		const setModel = (key, value) => {
			if (key === "whisperModel") setWhisperModel(value);
			else setChatModel(value);
		};
		const write = createWriteFlow({
			fields: () => ({
				pets: mainPets,
				notificationsEnabled: notifyEnabled$1,
				clickSoundEnabled: clickSound,
				bubbleImageEnabled: bubbleImage,
				confineToScreen: confineScreen,
				trayEnabled,
				physics,
				pomodoro,
				greeting,
				mood,
				whisperModel,
				chatModel,
				chatMemoryRounds: chatMemory,
				chatImageLimit,
				font
			}),
			busy: () => busy,
			setBusy,
			setMsg,
			setDialog,
			dialog: () => dialog,
			applyConfig,
			packWrites,
			userFile: () => paths?.user ?? "",
			t,
			onRemove: remove
		});
		const saveRef = useRef(() => {});
		useEffect(() => {
			saveRef.current = () => void write.save();
		});
		useEffect(() => {
			const onKey = (e) => {
				if (!(e.ctrlKey || e.metaKey) || e.shiftKey || e.altKey) return;
				if (e.key.toLowerCase() !== "s") return;
				const root = rootRef.current;
				if (!root || !root.isConnected || root.getClientRects().length === 0) return;
				e.preventDefault();
				saveRef.current();
			};
			document.addEventListener("keydown", onKey);
			return () => document.removeEventListener("keydown", onKey);
		}, []);
		return h("section", {
			ref: rootRef,
			className: "dsh-zdd-pet-cfg",
			style: { maxWidth: "720px" },
			children: [
				h("h2", {
					className: "dsh-zdd-pet-cfg__title",
					children: [t("nav"), q(packCount > 0 ? t("intro") + "\n" + t("extraPetsHint").replace("{n}", String(packCount)) : t("intro"))]
				}),
				h(LoadStatus, {
					loadState,
					onRetry: retry
				}),
				h(KindTabs, {
					kinds,
					kind,
					busy,
					onSelect: selectKind
				}),
				h(PetTabs, {
					pets: visiblePets,
					selId,
					busy,
					onSelect: select,
					onAdd: add
				}),
				h(PetCard, {
					pet: cur,
					busy,
					msg,
					entryPrompt,
					onChange: update,
					onSave: () => void write.save(),
					onRemove: requestRemove
				}),
				h(GlobalCard, {
					busy,
					values: globalFlags,
					onChange: setGlobalFlag
				}),
				h(FontCard, {
					busy,
					font,
					onChange: patchFont
				}),
				h(ModelCard, {
					busy,
					catalog,
					failed: catalogFailed,
					whisperModel,
					chatModel,
					onModelChange: setModel,
					chatMemory,
					chatImageLimit,
					onChatMemoryChange: setChatMemory,
					onChatImageLimitChange: setChatImageLimit
				}),
				h(PhysicsCard, {
					busy,
					physics,
					onChange: patchPhysics
				}),
				h(PomodoroCard, {
					busy,
					pomodoro,
					onChange: patchPomodoro
				}),
				h(GreetingCard, {
					busy,
					greeting,
					onChange: patchGreeting
				}),
				h(MoodCard, {
					busy,
					mood,
					onChange: patchMood
				}),
				h(Actions, {
					busy,
					msg,
					permMsg,
					onSave: () => void write.save(),
					onSync: write.requestSync,
					onTestNotification: testNotification
				}),
				paths ? h(ConfigMetaCard, { paths }) : null,
				paths ? h(StorageCard, { paths }) : null,
				dialog ? h(SettingsDialog, {
					dialog,
					selId,
					onDismiss: () => setDialog(null),
					onConfirm: write.confirmDialog
				}) : null
			]
		});
	};
}

//#endregion
//#region src/client/menu-service.ts
/** owner → 本页可见的 label 列表（来源是 /state 的 sections.menu 快照）。 */
const labels = new Map();
/** owner → 每项的点击闩锁（连点两次同一条只留最后一次，与宿主一致）。 */
const marks = new Map();
function setMenuItems(items) {
	labels.clear();
	for (const item of items) {
		const list = labels.get(item.owner);
		if (list === void 0) labels.set(item.owner, [item.label]);
		else if (!list.includes(item.label)) list.push(item.label);
	}
	for (const [owner, entry] of marks) {
		const list = labels.get(owner);
		if (list === void 0) {
			marks.delete(owner);
			continue;
		}
		for (const label of [...entry.keys()]) if (!list.includes(label)) entry.delete(label);
	}
}
function setMenuClick(owner, label, pet) {
	let entry = marks.get(owner);
	if (entry === void 0) {
		entry = new Map();
		marks.set(owner, entry);
	}
	entry.set(label, pet);
}
function takeMenuEvents(owner) {
	const list = labels.get(owner);
	if (list === void 0) return {
		ok: false,
		reason: "unknown-owner"
	};
	const entry = marks.get(owner);
	const events = {};
	for (const label of list) {
		events[label] = entry?.get(label) ?? null;
		entry?.set(label, null);
	}
	return {
		ok: true,
		events
	};
}

//#endregion
//#region src/client/pet/menu-actions.ts
/** 显示位置：写配置后宿主回成品聚合，交给容器重渲染。 */
async function switchDisplay(deps, display) {
	try {
		const response = await fetch(ROUTE_PATH + "/pet-display", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({
				id: deps.petId,
				display
			})
		});
		if (!response.ok) throw new Error("pet-display HTTP " + response.status);
		const body = await response.json();
		if (body.ok === false) throw new Error("pet-display 被拒：" + String(body.reason ?? ""));
		deps.applyMerged(body);
	} catch (error) {
		deps.warn("[dsh-zdd-pet] 显示位置切换失败 " + (error instanceof Error ? error.message : String(error)));
	}
}
function createMenuActions(deps) {
	const { petId } = deps;
	/** 动作端点：POST 一次，失败只留一行 warn——结果由 /state 送回，这里没有返回值可用。 */
	const fireAction = (route, label) => {
		postAction(route).then((ok) => {
			if (!ok) deps.warn("[dsh-zdd-pet] " + label + "失败 pet=" + petId);
		}).catch((error) => deps.warn("[dsh-zdd-pet] " + label + "异常 pet=" + petId + " " + String(error)));
	};
	const run = (leaf$1, playbackId, keepFacing = false) => {
		if (leaf$1.action === "third-party") {
			const owner = leaf$1.owner ?? "";
			if (owner !== "") {
				setMenuClick(owner, leaf$1.label, petId);
				postAction(ROUTE_PATH + "/menu/click", {
					owner,
					label: leaf$1.label,
					pet: petId
				}).catch((error) => deps.warn("[dsh-zdd-pet] 第三方菜单点击上报失败 " + String(error)));
			}
			return;
		}
		if (leaf$1.action === "show-balance") {
			console.info("[dsh-zdd-pet] 菜单查看余额 pet=" + petId);
			fireAction(ROUTE_PATH + "/balance", "余额刷新动作");
			return;
		}
		if (leaf$1.action === "whisper") {
			console.info("[dsh-zdd-pet] 菜单触发碎碎念 pet=" + petId);
			fireAction(ROUTE_PATH + "/whisper?pet=" + encodeURIComponent(petId) + "&surface=web", "碎碎念手动触发");
			return;
		}
		if (leaf$1.action === "chat") {
			deps.openChat();
			return;
		}
		if (leaf$1.action === "set-display") {
			const display = leaf$1.display;
			if (!display) return;
			console.info("[dsh-zdd-pet] 菜单切换显示位置 pet=" + petId + " display=" + display);
			switchDisplay(deps, display);
			return;
		}
		if (leaf$1.action === "home") {
			deps.stopThrow();
			deps.stopMove();
			deps.resetPosition();
			return;
		}
		if (typeof leaf$1.action === "string" && leaf$1.action.startsWith("pomodoro-")) {
			const action = leaf$1.action.slice(9);
			fireAction(ROUTE_PATH + "/pomodoro?pet=" + encodeURIComponent(petId) + "&action=" + encodeURIComponent(action), "番茄钟动作 " + action);
			return;
		}
		if (!leaf$1.anim) return;
		const cuePlaybackId = playbackId ?? null;
		if (!keepFacing && isNoMirrorAnimation(deps.animations().categories, leaf$1.anim) && deps.isFacingRight()) deps.faceLeft();
		const movies = deps.animations().moves.actions;
		if (movies.some((action) => action.name === leaf$1.anim)) {
			if (deps.tryMove(leaf$1.anim) === false) {
				deps.stopMove();
				deps.playOnce(leaf$1.anim, cuePlaybackId);
			} else if (cuePlaybackId !== null) deps.report(cuePlaybackId, "failed", "busy");
			return;
		}
		deps.stopMove();
		deps.playOnce(leaf$1.anim, cuePlaybackId);
	};
	return { run };
}

//#endregion
//#region src/client/pet/playback-report.ts
function playbackReportRequest(playbackId, status, reason) {
	return {
		url: ROUTE_PATH + "/playback/" + encodeURIComponent(playbackId) + "/report",
		body: reason === void 0 ? { status } : {
			status,
			reason
		}
	};
}
function makePlaybackReporter(o) {
	return (playbackId, status, reason) => {
		const request = playbackReportRequest(playbackId, status, reason);
		postAction(request.url, request.body).then((ok) => {
			if (!ok) console.warn("[dsh-zdd-pet] 播放回执未送达 pet=" + o.petId + " id=" + playbackId + " status=" + status);
		});
	};
}

//#endregion
//#region src/client/pet/animation/next-animation.ts
function decideNextAnimation(input) {
	const { kind, animations, facing, current, move } = input;
	if (kind === "idle") return {
		kind: "IDLE",
		anim: pick(animations.idle, current),
		play: true
	};
	if (kind === "turn") return {
		kind: "TURN",
		anim: pick(animations.turn, current),
		play: true
	};
	if (kind === "move" && move !== false && move !== void 0) return {
		kind: "MOVES",
		anim: typeof move === "string" ? move : null,
		play: false
	};
	const action = pickCategoryAction(animations.categories, animations.idle, facing, current);
	return {
		kind: action.id,
		anim: action.name,
		play: true
	};
}

//#endregion
//#region src/client/pet/card/animation-flow.ts
/** 日志行的时刻前缀。 */
const stamp$3 = () => new Date().toTimeString().slice(0, 8);
/** 一行带时刻与宠物 id 的日志。 */
const log$2 = (petId, message) => {
	console.log("[dsh-zdd-pet] " + stamp$3() + " pet=" + petId + " " + message);
};
function createAnimationFlow(rt) {
	const { useRef } = rt;
	return function useAnimationFlow(hub, workStatus) {
		const workStatusRef = useRef(workStatus);
		workStatusRef.current = workStatus;
		/** 非终态工作状态回到档位循环；冻结、空闲与终态都返回 false。 */
		const resumeWorkStatusAnim = () => {
			const card = hub.card;
			if (hub.ownAnim.isFrozen()) return false;
			const ws = workStatusRef.current;
			if (!ws || !ws.state || ws.state === "success" || ws.state === "error") return false;
			const pool = hub.anims().events?.workStatus;
			if (!pool || pool.length === 0) return false;
			const idx = WORK_STATUS_INDEX[ws.state];
			const slot = pool[idx];
			if (slot === void 0) return false;
			const name = pickSlot(slot, card.animRef.current);
			log$2(hub.cfg().id, "互动结束恢复状态动画: " + name);
			card.actions.setOnce(Array.isArray(slot) && slot.length > 1);
			card.actions.setAnim(name);
			return true;
		};
		/** 按权重掷骰选择下一段自播动画。 */
		const pickNext = () => {
			const card = hub.card;
			if (hub.ownAnim.isFrozen()) return;
			const roll = Math.random();
			const kind = rollKind(roll, hub.cfg().animationWeights, { fixed: hub.cfg().fixedEnabled });
			const move = kind === "move" ? hub.tryWalk() : void 0;
			const decision = decideNextAnimation({
				kind,
				animations: hub.anims(),
				facing: card.facingRef.current,
				current: card.animRef.current,
				move
			});
			log$2(hub.cfg().id, "facing=" + card.facingRef.current + " roll=" + roll.toFixed(4) + " -> [" + decision.kind + "] " + (decision.anim ?? "移动进行中(不重播)"));
			if (decision.play && decision.anim !== null) card.actions.setAnim(decision.anim);
			card.actions.setOnce(true);
			card.actions.bumpSeq();
		};
		/** 按播完判定改状态。 */
		const applyEndedCue = (cue) => {
			const card = hub.card;
			if (cue.kind === "ignore") return;
			if (cue.kind === "work-rotate") {
				card.actions.setOnce(true);
				card.actions.setAnim(cue.anim);
				card.actions.bumpSeq();
				return;
			}
			if (cue.kind === "work-replay") {
				card.actions.setOnce(false);
				card.actions.bumpSeq();
				return;
			}
			if (cue.kind === "event-done") {
				if (resumeWorkStatusAnim()) return;
				if (hub.anims().idle.length) card.actions.setAnim(pick(hub.anims().idle, card.animRef.current));
				card.actions.setOnce(true);
				card.actions.bumpSeq();
				return;
			}
			if (cue.kind === "turn") {
				const next = card.state.facing === "left" ? "right" : "left";
				card.actions.setFacing(next);
				card.facingRef.current = next;
				return;
			}
			if (cue.kind === "interaction-done") {
				if (resumeWorkStatusAnim()) return;
				if (hub.anims().idle.length) card.actions.setAnim(pick(hub.anims().idle, card.animRef.current));
				card.actions.setOnce(true);
				card.actions.bumpSeq();
				return;
			}
			pickNext();
		};
		/** 说一句：抽碎碎念动画并弹气泡，两者独立。 */
		const speak = (text, image, url, duration, anim, hold) => {
			const card = hub.card;
			let name = null;
			if (anim !== false) {
				const pool = hub.anims().events?.whisper;
				if (!pool || pool.length === 0) {
					console.error("[dsh-zdd-pet] 配置缺少 animations.events.whisper，无法播放碎碎念动画");
					return;
				}
				name = pickSlot(pick(pool, card.animRef.current), card.animRef.current);
			}
			log$2(hub.cfg().id, "whisper" + (name === null ? " （不联动动画）" : " -> [" + name + "]") + " 「" + text + "」");
			if (name !== null) {
				hub.stopMotion();
				card.actions.setOnce(true);
				card.actions.setAnim(name);
			}
			hub.bubbles.showWhisper(text, {
				image,
				url
			}, duration, hold);
		};
		return {
			applyEndedCue,
			pickNext,
			resumeWorkStatusAnim,
			speak
		};
	};
}

//#endregion
//#region src/shared/timings.ts
const BUBBLE_DURATION_MS = 10 * 1e3;
const WORK_BUBBLE_MS = 15 * 1e3;
const SAY_BUBBLE_MIN_MS = 10 * 1e3;
const SAY_BUBBLE_MAX_MS = 60 * 1e3;
const SAY_BUBBLE_BASE_MS = 3 * 1e3;
const SAY_BUBBLE_PER_CHAR_MS = 250;
function sayBubbleDurationMs(text) {
	const points = Array.from(String(text ?? "")).length;
	return Math.min(SAY_BUBBLE_MAX_MS, Math.max(SAY_BUBBLE_MIN_MS, SAY_BUBBLE_BASE_MS + points * SAY_BUBBLE_PER_CHAR_MS));
}

//#endregion
//#region src/client/pet/timings.ts
const STATE_WAIT_MS = 1e3;
const STATE_FALLBACK_MS = 1e3;

//#endregion
//#region src/client/pet/card/bubble-slots.ts
function decideBubbleSlot(input) {
	if (input.whisperOn && input.whisperHold && input.whisperText) return "whisper";
	if (input.workTerminal && input.workOn && input.workText && input.workStatusEnabled) return "work-terminal";
	if (input.workOn && input.workHasTask && input.workStatusEnabled) return "work";
	if (input.whisperOn && input.whisperText) return "whisper";
	if (input.balanceOn && input.balanceAvailable && (input.balanceEnabled || input.balanceManual)) return "balance";
	if (input.workOn && input.workText && input.workStatusEnabled) return "work";
	return "none";
}
function balancePageCount(balance) {
	if (!balance || !balance.ok) return 1;
	if (balance.shape === "custom") return Math.max(1, customViews(balance)?.length ?? 1);
	return balance.shape === "windows" ? 2 : 1;
}
function createBubbleSlots(rt, components) {
	const { h, useState, useRef, useEffect } = rt;
	const BalanceBubble = components.balanceBubble;
	const WhisperBubble = components.whisperBubble;
	return function useBubbleSlots(input) {
		const [balanceOn, setBalanceOn] = useState(false);
		const [balancePage, setBalancePage] = useState(0);
		const balanceTimerRef = useRef(null);
		const [whisperOn, setWhisperOn] = useState(false);
		const [whisperText, setWhisperText] = useState(null);
		const [whisperImage, setWhisperImage] = useState(void 0);
		const [whisperUrl, setWhisperUrl] = useState(void 0);
		const [whisperHold, setWhisperHold] = useState(false);
		const whisperTimerRef = useRef(null);
		const whisperHoldRef = useRef(false);
		const [workOn, setWorkOn] = useState(false);
		const [workText, setWorkText] = useState(null);
		const workTimerRef = useRef(null);
		useEffect(() => () => {
			if (balanceTimerRef.current !== null) window.clearTimeout(balanceTimerRef.current);
			if (whisperTimerRef.current !== null) window.clearTimeout(whisperTimerRef.current);
			if (workTimerRef.current !== null) window.clearTimeout(workTimerRef.current);
		}, []);
		/** 重置余额气泡的停留计时；重复触发先清旧定时器，否则旧的会提前收起。 */
		const armBalanceTimeout = () => {
			if (balanceTimerRef.current !== null) window.clearTimeout(balanceTimerRef.current);
			balanceTimerRef.current = window.setTimeout(() => setBalanceOn(false), BUBBLE_DURATION_MS);
		};
		const showBalance = () => {
			setBalancePage(0);
			setBalanceOn(true);
			armBalanceTimeout();
		};
		const cycleBalance = () => {
			const pages = balancePageCount(input.balance);
			setBalancePage((page) => (page + 1) % pages);
			armBalanceTimeout();
		};
		const showWhisper = (text, parts, duration, hold = false) => {
			if (duration === 0) return;
			if (whisperHoldRef.current && !hold) return;
			setWhisperText(text);
			setWhisperImage(parts.image);
			setWhisperUrl(parts.url);
			setWhisperHold(hold);
			whisperHoldRef.current = hold;
			setWhisperOn(true);
			if (whisperTimerRef.current !== null) window.clearTimeout(whisperTimerRef.current);
			whisperTimerRef.current = hold ? null : window.setTimeout(() => setWhisperOn(false), duration ?? BUBBLE_DURATION_MS);
		};
		const clearWhisper = () => {
			if (whisperTimerRef.current !== null) window.clearTimeout(whisperTimerRef.current);
			whisperTimerRef.current = null;
			whisperHoldRef.current = false;
			setWhisperHold(false);
			setWhisperOn(false);
			setWhisperText(null);
			setWhisperImage(void 0);
		};
		const lightWork = (terminal) => {
			setWorkOn(true);
			if (workTimerRef.current !== null) window.clearTimeout(workTimerRef.current);
			workTimerRef.current = window.setTimeout(() => setWorkOn(false), terminal ? BUBBLE_DURATION_MS : WORK_BUBBLE_MS);
		};
		const hideWork = () => {
			if (workTimerRef.current !== null) window.clearTimeout(workTimerRef.current);
			workTimerRef.current = null;
			setWorkOn(false);
		};
		const resetWork = () => {
			hideWork();
			setWorkText(null);
		};
		const node = () => {
			const slot = decideBubbleSlot({
				workTerminal: input.workTerminal,
				workOn,
				workText,
				workHasTask: input.workHasTask,
				workStatusEnabled: input.workStatusEnabled,
				whisperOn,
				whisperText,
				whisperHold,
				balanceOn,
				balanceAvailable: input.balance !== null,
				balanceEnabled: input.balanceEnabled,
				balanceManual: input.balanceManual
			});
			if (slot === "balance") return input.balance === null ? null : h(BalanceBubble, {
				state: input.balance,
				on: balanceOn,
				index: balancePage,
				onCycle: cycleBalance
			});
			if (slot === "whisper") return whisperText === null ? null : h(WhisperBubble, {
				text: whisperText,
				image: whisperImage,
				url: whisperUrl,
				assetRoot: input.assetRoot,
				on: whisperOn
			});
			if (slot === "work" || slot === "work-terminal") return workText === null ? null : h(WhisperBubble, {
				text: workText,
				progress: input.workProgress,
				on: workOn
			});
			return null;
		};
		return {
			clearWhisper,
			cycleBalance,
			hideWork,
			lightWork,
			node,
			resetWork,
			showBalance,
			showWhisper,
			updateWorkText: setWorkText
		};
	};
}

//#endregion
//#region src/client/pet/animation/cues.ts
/** 工作状态是否处在「非终态」：终态（success / error）与空闲都不续播档位动画。 */
const isWorkActive = (state) => state !== null && state !== void 0 && state !== "success" && state !== "error";
function decideEndedCue(input) {
	const { animations, current, workState } = input;
	const isEvent = isEventAnim(animations.events, current);
	if (isEvent && isWorkActive(workState)) {
		const nextWork = nextWorkStatusAnim(animations.events?.workStatus ?? [], current);
		if (nextWork !== null) return {
			kind: "work-rotate",
			anim: nextWork
		};
		if (poolIncludes(animations.events?.workStatus ?? [], current)) return { kind: "work-replay" };
	}
	if (isEvent) return { kind: "event-done" };
	if (animations.turn.includes(current)) return { kind: "turn" };
	if (animations.drag.includes(current) || animations.clicks.includes(current)) return { kind: "interaction-done" };
	return { kind: "random" };
}

//#endregion
//#region src/client/pet/animation/asset-loader.ts
function createAssetLoader(timeoutMs) {
	/** 在途请求：销毁时统一中断，否则卸载后完成的响应会创建无人回收的地址。 */
	const inflight = new Set();
	return {
		load: (url, handlers) => {
			const controller = new AbortController();
			inflight.add(controller);
			const timer = window.setTimeout(() => controller.abort(), timeoutMs);
			const settle = () => {
				window.clearTimeout(timer);
				inflight.delete(controller);
			};
			fetch(url, {
				cache: "default",
				signal: controller.signal
			}).then((response) => {
				if (!response.ok) throw new Error("asset HTTP " + response.status);
				return response.blob();
			}).then((blob) => {
				settle();
				handlers.onObjectUrl(URL.createObjectURL(blob));
			}).catch((error) => {
				settle();
				handlers.onError(error);
			});
		},
		abortAll: () => {
			for (const controller of inflight) controller.abort();
			inflight.clear();
		},
		release: (objectUrl) => {
			URL.revokeObjectURL(objectUrl);
		}
	};
}

//#endregion
//#region src/client/pet/animation/assets.ts
function animationAssetUrl(source) {
	if (source.cueUrl) return source.cueUrl;
	const root = source.assetRoot === "" ? source.id : source.assetRoot;
	return ROUTE_PATH + "/thumb/" + encodeURIComponent(root) + "/" + encodeURIComponent(source.anim) + source.ext;
}

//#endregion
//#region src/client/pet/animation/media.ts
/** 本次会话已定论的扩展名，`null` = 尚未判断。 */
let resolvedExt = null;
function prefersMov() {
	const ua = navigator.userAgent;
	if (/iPhone|iPad|iPod/i.test(ua)) return true;
	if (/Chrome|Chromium|Edg|OPR|Firefox|FxiOS/i.test(ua)) return false;
	return /Mac/i.test(navigator.platform || ua);
}
function thumbExt() {
	if (resolvedExt === null) {
		const explicit = ANIMATION_EXT;
		resolvedExt = explicit === ".mov" || prefersMov() ? ".mov" : ".webm";
	}
	return resolvedExt;
}

//#endregion
//#region src/client/pet/animation/animation.ts
/** 换源失败与打断的原因，落进回执的 `reason` 字段。 */
const REASON_ASSET_LOAD = "asset-load";
const REASON_PLAY_REJECTED = "play-rejected";
const REASON_DECODE = "decode-error";
const REASON_SUPERSEDED = "superseded";
const REASON_FROZEN = "frozen";
/** 资源超时（ms）：DSH WebServer 偶发 stalled，超时就丢弃本次换源。 */
const ASSET_FETCH_TIMEOUT_MS = 1e4;
/** 日志时间戳：与其余宠物日志同一格式，便于对照同一次事件。 */
const stamp$2 = (petId) => new Date().toTimeString().slice(0, 8) + " pet=" + petId;
function createOwnAnimation(deps) {
	/** 当前前台槽位：0 = A，1 = B。 */
	let front = 0;
	/** 挂起的换源；`null` = 没有换源在等首帧。 */
	let pending = null;
	/** 换源世代号，只增不减。 */
	let gen = 0;
	/** 待消费的点播地址，一次性取走。 */
	let cueUrl = null;
	/** 正在播的点播编号。 */
	let playing = null;
	/** 冻结标志：只挡自动来源，显式指令照常。 */
	let frozen = deps.initiallyFrozen;
	/** 两个槽位各自的 blob 地址，换源时先释放旧的。 */
	const blobUrl = {
		a: null,
		b: null
	};
	const loader = deps.loader ?? createAssetLoader(ASSET_FETCH_TIMEOUT_MS);
	/** 挂载标志：卸载后迟到的加载结果直接丢弃。 */
	let mounted = true;
	const slotOf = (index) => index === 0 ? "a" : "b";
	const elementOf = (index) => index === 0 ? deps.videoA() : deps.videoB();
	const frontVideo = () => elementOf(front);
	/** 上报并清掉「正在播」的编号；`keep` 为真时不清（同一编号继续播）。 */
	const reportOnce = (playbackId, status, reason) => {
		if (playing === playbackId) playing = null;
		deps.report(playbackId, status, reason);
	};
	const switchTo = (next, nextOnce, cuePlaybackId) => {
		if (cuePlaybackId !== null) deps.clearCuePlayback();
		const cfg = deps.cfg();
		const url = cueUrl;
		cueUrl = null;
		if (next === "") return;
		if (pending !== null && pending.anim === next && pending.once === nextOnce) {
			if (cuePlaybackId !== null) {
				playing = cuePlaybackId;
				deps.report(cuePlaybackId, "playing");
			}
			return;
		}
		if (isEventAnim(cfg.animations.events, next)) console.log("[dsh-zdd-pet] " + stamp$2(cfg.id) + " switch " + next + " once=" + nextOnce);
		const swapGen = gen += 1;
		pending = {
			anim: next,
			once: nextOnce,
			gen: swapGen
		};
		const targetIndex = front === 0 ? 1 : 0;
		const el = elementOf(targetIndex);
		if (el === null) return;
		el.loop = !nextOnce;
		el.muted = true;
		el.autoplay = true;
		el.playsInline = true;
		el.onended = nextOnce ? (event) => deps.onEnded(handleEnded(event)) : null;
		el.onerror = cuePlaybackId === null ? null : () => reportOnce(cuePlaybackId, "failed", REASON_DECODE);
		const assetUrl = animationAssetUrl({
			cueUrl: url,
			assetRoot: cfg.assetRoot ?? "",
			id: cfg.id,
			anim: next,
			ext: thumbExt()
		});
		loader.load(assetUrl, {
			onObjectUrl: (objectUrl) => {
				if (!mounted) {
					loader.release(objectUrl);
					return;
				}
				if (pending?.gen !== swapGen) {
					loader.release(objectUrl);
					return;
				}
				const slot = slotOf(targetIndex);
				const previous = blobUrl[slot];
				if (previous !== null) loader.release(previous);
				blobUrl[slot] = objectUrl;
				el.src = objectUrl;
				el.load();
			},
			onError: (error) => {
				if (!mounted) return;
				if (pending?.gen !== swapGen) return;
				pending = null;
				if (cuePlaybackId !== null) reportOnce(cuePlaybackId, "failed", REASON_ASSET_LOAD);
				console.warn("[dsh-zdd-pet] 素材加载失败 pet=" + cfg.id + " anim=" + next + "：" + (error instanceof Error ? error.message : String(error)) + "（已释放本次切换）");
			}
		});
		const onReady = () => {
			el.removeEventListener("loadeddata", onReady);
			if (pending?.gen !== swapGen) return;
			const outgoing = elementOf(front);
			el.classList.add("is-front");
			if (outgoing !== null && outgoing !== el) {
				outgoing.classList.remove("is-front");
				outgoing.onended = null;
				outgoing.onerror = null;
				outgoing.pause();
				if (playing !== null && playing !== cuePlaybackId) reportOnce(playing, "cancelled", REASON_SUPERSEDED);
			}
			front = front === 0 ? 1 : 0;
			pending = null;
			playing = cuePlaybackId;
			el.style.transform = deps.facing() === "right" ? "scaleX(-1)" : "";
			el.play().then(() => {
				if (cuePlaybackId !== null) deps.report(cuePlaybackId, "playing");
			}).catch(() => {
				if (cuePlaybackId !== null) reportOnce(cuePlaybackId, "failed", REASON_PLAY_REJECTED);
			});
			deps.onFrontReady(el);
		};
		el.addEventListener("loadeddata", onReady);
	};
	const handleEnded = (event) => {
		const endedOn = event === void 0 ? null : event.currentTarget;
		if (endedOn !== null && !endedOn.classList.contains("is-front")) return { kind: "ignore" };
		const done = playing;
		if (done !== null) {
			playing = null;
			deps.report(done, "ended");
		}
		if (deps.isDragging()) return { kind: "ignore" };
		if (frozen) return { kind: "ignore" };
		const cue = decideEndedCue({
			animations: deps.cfg().animations,
			current: deps.currentAnim(),
			workState: deps.workStatus()?.state
		});
		const petId = deps.cfg().id;
		if (cue.kind === "work-rotate") console.log("[dsh-zdd-pet] " + stamp$2(petId) + " workStatus 档内轮换: " + deps.currentAnim() + " -> " + cue.anim);
		else if (cue.kind === "work-replay") console.log("[dsh-zdd-pet] " + stamp$2(petId) + " workStatus 循环续播: " + deps.currentAnim());
		else if (cue.kind === "event-done") console.log("[dsh-zdd-pet] " + stamp$2(petId) + " 事件动画播完 ended anim=" + deps.currentAnim());
		return cue;
	};
	return {
		switchTo,
		handleEnded,
		stopLoopingFront: () => {
			const el = frontVideo();
			if (el === null) return;
			el.loop = false;
			el.onended = (event) => deps.onEnded(handleEnded(event));
		},
		setCueUrl: (url) => {
			cueUrl = url;
		},
		setFrozen: (next) => {
			if (frozen === next) return null;
			frozen = next;
			if (next) {
				frontVideo()?.pause();
				if (playing !== null) reportOnce(playing, "cancelled", REASON_FROZEN);
				return { kind: "frozen" };
			}
			return { kind: "resumed" };
		},
		isFrozen: () => frozen,
		frontVideo,
		playingPlayback: () => playing,
		dispose: () => {
			mounted = false;
			loader.abortAll();
			if (blobUrl.a !== null) loader.release(blobUrl.a);
			if (blobUrl.b !== null) loader.release(blobUrl.b);
			blobUrl.a = null;
			blobUrl.b = null;
		}
	};
}

//#endregion
//#region src/client/pose.ts
/** petId → 取当前实况的函数；PetCard 挂载时注册、卸载时摘除。 */
const readers$1 = new Map();
function registerPose(petId, read) {
	readers$1.set(petId, read);
	return () => {
		if (readers$1.get(petId) === read) readers$1.delete(petId);
	};
}
function readPose(petId) {
	if (typeof petId !== "string" || petId === "") return null;
	const read = readers$1.get(petId);
	return read === void 0 ? null : read();
}

//#endregion
//#region src/client/progress.ts
/** petId → 取当前进度的函数；PetCard 挂载时注册、卸载时摘除。 */
const readers = new Map();
function registerProgress(petId, read) {
	readers.set(petId, read);
	return () => {
		if (readers.get(petId) === read) readers.delete(petId);
	};
}
function readProgress(petId) {
	if (typeof petId !== "string" || petId === "") return null;
	const read = readers.get(petId);
	return read === void 0 ? null : read();
}

//#endregion
//#region src/client/pet/card/animation.ts
function createCardAnimation(rt) {
	const { useEffect, useRef } = rt;
	return function useCardAnimation(input) {
		const { card, cfgRef, live, pendingSquash, petId, workStatusRef } = input;
		const ownAnimRef = useRef(null);
		ownAnimRef.current ?? (ownAnimRef.current = createOwnAnimation({
			videoA: input.videoA,
			videoB: input.videoB,
			cfg: () => cfgRef.current,
			currentAnim: () => card.animRef.current,
			workStatus: () => workStatusRef.current,
			facing: () => card.facingRef.current,
			report: input.report,
			clearCuePlayback: () => input.setCuePlayback(null),
			onFrontReady: (el) => {
				if (pendingSquash.current) {
					pendingSquash.current = false;
					live.current.squash.start(el);
				}
				if (live.current.walk.hasPending()) live.current.walk.start(el);
			},
			onEnded: (cue) => live.current.flow?.applyEndedCue(cue),
			isDragging: () => live.current.drag.isActive(),
			initiallyFrozen: input.lock?.locked === true && input.lock.expiresAt > Date.now()
		}));
		const ownAnim = ownAnimRef.current;
		live.current.ownAnim = ownAnim;
		const { anim, cuePlayback, once, seq } = card.state;
		useEffect(() => {
			ownAnim.switchTo(anim, once, cuePlayback);
		}, [
			anim,
			once,
			seq,
			cuePlayback
		]);
		useEffect(() => {
			const services = live.current;
			const onResize = () => card.actions.setCustomPos((prev) => {
				if (!prev) return prev;
				const { size } = cfgRef.current;
				const { halfW, halfH, bottomPad } = derivePetMetrics(size);
				const viewport = {
					width: window.innerWidth,
					height: window.innerHeight
				};
				const half = {
					w: halfW,
					h: halfH
				};
				const box = centerToBox(prev, viewport, half);
				return { ...boxToRatio(clampReachableBox(box, viewport, {
					size,
					bottomPad
				}), viewport, half) };
			});
			window.addEventListener("resize", onResize);
			const unregisterPose = registerPose(petId, () => {
				const center = live.current.center();
				return {
					x: center.x / window.innerWidth,
					y: center.y / window.innerHeight,
					facing: card.facingRef.current
				};
			});
			const unregisterProgress = registerProgress(petId, () => {
				const el = ownAnim.frontVideo();
				const playbackId = ownAnim.playingPlayback();
				const anim$1 = card.animRef.current;
				if (el === null) return {
					playbackId,
					anim: anim$1,
					currentTime: 0,
					duration: 0,
					paused: true,
					buffering: false
				};
				const duration = Number.isFinite(el.duration) && el.duration > 0 ? el.duration : 0;
				return {
					playbackId,
					anim: anim$1,
					currentTime: el.currentTime,
					duration,
					paused: el.paused,
					buffering: el.readyState < 3 || el.seeking
				};
			});
			return () => {
				window.removeEventListener("resize", onResize);
				unregisterPose();
				unregisterProgress();
				ownAnim.dispose();
				services.stopMove();
				services.drag.stopFollow();
				services.flight.stop();
				services.squash.stop();
			};
		}, []);
		return ownAnim;
	};
}

//#endregion
//#region src/shared/score.ts
const SCORE_MIN_SPEED = 400;
/** 每 100 px/s 记 1 分（基准尺寸 462px 下）。 */
const SCORE_SPEED_PER_POINT = 100;
const clickScore = (speed, size) => {
	if (speed <= 0 || size <= 0) return 0;
	return Math.max(1, Math.round(speed / SCORE_SPEED_PER_POINT * (PET_REF_WIDTH / size)));
};

//#endregion
//#region src/shared/score-popup.ts
const SCORE_POPUP_DURATION_MS = 2200;
const SCORE_POPUP_CSS = [
	".dsh-zdd-pet-score{position:fixed;z-index:2147483002;min-width:120px;text-align:center;",
	"background:rgba(255,255,255,.97);border:1px solid rgba(255,179,0,.35);border-radius:12px;",
	"box-shadow:0 10px 32px rgba(0,0,0,.22);padding:8px 16px 9px;user-select:none;pointer-events:auto;",
	"font-family:var(--dsh-zdd-pet-font-family,'ShangshouSoftCandy','Yuanti SC','YouYuan','幼圆','Comic Sans MS','PingFang SC','Microsoft YaHei',sans-serif);}",
	".dsh-zdd-pet-score.is-in{animation:dshPetScorePop .28s ease}",
	".dsh-zdd-pet-score-val{font-size:22px;line-height:1.25;font-weight:700;color:#ff8f00;font-variant-numeric:tabular-nums}",
	".dsh-zdd-pet-score-sub{font-size:11px;line-height:1.4;color:rgba(43,43,43,.6);margin-top:2px;white-space:nowrap}",
	".dsh-zdd-pet-score-burst{position:fixed;inset:0;pointer-events:none;z-index:2147483002}",
	".dsh-zdd-pet-score-particle{position:absolute;border-radius:50%;pointer-events:none}",
	"@keyframes dshPetScorePop{from{transform:scale(.6);opacity:0}to{transform:scale(1);opacity:1}}"
].join("");
/** 样式只注入一次（同 CHAT_CSS 的注入模式）。 */
let scoreCssInjected = false;
function injectScoreCss() {
	if (scoreCssInjected || typeof document === "undefined") return;
	scoreCssInjected = true;
	const tag = document.createElement("style");
	tag.dataset.plugin = "dsh-zdd-pet";
	tag.dataset.pluginCss = "dsh-zdd-pet/score";
	tag.textContent = SCORE_POPUP_CSS;
	document.head.appendChild(tag);
}
/** 粒子数量。 */
const BURST_COUNT = 20;
/** 初速范围（px/s）。 */
const BURST_SPEED_MIN = 120;
const BURST_SPEED_MAX = 460;
/** 重力（px/s²）：粒子向上喷出后回落。 */
const BURST_GRAVITY = 700;
/** 单粒子寿命范围（ms）。 */
const BURST_LIFE_MIN = 500;
const BURST_LIFE_MAX = 900;
/** 粒子半径范围（px）。 */
const BURST_RADIUS_MIN = 3;
const BURST_RADIUS_MAX = 7;
/** 暖色盘（积分与庆祝感）。 */
const BURST_COLORS = [
	"#ffb300",
	"#ff8f00",
	"#ff7043",
	"#f4511e",
	"#ffc400",
	"#ffd54f",
	"#ef5350"
];
function spawnScoreBurst(x, y) {
	if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
	injectScoreCss();
	const root = document.createElement("div");
	root.className = "dsh-zdd-pet-score-burst";
	document.body.appendChild(root);
	const parts = [];
	for (let i = 0; i < BURST_COUNT; i++) {
		const angle = Math.random() * Math.PI * 2;
		const speed = BURST_SPEED_MIN + Math.random() * (BURST_SPEED_MAX - BURST_SPEED_MIN);
		const r = BURST_RADIUS_MIN + Math.random() * (BURST_RADIUS_MAX - BURST_RADIUS_MIN);
		const el = document.createElement("div");
		el.className = "dsh-zdd-pet-score-particle";
		el.style.left = x + "px";
		el.style.top = y + "px";
		el.style.width = r * 2 + "px";
		el.style.height = r * 2 + "px";
		el.style.background = BURST_COLORS[Math.floor(Math.random() * BURST_COLORS.length)];
		root.appendChild(el);
		parts.push({
			el,
			vx: Math.cos(angle) * speed,
			vy: Math.sin(angle) * speed - 80,
			t0: performance.now(),
			life: BURST_LIFE_MIN + Math.random() * (BURST_LIFE_MAX - BURST_LIFE_MIN)
		});
	}
	const step = () => {
		const now = performance.now();
		let alive = false;
		for (const p of parts) {
			const tSec = (now - p.t0) / 1e3;
			const lifeRatio = (now - p.t0) / p.life;
			if (lifeRatio >= 1) continue;
			alive = true;
			p.el.style.transform = "translate(" + p.vx * tSec + "px," + (p.vy * tSec + .5 * BURST_GRAVITY * tSec * tSec) + "px)";
			p.el.style.opacity = String(Math.max(0, 1 - lifeRatio));
		}
		if (alive) requestAnimationFrame(step);
		else root.remove();
	};
	requestAnimationFrame(step);
}
function mountScorePopup(opts) {
	injectScoreCss();
	const x = opts.x;
	const y = opts.y;
	const root = document.createElement("div");
	root.className = "dsh-zdd-pet-score";
	const val = document.createElement("div");
	val.className = "dsh-zdd-pet-score-val";
	val.textContent = "+" + opts.score;
	const sub = document.createElement("div");
	sub.className = "dsh-zdd-pet-score-sub";
	sub.textContent = "速度 " + Math.round(opts.speed) + " · 大小 " + Math.round(opts.size);
	root.appendChild(val);
	root.appendChild(sub);
	document.body.appendChild(root);
	const rr = root.getBoundingClientRect();
	root.style.left = Math.max(4, Math.min(x - rr.width / 2, window.innerWidth - rr.width - 4)) + "px";
	root.style.top = Math.max(4, y - rr.height - 14) + "px";
	root.offsetWidth;
	root.classList.add("is-in");
	let closed = false;
	let timer = null;
	const close = () => {
		if (closed) return;
		closed = true;
		if (timer !== null) window.clearTimeout(timer);
		timer = null;
		document.removeEventListener("mousedown", onDocPointerDown, true);
		document.removeEventListener("keydown", onDocKeyDown, true);
		root.remove();
		if (opts.onClose) opts.onClose();
	};
	const mountedAt = performance.now();
	let graceConsumed = false;
	const onDocPointerDown = (e) => {
		if (closed) return;
		if (!graceConsumed) {
			graceConsumed = true;
			if (e.timeStamp - mountedAt < 300) return;
		}
		if (root.contains(e.target)) return;
		close();
	};
	const onDocKeyDown = (e) => {
		if (closed) return;
		if (e.key === "Escape") close();
	};
	document.addEventListener("mousedown", onDocPointerDown, true);
	document.addEventListener("keydown", onDocKeyDown, true);
	timer = window.setTimeout(close, SCORE_POPUP_DURATION_MS);
	return {
		el: root,
		close
	};
}

//#endregion
//#region src/client/pet/motion/drag-follow.ts
function createDragFollow(deps) {
	/** 在跑的 rAF；`null` = 没在追。 */
	let frame = null;
	/** 世代号：起跑或停下 +1，迟到的帧据此自弃。 */
	let token = 0;
	/** 追赶目标；`null` = 没有目标。 */
	let target = null;
	/** 上一帧的速度（px/s），跨帧累积出过阻尼手感。 */
	let velocity = {
		vx: 0,
		vy: 0
	};
	/** 上一帧的时刻（ms）。 */
	let last = 0;
	const stop = () => {
		token++;
		if (frame !== null) {
			cancelAnimationFrame(frame);
			frame = null;
		}
		target = null;
		velocity = {
			vx: 0,
			vy: 0
		};
	};
	const aim = (next) => {
		target = next;
	};
	const start = (rootEl) => {
		if (frame !== null) return;
		const current = deps.card();
		const spring = current.physics.throwPower;
		const own = ++token;
		last = performance.now();
		const step = () => {
			if (token !== own) return;
			const goal = target;
			if (!goal) {
				frame = null;
				return;
			}
			const now = performance.now();
			const dt = Math.min((now - last) / 1e3, 1 / 30);
			last = now;
			const box = current.box() ?? {
				x: 0,
				y: 0
			};
			let x = box.x;
			let y = box.y;
			velocity.vx = springStep(velocity.vx, x, goal.x, dt, spring);
			velocity.vy = springStep(velocity.vy, y, goal.y, dt, spring);
			x += velocity.vx * dt;
			y += velocity.vy * dt;
			current.setBox({
				x,
				y
			});
			rootEl.style.left = x + "px";
			rootEl.style.top = y + "px";
			rootEl.style.right = "auto";
			rootEl.style.bottom = "auto";
			frame = requestAnimationFrame(step);
		};
		frame = requestAnimationFrame(step);
	};
	return {
		aim,
		start,
		stop
	};
}

//#endregion
//#region src/client/pet/motion/touch-press.ts
/**
* 触屏长按：按住到一定时长把这次按压当右键，计时期间手指移动超过容差就取消。
* 不负责右键菜单本身，也不碰拖拽与点击判定——到点只回调，派发交给调用方。
* 鼠标与笔不走这条分支，起表前先按指针类型挡掉。
* 不变量：同一时刻只有一个计时器；到点时按压若已结束，回调自弃。
* @module dsh-zdd-pet/src/client/pet/motion/touch-press
*/
/** 触屏长按多久算右键（ms）。 */
const LONG_PRESS_MS = 500;
/** 计时期间手指移动超过这个距离就取消（px）。 */
const SLOP_PX = 8;
function createTouchPress(deps) {
	/** 待触发的计时器；`null` = 没有在等。 */
	let timer = null;
	/** 本次按下的现场，到点时交给回调。 */
	let pending = null;
	const cancel = () => {
		if (timer !== null) {
			clearTimeout(timer);
			timer = null;
		}
		pending = null;
	};
	const arm = (target) => {
		cancel();
		if (target.pointerType === "mouse" || target.pointerType === "pen") return;
		pending = target;
		timer = setTimeout(() => {
			timer = null;
			const current = pending;
			pending = null;
			if (current === null || !deps.stillHolding()) return;
			deps.onMenu(current);
		}, LONG_PRESS_MS);
	};
	const move = (distancePx) => {
		if (timer === null) return;
		if (distancePx > SLOP_PX) cancel();
	};
	return {
		arm,
		cancel,
		isArmed: () => timer !== null,
		move
	};
}

//#endregion
//#region src/client/pet/motion/drag-release.ts
function decideRelease(input) {
	if (input.sling) {
		const pullX = input.box.x + input.half.w - input.anchor.x;
		const pullY = input.box.y + input.half.h - input.anchor.y;
		const dist = Math.hypot(pullX, pullY);
		const power = slingshotPower(dist, input.size);
		return {
			kind: "sling",
			dist,
			power,
			velocity: slingshotVelocity(pullAngle(pullX, pullY), power, input.physics.throwPower)
		};
	}
	const velocity = estimateReleaseVelocity(input.trail, input.now, input.physics);
	return velocity ? {
		kind: "throw",
		velocity
	} : { kind: "place" };
}

//#endregion
//#region src/client/pet/motion/drag.ts
/** 复位的按下状态：避免每个实例各写一份字面量。 */
const IDLE_PRESS = {
	active: false,
	dragging: false,
	sx: 0,
	sy: 0,
	offX: 0,
	offY: 0,
	sling: false,
	anchorX: 0,
	anchorY: 0
};
/** 松手后这段时间内的指针事件视为同一次拖拽的尾巴（ms）。 */
const JUST_DRAGGED_MS = 100;
/** 日志行的时刻前缀。 */
const stamp$1 = () => new Date().toTimeString().slice(0, 8);
/** 一行带时刻与宠物 id 的日志：客户端统一前缀，便于按宠物 grep。 */
const log$1 = (petId, message) => {
	console.log("[dsh-zdd-pet] " + stamp$1() + " pet=" + petId + " " + message);
};
/**
* 抓取瞬间记一行速度，手速够快就打分。
*
* @param current - 当帧能力。
* @param x - 指针横坐标（px），分数从这里弹出。
* @param y - 指针纵坐标（px）。
* @returns 是否打过分；调用方据此让随后的 click 不再播普通点击动画。
*/
function noteGrab(current, x, y) {
	const grab = current.grabVelocity();
	const speed = grab ? Math.hypot(grab.vx, grab.vy) : 0;
	log$1(current.petId, "grab vx=" + (grab ? Math.round(grab.vx) : 0) + " vy=" + (grab ? Math.round(grab.vy) : 0) + " |v|=" + Math.round(speed));
	if (speed < SCORE_MIN_SPEED) return false;
	const score = clickScore(speed, current.size);
	log$1(current.petId, "click-score speed=" + Math.round(speed) + " size=" + current.size + " -> +" + score);
	spawnScoreBurst(x, y);
	mountScorePopup({
		x,
		y,
		score,
		speed,
		size: current.size
	});
	return true;
}
function createDrag(card) {
	let press = { ...IDLE_PRESS };
	/** 「刚拖完」窗口的截止时刻（ms）；用时刻而不是定时器，读的时候再判，少一个待清理的句柄。 */
	let justDraggedUntil = 0;
	let pressScoreFired = false;
	let lastPressAt = 0;
	/** 指针轨迹采样，供初速估算。 */
	let trail = [];
	const follow = createDragFollow({ card });
	/** 触屏长按：计时与容差在 motion/touch-press.ts，到点后把这次按压当右键。 */
	const touchPress = createTouchPress({
		onMenu: (target) => {
			press.active = false;
			pressScoreFired = true;
			if (target.el.hasPointerCapture(target.pointerId)) target.el.releasePointerCapture(target.pointerId);
			log$1(card().petId, "-> [TOUCH-MENU]");
			target.el.dispatchEvent(new MouseEvent("contextmenu", {
				bubbles: true,
				button: 2,
				cancelable: true,
				clientX: target.x,
				clientY: target.y,
				view: window
			}));
		},
		stillHolding: () => press.active && !press.dragging
	});
	/**
	* 记下这次按下的几何与弹弓判定。
	*
	* @param c - 当帧能力。
	* @param e - 按下事件。
	* @returns 新的按下状态。
	*/
	const beginPress = (c, e) => {
		e.currentTarget.classList.add("dragging");
		e.currentTarget.setPointerCapture(e.pointerId);
		c.setTipOn(false);
		const rootEl = c.root();
		let offX = 0;
		let offY = 0;
		if (rootEl) {
			const rr = rootEl.getBoundingClientRect();
			offX = e.clientX - (rr.left + rr.width / 2);
			offY = e.clientY - (rr.top + rr.height / 2);
			c.setBox({
				x: rr.left,
				y: rr.top
			});
		}
		const pressNow = performance.now();
		const sling = pressNow - lastPressAt < SLINGSHOT_DOUBLE_MS;
		lastPressAt = sling ? 0 : pressNow;
		const anchor = c.box();
		return {
			active: true,
			anchorX: anchor ? anchor.x + c.halfW : e.clientX,
			anchorY: anchor ? anchor.y + c.halfH : e.clientY,
			dragging: false,
			offX,
			offY,
			sling,
			sx: e.clientX,
			sy: e.clientY
		};
	};
	const onPointerDown = (e) => {
		const c = card();
		if (e.button !== 0) return;
		if (c.isFrozen()) c.releaseLock();
		pressScoreFired = noteGrab(c, e.clientX, e.clientY);
		c.stopFlight();
		follow.stop();
		c.stopAutonomy();
		trail = [];
		press = beginPress(c, e);
		touchPress.arm({
			el: e.currentTarget,
			pointerId: e.pointerId,
			pointerType: e.pointerType,
			x: e.clientX,
			y: e.clientY
		});
	};
	const onPointerMove = (e) => {
		const c = card();
		if (c.tipOn()) c.placeTip(e.clientX, e.clientY);
		if (!press.active) return;
		const dx = e.clientX - press.sx;
		const dy = e.clientY - press.sy;
		touchPress.move(Math.hypot(dx, dy));
		if (!press.dragging) {
			if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
			press.dragging = true;
			c.setDragging(true);
			c.setOnce(true);
			if (c.dragAnims.length) {
				const name = pick(c.dragAnims);
				log$1(c.petId, "-> [DRAG] " + name);
				c.playAnim(name);
			}
		}
		const now = performance.now();
		trail = trimTrail([...trail, {
			t: now,
			x: e.clientX,
			y: e.clientY
		}], now);
		follow.aim({
			x: e.clientX - press.offX - c.halfW,
			y: e.clientY - press.offY - c.halfH
		});
		const rootEl = c.root();
		if (rootEl) follow.start(rootEl);
		const stageEl = c.stage();
		if (stageEl) stageEl.style.transform = "none";
	};
	/**
	* 松手结算：原地放下、甩抛或弹弓。
	*
	* @param c - 当帧能力。
	* @param e - 松开事件；指针没跟上时用它兜底算落点。
	*/
	const settleRelease = (c, e) => {
		const current = c.box();
		const box = current ?? {
			x: e.clientX - press.offX - c.halfW,
			y: e.clientY - press.offY - c.halfH
		};
		const decision = decideRelease({
			anchor: {
				x: press.anchorX,
				y: press.anchorY
			},
			box,
			half: {
				w: c.halfW,
				h: c.halfH
			},
			now: performance.now(),
			physics: c.physics,
			size: c.size,
			sling: press.sling,
			trail
		});
		trail = [];
		if (decision.kind === "sling") {
			log$1(c.petId, "sling dist=" + Math.round(decision.dist) + " power=" + decision.power.toFixed(2) + " vx=" + Math.round(decision.velocity.vx) + " vy=" + Math.round(decision.velocity.vy));
			c.startFlight(box.x, box.y, decision.velocity.vx, decision.velocity.vy);
			return;
		}
		if (decision.kind === "throw") {
			const { vx, vy } = decision.velocity;
			log$1(c.petId, "release vx=" + Math.round(vx) + " vy=" + Math.round(vy) + " |v|=" + Math.round(Math.hypot(vx, vy)));
			c.startFlight(box.x, box.y, vx, vy);
			return;
		}
		c.commitPlace(box);
	};
	/**
	* 松手后把提示摆回光标处并点亮；指针已移出命中区时保持收起。
	*
	* @param c - 当帧能力。
	* @param e - 松开事件。
	*/
	const restoreTip = (c, e) => {
		const hitRect = e.currentTarget.getBoundingClientRect();
		const inside = e.clientX >= hitRect.left && e.clientX <= hitRect.right && e.clientY >= hitRect.top && e.clientY <= hitRect.bottom;
		if (!inside) return;
		c.placeTip(e.clientX, e.clientY);
		c.setTipOn(true);
	};
	const onPointerUp = (e) => {
		const c = card();
		touchPress.cancel();
		const wasDragging = press.dragging;
		press.active = false;
		press.dragging = false;
		e.currentTarget.classList.remove("dragging");
		follow.stop();
		if (wasDragging) {
			justDraggedUntil = performance.now() + JUST_DRAGGED_MS;
			c.setDragging(false);
			const stageEl = c.stage();
			if (stageEl) stageEl.style.transform = "translateY(" + c.bottomPad + "px)";
			if (!c.resumeWork()) {
				if (c.idleAnims.length) c.playAnim(pick(c.idleAnims, c.currentAnim));
				c.setOnce(true);
			}
			settleRelease(c, e);
		}
		restoreTip(c, e);
	};
	const onClick = () => {
		const c = card();
		c.onActivity();
		if (press.active || press.dragging || performance.now() < justDraggedUntil) return;
		if (pressScoreFired) {
			pressScoreFired = false;
			c.stopFlight();
			c.stopAutonomy();
			return;
		}
		c.stopFlight();
		c.stopAutonomy();
		c.playClickSound();
		c.setOnce(true);
		if (c.clickTexts.length) c.sayText(pick(c.clickTexts));
		if (!c.clickAnims.length) return;
		const name = pick(c.clickAnims);
		log$1(c.petId, "-> [CLICK] " + name);
		c.markSquash();
		c.bumpSeq();
		c.playAnim(name);
	};
	return {
		isActive: () => press.active,
		justDragged: () => performance.now() < justDraggedUntil,
		onClick,
		onPointerDown,
		onPointerMove,
		onPointerUp,
		stopFollow: follow.stop
	};
}

//#endregion
//#region src/client/pet/click-sound.ts
/** 音效文件地址。 */
const CLICK_SOUND_URL = ROUTE_PATH + "/sound/click-duck.wav";
/** 音量：与其余提示音同一档，不抢对话内容。 */
const CLICK_SOUND_VOLUME = .5;
/** 连点节流：100ms 内只响一次，避免连点变成噪音。 */
const CLICK_SOUND_THROTTLE_MS = 100;
/** 复用的 audio 实例，首次播放时创建。 */
let clickAudio = null;
/** 上一次真正播放的时间戳（ms）。 */
let lastClickSoundAt = 0;
/** 点击音效开关；配置未加载前保守静音。 */
let clickSoundEnabled = false;
function setClickSoundEnabled(enabled) {
	clickSoundEnabled = enabled;
}
function playClickSound() {
	if (!clickSoundEnabled) return;
	const now = Date.now();
	if (now - lastClickSoundAt < CLICK_SOUND_THROTTLE_MS) return;
	lastClickSoundAt = now;
	try {
		clickAudio ?? (clickAudio = new Audio(CLICK_SOUND_URL));
		clickAudio.volume = CLICK_SOUND_VOLUME;
		clickAudio.currentTime = 0;
		clickAudio.play().catch(() => {});
	} catch {}
}

//#endregion
//#region src/client/pet/card/drag.ts
function createCardDrag(rt) {
	const { useRef } = rt;
	return function useCardDrag(input) {
		const { bumpSeq, card, cfgRef, live, motion, pendingSquash, root, setAnim, setCustomPos, setDragging } = input;
		const { setOnce, setTipOn, stage } = input;
		const dragCard = () => {
			const metrics = motion.metrics();
			return {
				petId: cfgRef.current.id,
				size: metrics.size,
				halfW: metrics.halfW,
				halfH: metrics.halfH,
				bottomPad: metrics.bottomPad,
				physics: cfgRef.current.physics,
				dragAnims: cfgRef.current.animations.drag,
				clickAnims: cfgRef.current.animations.clicks,
				clickTexts: (() => {
					const base = Array.isArray(cfgRef.current.clickTexts) ? cfgRef.current.clickTexts : [];
					return input.mood ? [...input.mood.texts(base)] : base;
				})(),
				sayText: (text) => input.onSayText?.(text),
				onActivity: () => input.onActivity?.(),
				idleAnims: cfgRef.current.animations.idle,
				currentAnim: card.animRef.current,
				setOnce: (on) => setOnce(on),
				playAnim: (name) => setAnim(name),
				bumpSeq: () => bumpSeq(),
				markSquash: () => {
					pendingSquash.current = true;
				},
				setDragging,
				resumeWork: () => live.current.flow?.resumeWorkStatusAnim() ?? false,
				stopAutonomy: () => motion.stopMove(),
				stopFlight: () => motion.flight.stop(),
				startFlight: motion.startThrow,
				isFrozen: () => live.current.ownAnim.isFrozen(),
				releaseLock: () => live.current.releaseLock(),
				grabVelocity: () => motion.flight.isFlying() ? motion.flight.velocity() : null,
				playClickSound: () => playClickSound(),
				tipOn: () => live.current.tipOn(),
				placeTip: (x, y) => live.current.placeTip(x, y),
				setTipOn,
				stage,
				root,
				box: () => motion.box(),
				setBox: (box) => motion.setBox(box),
				commitPlace: (box) => {
					const metrics$1 = motion.metrics();
					const viewport = {
						width: window.innerWidth,
						height: window.innerHeight
					};
					const half = {
						w: metrics$1.halfW,
						h: metrics$1.halfH
					};
					const reached = clampReachableBox(box, viewport, metrics$1);
					const rootEl = root();
					if (rootEl) {
						rootEl.style.left = reached.x + "px";
						rootEl.style.top = reached.y + "px";
						rootEl.style.right = "auto";
						rootEl.style.bottom = "auto";
					}
					motion.setBox(reached);
					setCustomPos(boxToRatio(reached, viewport, half));
				}
			};
		};
		const dragRef = useRef(null);
		dragRef.current ?? (dragRef.current = createDrag(dragCard));
		const drag = dragRef.current;
		live.current.drag = drag;
		return drag;
	};
}

//#endregion
//#region src/client/pet/card/mood.ts
/** localStorage 键前缀：与桌面端 sprite/mood.js 保持一致（同一只宠物同一把键）。 */
const MOOD_KEY_PREFIX = "dsh-zdd-pet-mood-";
/** 定时衰减检查间隔（ms）：1 分钟足够，heartbeat 开销可忽略。 */
const DECAY_TICK_MS = 6e4;
const MOOD_EXCITE_ANIM = "原地冲刺跑";
const MOOD_EXCITE_SAFETY_MS = 9e3;
/** 从 localStorage 读一次；坏数据 / 无存储 → 初始值。 */
function readStored(petId, params) {
	const fallback = {
		value: clampMood(params.initial),
		savedAt: Date.now()
	};
	if (typeof window === "undefined") return fallback;
	try {
		const raw = window.localStorage.getItem(MOOD_KEY_PREFIX + petId);
		if (!raw) return fallback;
		const o = JSON.parse(raw);
		const value = Number(o.v);
		const savedAt = Number(o.t);
		if (!Number.isFinite(value)) return fallback;
		return {
			value: clampMood(value),
			savedAt: Number.isFinite(savedAt) ? savedAt : Date.now()
		};
	} catch {
		return fallback;
	}
}
/** 写回 localStorage；存不了就只在本会话内生效（与桌面端同一处理）。 */
function writeStored(petId, value, savedAt) {
	if (typeof window === "undefined") return;
	try {
		window.localStorage.setItem(MOOD_KEY_PREFIX + petId, JSON.stringify({
			v: clampMood(value),
			t: savedAt
		}));
	} catch {}
}
function createCardMood(rt) {
	const { useState, useEffect, useRef } = rt;
	return function useCardMood(input) {
		const petId = input.cfgRef.current.id;
		const params = () => readMoodParams(input.cfgRef.current.mood);
		const initialValue = (() => {
			const p = params();
			if (!p.enabled) return clampMood(p.initial);
			const stored = readStored(petId, p);
			return decayMood(stored.value, Date.now() - stored.savedAt, p.decayPerHour);
		})();
		const [value, setValue] = useState(initialValue);
		const valueRef = useRef(value);
		valueRef.current = value;
		const savedAtRef = useRef(Date.now());
		const excitedRef = useRef(false);
		const timerRef = useRef(null);
		const commit = (next) => {
			const v = clampMood(next);
			valueRef.current = v;
			savedAtRef.current = Date.now();
			setValue(v);
			writeStored(petId, v, savedAtRef.current);
		};
		useEffect(() => {
			const id = window.setInterval(() => {
				const p = params();
				if (!p.enabled) return;
				const now = Date.now();
				commit(decayMood(valueRef.current, now - savedAtRef.current, p.decayPerHour));
			}, DECAY_TICK_MS);
			return () => {
				window.clearInterval(id);
				if (timerRef.current !== null) {
					window.clearTimeout(timerRef.current);
					timerRef.current = null;
				}
			};
		}, []);
		const tier = () => {
			const p = params();
			return moodTier(valueRef.current, p.low, p.high);
		};
		const touch = (gain) => {
			const p = params();
			if (!p.enabled) return {
				value: valueRef.current,
				tier: "normal",
				hitMax: false
			};
			const g = Number.isFinite(gain) ? gain : p.touchGain;
			const next = clampMood(valueRef.current + g);
			commit(next);
			const hitMax = next >= 100 && !excitedRef.current;
			if (hitMax) excitedRef.current = true;
			return {
				value: next,
				tier: moodTier(next, p.low, p.high),
				hitMax
			};
		};
		const finishExcite = () => {
			if (!excitedRef.current) return valueRef.current;
			excitedRef.current = false;
			commit(61 + Math.floor(Math.random() * 39));
			return valueRef.current;
		};
		return {
			params,
			enabled: () => params().enabled,
			value: () => valueRef.current,
			tier,
			label: () => {
				const v = clampMood(valueRef.current);
				return "心情 " + v + "/100（" + moodLabel(tier()) + "）";
			},
			texts: (fallback) => {
				const p = params();
				return moodTextPool(p, moodTier(valueRef.current, p.low, p.high), fallback);
			},
			touch,
			finishExcite
		};
	};
}

//#endregion
//#region src/client/pet/card/rest.ts
/** 空闲检查间隔（ms）：15s 一次足够，开销可忽略。 */
const CHECK_INTERVAL_MS = 15e3;
function createCardRest(rt) {
	const { useEffect, useRef } = rt;
	return function useCardRest(input) {
		const sleepingRef = useRef(false);
		const lastRef = useRef(Date.now());
		useEffect(() => {
			const id = window.setInterval(() => {
				const r = input.cfgRef.current.rest;
				if (!r || r.enabled === false || sleepingRef.current) return;
				const sec = Number(r.sleepAfterSec);
				if (!Number.isFinite(sec) || sec <= 0) return;
				const idleMs = Date.now() - lastRef.current;
				const m = input.mood?.();
				const tier = m && m.enabled ? m.tier : "normal";
				const p = m?.params;
				if (tier === "high" && p && p.happyAnim && input.hasAnim?.(p.happyAnim)) {
					if (idleMs < sec * 1e3) return;
					lastRef.current = Date.now();
					input.actions.setAnim(p.happyAnim);
					input.actions.setOnce(true);
					input.actions.bumpSeq();
					return;
				}
				if (tier === "low" && p && p.sadAnim && input.hasAnim?.(p.sadAnim)) {
					if (idleMs < sec * .5 * 1e3) return;
					lastRef.current = Date.now();
					input.actions.setAnim(p.sadAnim);
					input.actions.setOnce(true);
					input.actions.bumpSeq();
					return;
				}
				const effSec = tier === "low" ? sec * .5 : sec;
				if (idleMs < effSec * 1e3) return;
				const anim = typeof r.sleepAnim === "string" && r.sleepAnim ? r.sleepAnim : "";
				if (!anim) return;
				sleepingRef.current = true;
				input.actions.setAnim(anim);
				input.actions.setOnce(false);
				input.actions.bumpSeq();
			}, CHECK_INTERVAL_MS);
			return () => window.clearInterval(id);
		}, []);
		const poke = () => {
			lastRef.current = Date.now();
			if (!sleepingRef.current) return;
			sleepingRef.current = false;
			const r = input.cfgRef.current.rest;
			const wake = r && typeof r.wakeAnim === "string" ? r.wakeAnim : "";
			if (wake) {
				input.actions.setAnim(wake);
				input.actions.setOnce(true);
				input.actions.bumpSeq();
			}
		};
		return { poke };
	};
}

//#endregion
//#region src/shared/chat/image-pick.ts
const IMAGE_TYPES = [
	"image/png",
	"image/jpeg",
	"image/webp",
	"image/gif"
];
const IMAGE_ACCEPT = IMAGE_TYPES.join(",");
/** 扩展名兜底：拖拽或部分系统来源不给 `file.type`。 */
const IMAGE_EXT = {
	png: "image/png",
	jpg: "image/jpeg",
	jpeg: "image/jpeg",
	webp: "image/webp",
	gif: "image/gif"
};
function imageMediaTypeOf(file) {
	const declared = String(file.type || "").toLowerCase();
	if (IMAGE_TYPES.includes(declared)) return declared;
	const ext = String(file.name || "").split(".").pop()?.toLowerCase();
	return ext === void 0 ? void 0 : IMAGE_EXT[ext];
}
function isImageFile(file) {
	return imageMediaTypeOf(file) !== void 0;
}
function dragHasFiles(e) {
	const types = e.dataTransfer?.types;
	if (!types) return false;
	return Array.from(types).includes("Files");
}
function firstImageFile(dataTransfer) {
	const files = dataTransfer?.files;
	if (!files) return void 0;
	for (const file of Array.from(files)) if (isImageFile(file)) return file;
	return void 0;
}
function firstImageFromClipboard(data) {
	if (!data) return void 0;
	const files = data.files;
	if (files) {
		for (const file of Array.from(files)) if (isImageFile(file)) return file;
	}
	const items = data.items;
	if (!items) return void 0;
	for (const item of Array.from(items)) {
		if (item.kind !== "file") continue;
		const file = item.getAsFile();
		if (file && isImageFile(file)) return file;
	}
	return void 0;
}

//#endregion
//#region src/shared/chat/encode.ts
const IMAGE_MAX_BYTES = 640 * 1024;
const IMAGE_MAX_SIDE = 2048;
const IMAGE_QUALITIES = [
	.85,
	.75,
	.65,
	.55
];
/** 预览缩略图的长边（像素）：只用于弹窗里那枚 24×24。 */
const PREVIEW_SIDE = 96;
function attachmentBytes(base64) {
	const pad$1 = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;
	return Math.floor(base64.length * 3 / 4) - pad$1;
}
function targetSize(width, height, maxSide = IMAGE_MAX_SIDE) {
	const scale = Math.min(1, maxSide / Math.max(width, height));
	return {
		width: Math.max(1, Math.round(width * scale)),
		height: Math.max(1, Math.round(height * scale))
	};
}
/**
* 把文件解码成 `<img>`。
*
* 用 `FileReader` 的 data URL 而不是 `URL.createObjectURL`：桌面 helper 的 CSP 是
* `img-src 'self' http: https: data:`，不含 `blob:`，objectURL 在那边会被拦成 onerror
* （表现为"这个文件解不出图片"，而浏览器端正常）。
*/
function loadImage(file) {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onerror = () => reject(new Error("这个文件读不出来"));
		reader.onload = () => {
			const url = typeof reader.result === "string" ? reader.result : "";
			if (!url) {
				reject(new Error("这个文件读不出来"));
				return;
			}
			const img = new Image();
			img.onload = () => resolve(img);
			img.onerror = () => reject(new Error("这个文件解不出图片"));
			img.src = url;
		};
		reader.readAsDataURL(file);
	});
}
/** 字节 → 规范 base64（分块，避免 String.fromCharCode 参数过多爆栈）。 */
function bytesToBase64(bytes) {
	let bin = "";
	const CHUNK = 32768;
	for (let i = 0; i < bytes.length; i += CHUNK) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK));
	return btoa(bin);
}
/** 把源按目标尺寸画进一张新画布。 */
function drawToCanvas(source, size) {
	const canvas = document.createElement("canvas");
	canvas.width = size.width;
	canvas.height = size.height;
	canvas.getContext("2d")?.drawImage(source, 0, 0, size.width, size.height);
	return canvas;
}
/** 缩略图：96px、JPEG 0.72，几 KB 就够 24×24 显示。 */
function previewOf(source, width, height) {
	return drawToCanvas(source, targetSize(width, height, PREVIEW_SIDE)).toDataURL("image/jpeg", .72);
}
function encodeCanvas(canvas) {
	const { width, height } = canvas;
	const previewUrl = previewOf(canvas, width, height);
	const floor = IMAGE_QUALITIES[IMAGE_QUALITIES.length - 1];
	for (const quality of IMAGE_QUALITIES) {
		const dataUrl = canvas.toDataURL("image/jpeg", quality);
		const base64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
		const bytes = attachmentBytes(base64);
		if (bytes <= IMAGE_MAX_BYTES || quality === floor) return {
			base64,
			mediaType: "image/jpeg",
			bytes,
			width,
			height,
			resized: true,
			previewUrl
		};
	}
	throw new Error("无法压到预算内");
}
async function encodeImageFile(file) {
	const mediaType = imageMediaTypeOf(file);
	if (!mediaType) throw new Error("不是可发送的图片");
	const img = await loadImage(file);
	const width = img.naturalWidth || img.width;
	const height = img.naturalHeight || img.height;
	const raw = new Uint8Array(await file.arrayBuffer());
	if (raw.length <= IMAGE_MAX_BYTES && Math.max(width, height) <= IMAGE_MAX_SIDE) return {
		base64: bytesToBase64(raw),
		mediaType,
		bytes: raw.length,
		width,
		height,
		resized: false,
		previewUrl: previewOf(img, width, height)
	};
	const target = targetSize(width, height);
	return encodeCanvas(drawToCanvas(img, target));
}

//#endregion
//#region src/shared/chat/icons.ts
/**
* 对话弹窗里的两枚内联 SVG 图标。
* 不用 emoji：同一个符号在不同字体回退链下会被渲染成异体字形（上传用的 🖼 在 Windows 上就是如此）。
* @module dsh-zdd-pet/src/shared/chat/icons
*/
/** SVG 图标共用的描边属性：一条线宽、随文字颜色。 */
const ICON_ATTRS = {
	fill: "none",
	stroke: "currentColor",
	"stroke-width": "1.8",
	"stroke-linecap": "round",
	"stroke-linejoin": "round",
	"aria-hidden": "true"
};
/** 造一个 SVG 子元素（属性原样写入，命名空间固定 SVG）。 */
function svgNode(tag, attrs) {
	const node = document.createElementNS("http://www.w3.org/2000/svg", tag);
	for (const [name, value] of Object.entries(attrs)) node.setAttribute(name, value);
	return node;
}
function pictureIcon(size = 16) {
	const svg = svgNode("svg", {
		viewBox: "0 0 24 24",
		width: String(size),
		height: String(size),
		...ICON_ATTRS
	});
	svg.append(svgNode("rect", {
		x: "3",
		y: "3",
		width: "18",
		height: "18",
		rx: "2"
	}), svgNode("circle", {
		cx: "8.5",
		cy: "8.5",
		r: "1.5"
	}), svgNode("path", { d: "M21 15l-5-5L5 21" }));
	return svg;
}
function cameraIcon(size = 16) {
	const svg = svgNode("svg", {
		viewBox: "0 0 24 24",
		width: String(size),
		height: String(size),
		...ICON_ATTRS
	});
	svg.append(svgNode("path", { d: "M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" }), svgNode("circle", {
		cx: "12",
		cy: "13",
		r: "4"
	}));
	return svg;
}

//#endregion
//#region src/shared/chat/styles.ts
const CHAT_CSS = [
	".dsh-zdd-pet-chat{position:fixed;z-index:2147483001;width:160px;max-width:80vw;",
	"background:rgba(255,255,255,.98);border:1px solid rgba(0,0,0,.12);border-radius:10px;",
	"box-shadow:0 10px 32px rgba(0,0,0,.22);color:#2b2b2b;font-size:14px;line-height:1.5;",
	"font-family:var(--dsh-zdd-pet-font-family,'ShangshouSoftCandy','Yuanti SC','YouYuan','幼圆','Comic Sans MS','PingFang SC','Microsoft YaHei',sans-serif);",
	"user-select:none}",
	".dsh-zdd-pet-chat *{box-sizing:border-box}",
	".dsh-zdd-pet-chat-input{display:block;width:100%;border:none;outline:none;background:transparent;",
	"padding:8px 11px 9px;font-size:14px;line-height:1.45;color:#2b2b2b;font-family:inherit;",
	"resize:none;overflow:hidden;white-space:pre-wrap;overflow-wrap:anywhere}",
	".dsh-zdd-pet-chat-input::placeholder{color:rgba(43,43,43,.45)}",
	".dsh-zdd-pet-chat-input:disabled{opacity:.55}",
	".dsh-zdd-pet-chat-actions{display:flex;align-items:center;gap:6px;padding:0 8px 7px}",
	".dsh-zdd-pet-chat-btn{display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;",
	"border:none;border-radius:6px;background:transparent;color:rgba(43,43,43,.62);font-size:14px;line-height:1;",
	"cursor:pointer;transition:background .15s,color .15s}",
	".dsh-zdd-pet-chat-btn:hover{background:rgba(0,0,0,.06);color:rgba(43,43,43,.9)}",
	".dsh-zdd-pet-chat-btn:disabled{opacity:.45;cursor:default}",
	".dsh-zdd-pet-chat-btn svg{display:block}",
	".dsh-zdd-pet-chat-attach{display:none;align-items:center;gap:4px;margin-left:2px}",
	".dsh-zdd-pet-chat-attach[data-on=\"1\"]{display:inline-flex}",
	".dsh-zdd-pet-chat-thumb{width:24px;height:24px;object-fit:cover;border-radius:4px;",
	"border:1px solid rgba(0,0,0,.1);flex:0 0 auto;background:rgba(0,0,0,.06)}",
	".dsh-zdd-pet-chat-attach-x{border:none;background:transparent;color:rgba(43,43,43,.45);cursor:pointer;",
	"font-size:12px;line-height:1;padding:2px 3px;border-radius:4px}",
	".dsh-zdd-pet-chat-attach-x:hover{background:rgba(0,0,0,.08);color:rgba(43,43,43,.85)}",
	".dsh-zdd-pet-chat-hint{display:none;color:rgba(43,43,43,.55);font-size:12px;padding:0 12px 8px}",
	".dsh-zdd-pet-chat-err{color:#d94f3d;font-size:12px;padding:0 12px 8px;white-space:pre-wrap;overflow-wrap:anywhere}"
].join("");
const CHAT_MIN_W = 160;
const CHAT_MAX_W = 340;
const CHAT_H_PAD = 22;
let chatCssInjected = false;
function injectChatCss() {
	if (chatCssInjected || typeof document === "undefined") return;
	chatCssInjected = true;
	const tag = document.createElement("style");
	tag.dataset.plugin = "dsh-zdd-pet";
	tag.dataset.pluginCss = "dsh-zdd-pet/chat";
	tag.textContent = CHAT_CSS;
	document.head.appendChild(tag);
}

//#endregion
//#region src/shared/chat/dom.ts
/** 提示自动收起的时间（ms）。 */
const HINT_MS = 2200;
/** 造一枚图标按钮（图标 + 无障碍标签）。 */
function iconButton(title, icon) {
	const btn = document.createElement("button");
	btn.type = "button";
	btn.className = "dsh-zdd-pet-chat-btn";
	btn.title = title;
	btn.setAttribute("aria-label", title);
	btn.appendChild(icon);
	return btn;
}
/** 输入框宽度随文本自适应：宽度按测量值，封顶后由高度接住折行。 */
function enableAutoResize(input, root) {
	let measureCtx = null;
	const resize = () => {
		const ctx = measureCtx ?? (measureCtx = document.createElement("canvas").getContext("2d"));
		ctx.font = getComputedStyle(input).font;
		const textW = ctx.measureText(input.value || " ").width;
		const w = Math.max(CHAT_MIN_W, Math.min(Math.ceil(textW + CHAT_H_PAD), CHAT_MAX_W));
		root.style.width = w + "px";
		input.style.height = "auto";
		input.style.height = Math.max(input.scrollHeight, 22) + "px";
	};
	input.addEventListener("input", resize);
	return resize;
}
function createChatDom(opts = {}) {
	const root = document.createElement("div");
	root.className = "dsh-zdd-pet-chat";
	const input = document.createElement("textarea");
	input.className = "dsh-zdd-pet-chat-input";
	input.placeholder = "说点什么…";
	input.setAttribute("aria-label", "与桌宠对话的输入框");
	input.maxLength = 2e3;
	input.rows = 1;
	const err = document.createElement("div");
	err.className = "dsh-zdd-pet-chat-err";
	err.style.display = "none";
	const hint = document.createElement("div");
	hint.className = "dsh-zdd-pet-chat-hint";
	let hintTimer = 0;
	const flash = (text) => {
		hint.textContent = text;
		hint.style.display = "block";
		window.clearTimeout(hintTimer);
		hintTimer = window.setTimeout(() => {
			hint.style.display = "none";
		}, HINT_MS);
	};
	const pickBtn = iconButton("上传图片", pictureIcon());
	const shotBtn = iconButton("截取当前屏幕", cameraIcon());
	const fileInput = document.createElement("input");
	fileInput.type = "file";
	fileInput.accept = IMAGE_ACCEPT;
	fileInput.style.display = "none";
	const attach = document.createElement("div");
	attach.className = "dsh-zdd-pet-chat-attach";
	const thumb = document.createElement("img");
	thumb.className = "dsh-zdd-pet-chat-thumb";
	thumb.alt = "已选图片";
	const attachX = document.createElement("button");
	attachX.type = "button";
	attachX.className = "dsh-zdd-pet-chat-attach-x";
	attachX.textContent = "✕";
	attachX.title = "移除图片";
	attachX.setAttribute("aria-label", "移除图片");
	attach.append(thumb, attachX);
	const actions = document.createElement("div");
	actions.className = "dsh-zdd-pet-chat-actions";
	actions.append(pickBtn, shotBtn, fileInput, attach);
	root.append(input, actions, hint, err);
	(opts.container ?? document.body).appendChild(root);
	const resizeInput = opts.autoWidth === false ? () => {} : enableAutoResize(input, root);
	let attachment;
	let encoding = false;
	let capturing = false;
	const clearAttach = () => {
		attachment = void 0;
		attach.dataset.on = "0";
		thumb.removeAttribute("src");
		fileInput.value = "";
	};
	/** 把编码结果挂上去：上传与截屏两条路共用这一处落点。 */
	const applyEncoded = (encoded) => {
		if (!root.isConnected) return false;
		attachment = {
			mediaType: encoded.mediaType,
			data: encoded.base64
		};
		thumb.src = encoded.previewUrl;
		attach.dataset.on = "1";
		return true;
	};
	const setImageFile = async (file) => {
		if (!isImageFile(file)) {
			flash("只支持 PNG / JPEG / WebP / GIF");
			return false;
		}
		encoding = true;
		pickBtn.disabled = true;
		try {
			return applyEncoded(await encodeImageFile(file));
		} catch (e) {
			flash("读图失败：" + (e instanceof Error ? e.message : String(e)));
			return false;
		} finally {
			encoding = false;
			pickBtn.disabled = false;
		}
	};
	pickBtn.addEventListener("click", () => fileInput.click());
	fileInput.addEventListener("change", () => {
		const file = fileInput.files && fileInput.files[0];
		if (file) setImageFile(file);
	});
	attachX.addEventListener("click", clearAttach);
	root.addEventListener("paste", (e) => {
		const file = firstImageFromClipboard(e.clipboardData);
		if (!file) return;
		e.preventDefault();
		setImageFile(file);
	});
	if (opts.capture) {
		const capture = opts.capture;
		shotBtn.addEventListener("click", () => {
			if (capturing) return;
			capturing = true;
			shotBtn.disabled = true;
			capture().then((encoded) => applyEncoded(encoded)).catch((e) => flash("截屏失败：" + (e instanceof Error ? e.message : String(e)))).finally(() => {
				capturing = false;
				shotBtn.disabled = false;
			});
		});
	} else shotBtn.addEventListener("click", () => flash("当前环境不支持截屏，先用上传试试"));
	resizeInput();
	return {
		root,
		input,
		err,
		shotBtn,
		resizeInput,
		clearAttach,
		setImageFile,
		setEncoded: applyEncoded,
		getAttachment: () => attachment,
		isEncoding: () => encoding || capturing,
		flash,
		dispose: () => window.clearTimeout(hintTimer)
	};
}

//#endregion
//#region src/shared/chat/send.ts
/** 对话要等 LLM 生成回复，比碎碎念（30s）放宽一倍 */
const SEND_TIMEOUT_MS = 6e4;
async function sendChat(baseUrl, text, attachment) {
	const res = await fetch(baseUrl, {
		method: "POST",
		headers: { "content-type": "application/json" },
		body: JSON.stringify(attachment ? {
			text,
			attachment
		} : { text }),
		signal: AbortSignal.timeout(SEND_TIMEOUT_MS)
	});
	const raw = await res.json().catch(() => null);
	if (!raw || typeof raw !== "object") throw new Error("dsh-zdd-pet: 对话响应非法");
	const o = raw;
	if (o.ok !== true) return {
		ok: false,
		reason: o.reason === "provider-missing" || o.reason === "generate-error" || o.reason === "config-error" ? o.reason : "bad-request",
		message: typeof o.message === "string" ? o.message : void 0
	};
	return { ok: true };
}

//#endregion
//#region src/shared/chat/dialog.ts
/** 点弹窗外或按 Esc 关闭；返回解绑函数。 */
function bindDismiss(root, isClosed, onDismiss) {
	const onPointerDown = (e) => {
		if (isClosed() || root.contains(e.target)) return;
		onDismiss();
	};
	const onKeyDown = (e) => {
		if (e.key === "Escape") onDismiss();
	};
	document.addEventListener("mousedown", onPointerDown, true);
	document.addEventListener("keydown", onKeyDown, true);
	return () => {
		document.removeEventListener("mousedown", onPointerDown, true);
		document.removeEventListener("keydown", onKeyDown, true);
	};
}
/** 回车发送：成功后回调、失败把原因写进 err 行，不伪造回复。 */
function bindSend(binding) {
	let sending = false;
	const doSend = () => {
		if (binding.isClosed() || sending) return;
		if (binding.isEncoding()) {
			binding.notify("图片还在处理，稍等一下");
			return;
		}
		const text = binding.input.value.trim();
		if (!text) return;
		sending = true;
		binding.input.disabled = true;
		const request = sendChat(binding.url, text, binding.attachment());
		const closeEarly = binding.closeOnSend === true;
		if (closeEarly) binding.onOk();
		request.then((state) => {
			if (state.ok) {
				if (!closeEarly) binding.onOk();
			} else {
				const message = "对话失败：" + (state.message ?? state.reason);
				if (closeEarly) if (binding.onError) binding.onError(message);
				else console.warn("[dsh-zdd-pet] " + message);
				else {
					binding.err.textContent = message;
					binding.err.style.display = "block";
				}
			}
		}).catch((e) => {
			const message = "对话异常：" + String(e && e.message ? e.message : e);
			if (closeEarly) if (binding.onError) binding.onError(message);
			else console.warn("[dsh-zdd-pet] " + message);
			else {
				binding.err.textContent = message;
				binding.err.style.display = "block";
			}
		}).finally(() => {
			sending = false;
			binding.input.disabled = false;
			if (!binding.isClosed()) binding.input.focus();
		});
	};
	binding.input.addEventListener("keydown", (e) => {
		if (e.key === "Enter") {
			e.preventDefault();
			doSend();
		}
	});
}
function mountChatDialog(opts) {
	injectChatCss();
	const { petId, surface, x, y, onSent, onClose, clamp } = opts;
	const baseUrl = opts.baseUrl ?? ROUTE_PATH + "/chat";
	const withPet = baseUrl + "?pet=" + encodeURIComponent(petId) + "&surface=" + surface;
	const c = clamp && Number.isFinite(clamp.x + clamp.y + clamp.w + clamp.h) ? clamp : {
		x: 0,
		y: 0,
		w: window.innerWidth,
		h: window.innerHeight
	};
	const dom = createChatDom({
		capture: opts.capture,
		container: opts.container,
		autoWidth: opts.autoWidth
	});
	const { root, input, err } = dom;
	/** 以 (x,y) 落点，超出 clamp 矩形夹回。 */
	const place = () => {
		const r = root.getBoundingClientRect();
		root.style.left = Math.max(c.x + 4, Math.min(x, c.x + c.w - r.width - 4)) + "px";
		root.style.top = Math.max(c.y + 4, Math.min(y, c.y + c.h - r.height - 4)) + "px";
	};
	let closed = false;
	let unbindDismiss = () => {};
	const close = () => {
		if (closed) return;
		closed = true;
		unbindDismiss();
		dom.dispose();
		dom.clearAttach();
		root.remove();
		if (onClose) onClose();
	};
	unbindDismiss = bindDismiss(root, () => closed, close);
	bindSend({
		input,
		err,
		url: withPet,
		isClosed: () => closed,
		onOk: () => {
			close();
			if (onSent) onSent();
		},
		attachment: () => dom.getAttachment(),
		isEncoding: () => dom.isEncoding(),
		notify: (text) => dom.flash(text),
		closeOnSend: opts.closeOnSend === true,
		...opts.onError === void 0 ? {} : { onError: opts.onError }
	});
	dom.resizeInput();
	if (!opts.container) place();
	if (opts.initialImage) dom.setImageFile(opts.initialImage);
	input.focus();
	return {
		el: root,
		close
	};
}

//#endregion
//#region src/shared/chat/hotkey.ts
const CHAT_HOTKEY_HINT = "T 键";
function isTypingTarget(target) {
	const el = target;
	if (!el || typeof el.tagName !== "string") return false;
	const tag = el.tagName.toLowerCase();
	if (tag === "input" || tag === "textarea" || tag === "select") return true;
	return el.isContentEditable === true;
}
function isChatHotkey(e) {
	if (e.ctrlKey || e.metaKey || e.altKey) return false;
	if (e.key !== "t" && e.key !== "T") return false;
	return !isTypingTarget(e.target);
}

//#endregion
//#region src/shared/chat/capture.ts
/** 等到视频真正有尺寸。 */
function waitForFrame(video) {
	if (video.videoWidth > 0) return Promise.resolve();
	return new Promise((resolve) => {
		video.onloadeddata = () => resolve();
	});
}
async function captureDisplayFrame() {
	const media = navigator.mediaDevices;
	if (!media || typeof media.getDisplayMedia !== "function") throw new Error("当前环境不支持截屏");
	const stream = await media.getDisplayMedia({
		video: true,
		audio: false
	});
	try {
		const video = document.createElement("video");
		video.srcObject = stream;
		video.muted = true;
		await video.play();
		await waitForFrame(video);
		const canvas = document.createElement("canvas");
		canvas.width = video.videoWidth || 1280;
		canvas.height = video.videoHeight || 720;
		canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height);
		return encodeCanvas(canvas);
	} finally {
		for (const track of stream.getTracks()) track.stop();
	}
}

//#endregion
//#region src/client/pet/card/open-chat.ts
function bindOpenChat(input) {
	const { stage, isHovered, openChat } = input;
	const onKeyDown = (e) => {
		if (!isHovered() || !isChatHotkey(e)) return;
		e.preventDefault();
		openChat();
	};
	const onDragOver = (e) => {
		if (!dragHasFiles(e)) return;
		e.preventDefault();
		if (e.dataTransfer) e.dataTransfer.dropEffect = "copy";
	};
	const onDrop = (e) => {
		const file = firstImageFile(e.dataTransfer);
		if (!file) return;
		e.preventDefault();
		openChat(file);
	};
	document.addEventListener("keydown", onKeyDown, true);
	stage?.addEventListener("dragover", onDragOver);
	stage?.addEventListener("drop", onDrop);
	return () => {
		document.removeEventListener("keydown", onKeyDown, true);
		stage?.removeEventListener("dragover", onDragOver);
		stage?.removeEventListener("drop", onDrop);
	};
}

//#endregion
//#region src/client/pet/card/entry.ts
function createCardEntry(rt) {
	const { useEffect, useRef } = rt;
	return function useCardEntry(input) {
		const { card, cfgRef, drag, live, menuItemsRef, motion, runMenuAction, stage, tipRef } = input;
		const menuRef = useRef(null);
		const chatRef = useRef(null);
		/** 把提示框摆到光标右下，放不下时翻边并夹回视口。
		*  直接写 DOM style：每次鼠标移动都走 React 状态会让整个 PetCard 重渲染。
		*/
		const placeTip = (clientX, clientY) => {
			const tipEl = tipRef.current;
			if (!tipEl) return;
			const viewport = document.documentElement;
			const p = tooltipPlacement({
				x: clientX,
				y: clientY
			}, {
				w: tipEl.offsetWidth,
				h: tipEl.offsetHeight
			}, {
				x: 0,
				y: 0,
				w: viewport.clientWidth,
				h: viewport.clientHeight
			}, motion.metrics().size * TOOLTIP_GAP_RATIO);
			tipEl.style.left = p.x + "px";
			tipEl.style.top = p.y + "px";
		};
		useEffect(() => () => {
			if (menuRef.current) {
				menuRef.current.close();
				menuRef.current = null;
			}
			if (chatRef.current) {
				chatRef.current.close();
				chatRef.current = null;
			}
		}, []);
		/** 打开对话弹窗：弹窗贴在身体命中区右上角，视频框右上角不等于宠物右上角；超出视口夹回。 */
		const openChat = (image) => {
			if (chatRef.current) chatRef.current.close();
			const hitRect = stage()?.querySelector(".dsh-zdd-pet-hit")?.getBoundingClientRect();
			chatRef.current = mountChatDialog({
				petId: cfgRef.current.id,
				baseUrl: ROUTE_PATH + "/chat",
				surface: "web",
				closeOnSend: true,
				x: hitRect ? hitRect.right + 6 : window.innerWidth - 256,
				y: hitRect ? hitRect.top + 6 : 8,
				...image ? { initialImage: image } : {},
				capture: captureDisplayFrame,
				onSent: () => {
					console.info("[dsh-zdd-pet] 对话已发送 pet=" + cfgRef.current.id);
				},
				onClose: () => {
					chatRef.current = null;
				}
			});
		};
		const hoverRef = useRef(false);
		const openChatRef = useRef(openChat);
		openChatRef.current = openChat;
		const stageGetterRef = useRef(stage);
		stageGetterRef.current = stage;
		useEffect(() => bindOpenChat({
			stage: stageGetterRef.current(),
			isHovered: () => hoverRef.current,
			openChat: (image) => openChatRef.current(image)
		}), []);
		live.current.placeTip = placeTip;
		live.current.tipOn = () => card.state.tipOn;
		/** 打开右键菜单。 */
		const handleContextMenu = (e) => {
			const more = buildMoreBranch(menuItemsRef.current);
			const tools = [
				{
					label: "查看余额",
					action: "show-balance"
				},
				{
					label: "碎碎念",
					action: "whisper"
				},
				{
					label: "对话",
					action: "chat",
					hint: CHAT_HOTKEY_HINT
				},
				{
					label: "回到初始位置",
					action: "home"
				},
				pomodoroMenuBranch(),
				displayMenuBranch()
			];
			const tree = [
				...tools,
				...buildMenuTree(cfgRef.current.animations),
				...more ? [more] : []
			];
			if (!tree.length) return;
			e.preventDefault();
			e.stopPropagation();
			if (drag.isActive() || drag.justDragged()) return;
			motion.flight.stop();
			motion.stopMove();
			if (menuRef.current) menuRef.current.close();
			menuRef.current = mountContextMenu({
				tree,
				x: e.clientX,
				y: e.clientY,
				onAction: runMenuAction,
				onClose: () => {
					if (menuRef.current) menuRef.current = null;
				}
			});
		};
		return {
			handleContextMenu,
			onPointerEnter: (e) => {
				hoverRef.current = true;
				placeTip(e.clientX, e.clientY);
				card.actions.setTipOn(true);
			},
			onPointerLeave: () => {
				hoverRef.current = false;
				card.actions.setTipOn(false);
			},
			openChat,
			placeTip
		};
	};
}

//#endregion
//#region src/client/pet/motion/flight.ts
/**
* 一帧的细分积分。
*
* 一帧可能跨过上百 px，不拆会跳过落地与反弹帧，漏掉落地挤压与落定判定。
*
* @param state - 本帧起点的飞行状态。
* @param dt - 本帧时长（秒）。
* @param bounds - 碰撞边界。
* @param physics - 物理参数。
* @returns 本帧终点的状态，附带是否碰边与是否落定。
*/
function integrate(state, dt, bounds, physics) {
	const substeps = throwSubsteps(state.vx, state.vy, dt);
	let res = throwStep(state, dt / substeps, bounds, physics);
	for (let i = 1; i < substeps && !res.atRest; i++) res = throwStep(res, dt / substeps, bounds, physics);
	return res;
}
function createFlight(deps) {
	/** 在跑的 rAF；`null` = 没在飞。 */
	let frame = null;
	/** 世代号：起飞或停飞 +1，迟到的帧据此自弃。 */
	let token = 0;
	/** 最近一帧的飞行状态；`null` = 没在飞。 */
	let state = null;
	const stop = () => {
		token++;
		if (frame !== null) {
			cancelAnimationFrame(frame);
			frame = null;
		}
		state = null;
	};
	/**
	* 宠物互撞：飞行方按动量弹开，被撞方回调以新初速抛出。
	*
	* @param current - 当前飞行状态。
	* @param metrics - 当帧几何。
	* @returns 碰撞后的状态；没撞上时原样返回。
	*/
	const resolveCollisions = (current, metrics) => {
		const slots = deps.arena().slots;
		const myBody = bodyPixelBox({
			x: current.x,
			y: current.y,
			size: metrics.size,
			bottomPad: metrics.bottomPad
		});
		for (const slotId of Object.keys(slots)) {
			if (slotId === deps.petId) continue;
			const slot = slots[slotId];
			const otherBox = slot.getBox();
			if (!otherBox) continue;
			const otherBody = bodyPixelBox({
				x: otherBox.x,
				y: otherBox.y,
				size: slot.size,
				bottomPad: slot.bottomPad
			});
			if (!rectsOverlap(myBody, otherBody)) continue;
			const vel = slot.getVel();
			const hit = collidePet({
				x: current.x,
				y: current.y,
				vx: current.vx,
				vy: current.vy,
				size: metrics.size
			}, {
				x: otherBox.x,
				y: otherBox.y,
				vx: vel.vx,
				vy: vel.vy,
				size: slot.size
			});
			if (!hit) continue;
			slot.onHit(hit.hvx, hit.hvy);
			return {
				x: current.x,
				y: current.y,
				vx: hit.fvx,
				vy: hit.fvy
			};
		}
		return current;
	};
	const start = (px$1, py, vx, vy) => {
		const metrics = deps.metrics();
		const viewport = deps.viewport();
		const physics = deps.physics();
		const bounds = throwBounds({
			W: viewport.width,
			H: viewport.height,
			size: metrics.size,
			sideAllow: metrics.sideAllow
		});
		const own = ++token;
		let current = {
			x: px$1,
			y: py,
			vx,
			vy
		};
		let last = performance.now();
		let prevGrounded = false;
		const rootEl = deps.root();
		/** 写回本帧位置：DOM、包围盒与归一化中心（后者供重渲染时按它重排）。 */
		const commitPose = (res) => {
			if (rootEl) {
				rootEl.style.left = res.x + "px";
				rootEl.style.top = res.y + "px";
				rootEl.style.right = "auto";
				rootEl.style.bottom = "auto";
			}
			deps.setBox({
				x: res.x,
				y: res.y
			});
			const center = {
				rx: (res.x + metrics.halfW) / viewport.width,
				ry: (res.y + metrics.halfH) / viewport.height
			};
			deps.commitLive(center);
			return center;
		};
		const step = () => {
			if (token !== own) return;
			const now = performance.now();
			const dt = (now - last) / 1e3;
			last = now;
			const fallingVy = current.vy;
			const res = integrate(current, dt, bounds, physics);
			current = {
				x: res.x,
				y: res.y,
				vx: res.vx,
				vy: res.vy
			};
			if (physics.petCollision) current = resolveCollisions(current, metrics);
			state = current;
			const center = commitPose(res);
			const grounded = res.y >= bounds.maxY - 1;
			if (res.bounced && grounded && !prevGrounded) deps.onLanding(fallingVy);
			prevGrounded = grounded;
			if (res.atRest) {
				frame = null;
				state = null;
				deps.commitFinal(center);
				return;
			}
			frame = requestAnimationFrame(step);
		};
		frame = requestAnimationFrame(step);
	};
	return {
		isFlying: () => frame !== null,
		start,
		stop,
		velocity: () => frame !== null && state !== null ? {
			vx: state.vx,
			vy: state.vy
		} : {
			vx: 0,
			vy: 0
		}
	};
}

//#endregion
//#region src/client/pet/motion/position-follow.ts
function createPositionFollow(deps) {
	/** 进行中的 rAF；`null` = 没有跟随在跑。 */
	let frame = null;
	/** 世代号：每次开始或停止 +1，迟到的帧据此自弃。 */
	let token = 0;
	const stop = () => {
		token += 1;
		if (frame !== null) {
			cancelAnimationFrame(frame);
			frame = null;
		}
	};
	/** 写包围盒与四个 style，弹簧和直线两条路共用。 */
	const paint = (el, x, y) => {
		deps.setBox({
			x,
			y
		});
		el.style.left = x + "px";
		el.style.top = y + "px";
		el.style.right = "auto";
		el.style.bottom = "auto";
	};
	const apply = (rx, ry, mode, duration) => {
		if (deps.isDragging()) return;
		deps.takeOver();
		const target = centerToBox({
			rx,
			ry
		}, deps.viewport(), deps.half());
		const el = deps.root();
		if (!el || mode === "instant" || mode === "line" && duration <= 0) {
			deps.setBox(target);
			deps.commit({
				rx,
				ry
			});
			return;
		}
		const current = token + 1;
		token = current;
		if (frame !== null) cancelAnimationFrame(frame);
		if (mode === "line") {
			if (duration <= 0) return;
			const from = deps.box() ?? target;
			const t0 = performance.now();
			const step$1 = () => {
				if (token !== current) return;
				const p = Math.min((performance.now() - t0) / duration, 1);
				if (p >= 1) {
					paint(el, target.x, target.y);
					frame = null;
					deps.commit({
						rx,
						ry
					});
					return;
				}
				paint(el, from.x + (target.x - from.x) * p, from.y + (target.y - from.y) * p);
				frame = requestAnimationFrame(step$1);
			};
			frame = requestAnimationFrame(step$1);
			return;
		}
		let last = performance.now();
		const vel = {
			vx: 0,
			vy: 0
		};
		const step = () => {
			if (token !== current) return;
			const now = performance.now();
			const dt = Math.min((now - last) / 1e3, 1 / 30);
			last = now;
			let x = deps.box()?.x ?? target.x;
			let y = deps.box()?.y ?? target.y;
			vel.vx = springStep(vel.vx, x, target.x, dt, deps.spring());
			vel.vy = springStep(vel.vy, y, target.y, dt, deps.spring());
			x += vel.vx * dt;
			y += vel.vy * dt;
			paint(el, x, y);
			if (Math.abs(target.x - x) < .5 && Math.abs(target.y - y) < .5 && Math.abs(vel.vx) < 1 && Math.abs(vel.vy) < 1) {
				paint(el, target.x, target.y);
				frame = null;
				deps.commit({
					rx,
					ry
				});
				return;
			}
			frame = requestAnimationFrame(step);
		};
		frame = requestAnimationFrame(step);
	};
	return {
		apply,
		stop
	};
}

//#endregion
//#region src/client/pet/motion/squash.ts
function createSquashDriver(o) {
	/** 进行中的 rAF；`null` = 没有挤压在跑。 */
	let frame = null;
	/** 世代号：每次开始或停止都 +1，迟到的帧据此自弃。 */
	let token = 0;
	const stop = () => {
		token += 1;
		if (frame !== null) {
			cancelAnimationFrame(frame);
			frame = null;
		}
	};
	const start = (el, depth = SQ_SQUASH) => {
		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
		token += 1;
		const current = token;
		if (frame !== null) cancelAnimationFrame(frame);
		const origin = el.style.transformOrigin;
		el.style.transformOrigin = "bottom";
		const t0 = performance.now();
		const step = () => {
			if (token !== current) return;
			const u = Math.min((performance.now() - t0) / SQ_DURATION_MS, 1);
			const scale = squashScale(u, depth);
			el.style.transform = (o.facing() === "right" ? "scaleX(-1) " : "") + "scaleY(" + scale + ")";
			if (u < 1) {
				frame = requestAnimationFrame(step);
				return;
			}
			frame = null;
			el.style.transformOrigin = origin;
			el.style.transform = o.facing() === "right" ? "scaleX(-1)" : "";
		};
		frame = requestAnimationFrame(step);
	};
	return {
		start,
		stop
	};
}

//#endregion
//#region src/shared/motion.ts
const planMove = (o) => {
	const side = o.sideAllow ?? 0;
	const distance = randomBetween(o.minDist, o.maxDist);
	const target = o.cx + o.dir * distance;
	if (o.areas && o.areas.length > 0) {
		const bodyHalf = o.halfW - side;
		if (!rectAtPoint(o.areas, target - bodyHalf - o.margin, o.cy)) return null;
		if (!rectAtPoint(o.areas, target + bodyHalf + o.margin, o.cy)) return null;
	} else {
		const leftBound = o.margin + o.halfW - side;
		const rightBound = o.W - o.margin - o.halfW + side;
		if (target < leftBound || target > rightBound) return null;
	}
	return {
		startRatio: o.cx / o.W,
		startYRatio: o.cy / o.H,
		targetRatio: target / o.W,
		totalRatio: Math.abs(target - o.cx) / o.W
	};
};

//#endregion
//#region src/client/pet/motion/move-action.ts
function planMoveAction(input) {
	const actions = input.moves.actions;
	if (actions.length === 0) return null;
	const random = input.random ?? Math.random;
	const chosen = input.preferredName ? actions.find((action) => action.name === input.preferredName) ?? null : actions[Math.floor(random() * actions.length)];
	if (!chosen) return null;
	const params = Object.assign({}, input.moves.default, chosen.params ?? {});
	const dir = input.facing === "right" ? 1 : -1;
	const distScale = input.size / PET_REF_WIDTH;
	const plan = planMove({
		cx: input.center.x,
		cy: input.center.y,
		W: input.viewport.width,
		H: input.viewport.height,
		dir,
		minDist: params.minDist * distScale,
		maxDist: params.maxDist * distScale,
		margin: params.margin,
		halfW: input.halfW,
		sideAllow: input.sideAllow
	});
	if (plan === null) return null;
	return {
		anim: chosen.name,
		pending: {
			...plan,
			dir,
			leadSec: params.leadSec,
			tailSec: params.tailSec
		}
	};
}

//#endregion
//#region src/client/pet/motion/walk.ts
/** 元数据未就绪时的兜底时长（秒）：取内置走路素材的常见时长，避免除零。 */
const FALLBACK_DURATION_SEC = 10.09;
function createWalk(deps) {
	/** 在跑的 rAF；`null` = 没在走。 */
	let frame = null;
	/** 世代号：开跑或停走 +1，迟到的帧据此自弃。 */
	let token = 0;
	/** 已规划、等待视频就绪的走位。 */
	let pending = null;
	const hasPending = () => pending !== null;
	const start = (el) => {
		if (pending === null || frame !== null) return;
		const move = pending;
		pending = null;
		const duration = Number.isFinite(el.duration) && el.duration > 0 ? el.duration : FALLBACK_DURATION_SEC;
		const travelWindow = Math.max(.1, duration - move.leadSec - move.tailSec);
		const own = ++token;
		const step = () => {
			if (token !== own) return;
			const t = el.currentTime || 0;
			const { halfW, halfH } = deps.metrics();
			const { width: W, height: H } = deps.viewport();
			let ratioX;
			if (t <= move.leadSec) ratioX = move.startRatio;
			else if (t >= duration - move.tailSec) ratioX = move.targetRatio;
			else ratioX = move.startRatio + (move.targetRatio - move.startRatio) * ((t - move.leadSec) / travelWindow);
			const box = {
				x: ratioX * W - halfW,
				y: move.startYRatio * H - halfH
			};
			const rootEl = deps.root();
			if (rootEl) {
				rootEl.style.left = box.x + "px";
				rootEl.style.top = box.y + "px";
				rootEl.style.right = "auto";
				rootEl.style.bottom = "auto";
			}
			deps.setBox(box);
			if (t < duration - move.tailSec) frame = requestAnimationFrame(step);
			else {
				frame = null;
				deps.commit({
					rx: move.targetRatio,
					ry: move.startYRatio
				});
			}
		};
		frame = requestAnimationFrame(step);
	};
	const tryMove = (preferredName) => {
		if (frame !== null || pending !== null || deps.isFlying()) return true;
		const metrics = deps.metrics();
		const action = planMoveAction({
			moves: deps.moves(),
			preferredName,
			facing: deps.facing(),
			size: metrics.size,
			center: deps.center(),
			viewport: deps.viewport(),
			halfW: metrics.halfW,
			sideAllow: metrics.sideAllow
		});
		if (action === null) return false;
		pending = action.pending;
		deps.play(action.anim);
		return action.anim;
	};
	const stop = () => {
		pending = null;
		token++;
		if (frame !== null) {
			cancelAnimationFrame(frame);
			frame = null;
		}
	};
	return {
		hasPending,
		start,
		stop,
		tryMove
	};
}

//#endregion
//#region src/client/pet/card/motion.ts
function createCardMotion(rt) {
	const { useEffect, useRef } = rt;
	return function useCardMotion(input) {
		const { arena, card, cfgRef, live, metrics, moves, petId, root, setAnim, setOnce, setCustomPos } = input;
		/** 当帧走位参数：走位驱动长期持有，每渲染就地更新，避免把尺寸与动画池闭包进旧实例。 */
		const motionRef = useRef(metrics);
		motionRef.current = metrics;
		const movesRef = useRef(moves);
		movesRef.current = moves;
		/** 包围盒：与拖拽、飞行共享，谁动谁写回。 */
		const boxRef = useRef(null);
		const squashRef = useRef(null);
		squashRef.current ?? (squashRef.current = createSquashDriver({ facing: () => card.facingRef.current }));
		const squash = squashRef.current;
		/** 当前宠物中心的视口 X 坐标。 */
		const currentCenterX = () => {
			const cp = card.customPosRef.current;
			if (cp) return cp.rx * window.innerWidth;
			const rootEl = root();
			if (rootEl) return rootEl.getBoundingClientRect().left + motionRef.current.halfW;
			return window.innerWidth - 24 - motionRef.current.halfW;
		};
		/** 当前宠物中心的视口 Y 坐标。 */
		const currentCenterY = () => {
			const cp = card.customPosRef.current;
			if (cp) return cp.ry * window.innerHeight;
			const rootEl = root();
			if (rootEl) return rootEl.getBoundingClientRect().top + motionRef.current.halfH;
			return window.innerHeight - 20 - motionRef.current.halfH;
		};
		const walkRef = useRef(null);
		walkRef.current ?? (walkRef.current = createWalk({
			root,
			center: () => ({
				x: currentCenterX(),
				y: currentCenterY()
			}),
			metrics: () => motionRef.current,
			moves: () => movesRef.current,
			facing: () => card.facingRef.current,
			viewport: () => ({
				width: window.innerWidth,
				height: window.innerHeight
			}),
			isFlying: () => flightRef.current?.isFlying() ?? false,
			play: (name) => {
				setOnce(true);
				setAnim(name);
			},
			setBox: (box) => {
				boxRef.current = box;
			},
			commit: setCustomPos
		}));
		const walk = walkRef.current;
		/** 停止自主走位与位置跟随。 */
		const stopMove = () => {
			walkRef.current?.stop();
			posFollowRef.current?.stop();
		};
		const flightRef = useRef(null);
		flightRef.current ?? (flightRef.current = createFlight({
			root,
			metrics: () => motionRef.current,
			viewport: () => ({
				width: window.innerWidth,
				height: window.innerHeight
			}),
			physics: () => cfgRef.current.physics,
			arena: () => arena.current,
			petId,
			box: () => boxRef.current,
			setBox: (box) => {
				boxRef.current = box;
			},
			commitLive: (center$1) => {
				card.customPosRef.current = center$1;
			},
			commitFinal: setCustomPos,
			onLanding: (impactVy) => {
				const frontEl = live.current.ownAnim.frontVideo();
				if (frontEl) live.current.squash.start(frontEl, landingSquash(impactVy));
			}
		}));
		const flight = flightRef.current;
		/** 从给定左上角与初速起飞；先停弹簧跟随与走位，免得两套运动同时改位置。 */
		const startThrow = (px$1, py, vx, vy) => {
			live.current.drag.stopFollow();
			stopMove();
			flight.start(px$1, py, vx, vy);
		};
		/** 最新的 startThrow 引用，供碰撞回调转发，避免陈旧闭包。 */
		const startThrowLatestRef = useRef(() => {});
		startThrowLatestRef.current = startThrow;
		const posFollowRef = useRef(null);
		posFollowRef.current ?? (posFollowRef.current = createPositionFollow({
			root,
			box: () => boxRef.current,
			setBox: (box) => {
				boxRef.current = box;
			},
			commit: setCustomPos,
			viewport: () => ({
				width: window.innerWidth,
				height: window.innerHeight
			}),
			half: () => ({
				w: motionRef.current.halfW,
				h: motionRef.current.halfH
			}),
			spring: () => cfgRef.current.physics.throwPower,
			isDragging: () => live.current.drag.isActive(),
			takeOver: () => {
				flightRef.current?.stop();
				walkRef.current?.stop();
				posFollowRef.current?.stop();
			}
		}));
		const posFollow = posFollowRef.current;
		/** 执行抛掷指令：角度（度，0 为正右，逆时针为正）与力度倍率换算成初速度，交给 startThrow。
		*  下游物理全部复用，不设死区。
		*/
		const applyThrow = (angleDeg, power) => {
			if (live.current.drag.isActive()) return;
			const { vx, vy } = throwVelocity(angleDeg, power);
			const box = boxRef.current ?? {
				x: currentCenterX() - motionRef.current.halfW,
				y: currentCenterY() - motionRef.current.halfH
			};
			startThrow(box.x, box.y, vx, vy);
		};
		/** 被撞回调：停当前动作，从落点以新初速抛出去。 */
		const onPetHit = (vx, vy) => {
			stopMove();
			live.current.drag.stopFollow();
			flight.stop();
			const bx = boxRef.current;
			let sx = 0;
			let sy = 0;
			if (bx) {
				sx = bx.x;
				sy = bx.y;
			} else {
				const r = root()?.getBoundingClientRect();
				if (r) {
					sx = r.left;
					sy = r.top;
				}
			}
			startThrowLatestRef.current(sx, sy, vx, vy);
		};
		const { size, bottomPad } = metrics;
		useEffect(() => {
			const arenaSlots = arena.current.slots;
			arenaSlots[petId] = {
				size,
				bottomPad,
				getBox: () => {
					if (boxRef.current) return boxRef.current;
					const r = root()?.getBoundingClientRect();
					return r ? {
						x: r.left,
						y: r.top
					} : null;
				},
				getVel: () => flight.velocity(),
				onHit: onPetHit
			};
			return () => {
				delete arenaSlots[petId];
			};
		}, [
			petId,
			size,
			bottomPad,
			arena
		]);
		const center = () => ({
			x: currentCenterX(),
			y: currentCenterY()
		});
		live.current.walk = walk;
		live.current.flight = flight;
		live.current.posFollow = posFollow;
		live.current.squash = squash;
		live.current.center = center;
		live.current.stopMove = stopMove;
		return {
			applyThrow,
			box: () => boxRef.current,
			center,
			flight,
			metrics: () => motionRef.current,
			onPetHit,
			posFollow,
			setBox: (box) => {
				boxRef.current = box;
			},
			squash,
			startThrow,
			stopMove,
			walk
		};
	};
}

//#endregion
//#region src/client/pet/card/state.ts
function createCardState(rt) {
	const { useState, useRef } = rt;
	return function useCardState(init) {
		const [anim, setAnim] = useState(init.anim);
		const [once, setOnce] = useState(true);
		const [seq, setSeq] = useState(0);
		const [cuePlayback, setCuePlayback] = useState(null);
		const [facing, setFacing] = useState("left");
		const [dragging, setDragging] = useState(false);
		const [tipOn, setTipOn] = useState(false);
		const [customPos, setCustomPos] = useState(null);
		const [size, setSize] = useState(init.size);
		const [corner, setCorner] = useState(init.corner);
		const [margin, setMargin] = useState(init.margin);
		const animRef = useRef(anim);
		animRef.current = anim;
		const facingRef = useRef(facing);
		facingRef.current = facing;
		const customPosRef = useRef(customPos);
		customPosRef.current = customPos;
		const bumpSeq = () => setSeq((s) => s + 1);
		const play = (next, opts) => {
			setAnim(next);
			setOnce(opts?.once ?? true);
			if (opts?.replay) bumpSeq();
			if (opts?.cue !== void 0) setCuePlayback(opts.cue);
		};
		return {
			actions: {
				bumpSeq,
				play,
				setAnim,
				setCorner,
				setCuePlayback,
				setCustomPos,
				setDragging,
				setFacing,
				setMargin,
				setOnce,
				setSize,
				setTipOn
			},
			animRef,
			customPosRef,
			facingRef,
			state: {
				anim,
				corner,
				cuePlayback,
				customPos,
				dragging,
				facing,
				margin,
				once,
				seq,
				size,
				tipOn
			}
		};
	};
}

//#endregion
//#region src/client/pet/card/cue-effects.ts
/** 日志行的时刻前缀。 */
const stamp = () => new Date().toTimeString().slice(0, 8);
/** 一行带时刻的日志：客户端统一前缀，便于 grep。 */
const log = (message) => {
	console.log("[dsh-zdd-pet] " + stamp() + " " + message);
};
/** 动画名是否存在于动画池的任意位置（防播不存在的名字）。 */
const hasAnimIn = (anims, target) => {
	const seen = new Set();
	const stack = [anims];
	while (stack.length) {
		const o = stack.pop();
		if (!o || seen.has(o)) continue;
		if (typeof o === "string") {
			if (o === target) return true;
			continue;
		}
		if (Array.isArray(o)) {
			for (const x of o) stack.push(x);
			continue;
		}
		if (typeof o === "object") {
			seen.add(o);
			for (const v of Object.values(o)) stack.push(v);
		}
	}
	return false;
};
function createCueEffects(rt) {
	const { useEffect, useRef } = rt;
	return function useCueEffects(hub, props) {
		const { balance, balanceManual, balanceNoticeTick, balanceTick } = props;
		const { animCue, animCueTick, posCue, posCueTick, say, sayTick, throwCue, throwCueTick } = props;
		const { workStatus, workStatusTick } = props;
		const prevBalanceRef = useRef(0);
		const prevNoticeRef = useRef(0);
		const prevWorkRef = useRef(0);
		const prevWorkStateRef = useRef(void 0);
		const workBubbleShownRef = useRef(false);
		const prevTaskTextRef = useRef(void 0);
		const prevSayRef = useRef(0);
		const prevAnimRef = useRef(0);
		const prevPosRef = useRef(0);
		const prevThrowRef = useRef(0);
		/** 余额事件：按档位播事件动画并弹气泡。手动请求无条件弹，自动轮询要求开启且有百分比。 */
		const consumeBalance = () => {
			const cfg = hub.cfg();
			const card = hub.card;
			if (balanceTick === 0 || balanceTick === prevBalanceRef.current) return;
			prevBalanceRef.current = balanceTick;
			if (hub.ownAnim.isFrozen() && !balanceManual) return;
			if (!balance || !balance.ok) return;
			if (!cfg.balanceEnabled && !balanceManual) return;
			const percent = balancePercent(balance);
			if (balanceManual || percent !== void 0 || balance.shape === "custom") hub.bubbles.showBalance();
			if (!cfg.balanceEnabled) return;
			if (percent === void 0) return;
			const pool = hub.anims().events?.balance;
			if (!pool || pool.length === 0) {
				console.error("[dsh-zdd-pet] 配置缺少 animations.events.balance，无法播放余额事件动画");
				return;
			}
			const idx = balanceEventIndex(percent);
			const slot = pool[idx];
			if (!slot) {
				console.error("[dsh-zdd-pet] balance 档位索引越界：p=" + percent + " idx=" + idx);
				return;
			}
			const name = pickSlot(slot, card.animRef.current);
			log("balance pet=" + cfg.id + " p=" + percent.toFixed(1) + "% -> [档" + idx + "] " + name);
			hub.stopMotion();
			card.actions.setOnce(true);
			card.actions.setAnim(name);
		};
		/** 余额不可用：容器递增计数，本宠物只弹文字说明，不播档位动画。 */
		const consumeBalanceNotice = () => {
			const cfg = hub.cfg();
			if (!cfg.balanceEnabled && !balanceManual) return;
			if (balanceNoticeTick === 0 || balanceNoticeTick === prevNoticeRef.current) return;
			prevNoticeRef.current = balanceNoticeTick;
			if (hub.ownAnim.isFrozen() && !balanceManual) return;
			if (!balance || balance.ok) return;
			hub.bubbles.showBalance();
		};
		/** 工作状态联动：按档位播动画并弹文本气泡；回空闲时收起气泡并改播完即停。 */
		const consumeWorkStatus = () => {
			const cfg = hub.cfg();
			const card = hub.card;
			if (!cfg.workStatusEnabled) return;
			if (workStatusTick === 0 || workStatusTick === prevWorkRef.current) return;
			prevWorkRef.current = workStatusTick;
			if (hub.ownAnim.isFrozen()) return;
			if (!workStatus || workStatus.state === null) {
				log("pet=" + cfg.id + " " + (prevWorkStateRef.current ?? "null") + "->null    播完即停（回待机，收起气泡）");
				prevWorkStateRef.current = null;
				workBubbleShownRef.current = false;
				prevTaskTextRef.current = null;
				if (poolIncludes(hub.anims().events?.workStatus ?? [], card.animRef.current)) hub.ownAnim.stopLoopingFront();
				hub.bubbles.resetWork();
				return;
			}
			const pool = hub.anims().events?.workStatus;
			if (!pool || pool.length === 0) {
				console.error("[dsh-zdd-pet] 配置缺少 animations.events.workStatus，无法播放工作状态动画");
				return;
			}
			const idx = WORK_STATUS_INDEX[workStatus.state];
			const slot = pool[idx];
			if (slot === void 0) {
				console.error("[dsh-zdd-pet] work-status 档位索引越界：state=" + workStatus.state + " idx=" + idx);
				return;
			}
			let name = pickSlot(slot, card.animRef.current);
			log("pet=" + cfg.id + " " + (prevWorkStateRef.current ?? "null") + "->" + workStatus.state + "    " + name);
			const stateChanged = prevWorkStateRef.current !== workStatus.state;
			prevWorkStateRef.current = workStatus.state;
			if (workStatus.state === "thinking") workBubbleShownRef.current = false;
			if (stateChanged) hub.pokeRest?.();
			hub.stopMotion();
			const textGroup = Array.isArray(cfg.workStatusTexts) ? cfg.workStatusTexts[idx] : void 0;
			const configuredText = Array.isArray(textGroup) && textGroup.length > 0 ? textGroup[Math.floor(Math.random() * textGroup.length)] : void 0;
			hub.bubbles.updateWorkText(workStatus.task ?? configuredText ?? null);
			const terminal = workStatus.state === "success" || workStatus.state === "error";
			const taskText = workStatus.task ?? null;
			const taskChanged = prevTaskTextRef.current !== taskText;
			prevTaskTextRef.current = taskText;
			if (terminal) {
				if (stateChanged) hub.bubbles.lightWork(true);
			} else if (stateChanged && !workBubbleShownRef.current || taskChanged) {
				workBubbleShownRef.current = true;
				hub.bubbles.lightWork(false);
			}
			if (workStatus.state === "success" && stateChanged) {
				const cel = cfg.celebrate;
				if (cel && cel.enabled !== false && typeof cel.anim === "string" && cel.anim && hasAnimIn(hub.anims(), cel.anim)) name = cel.anim;
			}
			const rotating = !terminal && Array.isArray(slot) && slot.length > 1;
			card.actions.setOnce(terminal || rotating);
			card.actions.setAnim(name);
		};
		/** 说话（碎碎念、命令气泡、对话回复、清空）：序号变化即执行清空或弹气泡。 */
		const consumeSay = () => {
			if (!say || say.seq === prevSayRef.current) return;
			prevSayRef.current = say.seq;
			hub.pokeRest?.();
			if (say.kind === "clear") {
				hub.bubbles.clearWhisper();
				return;
			}
			const duration = say.duration === void 0 ? sayBubbleDurationMs(say.text) : say.duration;
			hub.speak(say.text, say.image, say.url, duration, say.anim, say.hold);
		};
		/** 点播动画：url 插播一段，名称走菜单同一套动作。 */
		const consumeAnimCue = () => {
			const card = hub.card;
			if (!animCue || animCue.seq === prevAnimRef.current) return;
			prevAnimRef.current = animCue.seq;
			const explicitFacing = animCue.facing !== void 0;
			if (animCue.facing !== void 0) {
				card.actions.setFacing(animCue.facing);
				card.facingRef.current = animCue.facing;
			}
			if (animCue.url !== void 0) {
				hub.stopMotion();
				hub.ownAnim.setCueUrl(animCue.url);
				card.actions.setOnce(true);
				card.actions.bumpSeq();
				card.actions.setAnim(animCue.url);
				card.actions.setCuePlayback(animCue.playbackId ?? null);
				return;
			}
			if (animCue.name === void 0) return;
			hub.playByName(animCue.name, animCue.playbackId, explicitFacing);
		};
		/** 位置指令：交给位置跟随；用户正按着宠物时由驱动整拍丢弃。 */
		const consumePosCue = () => {
			if (!posCue || posCue.seq === prevPosRef.current) return;
			prevPosRef.current = posCue.seq;
			hub.posFollow.apply(posCue.x, posCue.y, posCue.mode, posCue.duration);
		};
		/** 抛掷指令：交给抛掷驱动。 */
		const consumeThrowCue = () => {
			if (!throwCue || throwCue.seq === prevThrowRef.current) return;
			prevThrowRef.current = throwCue.seq;
			hub.applyThrow(throwCue.angle, throwCue.power);
		};
		useEffect(() => {
			consumeBalance();
			consumeBalanceNotice();
			consumeWorkStatus();
			consumeSay();
			consumeAnimCue();
			consumePosCue();
			consumeThrowCue();
		}, [
			balanceTick,
			balanceNoticeTick,
			workStatusTick,
			sayTick,
			animCueTick,
			posCueTick,
			throwCueTick
		]);
	};
}

//#endregion
//#region src/client/pet/card/lock-freeze.ts
function freezeDeadline(lock, nowMs) {
	const expiresAt = lock?.locked === true ? lock.expiresAt : 0;
	return expiresAt > nowMs ? expiresAt : 0;
}
/** 执行一次翻转；cue 为 null 表示状态本来就是这个值。 */
function dispatchCue(cue, handlers) {
	if (cue === null) return;
	if (cue.kind === "frozen") handlers.onFrozen();
	else handlers.onResumed();
}
function createLockFreeze(rt) {
	const { useEffect, useRef } = rt;
	return function useLockFreeze(input) {
		/** 解冻定时器；重算与本地解冻前都必须清掉，否则旧定时器会提前解冻。 */
		const timerRef = useRef(null);
		/** 清掉解冻定时器；重复调用安全。 */
		const clearTimer = () => {
			if (timerRef.current !== null) {
				window.clearTimeout(timerRef.current);
				timerRef.current = null;
			}
		};
		useEffect(() => {
			clearTimer();
			const now = Date.now();
			const expiresAt = freezeDeadline(input.lock, now);
			dispatchCue(input.setFrozen(expiresAt > now), input);
			if (expiresAt <= now) return clearTimer;
			timerRef.current = window.setTimeout(() => {
				timerRef.current = null;
				dispatchCue(input.setFrozen(false), input);
			}, expiresAt - now);
			return clearTimer;
		}, [input.lockTick, input.lock]);
		return { release: () => {
			clearTimer();
			dispatchCue(input.setFrozen(false), input);
		} };
	};
}

//#endregion
//#region src/client/pet/card/runtime.ts
/** 动画名是否存在于任意动画池（防止播一个不存在的名字导致 404 卡住）。 */
function animExists(anims, target) {
	const seen = new Set();
	const stack = [anims];
	while (stack.length) {
		const o = stack.pop();
		if (!o || seen.has(o)) continue;
		if (typeof o === "string") {
			if (o === target) return true;
			continue;
		}
		if (Array.isArray(o)) {
			for (const x of o) stack.push(x);
			continue;
		}
		if (typeof o === "object") {
			seen.add(o);
			for (const v of Object.values(o)) stack.push(v);
		}
	}
	return false;
}
function createCardRuntime(rt) {
	const { h, useEffect, useRef, useState } = rt;
	/** 余额气泡：数据与显隐由装配根传入。 */
	const BalanceBubble = makeBalanceBubble({
		h,
		useState,
		useEffect
	});
	/** 碎碎念气泡：文本与显隐由装配根传入。 */
	const WhisperBubble = makeWhisperBubble({ h });
	/** 三种气泡的单槽：显隐、停留计时与优先级都在这里。 */
	const useBubbleSlots = createBubbleSlots({
		h,
		useState,
		useEffect,
		useRef
	}, {
		balanceBubble: BalanceBubble,
		whisperBubble: WhisperBubble
	});
	const useCardState = createCardState({
		useState,
		useRef
	});
	const useCardMood = createCardMood({
		useState,
		useEffect,
		useRef
	});
	const useLockFreeze = createLockFreeze({
		useEffect,
		useRef
	});
	const useCueEffects = createCueEffects({
		useEffect,
		useRef
	});
	const useAnimationFlow = createAnimationFlow({ useRef });
	const useCardAnimation = createCardAnimation({
		useEffect,
		useRef
	});
	const useCardMotion = createCardMotion({
		useEffect,
		useRef
	});
	const useCardDrag = createCardDrag({ useRef });
	const useCardRest = createCardRest({
		useEffect,
		useRef
	});
	const useCardEntry = createCardEntry({
		useEffect,
		useRef
	});
	return function useCardRuntime(props) {
		const { arena, balance, balanceManual, cfg, lock, lockTick, menuItemsRef, workStatus } = props;
		const card = useCardState({
			anim: cfg.animations.idle[0] ?? "",
			corner: cfg.position.corner,
			margin: {
				x: cfg.position.marginX,
				y: cfg.position.marginY
			},
			size: cfg.size
		});
		const { actions, state } = card;
		const { corner, customPos, dragging, facing, margin, size, tipOn } = state;
		const liveRef = useRef({});
		const menuActionsRef = useRef(null);
		const entryRef = useRef(null);
		const pendingSquashRef = useRef(false);
		const cfgRef = useRef(cfg);
		cfgRef.current = cfg;
		const workStatusRef = useRef(workStatus);
		workStatusRef.current = workStatus;
		const mood = useCardMood({ cfgRef });
		const exciteTimerRef = useRef(null);
		const rootRef = useRef(null);
		const stageRef = useRef(null);
		const videoARef = useRef(null);
		const videoBRef = useRef(null);
		const tipRef = useRef(null);
		const reportPlayback = makePlaybackReporter({ petId: cfg.id });
		const { halfW, halfH, bottomPad, sideAllow } = derivePetMetrics(size);
		const fontPx = resolveFontPx(cfg.font, size);
		const petAnims = cfg.animations;
		useEffect(() => {
			actions.setSize(cfg.size);
		}, [cfg.size]);
		useEffect(() => {
			actions.setCorner(cfg.position.corner);
			actions.setMargin({
				x: cfg.position.marginX,
				y: cfg.position.marginY
			});
			actions.setCustomPos(null);
		}, [
			cfg.position.corner,
			cfg.position.marginX,
			cfg.position.marginY
		]);
		const bubbles = useBubbleSlots({
			assetRoot: cfg.assetRoot,
			balance,
			balanceEnabled: cfg.balanceEnabled,
			balanceManual,
			workStatusEnabled: cfg.workStatusEnabled,
			workTerminal: workStatus?.state === "success" || workStatus?.state === "error",
			workHasTask: hasTask(workStatus),
			workProgress: progressText(workStatus)
		});
		const ownAnim = useCardAnimation({
			card,
			cfgRef,
			live: liveRef,
			lock,
			pendingSquash: pendingSquashRef,
			petId: cfg.id,
			report: reportPlayback,
			setCuePlayback: actions.setCuePlayback,
			videoA: () => videoARef.current,
			videoB: () => videoBRef.current,
			workStatusRef
		});
		const motion = useCardMotion({
			arena,
			card,
			cfgRef,
			live: liveRef,
			metrics: {
				bottomPad,
				halfH,
				halfW,
				sideAllow,
				size
			},
			moves: petAnims.moves,
			petId: cfg.id,
			root: () => rootRef.current,
			setAnim: actions.setAnim,
			setCustomPos: actions.setCustomPos,
			setOnce: actions.setOnce
		});
		const rest = useCardRest({
			cfgRef,
			actions,
			mood: () => ({
				enabled: mood.enabled(),
				tier: mood.tier(),
				params: mood.params()
			}),
			hasAnim: (name) => animExists(cfgRef.current.animations, name)
		});
		const markActivity = () => rest.poke();
		/** 心情点满时的彩蛋：情绪气泡 + 冲刺跑；到时（或兜底超时）随机掉回 61~99。 */
		const triggerMoodExcite = () => {
			if (animExists(cfgRef.current.animations, MOOD_EXCITE_ANIM)) {
				bubbles.showWhisper("心情满格！原地冲刺跑～", {}, 6e3);
				actions.setOnce(true);
				actions.setAnim(MOOD_EXCITE_ANIM);
				actions.bumpSeq();
			} else bubbles.showWhisper("心情满格啦～", {}, 4e3);
			if (exciteTimerRef.current !== null) window.clearTimeout(exciteTimerRef.current);
			exciteTimerRef.current = window.setTimeout(() => {
				exciteTimerRef.current = null;
				mood.finishExcite();
				bubbles.showWhisper(mood.label(), {}, 4e3);
			}, MOOD_EXCITE_SAFETY_MS);
		};
		useEffect(() => () => {
			if (exciteTimerRef.current !== null) {
				window.clearTimeout(exciteTimerRef.current);
				exciteTimerRef.current = null;
			}
		}, []);
		const drag = useCardDrag({
			bumpSeq: actions.bumpSeq,
			card,
			cfgRef,
			live: liveRef,
			mood,
			motion,
			pendingSquash: pendingSquashRef,
			root: () => rootRef.current,
			setAnim: actions.setAnim,
			setCustomPos: actions.setCustomPos,
			setDragging: actions.setDragging,
			setOnce: actions.setOnce,
			setTipOn: actions.setTipOn,
			stage: () => stageRef.current,
			onSayText: (text) => {
				bubbles.showWhisper(text, {});
				markActivity();
			},
			onActivity: () => {
				markActivity();
				const touched = mood.touch();
				if (touched.hitMax) triggerMoodExcite();
			}
		});
		const entry = useCardEntry({
			card,
			cfgRef,
			drag,
			live: liveRef,
			menuItemsRef,
			motion,
			runMenuAction: (leaf$1, playbackId, keepFacing) => menuActionsRef.current?.run(leaf$1, playbackId, keepFacing),
			stage: () => stageRef.current,
			tipRef
		});
		entryRef.current = entry;
		menuActionsRef.current ?? (menuActionsRef.current = createMenuActions({
			animations: () => cfgRef.current.animations,
			applyMerged: (merged) => petBridge.reload(merged),
			faceLeft: () => actions.setFacing("left"),
			isFacingRight: () => card.facingRef.current === "right",
			openChat: () => entryRef.current?.openChat(),
			petId: cfg.id,
			playOnce: (anim, playbackId) => {
				actions.setOnce(true);
				actions.setAnim(anim);
				actions.setCuePlayback(playbackId);
			},
			report: reportPlayback,
			resetPosition: () => actions.setCustomPos(null),
			stopMove: motion.stopMove,
			stopThrow: () => motion.flight.stop(),
			tryMove: motion.walk.tryMove,
			warn: (message) => console.warn(message)
		}));
		const menuActions = menuActionsRef.current;
		const lockFreeze = useLockFreeze({
			lock,
			lockTick,
			onFrozen: () => {
				motion.stopMove();
				bubbles.hideWork();
			},
			onResumed: () => {
				if (liveRef.current.flow?.resumeWorkStatusAnim() ?? false) return;
				if (petAnims.idle.length) {
					actions.setAnim(pick(petAnims.idle, card.animRef.current));
					actions.setOnce(true);
					actions.bumpSeq();
				}
			},
			setFrozen: ownAnim.setFrozen
		});
		liveRef.current.releaseLock = () => {
			lockFreeze.release();
			postAction(ROUTE_PATH + "/lock/release?pet=" + encodeURIComponent(cfg.id), { force: true });
		};
		const hub = {
			anims: () => cfgRef.current.animations,
			applyThrow: motion.applyThrow,
			bubbles,
			card,
			cfg: () => cfgRef.current,
			isDragging: () => drag.isActive(),
			ownAnim,
			playByName: (anim, playbackId, keepFacing) => menuActions.run({
				anim,
				label: anim
			}, playbackId, keepFacing),
			posFollow: motion.posFollow,
			speak: (text, image, url, duration, anim) => liveRef.current.flow?.speak(text, image, url, duration, anim),
			pokeRest: markActivity,
			stopMotion: motion.stopMove,
			tryWalk: motion.walk.tryMove
		};
		useCueEffects(hub, props);
		const flow = useAnimationFlow(hub, workStatus);
		liveRef.current.flow = flow;
		const stageStyle = petStageStyle(dragging, bottomPad);
		const rootStyle = petRootStyle(customPos, {
			width: window.innerWidth,
			height: window.innerHeight
		}, {
			h: halfH,
			w: halfW
		});
		return {
			bubble: bubbles.node(),
			corner,
			facing,
			fontBubblePx: fontPx.bubble,
			fontTipPx: fontPx.tip,
			marginX: margin.x,
			marginY: margin.y,
			name: cfg.name,
			tipText: mood.enabled() ? cfg.name + " · " + mood.label() : cfg.name,
			onClick: drag.onClick,
			onContextMenu: entry.handleContextMenu,
			onPointerDown: drag.onPointerDown,
			onPointerEnter: entry.onPointerEnter,
			onPointerLeave: entry.onPointerLeave,
			onPointerMove: drag.onPointerMove,
			onPointerUp: drag.onPointerUp,
			rootRef,
			rootStyle,
			size,
			stageRef,
			stageStyle,
			tipOn,
			tipRef,
			videoARef,
			videoBRef
		};
	};
}

//#endregion
//#region src/client/pet/card/pet-card.ts
function createPetCard(rt) {
	const { h } = rt;
	/** 宠物卡的 DOM 结构：只拼装，不持有状态。 */
	const CardView = makeCardView({ h });
	const useCardRuntime = createCardRuntime(rt);
	/** 单个宠物实例，配置由容器传入。 */
	function PetCard(props) {
		return h(CardView, useCardRuntime(props));
	}
	return PetCard;
}

//#endregion
//#region src/client/pet/state-poll.ts
/** 一个不会 resolve 的等待：单纯让出这一拍，用定时器而不是忙等。 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function runStatePoll(deps) {
	/** 宿主是否支持长轮询：首拍带 counter 就是支持。 */
	let longPoll = false;
	/** 上次拿到的 counter，作为长轮询的 since。 */
	let since;
	while (deps.isAlive()) {
		let state = null;
		try {
			state = await deps.fetch(longPoll && since !== void 0 ? {
				since,
				timeoutMs: deps.waitMs
			} : void 0);
		} catch {}
		if (!deps.isAlive()) return;
		if (state !== null) {
			longPoll = typeof state.counter === "number";
			if (longPoll && typeof state.counter === "number") since = state.counter;
			deps.onState(state);
		}
		if (state === null || !longPoll) await sleep(deps.fallbackMs);
	}
}

//#endregion
//#region src/client/state-service.ts
/** 最近一拍的状态；`null` = 本页还没拉到过。 */
let latest = null;
/** 订阅者：每来一拍通知一次。 */
const listeners = new Set();
function setStateSnapshot(state) {
	latest = state;
	for (const listener of listeners) try {
		listener(state);
	} catch (error) {
		console.error("[dsh-zdd-pet] 状态订阅回调出错（已忽略，不影响轮询）：", error);
	}
}
function getStateSnapshot() {
	return latest;
}
function subscribeStateSnapshot(listener) {
	listeners.add(listener);
	return () => {
		listeners.delete(listener);
	};
}

//#endregion
//#region src/client/pet/multi.ts
function createPetMulti(rt, Card) {
	const { h, useState, useEffect, useRef } = rt;
	return function PetMulti() {
		const [pets, setPets] = useState([]);
		const [ready, setReady] = useState(false);
		const arenaRef = useRef({ slots: {} });
		const [balance, setBalance] = useState(null);
		const [balanceTick, setBalanceTick] = useState(0);
		const [balanceNoticeTick, setBalanceNoticeTick] = useState(0);
		const [balanceManual, setBalanceManual] = useState(false);
		const noticeKeyRef = useRef(null);
		const applyBalanceRef = useRef(() => {});
		applyBalanceRef.current = (state, explicit) => {
			setBalance(state);
			setBalanceManual(explicit);
			if (state.ok) {
				setBalanceTick((t) => t + 1);
				return;
			}
			const { show, key } = decideBalanceNotice(state, noticeKeyRef.current, explicit);
			noticeKeyRef.current = key;
			if (show) setBalanceNoticeTick((t) => t + 1);
			if (state.reason !== "unsupported") console.error("[dsh-zdd-pet] 余额查询失败 reason=" + state.reason + (state.message ? " " + state.message : ""));
		};
		const [workStatus, setWorkStatus] = useState(null);
		const [workStatusTick, setWorkStatusTick] = useState(0);
		useEffect(() => {
			const family = pets[0]?.font?.family;
			if (family === void 0) return;
			document.documentElement.style.setProperty("--dsh-zdd-pet-font-family", fontStackOf(family));
		}, [pets]);
		useEffect(() => {
			let alive = true;
			/** 唯一填充点：成品聚合 → 渲染列表；条目级字段只由 flattenConfigPets 吹入。 */
			const applyMerged = (merged) => {
				const main = merged?.main;
				if (typeof main !== "object" || main === null) throw new Error("配置响应不是成品聚合（host 版本不匹配？）");
				setClickSoundEnabled(main.clickSoundEnabled === true);
				const flattened = flattenConfigPets(merged);
				petBridge.current = flattened;
				petBridge.template = Array.isArray(main.pets) ? main.pets[0] ?? void 0 : void 0;
				setPets(flattened);
			};
			/** 拉取成品聚合：host readAllConfig 的输出，客户端零校验零兜底。 */
			const loadMerged = async () => {
				const r = await fetch(ROUTE_PATH + "/config", { cache: "no-store" });
				if (!r.ok) throw new Error("config HTTP " + r.status);
				const body = await r.json();
				if (body.ok === false) throw new Error("config: " + String(body.reason ?? "failed"));
				return body;
			};
			(async () => {
				try {
					const merged = await loadMerged();
					if (!alive) return;
					applyMerged(merged);
					setReady(true);
				} catch (e) {
					console.error("[dsh-zdd-pet] 配置加载失败", e);
				}
			})();
			petBridge.reload = (merged) => {
				(async () => {
					try {
						const next = merged ?? await loadMerged();
						if (!alive) return;
						applyMerged(next);
					} catch (e) {
						console.error("[dsh-zdd-pet] 配置重载失败，保留当前渲染列表", e);
					}
				})();
			};
			return () => {
				alive = false;
				petBridge.reload = () => {};
			};
		}, []);
		const visiblePets = pets.filter((p) => isWebVisible(p.display));
		const [sayTick, setSayTick] = useState(0);
		const sayRef = useRef({});
		const [animCueTick, setAnimCueTick] = useState(0);
		const animCueRef = useRef({});
		const [posCueTick, setPosCueTick] = useState(0);
		const posCueRef = useRef({});
		const [throwCueTick, setThrowCueTick] = useState(0);
		const throwCueRef = useRef({});
		const [lockTick, setLockTick] = useState(0);
		const lockRef = useRef({});
		const menuItemsRef = useRef([]);
		useEffect(() => {
			if (!ready) return;
			let alive = true;
			let baseline = null;
			/** 分段叶子 → 消费端副作用；不认识的名字已被 resolveLeafPath 挡在外面。 */
			const applySection = (name, leaf$1) => {
				switch (name) {
					case "config":
						petBridge.reload();
						return;
					case "balance": {
						const hit = readBalance(leaf$1);
						if (hit) applyBalanceRef.current(hit.state, hit.manual);
						return;
					}
					case "workStatus": {
						const snap = readWorkStatus(leaf$1);
						if (snap) {
							setWorkStatus(snap);
							setWorkStatusTick((t) => t + 1);
						}
						return;
					}
					case "notify":
						notifyFromFrame(leaf$1.data);
						return;
					case "menu":
						menuItemsRef.current = readMenuItems(leaf$1.data, "web");
						setMenuItems(menuItemsRef.current);
						return;
				}
			};
			/** 宠物叶子 → 该宠物的指令槽；序号自增，卡片据此知道「又写了一次」。 */
			const applyPetLeaf = (name, petId, leaf$1) => {
				switch (name) {
					case "say": {
						const said = readSay(leaf$1);
						if (!said) return;
						sayRef.current[petId] = {
							...said,
							seq: (sayRef.current[petId]?.seq ?? 0) + 1
						};
						setSayTick((t) => t + 1);
						return;
					}
					case "anim": {
						const hit = readAnim(leaf$1);
						if (!hit) return;
						animCueRef.current[petId] = {
							name: hit.name,
							url: hit.url,
							playbackId: hit.playbackId,
							facing: hit.facing,
							seq: (animCueRef.current[petId]?.seq ?? 0) + 1
						};
						setAnimCueTick((t) => t + 1);
						return;
					}
					case "position": {
						const hit = readPosition(leaf$1);
						if (!hit) return;
						posCueRef.current[petId] = {
							...hit,
							seq: (posCueRef.current[petId]?.seq ?? 0) + 1
						};
						setPosCueTick((t) => t + 1);
						return;
					}
					case "throw": {
						const hit = readThrow(leaf$1);
						if (!hit) return;
						throwCueRef.current[petId] = {
							...hit,
							seq: (throwCueRef.current[petId]?.seq ?? 0) + 1
						};
						setThrowCueTick((t) => t + 1);
						return;
					}
					case "lock": {
						const hit = readLock(leaf$1);
						if (!hit) return;
						lockRef.current[petId] = hit;
						setLockTick((t) => t + 1);
						return;
					}
				}
			};
			/** 应用一份轮询状态：首拉只记基线，之后按 counter 变化逐个分发。 */
			const applyState = (s) => {
				setStateSnapshot(s);
				if (baseline === null) {
					baseline = flattenCounters(s);
					menuItemsRef.current = readMenuItems(s.sections.menu?.data, "web");
					setMenuItems(menuItemsRef.current);
					return;
				}
				for (const { path, leaf: leaf$1 } of takeChanged(s, baseline)) {
					if (leaf$1.data === null) continue;
					const target = resolveLeafPath(path);
					if (target === null) continue;
					if (target.where === "section") applySection(target.name, leaf$1);
					else applyPetLeaf(target.name, target.petId, leaf$1);
				}
			};
			runStatePoll({
				fetch: (options) => fetchState(void 0, options === void 0 ? void 0 : {
					since: options.since,
					timeoutMs: options.timeoutMs
				}),
				onState: applyState,
				waitMs: STATE_WAIT_MS,
				fallbackMs: STATE_FALLBACK_MS,
				isAlive: () => alive
			});
			return () => {
				alive = false;
			};
		}, [ready]);
		return ready ? visiblePets.map((p) => h(Card, {
			key: p.id,
			cfg: p,
			balance,
			balanceTick,
			balanceNoticeTick,
			balanceManual,
			workStatus,
			workStatusTick,
			say: sayRef.current[p.id],
			sayTick,
			animCue: animCueRef.current[p.id],
			animCueTick,
			posCue: posCueRef.current[p.id],
			posCueTick,
			throwCue: throwCueRef.current[p.id],
			throwCueTick,
			lock: lockRef.current[p.id],
			lockTick,
			menuItemsRef,
			arena: arenaRef
		})) : null;
	};
}

//#endregion
//#region src/client/pet.ts
function makePetUI(rt) {
	injectPetCss();
	const PetCard = createPetCard(rt);
	const PetMulti = createPetMulti(rt, PetCard);
	return PetMulti;
}

//#endregion
//#region src/client/command-faces.ts
function installCommandFaces(commandUi, faces) {
	const original = commandUi.candidates;
	if (typeof original !== "function") {
		console.warn("[dsh-zdd-pet] 命令图标不可用：commandUi.candidates 缺失（命令本身仍可用，只是没有图标）");
		return () => {};
	}
	const patched = async (session, req) => {
		const rows = await original.call(commandUi, session, req);
		try {
			if (!Array.isArray(rows)) return rows;
			return rows.map((raw) => {
				if (raw === null || typeof raw !== "object") return raw;
				const row = raw;
				const face = faces.get(typeof row.name === "string" ? row.name : "");
				if (face === void 0 || row.icon !== void 0) return row;
				return {
					...row,
					label: face.label(),
					icon: face.icon
				};
			});
		} catch (error) {
			console.warn("[dsh-zdd-pet] 命令图标补丁异常，本次退回原始菜单行：" + (error instanceof Error ? error.message : String(error)));
			return rows;
		}
	};
	commandUi.candidates = patched;
	return () => {
		if (commandUi.candidates === patched) commandUi.candidates = original;
	};
}

//#endregion
//#region src/client/nav-icon.ts
/**
* 设置面板导航图标补丁：把「桌宠配置」那一行的兜底齿轮换成指定图标。
* DSH 的导航图标按分区 id 硬编码白名单，且私有、外部拿不到引用，只能在 DOM 层做。
* 只打 `data-*` 标记并用 `::before` + mask 画字形，不动 DOM 结构，否则 React 会对被替换的节点 removeChild 崩。
* 认行只能靠标题文本：投影到 DOM 的只有 label，而 account 行条件出现、位置会漂，不能用 `:nth-child`。
* 降级：缺 document / MutationObserver、渲不出 SVG 时不装，认不出那一行时什么都不做，只告警。
* @module dsh-zdd-pet/src/client/nav-icon
*/
/** 注入的样式表去重标记（与宠物页面 / 设置页同一套 `data-plugin-css` 约定）。 */
const STYLE_TAG = "dsh-zdd-pet/nav-icon.css";
/** 打在目标行 `<button>` 上的标记属性：React 从不 diff 它，重渲染 / 切语言都不会掉。 */
const MARK = "data-dsh-zdd-pet-nav";
/** 设置面板根节点：shell 用 `createPortal` 挂到 body 上。 */
const PANEL_SELECTOR = "[data-shortcut-modal=\"settings\"]";
/**
* 类名来自 CSS Modules，哈希前缀会随 DSH 构建变，只匹配 `navList` / `navCell` / `navLabel` 这些名字部分。
*/
const LIST_SELECTOR = "[class*=\"navList\"]";
const CELL_SELECTOR = "[class*=\"navCell\"]";
const LABEL_SELECTOR = "[class*=\"navLabel\"]";
function svgMaskUri(svg) {
	const source = svg.trim();
	if (source === "") return "";
	const namespaced = /<svg[^>]*\sxmlns=/i.test(source) ? source : source.replace(/<svg\b/i, "<svg xmlns=\"http://www.w3.org/2000/svg\"");
	return "url(\"data:image/svg+xml," + encodeURIComponent(namespaced.split("currentColor").join("#000")) + "\")";
}
/** 换字形用的 CSS：盖住齿轮，用 `::before` + mask 画上我们的图标。 */
function cssFor(glyph) {
	return [
		"/* 「桌宠配置」行的导航图标：盖住齿轮，换成本模块的图形 */",
		"[" + MARK + "] [class*=\"navIcon\"]{display:none}",
		"[" + MARK + "]::before{content:\"\";flex:none;width:16px;height:16px;background-color:currentColor;-webkit-mask:" + glyph + " center/16px 16px no-repeat;mask:" + glyph + " center/16px 16px no-repeat}"
	].join("\n");
}
/** 注入样式表（只注入一次）。 */
function injectCss(doc, glyph) {
	if (doc.querySelector("style[data-plugin-css=\"" + STYLE_TAG + "\"]") !== null) return;
	const tag = doc.createElement("style");
	tag.dataset.plugin = "dsh-zdd-pet";
	tag.dataset.pluginCss = STYLE_TAG;
	tag.textContent = cssFor(glyph);
	doc.head.appendChild(tag);
}
/** 异常 → 单行文案（告警用）。 */
function describe(error) {
	return error instanceof Error ? error.message : String(error);
}
function installSectionNavIcon(target) {
	const doc = typeof document === "undefined" ? void 0 : document;
	const Observer = typeof MutationObserver === "undefined" ? void 0 : MutationObserver;
	if (doc === void 0 || Observer === void 0 || doc.body === null) {
		console.warn("[dsh-zdd-pet] 设置页导航图标不可用：缺少 document / body / MutationObserver（齿轮照旧）");
		return () => {};
	}
	let glyph;
	try {
		glyph = svgMaskUri(target.renderSvg());
	} catch (error) {
		console.warn("[dsh-zdd-pet] 设置页导航图标不可用：图标渲染失败（齿轮照旧）：" + describe(error));
		return () => {};
	}
	if (glyph === "") {
		console.warn("[dsh-zdd-pet] 设置页导航图标不可用：图标渲成了空 SVG（齿轮照旧）");
		return () => {};
	}
	injectCss(doc, glyph);
	let warned = false;
	/** 给面板里标题匹配的那一行打标记（幂等；已打过的不再读标题）。 */
	const markPanel = (panel) => {
		try {
			const wanted = target.label();
			if (wanted === "") return;
			const list = panel.querySelector(LIST_SELECTOR);
			if (list === null) return;
			for (const cell of list.querySelectorAll(CELL_SELECTOR)) {
				if (cell.getAttribute(MARK) !== null) continue;
				if (cell.querySelector(LABEL_SELECTOR)?.textContent === wanted) cell.setAttribute(MARK, "");
			}
		} catch (error) {
			if (!warned) {
				warned = true;
				console.warn("[dsh-zdd-pet] 设置页导航图标补丁异常，本次跳过（齿轮照旧）：" + describe(error));
			}
		}
	};
	let watched;
	let panelObserver;
	const sync = () => {
		const panel = doc.querySelector(PANEL_SELECTOR);
		if (panel === null) {
			panelObserver?.disconnect();
			panelObserver = void 0;
			watched = void 0;
			return;
		}
		markPanel(panel);
		if (panel === watched) return;
		panelObserver?.disconnect();
		watched = panel;
		panelObserver = new Observer(() => {
			markPanel(panel);
		});
		panelObserver.observe(panel, {
			childList: true,
			subtree: true
		});
	};
	sync();
	const bodyObserver = new Observer(sync);
	bodyObserver.observe(doc.body, { childList: true });
	return () => {
		bodyObserver.disconnect();
		panelObserver?.disconnect();
	};
}

//#endregion
//#region src/client/chat/api.ts
/** 校验并收窄一条图片引用；形状不对返回 undefined（旧记录没有这个字段）。 */
function imageRefOf(raw) {
	if (!raw || typeof raw !== "object") return void 0;
	const ref = raw;
	if (typeof ref.attachmentId !== "string" || ref.attachmentId === "") return void 0;
	const num = (value) => typeof value === "number" && Number.isFinite(value) ? value : 0;
	return {
		attachmentId: ref.attachmentId,
		mediaType: typeof ref.mediaType === "string" ? ref.mediaType : "image/png",
		bytes: num(ref.bytes),
		width: num(ref.width),
		height: num(ref.height)
	};
}
function toChatMessages(body) {
	const raw = body?.messages;
	if (!Array.isArray(raw)) return [];
	const out = [];
	for (const item of raw) {
		if (!item || typeof item !== "object") continue;
		const m = item;
		const role = m.role === "assistant" ? "assistant" : m.role === "user" ? "user" : void 0;
		if (role === void 0 || typeof m.content !== "string") continue;
		const image = imageRefOf(m.image);
		const meme = typeof m.meme === "string" && m.meme !== "" ? m.meme : void 0;
		out.push({
			role,
			text: m.content,
			ts: typeof m.ts === "number" ? m.ts : 0,
			...image === void 0 ? {} : { image },
			...meme === void 0 ? {} : { meme }
		});
	}
	return out;
}
function groupRounds(messages) {
	const rounds = [];
	for (const message of messages) {
		const last = rounds[rounds.length - 1];
		if (last !== void 0 && last.ts === message.ts && message.ts !== 0) {
			rounds[rounds.length - 1] = message.role === "user" ? {
				...last,
				user: message
			} : {
				...last,
				assistant: message
			};
			continue;
		}
		rounds.push(message.role === "user" ? {
			ts: message.ts,
			user: message
		} : {
			ts: message.ts,
			assistant: message
		});
	}
	return rounds;
}
const LOGO_URL = ROUTE_PATH + "/logo";
function attachmentUrl(ref) {
	return ROUTE_PATH + "/attachment?id=" + encodeURIComponent(ref.attachmentId);
}
function memeUrl(name, assetRoot) {
	const root = assetRoot.trim();
	const prefix = root === "" ? "" : encodeURIComponent(root) + "/";
	return ROUTE_PATH + "/pic/memes/" + prefix + encodeURIComponent(name) + ".png";
}
async function fetchChatConfig() {
	const res = await fetch(ROUTE_PATH + "/config", { cache: "no-store" });
	if (!res.ok) throw new Error("config HTTP " + res.status);
	const body = await res.json();
	if (body.ok === false) throw new Error("config: " + String(body.reason ?? "failed"));
	const merged = body;
	const roundsByEntry = {};
	for (const [entry, conf] of Object.entries(merged)) {
		const rounds = Number(conf?.chatMemoryRounds);
		if (Number.isFinite(rounds) && rounds >= 0) roundsByEntry[entry] = Math.floor(rounds);
	}
	return {
		pets: flattenConfigPets(merged),
		roundsByEntry
	};
}
function memoryBoundaryIndex(totalRounds, memoryRounds) {
	if (memoryRounds === void 0 || memoryRounds <= 0) return null;
	const cut = totalRounds - memoryRounds;
	return cut > 0 ? cut : null;
}
const HISTORY_ROUNDS = 200;
async function fetchHistory(petId) {
	const url = ROUTE_PATH + "/chat?pet=" + encodeURIComponent(petId) + "&rounds=" + HISTORY_ROUNDS;
	const res = await fetch(url, { cache: "no-store" });
	if (!res.ok) throw new Error("chat HTTP " + res.status);
	return toChatMessages(await res.json());
}
async function sendMessage(petId, text, attachment) {
	const url = ROUTE_PATH + "/chat?pet=" + encodeURIComponent(petId) + "&surface=any";
	const result = await sendChat(url, text, attachment);
	return result.ok ? { ok: true } : {
		ok: false,
		message: result.message ?? result.reason
	};
}
/** 把删除响应收窄成回执；`ts` 为空 = 清空整只。 */
async function deleteChat(petId, ts) {
	const query = ts.map((value) => "&ts=" + encodeURIComponent(String(value))).join("");
	const res = await fetch(ROUTE_PATH + "/chat?pet=" + encodeURIComponent(petId) + query, { method: "DELETE" });
	const body = await res.json().catch(() => null);
	if (body?.ok === true) return {
		ok: true,
		removed: Number(body.removed ?? 0)
	};
	const reason = typeof body?.message === "string" ? body.message : "HTTP " + res.status;
	return {
		ok: false,
		message: reason
	};
}
async function deleteRounds(petId, ts) {
	if (ts.length === 0) return {
		ok: true,
		removed: 0
	};
	return deleteChat(petId, ts);
}
async function clearHistory(petId) {
	return deleteChat(petId, []);
}
async function fetchOrphans() {
	const res = await fetch(ROUTE_PATH + "/chat/memory", { cache: "no-store" });
	if (!res.ok) throw new Error("chat/memory HTTP " + res.status);
	const body = await res.json();
	const raw = Array.isArray(body.orphans) ? body.orphans : [];
	const out = [];
	for (const item of raw) {
		if (!item || typeof item !== "object") continue;
		const one = item;
		if (typeof one.petId !== "string") continue;
		out.push({
			entry: typeof one.entry === "string" ? one.entry : "",
			petId: one.petId,
			messages: typeof one.messages === "number" ? one.messages : 0,
			lastTs: typeof one.lastTs === "number" ? one.lastTs : 0
		});
	}
	return out;
}
async function clearOrphans() {
	const res = await fetch(ROUTE_PATH + "/chat/memory", { method: "DELETE" });
	const body = await res.json().catch(() => null);
	if (body?.ok === true) return {
		ok: true,
		pets: Number(body.pets ?? 0),
		messages: Number(body.messages ?? 0)
	};
	return {
		ok: false,
		message: typeof body?.message === "string" ? body.message : "HTTP " + res.status
	};
}

//#endregion
//#region src/client/chat/actions.ts
function createHistoryActions(ports) {
	/** 跑一次删除：失败只报错；成功后清勾选并以服务端为准重读。 */
	const apply = async (run) => {
		try {
			const result = await run();
			if (!result.ok) {
				ports.fail(result.message);
				return;
			}
			ports.patch({
				selected: [],
				error: ""
			});
			await ports.reload(ports.read().petId);
		} catch (error) {
			ports.fail(error);
		}
	};
	return {
		deleteSelected: () => {
			const { petId, selected } = ports.read();
			if (petId === "" || selected.length === 0) return;
			apply(() => deleteRounds(petId, selected));
		},
		clearAll: () => {
			const { petId } = ports.read();
			if (petId === "") return;
			apply(() => clearHistory(petId));
		}
	};
}
function createSendActions(ports) {
	return {
		send: () => {
			const data = ports.read();
			const text = data.draft.trim();
			if (text === "" || data.busy || data.petId === "") return;
			ports.patch({
				busy: true,
				error: ""
			});
			(async () => {
				try {
					const attachment = data.attachment === void 0 ? void 0 : {
						mediaType: data.attachment.mediaType,
						data: data.attachment.base64
					};
					const result = await sendMessage(data.petId, text, attachment);
					if (!result.ok) {
						ports.fail(result.message);
						return;
					}
					ports.patch({
						draft: "",
						attachment: void 0
					});
					await ports.reload(data.petId);
				} catch (error) {
					ports.fail(error);
				} finally {
					ports.patch({ busy: false });
				}
			})();
		},
		pickFile: (file) => {
			(async () => {
				try {
					ports.patch({
						attachment: await encodeImageFile(file),
						error: ""
					});
				} catch (error) {
					ports.fail(error);
				}
			})();
		}
	};
}
function createShellActions(deps) {
	const { ports, history, listRef, pageRounds } = deps;
	/** 清掉已删宠物残留的历史。 */
	const clearOrphans$1 = () => {
		(async () => {
			try {
				const result = await clearOrphans();
				if (!result.ok) {
					ports.fail(result.message);
					return;
				}
				ports.patch({
					orphans: [],
					error: ""
				});
			} catch (error) {
				ports.fail(error);
			}
		})();
	};
	/** 确认条点「确定」后按待办类型分发；先清 pending，避免重复触发。 */
	const confirmAsk = () => {
		const kind = ports.read().pending;
		ports.patch({ pending: null });
		if (kind === "delete-selected") history.deleteSelected();
		else if (kind === "clear-all") history.clearAll();
		else if (kind === "clear-orphans") clearOrphans$1();
	};
	/** 多放一批更早的轮；按高度差补偿滚动位置，视线不跳。 */
	const showOlder = () => {
		const el = listRef.current;
		const before = el?.scrollHeight ?? 0;
		ports.patch({ visibleRounds: ports.read().visibleRounds + pageRounds });
		if (el === null) return;
		requestAnimationFrame(() => {
			el.scrollTop = el.scrollHeight - before;
		});
	};
	return {
		clearOrphans: clearOrphans$1,
		ask: (kind) => ports.patch({ pending: kind }),
		cancelAsk: () => ports.patch({ pending: null }),
		confirmAsk,
		showOlder
	};
}

//#endregion
//#region src/client/chat/metrics.ts
const SIZE = {
	pad: 12,
	padBottom: 10,
	gap: 8,
	gapTight: 6,
	gapWide: 10,
	listGap: 20,
	avatar: 28,
	imgMaxW: 220,
	imgMaxH: 180,
	preview: 48,
	hairline: 2,
	tabPadY: 3,
	tabPadX: 12,
	toolPadY: 2,
	toolPadX: 10,
	bubblePadY: 8,
	bubblePadX: 12,
	composerPad: 10,
	composerPadBottom: 6,
	inputMinH: 44,
	inputMaxH: 140,
	send: 34,
	pillPadY: 4,
	pill: 999
};
const INPUT_MAX_HEIGHT = SIZE.inputMaxH;
const px = (value) => value + "px";

//#endregion
//#region src/client/chat/effects.ts
function createChatEffects(rt) {
	const { useEffect } = rt;
	return function useChatEffects(input) {
		const { data, fail, listRef, draftRef, newestTs, patch, reload } = input;
		useEffect(() => {
			(async () => {
				try {
					const [config, orphans] = await Promise.all([fetchChatConfig(), fetchOrphans().catch(() => [])]);
					const first = config.pets[0]?.id ?? "";
					patch({
						pets: config.pets,
						roundsByEntry: config.roundsByEntry,
						petId: first,
						orphans
					});
					await reload(first);
				} catch (error) {
					fail(error);
				} finally {
					patch({ loading: false });
				}
			})();
		}, []);
		useEffect(() => {
			const el = listRef.current;
			if (el === null) return;
			const newest = data.messages[data.messages.length - 1]?.ts ?? 0;
			if (newest === newestTs.current) return;
			newestTs.current = newest;
			el.scrollTop = el.scrollHeight;
		}, [data.messages]);
		useEffect(() => {
			const el = draftRef.current;
			if (el === null) return;
			el.style.height = "auto";
			el.style.height = Math.min(el.scrollHeight, INPUT_MAX_HEIGHT) + "px";
		}, [data.draft]);
		useEffect(() => {
			const petId = data.petId;
			if (petId === "") return;
			let last = getStateSnapshot()?.pets[petId]?.say?.counter ?? 0;
			return subscribeStateSnapshot((snapshot) => {
				const counter = snapshot.pets[petId]?.say?.counter ?? 0;
				if (counter === last) return;
				last = counter;
				reload(petId);
			});
		}, [data.petId]);
	};
}

//#endregion
//#region src/client/chat/state.ts
/** 首屏与每次「加载更早」放出的轮数。 */
const PAGE_ROUNDS = 10;
/** 初始状态：空列表 + 加载中。 */
const INITIAL = {
	pets: [],
	petId: "",
	messages: [],
	draft: "",
	attachment: void 0,
	busy: false,
	loading: true,
	error: "",
	selected: [],
	selecting: false,
	orphans: [],
	pending: null,
	visibleRounds: PAGE_ROUNDS,
	previewUrl: void 0,
	roundsByEntry: {}
};
function createPetChatState(rt) {
	const { useRef, useState } = rt;
	const useChatEffects = createChatEffects(rt);
	return function usePetChatState() {
		const [data, setData] = useState(INITIAL);
		const listRef = useRef(null);
		const draftRef = useRef(null);
		/** 已贴到底的那条消息（`ts`）：只有它变化时才自动滚到底。 */
		const newestTs = useRef(0);
		const patch = (next) => setData((prev) => ({
			...prev,
			...next
		}));
		const fail = (error) => patch({ error: error instanceof Error ? error.message : String(error) });
		/** 重读某只宠物的历史；失败只落在 error 上，不静默清空已有消息。 */
		const reload = async (petId) => {
			if (petId === "") return;
			try {
				patch({ messages: await fetchHistory(petId) });
			} catch (error) {
				fail(error);
			}
		};
		useChatEffects({
			data,
			patch,
			fail,
			reload,
			listRef,
			draftRef,
			newestTs
		});
		const ports = {
			read: () => data,
			patch,
			fail,
			reload
		};
		const history = createHistoryActions(ports);
		const shell = createShellActions({
			ports,
			history,
			listRef,
			pageRounds: PAGE_ROUNDS
		});
		const pet = data.pets.find((one) => one.id === data.petId);
		const allRounds = groupRounds(data.messages);
		const rounds = allRounds.slice(-data.visibleRounds);
		return {
			...data,
			...createSendActions(ports),
			...history,
			...shell,
			rounds,
			hasOlder: allRounds.length > rounds.length,
			petName: pet?.name || "宠",
			assetRoot: pet?.assetRoot ?? "",
			memoryRounds: data.roundsByEntry[pet?.assetRoot ?? ""],
			listRef,
			draftRef,
			pickPet: (petId) => {
				patch({
					petId,
					messages: [],
					selected: [],
					selecting: false,
					pending: null,
					visibleRounds: PAGE_ROUNDS,
					error: ""
				});
				reload(petId);
			},
			toggleSelecting: () => patch({
				selecting: !data.selecting,
				selected: []
			}),
			toggleRound: (ts) => patch({ selected: data.selected.includes(ts) ? data.selected.filter((one) => one !== ts) : [...data.selected, ts] }),
			setDraft: (draft) => patch({ draft }),
			clearAttachment: () => patch({ attachment: void 0 }),
			showImage: (previewUrl) => patch({ previewUrl }),
			closeImage: () => patch({ previewUrl: void 0 })
		};
	};
}

//#endregion
//#region src/client/chat/view-node.ts
function orphansNode(h, state) {
	if (state.orphans.length === 0) return null;
	const messages = state.orphans.reduce((sum, one) => sum + one.messages, 0);
	return h("div", {
		className: "pet-chat-orphans",
		children: [
			h("span", { children: `有 ${state.orphans.length} 只已删除宠物的历史（${messages} 条）` }),
			h("span", { className: "pet-chat-composer-spacer" }),
			h("button", {
				type: "button",
				className: "pet-chat-tool",
				onClick: () => state.ask("clear-orphans"),
				children: "清理"
			})
		]
	});
}
function toolsNode(h, state) {
	return h("div", {
		className: "pet-chat-tools",
		children: [
			h("button", {
				type: "button",
				className: "pet-chat-tool",
				"aria-pressed": String(state.selecting),
				onClick: () => state.toggleSelecting(),
				children: state.selecting ? "取消选择" : "选择"
			}),
			state.selecting ? h("button", {
				type: "button",
				className: "pet-chat-tool",
				disabled: state.selected.length === 0,
				onClick: () => state.ask("delete-selected"),
				children: state.selected.length === 0 ? "删除选中" : "删除选中 " + state.selected.length
			}) : null,
			h("button", {
				type: "button",
				className: "pet-chat-tool",
				onClick: () => state.ask("clear-all"),
				children: "清空历史"
			})
		]
	});
}
/** 待确认操作的文案：每条都说清「删什么、不可恢复」。 */
const CONFIRM_TEXT = {
	"delete-selected": "删除选中的这几轮对话？",
	"clear-all": "清空这只宠物的全部对话历史？",
	"clear-orphans": "清理已删除宠物的残留历史？"
};
function confirmNode(rt, state) {
	if (state.pending === null) return null;
	const { h, ui } = rt;
	const count = state.pending === "delete-selected" ? `（${state.selected.length} 轮）` : state.pending === "clear-orphans" ? `（${state.orphans.length} 只）` : "";
	const description = CONFIRM_TEXT[state.pending] + count + "删了找不回来。";
	if (ui === void 0) return h("div", {
		className: "pet-chat-confirm",
		role: "alertdialog",
		children: [
			h("span", { children: description }),
			h("span", { className: "pet-chat-composer-spacer" }),
			h("button", {
				type: "button",
				className: "pet-chat-danger",
				onClick: () => state.confirmAsk(),
				children: "删除"
			}),
			h("button", {
				type: "button",
				className: "pet-chat-tool",
				onClick: () => state.cancelAsk(),
				children: "取消"
			})
		]
	});
	const { Button, Modal } = ui;
	return h(Modal, {
		open: true,
		title: "删除对话历史",
		closeLabel: "关闭",
		description,
		onClose: () => state.cancelAsk(),
		footer: h("div", {
			className: "pet-chat-confirm-actions",
			children: [h(Button, {
				variant: "ghost",
				type: "button",
				onClick: () => state.cancelAsk(),
				children: "取消"
			}), h(Button, {
				variant: "primary",
				type: "button",
				onClick: () => state.confirmAsk(),
				children: "删除"
			})]
		})
	});
}
/** 待发送图片的预览条。 */
function previewNode$1(h, state) {
	if (state.attachment === void 0) return null;
	return h("div", {
		className: "pet-chat-preview",
		children: [
			h("img", {
				className: "pet-chat-preview-img",
				src: state.attachment.previewUrl,
				alt: "待发送的图片"
			}),
			h("span", {
				className: "pet-chat-preview-meta",
				children: state.attachment.width + "×" + state.attachment.height
			}),
			h("button", {
				type: "button",
				className: "pet-chat-tool",
				onClick: () => state.clearAttachment(),
				children: "移除"
			})
		]
	});
}
/** 发送键里的箭头：与 DSH 输入框一致的圆形按钮造型。 */
function sendIcon(h) {
	return h("svg", {
		viewBox: "0 0 24 24",
		width: 16,
		height: 16,
		"aria-hidden": "true",
		children: [h("path", {
			d: "M12 19V6M6 12l6-6 6 6",
			fill: "none",
			stroke: "currentColor",
			strokeWidth: 2,
			strokeLinecap: "round",
			strokeLinejoin: "round"
		})]
	});
}
function composerNode(h, state) {
	return h("div", {
		className: "pet-chat-composer",
		children: [
			previewNode$1(h, state),
			h("textarea", {
				className: "pet-chat-input",
				ref: state.draftRef,
				value: state.draft,
				rows: 2,
				placeholder: "说点什么…（Enter 发送，Shift+Enter 换行）",
				onChange: (event) => state.setDraft(event.target.value),
				onPaste: (event) => {
					const file = event.clipboardData?.files?.[0];
					if (file === void 0) return;
					event.preventDefault();
					state.pickFile(file);
				},
				onKeyDown: (event) => {
					if (event.key === "Enter" && !event.shiftKey) {
						event.preventDefault();
						state.send();
					}
				}
			}),
			h("div", {
				className: "pet-chat-composer-bar",
				children: [
					h("label", {
						className: "pet-chat-attach",
						title: "附一张图（也可以直接粘贴）",
						children: ["附图", h("input", {
							className: "pet-chat-file",
							type: "file",
							accept: "image/png,image/jpeg,image/webp,image/gif",
							onChange: (event) => {
								const file = event.target.files?.[0];
								if (file !== void 0) state.pickFile(file);
								event.target.value = "";
							}
						})]
					}),
					h("span", { className: "pet-chat-composer-spacer" }),
					h("button", {
						type: "button",
						className: "pet-chat-send",
						"aria-label": state.busy ? "生成中" : "发送",
						onClick: () => state.send(),
						disabled: state.busy,
						children: sendIcon(h)
					})
				]
			})
		]
	});
}

//#endregion
//#region src/client/chat/stamp.ts
/**
* 消息时间戳的展示格式。
*
* 纯函数：`now` 由调用方传入，不读时钟，便于测试。今天的消息只给时间，
* 更早的补上日期——聊天记录跨天时，光看 `08:26:46` 分不清是哪天。
* @module dsh-zdd-pet/src/client/chat/stamp
*/
/** 一天的毫秒数；只用于算「差几天」，日界按本地时区取整。 */
const DAY_MS = 24 * 60 * 60 * 1e3;
/** 两位补零。 */
const pad = (value) => String(value).padStart(2, "0");
/** 时:分:秒。 */
const clockOf = (date) => pad(date.getHours()) + ":" + pad(date.getMinutes()) + ":" + pad(date.getSeconds());
/** 本地日界的时间戳（当天 00:00）。 */
const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
function formatStamp(ts, now) {
	if (!Number.isFinite(ts) || ts <= 0) return "";
	const date = new Date(ts);
	const today = new Date(now);
	const days = Math.round((startOfDay(today) - startOfDay(date)) / DAY_MS);
	const clock = clockOf(date);
	if (days <= 0) return clock;
	if (days === 1) return "昨天 " + clock;
	const monthDay = date.getMonth() + 1 + "月" + date.getDate() + "日";
	if (date.getFullYear() === today.getFullYear()) return monthDay + " " + clock;
	return date.getFullYear() + "年" + monthDay + " " + clock;
}

//#endregion
//#region src/client/chat/view-message.ts
function avatarNode(h, isMe) {
	if (!isMe) return h("img", {
		className: "pet-chat-avatar",
		src: LOGO_URL,
		alt: "",
		loading: "lazy"
	});
	return h("svg", {
		className: "pet-chat-avatar",
		viewBox: "0 0 32 32",
		"aria-hidden": "true",
		children: [
			h("circle", {
				cx: 16,
				cy: 16,
				r: 16,
				fill: "var(--dsw-specific-bubble)"
			}),
			h("circle", {
				cx: 16,
				cy: 17.5,
				r: 9.5,
				fill: "var(--dsw-alias-bg-layer-1)"
			}),
			h("path", {
				d: "M6.8 15.5a9.2 9.2 0 0 1 18.4 0q-4.6-4.2-9.2-4.2t-9.2 4.2z",
				fill: "var(--dsw-alias-label-tertiary)",
				opacity: .75
			}),
			h("path", {
				d: "M16 9.2q1.1-2.6 3.4-1.7",
				fill: "none",
				stroke: "var(--dsw-alias-label-tertiary)",
				strokeWidth: 1.3,
				strokeLinecap: "round",
				opacity: .75
			}),
			h("ellipse", {
				cx: 12.4,
				cy: 17.6,
				rx: 1.5,
				ry: 2,
				fill: "var(--dsw-alias-label-primary)"
			}),
			h("ellipse", {
				cx: 19.6,
				cy: 17.6,
				rx: 1.5,
				ry: 2,
				fill: "var(--dsw-alias-label-primary)"
			}),
			h("circle", {
				cx: 12.9,
				cy: 16.8,
				r: .5,
				fill: "var(--dsw-alias-bg-layer-1)"
			}),
			h("circle", {
				cx: 20.1,
				cy: 16.8,
				r: .5,
				fill: "var(--dsw-alias-bg-layer-1)"
			}),
			h("ellipse", {
				cx: 9.6,
				cy: 21,
				rx: 1.7,
				ry: 1.1,
				fill: "var(--dsw-alias-state-error-secondary)",
				opacity: .45
			}),
			h("ellipse", {
				cx: 22.4,
				cy: 21,
				rx: 1.7,
				ry: 1.1,
				fill: "var(--dsw-alias-state-error-secondary)",
				opacity: .45
			}),
			h("path", {
				d: "M14.6 21.6q1.4 1.5 2.8 0",
				fill: "none",
				stroke: "var(--dsw-alias-label-secondary)",
				strokeWidth: 1,
				strokeLinecap: "round"
			}),
			h("path", {
				d: "M25.5 5.5v4M23.5 7.5h4",
				fill: "none",
				stroke: "var(--dsw-alias-state-business-primary)",
				strokeWidth: 1.3,
				strokeLinecap: "round",
				opacity: .9
			})
		]
	});
}
function messageNode(h, message, isMe, assetRoot, onOpenImage) {
	const image = message.image !== void 0 ? attachmentUrl(message.image) : message.meme !== void 0 ? memeUrl(message.meme, assetRoot) : void 0;
	return h("div", {
		className: "pet-chat-msg " + (isMe ? "is-me" : "is-pet"),
		children: [avatarNode(h, isMe), h("div", {
			className: "pet-chat-bubble",
			children: [h("div", {
				className: "pet-chat-text",
				children: message.text
			}), image === void 0 ? null : h("button", {
				type: "button",
				className: "pet-chat-img-btn",
				title: "点开看大图",
				onClick: () => onOpenImage(image),
				children: h("img", {
					className: "pet-chat-img",
					src: image,
					alt: "对话图片",
					loading: "lazy"
				})
			})]
		})]
	});
}
function roundNode(rt, state, round) {
	const { h } = rt;
	const selected = state.selected.includes(round.ts);
	const className = "pet-chat-round" + (state.selecting ? " is-selecting" : "") + (selected ? " is-selected" : "");
	return h("div", {
		key: String(round.ts),
		className,
		onClick: state.selecting ? (event) => {
			const target = event.target;
			if (!(target instanceof Element)) return;
			if (target.closest(".pet-chat-pick, button, a, [role=\"button\"]") !== null) return;
			state.toggleRound(round.ts);
		} : void 0,
		children: [state.selecting ? h("label", {
			className: "pet-chat-pick",
			title: "选中这一轮（问 + 答一起删）",
			children: [h("input", {
				type: "checkbox",
				checked: selected,
				onChange: () => state.toggleRound(round.ts),
				"aria-label": "选中这一轮"
			})]
		}) : null, h("div", {
			className: "pet-chat-round-body",
			children: [
				round.user === void 0 ? null : messageNode(h, round.user, true, state.assetRoot, state.showImage),
				round.assistant === void 0 ? null : messageNode(h, round.assistant, false, state.assetRoot, state.showImage),
				round.ts > 0 ? h("div", {
					className: "pet-chat-time " + (round.assistant === void 0 ? "is-me" : "is-pet"),
					children: formatStamp(round.ts, Date.now())
				}) : null
			]
		})]
	});
}

//#endregion
//#region src/client/chat/view.ts
/** 宠物标签条：点击切换对话。 */
function tabsNode(h, state) {
	return h("div", {
		className: "pet-chat-tabs",
		children: state.pets.map((pet) => h("button", {
			key: pet.id,
			type: "button",
			className: "pet-chat-tab",
			"aria-pressed": String(pet.id === state.petId),
			onClick: () => state.pickPet(pet.id),
			children: pet.name || pet.id
		}))
	});
}
/**
* 顶部「加载更早」：与 DSH 自己的历史加载同一个位置与形态。
*
* 内存里没有更早的轮时，同一个位置换成一行说明——不然按钮消失后用户不知道是「到底了」还是「坏了」。
*/
function olderNode(h, state) {
	if (state.rounds.length === 0) return null;
	if (state.hasOlder) return h("div", {
		className: "pet-chat-older",
		children: [h("button", {
			type: "button",
			className: "pet-chat-older-btn",
			onClick: () => state.showOlder(),
			children: "加载更早"
		})]
	});
	const capped = state.rounds.length >= HISTORY_ROUNDS;
	return h("div", {
		className: "pet-chat-older",
		children: [h("span", {
			className: "pet-chat-older-note",
			children: capped ? "已经到底了（最多加载 " + HISTORY_ROUNDS + " 轮）" : "已经到底了"
		})]
	});
}
/** 记忆边界：线以下才是桌宠每次真正带进上下文的最近 N 轮。 */
function memoryLineNode(h, rounds) {
	return h("div", {
		key: "memory-line",
		className: "pet-chat-memory",
		children: [h("span", {
			className: "pet-chat-memory-note",
			children: `以下 ${rounds} 轮进入桌宠的记忆`
		})]
	});
}
/** 消息列表：加载更早 + 记忆边界 + 空态提示或按轮渲染。 */
function listNode(rt, state) {
	const emptyText = state.loading ? "加载中…" : state.petId === "" ? "没有可对话的桌宠" : "还没有聊过天";
	const body = state.rounds.length === 0 ? [rt.h("div", {
		key: "empty",
		className: "pet-chat-hint",
		children: emptyText
	})] : state.rounds.map((round) => roundNode(rt, state, round));
	const cut = memoryBoundaryIndex(state.rounds.length, state.memoryRounds);
	if (cut !== null && state.memoryRounds !== void 0) body.splice(cut, 0, memoryLineNode(rt.h, state.memoryRounds));
	return rt.h("div", {
		className: "pet-chat-list",
		ref: state.listRef,
		children: [olderNode(rt.h, state), ...body]
	});
}
/**
* 图片放大：直接用平台的 `ImageLightbox`——与 DSH 会话里点开图片是同一个组件，
* 全屏遮罩、Esc / 点遮罩关闭、关闭后焦点回到原处都由它负责。
*
* @returns 没有预览或拿不到 primitives 时是 null。
*/
function previewNode(rt, state) {
	if (state.previewUrl === void 0 || rt.ui === void 0) return null;
	const { ImageLightbox } = rt.ui;
	return rt.h(ImageLightbox, {
		src: state.previewUrl,
		alt: "对话图片",
		labels: {
			dialog: "图片预览",
			close: "关闭"
		},
		onClose: () => state.closeImage()
	});
}
function buildPanel(rt, state) {
	const { h } = rt;
	return h("div", {
		className: "pet-chat",
		children: [
			tabsNode(h, state),
			orphansNode(h, state),
			toolsNode(h, state),
			listNode(rt, state),
			confirmNode(rt, state),
			previewNode(rt, state),
			state.error === "" ? null : h("div", {
				className: "pet-chat-error",
				role: "alert",
				children: state.error
			}),
			composerNode(h, state)
		]
	});
}

//#endregion
//#region src/client/chat/panel.ts
function makePetChatPanel(rt) {
	const useChatState = createPetChatState(rt);
	return function PetChatPanel() {
		return buildPanel(rt, useChatState());
	};
}

//#endregion
//#region src/client/chat/panel-css.ts
const PANEL_CSS = `
.pet-chat {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  gap: ${px(SIZE.gapWide)};
  padding: ${px(SIZE.pad)} ${px(SIZE.pad)} ${px(SIZE.padBottom)};
  color: var(--dsw-alias-label-primary);
  font: var(--dsw-font-s-14);
}

.pet-chat-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: ${px(SIZE.gapTight)};
  flex: 0 0 auto;
}

.pet-chat-tab {
  border: 1px solid var(--dsw-alias-border-l2);
  background: transparent;
  color: var(--dsw-alias-label-secondary);
  border-radius: var(--dsw-radius-md);
  padding: ${px(SIZE.tabPadY)} ${px(SIZE.tabPadX)};
  font: var(--dsw-font-xxs-12);
  cursor: pointer;
  transition: background var(--ds-transition-duration-fast) var(--ds-ease-in-out),
    color var(--ds-transition-duration-fast) var(--ds-ease-in-out);
}

.pet-chat-tab:hover {
  background: var(--dsw-alias-interactive-bg-hover);
}

.pet-chat-tab[aria-pressed="true"] {
  background: var(--dsw-alias-bg-multi-select);
  border-color: var(--dsw-alias-border-l3);
  color: var(--dsw-alias-label-primary);
  font-weight: 500;
}

.pet-chat-tools {
  display: flex;
  justify-content: flex-end;
  gap: ${px(SIZE.gapTight)};
  flex: 0 0 auto;
}

.pet-chat-orphans {
  display: flex;
  align-items: center;
  gap: ${px(SIZE.gap)};
  flex: 0 0 auto;
  padding: ${px(SIZE.gapTight)} ${px(SIZE.tabPadX)};
  border-radius: var(--dsw-radius-md);
  background: var(--dsw-alias-bg-multi-select);
  color: var(--dsw-alias-label-secondary);
  font: var(--dsw-font-xxs-12);
}

.pet-chat-confirm {
  display: flex;
  align-items: center;
  gap: ${px(SIZE.gap)};
  flex: 0 0 auto;
  padding: ${px(SIZE.gapTight)} ${px(SIZE.tabPadX)};
  border-radius: var(--dsw-radius-md);
  background: var(--dsw-alias-interactive-bg-hover-danger);
  color: var(--dsw-alias-label-primary);
  font: var(--dsw-font-xxs-12);
}

.pet-chat-danger {
  flex: 0 0 auto;
  border: none;
  border-radius: var(--dsw-radius-sm);
  background: var(--dsw-alias-state-error-primary);
  color: var(--dsw-alias-label-primary-foreground);
  padding: ${px(SIZE.toolPadY)} ${px(SIZE.tabPadX)};
  font: var(--dsw-font-xxs-12);
  cursor: pointer;
  transition: background var(--ds-transition-duration-fast) var(--ds-ease-in-out);
}

.pet-chat-danger:hover {
  background: var(--dsw-alias-state-error-secondary);
}

.pet-chat-confirm-actions {
  display: flex;
  justify-content: flex-end;
  gap: ${px(SIZE.gap)};
}

/* 指南页卡片图标：框架给的槽位只按图标尺寸排版，所以让 logo 铺满它 */
.pet-chat-guide-icon {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: var(--dsw-radius-xs);
  display: block;
}

.pet-chat-tool {
  border: 1px solid var(--dsw-alias-border-l2);
  background: transparent;
  color: var(--dsw-alias-label-secondary);
  border-radius: var(--dsw-radius-sm);
  padding: ${px(SIZE.toolPadY)} ${px(SIZE.toolPadX)};
  font: var(--dsw-font-xxs-12);
  cursor: pointer;
}

.pet-chat-tool:hover:not(:disabled) {
  background: var(--dsw-alias-interactive-bg-hover);
}

.pet-chat-tool[aria-pressed="true"] {
  background: var(--dsw-alias-bg-multi-select);
  border-color: var(--dsw-alias-border-l3);
  color: var(--dsw-alias-label-primary);
}

.pet-chat-tool:disabled {
  opacity: 0.5;
  cursor: default;
}

.pet-chat-list {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: ${px(SIZE.listGap)};
  padding-right: ${px(SIZE.hairline)};
}

.pet-chat-older {
  display: flex;
  justify-content: center;
  flex: 0 0 auto;
}

.pet-chat-older-btn {
  border: none;
  border-radius: ${px(SIZE.pill)};
  background: var(--dsw-alias-interactive-bg-hover);
  color: var(--dsw-alias-label-secondary);
  padding: ${px(SIZE.pillPadY)} ${px(SIZE.tabPadX)};
  font: var(--dsw-font-xxs-12);
  cursor: pointer;
  transition: background var(--ds-transition-duration-fast) var(--ds-ease-in-out);
}

.pet-chat-older-btn:hover {
  background: var(--dsw-alias-interactive-bg-active);
}

.pet-chat-older-note {
  color: var(--dsw-alias-label-tertiary);
  font: var(--dsw-font-xxs-12);
  padding: ${px(SIZE.pillPadY)} 0;
}

.pet-chat-memory {
  display: flex;
  align-items: center;
  gap: ${px(SIZE.gap)};
  flex: 0 0 auto;
  color: var(--dsw-alias-label-caption);
  font: var(--dsw-font-xxxs-11);
}

/* 线本身用伪元素画，文字居中：视觉上是「一条带说明的分隔线」 */
.pet-chat-memory::before,
.pet-chat-memory::after {
  content: '';
  flex: 1 1 auto;
  border-top: 1px dashed var(--dsw-alias-border-l3);
}

.pet-chat-memory-note {
  flex: 0 0 auto;
}

.pet-chat-round {
  display: flex;
  align-items: flex-start;
  gap: ${px(SIZE.gap)};
}

/* 多选模式：整轮是一张可点卡片；选中给浅底，未选中透明（与豆包的选中样式一致） */
.pet-chat-round.is-selecting {
  padding: ${px(SIZE.gapTight)} ${px(SIZE.gapWide)};
  border-radius: var(--dsw-radius-md);
  cursor: pointer;
  transition: background var(--ds-transition-duration-fast) var(--ds-ease-in-out);
}

.pet-chat-round.is-selecting:hover {
  background: var(--dsw-alias-interactive-bg-hover);
}

.pet-chat-round.is-selected {
  background: var(--dsw-alias-bg-multi-select);
}

.pet-chat-pick {
  flex: 0 0 auto;
  padding-top: ${px(SIZE.gapTight)};
  opacity: 0.55;
  cursor: pointer;
}

.pet-chat-pick:hover {
  opacity: 1;
}

.pet-chat-round-body {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: ${px(SIZE.gap)};
}

.pet-chat-msg {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: ${px(SIZE.gap)};
  max-width: 92%;
}

.pet-chat-msg.is-me {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.pet-chat-msg.is-pet {
  align-self: flex-start;
}

.pet-chat-avatar {
  flex: 0 0 auto;
  width: ${px(SIZE.avatar)};
  height: ${px(SIZE.avatar)};
  border-radius: 50%;
  object-fit: cover;
}

.pet-chat-msg.is-pet .pet-chat-avatar {
  border: 1px solid var(--dsw-alias-border-l2);
}

.pet-chat-bubble {
  padding: ${px(SIZE.bubblePadY)} ${px(SIZE.bubblePadX)};
  border-radius: var(--dsw-radius-md);
  word-break: break-word;
  line-height: 1.6;
}

.pet-chat-text {
  white-space: pre-wrap;
}

.pet-chat-msg.is-me .pet-chat-bubble {
  background: var(--dsw-specific-bubble);
  color: var(--dsw-alias-label-primary);
}

.pet-chat-msg.is-pet .pet-chat-bubble {
  background: var(--dsw-alias-bg-module-platform);
  color: var(--dsw-alias-label-primary);
}

.pet-chat-img-btn {
  display: block;
  margin-top: ${px(SIZE.gapTight)};
  padding: 0;
  border: none;
  background: none;
  cursor: zoom-in;
}

.pet-chat-img {
  display: block;
  max-width: ${px(SIZE.imgMaxW)};
  max-height: ${px(SIZE.imgMaxH)};
  border-radius: var(--dsw-radius-sm);
  object-fit: contain;
}

.pet-chat-time {
  margin-top: ${px(SIZE.hairline)};
  font: var(--dsw-font-xxxs-11);
  color: var(--dsw-alias-label-caption);
}

.pet-chat-time.is-pet {
  align-self: flex-start;
  /* 与宠物气泡左沿对齐：让时间明显属于这一轮的回答，而不是下一轮提问的开头 */
  margin-left: ${px(SIZE.avatar + SIZE.gap)};
}

.pet-chat-time.is-me {
  align-self: flex-end;
}

.pet-chat-hint {
  color: var(--dsw-alias-label-tertiary);
  font: var(--dsw-font-xxs-12);
}

.pet-chat-error {
  color: var(--dsw-alias-state-error-primary);
  font: var(--dsw-font-xxs-12);
}

.pet-chat-composer {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  gap: ${px(SIZE.gapTight)};
  padding: ${px(SIZE.composerPad)} ${px(SIZE.pad)} ${px(SIZE.composerPadBottom)};
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: var(--dsw-radius-xl);
  background: var(--dsw-specific-input-major);
  transition: border-color var(--ds-transition-duration-fast) var(--ds-ease-in-out);
}

.pet-chat-composer:focus-within {
  border-color: var(--dsw-alias-state-business-primary);
}

.pet-chat-preview {
  display: flex;
  align-items: center;
  gap: ${px(SIZE.gap)};
}

.pet-chat-preview-img {
  width: ${px(SIZE.preview)};
  height: ${px(SIZE.preview)};
  object-fit: cover;
  border-radius: var(--dsw-radius-sm);
  border: 1px solid var(--dsw-alias-border-l2);
}

.pet-chat-preview-meta {
  font: var(--dsw-font-xxxs-11);
  color: var(--dsw-alias-label-tertiary);
}

.pet-chat-input {
  width: 100%;
  resize: none;
  border: none;
  background: transparent;
  color: var(--dsw-alias-label-primary);
  padding: 0;
  min-height: ${px(SIZE.inputMinH)};
  max-height: ${px(SIZE.inputMaxH)};
  overflow-y: auto;
  font: var(--dsw-font-s-14);
  outline: none;
}

.pet-chat-input::placeholder {
  color: var(--dsw-alias-label-tertiary);
}

.pet-chat-composer-bar {
  display: flex;
  align-items: center;
  gap: ${px(SIZE.gap)};
}

.pet-chat-attach {
  display: inline-flex;
  align-items: center;
  gap: ${px(SIZE.hairline)};
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: ${px(SIZE.pill)};
  padding: ${px(SIZE.pillPadY)} ${px(SIZE.tabPadX)};
  font: var(--dsw-font-xxs-12);
  color: var(--dsw-alias-label-secondary);
  cursor: pointer;
  user-select: none;
  transition: background var(--ds-transition-duration-fast) var(--ds-ease-in-out);
}

.pet-chat-attach:hover {
  background: var(--dsw-alias-interactive-bg-hover);
}

.pet-chat-file {
  display: none;
}

.pet-chat-composer-spacer {
  flex: 1 1 auto;
}

.pet-chat-send {
  flex: 0 0 auto;
  width: ${px(SIZE.send)};
  height: ${px(SIZE.send)};
  display: grid;
  place-items: center;
  border: none;
  border-radius: 50%;
  background: var(--dsw-alias-button-info-fill);
  color: var(--dsw-alias-label-primary-foreground);
  cursor: pointer;
  transition: background var(--ds-transition-duration-fast) var(--ds-ease-in-out),
    opacity var(--ds-transition-duration-fast) var(--ds-ease-in-out);
}

.pet-chat-send:hover:not(:disabled) {
  background: var(--dsw-alias-button-info-hover);
}

.pet-chat-send:disabled {
  opacity: 0.45;
  cursor: default;
}
`;

//#endregion
//#region src/client/chat/styles.ts
/** 样式标签的归属标记；同一 key 只注入一次。 */
const STYLE_KEY = "dsh-zdd-pet-chat-panel";
/** 当前挂载数：多个 pane 可能同时挂载面板，靠引用计数决定何时移除样式标签。 */
let mountedCount = 0;
/** 已注入的 style 元素（第一个挂载时创建）。 */
let styleTag;
function injectPanelCss() {
	if (typeof document === "undefined") return () => {};
	mountedCount += 1;
	if (styleTag === void 0) {
		const tag = document.createElement("style");
		tag.dataset.dshPetCss = STYLE_KEY;
		tag.textContent = PANEL_CSS;
		document.head.appendChild(tag);
		styleTag = tag;
	}
	let released = false;
	return () => {
		if (released) return;
		released = true;
		mountedCount -= 1;
		if (mountedCount === 0 && styleTag !== void 0) {
			styleTag.remove();
			styleTag = void 0;
		}
	};
}

//#endregion
//#region src/client/chat/shortcut.ts
const PET_CHAT_COMMAND_ID = "pet-chat.open";
/** 六个运行环境档案都用同一个物理组合：主修饰键 + Shift + P。 */
const DEFAULT_BINDING = {
	code: "KeyP",
	modifiers: ["primary", "shift"]
};
/**
* 给默认键位的环境。
*
* **不含 `web:linux`**：DSH 对 Web 端快捷键有白名单（Linux 只放行 `Ctrl+/`、`Ctrl+Shift+,`、
* `Ctrl+Shift+.`），给 Linux Web 配 `Ctrl+Shift+P` 会让整条注册被拒（报 `Unsupported Web shortcut`）。
* 那个环境的用户可以在设置里自己绑。
*/
const DEFAULT_PROFILES = [
	"web:windows",
	"web:macos",
	"desktop:windows",
	"desktop:macos",
	"desktop:linux"
];
function registerPetChatShortcut(ctx, open) {
	const shortcuts = ctx.get?.("shortcuts");
	if (shortcuts === void 0 || typeof shortcuts.register !== "function") {
		console.warn("[dsh-zdd-pet] 快捷键服务不可用，「桌宠对话」未注册快捷键");
		return {
			registered: false,
			dispose: () => {}
		};
	}
	try {
		const defaults = Object.fromEntries(DEFAULT_PROFILES.map((profile) => [profile, DEFAULT_BINDING]));
		const dispose = shortcuts.register({
			id: PET_CHAT_COMMAND_ID,
			label: () => "桌宠对话",
			aliases: [],
			defaults,
			regions: ["page"],
			modals: [],
			resolve: () => ({
				status: "handled",
				run: open
			})
		});
		return {
			registered: true,
			dispose: () => dispose()
		};
	} catch (error) {
		console.warn("[dsh-zdd-pet] 快捷键注册失败：" + (error instanceof Error ? error.message : String(error)));
		return {
			registered: false,
			dispose: () => {}
		};
	}
}

//#endregion
//#region src/client/chat/register.ts
/** 标签实现身份；同时也是正文与标题插槽的 key。 */
const TAB_ID = "dsh-zdd-pet-chat";
/** 标签类型；`openTab` 按它打开。 */
const TAB_KIND = "pet-chat";
/** 标签头与指南页卡片的文案。 */
const TAB_TITLE = "桌宠对话";
function registerPetChatTab(ctx, rt) {
	const tabs = ctx.get?.("sidebarRightTabs");
	if (tabs === void 0 || typeof tabs.register !== "function") {
		console.warn("[dsh-zdd-pet] 右侧栏不可用：没有 sidebarRightTabs 服务，桌宠对话标签未注册");
		return () => {};
	}
	const disposeCss = injectPanelCss();
	const Panel = makePetChatPanel(rt);
	/** 指南页卡片的图标：插件 logo；框架给的位置只有 16px 左右，靠 CSS 铺满。 */
	const GuideIcon = () => rt.h("img", {
		className: "pet-chat-guide-icon",
		src: LOGO_URL,
		alt: "",
		loading: "lazy"
	});
	const controller = ctx.get?.("sidebarRight");
	const shortcut = registerPetChatShortcut(ctx, () => controller?.openTab?.(TAB_KIND));
	const disposeType = tabs.register({
		id: TAB_ID,
		kind: TAB_KIND,
		priority: "extension",
		title: () => TAB_TITLE,
		guide: [{
			id: TAB_KIND,
			order: 400,
			title: () => TAB_TITLE,
			description: () => "与所有桌宠对话，点标签切换",
			icon: GuideIcon,
			...shortcut.registered ? { commandId: PET_CHAT_COMMAND_ID } : {}
		}]
	});
	ctx.slots.inject("sidebar.right.pane.tab", function* () {
		yield ctx.slots.register({
			name: "sidebar.right.pane.tab",
			key: TAB_ID,
			order: 100
		}, () => rt.h(Panel, {}));
	});
	return () => {
		shortcut.dispose();
		disposeType();
		disposeCss();
	};
}

//#endregion
//#region src/client/app.ts
function makeFactory() {
	return (require) => {
		const module = { exports: {} };
		const react = require("react");
		const { useEffect, useRef, useState, useCallback } = react;
		const { jsx: h } = require("react/jsx-runtime");
		let primitives;
		try {
			primitives = require("@deepseek-ai/dsh-client-ui-primitives");
		} catch (error) {
			console.warn("[dsh-zdd-pet] 图标模块不可用：" + (error instanceof Error ? error.message : String(error)));
		}
		let renderIconSvg;
		try {
			const { createRoot } = require("react-dom/client");
			const { flushSync } = require("react-dom");
			renderIconSvg = (icon) => {
				const holder = document.createElement("div");
				const root = createRoot(holder);
				try {
					flushSync(() => root.render(h(icon, { size: 16 })));
					return holder.innerHTML;
				} finally {
					root.unmount();
				}
			};
		} catch (error) {
			console.warn("[dsh-zdd-pet] 图标渲染器不可用（react-dom 缺失）：" + (error instanceof Error ? error.message : String(error)));
		}
		const PetMulti = makePetUI({
			h,
			useState,
			useEffect,
			useRef
		});
		const name = "pet";
		const inject = [
			"slots",
			"locale",
			"connection",
			"remote",
			"remote.commands",
			"commandUi"
		];
		function apply(ctx) {
			ctx.effect(() => ctx.locale.register(NS, {
				zh,
				en
			}), "dsh-zdd-pet: dictionaries");
			const t = ctx.locale.bind(NS);
			ctx.provide("petApiZdd", {
				getState: getStateSnapshot,
				menuEvents: takeMenuEvents,
				pose: readPose,
				progress: readProgress
			});
			ctx.effect(() => initNotify({ openSession: (sessionId) => ctx.get?.("uiWorkspace")?.openSession?.(sessionId) }), "dsh-zdd-pet: notifications");
			ctx.effect(() => {
				const commandUi = ctx.get?.("commandUi");
				if (!commandUi || typeof commandUi.decorate !== "function") {
					console.warn("[dsh-zdd-pet] 命令选择框不可用：commandUi 服务缺失（/pet 仍可手输 id 或名字）");
					return () => {};
				}
				return commandUi.decorate({
					name: "pet",
					available: () => true,
					ui: {
						kind: "popupSelect",
						options: async () => petBridge.current.map((p) => ({
							id: p.id,
							label: p.name || p.id,
							detail: (p.assetRoot && p.assetRoot !== p.id ? p.assetRoot + " / " : "") + p.id
						})),
						onSelect: async (option, session) => {
							await ctx.remote?.commands?.execute(session.sessionId, "/pet " + option.id, []);
						}
					}
				});
			}, "dsh-zdd-pet: /pet picker");
			ctx.effect(() => {
				const commandUi = ctx.get?.("commandUi");
				const icons = primitives;
				if (commandUi === void 0 || icons === void 0) {
					console.warn("[dsh-zdd-pet] 命令图标不可用（命令本身仍可用，只是没有图标）");
					return () => {};
				}
				return installCommandFaces(commandUi, new Map([
					["chat", {
						label: () => t("cmd.chat"),
						icon: icons.IconQueueOutlineRegular
					}],
					["pet", {
						label: () => t("cmd.pet"),
						icon: icons.IconUsersOutlineRegular
					}],
					["balance", {
						label: () => t("cmd.balance"),
						icon: icons.IconGaugeOutlineRegular
					}]
				]));
			}, "dsh-zdd-pet: command faces");
			ctx.effect(() => {
				const renderIcon = renderIconSvg;
				const icon = primitives?.IconSlidersTwoOutlineMedium;
				if (renderIcon === void 0 || icon === void 0) {
					console.warn("[dsh-zdd-pet] 设置页导航图标不可用（那一行仍是齿轮）");
					return () => {};
				}
				return installSectionNavIcon({
					label: () => t("nav"),
					renderSvg: () => renderIcon(icon)
				});
			}, "dsh-zdd-pet: settings nav icon");
			ctx.slots.inject("shell.overlay", function* () {
				yield ctx.slots.register({
					name: "shell.overlay",
					id: "pet",
					order: 1e3
				}, () => h(PetMulti, {}));
			});
			const PetConfigSection = makePetConfigSection({
				h,
				useState,
				useEffect,
				useRef,
				useCallback,
				t
			});
			ctx.slots.inject("settings.section", function* () {
				yield ctx.slots.register({
					name: "settings.section",
					id: "pet-config",
					order: 30,
					label: () => t("nav"),
					inject: () => ({ t })
				}, PetConfigSection);
			});
			ctx.effect(() => {
				try {
					return registerPetChatTab(ctx, {
						h,
						useEffect,
						useRef,
						useState,
						...primitives === void 0 ? {} : { ui: {
							Modal: primitives.Modal,
							Button: primitives.Button,
							ImageLightbox: primitives.ImageLightbox
						} }
					});
				} catch (error) {
					console.error("[dsh-zdd-pet] 右侧栏对话面板注册失败（已忽略，不影响启动）：", error);
					return () => {};
				}
			}, "dsh-zdd-pet: sidebar chat tab");
		}
		module.exports = {
			apply,
			inject,
			name
		};
		return module.exports;
	};
}

//#endregion
//#region src/client/index.ts
window.__ModuleLoader__.load({
	id: "dsh-zdd-pet",
	factory: makeFactory()
});

//#endregion
})();