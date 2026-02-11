import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Search, MoreVertical, Paperclip, Smile, Send, CheckCheck, 
  User, Info, X, Loader2, AlertCircle
} from 'lucide-react';
import { leadApi } from '../lib/api';
// Define the interface based on your IChat model
interface ChatMessage {
  _id: string;
  phone: string;
  userName: string;
  content: string;
  timestamp: string;
  role: 'user' | 'assistant';
  metadata?: {
    platform: string;
    status: string;
  };
}

const WhatsAppChatUI: React.FC = () => {
  // --- State ---
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allMessages, setAllMessages] = useState<ChatMessage[]>([]);
  const [activeChat, setActiveChat] = useState<string>('');
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showDetails, setShowDetails] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // --- API Call ---
  const fetchChatHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Hit your leadApi.getAllChats method
      // We pass empty filters initially and a high limit to get history
      const response = await leadApi.getAllChats({}, 1, 1000);
      
      if (response.success) {
        setAllMessages(response.data);
        
        // Auto-select first chat if none active
        if (response.data.length > 0 && !activeChat) {
          setActiveChat(response.data[0].phone);
        }
      } else {
        setError(response.message || 'Failed to load chats');
      }
    } catch (err) {
      setError('An unexpected error occurred while fetching chats.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChatHistory();
  }, []);

  // --- Computed Data ---
  
  // Group messages into unique contacts for the sidebar
  const contacts = useMemo(() => {
    const uniquePhones = Array.from(new Set(allMessages.map(m => m.phone)));
    return uniquePhones.map(phone => {
      const userMsgs = allMessages.filter(m => m.phone === phone);
      const lastMsg = userMsgs[0]; // Most recent based on backend sort
      return {
        phone,
        name: lastMsg.userName || 'Unknown User',
        lastMessage: lastMsg.content,
        time: new Date(lastMsg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
    });
  }, [allMessages]);

  // Messages for the current open chat
  const activeMessages = useMemo(() => {
    return allMessages
      .filter(m => m.phone === activeChat)
      .reverse(); // Reverse so latest is at bottom for the UI
  }, [allMessages, activeChat]);

  const activeContact = contacts.find(c => c.phone === activeChat);

  // --- Effects ---
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeMessages]);

  // --- Handlers ---
  const handleSendMessage = () => {
    if (!messageInput.trim()) return;
    // Note: Since this is a History UI, "sending" would usually hit a 
    // separate WhatsApp API endpoint. For now, we clear the input.
    console.log("Admin sending message to:", activeChat, "Content:", messageInput);
    setMessageInput('');
  };

  // --- Render Helpers ---
  if (loading) return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-[#f0f2f5]">
      <Loader2 className="w-10 h-10 text-[#00a884] animate-spin mb-2" />
      <p className="text-gray-500">Loading Chat History...</p>
    </div>
  );

  if (error) return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-[#f0f2f5] p-4 text-center">
      <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
      <h2 className="text-xl font-bold text-gray-800">Permission Denied</h2>
      <p className="text-gray-600 max-w-md mt-2">{error}</p>
      <button onClick={fetchChatHistory} className="mt-4 bg-[#00a884] text-white px-6 py-2 rounded-full">
        Retry
      </button>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[9999] flex h-screen bg-[#f0f2f5] antialiased overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-[127px] bg-[#00a884] z-0" />

      <div className="relative z-10 flex w-[98%] max-w-[1600px] h-[96vh] m-auto bg-white shadow-2xl overflow-hidden rounded-sm">
        
        {/* LEFT: Contact List */}
        <div className="w-[30%] min-w-[350px] border-r border-gray-300 flex flex-col bg-white">
          <header className="h-[60px] p-4 bg-[#f0f2f5] flex items-center justify-between">
            <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
              <User className="text-gray-600" />
            </div>
            <MoreVertical className="w-6 h-6 text-[#54656f] cursor-pointer" />
          </header>

          <div className="p-2 bg-white">
            <div className="relative bg-[#f0f2f5] rounded-lg px-3 py-1.5 flex items-center">
              <Search className="w-4 h-4 text-[#54656f] mr-4" />
              <input 
                className="bg-transparent text-[14px] w-full focus:outline-none" 
                placeholder="Search or start new chat"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {contacts
              .filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.phone.includes(searchQuery))
              .map(c => (
              <div 
                key={c.phone} 
                onClick={() => setActiveChat(c.phone)} 
                className={`flex h-[72px] items-center px-3 cursor-pointer border-b border-gray-100 hover:bg-[#f5f6f6] ${activeChat === c.phone ? 'bg-[#f0f2f5]' : ''}`}
              >
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mr-3 flex-shrink-0">
                  <User className="text-green-700" />
                </div>
                <div className="flex-1 overflow-hidden">
                  <div className="flex justify-between items-center">
                    <span className="font-normal text-[17px] text-[#111b21]">{c.name}</span>
                    <span className="text-xs text-[#667781]">{c.time}</span>
                  </div>
                  <p className="text-[14px] text-[#667781] truncate">{c.lastMessage}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* MIDDLE: Chat Conversation */}
        <div className="flex-1 flex flex-col bg-[#efeae2] relative border-r border-gray-300">
          {/* Background Wallpaper */}
          <div className="absolute inset-0 opacity-[0.06] pointer-events-none bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')]" />
          
          <header className="relative z-10 h-[60px] p-3 bg-[#f0f2f5] border-b border-gray-300 flex justify-between items-center">
             <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mr-3">
                  <User className="text-green-700" />
                </div>
                <div>
                  <h3 className="font-medium text-[16px] text-[#111b21]">{activeContact?.name}</h3>
                  <p className="text-xs text-[#667781]">{activeContact?.phone}</p>
                </div>
             </div>
             <div className="flex items-center space-x-6 text-[#54656f]">
                <Info className={`w-5 h-5 cursor-pointer ${showDetails ? 'text-green-600' : ''}`} onClick={() => setShowDetails(!showDetails)} />
             </div>
          </header>

          {/* Messages Area */}
          <div className="relative z-10 flex-1 overflow-y-auto p-6 space-y-4">
            {activeMessages.map(m => (
              <div key={m._id} className={`flex ${m.role === 'assistant' ? 'justify-end' : 'justify-start'}`}>
                <div className={`relative max-w-[65%] px-3 py-1.5 rounded-lg shadow-sm text-[14.2px] leading-relaxed ${
                    m.role === 'assistant' 
                    ? 'bg-[#dcf8c6] rounded-tr-none text-[#111b21]' 
                    : 'bg-white rounded-tl-none text-[#111b21]'
                }`}>
                  <p className="pr-16 break-words whitespace-pre-wrap">{m.content}</p>
                  <div className="absolute bottom-1 right-2 flex items-center space-x-1 select-none">
                    <span className="text-[11px] text-[#667781]">
                      {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {m.role === 'assistant' && (
                      <CheckCheck className={`w-3.5 h-3.5 ${m.metadata?.status === 'read' ? 'text-[#53bdeb]' : 'text-[#8696a0]'}`} />
                    )}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Footer Input */}
          <footer className="relative z-10 p-2.5 bg-[#f0f2f5] flex items-center space-x-2">
            <Smile className="text-[#54656f] w-7 h-7 cursor-pointer" />
            <Paperclip className="text-[#54656f] w-6 h-6 rotate-45 cursor-pointer" />
            <input 
              className="flex-1 py-2 px-4 rounded-lg focus:outline-none text-[15px] bg-white border-none shadow-sm" 
              placeholder="Type a message (Admin View Only)"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            />
            <Send className="text-[#54656f] w-7 h-7 cursor-pointer" onClick={handleSendMessage} />
          </footer>
        </div>

        {/* RIGHT: Contact Info Sidebar */}
        {showDetails && (
          <div className="w-[30%] min-w-[320px] bg-white flex flex-col items-center animate-in slide-in-from-right duration-300">
            <header className="w-full h-[60px] px-6 bg-[#f0f2f5] flex items-center border-b border-gray-200">
              <X className="w-5 h-5 text-[#54656f] cursor-pointer mr-6" onClick={() => setShowDetails(false)} />
              <span className="font-medium text-[#111b21]">Contact info</span>
            </header>
            
            <div className="flex flex-col items-center p-8 w-full">
              <div className="w-48 h-48 rounded-full bg-gray-100 flex items-center justify-center mb-5">
                <User className="w-24 h-24 text-gray-400" />
              </div>
              <h2 className="text-xl font-normal text-[#111b21]">{activeContact?.name}</h2>
              <p className="text-[#667781] mb-6">{activeContact?.phone}</p>
              
              <div className="w-full border-t border-gray-100 py-5">
                 <p className="text-sm text-gray-500 text-center italic">
                   This conversation is logged from the WhatsApp Platform.
                 </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WhatsAppChatUI;