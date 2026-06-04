import React, { useEffect, useState } from 'react';
import { Calendar, BarChart, ClipboardList, RefreshCw, Search, X, DollarSign, TrendingUp, Download } from 'lucide-react';
import axiosInstance from '../api/axiosConfig';
import toast from 'react-hot-toast';

const Report = () => {
    const [reportType, setReportType] = useState('daily');
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchReport = async (type) => {
        setLoading(true);
        try {
            // Evaluates dynamically to /reports/daily, /reports/weekly, or /reports/monthly
            // matching your global axiosInstance base path layout
            const res = await axiosInstance.get(`/reports/${type}`);
            setData(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            toast.error(err.response?.data?.error || "Could not compile analytics layout records.");
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    // Automatically pulls operational metrics when context toggles
    useEffect(() => {
        fetchReport(reportType);
    }, [reportType]);

    // Financial Metrics Evaluators
    const calculateTotalRevenue = (dataset) => {
        return dataset.reduce((acc, row) => {
            const valuation = Number(row.rentalfee || row.monthly_revenue_contribution || row.total_estimated_revenue || 0);
            return acc + valuation;
        }, 0);
    };

    const calculateRealizedRevenue = (dataset) => {
        return dataset.reduce((acc, row) => {
            const realized = Number(row.realized_revenue || (row.rentalstatus === 'Completed' || row.rentalstatus === 'Ongoing' ? row.rentalfee : 0));
            return acc + realized;
        }, 0);
    };

    // Client-side quick filter logic matching cross-join relational metrics
    const filteredData = data.filter(row => {
        const clientName = (row.customer_fullname || '').toLowerCase();
        const nationalId = (row.nationalid || '').toLowerCase();
        const plate = (row.platenumber || '').toLowerCase();
        const assetClass = (row.vehicletype || row.brand || row.model || '').toLowerCase();
        const search = searchTerm.toLowerCase();

        return clientName.includes(search) || 
               nationalId.includes(search) || 
               plate.includes(search) || 
               assetClass.includes(search);
    });

    // CSV Extraction Engine
    const handleExportCSV = () => {
        if (filteredData.length === 0) return toast.error("No record streams available to extract.");

        const headers = reportType === 'daily' 
            ? ['Transaction ID', 'Customer', 'National ID', 'Plate No', 'Brand', 'Model', 'Status', 'Revenue']
            : reportType === 'weekly'
            ? ['Week Period', 'Customer', 'National ID', 'Vehicle Type', 'Bookings Volume', 'Estimated Rev', 'Realized Rev']
            : ['Month Period', 'Customer', 'National ID', 'Brand', 'Model', 'Plate No', 'Rented Volume', 'Monthly Contribution'];

        const rows = filteredData.map(row => {
            if (reportType === 'daily') {
                return [row.transaction_id, row.customer_fullname, row.nationalid, row.platenumber, row.brand, row.model, row.rentalstatus, row.rentalfee];
            } else if (reportType === 'weekly') {
                return [row.report_week, row.customer_fullname, row.nationalid, row.vehicletype, row.total_bookings_this_week, row.total_estimated_revenue, row.realized_revenue];
            } else {
                return [row.report_month, row.customer_fullname, row.nationalid, row.brand, row.model, row.platenumber, row.times_rented_this_month, row.monthly_revenue_contribution];
            }
        });

        const csvContent = "data:text/csv;charset=utf-8," 
            + [headers.join(','), ...rows.map(e => e.map(val => `"${val ?? ''}"`).join(','))].join('\n');
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `VRS_${reportType}_report_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("CSV dataset exported successfully.");
    };

    return (
        <div className="pt-20 px-4 max-w-7xl mx-auto flex flex-col gap-6">
            
            {/* Control Strip Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                <div>
                    <h1 className="text-xl font-bold text-slate-800">Operational Intelligence Engine</h1>
                    <p className="text-xs text-slate-500">Interval database analytics and dynamic transaction ledgers</p>
                </div>
                
                <div className="flex rounded-lg border bg-slate-50 p-1 gap-1 w-full sm:w-auto">
                    <button 
                        onClick={() => setReportType('daily')} 
                        className={`flex-1 sm:flex-none px-4 py-1.5 rounded-md text-sm font-medium flex items-center justify-center gap-1 transition ${reportType === 'daily' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-white'}`}
                    >
                        <Calendar className="h-4 w-4" /> Daily
                    </button>
                    <button 
                        onClick={() => setReportType('weekly')} 
                        className={`flex-1 sm:flex-none px-4 py-1.5 rounded-md text-sm font-medium flex items-center justify-center gap-1 transition ${reportType === 'weekly' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-white'}`}
                    >
                        <BarChart className="h-4 w-4" /> Weekly
                    </button>
                    <button 
                        onClick={() => setReportType('monthly')} 
                        className={`flex-1 sm:flex-none px-4 py-1.5 rounded-md text-sm font-medium flex items-center justify-center gap-1 transition ${reportType === 'monthly' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-white'}`}
                    >
                        <ClipboardList className="h-4 w-4" /> Monthly
                    </button>
                </div>
            </div>

            {/* Aggregated Analytical Core Widgets */}
            {!loading && data.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm flex items-center justify-between">
                        <div>
                            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Gross Booked</span>
                            <h3 className="text-2xl font-bold text-slate-800 mt-1">
                                {calculateTotalRevenue(filteredData).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} frw
                            </h3>
                        </div>
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                            <DollarSign className="h-5 w-5" />
                        </div>
                    </div>

                    <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm flex items-center justify-between">
                        <div>
                            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Liquid Realized Cash</span>
                            <h3 className="text-2xl font-bold text-emerald-600 mt-1">
                                {calculateRealizedRevenue(filteredData).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} frw
                            </h3>
                        </div>
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
                            <TrendingUp className="h-5 w-5" />
                        </div>
                    </div>
                    
                    <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm flex items-center justify-between sm:col-span-2 lg:col-span-1">
                        <div>
                            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Stream Volume</span>
                            <h3 className="text-2xl font-bold text-slate-700 mt-1">
                                {filteredData.length} <span className="text-xs text-slate-400 font-normal">Matching Rows</span>
                            </h3>
                        </div>
                        <button 
                            onClick={handleExportCSV}
                            className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
                            title="Export to CSV Spreadsheet"
                        >
                            <Download className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            )}

            {/* Central Audit Registry Canvas */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col min-w-0">
                
                {/* Search Bar Dynamic Interface */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                    <h2 className="text-sm font-bold text-slate-800 capitalize">{reportType} Financial Registry Audit</h2>
                    
                    <div className="relative w-full sm:w-72">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <input 
                            type="text"
                            placeholder="Filter by customer, ID, plate..."
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

                {/* Main Data Presentation Surface */}
                {loading ? (
                    <div className="flex justify-center py-16 text-slate-400">
                        <RefreshCw className="animate-spin h-8 w-8 text-slate-800" />
                    </div>
                ) : filteredData.length === 0 ? (
                    <div className="text-slate-400 text-center py-16 text-sm font-medium">
                        No operations or transaction records could be queried for this context block.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm border-collapse min-w-[800px]">
                            <thead>
                                <tr className="border-b border-slate-200 text-slate-500 font-medium">
                                    <th className="py-2.5">Customer Profile</th>
                                    <th className="py-2.5">Identifier (NID)</th>
                                    
                                    {/* Conditional Headings Based on Active Endpoint Data Matrix */}
                                    {reportType === 'daily' && (
                                        <>
                                            <th className="py-2.5">Asset Placed</th>
                                            <th className="py-2.5">Logistics Status</th>
                                            <th className="py-2.5">System Clerk</th>
                                        </>
                                    )}
                                    {reportType === 'weekly' && (
                                        <>
                                            <th className="py-2.5">Target Scope Class</th>
                                            <th className="py-2.5">Total Cycles Run</th>
                                            <th className="py-2.5">Realized Revenue Pool</th>
                                        </>
                                    )}
                                    {reportType === 'monthly' && (
                                        <>
                                            <th className="py-2.5">Assigned Core Asset</th>
                                            <th className="py-2.5">Plate Identification</th>
                                            <th className="py-2.5">Frequency Vol</th>
                                        </>
                                    )}
                                    
                                    <th className="py-2.5 text-right">Revenue Contributed</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-700">
                                {filteredData.map((row, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                                        <td className="py-3">
                                            <div className="font-semibold text-slate-900">{row.customer_fullname}</div>
                                            {row.report_week && <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded font-mono text-slate-500 font-bold">Week: {row.report_week}</span>}
                                            {row.report_month && <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded font-mono text-slate-500 font-bold">Month: {row.report_month}</span>}
                                        </td>
                                        <td className="py-3 font-mono text-xs text-slate-500">{row.nationalid}</td>
                                        
                                        {/* Daily Row Schema mapping */}
                                        {reportType === 'daily' && (
                                            <>
                                                <td className="py-3 text-xs">
                                                    <span className="font-medium text-slate-800">{row.brand} {row.model}</span>
                                                    <p className="font-mono text-[11px] text-blue-500 font-bold">{row.platenumber}</p>
                                                </td>
                                                <td className="py-3">
                                                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                                                        row.rentalstatus === 'Completed' ? 'bg-emerald-100 text-emerald-800' : 
                                                        row.rentalstatus === 'Ongoing' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                                                    }`}>
                                                        {row.rentalstatus || row.reservationstatus}
                                                    </span>
                                                </td>
                                                <td className="py-3 text-xs font-medium text-slate-500">{row.processed_by || 'System Automation'}</td>
                                            </>
                                        )}

                                        {/* Weekly Row Schema mapping */}
                                        {reportType === 'weekly' && (
                                            <>
                                                <td className="py-3 text-xs font-semibold text-slate-600 uppercase">{row.vehicletype}</td>
                                                <td className="py-3 font-medium text-xs">{row.total_bookings_this_week} Deals</td>
                                                <td className="py-3 font-mono text-xs font-bold text-emerald-600">
                                                    {Number(row.realized_revenue).toLocaleString(undefined, { minimumFractionDigits: 2 })} frw
                                                </td>
                                            </>
                                        )}

                                        {/* Monthly Row Schema mapping */}
                                        {reportType === 'monthly' && (
                                            <>
                                                <td className="py-3 text-xs font-medium text-slate-800">{row.brand} {row.model}</td>
                                                <td className="py-3 font-mono text-xs text-blue-500 font-bold">{row.platenumber}</td>
                                                <td className="py-3 text-xs font-medium">{row.times_rented_this_month} Dispatches</td>
                                            </>
                                        )}
                                        
                                        {/* Financial Metric Output Column */}
                                        <td className="py-3 text-right font-mono font-bold text-slate-900">
                                            {Number(row.rentalfee || row.total_estimated_revenue || row.monthly_revenue_contribution || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} frw
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Report;