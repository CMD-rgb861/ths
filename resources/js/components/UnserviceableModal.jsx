import { useState, useEffect } from 'react';
import axios from 'axios';

export default function UnserviceableModal({
  isOpen,
  onClose,
  onSaved,
  jobId,
  showNotification,
}) {
  const [form, setForm] = useState({
    item: '',
    findings: '',
    noted_by_its: '',
    noted_by_pc: '',
    date: '',
  });

  const [saving, setSaving] = useState(false);

  // Fetch IT Director signatory when modal opens
  useEffect(() => {
    if (isOpen) {
      axios
        .get('/signatory/it-director')
        .then((res) => {
          if (res.data?.name) {
            setForm((prev) => ({
              ...prev,
              noted_by_its: res.data.name,
            }));
          }
        })
        .catch((err) => {
          console.error('Failed to fetch IT Director:', err);
        });
    }
  }, [isOpen]);

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

    // Basic validation
    if (!form.item || !form.findings || !form.date) {
      showNotification(
        'error',
        'Validation Failed',
        'Please fill out all required fields.'
      );
      setSaving(false);
      return;
    }

    axios
      .put(`/job-orders/${jobId}/action-report/unserviceable`, form)
      .then((res) => {
        showNotification(
          'success',
          'Saved',
          'Unserviceable details saved successfully.'
        );

        // OPTIONAL: send updated data back to parent without reload
        if (onSaved) {
          onSaved(res.data); 
        }

        onClose(); // just close modal
      })
      .catch((err) => {
        console.error(err);
        showNotification(
          'error',
          'Save Failed',
          'Something went wrong while saving the details.'
        );
      })
      .finally(() => setSaving(false));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-3xl rounded-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-white px-8 py-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Unserviceable Details</h2>
          <p className="text-gray-600 mt-1">Document unserviceable item information</p>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6 max-h-[calc(90vh-180px)] overflow-y-auto">
          {/* Item Information Card */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
            <div className="flex items-center mb-4">
              <svg className="w-5 h-5 text-gray-700 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Item Details</h3>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Item <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="item"
                value={form.item}
                onChange={handleChange}
                placeholder="Enter item name or description"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Findings <span className="text-red-500">*</span>
              </label>
              <textarea
                name="findings"
                value={form.findings}
                onChange={handleChange}
                placeholder="Describe the findings and reasons for being unserviceable"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                rows="4"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="date"
                value={form.date}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Signatories Card */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
            <div className="flex items-center mb-4">
              <svg className="w-5 h-5 text-gray-700 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Signatories</h3>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Noted By (ITS Director)
              </label>
              <input
                type="text"
                name="noted_by_its"
                value={form.noted_by_its}
                onChange={handleChange}
                placeholder="Enter ITS Director name"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Noted By (Property Custodian)
              </label>
              <input
                type="text"
                name="noted_by_pc"
                value={form.noted_by_pc}
                onChange={handleChange}
                placeholder="Enter Property Custodian name"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-8 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={() => onClose()}
            className="inline-flex items-center px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all"
          >
            Cancel
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className={`inline-flex items-center px-5 py-2.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all ${
              saving ? 'cursor-not-allowed opacity-70' : ''
            }`}
          >
            {saving ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Save Details
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}