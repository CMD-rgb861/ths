import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function Signatories() {
  const [signatory, setSignatory] = useState(null);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSignatory();
  }, []);

  const fetchSignatory = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/signatory/it-director');
      setSignatory(res.data || null);
      setName(res.data?.name || '');
    } catch (err) {
      console.error('Failed to fetch signatory', err.response || err.message);
      setSignatory(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { name: name || null };
      const res = await axios.post('/signatory/it-director', payload);
      setSignatory(res.data || null);
      setName(res.data?.name || '');
      alert('IT Director saved. Future approvals will use this name.');
    } catch (err) {
      console.error('Failed to save signatory', err.response || err.message);
      alert('Failed to save signatory. See console.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div>
        <h1 className="text-lg font-semibold">Signatories (IT Director)</h1>
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold">Signatories (IT Director)</h1>
        <p className="text-sm text-gray-500">Set the IT Director name used for approvals.</p>
      </div>

      <div className="bg-white border rounded-xl p-6 max-w-xl">
        <label className="block text-sm font-semibold text-gray-600 mb-2">IT Director Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter IT Director name"
          className="w-full border rounded-lg px-3 py-2 text-sm mb-4"
        />

        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>

          <button
            onClick={fetchSignatory}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            Refresh
          </button>
        </div>

        <div className="mt-4 text-sm text-gray-500">
          Current: {signatory?.name || '—'}
        </div>
      </div>
    </div>
  );
}
