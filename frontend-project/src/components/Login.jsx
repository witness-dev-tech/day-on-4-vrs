import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, User } from 'lucide-react';
import axiosInstance from '../api/axiosConfig';
import toast from 'react-hot-toast';

/**
 * Login Authorization Portal
 * @param {Function} setIsAuthenticated - Top-level react state mutator to flag session verification status
 */
const Login = ({ setIsAuthenticated }) => {
    const [form, setForm] = useState({ username: '', password: '' });
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // Safety forward-bounce check: If user context keys already exist, redirect straight to dashboard
    useEffect(() => {
        const structuralUserNode = localStorage.getItem('vrs_user');
        if (structuralUserNode) {
            setIsAuthenticated(true);
            navigate('/', { replace: true });
        }
    }, [navigate, setIsAuthenticated]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Firing authentication credentials to your Express backend layout route
            const res = await axiosInstance.post('/auth/login', form);
            
            // 1. Commit metadata payload to localized memory cache
            localStorage.setItem('vrs_user', JSON.stringify(res.data.user));
            
            // 2. Alert parent state router that authorization check has successfully cleared
            setIsAuthenticated(true);
            
            toast.success('Access Granted. Welcome back!');
            
            // 3. Direct client workflow context straight to the dashboard hub root view
            navigate('/', { replace: true });
        } catch (err) {
            toast.error(err.response?.data?.error || 'Invalid system access keys.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
            <div className="bg-slate-900 border border-slate-800 p-8 rounded-xl shadow-xl max-w-md w-full">
                <h2 className="text-2xl font-bold text-white text-center mb-6 tracking-tight">Swiftwheels ltd VRS Authorization Portal</h2>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Username</label>
                        <div className="relative">
                            <User className="absolute left-3 top-3 h-5 w-5 text-slate-500" />
                            <input 
                                type="text" 
                                required 
                                className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:border-blue-500 transition duration-150" 
                                placeholder="Enter username" 
                                value={form.username} 
                                onChange={e => setForm({...form, username: e.target.value})} 
                            />
                        </div>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Security Key</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-500" />
                            <input 
                                type="password" 
                                required 
                                className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:border-blue-500 transition duration-150" 
                                placeholder="••••••••" 
                                value={form.password} 
                                onChange={e => setForm({...form, password: e.target.value})} 
                            />
                        </div>
                    </div>
                    
                    <button 
                        type="submit" 
                        disabled={loading} 
                        className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-lg transition duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading ? 'Authenticating...' : 'Sign In'}
                    </button>
                </form>
                
                <div className="mt-4 text-center">
                    <p className="text-sm text-slate-500">
                        New desk node clerk?{' '}
                        <Link to="/register" className="text-blue-400 hover:underline">
                            Provision account
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;