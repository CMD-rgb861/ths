import { useState } from 'react';
import Notification from './Notification';

export default function AppLayout({ children }) {
  const [notification, setNotification] = useState(null);

  // A method to show the notification
  const showNotification = (type, title, message) => {
    setNotification({ type, title, message });
    setTimeout(() => setNotification(null), 5000); // Dismiss after 5 seconds
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Notification */}
      {notification && (
        <div className="fixed top-5 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-xs">
          <Notification
            type={notification.type}
            title={notification.title}
            message={notification.message}
            onClose={() => setNotification(null)}
          />
        </div>
      )}

      <header className="bg-surface border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-3 flex justify-between">
          <div className="font-semibold text-sm">
            Job Order System
          </div>
          <div className="text-sm text-text-muted">
            IT Department
          </div>
        </div>
      </header>

      <main className={`flex-1 bg-background ${notification ? 'pt-16' : 'pt-6'}`}>
        <div className="max-w-7xl mx-auto px-6 py-6">
          {children}
        </div>
      </main>

      <footer className="border-t border-border bg-surface">
        <div className="max-w-7xl mx-auto px-6 py-3 text-xs text-text-muted text-center">
          © {new Date().getFullYear()} Internal Use Only
        </div>
      </footer>
    </div>
  );
}
