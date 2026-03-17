import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

function ProtectedRoute({ children }) {
  const { token, loading } = useContext(AuthContext);

  console.log('ProtectedRoute - Token:', token, 'Loading:', loading);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!token) {
    return <Navigate to='/login' replace />;
  }

  return children;
}

export default ProtectedRoute;
