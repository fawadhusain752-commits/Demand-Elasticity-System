import React, { useState, useEffect } from 'react';
import { Activity, HelpCircle, CheckCircle2, AlertTriangle } from 'lucide-react';
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Line } from 'recharts';
import { computeElasticity } from '../utils/elasticity';

export default function Analysis() {
  const [experiments, setExperiments] = useState([]);
  const [selectedExpId, setSelectedExpId] = useState('');
  const [experimentDetails, setExperimentDetails] = useState(null);
  const [observations, setObservations] = useState([]);
  
  const [obs1Id, setObs1Id] = useState('');
  const [obs2Id, setObs2Id] = useState('');
  const [result, setResult] = useState(null);
  const [calcError, setCalcError] = useState(null);

  useEffect(() => {
    fetch('/api/experiments')
      .then((res) => res.json())
      .then((data) => {
        setExperiments(data);
        if (data.length > 0) {
          setSelectedExpId(data[0].experiment_id.toString());
        }
      });
  }, []);

  useEffect(() => {
    if (!selectedExpId) return;

    fetch(`/api/experiments/${selectedExpId}/analysis`)
      .then((res) => res.json())
      .then((data) => {
        setExperimentDetails(data.experiment);
        setObservations(data.observations);
        setResult(null);
        setCalcError(null);
        // Pre-select first two observations if available
        if (data.observations.length >= 2) {
          setObs1Id(data.observations[0].observation_id.toString());
          setObs2Id(data.observations[1].observation_id.toString());
        } else {
          setObs1Id('');
          setObs2Id('');
        }
      });
  }, [selectedExpId]);

  const handleCalculate = () => {
    setCalcError(null);
    const o1 = observations.find((o) => o.observation_id.toString() === obs1Id);
    const o2 = observations.find((o) => o.observation_id.toString() === obs2Id);

    const calculation = computeElasticity(o1, o2);
    if (calculation.error) {
      setCalcError(calculation.error);
      setResult(null);
    } else {
      setResult(calculation);
    }
  };

  // Prepare chart data: sorted by price
  const chartData = observations.map((o) => ({
    price: parseFloat(o.price),
    quantity: parseInt(o.quantity_sold, 10),
  }));

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Price Elasticity Analysis</h2>
        <p className="text-sm text-slate-500">
          Midpoint Arc Elasticity calculation performed dynamically in JavaScript.
        </p>
      </div>

      {/* Experiment Picker */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center gap-3">
        <label className="text-xs font-semibold text-slate-600 whitespace-nowrap">Active Experiment:</label>
        <select
          value={selectedExpId}
          onChange={(e) => setSelectedExpId(e.target.value)}
          className="w-full sm:w-auto flex-1 px-3 py-2 rounded-lg border border-slate-300 text-sm font-medium bg-white"
        >
          {experiments.map((exp) => (
            <option key={exp.experiment_id} value={exp.experiment_id}>
              {exp.experiment_name} ({exp.product_name})
            </option>
          ))}
        </select>
      </div>

      {/* Observation Selector Box */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-5">
        <h3 className="font-semibold text-slate-800 text-sm flex items-center space-x-2">
          <Activity className="w-4 h-4 text-emerald-600" />
          <span>Select Two Observations to Compare (Midpoint Method)</span>
        </h3>

        {observations.length < 2 ? (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800 flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <span>This experiment requires at least 2 observations to calculate price elasticity. Please record them under Observations.</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Observation 1 (Point A)</label>
              <select
                value={obs1Id}
                onChange={(e) => setObs1Id(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
              >
                <option value="">-- Choose Point 1 --</option>
                {observations.map((obs) => (
                  <option key={obs.observation_id} value={obs.observation_id}>
                    ${parseFloat(obs.price).toFixed(2)} → {obs.quantity_sold} units (Obs #{obs.observation_id})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Observation 2 (Point B)</label>
              <select
                value={obs2Id}
                onChange={(e) => setObs2Id(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
              >
                <option value="">-- Choose Point 2 --</option>
                {observations.map((obs) => (
                  <option key={obs.observation_id} value={obs.observation_id}>
                    ${parseFloat(obs.price).toFixed(2)} → {obs.quantity_sold} units (Obs #{obs.observation_id})
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {observations.length >= 2 && (
          <div className="flex justify-start">
            <button
              onClick={handleCalculate}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-5 py-2.5 rounded-lg text-sm shadow transition"
            >
              Calculate Elasticity
            </button>
          </div>
        )}

        {calcError && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-700 flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <span>{calcError}</span>
          </div>
        )}
      </div>

      {/* Calculated Results Display */}
      {result && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-4">
            <div>
              <span className="text-xs uppercase font-semibold text-slate-400">Analysis Result</span>
              <h3 className="text-xl font-bold text-slate-900">{experimentDetails?.experiment_name}</h3>
            </div>
            <div className={`px-4 py-1.5 rounded-full border text-sm font-bold ${result.badgeColor}`}>
              {result.classification} (Ed = {result.ed.toFixed(3)})
            </div>
          </div>

          {/* Breakdown cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-[11px] text-slate-400 uppercase font-semibold">Observation 1</span>
              <p className="text-sm font-bold text-slate-900 mt-1">${result.p1.toFixed(2)}</p>
              <p className="text-xs text-slate-500">{result.q1} units</p>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-[11px] text-slate-400 uppercase font-semibold">Observation 2</span>
              <p className="text-sm font-bold text-slate-900 mt-1">${result.p2.toFixed(2)}</p>
              <p className="text-xs text-slate-500">{result.q2} units</p>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-[11px] text-slate-400 uppercase font-semibold">% Change in Price</span>
              <p className="text-sm font-bold text-slate-900 mt-1">{result.pctP > 0 ? `+${result.pctP}` : result.pctP}%</p>
              <p className="text-xs text-slate-500">Midpoint base</p>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-[11px] text-slate-400 uppercase font-semibold">% Change in Quantity</span>
              <p className="text-sm font-bold text-slate-900 mt-1">{result.pctQ > 0 ? `+${result.pctQ}` : result.pctQ}%</p>
              <p className="text-xs text-slate-500">Midpoint base</p>
            </div>
          </div>

          {/* Interpretation Note */}
          <div className="p-4 bg-emerald-50/50 rounded-lg border border-emerald-100 text-sm text-slate-700">
            <p className="font-semibold text-emerald-900 mb-1">Economic Interpretation:</p>
            <p>{result.explanation}</p>
          </div>
        </div>
      )}

      {/* Demand Curve Chart */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="text-base font-bold text-slate-800 mb-2">Demand Curve: Price vs Quantity Sold</h3>
        <p className="text-xs text-slate-400 mb-6">Empirical curve derived directly from recorded MySQL observations.</p>

        {chartData.length === 0 ? (
          <p className="text-center text-slate-400 py-8 text-sm">No data available to plot chart.</p>
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  type="number"
                  dataKey="price"
                  name="Price"
                  unit="$"
                  domain={['auto', 'auto']}
                  label={{ value: 'Price ($)', position: 'insideBottom', offset: -10 }}
                />
                <YAxis
                  type="number"
                  dataKey="quantity"
                  name="Quantity"
                  unit=" units"
                  domain={['auto', 'auto']}
                  label={{ value: 'Quantity Sold', angle: -90, position: 'insideLeft', offset: -4 }}
                />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  formatter={(val, name) => [val, name === 'Price' ? 'Price ($)' : 'Quantity Sold']}
                />
                <Scatter name="Observations" data={chartData} fill="#059669" line shape="circle" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}