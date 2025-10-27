import { useEffect, useState, useRef } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import axios from "axios";
import "./App.css";
import Transcripts from "./pages/Transcripts";

interface AgentResponse {
  session_id: string;
  message: string;
  audio_url: string;
  state: string;
  suggestions?: string[];
}

function App() {
  const [sessionId, setSessionId] = useState<string>("");
  const [messages, setMessages] = useState<{ role: string; text: string }[]>([]);
  const [input, setInput] = useState<string>("");
  const [listening, setListening] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const apiBase = import.meta.env.VITE_API_BASE_URL;

  // 🎬 Initialize new session on load
  useEffect(() => {
    const createSession = async () => {
      const res = await axios.post<AgentResponse>(`${apiBase}/api/session/create`, {});
      setSessionId(res.data.session_id);
      setMessages([{ role: "assistant", text: res.data.message }]);
      playAudio(res.data.audio_url);
    };
    createSession();
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 🔊 Play audio from backend
  const playAudio = (url: string) => {
    const audio = new Audio(`${apiBase}${url}`);
    audio.play();
  };

  // 🧠 Send message to backend
  const sendMessage = async (msg: string) => {
    if (!msg.trim() || !sessionId) return;
    setMessages((prev) => [...prev, { role: "user", text: msg }]);
    setInput("");

    const res = await axios.post<AgentResponse>(`${apiBase}/api/chat`, {
      session_id: sessionId,
      message: msg,
    });

    setMessages((prev) => [...prev, { role: "assistant", text: res.data.message }]);
    playAudio(res.data.audio_url);
  };

  // 🎤 Voice input (Speech-to-Text)
  const startListening = () => {
    if (!("webkitSpeechRecognition" in window)) {
      alert("Speech recognition not supported in this browser.");
      return;
    }
    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      sendMessage(transcript);
    };

    recognition.start();
    recognitionRef.current = recognition;
  };

  return (
    <>
      {/* Navigation Link to Transcripts */}
      <Link to="/transcripts" className="transcripts-link">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
        </svg>
        View Transcripts
      </Link>

      {/* Chatbot Toggle Button */}
      <button
        className="chatbot-toggle"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle chatbot"
      >
        {isOpen ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
        )}
      </button>

      {/* Chatbot Window */}
      <div className={`chatbot-container ${isOpen ? 'chatbot-open' : ''}`}>
        <div className="chatbot-header">
          <div className="chatbot-header-content">
            <div className="chatbot-avatar">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            </div>
            <div>
              <h2 className="chatbot-title">Employment Verification</h2>
              <p className="chatbot-status">
                <span className="status-indicator"></span>
                Online
              </p>
            </div>
          </div>
          <button
            className="chatbot-close-btn"
            onClick={() => setIsOpen(false)}
            aria-label="Close chatbot"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="chatbot-messages">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`message ${m.role === "user" ? "message-user" : "message-bot"}`}
            >
              <div className="message-bubble">
                {m.text}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="chatbot-input-container">
          <input
            className="chatbot-input"
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
          />
          <button
            className="chatbot-send-btn"
            onClick={() => sendMessage(input)}
            aria-label="Send message"
            title="Send"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
            <span className="button-label">Send</span>
          </button>
          <button
            className={`chatbot-mic-btn ${listening ? "listening" : ""}`}
            onClick={startListening}
            aria-label="Voice input"
            title={listening ? "Listening..." : "Voice input"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
              <line x1="12" y1="19" x2="12" y2="23"></line>
              <line x1="8" y1="23" x2="16" y2="23"></line>
            </svg>
            <span className="button-label">{listening ? "Listening" : "Voice"}</span>
          </button>
        </div>
      </div>
    </>
  );
}

export default App;

export function Main() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/transcripts" element={<Transcripts />} />
      </Routes>
    </Router>
  );
}
