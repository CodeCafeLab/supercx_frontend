import { useState, useEffect } from 'react';
import ChatWidget from './components/ChatWidget';
import FloatingChatWidget from './components/FloatingChatWidget';
import './App.css';

function App() {
  // Check if we're in embedded mode (via script tag or URL parameter)
  const isEmbedded = window.location.search.includes('embedded=true') || 
                     (window as any).kinetiqChatConfig?.embedded;

  // Get API URL from URL params or config (for embedded mode)
  const urlParams = new URLSearchParams(window.location.search);
  const apiUrlFromParam = urlParams.get('apiUrl');
  if (apiUrlFromParam && isEmbedded) {
    // Set API URL in environment for embedded mode
    if (!import.meta.env.VITE_API_URL) {
      (window as any).__KINETIQ_API_URL__ = apiUrlFromParam;
    }
  }

  // Generate or retrieve session ID
  const [sessionId, setSessionId] = useState<string>(() => {
    const stored = localStorage.getItem('kinetiq_session_id');
    if (stored) return stored;
    const newId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('kinetiq_session_id', newId);
    return newId;
  });

  useEffect(() => {
    // Store session ID
    localStorage.setItem('kinetiq_session_id', sessionId);
  }, [sessionId]);

  // Update session ID if verification happens (handled by ChatWidget)
  const handleSessionUpdate = (newCustomerId: string) => {
    if (newCustomerId && !newCustomerId.startsWith('guest_')) {
      setSessionId(newCustomerId);
      localStorage.setItem('kinetiq_session_id', newCustomerId);
    }
  };

  if (isEmbedded) {
    // Embedded mode - show floating widget
    return <FloatingChatWidget sessionId={sessionId} onSessionUpdate={handleSessionUpdate} />;
  }

  // Full page mode
  return (
    <div className="app-container">
      <ChatWidget sessionId={sessionId} onSessionUpdate={handleSessionUpdate} />
    </div>
  );
}

export default App;

