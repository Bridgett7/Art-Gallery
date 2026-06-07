import React, { useState, useRef, useEffect } from 'react';
import { Button, Input, Typography, Space, Tag, Spin } from 'antd';
import { MessageOutlined, CloseOutlined, SendOutlined, RobotOutlined, ClearOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/axios';

const { Text } = Typography;

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'bot';
  suggestions?: string[];
  timestamp: string;
}

// Map suggestions to navigation routes
const NAVIGATION_MAP: Record<string, string> = {
  "🎨 Artworks": "/artworks",
  "🎨 Voir la galerie": "/artworks",
  "🎨 Mes artworks": "/artworks",
  "🎨 Mes œuvres": "/artworks",
  "🎨 Créer un artwork": "/artworks",
  "🎫 Événements": "/events",
  "🎫 Événements à venir": "/events",
  "🎫 Acheter un ticket": "/events",
  "🎫 Mes tickets": "/events",
  "🎫 Ventes tickets": "/events",
  "🛒 Marketplace": "/marketplace",
  "🛒 Produits disponibles": "/marketplace",
  "🛒 Ajouter au panier": "/marketplace",
  "📦 Commandes": "/orders",
  "📦 Mes commandes": "/orders",
  "📦 Commandes en attente": "/orders",
  "📦 Voir détails": "/orders",
  "📚 Cours": "/courses",
  "📚 Tous les cours": "/courses",
  "📚 Cours débutant": "/courses",
  "📚 Créer un cours": "/courses",
  "📅 Planning": "/planning",
  "📅 Mon planning": "/planning",
  "👤 Mon profil": "/profile",
  "📊 Stats": "/",
  "📊 Chiffre d'affaires": "/",
  "📊 Détails": "/",
  "👥 Utilisateurs": "/users",
  "📬 Voir notifications": "/notifications",
};

