/**
 * SONER SOYLU — CINEMATIC REDESIGN
 * Scroll Engine: GSAP ScrollTrigger + Lenis Smooth Scroll
 *
 * Orchestrates scroll-linked animations and manages the cinematic
 * scroll experience across all scenes.
 */

class ScrollEngine {
  constructor(config = {}) {
    this.scenes = [];
    this.lenis = null;
    this.scrollTriggerProxy = config.scrollTriggerProxy || true;
    this.enableLenis = config.enableLenis !== false;
    this.scrubValue = config.scrubValue || 1.2;
    this.isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.init();
  }

  /**
   * Initialize scroll engine with Lenis and ScrollTrigger
   */
  init() {
    // Add cinematic mode class to HTML
    document.documentElement.classList.add('cinematic');

    // Initialize Lenis if not in reduced motion mode
    if (this.enableLenis && !this.isReducedMotion) {
      this.initLenis();
    }

    // Register ScrollTrigger
    this.registerScrollTrigger();

    // Bind RAF for Lenis
    if (this.lenis) {
      gsap.ticker.add((time) => {
        this.lenis.raf(time * 1000);
      });
      gsap.ticker.lagSmoothing(0);
    }
  }

  /**
   * Initialize Lenis smooth scroll
   */
  initLenis() {
    if (typeof Lenis === 'undefined') {
      console.warn('ScrollEngine: Lenis library not loaded, using default scroll');
      return;
    }

    this.lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      direction: 'vertical',
      gestureDirection: 'vertical',
      smooth: true,
      smoothTouch: false,
      touchMultiplier: 2,
    });
  }

  /**
   * Register ScrollTrigger with GSAP
   */
  registerScrollTrigger() {
    if (window.gsap && window.ScrollTrigger) window.gsap.registerPlugin(window.ScrollTrigger);
    if (!window.gsap || !window.ScrollTrigger) {
      console.error('ScrollEngine: GSAP or ScrollTrigger plugin not loaded');
      return;
    }

    // Register ScrollTrigger
    gsap.registerPlugin(window.ScrollTrigger);

    // Update on scroll
    if (this.lenis) {
      // Proxy for smooth scroll
      gsap.defaults({ overwrite: 'auto' });

      const proxy = {
        onUpdate: (self) => {
          self.getVelocity();
        },
        onDrag: () => {
          if (this.lenis) {
            this.lenis.stop();
          }
        },
      };

      ScrollTrigger.create(proxy);

      if (this.lenis) {
        this.lenis.on('scroll', ScrollTrigger.update);
        ScrollTrigger.addEventListener('refresh', () => {
          if (this.lenis) {
            this.lenis.reset();
          }
        });
      }
    }
  }

  /**
   * Register a scene for scroll management
   */
  registerScene(scene) {
    if (scene && typeof scene.create === 'function') {
      this.scenes.push(scene);
      scene.create();
    }
  }

  /**
   * Refresh ScrollTrigger calculations
   */
  refresh() {
    ScrollTrigger.refresh();
  }

  /**
   * Get scroll progress (0-1)
   */
  getProgress() {
    return ScrollTrigger.getAll()[0]?.progress || 0;
  }

  /**
   * Scroll to a specific scene
   */
  scrollToScene(sceneIndex) {
    const elements = document.querySelectorAll('.scene');
    if (elements[sceneIndex]) {
      elements[sceneIndex].scrollIntoView({ behavior: 'smooth' });
    }
  }

  /**
   * Kill all animations
   */
  destroy() {
    this.scenes.forEach((scene) => {
      if (typeof scene.destroy === 'function') {
        scene.destroy();
      }
    });

    if (this.lenis) {
      this.lenis.destroy();
    }

    ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    document.documentElement.classList.remove('cinematic');
  }
}

/**
 * Scene Base Class
 * All scenes extend this class
 */
class ScrollScene {
  constructor(config) {
    this.id = config.id || 'scene-unknown';
    this.element = config.element || null;
    this.timeline = null;
    this.scrollTrigger = null;
    this.config = config;
  }

  /**
   * Create animations — Override in subclasses
   */
  create() {
    console.log(`Scene ${this.id}: create() not implemented`);
  }

  /**
   * Handle scroll progress — Override in subclasses
   */
  onScroll(progress) {
    // progress: 0-1
  }

  /**
   * Destroy animations
   */
  destroy() {
    if (this.scrollTrigger) {
      this.scrollTrigger.kill();
    }
    if (this.timeline) {
      this.timeline.kill();
    }
  }

  /**
   * Helper: Create a timeline with ScrollTrigger
   */
  createScrollTimeline(config = {}) {
    const defaults = {
      trigger: this.element,
      start: 'top center',
      end: 'bottom center',
      scrub: 1.2,
      markers: false, // Set to true for debugging
      onUpdate: (self) => this.onScroll(self.progress),
    };

    const scrollTriggerConfig = { ...defaults, ...config };

    this.timeline = gsap.timeline({
      scrollTrigger: scrollTriggerConfig,
    });

    this.scrollTrigger = this.timeline.scrollTrigger;

    return this.timeline;
  }

  /**
   * Helper: Stagger animations
   */
  staggerElements(selector, fromConfig, toConfig, staggerDelay = 0.1) {
    const elements = this.element?.querySelectorAll(selector) || [];

    elements.forEach((el, index) => {
      gsap.from(el, {
        ...fromConfig,
        delay: index * staggerDelay,
      });

      if (toConfig) {
        gsap.to(el, {
          ...toConfig,
          delay: index * staggerDelay,
        });
      }
    });
  }
}

/**
 * Export for module usage
 */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ScrollEngine, ScrollScene };
}
