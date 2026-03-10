import { useEffect, useState, useRef } from 'react';

const Notification = ({
  type = 'info',
  title,
  message,
  onClose,
  duration = 5000,
  id,
}) => {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isVisible, setIsVisible] = useState(true);
  const [isClosed, setIsClosed] = useState(false);
  const intervalRef = useRef(null);

  // Styles configuration
  const styles = {
    success: 'bg-green-50 border-l-4 border-green-600 text-green-600',
    warning: 'bg-yellow-50 border-l-4 border-yellow-600 text-yellow-600',
    error: 'bg-red-50 border-l-4 border-red-600 text-red-600',
    info: 'bg-blue-50 border-l-4 border-blue-600 text-blue-600',
  };

  const progressColors = {
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
  };

  const iconColors = {
    success: 'text-green-600',
    warning: 'text-yellow-600',
    error: 'text-red-600',
    info: 'text-blue-600',
  };

  // Icons component
  const NotificationIcon = () => {
    const iconClass = `w-6 h-6 ${iconColors[type]}`;
    
    switch (type) {
      case 'success':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} viewBox="0 0 512 512">
            <ellipse cx="246" cy="246" rx="246" ry="246" />
            <path className="fill-white" d="m235.472 392.08-121.04-94.296 34.416-44.168 74.328 57.904 122.672-177.016 46.032 31.888z" />
          </svg>
        );
      case 'warning':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} viewBox="0 0 128 128">
            <path d="M56.463 14.337 6.9 106.644C4.1 111.861 8.173 118 14.437 118h99.126c6.264 0 10.338-6.139 7.537-11.356L71.537 14.337c-3.106-5.783-11.968-5.783-15.074 0z" />
          </svg>
        );
      case 'error':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} viewBox="0 0 32 32">
            <path d="M16 1a15 15 0 1 0 15 15A15 15 0 0 0 16 1zm6.36 20L21 22.36l-5-4.95-4.95 4.95L9.64 21l4.95-5-4.95-4.95 1.41-1.41L16 14.59l5-4.95 1.41 1.41-5 4.95z" />
          </svg>
        );
      case 'info':
      default:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="12" />
          </svg>
        );
    }
  };

  // Auto-dismiss timer
  useEffect(() => {
    if (duration <= 0) return;

    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 50) {
          clearInterval(intervalRef.current);
          handleClose();
          return 0;
        }
        return prev - 50;
      });
    }, 50);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [duration]);

  // Close handler
  const handleClose = () => {
    if (isClosed) return;
    
    setIsClosed(true);
    setIsVisible(false);
    
    // Wait for slide-out animation before calling onClose
    setTimeout(() => {
      if (onClose) onClose(id);
    }, 300);
  };

  if (isClosed) return null;

  const progress = (timeLeft / duration) * 100;

  return (
    <div
      className={`pointer-events-auto relative flex flex-col w-full max-w-lg p-6 rounded-lg shadow-lg mb-3 transform transition-transform duration-300 ease-in-out ${
        styles[type]
      } ${isVisible ? 'translate-x-0' : '-translate-x-full'}`}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start space-x-4">
        {/* Icon */}
        <div className="shrink-0">
          <NotificationIcon />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h6 className="text-lg font-semibold truncate">{title}</h6>
          <p className="text-sm text-slate-600 mt-1 break-words">{message}</p>
        </div>

        {/* Close button */}
        <button
          onClick={handleClose}
          type="button"
          aria-label="Close notification"
          className="ml-auto shrink-0 text-gray-500 hover:text-gray-700 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-gray-400 rounded"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 10.586l-7.707-7.707-1.414 1.414L10.586 12l-7.707 7.707 1.414 1.414L12 13.414l7.707 7.707 1.414-1.414L13.414 12l7.707-7.707-1.414-1.414z" />
          </svg>
        </button>
      </div>

      {/* Progress bar */}
      {duration > 0 && (
        <div
          className={`absolute bottom-0 left-0 h-1.5 rounded-bl-lg transition-all duration-50 ease-linear ${progressColors[type]}`}
          style={{ width: `${progress}%` }}
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin="0"
          aria-valuemax="100"
        />
      )}
    </div>
  );
};

export default Notification;