const STORAGE_KEY_PREFIX = "metamuse_chat_";

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const { user } = useAuth();

  const storageKey = `${STORAGE_KEY_PREFIX}${user?.userId || 'guest'}`;

  const [messages, setMessages] = useState<Message[]>(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try { return JSON.parse(stored); } catch { /* ignore */ }
    }
    return [];
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const msgIdRef = useRef(Date.now());

  // Reset chat when user changes
  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try { setMessages(JSON.parse(stored)); } catch { setMessages([]); }
    } else {
      setMessages([]);
    }
  }, [user?.userId]);

  // Show welcome message on first open
  useEffect(() => {
    if (open && messages.length === 0) {
      const welcome: Message = {
        id: msgIdRef.current++,
        text: `Bonjour${user?.username ? ' ' + user.username : ''} ! 👋 Je suis l'assistant MetaMuse. Comment puis-je vous aider ?`,
        sender: 'bot',
        suggestions: getDefaultSuggestions(),
        timestamp: new Date().toISOString(),
      };
      setMessages([welcome]);
    }
  }, [open]);

  // Persist messages
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(storageKey, JSON.stringify(messages.slice(-50)));
    }
  }, [messages]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  function getDefaultSuggestions(): string[] {
    if (user?.role === 'ADMIN') return ["📊 Chiffre d'affaires", "📦 Commandes en attente", "👥 Utilisateurs", "🎫 Événements"];
    if (user?.role === 'ARTIST') return ["🎨 Mes œuvres", "📅 Mon planning", "📦 Mes commandes", "🎫 Événements"];
    return ["🛒 Produits disponibles", "🎫 Événements à venir", "📦 Mes commandes", "❓ Aide"];
  }

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = { id: msgIdRef.current++, text, sender: 'user', timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.post('/chat', { message: text, lang: i18n.language });
      const data = res.data;
      const botMsg: Message = {
        id: msgIdRef.current++,
        text: data.reply || "Je n'ai pas compris.",
        sender: 'bot',
        suggestions: data.suggestions || [],
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, botMsg]);
    } catch {
      setMessages(prev => [...prev, {
        id: msgIdRef.current++,
        text: "Désolé, une erreur est survenue. Vérifiez que le service chatbot est lancé.",
        sender: 'bot',
        timestamp: new Date().toISOString(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    // Check if suggestion maps to a navigation route
    const route = NAVIGATION_MAP[suggestion];
    if (route) {
      navigate(route);
      setOpen(false);
      return;
    }
    // Otherwise send as message
    sendMessage(suggestion);
  };

  const clearChat = () => {
    localStorage.removeItem(storageKey);
    const welcome: Message = {
      id: msgIdRef.current++,
      text: `Chat réinitialisé. Comment puis-je vous aider ?`,
      sender: 'bot',
      suggestions: getDefaultSuggestions(),
      timestamp: new Date().toISOString(),
    };
    setMessages([welcome]);
  };

  // Floating button
  if (!open) {
    return (
      <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1000 }}>
        <Button
          type="primary"
          shape="circle"
          size="large"
          icon={<MessageOutlined />}
          onClick={() => setOpen(true)}
          style={{
            width: 56, height: 56, fontSize: 24,
            background: '#2B3A67', borderColor: '#2B3A67',
            boxShadow: '0 4px 12px rgba(43,58,103,0.4)',
          }}
        />
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 1000,
      width: 380, height: 520,
      borderRadius: 16, overflow: 'hidden',
      boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
      display: 'flex', flexDirection: 'column',
      background: '#fff',
    }}>
      {/* Header */}
      <div style={{
        background: '#2B3A67', padding: '12px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <Space>
          <RobotOutlined style={{ color: '#fff', fontSize: 18 }} />
          <Text strong style={{ color: '#fff', fontSize: 14 }}>MetaMuse Assistant</Text>
        </Space>
        <Space size={4}>
          <Button type="text" icon={<ClearOutlined />} onClick={clearChat}
            style={{ color: 'rgba(255,255,255,0.7)' }} size="small" title="Clear chat" />
          <Button type="text" icon={<CloseOutlined />} onClick={() => setOpen(false)}
            style={{ color: '#fff' }} size="small" />
        </Space>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '12px 16px',
        background: '#F8F9FA',
      }}>
        {messages.map(msg => (
          <div key={msg.id} style={{
            display: 'flex',
            justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start',
            marginBottom: 10,
          }}>
            <div style={{
              maxWidth: '80%',
              padding: '10px 14px',
              borderRadius: msg.sender === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
              background: msg.sender === 'user' ? '#2B3A67' : '#fff',
              color: msg.sender === 'user' ? '#fff' : '#333',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              fontSize: 13,
              lineHeight: 1.5,
              whiteSpace: 'pre-wrap',
            }}>
              {msg.text}
              {msg.suggestions && msg.suggestions.length > 0 && (
                <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {msg.suggestions.map((s, i) => (
                    <Tag key={i} color="blue" style={{ cursor: 'pointer', fontSize: 11, margin: 0 }}
                      onClick={() => handleSuggestionClick(s)}>
                      {s}
                    </Tag>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 10 }}>
            <div style={{
              padding: '12px 18px', borderRadius: 16, background: '#fff',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            }}>
              <Space size={4}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#2B3A67', animation: 'pulse 1s infinite' }} />
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#2B3A67', animation: 'pulse 1s infinite 0.2s' }} />
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#2B3A67', animation: 'pulse 1s infinite 0.4s' }} />
              </Space>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: '10px 12px', borderTop: '1px solid #eee',
        display: 'flex', gap: 8, background: '#fff',
      }}>
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onPressEnter={() => sendMessage(input)}
          placeholder="Posez votre question..."
          disabled={loading}
          style={{ borderRadius: 20 }}
        />
        <Button
          type="primary"
          icon={<SendOutlined />}
          onClick={() => sendMessage(input)}
          disabled={loading || !input.trim()}
          style={{ borderRadius: 20, background: '#2B3A67', borderColor: '#2B3A67' }}
        />
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
}
