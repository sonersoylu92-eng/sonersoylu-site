/**
 * Scene 04: FIELD EXPERIENCE
 * Experience stats with counter animations and field gallery
 */

class Scene04Field extends ScrollScene {
  constructor(config) {
    super({
      id: 'scene-04',
      ...config,
    });

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

    // Animate stat cards
    this.animateStatCards();

    // Animate counters
    this.animateCounters();

    // Setup gallery
    this.setupGallery();
  }

  /**
   * Animate stat cards
   */
  animateStatCards() {
    const cards = this.element.querySelectorAll('.stat-card');

    cards.forEach((card, index) => {
      // Initial fade in
      gsap.from(card, {
        opacity: 0,
        scale: 0.9,
        duration: 0.6,
        delay: 0.2 + index * 0.1,
        ease: 'back.out',
      });

      // Hover effect
      card.addEventListener('mouseenter', () => {
        gsap.to(card, {
          scale: 1.05,
          duration: 0.3,
          ease: 'power2.out',
        });
      });

      card.addEventListener('mouseleave', () => {
        gsap.to(card, {
          scale: 1,
          duration: 0.3,
          ease: 'power2.out',
        });
      });

      // Scroll animation
      this.timeline.to(
        card,
        {
          opacity: 0.7,
          y: -10,
        },
        0 + index * 0.05
      );
    });
  }

  /**
   * Animate counter numbers
   */
  animateCounters() {
    const statNumbers = this.element.querySelectorAll('.stat-number');

    statNumbers.forEach((el) => {
      const target = parseInt(el.dataset.target || el.textContent, 10);

      const counter = new FieldCounter(el, target, {
        duration: 2,
        ease: 'power2.out',
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
   * Setup gallery with hover effects
   */
  setupGallery() {
    const images = this.element.querySelectorAll('.gallery-image');

    images.forEach((img, index) => {
      // Fade in on load
      gsap.from(img, {
        opacity: 0,
        y: 20,
        duration: 0.6,
        delay: 0.3 + index * 0.05,
        ease: 'power2.out',
      });

      // Parallax effect
      gsap.to(img, {
        scrollTrigger: {
          trigger: img,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1,
        },
        y: index % 2 === 0 ? -20 : 20,
      });

      // Click to expand (optional lightbox)
      img.addEventListener('click', () => {
        this.expandImage(img);
      });
    });
  }

  /**
   * Expand image in lightbox
   */
  expandImage(imgEl) {
    const backdrop = document.createElement('div');
    backdrop.className = 'lightbox-backdrop';
    backdrop.style.cssText = `
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      backdrop-filter: blur(4px);
    `;

    const clone = imgEl.cloneNode(true);
    clone.style.cssText = `
      max-width: 90vw;
      max-height: 90vh;
      border-radius: 12px;
      box-shadow: 0 30px 60px rgba(199, 255, 50, 0.3);
    `;

    backdrop.appendChild(clone);
    document.body.appendChild(backdrop);

    // Animate in
    gsap.from(clone, {
      opacity: 0,
      scale: 0.8,
      duration: 0.4,
      ease: 'back.out',
    });

    // Close on click
    backdrop.addEventListener('click', () => {
      gsap.to(clone, {
        opacity: 0,
        scale: 0.8,
        duration: 0.3,
        ease: 'power2.in',
        onComplete: () => {
          backdrop.remove();
        },
      });
    });

    // Close on ESC
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        document.removeEventListener('keydown', handleEsc);
        backdrop.click();
      }
    };

    document.addEventListener('keydown', handleEsc);
  }

  /**
   * Destroy animations
   */
  destroy() {
    super.destroy();
    this.counters.forEach((counter) => counter.destroy());
  }
}

/**
 * Counter helper class
 */
class FieldCounter {
  constructor(element, target, options = {}) {
    this.element = element;
    this.target = target;
    this.options = {
      duration: 1,
      ease: 'power2.out',
      scrollTrigger: false,
      scrollConfig: {},
      ...options,
    };

    this.tween = null;
    this.animatedValue = 0;
    this.init();
  }

  init() {
    const animConfig = {
      animatedValue: this.target,
      duration: this.options.duration,
      ease: this.options.ease,
      onUpdate: () => this.updateDisplay(),
    };

    if (this.options.scrollTrigger) {
      animConfig.scrollTrigger = {
        trigger: this.element,
        ...this.options.scrollConfig,
      };
    }

    this.tween = gsap.to(this, animConfig);
  }

  updateDisplay() {
    const value = Math.round(this.animatedValue);
    const formatted = value.toLocaleString('tr-TR', { useGrouping: true });
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
  const scene04El = document.querySelector('.scene-04');
  if (scene04El) {
    window.scene04 = new Scene04Field({ element: scene04El });
  }
});
