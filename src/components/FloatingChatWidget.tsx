import { useState } from 'react';
import ChatWidget from './ChatWidget';
import './FloatingChatWidget.css';

interface FloatingChatWidgetProps {
  sessionId: string;
  onSessionUpdate?: (customerId: string) => void;
}

export default function FloatingChatWidget({ sessionId, onSessionUpdate }: FloatingChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {!isOpen && (
        <button
          className="kinetiq-chat-button"
          onClick={() => setIsOpen(true)}
          aria-label="Open chat"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2Z"
              fill="white"
            />
          </svg>
        </button>
      )}

      {isOpen && (
        <div className="kinetiq-chat-container">
          <div className="kinetiq-chat-header-bar">
            <span className="kinetiq-chat-title">KinetiQ Chat</span>
            <button
              className="kinetiq-chat-close"
              onClick={() => setIsOpen(false)}
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

