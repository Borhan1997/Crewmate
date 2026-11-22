declare module "@novnc/novnc" {
  export default class RFB extends EventTarget {
    constructor(
      target: HTMLElement,
      urlOrChannel: string,
      options?: { shared?: boolean; credentials?: { password?: string } },
    );
    viewOnly: boolean;
    scaleViewport: boolean;
    clipViewport: boolean;
    resizeSession: boolean;
    focusOnClick: boolean;
    background: string;
    focus(): void;
    blur(): void;
    disconnect(): void;
  }
}
