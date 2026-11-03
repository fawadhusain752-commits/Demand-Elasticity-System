import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Package, FlaskConical, LineChart, FileSpreadsheet, Eye, Activity } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Experiments from './pages/Experiments';
import Observations from './pages/Observations';
import Analysis from './pages/Analysis';
import Reports from './pages/Reports';

export default function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [dbStatus, setDbStatus] = useState('checking');

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => setDbStatus(data.status))
      .catch(() => setDbStatus('offline'));
  }, []);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'experiments', label: 'Experiments', icon: FlaskConical },
    { id: 'observations', label: 'Observations', icon: Eye },
    { id: 'analysis', label: 'Elasticity Analysis', icon: Activity },
    { id: 'reports', label: 'Reports', icon: FileSpreadsheet },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 text-slate-800">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-slate-900 text-white p-5 flex flex-col justify-between shadow-xl">
        <div>
          <div className="flex items-center space-x-3 mb-8">
            <div className="p-2 bg-emerald-600 rounded-lg text-white">
              <LineChart className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight tracking-wide">Demand Elasticity</h1>
              <span className="text-xs text-emerald-400 font-medium">Experiment Platform</span>
            </div>
          </div>

          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentPage(item.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Database Connection Status badge */}
        <div className="mt-8 pt-4 border-t border-slate-800 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">MySQL: demand_elasticity</span>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                dbStatus === 'online'
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-700'
                  : 'bg-rose-950 text-rose-400 border border-rose-700'
              }`}
            >
              <span className={`w-1.5 h-1.5 mr-1.5 rounded-full ${dbStatus === 'online' ? 'bg-emerald-400' : 'bg-rose-500'}`} />
              {dbStatus === 'online' ? 'Connected' : 'Offline'}
            </span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        {currentPage === 'dashboard' && <Dashboard onNavigate={setCurrentPage} />}
        {currentPage === 'products' && <Products />}
        {currentPage === 'experiments' && <Experiments onNavigate={setCurrentPage} />}
        {currentPage === 'observations' && <Observations />}
        {currentPage === 'analysis' && <Analysis />}
        {currentPage === 'reports' && <Reports />}
      </main>
    </div>
  );
}