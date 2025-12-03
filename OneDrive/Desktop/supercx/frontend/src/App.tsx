import { useState, useEffect } from 'react';
import ChatWidget from './components/ChatWidget';
import './App.css';

function App() {
  const [userId, setUserId] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    if (storedUserId) {
      setUserId(storedUserId);
    }
  }, []);

  const handleVerify = async (email: string, dob: string, last4: string) => {
    setIsVerifying(true);
    try {
      const response = await fetch('http://localhost:3001/api/auth/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, dob, last4 }),
      });

      if (response.ok) {
        const data = await response.json();
        setUserId(data.userId);
        localStorage.setItem('userId', data.userId);
      } else {
        alert('Verification failed. Please check your credentials.');
      }
    } catch (error) {
      console.error('Verification error:', error);
      alert('Failed to verify. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  if (!userId) {
    return (
      <div className="app-container">
        <div className="verification-form">
          <h1>SuperCX Banking Chat</h1>
          <p>Please verify your identity to continue</p>
          <VerificationForm onVerify={handleVerify} isVerifying={isVerifying} />
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <ChatWidget userId={userId} />
    </div>
  );
}

function VerificationForm({
  onVerify,
  isVerifying,
}: {
  onVerify: (email: string, dob: string, last4: string) => void;
  isVerifying: boolean;
}) {
  const [email, setEmail] = useState('');
  const [dob, setDob] = useState('');
  const [last4, setLast4] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && dob && last4.length === 4) {
      onVerify(email, dob, last4);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="verify-form">
      <div className="form-group">
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="jane.doe@example.com"
        />
      </div>
      <div className="form-group">
        <label htmlFor="dob">Date of Birth (YYYY-MM-DD)</label>
        <input
          id="dob"
          type="text"
          value={dob}
          onChange={(e) => setDob(e.target.value)}
          required
          placeholder="1990-06-14"
          pattern="\d{4}-\d{2}-\d{2}"
        />
      </div>
      <div className="form-group">
        <label htmlFor="last4">Last 4 digits of Account Number</label>
        <input
          id="last4"
          type="text"
          value={last4}
          onChange={(e) => setLast4(e.target.value.replace(/\D/g, '').slice(0, 4))}
          required
          placeholder="4567"
          maxLength={4}
        />
      </div>
      <button type="submit" disabled={isVerifying} className="verify-button">
        {isVerifying ? 'Verifying...' : 'Verify & Continue'}
      </button>
    </form>
  );
}

export default App;

