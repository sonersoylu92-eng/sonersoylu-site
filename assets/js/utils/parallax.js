/**
 * Parallax Utility
 * Creates scroll-linked parallax effects on elements
 */

class Parallax {
  constructor(element, speed = 0.5, options = {}) {
    this.element = element;
    this.speed = speed; // 0-1, where 0 = no movement, 1 = normal speed
    this.options = {
      direction: 'vertical', // 'vertical' or 'horizontal'
      ease: 'none',
      ...options,
    };

    this.scrollTrigger = null;
    this.init();
  }

  init() {
    if (!this.element) return;

    const config = {
      scrollTrigger: {
        trigger: this.element,
        start: 'top bottom',
        end: 'bottom top',
        scrub: 0.8,
        onUpdate: (self) => {
          // Calculate movement based on direction
          if (this.options.direction === 'horizontal') {
            const x = self.getVelocity() * this.speed * 0.5;
            gsap.to(this.element, { x, overwrite: 'auto' });
          } else {
            const y = self.getVelocity() * this.speed * 0.5;
            gsap.to(this.element, { y, overwrite: 'auto' });
          }
        },
      },
    };

    gsap.to(this.element, config);
    this.scrollTrigger = config.scrollTrigger;
  }

  /**
   * Set parallax speed
   */
  setSpeed(speed) {
    this.speed = Math.max(0, Math.min(1, speed));
  }

  /**
   * Destroy parallax
   */
  destroy() {
    if (this.scrollTrigger) {
      this.scrollTrigger.kill();
    }
  }
}

/**
 * Parallax using transforms (simpler, performant)
 */
class SimpleParallax {
  constructor(element, speed = -50, options = {}) {
    this.element = element;
    this.speed = speed; // pixels per scroll
    this.options = options;
    this.init();
  }

  init() {
    if (!this.element) return;

    gsap.to(this.element, {
      y: this.speed,
      scrollTrigger: {
        trigger: this.element,
        start: 'top bottom',
        end: 'bottom top',
        scrub: 1,
        markers: false,
      },
    });
  }

  destroy() {
    gsap.killTweensOf(this.element);
    ScrollTrigger.getAll().forEach((trigger) => {
      if (trigger.vars.trigger === this.element) {
        trigger.kill();
      }
    });
  }
}

/**
 * Background position parallax
 */
class BackgroundParallax {
  constructor(element, speed = 0.5, options = {}) {
    this.element = element;
    this.speed = speed;
    this.options = options;
    this.init();
  }

  init() {
    if (!this.element) return;

    gsap.to(this.element, {
      backgroundPosition: `center ${this.speed * 100}px`,
      scrollTrigger: {
        trigger: this.element,
        start: 'top bottom',
        end: 'bottom top',
        scrub: 1,
        markers: false,
      },
    });
  }

  destroy() {
    gsap.killTweensOf(this.element);
  }
}

export { Parallax, SimpleParallax, BackgroundParallax };
