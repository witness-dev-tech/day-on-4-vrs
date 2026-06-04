import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';

const NotFound = () => (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
        <AlertCircle className="h-16 w-16 text-slate-400 mb-4" />
        <h1 className="text-3xl font-bold text-slate-800 mb-2">404 - Page Not Found</h1>
        <p className="text-slate-600 mb-6 text-center">The dashboard path or entity collection you are requesting is missing.</p>
        <Link to="/" className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg shadow hover:bg-blue-700 transition">
            Return to Safety
        </Link>
    </div>
);

export default NotFound;