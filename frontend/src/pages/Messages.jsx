import { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import { getMessagesInConversation, sendMessageInConversation } from '../services/messageService';
import Loader from '../components/common/Loader';
import Input from '../components/common/Input';
import Button from '../components/common/Button';

function Messages() {
  const { user, socket } = useContext(AuthContext);
  const navigate = useNavigate();
  const { conversationId } = useParams();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState({ content: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);

  // Scroll to bottom function
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Fetch messages function
  const fetchMessages = async () => {
    if (!conversationId) {
      setError('No conversation ID provided');
      return;
    }
    setLoading(true);
    try {
      const response = await getMessagesInConversation(conversationId, { page: 1, limit: 50 });
      setMessages(response.data.messages || []);
      setError('');
    } catch (err) {
      setError('Failed to load messages: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle incoming messages via the shared socket
  useEffect(() => {
    if (!socket || !conversationId) return;

    const handleReceiveMessage = (message) => {
      if (message.conversation === conversationId) {
        setMessages((prev) => {
          if (prev.some((msg) => msg._id === message._id)) return prev;
          return [message, ...prev];
        });
        setError(''); // Clear error on successful receive
      }
    };

    const handleErrorMessage = (errorMsg) => {
      console.error('Message error:', errorMsg);
      // Only set error if the last sent message isn’t received
      const lastSent = messages.find((msg) => msg._id === socket.lastMessageId);
      if (!lastSent) {
        setError(errorMsg || 'Failed to send message');
      }
    };

    socket.on('receiveMessage', handleReceiveMessage);
    socket.on('errorMessage', handleErrorMessage);

    socket.emit('joinConversation', conversationId);

    return () => {
      socket.off('receiveMessage', handleReceiveMessage);
      socket.off('errorMessage', handleErrorMessage);
    };
  }, [socket, conversationId]);

  // Initial fetch and navigation logic
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!conversationId) {
      navigate('/conversations');
      return;
    }
    fetchMessages();
  }, [user, conversationId, navigate]);

  // Scroll to bottom when messages update
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewMessage((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newMessage.content.trim() || !conversationId || !user?.id || !socket) return;

    setLoading(true);
    setError('');

    const tempMessageId = Date.now().toString();
    const tempMessage = {
      _id: tempMessageId,
      conversation: conversationId,
      sender: { _id: user.id, name: user.name || 'You' },
      content: newMessage.content,
      createdAt: new Date().toISOString(),
      isRead: false,
      isActive: true,
    };

    setMessages((prev) => [tempMessage, ...prev]);
    setNewMessage({ content: '' });
    socket.lastMessageId = tempMessageId; // Track last sent message

    try {
      const response = await sendMessageInConversation(conversationId, {
        sender: user.id,
        content: tempMessage.content,
      });

      socket.emit('sendMessage', {
        conversationId,
        senderId: user.id,
        content: tempMessage.content,
        _id: response.data.message._id,
        createdAt: response.data.message.createdAt,
      });

      await fetchMessages();
    } catch (err) {
      setError('Failed to send message: ' + err.message);
      setMessages((prev) => prev.filter((msg) => msg._id !== tempMessageId));
    } finally {
      setLoading(false);
    }
  };

  const getSenderInitial = (sender) =>
    sender?.name?.charAt(0).toUpperCase() || '?';

  if (!user) return <Loader />;

  return (
    <div className="flex flex-col" style={{ background: 'var(--color-bg)', color: 'var(--color-text)', minHeight: 'calc(100vh - 64px)' }}>
      <div className="max-w-4xl mx-auto flex flex-col w-full h-[calc(100vh-[100px])] p-4 md:p-6" style={{ height: 'calc(100vh - 80px)' }}>
        <h1 className="text-2xl md:text-3xl font-bold mb-4 flex-shrink-0" style={{ color: 'var(--color-text)' }}>Messages</h1>
        
        {error && (
          <div className="mb-4 p-3 rounded-md shadow-md flex-shrink-0" style={{ background: 'var(--color-accent)', color: 'var(--color-bg)' }}>
            {error}
          </div>
        )}

        <div className="flex flex-col flex-1 overflow-hidden rounded-2xl shadow-xl border" style={{ background: 'var(--color-secondary)', borderColor: 'var(--color-bg)' }}>
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4" style={{ background: 'var(--color-bg)' }}>
            {loading && messages.length === 0 ? (
              <div className="flex justify-center items-center h-full"><Loader className="text-blue-600" /></div>
            ) : messages.length > 0 ? (
              <div className="space-y-6">
                {messages.map((msg) => {
                  const isCurrentUser = msg.sender?._id === user.id;
                  return (
                    <div
                      key={msg._id}
                      className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] md:max-w-[70%] p-3.5 rounded-2xl shadow-sm ${isCurrentUser ? 'rounded-tr-sm' : 'rounded-tl-sm'}`}
                        style={{
                          background: isCurrentUser ? 'var(--color-primary)' : 'var(--color-secondary)',
                          color: isCurrentUser ? 'white' : 'var(--color-text)'
                        }}
                      >
                        {!isCurrentUser && (
                          <div className="flex items-center mb-1.5">
                            <div className="w-6 h-6 rounded-full overflow-hidden mr-2 flex-shrink-0 bg-blue-100 flex items-center justify-center text-blue-800 text-xs font-bold">
                              {msg.sender?.profilePicture ? (
                                <img src={msg.sender.profilePicture} alt={msg.sender.name} className="w-full h-full object-cover" />
                              ) : (
                                getSenderInitial(msg.sender)
                              )}
                            </div>
                            <p className="text-xs font-bold opacity-80">
                              {msg.sender?.name || 'Unknown'}
                            </p>
                          </div>
                        )}
                        <p className="text-sm leading-relaxed whitespace-pre-wrap word-break-words">{msg.content || ''}</p>
                        <p className={`text-[10px] mt-1.5 text-right opacity-70`}>
                          {new Date(msg.createdAt).toLocaleString('en-US', {
                            hour: '2-digit', minute: '2-digit', hour12: true, month: 'short', day: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} className="h-1" />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full opacity-50 space-y-3">
                <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 20 20" style={{ color: 'var(--color-text)' }}><path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd"></path></svg>
                <p className="text-lg font-medium" style={{ color: 'var(--color-text)' }}>No messages yet. Start the conversation!</p>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-3 md:p-4 border-t" style={{ borderColor: 'var(--color-bg)', background: 'var(--color-secondary)' }}>
            <form onSubmit={handleSubmit} className="flex items-end gap-2 md:gap-3">
              <div className="flex-1 relative">
                <textarea
                  name="content"
                  value={newMessage.content}
                  onChange={handleChange}
                  placeholder="Type a message..."
                  rows={1}
                  required
                  className="w-full py-3 px-4 rounded-3xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none overflow-y-auto block text-sm"
                  style={{
                    background: 'var(--color-bg)',
                    color: 'var(--color-text)',
                    minHeight: '48px',
                    maxHeight: '120px'
                  }}
                  disabled={loading}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if(newMessage.content.trim()) handleSubmit(e);
                    }
                  }}
                  onInput={(e) => {
                    e.target.style.height = 'auto';
                    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                  }}
                />
              </div>
              <button
                type="submit"
                disabled={loading || !newMessage.content.trim()}
                className={`h-12 w-12 flex items-center justify-center rounded-full transition-all duration-200 flex-shrink-0 ${(loading || !newMessage.content.trim()) ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 hover:shadow-lg focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'}`}
                style={{
                  background: (loading || !newMessage.content.trim()) ? 'var(--color-bg)' : 'var(--color-primary)',
                  color: (loading || !newMessage.content.trim()) ? 'var(--color-text)' : 'white'
                }}
                title="Send message"
              >
                {loading ? (
                   <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                ) : (
                  <svg className="w-5 h-5 ml-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path></svg>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Messages;