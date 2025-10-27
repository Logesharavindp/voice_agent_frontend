import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import "./Transcripts.css";

interface TranscriptSummary {
  session_id: string;
  timestamp: string;
  verified?: boolean;
  user_name?: string;
  filename: string;
}

interface ConversationEntry {
  role: string;
  content: string;
}

interface FullTranscript {
  session_id: string;
  user_data?: {
    name?: string;
    first_name?: string;
    years_of_experience?: string;
    date_of_birth?: string;
    email?: string;
    employment_record?: string | null;
  };
  verified?: boolean;
  state?: string;
  timestamp: string;
  conversation_history: ConversationEntry[];
}

export default function Transcripts() {
  const [transcripts, setTranscripts] = useState<TranscriptSummary[]>([]);
  const [selected, setSelected] = useState<FullTranscript | null>(null);
  const [loading, setLoading] = useState(false);
  const apiBase = import.meta.env.VITE_API_BASE_URL;

  // 🧾 Load all transcripts
  useEffect(() => {
    const fetchTranscripts = async () => {
      try {
        const res = await axios.get(`${apiBase}/api/transcripts`);
        setTranscripts(res.data.transcripts || []);
      } catch (err) {
        console.error("Failed to load transcripts", err);
      }
    };
    fetchTranscripts();
  }, []);

  // 📄 Load a single transcript
  const openTranscript = async (sessionId: string) => {
    setLoading(true);
    try {
      const res = await axios.get(`${apiBase}/api/transcript/${sessionId}`);
      setSelected(res.data);
    } catch (err) {
      alert("Failed to load transcript");
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <div className="transcripts-page">
      <header className="transcripts-header">
        <h1>Saved Transcripts</h1>
        <Link to="/" className="back-link">← Back to Chat</Link>
      </header>

      <div className="transcripts-container">
        <aside className="transcript-list">
          {transcripts.length === 0 ? (
            <p className="empty">No transcripts found.</p>
          ) : (
            transcripts.map((t) => (
              <div
                key={t.session_id}
                className={`transcript-item ${selected?.session_id === t.session_id ? "active" : ""}`}
                onClick={() => openTranscript(t.session_id)}
              >
                <h3>{t.user_name || "Unknown User"}</h3>
                <p className="timestamp">{new Date(t.timestamp).toLocaleString()}</p>
                {t.verified !== undefined && (
                  <span className={`verified-tag ${t.verified ? "yes" : "no"}`}>
                    {t.verified ? "✅ Verified" : "❌ Unverified"}
                  </span>
                )}
              </div>
            ))
          )}
        </aside>

        <main className="transcript-viewer">
          {loading ? (
            <p>Loading transcript...</p>
          ) : selected ? (
            <>
              <h2>
                Transcript — {selected.user_data?.name || selected.session_id}
              </h2>
              <p className="meta-info">
                <strong>Status:</strong> {selected.state || "Unknown"} |{" "}
                <strong>Verified:</strong>{" "}
                {selected.verified ? "Yes ✅" : "No ❌"}
              </p>
              <div className="transcript-messages">
                {selected.conversation_history?.map((entry, i) => (
                  <div
                    key={i}
                    className={`message-line ${entry.role === "user" ? "user" : "assistant"}`}
                  >
                    <strong>
                      {entry.role === "user" ? "User" : "Agent"}:
                    </strong>{" "}
                    {entry.content}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p>Select a transcript to view.</p>
          )}
        </main>
      </div>
    </div>
  );
}
