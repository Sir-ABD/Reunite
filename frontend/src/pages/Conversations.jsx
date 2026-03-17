import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getMyConversations } from '../services/conversationService';
import Loader from '../components/common/Loader';
import { Link } from 'react-router-dom';

function Conversations() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch conversations function
  const fetchConversations = async () => {
    setLoading(true);
    try {
      const response = await getMyConversations();
      setConversations(response.data.conversations.docs || []);
      setError('');
    } catch (err) {
      setError('Failed to load conversations: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchConversations();
  }, [user, navigate]);

  // Format date for better readability
  const formatDate = (date) => 
    new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

  if (!user) return <Loader />;

  return (
    <div className="container mx-auto p-4 sm:p-6 min-h-screen flex flex-col" style={{ background: 'var(--color-bg)' }}>
      <div className="max-w-3xl mx-auto w-full">
        <h1 className="text-3xl font-bold mb-6" style={{ color: 'var(--color-text)' }}>Conversations</h1>
        {error && (
          <div className="mb-4 p-3 rounded-md shadow-md" style={{ background: 'var(--color-accent)', color: 'var(--color-bg)' }}>
            {error}
          </div>
        )}
        {loading ? (
          <Loader className="text-blue-600" />
        ) : conversations.length > 0 ? (
          <div className="p-6 rounded-lg shadow-md space-y-4" style={{ background: 'var(--color-secondary)' }}>
            {conversations.map((conv) => (
              <Link
                key={conv._id}
                to={`/messages/${conv._id}`}
                className="block p-4 border rounded-md transition-colors duration-150"
                style={{ borderColor: 'var(--color-secondary)', color: 'var(--color-text)' }}
              >
                <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                  For: {conv.item?.title || 'Untitled'} ({conv.item?.status || 'Unknown'}) - 
                  {conv.participants[1]?.name || 'Unknown'}
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--color-text)' }}>
                  Last Message: {formatDate(conv.updatedAt)}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-lg text-center py-10" style={{ color: 'var(--color-text)' }}>No conversations found.</p>
        )}
      </div>
    </div>
  );
}

export default Conversations;