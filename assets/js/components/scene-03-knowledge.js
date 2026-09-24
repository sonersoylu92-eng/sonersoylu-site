/**
 * Scene 03: FROM MACHINE TO KNOWLEDGE
 * Blueprint technical drawing with field experience stats
 */

class Scene03Knowledge extends ScrollScene {
  constructor(config) {
    super({
      id: 'scene-03',
      ...config,
    });

    this.blueprints = [];
    this.counters = [];
  }

  create() {
    if (!this.element) return;

    // Create timeline
    this.createScrollTimeline({
      trigger: this.element,
      start: 'top center',
      end: '80% center',
      scrub: 1.2,
    });

    // Animate blueprint sections
    this.animateBlueprints();

    // Animate technical specs
    this.animateSpecs();

    // Animate counters
    this.animateCounters();
  }

  /**
   * Animate blueprint SVG drawings
   */
  animateBlueprints() {
    const blueprints = this.element.querySelectorAll('.blueprint-svg');

    blueprints.forEach((bp, index) => {
      // Fade in SVG
      gsap.from(bp, {
        opacity: 0,
        duration: 1,
        delay: 0.2 + index * 0.2,
        ease: 'power2.out',
      });

      // Scroll animation: morph and fade
      this.timeline.to(
        bp,
        {
          opacity: 0.5,
          filter: 'blur(2px)',
        },
        0
      );

      // Animate SVG stroke if available
      const paths = bp.querySelectorAll('path, circle, line, rect');
      paths.forEach((path, pathIndex) => {
        const length = path.getTotalLength?.() || 0;
        if (length) {
          gsap.from(path, {
            strokeDasharray: length,
            strokeDashoffset: length,
            duration: 2,
            delay: 0.3 + index * 0.2 + pathIndex * 0.05,
            ease: 'power2.out',
          });
        }
      });
    });
  }

  /**
   * Animate technical specification items
   */
  animateSpecs() {
    const specs = this.element.querySelectorAll('.spec-item');

    specs.forEach((spec, index) => {
      gsap.from(spec, {
        opacity: 0,
        x: -20,
        duration: 0.6,
        delay: 0.4 + index * 0.1,
        ease: 'power2.out',
      });

      // Highlight on scroll
      this.timeline.to(
        spec,
        {
          borderLeftColor: '#C7FF32',
          duration: 0.3,
        },
        0 + index * 0.05
      );
    });
  }

  /**
   * Animate experience counters
   */
  animateCounters() {
    const counterElements = this.element.querySelectorAll('[data-counter]');

    counterElements.forEach((el) => {
      const target = parseInt(el.dataset.counter, 10);
      const counter = new KnowledgeCounter(el, target, {
        duration: 1.5,
        ease: 'power2.out',
        delimiter: ',',
        scrollTrigger: true,
        scrollConfig: {
          start: 'top 70%',
          end: 'top 30%',
        },
      });

      this.counters.push(counter);
    });
  }

  /**
   * Destroy all animations
   */
  destroy() {
    super.destroy();
    this.counters.forEach((counter) => counter.destroy());
  }
}

/**
 * Counter class for animating numbers
 */
class KnowledgeCounter {
  constructor(element, target, options = {}) {
    this.element = element;
    this.target = target;
    this.options = {
      duration: 1,
      ease: 'power2.out',
      delimiter: ',',
      scrollTrigger: false,
      scrollConfig: {},
      ...options,
    };

    this.tween = null;
    this.animatedValue = 0;
    this.init();
  }

  init() {
    if (this.options.scrollTrigger) {
      this.tween = gsap.to(this, {
        animatedValue: this.target,
        duration: this.options.duration,
        ease: this.options.ease,
        scrollTrigger: {
          trigger: this.element,
          ...this.options.scrollConfig,
        },
        onUpdate: () => this.updateDisplay(),
      });
    } else {
      this.tween = gsap.to(this, {
        animatedValue: this.target,
        duration: this.options.duration,
        ease: this.options.ease,
        onUpdate: () => this.updateDisplay(),
      });
    }
  }

  updateDisplay() {
    const value = Math.round(this.animatedValue);
    const formatted = value.toLocaleString('tr-TR', {
      useGrouping: true,
    });
    this.element.textContent = formatted;
  }

  destroy() {
    if (this.tween) {
      this.tween.kill();
    }
  }
}

// Auto-initialize
document.addEventListener('DOMContentLoaded', () => {
  const scene03El = document.querySelector('.scene-03');
  if (scene03El) {
    window.scene03 = new Scene03Knowledge({ element: scene03El });
  }
});
