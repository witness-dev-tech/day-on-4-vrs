import React, { useEffect, useState } from 'react';
import { Car, Users, CalendarCheck, DollarSign, RefreshCw, AlertTriangle } from 'lucide-react';
import axiosInstance from '../api/axiosConfig';
import toast from 'react-hot-toast';

const Dashboard = () => {
    const [stats, setStats] = useState({
        totalVehicles: 0,
        activeCustomers: 0,
        activeBookings: 0,
        grossRevenue: 0
    });
    const [loading, setLoading] = useState(true);

    const fetchDashboardSummary = async () => {
        setLoading(true);
        try {
            // Concurrent execution mapped exactly to your Express API routes
            // Base URL prefix is stripped out to avoid generating /api/api/ paths
            const [vehiclesRes, customersRes, bookingsRes] = await Promise.all([
                axiosInstance.get('/vehicles'),
                axiosInstance.get('/customers'),
                axiosInstance.get('/bookings') 
            ]);

            const vehicles = Array.isArray(vehiclesRes.data) ? vehiclesRes.data : [];
            const customers = Array.isArray(customersRes.data) ? customersRes.data : [];
            const bookings = Array.isArray(bookingsRes.data) ? bookingsRes.data : [];

            // Calculate metrics derived directly from state table arrays
            const activeRentalsCount = bookings.filter(b => 
                b.rentalstatus === 'Ongoing' || b.reservationstatus === 'Active'
            ).length;

            const revenueAggregation = bookings.reduce((sum, b) => {
                return sum + Number(b.rentalfee || 0);
            }, 0);

            setStats({
                totalVehicles: vehicles.length,
                activeCustomers: customers.length,
                activeBookings: activeRentalsCount,
                grossRevenue: revenueAggregation
            });

        } catch (err) {
            console.error(err);
            toast.error("Failed to load global server stats layout grids.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardSummary();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[70vh] pt-20">
                <RefreshCw className="animate-spin h-8 w-8 text-slate-800" />
            </div>
        );
    }

    const cardsConfig = [
        {
            title: "Fleet Inventory",
            value: stats.totalVehicles,
            subtitle: "Registered field assets",
            icon: <Car className="h-5 w-5 text-blue-600" />,
            bgColor: "bg-blue-50/80 border-blue-100"
        },
        {
            title: "Active Patrons",
            value: stats.activeCustomers,
            subtitle: "Verified profiles in ledger",
            icon: <Users className="h-5 w-5 text-purple-600" />,
            bgColor: "bg-purple-50/80 border-purple-100"
        },
        {
            title: "Live Operations",
            value: stats.activeBookings,
            subtitle: "Dispatched & active rentals",
            icon: <CalendarCheck className="h-5 w-5 text-amber-600" />,
            bgColor: "bg-amber-50/80 border-amber-100"
        },
        {
            title: "Gross Booked Pool",
            value: `${stats.grossRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} frw`,
            subtitle: "Accumulated pipeline fees",
            icon: <DollarSign className="h-5 w-5 text-emerald-600" />,
            bgColor: "bg-emerald-50/80 border-emerald-100"
        }
    ];

    return (
        <div className="pt-20 px-4 max-w-7xl mx-auto flex flex-col gap-6">
            
            {/* Header Status Segment */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-xl font-bold text-slate-800">Operational Dashboard</h1>
                    <p className="text-xs text-slate-500">Real-time health overview of the Vehicle Rental System</p>
                </div>
                <button 
                    onClick={fetchDashboardSummary} 
                    className="flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 transition shadow-sm"
                >
                    <RefreshCw className="h-3.5 w-3.5" /> Force Resync
                </button>
            </div>

            {/* Grid Metrics Panel */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {cardsConfig.map((card, idx) => (
                    <div key={idx} className={`p-5 rounded-xl border bg-white shadow-sm flex flex-col justify-between transition-all hover:shadow-md`}>
                        <div className="flex justify-between items-start">
                            <div>
                                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{card.title}</span>
                                <h2 className="text-2xl font-black text-slate-800 mt-1 tracking-tight">{card.value}</h2>
                            </div>
                            <div className={`p-2.5 rounded-xl border ${card.bgColor}`}>
                                {card.icon}
                            </div>
                        </div>
                        <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 font-medium">
                            {card.subtitle}
                        </div>
                    </div>
                ))}
            </div>

            {/* Subtext warning informing management about local cache structures */}
            <div className="flex items-center gap-2 text-xs bg-slate-50 border border-slate-200 rounded-xl p-4 text-slate-500 shadow-sm">
                <AlertTriangle className="h-4 w-4 text-slate-400 flex-shrink-0" />
                <span>Metrics reflect cross-referenced system tables. Ensure returned vehicle assets are processed under the rental window manager to resolve ongoing active balances instantly.</span>
            </div>
        </div>
    );
};

export default Dashboard;