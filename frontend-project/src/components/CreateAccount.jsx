import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, User, Lock } from 'lucide-react';
import axiosInstance from '../api/axiosConfig';
import toast from 'react-hot-toast';

const CreateAccount = () => {
    const [form, setForm] = useState({ username: '', password: '', role: 'Staff' });
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axiosInstance.post('/auth/register', form);
            toast.success('Operator Node Registered Successfully.');
            navigate('/login');
        } catch (err) {
            toast.error(err.response?.data?.error || 'Registration failed.');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
            <div className="bg-slate-900 border border-slate-800 p-8 rounded-xl shadow-xl max-w-md w-full">
                <h2 className="text-2xl font-bold text-white text-center mb-6 tracking-tight">Provision Operator Node</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Set Operator Name</label>
                        <div className="relative">
                            <User className="absolute left-3 top-3 h-5 w-5 text-slate-500" />
                            <input type="text" required className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:border-blue-500" value={form.username} onChange={e => setForm({...form, username: e.target.value})} />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Security String (Password)</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-500" />
                            <input type="password" required className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:border-blue-500" value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">System Scope Role</label>
                        <div className="relative">
                            <ShieldCheck className="absolute left-3 top-3 h-5 w-5 text-slate-500" />
                            <select className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:border-blue-500" value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
                                <option value="Staff">Desk Operations (Staff)</option>
                                <option value="Admin">System Administrator (Admin)</option>
                            </select>
                        </div>
                    </div>
                    <button type="submit" className="w-full py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg shadow transition duration-200">
                        Register Account
                    </button>
                </form>
                <div className="mt-4 text-center">
                    <p className="text-sm text-slate-500">Already registered? <Link to="/login" className="text-blue-400 hover:underline">Log in</Link></p>
                </div>
            </div>
        </div>
    );
};

export default CreateAccount;