/**
 * Scene 01: HERO
 * Türbin 3D model with title, subtitle, and stats
 */

class Scene01Hero extends ScrollScene {
  constructor(config) {
    super({
      id: 'scene-01',
      ...config,
    });

    this.three = null;
    this.resizeObserver = null;
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
    this.animateTitle();

    // Animate subtitle
    this.animateSubtitle();

    // Animate stats
    this.animateStats();

    // Setup 3D model (if Three.js available)
    this.setupThreeDModel();
  }

  /**
   * Animate title with fade and scale
   */
  animateTitle() {
    const titleEl = this.element.querySelector('.scene-01-title');
    if (!titleEl) return;

    gsap.from(titleEl, {
      opacity: 0,
      y: 30,
      duration: 0.8,
      ease: 'power2.out',
    });

    // On scroll: fade out
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
   * Animate subtitle
   */
  animateSubtitle() {
    const subtitleEl = this.element.querySelector('.scene-01-subtitle');
    if (!subtitleEl) return;

    gsap.from(subtitleEl, {
      opacity: 0,
      y: 20,
      duration: 1,
      delay: 0.2,
      ease: 'power2.out',
    });

    this.timeline.to(
      subtitleEl,
      {
        opacity: 0,
        y: -20,
      },
      0
    );
  }

  /**
   * Animate individual stats with stagger
   */
  animateStats() {
    const statsContainer = this.element.querySelector('.scene-01-stats');
    if (!statsContainer) return;

    const stats = statsContainer.querySelectorAll('.scene-01-stat');
    stats.forEach((stat, index) => {
      // Initial animation (on page load)
      gsap.from(stat, {
        opacity: 0,
        y: 20,
        duration: 0.6,
        delay: 0.3 + index * 0.1,
        ease: 'power2.out',
      });

      // Scroll animation (fade out and up)
      this.timeline.to(
        stat,
        {
          opacity: 0,
          y: -20,
        },
        0
      );
    });
  }

  /**
   * Setup 3D turbine model with Three.js
   */
  setupThreeDModel() {
    const canvas = this.element.querySelector('canvas');
    if (!canvas || typeof THREE === 'undefined') return;

    try {
      // Scene setup
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(
        75,
        canvas.clientWidth / canvas.clientHeight,
        0.1,
        1000
      );
      const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });

      renderer.setSize(canvas.clientWidth, canvas.clientHeight);
      renderer.setClearColor(0x000000, 0);
      camera.position.z = 3;

      // Create a simple turbine visualization using primitives
      this.createTurbineGeometry(scene);

      // Store references for cleanup
      this.three = { scene, camera, renderer };

      // Handle resize with ResizeObserver (better performance)
      this.resizeObserver = new ResizeObserver(() => {
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        if (width > 0 && height > 0) {
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
          renderer.setSize(width, height);
        }
      });
      this.resizeObserver.observe(canvas);

      // Animation loop with RAF throttling
      let lastFrameTime = 0;
      const animate = () => {
        requestAnimationFrame(animate);

        const now = performance.now();
        if (now - lastFrameTime < 16.67) return; // 60fps cap
        lastFrameTime = now;

        // Rotate turbine continuously
        scene.children.forEach((child) => {
          if (child.isMesh) {
            child.rotation.y += 0.002;
            child.rotation.x += 0.0005;
          }
        });

        renderer.render(scene, camera);
      };

      animate();
    } catch (error) {
      console.warn('Scene 01: Three.js model setup failed:', error);
    }
  }

  /**
   * Create simple turbine geometry for visualization
   */
  createTurbineGeometry(scene) {
    // Rotor blades
    const bladeGeometry = new THREE.BoxGeometry(0.2, 1.5, 0.1);
    const bladeMaterial = new THREE.MeshPhongMaterial({ color: 0xc7ff32 });

    for (let i = 0; i < 3; i++) {
      const blade = new THREE.Mesh(bladeGeometry, bladeMaterial);
      blade.rotation.z = (Math.PI * 2 * i) / 3;
      scene.add(blade);
    }

    // Nacelle (tower head)
    const nacelleGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.8, 16);
    const nacelleMaterial = new THREE.MeshPhongMaterial({ color: 0x111417 });
    const nacelle = new THREE.Mesh(nacelleGeometry, nacelleMaterial);
    nacelle.position.z = -0.5;
    scene.add(nacelle);

    // Tower
    const towerGeometry = new THREE.CylinderGeometry(0.15, 0.2, 3, 16);
    const towerMaterial = new THREE.MeshPhongMaterial({ color: 0x181c20 });
    const tower = new THREE.Mesh(towerGeometry, towerMaterial);
    tower.position.z = -2;
    scene.add(tower);

    // Lighting
    const light1 = new THREE.DirectionalLight(0xffffff, 0.8);
    light1.position.set(5, 5, 5);
    scene.add(light1);

    const light2 = new THREE.DirectionalLight(0x4488ff, 0.4);
    light2.position.set(-5, -5, 5);
    scene.add(light2);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientLight);
  }

  /**
   * Handle scroll progress
   */
  onScroll(progress) {
    // Turbine rotates faster as scroll progresses
    const rotors = this.element.querySelectorAll('canvas');
    if (rotors.length > 0) {
      // Could add specific scroll behaviors here
    }
  }

  /**
   * Cleanup and destroy
   */
  destroy() {
    super.destroy();

    // Cleanup Three.js
    if (this.three) {
      this.three.renderer.dispose();
      this.three.scene.children.forEach((child) => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) child.material.dispose();
      });
    }

    // Cleanup ResizeObserver
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }
}

// Auto-initialize if element exists
document.addEventListener('DOMContentLoaded', () => {
  const scene01El = document.querySelector('.scene-01');
  if (scene01El) {
    window.scene01 = new Scene01Hero({ element: scene01El });
  }
});
