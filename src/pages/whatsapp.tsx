import React, { useState, useRef, useEffect } from 'react';
import { 
  Search,
  MoreVertical,
  Paperclip,
  Smile,
  Mic,
  Phone,
  Video,
  Image as ImageIcon,
  File,
  Calendar,
  MapPin,
  Send,
  Check,
  CheckCheck,
  User,
  Phone as PhoneIcon
} from 'lucide-react';

interface ChatMessage {
  id: string;
  phone: string;
  userName: string;
  isBot: boolean;
  content: string;
  timestamp: string;
  time: string;
  status: 'sent' | 'delivered' | 'read';
  isMe?: boolean;
}

const WhatsAppChatUI: React.FC = () => {
  const [activeChat, setActiveChat] = useState<string>('+1234567890');
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAttachments, setShowAttachments] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Mock contacts with recent chats
  const contacts = [
    { id: '1', phone: '+1234567890', name: 'John Doe', lastMessage: 'Hello there!', time: '10:30 AM', unread: 2, online: true },
    { id: '2', phone: '+1987654321', name: 'Jane Smith', lastMessage: 'Thanks for the help!', time: 'Yesterday', unread: 0, online: true },
    { id: '3', phone: '+1122334455', name: 'Bob Wilson', lastMessage: 'Can you send me the details?', time: '9:45 AM', unread: 5, online: false },
    { id: '4', phone: '+1555666777', name: 'Alice Johnson', lastMessage: 'Got it, thank you!', time: 'Wednesday', unread: 0, online: true },
    { id: '5', phone: '+1444333222', name: 'Mike Brown', lastMessage: 'See you tomorrow!', time: 'Monday', unread: 0, online: false },
    { id: '6', phone: '+1777888999', name: 'Sarah Davis', lastMessage: 'Okay, understood', time: 'Sunday', unread: 1, online: true },
  ];

  // Mock messages for active chat
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', phone: '+1234567890', userName: 'John Doe', isBot: false, content: 'Hello, I need help with my order', timestamp: '2024-01-15T10:30:00', time: '10:30 AM', status: 'read', isMe: false },
    { id: '2', phone: '+1234567890', userName: 'Bot', isBot: true, content: 'Hello! I\'d be happy to help with your order. Can you please share your order number?', timestamp: '2024-01-15T10:32:00', time: '10:32 AM', status: 'delivered', isMe: true },
    { id: '3', phone: '+1234567890', userName: 'John Doe', isBot: false, content: 'My order number is ORD-12345', timestamp: '2024-01-15T10:33:00', time: '10:33 AM', status: 'read', isMe: false },
    { id: '4', phone: '+1234567890', userName: 'Bot', isBot: true, content: 'Thank you! I can see your order. It\'s being processed and will be shipped tomorrow.', timestamp: '2024-01-15T10:35:00', time: '10:35 AM', status: 'read', isMe: true },
    { id: '5', phone: '+1234567890', userName: 'John Doe', isBot: false, content: 'Great! Can you also tell me about return policy?', timestamp: '2024-01-15T10:40:00', time: '10:40 AM', status: 'read', isMe: false },
    { id: '6', phone: '+1234567890', userName: 'Bot', isBot: true, content: 'Sure! We have a 30-day return policy. Items must be unused and in original packaging.', timestamp: '2024-01-15T10:42:00', time: '10:42 AM', status: 'delivered', isMe: true },
    { id: '7', phone: '+1234567890', userName: 'John Doe', isBot: false, content: 'Perfect, thank you!', timestamp: '2024-01-15T10:45:00', time: '10:45 AM', status: 'read', isMe: false },
    { id: '8', phone: '+1234567890', userName: 'Bot', isBot: true, content: 'You\'re welcome! Is there anything else I can help you with?', timestamp: '2024-01-15T10:46:00', time: '10:46 AM', status: 'sent', isMe: true },
  ]);

  const activeContact = contacts.find(contact => contact.phone === activeChat);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (messageInput.trim() === '') return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      phone: activeChat,
      userName: 'Bot',
      isBot: true,
      content: messageInput,
      timestamp: new Date().toISOString(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sent',
      isMe: true
    };

    setMessages(prev => [...prev, newMessage]);
    setMessageInput('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.phone.includes(searchQuery)
  );

  const attachmentOptions = [
    { icon: <ImageIcon size={20} />, label: 'Photo & Video', color: 'text-green-600' },
    { icon: <File size={20} />, label: 'Document', color: 'text-blue-600' },
    { icon: <Calendar size={20} />, label: 'Event', color: 'text-purple-600' },
    { icon: <MapPin size={20} />, label: 'Location', color: 'text-red-600' },
  ];

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-gray-100">
      {/* Left Sidebar - Contacts List */}
      <div className="w-1/3 border-r border-gray-300 bg-white flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-800">WhatsApp Bot</h2>
                <p className="text-xs text-gray-500">Online</p>
              </div>
            </div>
            <div className="flex space-x-4">
              <MoreVertical className="w-6 h-6 text-gray-600 cursor-pointer" />
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-gray-300">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search or start new chat"
              className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Contacts List */}
        <div className="flex-1 overflow-y-auto">
          {filteredContacts.map((contact) => (
            <div
              key={contact.id}
              className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
                activeChat === contact.phone ? 'bg-green-50' : ''
              }`}
              onClick={() => setActiveChat(contact.phone)}
            >
              <div className="flex items-center">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-green-200 flex items-center justify-center">
                    <User className="w-6 h-6 text-green-700" />
                  </div>
                  {contact.online && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                  )}
                </div>
                <div className="ml-3 flex-1">
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold text-gray-800">{contact.name}</h3>
                    <span className="text-xs text-gray-500">{contact.time}</span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <p className="text-sm text-gray-600 truncate">{contact.lastMessage}</p>
                    {contact.unread > 0 && (
                      <span className="bg-green-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {contact.unread}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Side - Chat Area */}
      <div className="flex-1 flex flex-col bg-gray-50">
        {/* Chat Header */}
        <div className="p-4 border-b border-gray-300 bg-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-green-200 flex items-center justify-center">
              <User className="w-6 h-6 text-green-700" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-800">{activeContact?.name}</h2>
              <div className="flex items-center">
                <div className={`w-2 h-2 rounded-full mr-2 ${activeContact?.online ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                <p className="text-sm text-gray-600">{activeContact?.phone}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-6">
            <Phone className="w-6 h-6 text-gray-600 cursor-pointer hover:text-green-600" />
            <Video className="w-6 h-6 text-gray-600 cursor-pointer hover:text-green-600" />
            <Search className="w-6 h-6 text-gray-600 cursor-pointer hover:text-green-600" />
            <MoreVertical className="w-6 h-6 text-gray-600 cursor-pointer hover:text-green-600" />
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')]">
          <div className="space-y-2">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.isMe ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[70%] rounded-lg p-3 ${
                  message.isMe 
                    ? 'bg-green-100 rounded-tr-none' 
                    : 'bg-white rounded-tl-none'
                } shadow-sm`}>
                  {!message.isMe && (
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium text-sm text-gray-800">
                        {message.userName}
                      </span>
                      <PhoneIcon className="w-3 h-3 text-gray-500" />
                      <span className="text-xs text-gray-500">{message.phone}</span>
                    </div>
                  )}
                  <p className="text-gray-800 whitespace-pre-wrap">{message.content}</p>
                  <div className="flex justify-end items-center mt-2 space-x-1">
                    <span className="text-xs text-gray-500">{message.time}</span>
                    {message.isMe && (
                      <span className="ml-1">
                        {message.status === 'sent' && <Check className="w-4 h-4 text-gray-400" />}
                        {message.status === 'delivered' && <CheckCheck className="w-4 h-4 text-gray-400" />}
                        {message.status === 'read' && <CheckCheck className="w-4 h-4 text-green-600" />}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Message Input */}
        <div className="p-4 bg-white border-t border-gray-300">
          <div className="flex items-center space-x-4">
            {/* Attachments Button */}
            <div className="relative">
              <button
                onClick={() => setShowAttachments(!showAttachments)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <Paperclip className="w-6 h-6 text-gray-600 rotate-45" />
              </button>
              
              {/* Attachments Menu */}
              {showAttachments && (
                <div className="absolute bottom-full left-0 mb-2 bg-white rounded-lg shadow-lg border border-gray-200 p-2 w-48">
                  {attachmentOptions.map((option, index) => (
                    <button
                      key={index}
                      className="flex items-center space-x-3 w-full p-3 hover:bg-gray-50 rounded-md"
                    >
                      <span className={option.color}>{option.icon}</span>
                      <span className="text-sm text-gray-700">{option.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Emoji Button */}
            <button className="p-2 hover:bg-gray-100 rounded-full">
              <Smile className="w-6 h-6 text-gray-600" />
            </button>

            {/* Message Input */}
            <div className="flex-1 relative">
              <textarea
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message"
                className="w-full pl-4 pr-12 py-3 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500 resize-none max-h-32"
                rows={1}
              />
            </div>

            {/* Send Button or Voice Note */}
            <button
              onClick={handleSendMessage}
              className={`p-3 rounded-full ${
                messageInput.trim() 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-gray-200 hover:bg-gray-300'
              } transition-colors`}
              disabled={!messageInput.trim()}
            >
              {messageInput.trim() ? (
                <Send className="w-6 h-6 text-white" />
              ) : (
                <Mic className="w-6 h-6 text-gray-600" />
              )}
            </button>
          </div>

          {/* Quick Reply Button */}
          <div className="mt-3 flex justify-center">
            <button
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-full text-sm font-medium flex items-center space-x-2 transition-colors"
              onClick={() => {
                const quickReply = "This is an automated reply from the bot.";
                setMessageInput(quickReply);
              }}
            >
              <Send className="w-4 h-4" />
              <span>Send Quick Reply</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppChatUI;