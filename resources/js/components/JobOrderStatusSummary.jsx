// resources/js/components/JobOrderStatusSummary.jsx

import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import SummaryRequestReportsModal from './SummaryRequestReportsModal';

export default function JobOrderStatusSummary({ totals = {}, statusOptions = [], serviceTotals = {}, showNotification }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('request');
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedReportType, setSelectedReportType] = useState(null);

  // Define the desired order for the cards
  const CARD_ORDER = ['Pending', 'Ongoing', 'Cancelled', 'Completed'];

  // Helper to get id by name
  const getStatusIdByName = (name) => {
    const found = statusOptions.find(s => s.name === name);
    return found ? found.id : name.toLowerCase();
  };

  const styles = {
    Pending: {
      bg: 'bg-yellow-50',
      text: 'text-yellow-700',
      badge: 'bg-yellow-100 text-yellow-800',
    },
    Ongoing: {
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      badge: 'bg-blue-100 text-blue-800',
    },
    Completed: {
      bg: 'bg-green-50',
      text: 'text-green-700',
      badge: 'bg-green-100 text-green-800',
    },
    Cancelled: {
      bg: 'bg-red-50',
      text: 'text-red-700',
      badge: 'bg-red-100 text-red-800',
    },
    Unserviceable: {
      bg: 'bg-gray-50',
      text: 'text-gray-700',
      badge: 'bg-gray-200 text-gray-800',
    },
    Default: {
      bg: 'bg-gray-50',
      text: 'text-gray-700',
      badge: 'bg-gray-200 text-gray-800',
    },
  };

  // Service Status card definitions
  const SERVICE_STATUS_CARDS = [
    {
      key: 'unserviceable',
      label: 'Unserviceable',
      bg: '#FFEDD5',
      accent: '#C2410C',
      helper: '',
    },
    {
      key: 'closed',
      label: 'Service Closed',
      bg: '#DCFCE7',
      accent: '#15803D',
      helper: 'Work/service fully completed',
    },
  ];

  // Summary Report card definitions
  const SUMMARY_REPORT_CARDS = [
    {
      key: 'daily',
      label: 'Daily Report',
      color: '#3B82F6',
      bgColor: '#DBEAFE',
      icon: '📅',
      description: 'Generate daily summary',
    },
    {
      key: 'weekly',
      label: 'Weekly Report',
      color: '#A855F7',
      bgColor: '#F3E8FF',
      icon: '📊',
      description: 'Generate weekly summary',
    },
    {
      key: 'monthly',
      label: 'Monthly Report',
      color: '#EC4899',
      bgColor: '#FCE7F3',
      icon: '📈',
      description: 'Generate monthly summary',
    },
  ];

  // Sort status names according to CARD_ORDER, then append any others
  const statusNames = [
    ...CARD_ORDER.filter(status => Object.keys(totals).includes(status)),
    ...Object.keys(totals).filter(status => !CARD_ORDER.includes(status)),
  ];

  // Add simple emoji icons for visual cues
  const statusIcons = {
    Pending: "⏳",
    Ongoing: "🔄",
    Cancelled: "❌",
    Completed: "✅",
    unserviceable: "📝",
    closed: "🔒",
  };

  // Helper to navigate to JobOrderStatusPage for a given status key
  const goToStatusPage = (statusKey, type = 'request') => {
    if (type === 'request') {
      navigate(`/reports/status/${statusKey}`);
    } else if (type === 'service') {
      navigate(`/reports/service-status/${statusKey}`);
    }
  };

  // Handle report modal
  const handleReportClick = (reportType) => {
    setSelectedReportType(reportType);
    setShowReportModal(true);
  };

  const handleCloseReportModal = () => {
    setShowReportModal(false);
    setSelectedReportType(null);
  };

  return (
    <div className="py-4">
      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          className={`px-4 py-2 font-semibold transition-colors duration-150 rounded-t-md ${
            activeTab === 'request'
              ? 'border-b-2 border-blue-600 text-blue-700 bg-white'
              : 'text-gray-500 bg-gray-50 hover:bg-gray-100'
          }`}
          onClick={() => setActiveTab('request')}
        >
          Request Status
        </button>
        <div className="w-px bg-gray-200 mx-1" />
        <button
          className={`px-4 py-2 font-semibold transition-colors duration-150 rounded-t-md ${
            activeTab === 'service'
              ? 'border-b-2 border-blue-600 text-blue-700 bg-white'
              : 'text-gray-500 bg-gray-50 hover:bg-gray-100'
          }`}
          onClick={() => setActiveTab('service')}
        >
          Service Status
        </button>
        <div className="w-px bg-gray-200 mx-1" />
        <button
          className={`px-4 py-2 font-semibold transition-colors duration-150 rounded-t-md ${
            activeTab === 'summary'
              ? 'border-b-2 border-blue-600 text-blue-700 bg-white'
              : 'text-gray-500 bg-gray-50 hover:bg-gray-100'
          }`}
          onClick={() => setActiveTab('summary')}
        >
          Summary Request Report
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === 'request' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5 gap-y-7 justify-center">
          {statusNames.map((status) => {
            if (status === 'Unserviceable') return null;
            const count = totals[status] || 0;
            const style = styles[status] || styles.Default;
            const statusId = getStatusIdByName(status);

            return (
              <button
                key={status}
                onClick={() => goToStatusPage(statusId, 'request')}
                className={`w-full max-w-[320px] mx-auto rounded-xl border border-gray-200 p-5 shadow group bg-gradient-to-br from-white to-gray-50 hover:from-blue-50 hover:to-white hover:shadow-lg transition focus:outline-none focus:ring-2 focus:ring-blue-200 outline outline-2 outline-blue-100 hover:border-blue-500 hover:outline-blue-400`}
                style={{ minHeight: 160 }}
              >
                <div className="flex flex-col items-center text-center gap-1">
                  <div
                    className="flex items-center justify-center w-11 h-11 rounded-full mb-1 shadow-sm"
                    style={{
                      background: style.bg === 'bg-yellow-50' ? '#FEF3C7'
                        : style.bg === 'bg-blue-50' ? '#DBEAFE'
                        : style.bg === 'bg-green-50' ? '#DCFCE7'
                        : style.bg === 'bg-red-50' ? '#FEE2E2'
                        : '#F3F4F6',
                      color: style.text ? undefined : '#555',
                      fontSize: 26,
                    }}
                  >
                    {statusIcons[status] || "📄"}
                  </div>
                  <div className="text-[15px] font-medium text-gray-700">{status}</div>
                  {count === null ? (
                    <div className="mt-2 flex items-center justify-center h-10">
                      <svg className="animate-spin h-7 w-7 text-gray-400" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </div>
                  ) : (
                    <div className={`mt-1 text-3xl font-bold tracking-tight ${style.text}`}>{count}</div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {activeTab === 'service' && (
        <div className="flex flex-wrap justify-center gap-5 gap-y-7">
          {SERVICE_STATUS_CARDS.map(card => (
            <button
              key={card.key}
              onClick={() => goToStatusPage(card.key, 'service')}
              className="w-full sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-13px)] max-w-[320px] rounded-xl border border-gray-200 p-5 shadow-sm bg-white flex flex-col items-center transition outline outline-2 outline-blue-100 hover:border-blue-500 hover:outline-blue-400"
              style={{
                minHeight: 160,
                cursor: 'pointer'
              }}
            >
              <div
                className="flex items-center justify-center w-11 h-11 rounded-full mb-1 shadow-sm"
                style={{
                  background: "#fff",
                  color: card.accent,
                  fontSize: 26,
                  border: `2px solid ${card.accent}`,
                }}
              >
                {statusIcons[card.key] || "📄"}
              </div>
              <div className="text-[15px] font-medium" style={{ color: card.accent }}>{card.label}</div>
              <div className="mt-1 text-3xl font-bold tracking-tight" style={{ color: card.accent }}>
                {serviceTotals?.[card.key] ?? 0}
              </div>
              {card.helper && (
                <div className="mt-2 px-3 py-1 text-xs font-medium rounded bg-gray-100 text-gray-600">
                  {card.helper}
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {activeTab === 'summary' && (
        <div className="flex flex-wrap justify-center gap-5 gap-y-7">
          {SUMMARY_REPORT_CARDS.map(card => (
            <button
              key={card.key}
              onClick={() => handleReportClick(card.key)}
              className="w-full sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-13px)] max-w-[320px] rounded-xl border border-gray-200 p-5 shadow-sm bg-white flex flex-col items-center transition outline outline-2 outline-blue-100 hover:border-blue-500 hover:outline-blue-400 hover:shadow-lg"
              style={{
                minHeight: 160,
                cursor: 'pointer'
              }}
            >
              <div
                className="flex items-center justify-center w-11 h-11 rounded-full mb-1 shadow-sm"
                style={{
                  background: card.bgColor,
                  color: card.color,
                  fontSize: 26,
                  border: `2px solid ${card.color}`,
                }}
              >
                {card.icon}
              </div>
              <div className="text-[15px] font-medium" style={{ color: card.color }}>{card.label}</div>
              <div className="text-xs text-gray-500 mt-2">{card.description}</div>
            </button>
          ))}
        </div>
      )}

      {/* Summary Request Reports Modal */}
      {showReportModal && (
        <SummaryRequestReportsModal
          isOpen={showReportModal}
          onClose={handleCloseReportModal}
          reportType={selectedReportType}
          showNotification={showNotification}
        />
      )}
    </div>
  );
}