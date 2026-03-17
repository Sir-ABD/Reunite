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
    <div style={{ background: 'var(--color-bg)', color: 'var(--color-text)', minHeight: '100vh' }}>
      <div className="max-w-3xl mx-auto flex-1 w-full">
        <h1 className="text-3xl font-bold mb-6" style={{ color: 'var(--color-text)' }}>Messages</h1>
        {error && (
          <div className="mb-4 p-3 rounded-md shadow-md" style={{ background: 'var(--color-accent)', color: 'var(--color-bg)' }}>
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="mb-6 p-6 rounded-lg shadow-lg" style={{ background: 'var(--color-secondary)' }}>
          <Input
            label="Message"
            name="content"
            value={newMessage.content}
            onChange={handleChange}
            as="textarea"
            rows="4"
            required
            className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500"
            style={{ 
              border: '1px solid var(--color-secondary)', 
              background: 'var(--color-bg)', 
              color: 'var(--color-text)' 
            }}
            disabled={loading}
          />
          <Button
            type="submit"
            disabled={loading || !newMessage.content.trim()}
            className={`w-full mt-4 p-3 rounded-md transition duration-200 ${
              loading || !newMessage.content.trim() ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            style={{ 
              background: loading || !newMessage.content.trim() ? 'var(--color-secondary)' : 'var(--color-primary)',
              color: 'var(--color-bg)'
            }}
          >
            {loading ? 'Sending...' : 'Send Message'}
          </Button>
        </form>
        <div className="flex-1 overflow-y-auto max-h-[calc(100vh-300px)] p-4 rounded-lg shadow-lg" style={{ background: 'var(--color-secondary)' }}>
          {loading && messages.length === 0 ? (
            <Loader className="text-blue-600" />
          ) : messages.length > 0 ? (
            <div className="space-y-4">
              {messages.map((msg) => {
                const isCurrentUser = msg.sender?._id === user.id;
                return (
                  <div
                    key={msg._id}
                    className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] p-3 rounded-lg shadow-md ${
                        isCurrentUser ? 'text-blue-900' : 'text-gray-900'
                      }`}
                      style={{
                        background: isCurrentUser ? 'var(--color-primary)' : 'var(--color-bg)',
                        color: isCurrentUser ? 'var(--color-bg)' : 'var(--color-text)'
                      }}
                    >
                      <div className="flex items-center mb-1">
                        <span className="w-8 h-8 text-white rounded-full flex items-center justify-center mr-2" style={{ background: 'var(--color-accent)' }}>
                          {getSenderInitial(msg.sender)}
                        </span>
                        <p className="text-sm font-medium">
                          {msg.sender?.name || 'Unknown Sender'}
                        </p>
                      </div>
                      <p className="text-sm mt-1">{msg.content || 'No content'}</p>
                      <p className="text-xs mt-1" style={{ color: isCurrentUser ? 'var(--color-bg)' : 'var(--color-text)' }}>
                        {new Date(msg.createdAt).toLocaleString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true,
                        })}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          ) : (
            <p className="text-lg text-center py-10" style={{ color: 'var(--color-text)' }}>No messages found.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Messages;