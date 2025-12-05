/**
 * KinetiQ Chat Widget - Embedding Script
 * 
 * Add this script to your website's <head> section:
 * 
 * <script>
 *   window.kinetiqChatConfig = {
 *     frontendUrl: 'https://your-frontend-url.com',  // Your frontend URL (required)
 *     apiUrl: 'https://your-backend-url.com',        // Your backend API URL (optional, defaults to frontendUrl)
 *     position: 'bottom-left',                       // Widget position: 'bottom-right', 'bottom-left'
 *     buttonColor: '#4a90e2',                        // Button color
 *     buttonText: 'Chat',                            // Button text (optional)
 *   };
 * </script>
 * <script src="https://your-frontend-url.com/kinetiq-chat-embed.js"></script>
 */

(function() {
  'use strict';

  // Default configuration
  const defaultConfig = {
    frontendUrl: 'http://localhost:3012',
    apiUrl: null, // Will default to frontendUrl if not provided
    position: 'bottom-left',
    buttonColor: '#4a90e2',
    buttonText: 'Chat',
    zIndex: 9999
  };

  // Get configuration from global or use defaults
  const config = window.kinetiqChatConfig || {};
  const finalConfig = {
    frontendUrl: config.frontendUrl || defaultConfig.frontendUrl,
    apiUrl: config.apiUrl || config.frontendUrl || defaultConfig.frontendUrl,
    position: config.position || defaultConfig.position,
    buttonColor: config.buttonColor || defaultConfig.buttonColor,
    buttonText: config.buttonText || defaultConfig.buttonText,
    zIndex: config.zIndex || defaultConfig.zIndex
  };

  // Generate unique IDs
  const widgetId = 'kinetiq-chat-widget-' + Date.now();
  const buttonId = 'kinetiq-chat-button-' + Date.now();
  const iframeId = 'kinetiq-chat-iframe-' + Date.now();

  // Create styles
  const createStyles = () => {
    const styleId = 'kinetiq-chat-styles';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      #${widgetId} {
        position: fixed;
        ${finalConfig.position === 'bottom-right' ? 'right: 20px;' : 'left: 20px;'}
        bottom: 20px;
        z-index: ${finalConfig.zIndex};
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      }

      #${buttonId} {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background-color: ${finalConfig.buttonColor};
        border: none;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.2s, box-shadow 0.2s;
        position: relative;
      }

      #${buttonId}:hover {
        transform: scale(1.1);
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
      }

      #${buttonId}:active {
        transform: scale(0.95);
      }

      #${buttonId} svg {
        width: 28px;
        height: 28px;
        fill: white;
      }

      #${widgetId}.open #${buttonId} {
        display: none;
      }

      #${iframeId} {
        display: none;
        width: 380px;
        height: 600px;
        border: none;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
        background: white;
      }

      #${widgetId}.open #${iframeId} {
        display: block;
        animation: kinetiq-slide-up 0.3s ease-out;
      }

      @keyframes kinetiq-slide-up {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @media (max-width: 480px) {
        #${iframeId} {
          width: 100vw;
          height: 100vh;
          border-radius: 0;
          ${finalConfig.position === 'bottom-right' ? 'right: 0;' : 'left: 0;'}
          bottom: 0;
        }

        #${widgetId} {
          ${finalConfig.position === 'bottom-right' ? 'right: 0;' : 'left: 0;'}
          bottom: 0;
        }
      }
    `;
    document.head.appendChild(style);
  };

  // Create widget HTML
  const createWidget = () => {
    const widget = document.createElement('div');
    widget.id = widgetId;
    widget.className = 'kinetiq-chat-widget';

    // Create button
    const button = document.createElement('button');
    button.id = buttonId;
    button.type = 'button';
    button.setAttribute('aria-label', 'Open chat');
    button.innerHTML = `
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2Z"/>
      </svg>
    `;

    // Create iframe
    const iframe = document.createElement('iframe');
    iframe.id = iframeId;
    iframe.src = finalConfig.frontendUrl + '?embedded=true';
    iframe.setAttribute('frameborder', '0');
    iframe.setAttribute('allow', 'microphone');
    iframe.title = 'KinetiQ Chat';

    // Set API URL in iframe URL params if provided
    if (finalConfig.apiUrl && finalConfig.apiUrl !== finalConfig.frontendUrl) {
      iframe.src += '&apiUrl=' + encodeURIComponent(finalConfig.apiUrl);
    }

    // Toggle widget
    button.addEventListener('click', () => {
      widget.classList.toggle('open');
      if (widget.classList.contains('open')) {
        // Focus iframe when opened
        setTimeout(() => {
          iframe.focus();
        }, 100);
      }
    });

    // Close on outside click (optional - can be disabled)
    document.addEventListener('click', (e) => {
      if (widget.classList.contains('open') && 
          !widget.contains(e.target) && 
          !e.target.closest('#' + widgetId)) {
        widget.classList.remove('open');
      }
    });

    widget.appendChild(button);
    widget.appendChild(iframe);
    document.body.appendChild(widget);
  };

  // Initialize when DOM is ready
  const init = () => {
    if (document.body) {
      createStyles();
      createWidget();
    } else {
      document.addEventListener('DOMContentLoaded', init);
    }
  };

  // Auto-initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Export API for manual control
  window.KinetiQChat = {
    open: function() {
      const widget = document.getElementById(widgetId);
      if (widget) widget.classList.add('open');
    },
    close: function() {
      const widget = document.getElementById(widgetId);
      if (widget) widget.classList.remove('open');
    },
    toggle: function() {
      const widget = document.getElementById(widgetId);
      if (widget) widget.classList.toggle('open');
    },
    config: finalConfig
  };
})();

