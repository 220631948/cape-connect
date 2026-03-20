/**
 * @file src/components/copilot/CopilotPanel.tsx
 * @description GIS Copilot Phase 1 — Natural Language Spatial Query Panel.
 * A floating side-panel chat interface for the map.
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';

interface CopilotMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  data?: any;
  tool?: string;
  error?: string;
  timestamp: Date;
}

export interface CopilotPanelProps {
  isOpen: boolean;
  onClose: () => void;
  mapCenter?: { lng: number; lat: number };
}

const EXAMPLE_QUERIES = [
  "What's within 500m of City Hall?",
  "How many properties in Woodstock?",
  "Find ERF 12345",
  "Distance from Green Point to Bellville?",
  "Properties in De Waterkant",
];

function formatDataResult(tool: string, data: any): string {
  if (!data) return '';
  if (Array.isArray(data)) {
    if (data.length === 0) return 'No results found.';
    return `Showing ${data.length} result${data.length !== 1 ? 's' : ''}.`;
  }
  if (tool === 'count') return `Count: ${data.property_count ?? 0}`;
  if (tool === 'distance') return `Distance: ${(data.distance_km ?? 0).toFixed(2)} km (${Math.round(data.distance_m ?? 0)} m)`;
  if (tool === 'details' && data.address) return `Address: ${data.address}`;
  return '';
}

export const CopilotPanel: React.FC<CopilotPanelProps> = ({ isOpen, onClose, mapCenter }) => {
  const [messages, setMessages] = useState<CopilotMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendQuery = async (query: string) => {
    if (!query.trim() || loading) return;

    const userMsg: CopilotMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      text: query,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/copilot/spatial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, context: mapCenter })
      });

      const result = await res.json();

      const assistantMsg: CopilotMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        text: result.explanation || result.error || 'No results.',
        data: result.data,
        tool: result.tool,
        error: result.error,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch {
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'assistant',
        text: 'Connection error — GIS Copilot is unreachable.',
        timestamp: new Date()
      }]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="absolute top-2 right-2 z-50 flex flex-col"
      style={{
        width: '320px',
        height: 'calc(100% - 16px)',
        background: 'rgba(10, 10, 20, 0.82)',
        border: '1px solid rgba(99, 179, 237, 0.25)',
        borderRadius: '12px',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-blue-500/20 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-lg">🧭</span>
          <div>
            <div className="text-sm font-bold text-white">GIS Copilot</div>
            <div className="text-[10px] text-blue-300/70">Natural Language Spatial Query</div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-white/60 hover:text-white transition-colors text-lg leading-none"
          aria-label="Close Copilot"
        >
          ×
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 min-h-0">
        {messages.length === 0 && (
          <div className="space-y-2">
            <p className="text-xs text-gray-400 text-center">Try a spatial query:</p>
            {EXAMPLE_QUERIES.map((q) => (
              <button
                key={q}
                onClick={() => sendQuery(q)}
                className="w-full text-left text-xs px-3 py-2 rounded-lg bg-blue-900/30 hover:bg-blue-800/50 text-blue-200 border border-blue-500/20 transition-all"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[90%] px-3 py-2 rounded-xl text-xs leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-none'
                  : msg.error
                  ? 'bg-red-900/50 text-red-200 border border-red-500/30 rounded-bl-none'
                  : 'bg-gray-800/80 text-gray-100 border border-gray-700/50 rounded-bl-none'
              }`}
            >
              {msg.role === 'assistant' && msg.tool && msg.tool !== 'unknown' && (
                <div className="text-[10px] text-blue-400/70 mb-1 font-mono uppercase">
                  ⚙ tool: {msg.tool}
                </div>
              )}
              <div>{msg.text}</div>
              {msg.data && !msg.error && (
                <div className="mt-1 text-[10px] text-gray-400">
                  {formatDataResult(msg.tool ?? '', msg.data)}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-800/80 border border-gray-700/50 px-3 py-2 rounded-xl rounded-bl-none">
              <div className="flex gap-1">
                {[0,1,2].map(i => (
                  <div key={i} className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 px-3 pb-3 pt-2 border-t border-blue-500/20">
        <form
          onSubmit={(e) => { e.preventDefault(); sendQuery(input); }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a spatial question…"
            disabled={loading}
            className="flex-1 bg-gray-900/80 border border-gray-700 text-white text-xs rounded-lg px-3 py-2 placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs font-bold px-3 py-2 rounded-lg transition-all"
          >
            ↵
          </button>
        </form>
        <div className="text-[9px] text-gray-600 mt-1 text-center">
          GIS Copilot Phase 1 · PostGIS · Western Cape bounded
        </div>
      </div>
    </div>
  );
};

export default CopilotPanel;
