import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Check if embedded mode
const isEmbedded = window.location.search.includes('embedded=true') || 
                   (window as any).kinetiqChatConfig?.embedded;

const rootElement = document.getElementById('root') || document.getElementById('kinetiq-chat-root');

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else {
  console.error('Root element not found');
}

