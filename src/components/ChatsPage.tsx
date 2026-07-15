import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, Send, User as UserIcon, RefreshCw, 
  MessageCircle, Sparkles, MapPin, Search, AlertCircle 
} from 'lucide-react';
import { Chat, User, Message } from '../types';

interface UIChat {
  id: string;
  recipientId: string;
  recipientName: string;
  recipientImage: string;
  recipientPhone: string;
  lastMessage: string;
  updatedAt: string;
}

interface ChatsPageProps {
  currentUser: User | null;
  onNavigate: (view: string, targetId?: string) => void;
  activeRecipientId?: string;
}

export default function ChatsPage({
  currentUser,
  onNavigate,
  activeRecipientId
}: ChatsPageProps) {
  const [chats, setChats] = useState<UIChat[]>([]);
  const [activeChat, setActiveChat] = useState<UIChat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [msgLoading, setMsgLoading] = useState(false);
  
  // Gemini AI Smart Autoreply state
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch all user chats
  const fetchChats = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const res = await fetch('/api/chats', {
        headers: { 'Authorization': `Bearer ${currentUser.id}` }
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        // Map backend Chat structure (user1, user2) to UIChat
        const mappedChats: UIChat[] = data.map((c: Chat) => {
          const isUser1Me = c.user1Id === currentUser.id;
          return {
            id: c.id,
            recipientId: isUser1Me ? c.user2Id : c.user1Id,
            recipientName: isUser1Me ? c.user2Name : c.user1Name,
            recipientImage: (isUser1Me ? c.user2Image : c.user1Image) || '',
            recipientPhone: '', // Will be updated if we make call, or set to placeholder
            lastMessage: c.lastMessage,
            updatedAt: c.updatedAt
          };
        });

        setChats(mappedChats);
        
        // If we came from another page with a specific recipient, try opening/creating the chat
        if (activeRecipientId) {
          const existing = mappedChats.find(c => c.recipientId === activeRecipientId);
          if (existing) {
            setActiveChat(existing);
          } else {
            // Fetch recipient details to construct a temporary chat
            const rRes = await fetch(`/api/auth/me`, {
              headers: { 'Authorization': `Bearer ${activeRecipientId}` }
            });
            const rData = await rRes.json();
            if (rRes.ok) {
              const tempChat: UIChat = {
                id: `chat-temp-${activeRecipientId}`,
                recipientId: activeRecipientId,
                recipientName: rData.name,
                recipientImage: rData.profileImage || '',
                recipientPhone: rData.phone || rData.email || '',
                lastMessage: '',
                updatedAt: new Date().toISOString()
              };
              setChats(prev => [tempChat, ...prev]);
              setActiveChat(tempChat);
            }
          }
        } else if (mappedChats.length > 0) {
          setActiveChat(mappedChats[0]);
        }
      }
      setLoading(false);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChats();
  }, [currentUser, activeRecipientId]);

  // Fetch messages when activeChat changes
  useEffect(() => {
    if (!currentUser || !activeChat) return;
    
    setMsgLoading(true);
    setAiSuggestion('');
    
    // If it's a temporary chat, we don't have stored messages yet
    if (activeChat.id.startsWith('chat-temp-')) {
      setMessages([]);
      setMsgLoading(false);
      return;
    }

    fetch(`/api/chats/${activeChat.id}/messages`, {
      headers: { 'Authorization': `Bearer ${currentUser.id}` }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setMessages(data);
        }
        setMsgLoading(false);
      })
      .catch(err => {
        console.error(err);
        setMsgLoading(false);
      });
  }, [activeChat, currentUser]);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !currentUser || !activeChat) return;

    const textToSend = inputText;
    setInputText('');

    try {
      const res = await fetch('/api/chats/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser.id}`
        },
        body: JSON.stringify({
          recipientId: activeChat.recipientId,
          text: textToSend
        })
      });
      const data = await res.json();
      if (res.ok) {
        // If it was a temporary chat, reload the entire chat tree to get official Chat ID
        if (activeChat.id.startsWith('chat-temp-')) {
          await fetchChats();
        } else {
          setMessages(prev => [...prev, data]);
          setChats(prev => prev.map(c => c.id === activeChat.id ? { ...c, lastMessage: textToSend, updatedAt: new Date().toISOString() } : c));
        }
        setAiSuggestion('');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Gemini Smart Reply Assistant
  const handleGenerateAutoreply = async () => {
    if (!activeChat || messages.length === 0) return;
    setAiLoading(true);
    setAiSuggestion('');
    
    // Get last few messages to pass as context
    const recentMsgs = messages.slice(-5).map(m => `${m.senderId === currentUser?.id ? 'أنا' : 'هو'}: ${m.text}`).join('\n');

    try {
      const res = await fetch('/api/gemini/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `أنا بائع أو مشتري في سوق الجمعة العراق. هذه المحادثة الجارية بيننا بالعامية العراقية:\n${recentMsgs}\n\nيرجى اقتراح رد واحد فقط قصير بالعامية العراقية اللطيفة لكي أرسله له للتواصل، بدون أي مقدمات أو شرح.`,
          chatHistory: []
        })
      });
      const data = await res.json();
      if (res.ok && data.text) {
        setAiSuggestion(data.text);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAiLoading(false);
    }
  };

  const handleApplyAiSuggestion = () => {
    if (aiSuggestion) {
      setInputText(aiSuggestion);
      setAiSuggestion('');
    }
  };

  if (!currentUser) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-slate-400 mx-auto" />
        <h3 className="font-bold text-slate-800 dark:text-white">سجل دخولك عيني أولاً</h3>
        <p className="text-slate-500 text-xs">لتتمكن من مراقبة والتواصل مع البائعين بخصوص المشتريات.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
      
      <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-900 shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-12 h-[550px] sm:h-[600px]">
        
        {/* RIGHT PANEL: Chat Rooms Lists */}
        <div className="md:col-span-4 border-l border-slate-100 dark:border-slate-900 flex flex-col h-full bg-slate-50/50 dark:bg-slate-950/20">
          <div className="p-4 border-b border-slate-100 dark:border-slate-900 bg-white dark:bg-slate-950">
            <h3 className="font-extrabold text-xs sm:text-sm text-slate-800 dark:text-white flex items-center gap-1.5">
              <MessageSquare className="w-5 h-5 text-orange-600" />
              <span>محادثاتي ورسائلي الجارية</span>
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-900/40">
            {loading ? (
              <div className="py-12 text-center">
                <RefreshCw className="w-6 h-6 animate-spin text-orange-600 mx-auto" />
              </div>
            ) : chats.length === 0 ? (
              <p className="text-[11px] text-slate-400 text-center py-16">لا توجد محادثات نشطة لك حالياً عيني.</p>
            ) : (
              chats.map(c => (
                <div
                  key={c.id}
                  onClick={() => setActiveChat(c)}
                  className={`p-4 flex items-center gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors ${activeChat?.id === c.id ? 'bg-orange-50/40 dark:bg-orange-950/10 border-r-4 border-orange-600' : ''}`}
                >
                  <img 
                    src={c.recipientImage || 'https://api.dicebear.com/7.x/initials/svg?seed=User'} 
                    alt={c.recipientName} 
                    className="w-10 h-10 rounded-lg object-cover"
                  />
                  <div className="flex-1 min-w-0 text-xs text-right">
                    <h4 className="font-bold text-slate-800 dark:text-white truncate">{c.recipientName}</h4>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">{c.lastMessage || 'لا توجد رسائل بعد...'}</p>
                  </div>
                  <span className="text-[8px] text-slate-400 font-mono shrink-0">
                    {new Date(c.updatedAt).toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* LEFT PANEL: Active Chat Messenger Box */}
        <div className="md:col-span-8 flex flex-col h-full bg-white dark:bg-slate-950 relative">
          {activeChat ? (
            <>
              {/* Active Chat Header */}
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/30">
                <div className="flex items-center gap-3">
                  <img 
                    src={activeChat.recipientImage || 'https://api.dicebear.com/7.x/initials/svg?seed=User'} 
                    alt={activeChat.recipientName} 
                    className="w-9 h-9 rounded-lg object-cover"
                  />
                  <div>
                    <h4 className="font-bold text-xs text-slate-800 dark:text-white">{activeChat.recipientName}</h4>
                    <p className="text-[9px] text-slate-400">
                      {activeChat.recipientPhone.includes('@') ? 'البريد الإلكتروني:' : 'هاتف البائع:'} <span className="font-mono font-bold text-orange-600">{activeChat.recipientPhone || 'غير متوفر'}</span>
                    </p>
                  </div>
                </div>

                {activeChat.recipientPhone && (
                  <a 
                    href={activeChat.recipientPhone.includes('@') ? `mailto:${activeChat.recipientPhone}` : `tel:${activeChat.recipientPhone}`}
                    className="bg-orange-600 hover:bg-orange-700 text-white font-bold text-[10px] px-3.5 py-1.5 rounded-lg transition-colors"
                  >
                    {activeChat.recipientPhone.includes('@') ? 'مراسلة بالبريد' : 'اتصال هاتفي سريع'}
                  </a>
                )}
              </div>

              {/* Messages Listing Box */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/30 dark:bg-slate-950/20">
                {msgLoading ? (
                  <div className="py-20 text-center">
                    <RefreshCw className="w-6 h-6 animate-spin text-orange-600 mx-auto" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-20 text-slate-400 text-xs">
                    <MessageCircle className="w-10 h-10 mx-auto mb-2 text-slate-300 animate-bounce" />
                    <span>ابدأ المحادثة الآن عيني باللهجة العراقية!</span>
                  </div>
                ) : (
                  messages.map(m => {
                    const isMe = m.senderId === currentUser.id;
                    return (
                      <div 
                        key={m.id} 
                        className={`flex ${isMe ? 'justify-start' : 'justify-end'}`}
                      >
                        <div className={`max-w-[75%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed shadow-xs ${
                          isMe 
                            ? 'bg-orange-600 text-white rounded-br-none' 
                            : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-100 dark:border-slate-800 rounded-bl-none'
                        }`}>
                          <p className="whitespace-pre-wrap">{m.text}</p>
                          <span className="text-[8px] opacity-75 mt-1 block text-left font-mono">
                            {new Date(m.createdAt).toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Gemini Smart Suggestions Panel */}
              {messages.length > 0 && (
                <div className="px-4 py-2 bg-gradient-to-tr from-orange-500/10 to-amber-500/5 dark:from-orange-950/20 dark:to-amber-950/5 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 dark:border-slate-800/40">
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-600 dark:text-slate-300 font-bold">
                    <Sparkles className="w-4 h-4 text-orange-600 animate-pulse" />
                    <span>ردود ذكية مقترحة بالذكاء الاصطناعي (Gemini)</span>
                  </div>

                  {aiSuggestion ? (
                    <div className="flex items-center gap-2 max-w-full">
                      <button
                        onClick={handleApplyAiSuggestion}
                        className="bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-orange-500/20 text-orange-700 dark:text-orange-400 text-[10px] px-3 py-1.5 rounded-lg font-bold transition-all truncate max-w-xs"
                        title="انقر لتطبيق الرد على صندوق النص"
                      >
                        "{aiSuggestion}"
                      </button>
                      <button 
                        onClick={handleGenerateAutoreply} 
                        disabled={aiLoading} 
                        className="text-[9px] text-slate-400 underline hover:text-orange-600 font-bold cursor-pointer"
                      >
                        توليد آخر
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={handleGenerateAutoreply}
                      disabled={aiLoading}
                      className="text-[10px] font-bold text-orange-600 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      {aiLoading ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <span>💡 اقترح رد ذكي باللهجة العراقية عيني</span>
                      )}
                    </button>
                  )}
                </div>
              )}

              {/* Message Typing Input Form */}
              <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-100 dark:border-slate-800 flex gap-2 bg-white dark:bg-slate-950">
                <input
                  type="text"
                  placeholder="اكتب رسالتك هنا..."
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  className="flex-1 bg-slate-50 dark:bg-slate-900 text-xs text-slate-800 dark:text-white px-4 py-2.5 rounded-xl focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="p-2.5 bg-orange-600 hover:bg-orange-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 text-white rounded-xl transition-all"
                >
                  <Send className="w-4 h-4 rotate-180" />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8">
              <MessageSquare className="w-12 h-12 mb-2 text-slate-300" />
              <p className="text-xs font-bold">يرجى تحديد محادثة من القائمة للبدء بالدردشة عيني.</p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
