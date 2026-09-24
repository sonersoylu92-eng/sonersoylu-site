/**
 * Counter Animation Utility
 * Animates numbers from 0 to target value on scroll
 */

class Counter {
  constructor(element, target, options = {}) {
    this.element = element;
    this.target = typeof target === 'string' ? parseInt(target, 10) : target;
    this.options = {
      duration: 1,
      ease: 'power2.out',
      startValue: 0,
      decimals: 0,
      prefix: '',
      suffix: '',
      delimiter: ',',
      scrollTrigger: true,
      scrollConfig: {
        start: 'top 80%',
        end: 'top 20%',
        scrub: false,
      },
      ...options,
    };

    this.tween = null;
    this.animatedValue = this.options.startValue;

    this.init();
  }

  init() {
    if (!this.element) return;

    if (this.options.scrollTrigger) {
      this.createScrollTriggerAnimation();
    } else {
      this.createBasicAnimation();
    }
  }

  /**
   * Create animation triggered by scroll
   */
  createScrollTriggerAnimation() {
    this.tween = gsap.to(this, {
      animatedValue: this.target,
      duration: this.options.duration,
      ease: this.options.ease,
      scrollTrigger: {
        trigger: this.element,
        start: this.options.scrollConfig.start,
        end: this.options.scrollConfig.end,
        onUpdate: () => {
          this.updateDisplay();
        },
      },
      onUpdate: () => {
        this.updateDisplay();
      },
    });
  }

  /**
   * Create basic animation without scroll
   */
  createBasicAnimation() {
    this.tween = gsap.to(this, {
      animatedValue: this.target,
      duration: this.options.duration,
      ease: this.options.ease,
      onUpdate: () => {
        this.updateDisplay();
      },
    });
  }

  /**
   * Update displayed value
   */
  updateDisplay() {
    const value = Math.round(this.animatedValue);
    const formattedValue = this.formatNumber(value);
    this.element.textContent = `${this.options.prefix}${formattedValue}${this.options.suffix}`;
  }

  /**
   * Format number with delimiter
   */
  formatNumber(value) {
    const parts = value.toString().split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, this.options.delimiter);
    return parts.join('.');
  }

  /**
   * Set new target value
   */
  setTarget(newTarget) {
    this.target = newTarget;
    if (this.tween) {
      this.tween.progress(0);
      this.init();
    }
  }

  /**
   * Play animation
   */
  play() {
    if (this.tween) {
      this.tween.play();
    }
  }

  /**
   * Pause animation
   */
  pause() {
    if (this.tween) {
      this.tween.pause();
    }
  }

  /**
   * Reset animation
   */
  reset() {
    if (this.tween) {
      this.tween.progress(0);
      this.animatedValue = this.options.startValue;
      this.updateDisplay();
    }
  }

  /**
   * Destroy animation
   */
  destroy() {
    if (this.tween) {
      this.tween.kill();
    }
  }
}

/**
 * Animate multiple counters with stagger
 */
function animateCounters(selector, options = {}) {
  const elements = document.querySelectorAll(selector);
  const counters = [];

  elements.forEach((el, index) => {
    const target = el.dataset.target || parseInt(el.textContent, 10);
    const counter = new Counter(el, target, {
      ...options,
      scrollConfig: {
        start: `top 80%`,
        end: `top 20%`,
        ...options.scrollConfig,
      },
    });

    counters.push(counter);
  });

  return counters;
}

export { Counter, animateCounters };
