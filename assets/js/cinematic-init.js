/**
 * SONER SOYLU — CINEMATIC HOMEPAGE
 * Master Initialization Script
 *
 * Loads and initializes all scroll-driven scenes
 */

class CinematicHomepage {
  constructor(options = {}) {
    this.scrollEngine = null;
    this.scenes = [];
    this.options = {
      enableLenis: true,
      enableDebug: false,
      ...options,
    };

    // Check for required libraries
    this.checkDependencies();

    // Initialize
    this.init();
  }

  /**
   * Check if required libraries are loaded
   */
  checkDependencies() {
    const required = ['gsap', 'ScrollTrigger'];
    const missing = [];

    if (!window.gsap) missing.push('GSAP');
    if (!window.ScrollTrigger) missing.push('GSAP ScrollTrigger');
    else if (window.gsap) window.gsap.registerPlugin(window.ScrollTrigger);

    if (missing.length > 0) {
      console.error(
        `CinematicHomepage: Missing libraries: ${missing.join(', ')}. ` +
        `Please load GSAP and ScrollTrigger before this script.`
      );
      return false;
    }

    return true;
  }

  /**
   * Initialize cinematic homepage
   */
  init() {
    // Log initialization
    console.log('🎬 CinematicHomepage: Initializing...');

    // Create scroll engine
    this.scrollEngine = new ScrollEngine({
      enableLenis: this.options.enableLenis,
    });

    // Find all scenes and initialize them
    this.initializeScenes();

    // Setup viewport management
    this.setupViewport();

    // Handle window resize
    this.setupResizeHandler();

    // Setup navigation (scroll to scene)
    this.setupNavigation();

    console.log('✅ CinematicHomepage: Ready!');
  }

  /**
   * Initialize all scene components
   */
  initializeScenes() {
    const sceneElements = document.querySelectorAll('[data-scene]');

    sceneElements.forEach((el) => {
      const sceneId = el.dataset.scene;

      // Determine which scene class to instantiate
      let SceneClass = null;

      switch (sceneId) {
        case 'scene-01':
          SceneClass = window.Scene01Hero;
          break;
        case 'scene-02':
          SceneClass = window.Scene02Machine;
          break;
        case 'scene-03':
          SceneClass = window.Scene03Knowledge;
          break;
        case 'scene-04':
          SceneClass = window.Scene04Field;
          break;
        // Additional scenes would go here
        default:
          SceneClass = ScrollScene;
      }

      if (SceneClass) {
        const scene = new SceneClass({ element: el });
        this.scrollEngine.registerScene(scene);
        this.scenes.push(scene);
      }
    });

    // Refresh ScrollTrigger after all scenes are loaded
    setTimeout(() => {
      this.scrollEngine.refresh();
    }, 100);
  }

  /**
   * Setup viewport and meta tags
   */
  setupViewport() {
    // Ensure proper viewport
    if (!document.querySelector('meta[name="viewport"]')) {
      const meta = document.createElement('meta');
      meta.name = 'viewport';
      meta.content = 'width=device-width, initial-scale=1, viewport-fit=cover';
      document.head.appendChild(meta);
    }

    // Set theme color for cinematic mode
    const themeColor = document.querySelector('meta[name="theme-color"]');
    if (themeColor) {
      themeColor.content = '#080A0C';
    }
  }

  /**
   * Setup window resize handler
   */
  setupResizeHandler() {
    let resizeTimeout;

    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        this.scrollEngine.refresh();
      }, 250);
    });

    // Orientation change
    window.addEventListener('orientationchange', () => {
      setTimeout(() => {
        this.scrollEngine.refresh();
      }, 500);
    });
  }

  /**
   * Setup scene navigation
   */
  setupNavigation() {
    // Add data-scroll-to attributes to navigation links
    const navLinks = document.querySelectorAll('[data-scroll-to]');

    navLinks.forEach((link) => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const sceneId = link.dataset.scrollTo;
        const sceneEl = document.querySelector(`[data-scene="${sceneId}"]`);

        if (sceneEl) {
          sceneEl.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });
  }

  /**
   * Get current scene progress (0-1)
   */
  getProgress() {
    return this.scrollEngine.getProgress();
  }

  /**
   * Scroll to specific scene
   */
  scrollToScene(sceneIndex) {
    this.scrollEngine.scrollToScene(sceneIndex);
  }

  /**
   * Destroy all animations and cleanup
   */
  destroy() {
    if (this.scrollEngine) {
      this.scrollEngine.destroy();
    }
    console.log('CinematicHomepage: Destroyed');
  }
}

/**
 * Auto-initialize on DOMContentLoaded
 */
document.addEventListener('DOMContentLoaded', () => {
  // Initialize cinematic homepage if element exists
  if (document.querySelector('[data-scene]')) {
    window.cinematicHomepage = new CinematicHomepage({
      enableLenis: true,
      enableDebug: false,
    });
  }
});

/**
 * Cleanup on page unload
 */
window.addEventListener('beforeunload', () => {
  if (window.cinematicHomepage) {
    window.cinematicHomepage.destroy();
  }
});
