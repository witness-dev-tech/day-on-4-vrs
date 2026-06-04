import React, { useEffect, useState, useMemo } from 'react';
import { RefreshCw, Search, Download } from 'lucide-react';
import axiosInstance from '../api/axiosConfig';
import toast from 'react-hot-toast';

const CONFIG = {
    columns: ['Customer', 'Phone', 'Plate', 'Brand', 'Model', 'Year', 'Type', 'Res. Date', 'Res. Status', 'Rental Date', 'Fee', 'Status'],
    fields: ['customer_fullname', 'phone', 'platenumber', 'brand', 'model', 'year', 'vehicletype', 'reservationdate', 'reservationstatus', 'rentaldate', 'rentalfee', 'rentalstatus']
};

const Report = () => {
    const [reportType, setReportType] = useState('daily');
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchReport = async () => {
            setLoading(true);
            try {
                const { data: res } = await axiosInstance.get(`/reports/${reportType}`);
                setData(Array.isArray(res) ? res : []);
            } catch (err) {
                toast.error("Failed to fetch registry.");
            } finally {
                setLoading(false);
            }
        };
        fetchReport();
    }, [reportType]);

    const filteredData = useMemo(() => {
        const s = searchTerm.toLowerCase();
        return data.filter(r => CONFIG.fields.some(k => String(r[k] || '').toLowerCase().includes(s)));
    }, [data, searchTerm]);

    // Client-side CSV generation handler
    const handleExportCSV = () => {
        if (filteredData.length === 0) {
            toast.error("No dataset available to export.");
            return;
        }

        // 1. Map columns header row strings
        const headers = CONFIG.columns.join(',');

        // 2. Map data body strings safely escaping nested commas or strings
        const rows = filteredData.map(row => 
            CONFIG.fields.map(field => {
                const value = row[field] ? String(row[field]).replace(/"/g, '""') : '';
                return `"${value}"`;
            }).join(',')
        );

        // 3. Assemble complete CSV structural string matrix
        const csvContent = [headers, ...rows].join('\n');
        
        // 4. Mount trigger wrapper anchor tag element download node pipeline
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        
        link.setAttribute('href', url);
        link.setAttribute('download', `swiftwheels_registry_${reportType}_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast.success("Registry file exported successfully.");
    };

    return (
        <div className="pt-20 px-4 max-w-[95rem] mx-auto">
            <div className="bg-white border p-6 rounded-xl shadow-sm">
                <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                    <h1 className="text-xl font-bold uppercase tracking-wide">Registry: {reportType}</h1>
                    
                    <div className="flex items-center gap-4">
                        {/* Period Filter Selector Switches */}
                        <div className="flex gap-2">
                            {['daily', 'weekly', 'monthly'].map(t => (
                                <button key={t} onClick={() => setReportType(t)} 
                                    className={`px-4 py-2 rounded-lg text-xs font-bold transition ${reportType === t ? 'bg-slate-900 text-white' : 'bg-slate-100 hover:bg-slate-200'}`}>
                                    {t.toUpperCase()}
                                </button>
                            ))}
                        </div>

                        {/* Dynamic Action CSV Export Trigger Button */}
                        <button 
                            onClick={handleExportCSV}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-[#0D9488] hover:bg-[#0F766E] text-white transition shadow-sm"
                            title="Export to Spreadsheet"
                        >
                            <Download className="h-3.5 w-3.5" />
                            <span>EXPORT</span>
                        </button>
                    </div>
                </div>

                <div className="relative mb-6">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input 
                        className="w-full border rounded-lg pl-9 py-2 text-sm" 
                        placeholder="Search by customer, plate, or status..." 
                        onChange={e => setSearchTerm(e.target.value)} 
                    />
                </div>

                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="py-20 text-center"><RefreshCw className="animate-spin inline h-8 w-8 text-slate-400" /></div>
                    ) : (
                        <table className="w-full text-[10px] text-left border-collapse">
                            <thead className="bg-slate-50 text-slate-500 uppercase">
                                <tr>{CONFIG.columns.map(c => <th key={c} className="px-3 py-3 border-b">{c}</th>)}</tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredData.map((row, i) => (
                                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                                        {CONFIG.fields.map(f => (
                                            <td key={f} className="px-3 py-3 whitespace-nowrap text-slate-700">{row[f] || '-'}</td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Report;
