import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useUser } from '@/contexts/store/UserContext';

interface StoreProtectedRouteProps {
    children: React.ReactNode;
}

const StoreProtectedRoute: React.FC<StoreProtectedRouteProps> = ({ children }) => {
    const { user, isLoading } = useUser();
    const location = useLocation();

    if (isLoading) {
        return (
            <div className="min-h-screen bg-black/95 flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="w-8 h-8 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-gray-400">جاري التحقق من البيانات...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        // Prevent infinite redirect loop
        if (location.pathname === '/login' || location.pathname === '/store/login') {
            return <>{children}</>;
        }

        // Redirect to login page, saving the current location they were trying to access
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <>{children}</>;
};

export default StoreProtectedRoute;
