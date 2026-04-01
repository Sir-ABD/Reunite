import { useState, useEffect } from 'react';
import api from '../services/api';
import Loader from '../components/common/Loader';
import { FaUserShield, FaEnvelope, FaMapMarkerAlt } from 'react-icons/fa';

function Keepers() {
  const [keepers, setKeepers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchKeepers = async () => {
      try {
        const response = await api.get('/keepers');
        setKeepers(response.data.keepers || []);
      } catch (err) {
        setError(err.response?.data?.message || err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchKeepers();
  }, []);

  if (loading) return <Loader />;

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-bold mb-8 text-center" style={{ color: 'var(--color-text)' }}>Authorized Keepers</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            <p>{error}</p>
          </div>
        )}

        {keepers.length === 0 ? (
          <div className="text-center p-12 rounded-lg" style={{ background: 'var(--color-secondary)' }}>
            <p className="text-xl" style={{ color: 'var(--color-text)' }}>No keepers found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {keepers.map((keeper) => (
              <div 
                key={keeper._id} 
                className="p-6 rounded-lg shadow-md border transition-transform hover:scale-[1.02]" 
                style={{ background: 'var(--color-secondary)', borderColor: 'var(--color-secondary)' }}
              >
                <div className="flex items-center mb-4">
                  <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mr-4 overflow-hidden">
                    {keeper.profilePicture ? (
                      <img src={keeper.profilePicture} alt={keeper.name} className="w-full h-full object-cover" />
                    ) : (
                      <FaUserShield className="text-3xl text-blue-600" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>{keeper.name}</h2>
                    <p className="text-sm opacity-75" style={{ color: 'var(--color-text)' }}>Authorized Keeper</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <FaEnvelope className="mr-2 text-blue-500" />
                    <span style={{ color: 'var(--color-text)' }}>{keeper.email}</span>
                  </div>
                  {keeper.location && (
                    <div className="flex items-center text-sm">
                      <FaMapMarkerAlt className="mr-2 text-red-500" />
                      <span style={{ color: 'var(--color-text)' }}>{keeper.location}</span>
                    </div>
                  )}
                </div>
                
                <div className="mt-4 pt-4 border-t" style={{ borderColor: 'rgba(0,0,0,0.1)' }}>
                  <p className="text-xs italic opacity-60" style={{ color: 'var(--color-text)' }}>
                    Contact this keeper if you have claimed an item assigned to them.
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Keepers;
