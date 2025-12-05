(function() {
  'use strict';
  
  // Configuration
  const config = {
    apiUrl: 'http://localhost:3001', // Default, can be overridden
    embedded: true
  };

  // Get config from global or data attributes
  if (window.kinetiqChatConfig) {
    Object.assign(config, window.kinetiqChatConfig);
  }

  // Create container for React app
  const containerId = 'kinetiq-chat-root';
  let container = document.getElementById(containerId);
  
  if (!container) {
    container = document.createElement('div');
    container.id = containerId;
    document.body.appendChild(container);
  }

  // Load React and ReactDOM from CDN if not already loaded
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  // Load React dependencies
  async function loadDependencies() {
    const scripts = [];
    
    if (!window.React) {
      scripts.push(loadScript('https://unpkg.com/react@18/umd/react.production.min.js'));
    }
    if (!window.ReactDOM) {
      scripts.push(loadScript('https://unpkg.com/react-dom@18/umd/react-dom.production.min.js'));
    }
    
    await Promise.all(scripts);
  }

  // Load CSS
  function loadCSS(href) {
    if (document.querySelector(`link[href="${href}"]`)) {
      return; // Already loaded
    }
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
  }

  // Initialize the chat widget
  async function initChat() {
    try {
      await loadDependencies();
      
      // Set config globally
      window.kinetiqChatConfig = config;
      
      // Load the main app bundle (this would be your built React app)
      // For now, we'll create a simple inline implementation
      const script = document.createElement('script');
      script.type = 'module';
      script.src = config.appUrl || '/src/main.tsx';
      script.setAttribute('data-embedded', 'true');
      document.body.appendChild(script);
      
      // Load CSS
      loadCSS(config.cssUrl || '/src/index.css');
      
    } catch (error) {
      console.error('Failed to initialize KinetiQ chat:', error);
    }
  }

  // Auto-initialize if DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initChat);
  } else {
    initChat();
  }

  // Export API for manual control
  window.KinetiQChat = {
    init: initChat,
    config: config,
    open: function() {
      const button = document.querySelector('.kinetiq-chat-button');
      if (button) button.click();
    },
    close: function() {
      const closeBtn = document.querySelector('.kinetiq-chat-close');
      if (closeBtn) closeBtn.click();
    }
  };
})();

