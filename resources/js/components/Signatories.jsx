import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Signatories = ({ showNotification }) => {
  const [signatory, setSignatory] = useState(null);
  const [name, setName] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSignatory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchSignatory = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      // Initial load can reuse refreshing to show spinner in the box
      setRefreshing(true);
    }

    try {
      const res = await axios.get('/signatory/it-director');
      setSignatory(res.data || null);
      if (!isRefresh) {
        setName(res.data?.name || '');
      }
    } catch (err) {
      console.error('Failed to fetch signatory', err.response || err.message);
      setSignatory(null);
      if (showNotification) {
        showNotification('error', 'Load Failed', 'Failed to load signatory information.');
      }
    } finally {
      setRefreshing(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { name: name || null };
      const res = await axios.post('/signatory/it-director', payload);
      setSignatory(res.data || null);
      setName(res.data?.name || '');
      if (showNotification) {
        showNotification('success', 'Saved Successfully', 'IT Director saved. Future approvals will use this name.');
      }
    } catch (err) {
      console.error('Failed to save signatory', err.response || err.message);
      if (showNotification) {
        showNotification('error', 'Save Failed', 'Failed to save signatory. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Card (Always visible, no loading) */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900">Signatories (IT Director)</h1>
        <p className="text-gray-600 mt-1">
          Set the IT Director name used for approvals and unserviceable reports
        </p>
      </div>

      {/* Form Card */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-8">
        <div className="max-w-xl space-y-6">
          {/* Current Signatory Display */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <svg
                  className="w-5 h-5 text-blue-600 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <p className="text-xs font-semibold text-blue-900 uppercase tracking-wide">
                    Current IT Director
                  </p>
                  <p className="text-sm font-medium text-blue-900 mt-0.5">
                    {refreshing ? (
                      <span className="inline-flex items-center">
                        <svg
                          className="animate-spin h-3 w-3 mr-1.5"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Loading...
                      </span>
                    ) : (
                      signatory?.name || 'Not set'
                    )}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => fetchSignatory(true)}
                disabled={refreshing}
                className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                title="Refresh current IT Director"
              >
                <svg
                  className={`w-3.5 h-3.5 mr-1 ${refreshing ? 'animate-spin' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>

          {/* Form Section */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              IT Director Name <span className="text-red-500">*</span>
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter IT Director name"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            <p className="text-xs text-gray-500 mt-2">
              This name will be used for job order approvals and unserviceable item reports.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !name.trim()}
              className="inline-flex items-center px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {saving ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(Signatories);