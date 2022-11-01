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

    // TODO: Document throttle speed
    this.throttleSpeed = this.getAttribute("throttle-speed") || 50;

    this.scrollWrapperEl = this.shadowRoot.querySelector(".scroll-wrapper");
    this.scrollingEl = this.getScrollingEl();
    // TODO: Test this
    addEventListener("slotchange", () => {
      this.scrollingEl = this.getScrollingEl();
    });

    // TODO: Test this
    this.resizeObserver = new ResizeObserver(() => {
      this.adjustOverflowAffordances();
    });
    this.resizeObserver.observe(this);

    // TODO: throttle
    this.addEventListener(
      "scroll",
      smartThrottle(this.adjustOverflowAffordances, this.throttleSpeed),
      true
    );

    this.adjustOverflowAffordances();
  }

  adjustOverflowAffordances() {
    if (!this.scrollingEl || !this.scrollWrapperEl) return;

    const containerWidth = this.scrollWrapperEl.clientWidth;
    const scrollingElWidth = this.scrollingEl.scrollWidth;
    const scrollPos = this.scrollingEl.scrollLeft;

    // TODO: should this also set a scrolled/overflowing percentage which could
    // be used to scale the affordance by X%? Would that feel smoother?
    // or awkward?
    this.scrollWrapperEl.setAttribute("is-scrolled", scrollPos > 0);
    this.scrollWrapperEl.setAttribute(
      "is-overflowing",
      scrollingElWidth - (scrollPos + containerWidth) > 0
    );
  }

  getScrollingEl() {
    const firstChild = this.shadowRoot
      .querySelector("slot")
      .assignedNodes()
      .find((node) => {
        // find our first non-text node
        return node instanceof HTMLElement;
      });

    if (!firstChild) {
      console.warn("x-scroll-hint expects a single child element");
      return;
    }

    return firstChild;
  }
}

// TODO: evaluate and clean up code. Should this be moved to the primary class?
// This throttling function uses a kind of combination of throttling and debouncing
// for the best of both worlds. By default it throttles, but it has special logic
// to ensure that if the final scroll event got throttled it still gets called
// in the end
// https://codeburst.io/throttling-and-debouncing-in-javascript-b01cad5c8edf
function smartThrottle(func, limit) {
  let lastFunc;
  let lastRan;
  return function () {
    const context = this;
    const args = arguments;
    if (!lastRan) {
      func.apply(context, args);
      lastRan = Date.now();
    } else {
      clearTimeout(lastFunc);
      lastFunc = setTimeout(function () {
        if (Date.now() - lastRan >= limit) {
          func.apply(context, args);
          lastRan = Date.now();
        }
      }, limit - (Date.now() - lastRan));
    }
  };
}

customElements.define("x-scroll-hint", XScrollHint);
