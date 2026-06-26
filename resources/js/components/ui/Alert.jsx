// resources/js/components/Alert.jsx
import { useState } from 'react';
import {
  InformationCircleIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

export default function Alert({
  type = 'info',
  message,
  dismissible = false,
}) {
  const [visible, setVisible] = useState(true);

  if (!message || !visible) return null;

  const styles = {
    info: {
      container: 'bg-gray-50 border-gray-300 text-gray-800',
      icon: InformationCircleIcon,
    },
    success: {
      container: 'bg-green-50 border-green-300 text-green-800',
      icon: CheckCircleIcon,
    },
    error: {
      container: 'bg-red-50 border-red-300 text-red-800',
      icon: ExclamationTriangleIcon,
    },
  };

  const { container, icon: Icon } = styles[type] || styles.info;

  return (
    <div
      className={`flex items-start gap-3 border rounded-lg p-4 text-sm ${container}`}
    >
      <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />

      <div className="flex-1">
        {message}
      </div>

      {dismissible && (
        <button
          onClick={() => setVisible(false)}
          className="text-gray-400 hover:text-gray-600 transition"
        >
          <XMarkIcon className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
