import React, { useState, useEffect } from 'react';
import { Printer, Download, FileText } from 'lucide-react';
import { computeElasticity } from '../utils/elasticity';

export default function Reports() {
  const [experiments, setExperiments] = useState([]);
  const [selectedExpId, setSelectedExpId] = useState('');
  const [reportData, setReportData] = useState(null);

  useEffect(() => {
    fetch('/api/experiments')
      .then((res) => res.json())
      .then((data) => {
        setExperiments(data);
        if (data.length > 0) setSelectedExpId(data[0].experiment_id.toString());
      });
  }, []);

  useEffect(() => {
    if (!selectedExpId) return;
    fetch(`/api/experiments/${selectedExpId}/analysis`)
      .then((res) => res.json())
      .then((data) => setReportData(data));
  }, [selectedExpId]);

  const exportCSV = () => {
    if (!reportData || !reportData.observations.length) return;
    const headers = ['Observation_ID,Price,Quantity_Sold,Observed_At\n'];
    const rows = reportData.observations.map(
      (o) => `${o.observation_id},${o.price},${o.quantity_sold},"${o.observed_at}"\n`
    );
    const blob = new Blob([...headers, ...rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `experiment_${selectedExpId}_observations.csv`;
    a.click();
  };

  const handlePrint = () => {
    window.print();
  };

  // Pairwise midpoint calculations between consecutive observations
  const pairwiseElasticities = [];
  if (reportData && reportData.observations.length > 1) {
    const obs = reportData.observations;
    for (let i = 0; i < obs.length - 1; i++) {
      const el = computeElasticity(obs[i], obs[i + 1]);
      if (!el.error) {
        pairwiseElasticities.push({
          interval: `$${obs[i].price} → $${obs[i + 1].price}`,
          ed: el.ed,
          classification: el.classification,
          pctP: el.pctP,
          pctQ: el.pctQ,
        });
      }
    }
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 no-print">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Experimental Reports</h2>
          <p className="text-sm text-slate-500">Formal summary of observations, demand curves, and elasticity intervals.</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={exportCSV}
            className="px-3.5 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 flex items-center space-x-1.5 shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handlePrint}
            className="px-3.5 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 flex items-center space-x-1.5 shadow-sm"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Select Experiment */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3 no-print">
        <label className="text-xs font-semibold text-slate-600 whitespace-nowrap">Report for Experiment:</label>
        <select
          value={selectedExpId}
          onChange={(e) => setSelectedExpId(e.target.value)}
          className="flex-1 px-3 py-2 rounded-lg border border-slate-300 text-sm font-medium bg-white"
        >
          {experiments.map((exp) => (
            <option key={exp.experiment_id} value={exp.experiment_id}>
              {exp.experiment_name} ({exp.product_name})
            </option>
          ))}
        </select>
      </div>

      {/* Printable Report Section */}
      {reportData && (
        <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm space-y-6">
          <div className="border-b border-slate-200 pb-5">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-xl font-bold text-slate-900 uppercase tracking-wide">Demand Elasticity Report</h1>
                <p className="text-sm text-slate-500 mt-1">Experiment: {reportData.experiment.experiment_name}</p>
              </div>
              <span className="text-xs font-mono text-slate-400">
                Generated: {new Date().toLocaleDateString()}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 text-xs">
              <div>
                <span className="text-slate-400">Product:</span>
                <p className="font-semibold text-slate-800">{reportData.experiment.product_name}</p>
              </div>
              <div>
                <span className="text-slate-400">Category:</span>
                <p className="font-semibold text-slate-800">{reportData.experiment.category || 'N/A'}</p>
              </div>
              <div>
                <span className="text-slate-400">Brand:</span>
                <p className="font-semibold text-slate-800">{reportData.experiment.brand || 'N/A'}</p>
              </div>
              <div>
                <span className="text-slate-400">Location:</span>
                <p className="font-semibold text-slate-800">{reportData.experiment.location || 'Universal'}</p>
              </div>
            </div>
          </div>

          {/* Observations Table */}
          <div>
            <h3 className="text-sm font-bold text-slate-800 mb-3">1. Raw Observations</h3>
            <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Price</th>
                  <th className="py-2.5 px-3">Quantity Sold</th>
                  <th className="py-2.5 px-3">Observed Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reportData.observations.map((o) => (
                  <tr key={o.observation_id}>
                    <td className="py-2.5 px-3 font-semibold">${parseFloat(o.price).toFixed(2)}</td>
                    <td className="py-2.5 px-3">{o.quantity_sold} units</td>
                    <td className="py-2.5 px-3 text-slate-500">{new Date(o.observed_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Interval Elasticity Calculations Table */}
          <div>
            <h3 className="text-sm font-bold text-slate-800 mb-3">2. Stepwise Midpoint Elasticity Analysis</h3>
            {pairwiseElasticities.length === 0 ? (
              <p className="text-xs text-slate-400">Insufficient points for interval elasticity.</p>
            ) : (
              <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Price Interval</th>
                    <th className="py-2.5 px-3">% Δ Price</th>
                    <th className="py-2.5 px-3">% Δ Quantity</th>
                    <th className="py-2.5 px-3">Elasticity (Ed)</th>
                    <th className="py-2.5 px-3">Classification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pairwiseElasticities.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-2.5 px-3 font-medium">{item.interval}</td>
                      <td className="py-2.5 px-3">{item.pctP}%</td>
                      <td className="py-2.5 px-3">{item.pctQ}%</td>
                      <td className="py-2.5 px-3 font-bold font-mono">{item.ed.toFixed(3)}</td>
                      <td className="py-2.5 px-3">
                        <span className="font-semibold text-emerald-800">{item.classification}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}