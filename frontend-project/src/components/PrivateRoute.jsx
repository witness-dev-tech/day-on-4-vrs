import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';

const PrivateRoute = ({ isAuthenticated, loading }) => {
    const location = useLocation();

    // 1. Hold layout rendering while application boot sequence verifies localStorage
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center text-slate-500 font-medium text-sm animate-pulse">
                    Verifying secure access protocols...
                </div>
            </div>
        );
    }

    // 2. Direct unauthenticated attempts back to authorization gateway
    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // 3. CRITICAL FIX: You MUST return <Outlet /> here!
    // This tells React Router exactly where to render <Dashboard />, <Customer />, etc.
    return <Outlet />;
};

export default PrivateRoute;