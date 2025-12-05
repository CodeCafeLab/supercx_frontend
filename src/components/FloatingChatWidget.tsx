import { useState } from 'react';
import ChatWidget from './ChatWidget';
import './FloatingChatWidget.css';

interface FloatingChatWidgetProps {
  sessionId: string;
  onSessionUpdate?: (customerId: string) => void;
}

export default function FloatingChatWidget({ sessionId, onSessionUpdate }: FloatingChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleOpenChat = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setIsOpen(true);
  };

  const handleCloseChat = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setIsOpen(false);
  };

  return (
    <>
      {!isOpen && (
        <div className="kinetiq-popup-bubble" onClick={handleOpenChat}>
          <div className="kinetiq-popup-content">
            <div className="kinetiq-popup-avatar">
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="20" cy="20" r="20" fill="url(#gradient)" />
                <defs>
                  <linearGradient id="gradient" x1="0" y1="0" x2="40" y2="40">
                    <stop offset="0%" stopColor="#4ade80" />
                    <stop offset="50%" stopColor="#22c55e" />
                    <stop offset="100%" stopColor="#f97316" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <div className="kinetiq-popup-text">
              <div className="kinetiq-popup-title">KinetiQ</div>
              <div className="kinetiq-popup-subtitle">Talk to us</div>
            </div>
          </div>
          <button 
            className="kinetiq-popup-button" 
            onClick={handleOpenChat}
            type="button"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2Z" fill="white"/>
            </svg>
            <span>Start a call</span>
          </button>
        </div>
      )}

      {isOpen && (
        <div className="kinetiq-chat-container">
          <div className="kinetiq-chat-header-bar">
            <span className="kinetiq-chat-title">KinetiQ Chat</span>
            <button
              className="kinetiq-chat-close"
              onClick={handleCloseChat}
              aria-label="Close chat"
            >
              ×
            </button>
          </div>
          <div className="kinetiq-chat-content">
            <ChatWidget sessionId={sessionId} onSessionUpdate={onSessionUpdate} />
          </div>
        </div>
      )}
    </>
  );
}

