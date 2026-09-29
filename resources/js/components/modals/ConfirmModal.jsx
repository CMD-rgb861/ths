// resources/js/components/modals/ConfirmModal.jsx
import React from 'react';

// Button color variants per tone
const CONFIRM_BUTTON_CLASSES = {
  primary: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
  danger:  'bg-red-600 hover:bg-red-700 focus:ring-red-500',
};

// Optional icon colors per tone (only used if you want an icon header later)
const ICON_TONES = {
  primary: { bg: 'bg-blue-100',   fg: 'text-blue-600' },
  danger:  { bg: 'bg-red-100',    fg: 'text-red-600'  },
};

export default function ConfirmModal({
  isOpen,
  title = 'Are you sure?',
  message = 'Do you want to continue?',
  confirmText = 'Yes',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  loading = false,
  tone = 'primary',        // 'primary' (blue) | 'danger' (red)
}) {
  if (!isOpen) return null;

  const confirmBtnClass =
    CONFIRM_BUTTON_CLASSES[tone] || CONFIRM_BUTTON_CLASSES.primary;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-2">{title}</h2>
        <p className="text-sm text-gray-700 mb-6 whitespace-pre-line">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-5 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 transition disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`px-5 py-2 rounded-lg text-white font-medium transition disabled:opacity-50 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2 ${confirmBtnClass}`}
          >
            {loading && (
              <svg className="animate-spin h-5 w-5 mr-2 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {loading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}