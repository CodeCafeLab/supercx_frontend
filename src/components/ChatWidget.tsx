import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import './ChatWidget.css';

interface Message {
  id: string;
  text: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

interface ChatWidgetProps {
  sessionId: string;
  onSessionUpdate?: (customerId: string) => void;
}

// Get API URL from environment, window config, or default
const getApiUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if ((window as any).__KINETIQ_API_URL__) {
    return (window as any).__KINETIQ_API_URL__;
  }
  if ((window as any).kinetiqChatConfig?.apiUrl) {
    return (window as any).kinetiqChatConfig.apiUrl;
  }
  return 'http://localhost:3001';
};

const API_URL = getApiUrl();

export default function ChatWidget({ sessionId, onSessionUpdate }: ChatWidgetProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState(sessionId);
  const [hasGreeted, setHasGreeted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCurrentSessionId(sessionId);
  }, [sessionId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Automatically send initial greeting request to backend
  useEffect(() => {
    if (!hasGreeted && messages.length === 0) {
      setHasGreeted(true);
      // Automatically trigger AI greeting by sending an initial message
      // The backend will check chat history and either continue conversation or generate greeting
      // This ensures the AI generates the greeting dynamically and asks for name
      const triggerGreeting = async () => {
        setIsLoading(true);
        try {
          // Send a greeting trigger - backend will handle if there's existing history
          // Using a special greeting message that the backend can recognize
          const response = await axios.post(
            `${API_URL}/api/chat/message`,
            {
              message: 'hello',
              channel: 'web',
            },
            {
              headers: {
                'X-Customer-Id': currentSessionId,
              },
            }
          );

          // Update session ID if verification happened
          if (response.data.customerId && response.data.customerId !== currentSessionId) {
            setCurrentSessionId(response.data.customerId);
            if (onSessionUpdate) {
              onSessionUpdate(response.data.customerId);
            }
          }

          // The backend automatically loads chat history, so if there's existing conversation,
          // the response will continue it. If it's a new session, it will be a greeting asking for name.
          const greetingMessage: Message = {
            id: 'greeting',
            text: response.data.response,
            role: 'assistant',
            timestamp: new Date(),
          };

          setMessages([greetingMessage]);
        } catch (error) {
          console.error('Error getting greeting:', error);
          // Fallback greeting if API fails
          const fallbackGreeting: Message = {
            id: 'greeting',
            text: 'Hi! I\'m KinetiQ from Secure Bank. It\'s great to meet you! May I have your name, please?',
            role: 'assistant',
            timestamp: new Date(),
          };
          setMessages([fallbackGreeting]);
        } finally {
          setIsLoading(false);
        }
      };

      triggerGreeting();
    }
  }, [hasGreeted, currentSessionId, onSessionUpdate]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input.trim(),
      role: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await axios.post(
        `${API_URL}/api/chat/message`,
        {
          message: userMessage.text,
          channel: 'web',
        },
        {
          headers: {
            'X-Customer-Id': currentSessionId,
          },
        }
      );

      // Update session ID if verification happened (customerId changed)
      if (response.data.customerId && response.data.customerId !== currentSessionId) {
        setCurrentSessionId(response.data.customerId);
        if (onSessionUpdate) {
          onSessionUpdate(response.data.customerId);
        }
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response.data.response,
        role: 'assistant',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Sorry, I encountered an error. Please try again.',
        role: 'assistant',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="chat-widget">
      <div className="chat-header">
        <h2>KinetiQ from Secure Bank</h2>
        <div className="status-indicator">
          <span className="status-dot"></span>
          <span>Online</span>
        </div>
      </div>

      <div className="chat-messages">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`message ${message.role === 'user' ? 'user-message' : 'assistant-message'}`}
          >
            <div className="message-content">{message.text}</div>
            <div className="message-timestamp">
              {message.timestamp.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="message assistant-message">
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-container">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your message..."
          disabled={isLoading}
          className="chat-input"
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim() || isLoading}
          className="send-button"
        >
          Send
        </button>
      </div>
    </div>
  );
}

