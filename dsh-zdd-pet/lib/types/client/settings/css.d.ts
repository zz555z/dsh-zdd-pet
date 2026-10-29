/**
 * 设置页样式表与注入入口：两族类名——`dsh-zdd-pet-mp__*`（AI 模型选择器）与 `dsh-zdd-pet-cfg__*`（配置卡片）。
 * 只放伪类、悬浮、过渡与容器查询这类内联 style 表达不了的东西，其余排版走组件内联 style。
 * 颜色与圆角取 `--dsw-alias-*` / `--dsw-radius-*` token；填充按钮上的白字与阴影回退值是刻意例外。
 * 注入按 `data-plugin-css` 去重，同一页面重复渲染设置页不会长第二份样式。
 * @module dsh-zdd-pet/src/client/settings/css
 */
/** 把设置页样式注入 `document.head`：幂等，且没有 document（SSR 或单测）时直接返回。 */
export declare function injectSettingsCss(): void;
