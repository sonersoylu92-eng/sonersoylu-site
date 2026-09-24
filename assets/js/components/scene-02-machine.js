/**
 * Scene 02: THE MACHINE — COMPONENTS
 * 3D turbine with component cards and data visualization
 */

class Scene02Machine extends ScrollScene {
  constructor(config) {
    super({
      id: 'scene-02',
      ...config,
    });

    this.activeComponent = 0;
    this.components = [];
    this.three = null;
    this.resizeObserver = null;
  }

  create() {
    if (!this.element) return;

    // Create timeline
    this.createScrollTimeline({
      trigger: this.element,
      start: 'top top',
      end: '80% top',
      scrub: 1.2,
    });

    // Initialize component cards
    this.initializeComponents();

    // Animate component cards
    this.animateComponentCards();

    // Setup 3D model
    this.setupThreeDModel();
  }

  /**
   * Initialize component data
   */
  initializeComponents() {
    const cards = this.element.querySelectorAll('.component-card');
    this.components = Array.from(cards).map((card, index) => ({
      element: card,
      index,
      name: card.querySelector('.component-name')?.textContent || '',
      specs: card.querySelectorAll('.component-spec-row'),
    }));
  }

  /**
   * Animate component cards with scroll
   */
  animateComponentCards() {
    const cards = this.element.querySelectorAll('.component-card');

    cards.forEach((card, index) => {
      // Initial fade in
      gsap.from(card, {
        opacity: 0,
        y: 30,
        duration: 0.6,
        delay: 0.2 + index * 0.1,
        ease: 'power2.out',
      });

      // On hover: highlight
      card.addEventListener('mouseenter', () => {
        this.setActiveComponent(index);
      });

      card.addEventListener('mouseleave', () => {
        this.setActiveComponent(-1);
      });

      // On touch: toggle active (with preventDefault to avoid scroll)
      card.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.setActiveComponent(
          this.activeComponent === index ? -1 : index
        );
      }, { passive: false });

      // Animate specs on card active
      const specs = card.querySelectorAll('.component-spec-row');
      specs.forEach((spec, specIndex) => {
        gsap.from(spec, {
          opacity: 0,
          x: -20,
          duration: 0.4,
          delay: 0.2 + index * 0.1 + specIndex * 0.05,
          ease: 'power2.out',
        });
      });
    });
  }

  /**
   * Set active component
   */
  setActiveComponent(index) {
    this.activeComponent = index;

    this.components.forEach((component, i) => {
      if (i === index) {
        component.element.classList.add('active');
        gsap.to(component.element, {
          scale: 1.02,
          duration: 0.3,
          ease: 'power2.out',
        });
      } else {
        component.element.classList.remove('active');
        gsap.to(component.element, {
          scale: 1,
          duration: 0.3,
          ease: 'power2.out',
        });
      }
    });
  }

  /**
   * Setup 3D turbine model
   */
  setupThreeDModel() {
    const canvas = this.element.querySelector('canvas');
    if (!canvas || typeof THREE === 'undefined') return;

    try {
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(
        75,
        canvas.clientWidth / canvas.clientHeight,
        0.1,
        1000
      );
      const renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true,
      });

      renderer.setSize(canvas.clientWidth, canvas.clientHeight);
      renderer.setClearColor(0x000000, 0);
      camera.position.z = 2.5;

      // Create turbine components
      this.createTurbineComponents(scene);

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

        // Continuous rotation (cached meshes for performance)
        scene.children.forEach((child) => {
          if (child.isMesh && child.name !== 'highlight') {
            child.rotation.y += 0.003;
          }
        });

        renderer.render(scene, camera);
      };

      animate();
    } catch (error) {
      console.warn('Scene 02: Three.js setup failed:', error);
    }
  }

  /**
   * Create turbine component visualization
   */
  createTurbineComponents(scene) {
    // Rotor blades with highlight
    const bladeGeometry = new THREE.BoxGeometry(0.2, 1.5, 0.1);
    const bladeMaterial = new THREE.MeshPhongMaterial({ color: 0xc7ff32 });

    for (let i = 0; i < 3; i++) {
      const blade = new THREE.Mesh(bladeGeometry, bladeMaterial);
      blade.rotation.z = (Math.PI * 2 * i) / 3;
      blade.name = 'rotor';
      scene.add(blade);
    }

    // Nacelle
    const nacelleGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.8, 16);
    const nacelleMaterial = new THREE.MeshPhongMaterial({ color: 0x181c20 });
    const nacelle = new THREE.Mesh(nacelleGeometry, nacelleMaterial);
    nacelle.position.z = -0.5;
    nacelle.name = 'nacelle';
    scene.add(nacelle);

    // Main bearing
    const bearingGeometry = new THREE.TorusGeometry(0.25, 0.05, 16, 16);
    const bearingMaterial = new THREE.MeshPhongMaterial({ color: 0x4488ff });
    const bearing = new THREE.Mesh(bearingGeometry, bearingMaterial);
    bearing.position.z = -0.4;
    bearing.name = 'bearing';
    scene.add(bearing);

    // Tower
    const towerGeometry = new THREE.CylinderGeometry(0.15, 0.2, 3, 16);
    const towerMaterial = new THREE.MeshPhongMaterial({ color: 0x181c20 });
    const tower = new THREE.Mesh(towerGeometry, towerMaterial);
    tower.position.z = -2;
    tower.name = 'tower';
    scene.add(tower);

    // Lighting
    const light1 = new THREE.DirectionalLight(0xffffff, 0.8);
    light1.position.set(5, 5, 5);
    scene.add(light1);

    const light2 = new THREE.DirectionalLight(0x4488ff, 0.5);
    light2.position.set(-5, -5, 5);
    scene.add(light2);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);
  }

  /**
   * Highlight specific component
   */
  highlightComponent(componentName) {
    // Would highlight the specific component in 3D view
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

// Auto-initialize
document.addEventListener('DOMContentLoaded', () => {
  const scene02El = document.querySelector('.scene-02');
  if (scene02El) {
    window.scene02 = new Scene02Machine({ element: scene02El });
  }
});
