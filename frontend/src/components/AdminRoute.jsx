import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

function AdminRoute({ children }) {
  const { token, user, loading } = useContext(AuthContext);

  console.log('AdminRoute - Token:', token, 'User:', user, 'Loading:', loading);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!token) {
    console.log('No token, redirecting to /login');
    return <Navigate to='/login' replace />;
  }

  if (!user) {
    console.log('No user data, redirecting to /');
    return <Navigate to='/' replace />;
  }

  const isAdmin = user.role === 'admin' || user.role === 'Admin' || user.role === 'administrator';
  console.log('Is Admin:', isAdmin, 'Role:', user.role);

  if (!isAdmin) {
    console.log('Not an admin, redirecting to /');
    return <Navigate to='/' replace />;
  }

  return children;
}

export default AdminRoute;
