import { ToastContainer } from 'react-toastify';

export default function AppLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col">
      <ToastContainer
        autoClose={5000}
        closeOnClick
        draggable
        hideProgressBar={false}
        newestOnTop
        pauseOnHover
        position="top-right"
        theme="light"
      />

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

      <main className="flex-1 bg-background pt-6">
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
