import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Menu, X, Car, LayoutDashboard, Users, Calendar, BarChart3, LogOut } from 'lucide-react';
import axiosInstance from '../api/axiosConfig';
import toast from 'react-hot-toast';

/**
 * Global Navigation Header Component with Active Focus Highlights
 */
const Navbar = ({ isAuthenticated, setIsAuthenticated }) => {
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();

    // Safely extract the logged-in user details if authenticated
    const user = isAuthenticated ? JSON.parse(localStorage.getItem('vrs_user')) : null;

    const handleLogout = async () => {
        try {
            await axiosInstance.post('/auth/logout');
            localStorage.removeItem('vrs_user');
            setIsAuthenticated(false);
            toast.success('Logged out successfully');
            navigate('/login');
        } catch (err) {
            localStorage.removeItem('vrs_user');
            setIsAuthenticated(false);
            navigate('/login');
            toast.error('Session cleared.');
        }
    };

    if (!isAuthenticated || !user) return null;

    const navLinks = [
        { to: "/", label: "Dashboard", icon: LayoutDashboard },
        { to: "/reservations", label: "Bookings", icon: Calendar },
        { to: "/customers", label: "Customers", icon: Users },
        { to: "/vehicles", label: "Vehicles", icon: Car },
        { to: "/reports", label: "Reports", icon: BarChart3 },
    ];

    // Dynamic style helper function for Desktop navigation items
    const getDesktopLinkClass = ({ isActive }) => {
        const baseClass = "flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium transition duration-150 border-b-2";
        return isActive 
            ? `${baseClass} bg-slate-800 text-white border-blue-500 shadow-inner` 
            : `${baseClass} text-slate-400 hover:text-slate-100 border-transparent hover:bg-slate-800/50`;
    };

    // Dynamic style helper function for Mobile navigation items
    const getMobileLinkClass = ({ isActive }) => {
        const baseClass = "flex items-center space-x-3 block px-4 py-2.5 rounded-lg text-base font-medium transition";
        return isActive
            ? `${baseClass} bg-blue-600 text-white shadow-md`
            : `${baseClass} text-slate-300 hover:text-white hover:bg-slate-800`;
    };

    return (
        <nav className="bg-slate-900 text-white shadow-md fixed w-full top-0 left-0 z-50 border-b border-slate-800 backdrop-blur-sm bg-slate-900/95">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    
                    {/* Brand Identity */}
                    <div className="flex items-center space-x-2">
                        <Car className="h-6 w-6 text-blue-400" />
                        <span className="font-bold text-xl tracking-tight text-slate-100">swiftwheels ltd VRS</span>
                    </div>

                    {/* Desktop Navigation Links (With Active State Indicators) */}
                    <div className="hidden md:flex items-center space-x-2">
                        {navLinks.map((link) => {
                            const Icon = link.icon;
                            return (
                                <NavLink 
                                    key={link.to} 
                                    to={link.to} 
                                    className={getDesktopLinkClass}
                                    // 'end' prevents the root route ("/") from lighting up when you are on other sub-pages
                                    end={link.to === "/"} 
                                >
                                    <Icon className="h-4 w-4 text-blue-400" />
                                    <span>{link.label}</span>
                                </NavLink>
                            );
                        })}
                        
                        {/* Interactive Clerk System Metadata Node */}
                        <div className="text-xs bg-slate-950/60 border border-slate-800 px-3 py-2 rounded-lg text-slate-400 font-mono hidden lg:block ml-4">
                            User: <span className="text-blue-400">{user?.username}</span>
                        </div>

                        <button 
                            onClick={handleLogout} 
                            className="flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium bg-red-600/90 hover:bg-red-600 text-white transition ml-4 shadow-sm active:scale-95"
                        >
                            <LogOut className="h-4 w-4" />
                            <span>Logout</span>
                        </button>
                    </div>

                    {/* Mobile Menu Action Trigger Toggle */}
                    <div className="md:hidden">
                        <button 
                            onClick={() => setIsOpen(!isOpen)} 
                            className="inline-flex items-center justify-center p-2 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none transition"
                        >
                            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Navigation Dropdown Drawer View */}
            {isOpen && (
                <div className="md:hidden bg-slate-900 border-t border-slate-800 px-3 pt-2 pb-4 space-y-1 sm:px-4">
                    <div className="px-4 py-2 text-xs text-slate-500 font-mono border-b border-slate-800 mb-2">
                        Clerk context profile: {user?.username} ({user?.role})
                    </div>
                    {navLinks.map((link) => {
                        const Icon = link.icon;
                        return (
                            <NavLink 
                                key={link.to} 
                                to={link.to} 
                                onClick={() => setIsOpen(false)} 
                                className={getMobileLinkClass}
                                end={link.to === "/"}
                            >
                                <Icon className="h-5 w-5" />
                                <span>{link.label}</span>
                            </NavLink>
                        );
                    })}
                    <button 
                        onClick={() => { setIsOpen(false); handleLogout(); }} 
                        className="w-full flex items-center space-x-3 block px-4 py-2.5 rounded-lg text-base font-medium bg-red-600 text-white transition mt-4 shadow-sm"
                    >
                        <LogOut className="h-5 w-5" />
                        <span>Logout</span>
                    </button>
                </div>
            )}
        </nav>
    );
};

export default Navbar;