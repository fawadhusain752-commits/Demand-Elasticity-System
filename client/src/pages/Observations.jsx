import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, AlertCircle } from 'lucide-react';

export default function Observations() {
  const [experiments, setExperiments] = useState([]);
  const [selectedExpId, setSelectedExpId] = useState('');
  const [observations, setObservations] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    price: '',
    quantity_sold: '',
    observed_at: new Date().toISOString().slice(0, 16),
  });
  const [message, setMessage] = useState({ type: '', text: '' });

  // Load list of experiments
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

  // Fetch observations whenever selected experiment changes
  const fetchObservations = async (expId) => {
    if (!expId) return;
    try {
      const res = await fetch(`/api/experiments/${expId}/observations`);
      const data = await res.json();
      setObservations(data);
    } catch (err) {
      setMessage({ type: 'error', text: 'Error retrieving observations.' });
    }
  };

  useEffect(() => {
    if (selectedExpId) {
      fetchObservations(selectedExpId);
    }
  }, [selectedExpId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedExpId) return;

    if (parseFloat(form.price) <= 0) {
      setMessage({ type: 'error', text: 'Price must be strictly positive.' });
      return;
    }
    if (parseInt(form.quantity_sold, 10) < 0) {
      setMessage({ type: 'error', text: 'Quantity sold must be non-negative.' });
      return;
    }

    const url = editingId ? `/api/observations/${editingId}` : `/api/experiments/${selectedExpId}/observations`;
    const method = editingId ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setMessage({ type: 'success', text: editingId ? 'Observation updated.' : 'Observation recorded.' });
      setEditingId(null);
      setForm({ price: '', quantity_sold: '', observed_at: new Date().toISOString().slice(0, 16) });
      fetchObservations(selectedExpId);
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this observation record?')) return;
    try {
      const res = await fetch(`/api/observations/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessage({ type: 'success', text: 'Observation deleted.' });
      fetchObservations(selectedExpId);
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleEdit = (obs) => {
    setEditingId(obs.observation_id);
    setForm({
      price: obs.price,
      quantity_sold: obs.quantity_sold,
      observed_at: new Date(obs.observed_at).toISOString().slice(0, 16),
    });
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Observations Recording</h2>
        <p className="text-sm text-slate-500">Record empirical price points and corresponding demand quantities.</p>
      </div>

      {message.text && (
        <div
          className={`p-3 rounded-lg text-sm font-medium ${
            message.type === 'error' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Experiment Selector Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center gap-3">
        <label className="text-xs font-semibold text-slate-600 whitespace-nowrap">Choose Experiment:</label>
        <select
          value={selectedExpId}
          onChange={(e) => setSelectedExpId(e.target.value)}
          className="w-full sm:w-auto flex-1 px-3 py-2 rounded-lg border border-slate-300 text-sm font-medium bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          {experiments.map((exp) => (
            <option key={exp.experiment_id} value={exp.experiment_id}>
              {exp.experiment_name} (Product: {exp.product_name})
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Container */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm h-fit">
          <h3 className="font-bold text-slate-900 text-sm mb-4">
            {editingId ? 'Edit Observation' : 'Record New Observation'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Price ($) *</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="100.00"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Quantity Sold (units) *</label>
              <input
                type="number"
                min="0"
                step="1"
                required
                placeholder="100"
                value={form.quantity_sold}
                onChange={(e) => setForm({ ...form, quantity_sold: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Observed Timestamp *</label>
              <input
                type="datetime-local"
                required
                value={form.observed_at}
                onChange={(e) => setForm({ ...form, observed_at: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
              />
            </div>

            <div className="flex gap-2 pt-2">
              {editingId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setForm({ price: '', quantity_sold: '', observed_at: new Date().toISOString().slice(0, 16) });
                  }}
                  className="w-1/3 px-3 py-2 border rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                className="flex-1 bg-emerald-600 text-white rounded-lg text-sm font-semibold py-2 hover:bg-emerald-700 transition"
              >
                {editingId ? 'Update' : 'Save Observation'}
              </button>
            </div>
          </form>
        </div>

        {/* Observations Table */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-semibold text-slate-900 text-sm">Recorded Observation Data Points</h3>
            <span className="text-xs text-slate-400 font-medium">{observations.length} observations</span>
          </div>

          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Price ($)</th>
                <th className="py-3 px-4">Quantity Sold</th>
                <th className="py-3 px-4">Recorded At</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {observations.length === 0 ? (
                <tr>
                  <td colSpan="4" className="py-8 text-center text-slate-400">
                    No observations logged for this experiment yet.
                  </td>
                </tr>
              ) : (
                observations.map((obs) => (
                  <tr key={obs.observation_id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-slate-900">${parseFloat(obs.price).toFixed(2)}</td>
                    <td className="py-3 px-4 font-mono font-medium text-emerald-700">{obs.quantity_sold} units</td>
                    <td className="py-3 px-4 text-xs text-slate-500">
                      {new Date(obs.observed_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button onClick={() => handleEdit(obs)} className="text-slate-400 hover:text-emerald-600 p-1">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(obs.observation_id)} className="text-slate-400 hover:text-rose-600 p-1">
                        <Trash2 className="w-4 h-4" />
                      </button>
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
}