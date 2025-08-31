import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Define the onboarding flow steps and their corresponding routes
const ONBOARDING_STEPS = [
  { path: '/onboarding/1', step: 1 },
  { path: '/onboarding/2', step: 2 },
  { path: '/onboarding/3', step: 3 },
  { path: '/onboarding/complete', step: 'complete' }
];

const ProtectedRoute = ({ 
  children, 
  requireOnboarding = false,
  requireAuth = true,
  allowedRoles = []
}) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const currentPath = location.pathname;

  // Show loading state
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  // Handle unauthenticated access
  if (requireAuth && !user) {
    // Redirect to signin, but save the current location to return to after login
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  // Handle role-based access control
  if (requireAuth && user && allowedRoles.length > 0) {
    const hasRequiredRole = user.roles?.some(role => allowedRoles.includes(role));
    if (!hasRequiredRole) {
      // Redirect to unauthorized or home if user doesn't have required role
      return <Navigate to="/" replace />;
    }
  }

  // Handle onboarding flow - simplified to not block authenticated users
  if (requireAuth && user) {
    const isOnboardingPage = currentPath.startsWith('/onboarding');
    
    // If user is on an onboarding page but accessing a protected route that doesn't require onboarding
    if (isOnboardingPage && !requireOnboarding) {
      return <Navigate to="/" replace />;
    }
    
    // For onboarding pages, allow access if user is authenticated
    if (requireOnboarding && isOnboardingPage) {
      return children;
    }
  }

  return children;
};

export default ProtectedRoute;
