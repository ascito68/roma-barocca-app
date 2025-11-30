import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Loader2, Link as LinkIcon, Sparkles } from 'lucide-react';
import { ChatMessage, Itinerary } from '../types';
import { chatWithAi } from '../services/geminiService';

interface ChatWidgetProps {
  itinerary: Itinerary | null;
}

const ChatWidget: React.FC<ChatWidgetProps> = ({ itinerary }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'model',
      text: "Ciao! Sono BerniniBot. Chiedimi qualsiasi cosa sulla Roma Barocca, biglietti o dove trovare il miglior gelato vicino alla tua prossima tappa!",
      timestamp: new Date()
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      role: 'user',
      text: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    const history = messages.slice(-10); 
    const response = await chatWithAi(history, userMsg.text, itinerary || undefined);

    const modelMsg: ChatMessage = {
      role: 'model',
      text: response.text || "Scusa, non sono riuscito a elaborare la richiesta.",
      timestamp: new Date(),
      sources: response.sources
    };

    setMessages(prev => [...prev, modelMsg]);
    setIsLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={`fixed z-[1000] flex flex-col items-end pointer-events-none transition-all duration-300 right-4 bottom-4 md:bottom-8 md:right-8`}>
      
      {/* Chat Window */}
      <div 
        className={`
          pointer-events-auto bg-white w-[90vw] md:w-96 rounded-2xl shadow-2xl border border-zinc-100 overflow-hidden flex flex-col transition-all duration-300 origin-bottom-right mb-4
          ${isOpen ? 'opacity-100 scale-100 h-[60vh] md:h-[500px]' : 'opacity-0 scale-95 h-0 overflow-hidden'}
        `}
      >
        {/* Header */}
        <div className="bg-zinc-900 p-4 flex justify-between items-center text-white">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-serif font-bold shadow-lg">B</div>
            <div>
              <h3 className="font-bold text-sm">BerniniBot</h3>
              <span className="text-[10px] text-zinc-400 flex items-center gap-1"><Sparkles size={8} /> Guida AI</span>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="text-zinc-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 bg-zinc-50 space-y-4">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div 
                className={`
                  max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm
                  ${msg.role === 'user' 
                    ? 'bg-zinc-900 text-white rounded-br-none' 
                    : 'bg-white text-zinc-800 border border-zinc-100 rounded-bl-none'}
                `}
              >
                <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                {msg.sources && msg.sources.length > 0 && (
                   <div className="mt-3 pt-2 border-t border-dashed border-zinc-200/50">
                     <p className="text-[10px] font-bold opacity-70 mb-1 uppercase tracking-wider">Fonti:</p>
                     <ul className="space-y-1">
                       {msg.sources.map((s, i) => (
                         <li key={i}>
                           <a href={s.uri} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[10px] text-orange-600 hover:underline">
                             <LinkIcon size={8} /> {s.title}
                           </a>
                         </li>
                       ))}
                     </ul>
                   </div>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white rounded-2xl px-4 py-3 shadow-sm border border-zinc-100 rounded-bl-none flex items-center gap-2">
                <Loader2 className="animate-spin text-orange-500" size={14} />
                <span className="text-xs text-zinc-400">Sta scrivendo...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-3 bg-white border-t border-zinc-100 flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Chiedi info..."
            className="flex-1 bg-zinc-50 border-transparent rounded-full px-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-zinc-900 focus:outline-none transition-all placeholder:text-zinc-400"
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="p-3 bg-zinc-900 text-white rounded-full hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg"
          >
            <Send size={16} />
          </button>
        </div>
      </div>

      {/* Toggle Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="pointer-events-auto w-14 h-14 bg-zinc-900 hover:bg-zinc-800 text-white rounded-full shadow-2xl shadow-zinc-900/40 flex items-center justify-center transition-transform hover:scale-105 active:scale-95 border-2 border-white/20"
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
      </button>
    </div>
  );
};

export default ChatWidget;