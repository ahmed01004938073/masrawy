import React from 'react';
import { useLocation } from 'react-router-dom';
import { useStoreStatus } from '@/hooks/useStoreStatus';
import StoreClosure from './StoreClosure';

interface StoreStatusWrapperProps {
  children: React.ReactNode;
}

const StoreStatusWrapper: React.FC<StoreStatusWrapperProps> = ({ children }) => {
  const { storeOpen, loading } = useStoreStatus();
  const location = useLocation();

  // Routes that should always be accessible (admin routes)
  // Routes that should always be accessible
  const adminRoutes = [
    '/admin', // Only allow actual admin routes if they ever pass through here (though they shouldn't)
    '/login', // Basic login might be needed
    '/register'
  ];

  // Check if current route is an admin route
  const isAdminRoute = adminRoutes.some(route =>
    location.pathname.startsWith(route)
  );

  // Show loading while checking store status
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600">جاري التحقق من حالة المتجر...</p>
        </div>
      </div>
    );
  }

  // If store is closed and it's not an admin route, show closure page
  if (!storeOpen && !isAdminRoute) {
    return <StoreClosure allowNavigation={true} />;
  }

  // Otherwise, render the normal content
  return <>{children}</>;
};

export default StoreStatusWrapper;
