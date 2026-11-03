import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Calendar, MapPin, Eye } from 'lucide-react';

export default function Experiments({ onNavigate }) {
  const [experiments, setExperiments] = useState([]);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({
    product_id: '',
    experiment_name: '',
    start_date: '',
    end_date: '',
    location: '',
    notes: '',
  });
  const [editingId, setEditingId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const fetchData = async () => {
    try {
      const [expRes, prodRes] = await Promise.all([
        fetch('/api/experiments'),
        fetch('/api/products'),
      ]);
      const expData = await expRes.json();
      const prodData = await prodRes.json();
      setExperiments(expData);
      setProducts(prodData);
    } catch (err) {
      setMessage({ type: 'error', text: 'Error connecting to database.' });
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = editingId ? `/api/experiments/${editingId}` : '/api/experiments';
    const method = editingId ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setMessage({ type: 'success', text: editingId ? 'Experiment updated.' : 'Experiment created successfully.' });
      setIsModalOpen(false);
      setEditingId(null);
      setForm({ product_id: '', experiment_name: '', start_date: '', end_date: '', location: '', notes: '' });
      fetchData();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this experiment? Delete any associated observations first.')) return;
    try {
      const res = await fetch(`/api/experiments/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessage({ type: 'success', text: 'Experiment removed.' });
      fetchData();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleEdit = (exp) => {
    setEditingId(exp.experiment_id);
    setForm({
      product_id: exp.product_id,
      experiment_name: exp.experiment_name,
      start_date: exp.start_date ? exp.start_date.substring(0, 10) : '',
      end_date: exp.end_date ? exp.end_date.substring(0, 10) : '',
      location: exp.location || '',
      notes: exp.notes || '',
    });
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Pricing Experiments</h2>
          <p className="text-sm text-slate-500">Configure controlled price-testing trials.</p>
        </div>
        <button
          onClick={() => {
            setEditingId(null);
            setForm({ product_id: '', experiment_name: '', start_date: '', end_date: '', location: '', notes: '' });
            setIsModalOpen(true);
          }}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-4 py-2 rounded-lg flex items-center space-x-2 text-sm shadow transition"
        >
          <Plus className="w-4 h-4" />
          <span>New Experiment</span>
        </button>
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

      {/* Experiment Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {experiments.map((exp) => (
          <div key={exp.experiment_id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow transition flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                    {exp.product_name}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 mt-2">{exp.experiment_name}</h3>
                </div>
                <div className="flex space-x-1">
                  <button onClick={() => handleEdit(exp)} className="p-1.5 text-slate-400 hover:text-emerald-600">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(exp.experiment_id)} className="p-1.5 text-slate-400 hover:text-rose-600">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="mt-4 space-y-1.5 text-xs text-slate-500">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    {exp.start_date ? new Date(exp.start_date).toLocaleDateString() : 'N/A'} — {exp.end_date ? new Date(exp.end_date).toLocaleDateString() : 'Active'}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{exp.location || 'Universal / Web'}</span>
                </div>
              </div>

              {exp.notes && (
                <p className="mt-3 text-xs bg-slate-50 p-2 rounded text-slate-600 border border-slate-100">
                  {exp.notes}
                </p>
              )}
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
              <span className="font-mono text-slate-400">Exp ID #{exp.experiment_id}</span>
              <button
                onClick={() => onNavigate('observations')}
                className="text-emerald-600 font-semibold hover:underline flex items-center space-x-1"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>View Observations</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 mb-4">
              {editingId ? 'Edit Experiment' : 'Create Pricing Experiment'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Target Product *</label>
                <select
                  required
                  value={form.product_id}
                  onChange={(e) => setForm({ ...form, product_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                >
                  <option value="">-- Choose Product from Database --</option>
                  {products.map((p) => (
                    <option key={p.product_id} value={p.product_id}>
                      {p.product_name} {p.brand ? `(${p.brand})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Experiment Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cold Drink Price Test"
                  value={form.experiment_name}
                  onChange={(e) => setForm({ ...form, experiment_name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={form.start_date}
                    onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">End Date</label>
                  <input
                    type="date"
                    value={form.end_date}
                    onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Location</label>
                <input
                  type="text"
                  placeholder="e.g. Store #102 or Online"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Notes / Hypothesis</label>
                <textarea
                  rows="2"
                  placeholder="e.g. Testing elasticity across $100, $110, $120 price intervals."
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border rounded-lg text-sm text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700"
                >
                  {editingId ? 'Save Changes' : 'Create Experiment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}