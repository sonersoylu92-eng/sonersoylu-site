/**
 * Scene 05: FAULT DIAGNOSIS
 * Interactive diagnostic tree with scroll-triggered animations
 */

class Scene05Diagnosis extends ScrollScene {
  constructor(config) {
    super({
      id: 'scene-05',
      ...config,
    });
  }

  create() {
    if (!this.element) return;

    // Create timeline with scroll trigger
    this.createScrollTimeline({
      trigger: this.element,
      start: 'top top',
      end: '80% top',
      scrub: 1.2,
    });

    // Animate title
    this.animateDiagnosisTitle();

    // Animate tree nodes
    this.animateTreeNodes();
  }

  /**
   * Animate diagnosis title
   */
  animateDiagnosisTitle() {
    const titleEl = this.element.querySelector('.diagnosis-title');
    if (!titleEl) return;

    gsap.from(titleEl, {
      opacity: 0,
      y: 30,
      duration: 0.8,
      ease: 'power2.out',
    });

    this.timeline.to(
      titleEl,
      {
        opacity: 0,
        y: -30,
      },
      0
    );
  }

  /**
   * Animate tree nodes with stagger
   */
  animateTreeNodes() {
    const nodes = this.element.querySelectorAll('.tree-node');

    nodes.forEach((node, index) => {
      // Initial animation
      gsap.from(node, {
        opacity: 0,
        x: -30,
        duration: 0.6,
        delay: 0.2 + index * 0.1,
        ease: 'power2.out',
      });

      // Add hover effect
      node.addEventListener('mouseenter', () => {
        gsap.to(node, {
          x: 10,
          duration: 0.3,
          ease: 'power2.out',
        });
      });

      node.addEventListener('mouseleave', () => {
        gsap.to(node, {
          x: 0,
          duration: 0.3,
          ease: 'power2.out',
        });
      });
    });
  }

  /**
   * Cleanup and destroy
   */
  destroy() {
    super.destroy();
  }
}

// Auto-initialize if element exists
document.addEventListener('DOMContentLoaded', () => {
  const scene05El = document.querySelector('.scene-05');
  if (scene05El) {
    window.scene05 = new Scene05Diagnosis({ element: scene05El });
  }
});
