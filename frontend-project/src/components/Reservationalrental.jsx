import React, { useEffect, useState, useRef } from 'react';
import { Play, ArrowLeftRight, CalendarPlus, ShieldX, Search, Trash2, X, Edit3, Check } from 'lucide-react';
import axiosInstance from '../api/axiosConfig';
import toast from 'react-hot-toast';

const Reservationalrental = () => {
    const [bookings, setBookings] = useState([]);
    const [customers, setCustomers] = useState([]); 
    const [vehicles, setVehicles] = useState([]);   
    const [searchTerm, setSearchTerm] = useState('');
    const [form, setForm] = useState({ customer_id: '', platenumber: '', startdate: '', enddate: '', rentalfee: '' });
    const [deletingId, setDeletingId] = useState(null); 
    
    // Inline Edit States
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({ customer_id: '', platenumber: '', startdate: '', enddate: '', rentalfee: '' });

    // Safety lock flag to prevent duplicate network requests from concurrent renders
    const isFetching = useRef(false);

    const loadWorkflowContexts = async () => {
        if (isFetching.current) return; 
        isFetching.current = true;

        try {
            const [bookingsRes, customersRes, vehiclesRes] = await Promise.all([
                axiosInstance.get('/bookings'),
                axiosInstance.get('/customers'),
                axiosInstance.get('/vehicles')
            ]);

            setBookings(Array.isArray(bookingsRes.data) ? bookingsRes.data : []);
            setCustomers(Array.isArray(customersRes.data) ? customersRes.data : []);
            
            const totalFleet = Array.isArray(vehiclesRes.data) ? vehiclesRes.data : [];
            setVehicles(totalFleet.filter(v => v.status !== 'Maintenance'));
            
        } catch (err) {
            console.error("Sync Error: ", err);
            toast.error("Error synchronizing validation structures.");
        } finally {
            isFetching.current = false;
        }
    };

    useEffect(() => { 
        loadWorkflowContexts(); 
    }, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await axiosInstance.post('/bookings', form);
            toast.success('Workflow transaction provisioned');
            setForm({ customer_id: '', platenumber: '', startdate: '', enddate: '', rentalfee: '' });
            await loadWorkflowContexts(); 
        } catch (err) {
            toast.error(err.response?.data?.error || "Validation block active.");
        }
    };

    // Initialize the Inline Row Editor with historical details
    const startEditing = (booking) => {
        setEditingId(booking.transaction_id);
        setEditForm({
            customer_id: booking.customer_id,
            platenumber: booking.platenumber,
            startdate: booking.startdate?.split('T')[0] || '',
            enddate: booking.enddate?.split('T')[0] || '',
            rentalfee: booking.rentalfee || ''
        });
    };

    const cancelEditing = () => {
        setEditingId(null);
        setEditForm({ customer_id: '', platenumber: '', startdate: '', enddate: '', rentalfee: '' });
    };

    const handleUpdate = async (id) => {
        try {
            await axiosInstance.put(`/bookings/${id}`, editForm);
            toast.success('Reservation parameters updated successfully.');
            setEditingId(null);
            await loadWorkflowContexts();
        } catch (err) {
            toast.error(err.response?.data?.error || "Failed to alter transaction history block.");
        }
    };

    const handleActivate = async (id) => {
        try {
            await axiosInstance.patch(`/bookings/${id}/activate`);
            toast.success('Rental tracking initiated.');
            await loadWorkflowContexts();
        } catch (err) {
            toast.error('Dispatch fault.');
        }
    };

    const handleReturn = async (id) => {
        try {
            await axiosInstance.patch(`/bookings/${id}/return`);
            toast.success('Asset safely returned to base.');
            await loadWorkflowContexts();
        } catch (err) {
            toast.error('Return fault.');
        }
    };

    const handleDelete = async (id) => {
        try {
            await axiosInstance.delete(`/bookings/${id}`);
            toast.success('Reservation contract securely purged.');
            setDeletingId(null);
            await loadWorkflowContexts();
        } catch (err) {
            toast.error(err.response?.data?.error || "Failed to drop transaction chain record.");
        }
    };

    const filteredBookings = bookings.filter(b => 
        b.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.platenumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.customer_id?.toString().includes(searchTerm) ||
        b.transaction_id?.toString().includes(searchTerm) ||
        b.rentalstatus?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="pt-20 px-4 max-w-7xl mx-auto flex flex-col gap-6">
            
            {/* Open Reservation Record Block Container */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <CalendarPlus className="text-blue-500" />
                    Open New Reservation / Rental Chain
                </h2>
                <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
                    
                    {/* Customer FK Relational Selection */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Customer Client Profile</label>
                        <select 
                            required 
                            className="w-full border bg-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 text-slate-700 font-medium"
                            value={form.customer_id} 
                            onChange={e => setForm({...form, customer_id: e.target.value})}
                        >
                            <option value="">-- Choose Account --</option>
                            {customers.map(c => (
                                <option key={c.id || c.customer_id} value={c.id || c.customer_id}>
                                    {c.fullname || c.customer_name} (ID: {c.id || c.customer_id})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Vehicle FK Relational Selection */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Target Fleet Asset</label>
                        <select 
                            required 
                            className="w-full border bg-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 text-slate-700 font-medium"
                            value={form.platenumber} 
                            onChange={e => setForm({...form, platenumber: e.target.value})}
                        >
                            <option value="">-- Choose Vehicle --</option>
                            {vehicles.map(v => (
                                <option key={v.platenumber} value={v.platenumber}>
                                    {v.brand} {v.model} [{v.platenumber}]
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Start Date</label>
                        <input type="date" required className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" value={form.startdate} onChange={e => setForm({...form, startdate: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">End Date</label>
                        <input type="date" required className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" value={form.enddate} onChange={e => setForm({...form, enddate: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Fee Structure (USD)</label>
                        <input type="number" required placeholder="USD" className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" value={form.rentalfee} onChange={e => setForm({...form, rentalfee: e.target.value})} />
                    </div>
                    
                    <button type="submit" className="sm:col-span-2 lg:col-span-5 w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition mt-2 shadow-sm">
                        Initialize Booking Ledger
                    </button>
                </form>
            </div>

            {/* Unified Data Layout Queue View Container */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col min-w-0">
                
                {/* Search Header Tool belt Box Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                    <h2 className="text-lg font-bold text-slate-800">Unified Workflow Ledger Queue</h2>
                    
                    <div className="relative w-full sm:w-72">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <input 
                            type="text"
                            placeholder="Filter by name, plate, ID, status..."
                            className="w-full border rounded-lg pl-9 pr-8 py-1.5 text-xs focus:outline-none focus:border-blue-500 transition"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                            <button onClick={() => setSearchTerm('')} className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600">
                                <X className="h-3.5 w-3.5" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Main Workflow Tracking Data Construct Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse min-w-[950px]">
                        <thead>
                            <tr className="border-b border-slate-200 text-slate-500 font-medium">
                                <th className="py-2.5">Transaction ID</th>
                                <th className="py-2.5">Client Details</th>
                                <th className="py-2.5">Target Asset</th>
                                <th className="py-2.5">Timeline Schedule</th>
                                <th className="py-2.5">Fee Structure</th>
                                <th className="py-2.5">Fulfill Phase</th>
                                <th className="py-2.5 text-right">Operational Actions & Maintenance</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredBookings.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="py-8 text-center text-sm text-slate-400 font-medium">
                                        {bookings.length === 0 
                                            ? "No operational chains loaded into memory arrays."
                                            : "No matching workflow records found."}
                                    </td>
                                </tr>
                            ) : (
                                filteredBookings.map(b => {
                                    const isEditingThisRow = editingId === b.transaction_id;
                                    
                                    return (
                                        <tr key={b.transaction_id} className={`transition-colors ${isEditingThisRow ? 'bg-blue-50/50' : 'hover:bg-slate-50/70'} text-slate-700`}>
                                            {/* ID */}
                                            <td className="py-3 font-mono text-xs font-bold text-slate-500">#{b.transaction_id}</td>
                                            
                                            {/* Client details / Customer select */}
                                            <td className="py-3">
                                                {isEditingThisRow ? (
                                                    <select 
                                                        className="border bg-white rounded px-2 py-1 text-xs focus:outline-none focus:border-blue-500 font-medium text-slate-700 max-w-[180px]"
                                                        value={editForm.customer_id}
                                                        onChange={e => setEditForm({...editForm, customer_id: e.target.value})}
                                                    >
                                                        {customers.map(c => (
                                                            <option key={c.id || c.customer_id} value={c.id || c.customer_id}>
                                                                {c.fullname || c.customer_name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    <>
                                                        <p className="font-semibold text-slate-900">{b.customer_name}</p>
                                                        <p className="text-xs text-slate-400 font-mono">Ref Profile ID: {b.customer_id}</p>
                                                    </>
                                                )}
                                            </td>
                                            
                                            {/* Target Asset / Vehicle select */}
                                            <td className="py-3">
                                                {isEditingThisRow ? (
                                                    <select 
                                                        className="border bg-white rounded px-2 py-1 text-xs focus:outline-none focus:border-blue-500 font-medium text-slate-700 max-w-[180px]"
                                                        value={editForm.platenumber}
                                                        onChange={e => setEditForm({...editForm, platenumber: e.target.value})}
                                                    >
                                                        {/* Adding original plate choice back in case it's filtered under maintenance state */}
                                                        <option value={b.platenumber}>{b.platenumber} (Current)</option>
                                                        {vehicles.filter(v => v.platenumber !== b.platenumber).map(v => (
                                                            <option key={v.platenumber} value={v.platenumber}>
                                                                {v.brand} {v.model} [{v.platenumber}]
                                                            </option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    <>
                                                        <p className="font-medium text-slate-800">{b.brand} {b.model}</p>
                                                        <p className="text-xs font-mono text-blue-500 font-bold">{b.platenumber}</p>
                                                    </>
                                                )}
                                            </td>
                                            
                                            {/* Timeline Schedule inputs */}
                                            <td className="py-3 text-xs font-medium">
                                                {isEditingThisRow ? (
                                                    <div className="flex flex-col gap-1 max-w-[130px]">
                                                        <input type="date" className="border rounded px-1 py-0.5 text-xs" value={editForm.startdate} onChange={e => setEditForm({...editForm, startdate: e.target.value})} />
                                                        <input type="date" className="border rounded px-1 py-0.5 text-xs" value={editForm.enddate} onChange={e => setEditForm({...editForm, enddate: e.target.value})} />
                                                    </div>
                                                ) : (
                                                    <>
                                                        <p><span className="text-slate-400 font-normal">Start:</span> {b.startdate?.split('T')[0]}</p>
                                                        <p><span className="text-slate-400 font-normal">End:</span> {b.enddate?.split('T')[0]}</p>
                                                    </>
                                                )}
                                            </td>

                                            {/* Fee Structure input */}
                                            <td className="py-3 font-semibold text-slate-800">
                                                {isEditingThisRow ? (
                                                    <input 
                                                        type="number" 
                                                        className="border rounded px-2 py-1 text-xs w-20 focus:outline-none focus:border-blue-500" 
                                                        value={editForm.rentalfee} 
                                                        onChange={e => setEditForm({...editForm, rentalfee: e.target.value})} 
                                                    />
                                                ) : (
                                                    `$${b.rentalfee || '0.00'}`
                                                )}
                                            </td>
                                            
                                            {/* Fulfill status Phase */}
                                            <td className="py-3">
                                                <span className={`inline-flex items-center rounded-full text-xs font-semibold px-2.5 py-0.5 shadow-sm ${
                                                    b.rentalstatus === 'Ongoing' ? 'bg-amber-100 text-amber-800' : 
                                                    b.rentalstatus === 'Completed' ? 'bg-emerald-100 text-emerald-800' : 
                                                    'bg-slate-100 text-slate-600'
                                                }`}>
                                                    {b.rentalstatus || 'Pending'}
                                                </span>
                                            </td>

                                            {/* Operations toolset column */}
                                            <td className="py-3 text-right">
                                                <div className="flex items-center justify-end gap-2.5">
                                                    
                                                    {/* Save / Cancel vs Workflow Actions */}
                                                    {isEditingThisRow ? (
                                                        <div className="flex items-center gap-1">
                                                            <button onClick={() => handleUpdate(b.transaction_id)} className="p-1.5 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition shadow-sm" title="Save Modifications">
                                                                <Check className="h-3.5 w-3.5" />
                                                            </button>
                                                            <button onClick={cancelEditing} className="p-1.5 bg-slate-200 text-slate-600 rounded-md hover:bg-slate-300 transition" title="Discard Changes">
                                                                <X className="h-3.5 w-3.5" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-1.5">
                                                            {/* Only allow editing parameters if the rental cycle hasn't finalized yet */}
                                                            {b.rentalstatus !== 'Completed' && (
                                                                <button onClick={() => startEditing(b)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition" title="Edit Parameters">
                                                                    <Edit3 className="h-3.5 w-3.5" />
                                                                </button>
                                                            )}
                                                            
                                                            {b.reservationstatus === 'Pending' || b.reservationstatus === 'Confirmed' ? (
                                                                <button onClick={() => handleActivate(b.transaction_id)} className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-medium inline-flex items-center gap-1 transition shadow-sm">
                                                                    <Play className="h-3 w-3 fill-current" /> Issue Vehicle
                                                                </button>
                                                            ) : b.rentalstatus === 'Ongoing' ? (
                                                                <button onClick={() => handleReturn(b.transaction_id)} className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium inline-flex items-center gap-1 transition shadow-sm">
                                                                    <ArrowLeftRight className="h-3 w-3" /> Log Return
                                                                </button>
                                                            ) : (
                                                                <span className="text-xs text-slate-400 font-medium inline-flex items-center gap-1 px-1">
                                                                    <ShieldX className="h-3.5 w-3.5" /> Closed
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* Pure / Destructive Cleaners */}
                                                    <div className="w-20 flex justify-end">
                                                        {isEditingThisRow ? null : deletingId === b.transaction_id ? (
                                                            <div className="flex items-center gap-1 bg-red-50 border border-red-200 rounded-lg p-0.5">
                                                                <button 
                                                                    onClick={() => handleDelete(b.transaction_id)}
                                                                    className="px-2 py-0.5 bg-red-600 hover:bg-red-700 text-white rounded text-[10px] font-bold uppercase transition"
                                                                >
                                                                    Drop
                                                                </button>
                                                                <button onClick={() => setDeletingId(null)} className="p-0.5 text-slate-400 hover:text-slate-600">
                                                                    <X className="h-3 w-3" />
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            b.rentalstatus === 'Ongoing' ? (
                                                                <button 
                                                                    onClick={() => toast('Active deployments cannot be safely unlinked from historical metrics.', { icon: '⚠️', style: { fontSize: '12px' } })}
                                                                    className="text-slate-200 p-1.5 cursor-not-allowed"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </button>
                                                            ) : (
                                                                <button 
                                                                    onClick={() => setDeletingId(b.transaction_id)}
                                                                    className="text-slate-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded-md transition"
                                                                    title="Purge Record"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </button>
                                                            )
                                                        )}
                                                    </div>

                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Reservationalrental;