/**
 * SmoothMusicScroller — extracted from ResonanceApp (fix #2).
 * Handles physics-based smooth scrolling for virtual lists.
 */
export class SmoothMusicScroller {
  constructor(container, renderCallback) {
    this.container      = container;
    this.renderCallback = renderCallback;
    this.itemHeight     = 112;
    this.buffer         = 8;
    this.totalItems     = 0;
    this.currentScroll  = 0;
    this.targetScroll   = 0;
    this.velocity       = 0;
    this.isAnimating    = false;
    this.lastWheelTime  = 0;
    this.frameRequested = false;
    this.onWheel        = this.onWheel.bind(this);
    this.onNativeScroll = this.onNativeScroll.bind(this);
    this.setup();
  }

  setup() {
    this.container.style.willChange = 'transform';
    this.container.style.transform  = 'translateZ(0)';
    this.container.addEventListener('wheel',  this.onWheel,        { passive: false });
    this.container.addEventListener('scroll', this.onNativeScroll, { passive: true });
    this.updateVisibleItems();
  }

  setItems(count) {
    this.totalItems = count;
    this.updateVisibleItems();
  }

  onWheel(e) {
    e.preventDefault();
    const now       = performance.now();
    const rapid     = now - this.lastWheelTime < 40;
    this.lastWheelTime = now;
    const mult      = rapid ? 1.8 : 1;
    this.velocity   += e.deltaY * mult * 0.15;
    this.velocity   = Math.max(-120, Math.min(120, this.velocity));
    if (!this.isAnimating) this.animate();
  }

  onNativeScroll() {
    this.targetScroll = this.container.scrollTop;
    this.updateVisibleItems();
  }

  animate() {
    this.isAnimating = true;
    const step = () => {
      this.velocity *= 0.88;
      if (Math.abs(this.velocity) < 0.08) { this.velocity = 0; this.isAnimating = false; return; }
      this.targetScroll += this.velocity;
      const maxScroll = Math.max(0, this.totalItems * this.itemHeight - this.container.clientHeight);
      this.targetScroll   = Math.max(0, Math.min(maxScroll, this.targetScroll));
      this.currentScroll += (this.targetScroll - this.currentScroll) * 0.22;
      this.container.scrollTop = this.currentScroll;
      this.updateVisibleItems();
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  updateVisibleItems() {
    if (this.frameRequested) return;
    this.frameRequested = true;
    requestAnimationFrame(() => {
      const h     = this.container.clientHeight;
      const start = Math.max(0, Math.floor(this.container.scrollTop / this.itemHeight) - this.buffer);
      const count = Math.ceil(h / this.itemHeight) + this.buffer * 2;
      const end   = Math.min(this.totalItems, start + count);
      this.renderCallback(start, end);
      this.frameRequested = false;
    });
  }

  destroy() {
    this.container.removeEventListener('wheel',  this.onWheel);
    this.container.removeEventListener('scroll', this.onNativeScroll);
  }
}
