import React, { useEffect, useState } from 'react';
import { UserPlus, UserCheck, Mail, Phone, Eye, X, Search, Trash2 } from 'lucide-react';
import axiosInstance from '../api/axiosConfig';
import toast from 'react-hot-toast';

const Customer = () => {
    const [customers, setCustomers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [form, setForm] = useState({ fullname: '', nationalid: '', phone: '', email: '', address: '' });
    const [editingId, setEditingId] = useState(null);
    const [deletingId, setDeletingId] = useState(null); // Tracks double-check delete confirmation status

    const loadCustomers = async () => {
        try {
            const res = await axiosInstance.get('/customers');
            if (Array.isArray(res.data)) {
                setCustomers(res.data);
            } else {
                setCustomers([]);
            }
        } catch (err) {
            toast.error("Error reading database registries.");
            setCustomers([]);
        }
    };

    useEffect(() => { 
        loadCustomers(); 
    }, []);

    const resetFormState = () => {
        setForm({ fullname: '', nationalid: '', phone: '', email: '', address: '' });
        setEditingId(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await axiosInstance.put(`/customers/${editingId}`, form);
                toast.success('Customer metadata updated');
            } else {
                await axiosInstance.post('/customers', form);
                toast.success('New customer profile logged');
            }
            resetFormState();
            loadCustomers();
        } catch (err) {
            toast.error(err.response?.data?.error || "Transaction compilation error.");
        }
    };

    const handleDelete = async (id) => {
        try {
            await axiosInstance.delete(`/customers/${id}`);
            toast.success('Customer record purged successfully');
            if (editingId === id) resetFormState(); // Clear form if editing the deleted customer
            setDeletingId(null);
            loadCustomers();
        } catch (err) {
            toast.error(err.response?.data?.error || "Failed to drop record from ledger pool.");
        }
    };

    // Client-side search optimization layer
    const filteredCustomers = customers.filter(c => 
        c.fullname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.nationalid?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone?.includes(searchTerm) ||
        c.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="pt-20 px-4 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Action Entry Form Interface Container */}
            <div className="lg:col-span-1 bg-white border border-slate-200 rounded-xl p-6 shadow-sm h-fit">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        {editingId ? <UserCheck className="text-blue-500" /> : <UserPlus className="text-blue-500" />}
                        {editingId ? 'Modify Profile' : 'Register Customer'}
                    </h2>
                    {editingId && (
                        <button 
                            type="button" 
                            onClick={resetFormState}
                            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 transition"
                            title="Cancel Edit"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="space-y-3">
                    <input 
                        type="text" 
                        placeholder="Full Name" 
                        required 
                        className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" 
                        value={form.fullname} 
                        onChange={e => setForm({...form, fullname: e.target.value})} 
                    />
                    <input 
                        type="text" 
                        placeholder="National ID / Passport" 
                        required 
                        disabled={!!editingId} 
                        className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-500" 
                        value={form.nationalid} 
                        onChange={e => setForm({...form, nationalid: e.target.value})} 
                    />
                    <input 
                        type="text" 
                        placeholder="Phone Link" 
                        required 
                        className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" 
                        value={form.phone} 
                        onChange={e => setForm({...form, phone: e.target.value})} 
                    />
                    <input 
                        type="email" 
                        placeholder="Email Address" 
                        required 
                        className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" 
                        value={form.email} 
                        onChange={e => setForm({...form, email: e.target.value})} 
                    />
                    <textarea 
                        placeholder="Physical Address" 
                        required 
                        className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 h-20 shadow-inner" 
                        value={form.address} 
                        onChange={e => setForm({...form, address: e.target.value})}
                    ></textarea>
                    
                    <button 
                        type="submit" 
                        className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition shadow-sm"
                    >
                        {editingId ? 'Save Profile Changes' : 'Commit Registration'}
                    </button>
                </form>
            </div>
            
            {/* Main Interactive Data Table Registry View Component */}
            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col min-w-0">
                
                {/* Directory Header and Search Toolbar Layout Section */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                    <h2 className="text-lg font-bold text-slate-800">Customer Directory</h2>
                    
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <input 
                            type="text"
                            placeholder="Filter by name, ID, phone..."
                            className="w-full border rounded-lg pl-9 pr-8 py-1.5 text-xs focus:outline-none focus:border-blue-500 transition"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                            <button 
                                onClick={() => setSearchTerm('')}
                                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Directory List Registry */}
                <div className="divide-y divide-slate-100 overflow-x-auto">
                    {filteredCustomers.length === 0 ? (
                        <div className="py-8 text-center text-sm text-slate-400 font-medium">
                            {customers.length === 0 
                                ? "No registered client nodes detected in tracking ledger pool."
                                : "No matching customer records identified."}
                        </div>
                    ) : (
                        filteredCustomers.map(c => (
                            <div key={c.customer_id} className="py-3.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:bg-slate-50/50 px-2 rounded-lg transition">
                                <div>
                                    <h4 className="font-semibold text-slate-800">{c.fullname}</h4>
                                    <p className="text-xs text-slate-500 tracking-wider font-mono">NID: {c.nationalid}</p>
                                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-slate-600 text-xs mt-1">
                                        <span className="flex items-center gap-1">
                                            <Phone className="h-3 w-3 text-slate-400" />
                                            {c.phone}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Mail className="h-3 w-3 text-slate-400" />
                                            {c.email}
                                        </span>
                                    </div>
                                </div>
                                
                                {/* Item Interactivity Controls */}
                                <div className="flex items-center gap-2 self-end sm:self-center">
                                    {deletingId === c.customer_id ? (
                                        <div className="flex items-center gap-1 bg-red-50 border border-red-200 rounded-lg p-1 animate-fadeIn">
                                            <span className="text-[10px] font-bold text-red-700 px-1 font-mono uppercase">Purge?</span>
                                            <button 
                                                onClick={() => handleDelete(c.customer_id)}
                                                className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-[11px] font-medium transition"
                                            >
                                                Confirm
                                            </button>
                                            <button 
                                                onClick={() => setDeletingId(null)}
                                                className="p-1 text-slate-400 hover:text-slate-600 rounded"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <button 
                                                onClick={() => { setEditingId(c.customer_id); setForm(c); }} 
                                                className="p-2 border border-slate-200 hover:bg-white hover:border-blue-400 text-slate-700 hover:text-blue-600 rounded-lg flex items-center gap-1 text-xs font-medium transition bg-slate-50 shadow-sm"
                                            >
                                                <Eye className="h-3.5 w-3.5" /> Edit
                                            </button>
                                            <button 
                                                onClick={() => setDeletingId(c.customer_id)} 
                                                className="p-2 border border-transparent hover:border-red-200 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg flex items-center justify-center transition"
                                                title="Delete Registry"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default Customer;