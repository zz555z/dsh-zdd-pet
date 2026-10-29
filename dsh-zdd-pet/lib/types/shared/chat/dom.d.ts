/**
 * 对话弹窗的 DOM 装配：输入框、上传/截屏按钮、待发送图片缩略图、提示行与错误行。
 * 只建元素并绑定"选中图片后怎么显示"，不发送、不定位、不管关闭。
 * @module dsh-zdd-pet/src/shared/chat/dom
 */
import { type EncodedImage } from './encode.ts';
import type { ChatAttachment } from './send.ts';
/** 弹窗用到的元素与行为；挂载函数只按需接线，不重新造 DOM。 */
export interface ChatDom {
    readonly root: HTMLDivElement;
    readonly input: HTMLTextAreaElement;
    readonly err: HTMLDivElement;
    readonly shotBtn: HTMLButtonElement;
    /** 输入框与根宽度随文本自适应；挂到文档后调用一次，输入时自动重算。 */
    readonly resizeInput: () => void;
    /** 清掉待发送图片（含 file input 的值）。 */
    readonly clearAttach: () => void;
    /** 放进一张待发送图片（上传、拖拽、粘贴共用）；类型不接受或编码失败时提示并返回 false。 */
    readonly setImageFile: (file: File) => Promise<boolean>;
    /** 放进一张已编码好的图（截屏走这条：没有 File，只有 base64）。 */
    readonly setEncoded: (encoded: EncodedImage) => boolean;
    /** 当前待发送的图片；没有时 undefined。 */
    readonly getAttachment: () => ChatAttachment | undefined;
    /** 是否正在编码：发送前要等它结束，否则这条消息会漏掉图片。 */
    readonly isEncoding: () => boolean;
    /** 临时提示（不是错误），超时自动收起。 */
    readonly flash: (text: string) => void;
    /** 收起提示并清计时器；关闭弹窗时调用。 */
    readonly dispose: () => void;
}
/**
 * 建好弹窗的全部元素并挂到 `document.body` 下。
 *
 * @param opts - 可选的截屏实现；不传时按钮只给"当前环境不支持"的提示。
 * @returns 元素引用与行为（清理附件、临时提示、自适应、释放计时器）。
 */
export declare function createChatDom(opts?: {
    capture?: () => Promise<EncodedImage>;
    /** 挂到指定容器（借用气泡时传气泡元素）；缺省挂到 document.body。 */
    container?: HTMLElement;
    /** 是否让输入框随文本自适应宽度；借用气泡时关掉，由气泡宽高决定。 */
    autoWidth?: boolean;
}): ChatDom;
