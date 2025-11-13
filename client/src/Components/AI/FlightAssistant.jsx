import React, { useEffect, useMemo, useRef, useState } from "react";
import http from "../../api/http";

const FlightAssistant = ({ context }) => {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hi! I can help you find flights, compare prices, and answer questions about your search. What are you looking for?" },
  ]);
  const scrollRef = useRef(null);

  const trimmedContext = useMemo(() => {
    try {
      const { search, filteredFlights } = context || {};
      const sample = (filteredFlights || []).slice(0, 5).map(f => ({
        airline: f.airline, from: f.from, to: f.to, price: f.price, departure: f.departure, arrival: f.arrival
      }));
      return {
        search: search || {},
        sampleFlights: sample,
        totalMatches: (filteredFlights || []).length,
      };
    } catch {
      return {};
    }
  }, [context]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, open]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;
    const next = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await http.post("/ai/chat", {
        messages: next.map(m => ({ role: m.role, content: m.content })),
        context: trimmedContext,
        topic: "flights",
      });
      const reply = res?.data?.reply || "Sorry, I couldn't fetch a response right now.";
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (err) {
      setMessages((prev) => [...prev, { role: "assistant", content: "I couldn't reach the AI service. Please try again later or ask a different question." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div>
      {/* Floating button */}
      <button
        type="button"
        onClick={() => setOpen((s) => !s)}
        className="fixed bottom-5 right-5 z-50 rounded-full h-12 w-12 bg-blue-700 hover:bg-blue-800 text-white shadow-lg"
        title="Flight Assistant"
      >
        ✈️
      </button>

      {/* Panel */}
      {open && (
        <div className="fixed bottom-20 right-5 z-50 w-[360px] max-w-[92vw] bg-white rounded-2xl shadow-2xl border border-blue-100 flex flex-col overflow-hidden">
          <div className="px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-800 text-white flex items-center justify-between">
            <div className="font-semibold">Flight Assistant</div>
            <button onClick={() => setOpen(false)} className="text-white/90 hover:text-white">✕</button>
          </div>
          <div ref={scrollRef} className="p-3 h-80 overflow-y-auto space-y-2 bg-slate-50">
            {messages.map((m, i) => (
              <div key={i} className={`${m.role === 'user' ? 'justify-end' : 'justify-start'} flex`}>
                <div className={`${m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white text-slate-900 border'} max-w-[80%] px-3 py-2 rounded-xl shadow-sm`}>{m.content}</div>
              </div>
            ))}
            {loading && (
              <div className="text-xs text-slate-500">Thinking…</div>
            )}
          </div>
          <div className="p-3 border-t bg-white">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              rows={2}
              placeholder="Ask about flights, prices, timing…"
              className="w-full border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            <div className="mt-2 flex items-center justify-between">
              <div className="text-[11px] text-slate-500">Context-aware: includes your current filters and matches</div>
              <button
                type="button"
                onClick={sendMessage}
                disabled={loading}
                className="px-3 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-sm disabled:opacity-60"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FlightAssistant;










