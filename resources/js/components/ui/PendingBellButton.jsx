// resources/js/components/ui/PendingBellButton.jsx
import React from 'react';
import { FaBell } from 'react-icons/fa';

export default function PendingBellButton({ count = 0, onClick }) {
  const show = count > 0;

  return (
    <button
      type="button"
      onClick={show ? onClick : undefined}
      disabled={!show}
      title={show ? `${count} new pending job order(s)` : 'No new pending job orders'}
      aria-label={show ? `${count} new pending job orders` : 'No new pending job orders'}
      className={`relative inline-flex items-center justify-center w-10 h-10 rounded-lg transition-all ${
        show
          ? 'text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500/40'
          : 'text-gray-400 cursor-default'
      }`}
    >
      <FaBell className="w-5 h-5" />

      {show && (
        <>
          <span className="absolute -top-1 -right-1 inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full bg-red-600 text-white text-[11px] font-bold leading-none shadow">
            {count > 99 ? '99+' : count}
          </span>
          <span className="absolute inset-0 rounded-lg animate-ping bg-red-500/20 pointer-events-none" />
        </>
      )}
    </button>
  );
}