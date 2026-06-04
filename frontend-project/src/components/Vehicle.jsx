import React, { useEffect, useState, useRef } from 'react';
import { PlusCircle, Edit2, Search, Trash2, X } from 'lucide-react';
import axiosInstance from '../api/axiosConfig';
import toast from 'react-hot-toast';

const Vehicle = () => {
    const [vehicles, setVehicles] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [form, setForm] = useState({ 
        platenumber: '', 
        brand: '', 
        model: '', 
        year: new Date().getFullYear(), 
        vehicletype: 'SUV', 
        purchase_price: '',
        status: 'Available' 
    });
    const [editingPlate, setEditingPlate] = useState(null);
    const [deletingPlate, setDeletingPlate] = useState(null); 

    // Throttling lock to stop parallel double-fetching loops 
    const isFetching = useRef(false);

    const loadVehicles = async () => {
        if (isFetching.current) return;
        isFetching.current = true;
        
        try {
            const res = await axiosInstance.get('/vehicles');
            setVehicles(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            toast.error("Failed to read operational grid.");
            setVehicles([]);
        } finally {
            isFetching.current = false;
        }
    };

    useEffect(() => { 
        loadVehicles(); 
    }, []);

    const resetFormState = () => {
        setForm({ 
            platenumber: '', 
            brand: '', 
            model: '', 
            year: new Date().getFullYear(), 
            vehicletype: 'SUV', 
            purchase_price: '',
            status: 'Available' 
        });
        setEditingPlate(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingPlate) {
                // Hits: PUT /api/vehicles/:platenumber
                await axiosInstance.put(`/vehicles/${editingPlate}`, form);
                toast.success('Asset variables re-calibrated');
            } else {
                // Hits: POST /api/vehicles
                await axiosInstance.post('/vehicles', form);
                toast.success('Asset securely pooled to logistics array');
            }
            resetFormState();
            loadVehicles();
        } catch (err) {
            // Displays express-validator messages or standard backend error strings
            const backendError = err.response?.data?.errors?.[0]?.msg || err.response?.data?.error;
            toast.error(backendError || "Submission rejected by gateway validation.");
        }
    };

    const handleDelete = async (plate) => {
        try {
            // Hits the newly added: DELETE /api/vehicles/:platenumber
            await axiosInstance.delete(`/vehicles/${plate}`);
            toast.success('Asset purged successfully from inventory');
            
            if (editingPlate === plate) resetFormState();
            setDeletingPlate(null);
            loadVehicles();
        } catch (err) {
            // Catches foreign key rejection issues safely if it's referenced in reservations
            toast.error(err.response?.data?.error || "Failed to drop asset from ledger structures.");
        }
    };

    const filteredVehicles = vehicles.filter(v => 
        v.platenumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.vehicletype?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.status?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.year?.toString().includes(searchTerm)
    );

    return (
        <div className="pt-20 px-4 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Input & Variable Customization Node Panel */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm h-fit">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <PlusCircle className="text-blue-500" />
                        {editingPlate ? 'Edit Fleet Asset' : 'Log Fleet Asset'}
                    </h2>
                    {editingPlate && (
                        <button 
                            type="button" 
                            onClick={resetFormState}
                            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 transition"
                            title="Cancel Modification"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="space-y-3">
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Plate Registration Code</label>
                        <input type="text" placeholder="e.g., RAA100A" required disabled={!!editingPlate} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-500 font-mono uppercase font-semibold" value={form.platenumber} onChange={e => setForm({...form, platenumber: e.target.value})} />
                    </div>
                    
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Brand Make</label>
                        <input type="text" placeholder="e.g., Toyota" required className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" value={form.brand} onChange={e => setForm({...form, brand: e.target.value})} />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Model Variant</label>
                        <input type="text" placeholder="e.g., RAV4" required className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" value={form.model} onChange={e => setForm({...form, model: e.target.value})} />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Production Year</label>
                        <input type="number" placeholder="Year" required className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" value={form.year} onChange={e => setForm({...form, year: e.target.value})} />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Vehicle Classification Type</label>
                        <input type="text" placeholder="e.g., SUV, Sedan, Truck" required className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" value={form.vehicletype} onChange={e => setForm({...form, vehicletype: e.target.value})} />
                    </div>
                    
                    {!editingPlate && (
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">Purchase Valuation (USD)</label>
                            <input type="number" step="0.01" placeholder="Valuation Price" required className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" value={form.purchase_price} onChange={e => setForm({...form, purchase_price: e.target.value})} />
                        </div>
                    )}
                    
                    {editingPlate && (
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">Fleet Lifecycle State</label>
                            <select className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 bg-white text-slate-700 font-medium" value={form.status || 'Available'} onChange={e => setForm({...form, status: e.target.value})}>
                                <option value="Available">Available</option>
                                <option value="Rented">Rented Out</option>
                                <option value="Maintenance">Maintenance Hold</option>
                            </select>
                        </div>
                    )}
                    
                    <button type="submit" className="w-full py-2.5 bg-slate-900 text-white rounded-lg font-medium text-sm hover:bg-slate-800 transition shadow-sm mt-4">
                        {editingPlate ? 'Commit Variable Changes' : 'Append to Active Fleet'}
                    </button>
                </form>
            </div>

            {/* Core Registry Storage Table Layout View */}
            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col min-w-0">
                
                {/* Registry Management Header Section */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                    <h2 className="text-lg font-bold text-slate-800">Vehicle management</h2>
                    
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <input 
                            type="text"
                            placeholder="Search plates, brand, status..."
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

                {/* Grid Canvas Table Data Struct */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse min-w-[500px]">
                        <thead>
                            <tr className="border-b border-slate-200 text-slate-500 font-medium">
                                <th className="py-2.5">Plate Identification</th>
                                <th className="py-2.5">Make / Model</th>
                                <th className="py-2.5">Classification</th>
                                <th className="py-2.5">Status Flag</th>
                                <th className="py-2.5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredVehicles.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="py-8 text-center text-sm text-slate-400 font-medium">
                                        {vehicles.length === 0 
                                            ? "No registered asset nodes detected in logistics pool."
                                            : "No matching vehicle assets located."}
                                    </td>
                                </tr>
                            ) : (
                                filteredVehicles.map(v => (
                                    <tr key={v.platenumber} className="hover:bg-slate-50/70 transition-colors">
                                        <td className="py-3 font-mono text-xs font-bold text-blue-600">{v.platenumber}</td>
                                        <td className="py-3 text-slate-800 font-medium">
                                            {v.brand} {v.model} <span className="text-xs text-slate-400 font-mono font-normal">({v.year})</span>
                                        </td>
                                        <td className="py-3 text-xs text-slate-500 font-medium">{v.vehicletype}</td>
                                        <td className="py-3">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold shadow-sm ${
                                                v.status === 'Available' ? 'bg-emerald-100 text-emerald-800' : 
                                                v.status === 'Rented' ? 'bg-amber-100 text-amber-800' : 
                                                'bg-red-100 text-red-800'
                                            }`}>
                                                {v.status || 'Available'}
                                            </span>
                                        </td>
                                        <td className="py-3 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {deletingPlate === v.platenumber ? (
                                                    <div className="flex items-center gap-1 bg-red-50 border border-red-200 rounded-lg p-1">
                                                        <span className="text-[10px] font-bold text-red-700 px-1 font-mono uppercase">Purge?</span>
                                                        <button 
                                                            onClick={() => handleDelete(v.platenumber)}
                                                            className="px-2 py-0.5 bg-red-600 hover:bg-red-700 text-white rounded text-[11px] font-medium transition shadow-sm"
                                                        >
                                                            Drop
                                                        </button>
                                                        <button onClick={() => setDeletingPlate(null)} className="p-0.5 text-slate-400 hover:text-slate-600">
                                                            <X className="h-3 w-3" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <button 
                                                            onClick={() => { 
                                                                setEditingPlate(v.platenumber); 
                                                                setForm({
                                                                    platenumber: v.platenumber || '',
                                                                    brand: v.brand || '',
                                                                    model: v.model || '',
                                                                    year: v.year || new Date().getFullYear(),
                                                                    vehicletype: v.vehicletype || 'SUV',
                                                                    purchase_price: v.purchase_price || '',
                                                                    status: v.status || 'Available'
                                                                }); 
                                                            }} 
                                                            className="text-indigo-600 hover:text-indigo-800 p-1.5 hover:bg-indigo-50 rounded-md transition"
                                                            title="Edit Asset Details"
                                                        >
                                                            <Edit2 className="h-4 w-4" />
                                                        </button>
                                                        <button 
                                                            onClick={() => setDeletingPlate(v.platenumber)}
                                                            className="text-slate-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded-md transition"
                                                            title="Purge Asset Profile"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Vehicle;