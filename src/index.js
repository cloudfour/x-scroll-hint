const template = document.createElement("template");

// Since the code below is a template string literal, it will not be minified or
// transpiled
template.innerHTML = /*html*/ `
  <div class="scroll-wrapper">
    <slot/>
  </div>

  <style>
    :host {
      --hint-width: 3em;
      --hint-color: white;
    }

    .scroll-wrapper {
      display: block;
      position: relative;
    }

    .scroll-wrapper::before,
    .scroll-wrapper::after {
      content: '';
      position: absolute;
      width: var(--hint-width);
      top: 0;
      bottom: 0;
      z-index: 1;
      transition-property: opacity, transform;
      transition-duration: var(--hint-transition-duration, 0.2s);
      transition-timing-function: var(--hint-transition-timing-function, ease-out);
      opacity: 0;
      transform: scaleX(0);
      pointer-events: none;
    }

    .scroll-wrapper::before {
      background: linear-gradient(to right, var(--hint-color), transparent);
      left: 0;
      transform-origin: left;
    }

    .scroll-wrapper::after {
      background: linear-gradient(to left, var(--hint-color), transparent);
      right: 0;
      transform-origin: right;
    }

    .scroll-wrapper[is-scrolled="true"]::before,
    .scroll-wrapper[is-overflowing="true"]::after {
      transform: none;
      opacity: 1
    }
  </style>
`;

/**
 * Our XScrollHint web component class
 *
 * @cssprop --hint-color - The color of the scroll affordance shadow that is overlaid
 *  on top of overflowing content
 * @cssprop --hint-width - The width of the scroll affordance shadow that is overlaid
 *  on top of overflowing content
 * @cssprop --hint-transition-duration - How long should it take for the shadow to fade in and out?
 * @cssprop --hint-transition-timing-function - What timing function should be used for the shadow's transition?
 */
class XScrollHint extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.shadowRoot.appendChild(template.content.cloneNode(true));

    this.scrollWrapper = this.shadowRoot.querySelector(".scroll-wrapper");

    // TODO: Use resize observer
    this.addEventListener("resize", this.adjustOverflowAffordances);
    // TODO: Throttle scrolling
    this.addEventListener("scroll", this.adjustOverflowAffordances, true);
    this.adjustOverflowAffordances();
  }

  adjustOverflowAffordances() {
    const containerWidth = this.scrollWrapper.clientWidth;

    // TODO: do this once and watch for slot change
    const content = this.shadowRoot
      .querySelector("slot")
      .assignedNodes()
      .find((node) => {
        // find our first, non-text node
        return node instanceof HTMLElement;
      });

    if (!content) {
      console.warn("x-scroll-hint expects a single child element");
      return;
    }

    const contentWidth = content.scrollWidth;
    const scrollPos = content.scrollLeft;

    this.scrollWrapper.setAttribute("is-scrolled", scrollPos > 0);
    this.scrollWrapper.setAttribute(
      "is-overflowing",
      contentWidth - (scrollPos + containerWidth) > 0
    );
  }
}

customElements.define("x-scroll-hint", XScrollHint);
