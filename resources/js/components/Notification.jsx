import { useEffect, useState, useRef } from 'react';

const Notification = ({
  type,
  title,
  message,
  onClose,
  duration = 5000,
  id,
}) => {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isClosed, setIsClosed] = useState(false);
  const intervalRef = useRef(null);

  const styles = {
    success: 'bg-green-50 border-l-4 border-green-600 text-green-600',
    warning: 'bg-yellow-50 border-l-4 border-yellow-600 text-yellow-600',
    error: 'bg-red-50 border-l-4 border-red-600 text-red-600',
    info: 'bg-blue-50 border-l-4 border-blue-600 text-blue-600',
  };

  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 100) {
          clearInterval(intervalRef.current);
          handleClose();
          return 0;
        }
        return prev - 100;
      });
    }, 100);

    return () => clearInterval(intervalRef.current);
  }, []);

  const handleClose = () => {
    if (!isClosed) {
      setIsClosed(true);
      setIsVisible(false); // Start slide-out transition
      setTimeout(() => onClose(id), 300); // Wait for slide-out animation to complete before calling onClose
    }
  };

  if (isClosed) return null;

  const progress = (timeLeft / duration) * 100;

  const progressColor = {
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
  };

  return (
    <div
      className={`pointer-events-auto relative flex flex-col w-full max-w-lg p-6 rounded-lg shadow-lg ${styles[type]} mb-3 transform transition-none duration-300 ease-in-out ${
        isVisible ? 'translate-x-0' : '-translate-x-full'
      }`}
      role="alert"
    >
      <div className="flex items-start space-x-4">
        <div className="shrink-0">
          {/* Icons */}
          {type === 'success' && (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-green-600" viewBox="0 0 512 512">
              <ellipse cx="246" cy="246" rx="246" ry="246" />
              <path className="fill-white" d="m235.472 392.08-121.04-94.296 34.416-44.168 74.328 57.904 122.672-177.016 46.032 31.888z" />
            </svg>
          )}
          {type === 'warning' && (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-yellow-600" viewBox="0 0 128 128">
              <path d="M56.463 14.337 6.9 106.644C4.1 111.861 8.173 118 14.437 118h99.126c6.264 0 10.338-6.139 7.537-11.356L71.537 14.337c-3.106-5.783-11.968-5.783-15.074 0z" />
            </svg>
          )}
          {type === 'error' && (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-red-600" viewBox="0 0 32 32">
              <path d="M16 1a15 15 0 1 0 15 15A15 15 0 0 0 16 1zm6.36 20L21 22.36l-5-4.95-4.95 4.95L9.64 21l4.95-5-4.95-4.95 1.41-1.41L16 14.59l5-4.95 1.41 1.41-5 4.95z" />
            </svg>
          )}
          {type === 'info' && (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-blue-600" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="12" />
            </svg>
          )}
        </div>

        <div className="flex-1">
          <h6 className="text-lg font-semibold">{title}</h6>
          <p className="text-sm text-slate-600 mt-1">{message}</p>
        </div>

        <button
          onClick={handleClose}
          type="button"
          className="ml-auto text-gray-500 hover:text-gray-700 transition duration-150 ease-in-out focus:outline-none"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24">
            <path d="M12 10.586l-7.707-7.707-1.414 1.414L10.586 12l-7.707 7.707 1.414 1.414L12 13.414l7.707 7.707 1.414-1.414L13.414 12l7.707-7.707-1.414-1.414z" />
          </svg>
        </button>
      </div>

      <div
        className={`absolute bottom-0 left-0 w-full h-1.5 rounded-b-lg ${progressColor[type]} transition-all duration-300 ease-linear`}
        style={{ width: `${progress}%` }}
      />
    </div>
  );
};

export default Notification;
