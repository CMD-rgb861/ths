import { useState, useEffect } from 'react';
import axios from 'axios';

export default function UnserviceableModal({
  isOpen,
  onClose,
  jobId,
  showNotification,
}) {
  const [form, setForm] = useState({
    item: '',
    findings: '',
    noted_by_its: '',
    noted_by_pc: '',
    date: '',
    serviced_by: '',
  });
  const [technicians, setTechnicians] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Fetch technicians
      axios
        .get('/technicians')
        .then((res) => setTechnicians(res.data))
        .catch(() => showNotification('error', 'Error', 'Unable to fetch technicians.'));
    }
  }, [isOpen, showNotification]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prevForm) => ({
      ...prevForm,
      [name]: value,
    }));
  };

  const handleSave = () => {
    if (saving) return;

    setSaving(true);

    // Validate fields
    if (!form.item || !form.findings || !form.date || !form.serviced_by) {
      showNotification('error', 'Validation Failed', 'Please fill out all required fields.');
      setSaving(false);
      return;
    }

    // Send data to backend (update action_report for the job)
    axios
      .put(`/job-orders/${jobId}/action-report/unserviceable`, form)
      .then(() => {
        showNotification('success', 'Saved', 'Unserviceable details saved successfully.');
        onClose();
      })
      .catch((err) => {
        console.error(err);
        showNotification('error', 'Save Failed', 'Something went wrong while saving the details.');
      })
      .finally(() => setSaving(false));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Unserviceable Details</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-xl">
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-semibold">Item</label>
            <input
              type="text"
              name="item"
              value={form.item}
              onChange={handleChange}
              className="w-full border rounded-lg p-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold">Findings</label>
            <textarea
              name="findings"
              value={form.findings}
              onChange={handleChange}
              className="w-full border rounded-lg p-2 text-sm"
              rows="4"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold">Date</label>
            <input
              type="datetime-local"
              name="date"
              value={form.date}
              onChange={handleChange}
              className="w-full border rounded-lg p-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold">Serviced By</label>
            <select
              name="serviced_by"
              value={form.serviced_by}
              onChange={handleChange}
              className="w-full border rounded-lg p-2 text-sm"
            >
              <option value="">Select Technician</option>
              {technicians.map((tech) => (
                <option key={tech.id} value={tech.id}>
                  {tech.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold">Noted By (ITS Director)</label>
            <input
              type="text"
              name="noted_by_its"
              value={form.noted_by_its}
              onChange={handleChange}
              className="w-full border rounded-lg p-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold">Noted By (Property Custodian)</label>
            <input
              type="text"
              name="noted_by_pc"
              value={form.noted_by_pc}
              onChange={handleChange}
              className="w-full border rounded-lg p-2 text-sm"
            />
          </div>

          <div className="flex justify-end space-x-4">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-500 text-white rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className={`px-6 py-2 bg-green-600 text-white rounded-lg ${saving ? 'cursor-not-allowed' : ''}`}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
