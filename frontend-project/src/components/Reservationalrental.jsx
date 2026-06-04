import React, { useEffect, useState, useRef } from 'react';
import { CalendarPlus, Search, Trash2, X, Edit3, Check } from 'lucide-react';
import axiosInstance from '../api/axiosConfig';
import toast from 'react-hot-toast';

const Reservationalrental = () => {
    const [bookings, setBookings] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    // Default payload matching the schema data types exactly
    const initialForm = {
        customer_id: '',
        platenumber: '',
        user_id: 2, 
        reservationdate: new Date().toISOString().split('T')[0],
        startdate: '',
        enddate: '',
        reservationstatus: 'Pending',
        rentaldate: '', 
        returndate: '', 
        rentalfee: '',
        rentalstatus: 'Not Started'
    };

    const [form, setForm] = useState(initialForm);
    const [editingId, setEditingId] = useState(null);
    const [deletingId, setDeletingId] = useState(null);
    const [editForm, setEditForm] = useState(initialForm);

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
            setVehicles(Array.isArray(vehiclesRes.data) ? vehiclesRes.data : []);
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

    const validateDates = (start, end) => {
        if (new Date(end) < new Date(start)) {
            toast.error("End date cannot precede start date.");
            return false;
        }
        return true;
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!validateDates(form.startdate, form.enddate)) return;
        if (form.rentaldate && form.returndate && !validateDates(form.rentaldate, form.returndate)) return;

        try {
            // Treat empty date strings as null for the database back-end
            const payload = {
                ...form,
                rentaldate: form.rentaldate || null,
                returndate: form.returndate || null
            };

            await axiosInstance.post('/bookings', payload);
            toast.success('Workflow transaction provisioned');
            setForm(initialForm);
            await loadWorkflowContexts();
        } catch (err) {
            toast.error(err.response?.data?.error || "Validation block active.");
        }
    };

    const startEditing = (booking) => {
        setEditingId(booking.transaction_id);
        setEditForm({
            customer_id: booking.customer_id,
            platenumber: booking.platenumber,
            user_id: booking.user_id,
            reservationdate: booking.reservationdate?.split('T')[0] || '',
            startdate: booking.startdate?.split('T')[0] || '',
            enddate: booking.enddate?.split('T')[0] || '',
            reservationstatus: booking.reservationstatus,
            rentaldate: booking.rentaldate ? booking.rentaldate.split('T')[0] : '',
            returndate: booking.returndate ? booking.returndate.split('T')[0] : '',
            rentalfee: booking.rentalfee || '',
            rentalstatus: booking.rentalstatus
        });
    };

    const cancelEditing = () => {
        setEditingId(null);
        setEditForm(initialForm);
    };

    const handleUpdate = async (id) => {
        if (!validateDates(editForm.startdate, editForm.enddate)) return;

        try {
            const payload = {
                ...editForm,
                rentaldate: editForm.rentaldate || null,
                returndate: editForm.returndate || null
            };

            await axiosInstance.put(`/bookings/${id}`, payload);
            toast.success('Reservation parameters updated.');
            setEditingId(null);
            await loadWorkflowContexts();
        } catch (err) {
            toast.error(err.response?.data?.error || "Failed to update record.");
        }
    };

    const handleDelete = async (id) => {
        try {
            await axiosInstance.delete(`/bookings/${id}`);
            toast.success('Reservation contract purged.');
            setDeletingId(null);
            await loadWorkflowContexts();
        } catch (err) {
            toast.error(err.response?.data?.error || "Failed to drop record.");
        }
    };

    const filteredBookings = bookings.filter(b =>
        b.platenumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.transaction_id?.toString().includes(searchTerm) ||
        b.rentalstatus?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.reservationstatus?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatDate = (dateStr) => {
        if (!dateStr || dateStr.startsWith('0000') || dateStr === 'NULL') return '—';
        return dateStr.split('T')[0];
    };

    return (
        <div className="pt-20 px-4 max-w-7xl mx-auto flex flex-col gap-6">
            {/* Input Entry Form */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <CalendarPlus className="text-blue-500" /> Open New Reservation / Rental Chain
                </h2>
                <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Customer Client Profile</label>
                        <select required className="w-full border bg-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" value={form.customer_id} onChange={e => setForm({...form, customer_id: e.target.value})}>
                            <option value="">-- Choose Account --</option>
                            {customers.map(c => (
                                <option key={c.customer_id || c.id} value={c.customer_id || c.id}>
                                    {c.fullname || c.customer_name || `Customer ID ${c.customer_id || c.id}`}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Target Fleet Asset</label>
                        <select required className="w-full border bg-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" value={form.platenumber} onChange={e => setForm({...form, platenumber: e.target.value})}>
                            <option value="">-- Choose Vehicle --</option>
                            {vehicles.map(v => (
                                <option key={v.platenumber} value={v.platenumber}>{v.brand || ''} {v.model || ''} [{v.platenumber}]</option>
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
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Rental Date (Optional)</label>
                        <input type="date" className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" value={form.rentaldate} onChange={e => setForm({...form, rentaldate: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Return Date (Optional)</label>
                        <input type="date" className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" value={form.returndate} onChange={e => setForm({...form, returndate: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Reservation Status</label>
                        <select className="w-full border bg-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" value={form.reservationstatus} onChange={e => setForm({...form, reservationstatus: e.target.value})}>
                            <option value="Pending">Pending</option>
                            <option value="Fulfilled">Fulfilled</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Rental Status</label>
                        <select className="w-full border bg-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" value={form.rentalstatus} onChange={e => setForm({...form, rentalstatus: e.target.value})}>
                            <option value="Not Started">Not Started</option>
                            <option value="Ongoing">Ongoing</option>
                            <option value="Completed">Completed</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Fee (FRW)</label>
                        <input type="number" required placeholder="Cost amount" className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" value={form.rentalfee} onChange={e => setForm({...form, rentalfee: e.target.value})} />
                    </div>
                    
                    <button type="submit" className="sm:col-span-2 w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition shadow-sm">
                        Initialize Booking
                    </button>
                </form>
            </div>

            {/* Complete Data Ledger View */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                    <h2 className="text-lg font-bold text-slate-800">Unified DB Workflow Ledger</h2>
                    <div className="relative w-full sm:w-72">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <input type="text" placeholder="Filter entry values..." className="w-full border rounded-lg pl-9 pr-8 py-1.5 text-xs focus:outline-none focus:border-blue-500" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse min-w-[1100px]">
                        <thead>
                            <tr className="border-b border-slate-200 text-slate-500 font-medium bg-slate-50">
                                <th className="p-2.5">TX ID</th>
                                <th className="p-2.5">Cust ID</th>
                                <th className="p-2.5">Plate Number</th>
                                <th className="p-2.5">User ID</th>
                                <th className="p-2.5">Res. Date</th>
                                <th className="p-2.5">Start Date</th>
                                <th className="p-2.5">End Date</th>
                                <th className="p-2.5">Res. Status</th>
                                <th className="p-2.5">Rental Date</th>
                                <th className="p-2.5">Return Date</th>
                                <th className="p-2.5">Fee (FRW)</th>
                                <th className="p-2.5">Rental Status</th>
                                <th className="p-2.5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredBookings.map(b => {
                                const isEditing = editingId === b.transaction_id;
                                return (
                                    <tr key={b.transaction_id} className={`transition-colors ${isEditing ? 'bg-blue-50/60' : 'hover:bg-slate-50/70'}`}>
                                        <td className="p-2.5 font-mono text-slate-500">#{b.transaction_id}</td>
                                        <td className="p-2.5 font-medium">{b.customer_id}</td>
                                        <td className="p-2.5 text-blue-600 font-bold">{b.platenumber}</td>
                                        <td className="p-2.5 text-slate-500">{b.user_id}</td>
                                        
                                        <td className="p-2.5 text-slate-600">{formatDate(b.reservationdate)}</td>
                                        
                                        <td className="p-2.5">
                                            {isEditing ? (
                                                <input type="date" className="border rounded px-1.5 py-0.5 text-xs focus:outline-none focus:border-blue-500" value={editForm.startdate} onChange={e => setEditForm({...editForm, startdate: e.target.value})} />
                                            ) : formatDate(b.startdate)}
                                        </td>
                                        <td className="p-2.5">
                                            {isEditing ? (
                                                <input type="date" className="border rounded px-1.5 py-0.5 text-xs focus:outline-none focus:border-blue-500" value={editForm.enddate} onChange={e => setEditForm({...editForm, enddate: e.target.value})} />
                                            ) : formatDate(b.enddate)}
                                        </td>

                                        <td className="p-2.5">
                                            {isEditing ? (
                                                <select className="border rounded text-xs focus:outline-none focus:border-blue-500" value={editForm.reservationstatus} onChange={e => setEditForm({...editForm, reservationstatus: e.target.value})}>
                                                    <option value="Pending">Pending</option>
                                                    <option value="Fulfilled">Fulfilled</option>
                                                </select>
                                            ) : (
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${b.reservationstatus === 'Fulfilled' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'}`}>
                                                    {b.reservationstatus}
                                                </span>
                                            )}
                                        </td>

                                        <td className="p-2.5">
                                            {isEditing ? (
                                                <input type="date" className="border rounded px-1.5 py-0.5 text-xs focus:outline-none focus:border-blue-500" value={editForm.rentaldate} onChange={e => setEditForm({...editForm, rentaldate: e.target.value})} />
                                            ) : formatDate(b.rentaldate)}
                                        </td>
                                        <td className="p-2.5">
                                            {isEditing ? (
                                                <input type="date" className="border rounded px-1.5 py-0.5 text-xs focus:outline-none focus:border-blue-500" value={editForm.returndate} onChange={e => setEditForm({...editForm, returndate: e.target.value})} />
                                            ) : formatDate(b.returndate)}
                                        </td>

                                        <td className="p-2.5 font-medium text-slate-700">
                                            {isEditing ? (
                                                <input type="number" className="border rounded w-20 px-1 focus:outline-none focus:border-blue-500" value={editForm.rentalfee} onChange={e => setEditForm({...editForm, rentalfee: e.target.value})} />
                                            ) : `${Number(b.rentalfee || 0).toLocaleString()} FRW`}
                                        </td>

                                        <td className="p-2.5">
                                            {isEditing ? (
                                                <select className="border rounded text-xs focus:outline-none focus:border-blue-500" value={editForm.rentalstatus} onChange={e => setEditForm({...editForm, rentalstatus: e.target.value})}>
                                                    <option value="Not Started">Not Started</option>
                                                    <option value="Ongoing">Ongoing</option>
                                                    <option value="Completed">Completed</option>
                                                </select>
                                            ) : (
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                                    b.rentalstatus === 'Completed' ? 'bg-emerald-100 text-emerald-700' : 
                                                    b.rentalstatus === 'Ongoing' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                                                }`}>
                                                    {b.rentalstatus}
                                                </span>
                                            )}
                                        </td>
                                        
                                        <td className="p-2.5 text-right">
                                            <div className="flex justify-end items-center gap-1.5">
                                                {isEditing ? (
                                                    <>
                                                        <button onClick={() => handleUpdate(b.transaction_id)} className="p-1 bg-emerald-600 text-white rounded hover:bg-emerald-700"><Check size={12}/></button>
                                                        <button onClick={cancelEditing} className="p-1 bg-slate-200 text-slate-600 rounded hover:bg-slate-300"><X size={12}/></button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button onClick={() => startEditing(b)} className="p-1 text-slate-400 hover:text-indigo-600 transition" title="Edit row spec">
                                                            <Edit3 size={12}/>
                                                        </button>
                                                        {deletingId === b.transaction_id ? (
                                                            <div className="flex items-center gap-0.5 bg-red-50 px-1 py-0.5 rounded border border-red-200">
                                                                <button onClick={() => handleDelete(b.transaction_id)} className="px-1.5 py-0.5 bg-red-600 text-white rounded text-[10px] font-semibold">Drop</button>
                                                                <button onClick={() => setDeletingId(null)} className="text-slate-400 hover:text-slate-600"><X size={12}/></button>
                                                            </div>
                                                        ) : (
                                                            <button onClick={() => setDeletingId(b.transaction_id)} className="p-1 text-slate-400 hover:text-red-600 transition" title="Purge Record">
                                                                <Trash2 size={12}/>
                                                            </button>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Reservationalrental;
