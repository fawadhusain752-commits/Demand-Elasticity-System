import React, { useState, useEffect } from 'react';
import { Package, FlaskConical, Eye, TrendingUp, ArrowRight } from 'lucide-react';

export default function Dashboard({ onNavigate }) {
  const [data, setData] = useState({
    stats: { totalProducts: 0, totalExperiments: 0, totalObservations: 0 },
    recentExperiments: [],
    recentObservations: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard')
      .then((res) => res.json())
      .then((resData) => {
        setData(resData);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-slate-500 font-medium">Loading live dashboard metrics...</div>;
  }

  return (
    <div className="space-y-8 max-w-6xl">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">System Dashboard</h2>
        <p className="text-sm text-slate-500">Live overview of product catalogs, price trials, and empirical observations.</p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs uppercase font-semibold text-slate-400">Total Products</p>
            <h3 className="text-3xl font-extrabold text-slate-900 mt-1">{data.stats.totalProducts}</h3>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <Package className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs uppercase font-semibold text-slate-400">Active Experiments</p>
            <h3 className="text-3xl font-extrabold text-slate-900 mt-1">{data.stats.totalExperiments}</h3>
          </div>
          <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
            <FlaskConical className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs uppercase font-semibold text-slate-400">Recorded Observations</p>
            <h3 className="text-3xl font-extrabold text-slate-900 mt-1">{data.stats.totalObservations}</h3>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <Eye className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Quick Launch Elasticity Action */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-xl p-6 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h4 className="text-lg font-bold">Ready to analyze Price Elasticity?</h4>
          <p className="text-emerald-100 text-sm mt-1">
            Compute midpoint Arc Elasticity between two observation price points and view demand curve charts.
          </p>
        </div>
        <button
          onClick={() => onNavigate('analysis')}
          className="bg-white text-emerald-800 hover:bg-emerald-50 font-semibold px-4 py-2.5 rounded-lg flex items-center space-x-2 text-sm shadow transition"
        >
          <span>Run Elasticity Engine</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Recent Experiments & Observations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-base font-semibold text-slate-800 mb-4">Recent Experiments</h3>
          {data.recentExperiments.length === 0 ? (
            <p className="text-sm text-slate-400">No experiments found in database.</p>
          ) : (
            <div className="space-y-3">
              {data.recentExperiments.map((exp) => (
                <div key={exp.experiment_id} className="p-3 rounded-lg bg-slate-50 border border-slate-100 flex justify-between items-center">
                  <div>
                    <h4 className="font-semibold text-sm text-slate-800">{exp.experiment_name}</h4>
                    <p className="text-xs text-slate-500">Product: {exp.product_name} • {exp.location || 'Online / Global'}</p>
                  </div>
                  <span className="text-xs font-mono text-slate-400">ID #{exp.experiment_id}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-base font-semibold text-slate-800 mb-4">Recent Observations</h3>
          {data.recentObservations.length === 0 ? (
            <p className="text-sm text-slate-400">No observations entered yet.</p>
          ) : (
            <div className="space-y-3">
              {data.recentObservations.map((obs) => (
                <div key={obs.observation_id} className="p-3 rounded-lg bg-slate-50 border border-slate-100 flex justify-between items-center">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      ${parseFloat(obs.price).toFixed(2)} → <span className="text-emerald-700">{obs.quantity_sold} sold</span>
                    </p>
                    <p className="text-xs text-slate-500">{obs.experiment_name}</p>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">
                    {new Date(obs.observed_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}