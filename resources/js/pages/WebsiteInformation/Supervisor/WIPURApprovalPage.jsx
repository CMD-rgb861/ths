import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify'; 
import {
  FaCheckCircle,
  FaUndoAlt,
  FaTimesCircle,
  FaSearch,
  FaInbox,
  FaHistory,
  FaPaperclip,
  FaUserTie,
  FaBuilding,
  FaCalendarAlt,
  FaClock,
  FaFileAlt,
  FaTimes,
} from 'react-icons/fa';
import WIPURNavigationPanel from '../WIPURNavigationPanel';
import WIPURApproveModal from '../../../components/modals/WebsiteInformation/Supervisor/WIPURApproveModal';
import WIPURReturnModal from '../../../components/modals/WebsiteInformation/Supervisor/WIPURReturnModal';
import WIPURDeclineModal from '../../../components/modals/WebsiteInformation/Supervisor/WIPURDeclineModal';
import WIPURLogDetails from '../../../components/modals/WebsiteInformation/Supervisor/WIPURLogDetails';

const PER_PAGE = 10;

const DECISION_TOKENS = {
  Approved: { badge: 'bg-emerald-100 text-emerald-700', border: 'border-l-emerald-500', icon: FaCheckCircle, label: 'Approved' },
  Returned: { badge: 'bg-amber-100 text-amber-700', border: 'border-l-amber-500', icon: FaUndoAlt, label: 'Returned' },
  Declined: { badge: 'bg-rose-100 text-rose-700', border: 'border-l-rose-500', icon: FaTimesCircle, label: 'Declined' },
};

function SupervisorTitleCard({ supervisorName = 'Supervisor', pendingCount }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-700">Supervisor</p>
          <h1 className="mt-2 text-2xl font-bold text-gray-900">Supervisor Review Desk</h1>
          <p className="mt-1 text-sm text-gray-600">
            Signed in as <span className="font-semibold text-gray-800">{supervisorName}</span>
            {pendingCount > 0 && (
              <>
                {' · '}
                <span className="font-semibold text-blue-700">
                  {pendingCount} request{pendingCount === 1 ? '' : 's'} awaiting your decision
                </span>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

function ViewSwitcher({ active, onChange, pendingCount, returnedCount, logCount }) {
  const tabs = [
    { key: 'awaiting', label: 'Awaiting My Review', icon: FaInbox, count: pendingCount },
    { key: 'returned', label: 'Returned Requests', icon: FaUndoAlt, count: returnedCount },
    { key: 'log', label: 'My Decision Log', icon: FaHistory, count: logCount },
  ];

  return (
    <div className="flex w-full border-b border-gray-200 gap-1">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = active === tab.key;
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange(tab.key)}
            className={`group relative flex flex-1 items-center justify-center gap-2 px-4 py-3 text-sm font-semibold transition-all whitespace-nowrap border-b-2 ${
              isActive
                ? 'border-blue-600 text-blue-700 bg-blue-50/50'
                : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300 hover:bg-gray-50/50'
            }`}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span>{tab.label}</span>
            {tab.count > 0 && (
              <span
                className={`inline-flex min-w-[1.25rem] items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                  isActive ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}
              >
                {tab.count > 99 ? '99+' : tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function QueueRow({ request, isSelected, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(request)}
      className={`group flex w-full items-center gap-3 border-l-4 px-3 py-2.5 text-left transition-colors ${
        isSelected ? 'border-l-indigo-500 bg-indigo-50' : 'border-l-transparent hover:bg-slate-50'
      }`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className={`truncate text-sm font-semibold ${isSelected ? 'text-indigo-700' : 'text-slate-900'}`}>
            {request.id}
          </span>
          <span className="hidden truncate text-xs text-slate-500 sm:inline">· {request.requester}</span>
        </div>
        <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-500">
          <span className="truncate">{request.requestType}</span>
          <span className="text-slate-300">·</span>
          <span className="inline-flex items-center gap-1 whitespace-nowrap">
            <FaClock className="h-2.5 w-2.5" />
            {request.submittedRelative}
          </span>
        </div>
      </div>
    </button>
  );
}

function QueuePagination({ currentPage, lastPage, onChange }) {
  return (
    <div className="flex items-center justify-center border-t border-gray-200 bg-gray-50 px-4 py-3 gap-4">
      <button
        type="button"
        disabled={currentPage <= 1}
        onClick={() => onChange(currentPage - 1)}
        className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Previous
      </button>
      <span className="text-sm text-gray-700 whitespace-nowrap">
        Page <span className="font-semibold">{currentPage}</span> of <span className="font-semibold">{lastPage}</span>
      </span>
      <button
        type="button"
        disabled={currentPage >= lastPage}
        onClick={() => onChange(currentPage + 1)}
        className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        Next
        <svg className="w-4 h-4 ml-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}

function RequestDetailPane({ request, onOpenDecisionModal, onOpenLightbox }) {
  if (!request) {
    return (
      <div className="flex h-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 px-6 py-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
          <FaInbox className="h-7 w-7" />
        </div>
        <h3 className="mt-4 text-base font-semibold text-slate-700">Nothing selected</h3>
        <p className="mt-1 max-w-xs text-sm text-slate-500">Pick a request from the queue on the left to review its details and record your decision.</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-6 py-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-slate-900">Control No. - {request.id}</span>
            </div>
            <p className="mt-1 text-sm text-slate-500">Submitted {request.submittedRelative} · {request.submittedAt}</p>
          </div>
          <span className="shrink-0 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">{request.requestType}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 border-b border-slate-200 bg-slate-50/50 px-6 py-4 sm:grid-cols-3">
        <div className="flex items-start gap-2.5">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-slate-400 ring-1 ring-slate-200"><FaUserTie className="h-3.5 w-3.5" /></div>
          <div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Requester</p><p className="truncate text-sm font-medium text-slate-800">{request.requester}</p></div>
        </div>
        <div className="flex items-start gap-2.5">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-slate-400 ring-1 ring-slate-200"><FaBuilding className="h-3.5 w-3.5" /></div>
          <div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Department</p><p className="truncate text-sm font-medium text-slate-800">{request.department}</p></div>
        </div>
        <div className="flex items-start gap-2.5">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-slate-400 ring-1 ring-slate-200"><FaCalendarAlt className="h-3.5 w-3.5" /></div>
          <div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Submitted</p><p className="truncate text-sm font-medium text-slate-800">{request.submittedAt}</p></div>
        </div>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Request details</h4>
          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-700">{request.remarks}</p>
        </div>
        
        {/* Updated Attachments Display */}
        {request.attachments?.length > 0 && (
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Attachments</h4>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {request.attachments.map((file) => {
                const image = (file?.type || '').toLowerCase().startsWith('image/');
                return (
                  <div
                    key={file.id}
                    onClick={() => {
                      // 👇 FIX: Only use lightbox for images, otherwise open in new tab
                      if (image) {
                        onOpenLightbox(file, request.attachments);
                      } else {
                        window.open(`/storage/${file.file_path}`, '_blank');
                      }
                    }}
                    className="group block cursor-pointer overflow-hidden rounded-xl border border-gray-200 bg-gray-50 transition hover:border-blue-200 hover:bg-blue-50"
                  >
                    {image ? (
                      <div className="overflow-hidden">
                        <img
                          src={`/storage/${file.file_path}`}
                          alt={file.original_name || 'Attachment'}
                          className="h-40 w-full object-cover transition duration-200 group-hover:scale-[1.02]"
                        />
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 p-3">
                        <FaFileAlt className="h-7 w-7 text-gray-400" />
                        <span className="truncate text-sm font-medium text-blue-600 group-hover:underline">
                          {file.original_name || 'Attachment'}
                        </span>
                      </div>
                    )}
                    {image && (
                      <div className="border-t border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 truncate">
                        {file.original_name || 'Image attachment'}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {request.sub_status === 'returned' ? (
         <div className="border-t border-slate-200 bg-amber-50 px-6 py-4 text-sm text-amber-800">
            <span className="font-bold">Returned for Revision:</span> {request.decline_reason || request.step_remarks || 'No reason provided.'}
         </div>
      ) : (
        <div className="border-t border-slate-200 bg-slate-50/50 px-6 py-4">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Record your decision</p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button type="button" onClick={() => onOpenDecisionModal(request, 'Approved')} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2">
              <FaCheckCircle className="h-4 w-4" /> Approve & Forward
            </button>
            <button type="button" onClick={() => onOpenDecisionModal(request, 'Returned')} className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700 transition hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2">
              <FaUndoAlt className="h-4 w-4" /> Return for Revision
            </button>
            <button type="button" onClick={() => onOpenDecisionModal(request, 'Declined')} className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:ring-offset-2">
              <FaTimesCircle className="h-4 w-4" /> Decline Request
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function DecisionLogEntry({ entry, onClick }) {
  const token = DECISION_TOKENS[entry.decision] || DECISION_TOKENS.Approved;
  const Icon = token.icon;

  return (
    <div 
      onClick={() => onClick(entry)}
      className={`relative cursor-pointer rounded-xl border border-slate-200 border-l-4 bg-white p-4 shadow-sm transition hover:shadow-md hover:bg-slate-50 ${token.border}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-bold text-slate-900">{entry.id}</span>
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${token.badge}`}>
              <Icon className="h-3 w-3" /> {token.label}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-600"><span className="font-medium text-slate-800">{entry.requester}</span> · {entry.department}</p>
          <p className="mt-2 text-sm text-slate-600">{entry.remarks}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-xs font-semibold text-slate-700">{entry.dateLabel}</p>
          <p className="text-[10px] uppercase tracking-wider text-slate-400">Decided by {entry.decidedBy}</p>
        </div>
      </div>
    </div>
  );
}

export default function WIPURSupervisorReviewPage() {
  const [view, setView] = useState('awaiting');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [returnedRequests, setReturnedRequests] = useState([]);
  const [decisionLog, setDecisionLog] = useState([]);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0, per_page: PER_PAGE });
  const [returnedPagination, setReturnedPagination] = useState({ current_page: 1, last_page: 1, total: 0, per_page: PER_PAGE });
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [decisionModal, setDecisionModal] = useState({ type: null, request: null });
  const [selectedLogEntry, setSelectedLogEntry] = useState(null);

  // Lightbox State
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [lightboxImages, setLightboxImages] = useState([]);

  const handleOpenLightbox = (file, attachments) => {
    const imageFiles = attachments.filter(f => (f?.type || '').toLowerCase().startsWith('image/'));
    const index = imageFiles.findIndex(f => f.id === file.id);
    if (index !== -1) {
      setLightboxImages(imageFiles);
      setLightboxIndex(index);
    }
  };

  useEffect(() => {
    if (lightboxIndex === null) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setLightboxIndex(null);
      if (e.key === 'ArrowRight' && lightboxIndex < lightboxImages.length - 1) setLightboxIndex(prev => prev + 1);
      if (e.key === 'ArrowLeft' && lightboxIndex > 0) setLightboxIndex(prev => prev - 1);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex, lightboxImages.length]);


  const mapPendingRequest = (item) => ({
    id: item.id,
    request_id: item.request_id ?? item.id,
    requester: item.requester ?? 'Unknown',
    department: item.department ?? 'Unassigned',
    submittedAt: item.submittedAt ?? '',
    submittedRelative: item.submittedRelative ?? 'Recently',
    requestType: item.requestType ?? 'Pending',
    remarks: item.remarks ?? 'No details provided.',
    step_remarks: item.step_remarks ?? '',
    decline_reason: item.decline_reason ?? '',
    sub_status: item.sub_status ?? '',
    attachmentsCount: item.attachmentsCount ?? 0,
    control_number: item.control_number ?? '',
    attachments: item.attachments ?? [],
  });

  const mapAuditEntry = (item) => ({
    id: item.id,
    request_id: item.request_id ?? item.id,
    requester: item.requester ?? 'Unknown',
    department: item.department ?? 'Unassigned',
    decision: item.decision ?? 'Approved',
    decidedBy: item.decidedBy ?? 'You',
    date: item.date ?? '',
    dateLabel: item.dateLabel ?? '',
    remarks: item.remarks ?? 'No remarks provided.',
    request_desc: item.request_desc ?? '',
    metadata: item.metadata ?? null,
  });

  const fetchPendingQueue = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get('/api/website-information/supervisor/pending', { params: { page, search, per_page: PER_PAGE } });
      const rows = (data?.data ?? []).map(mapPendingRequest);
      setPendingRequests(rows);
      setPagination(data?.meta ?? { current_page: 1, last_page: 1, total: rows.length, per_page: PER_PAGE });
      setSelected((current) => (!rows.length ? null : !current || !rows.some((r) => r.id === current.id) ? rows[0] : current));
    } catch (error) {
      console.error('Error fetching pending WIPUR queue:', error);
      setPendingRequests([]);
      setSelected(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchReturnedCount = async () => {
    try {
      const { data } = await axios.get('/api/website-information/supervisor/returned', { params: { search, per_page: 1 } });
      setReturnedPagination(data?.meta ?? { current_page: 1, last_page: 1, total: 0, per_page: 1 });
    } catch (error) {
      console.error('Error fetching returned WIPUR count:', error);
    }
  };

  const fetchReturnedQueue = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get('/api/website-information/supervisor/returned', { params: { page, search, per_page: PER_PAGE } });
      const rows = (data?.data ?? []).map(mapPendingRequest);
      setReturnedRequests(rows);
      setReturnedPagination(data?.meta ?? { current_page: 1, last_page: 1, total: rows.length, per_page: PER_PAGE });
      setSelected((current) => (!rows.length ? null : !current || !rows.some((r) => r.id === current.id) ? rows[0] : current));
    } catch (error) {
      console.error('Error fetching returned WIPUR queue:', error);
      setReturnedRequests([]);
      setSelected(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchDecisionLog = async () => {
    try {
      const { data } = await axios.get('/api/website-information/supervisor/audit', { params: { search, per_page: 20 } });
      setDecisionLog((data?.data ?? []).map(mapAuditEntry));
    } catch (error) {
      console.error('Error fetching WIPUR audit log:', error);
      setDecisionLog([]);
    }
  };

  useEffect(() => {
    fetchPendingQueue();
    fetchReturnedCount();
  }, [search]);

  useEffect(() => {
    if (view === 'awaiting') fetchPendingQueue();
    else if (view === 'returned') fetchReturnedQueue();
  }, [page, search, view]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (view === 'awaiting') fetchPendingQueue();
      else if (view === 'returned') fetchReturnedQueue();
      fetchReturnedCount();
    }, 13000);
    return () => clearInterval(intervalId);
  }, [page, search, view]);

  useEffect(() => { fetchDecisionLog(); }, [search, view]);

  const filteredLog = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return decisionLog;
    return decisionLog.filter((e) => 
      e.id.toLowerCase().includes(q) || e.requester.toLowerCase().includes(q) || 
      e.department.toLowerCase().includes(q) || e.remarks.toLowerCase().includes(q) || e.decision.toLowerCase().includes(q)
    );
  }, [decisionLog, search]);

  useEffect(() => { setPage(1); }, [search, view]);

  const handleDecision = async (request, decisionType, payload = {}) => {
    if (!request?.request_id) return;

    let endpoint = '';
    let requestPayload = {};

    if (decisionType === 'approve') {
      endpoint = `/api/website-information/supervisor/requests/${request.request_id}/approve`;
      requestPayload = { remarks: String(payload.remarks ?? request.step_remarks ?? '').trim() };
    } else if (decisionType === 'return') {
      endpoint = `/api/website-information/supervisor/requests/${request.request_id}/return`;
      requestPayload = { remarks: String(payload.remarks ?? '').trim() };
    } else if (decisionType === 'decline') {
      endpoint = `/api/website-information/supervisor/requests/${request.request_id}/decline`;
      requestPayload = {
        reason: String(payload.reason ?? '').trim(),
        remarks: String(payload.remarks ?? '').trim(),
      };
    } else {
      return;
    }

    try {
      await axios.post(endpoint, requestPayload);
      
      if (decisionType === 'approve') {
        toast.success('Request has been approved and forwarded to the admin.');
      } else if (decisionType === 'return') {
        toast.warn('Request has been returned to the requester for revision.');
      } else if (decisionType === 'decline') {
        toast.error('Request has been declined.');
      }

      if (view === 'awaiting') {
         await fetchPendingQueue();
      } else if (view === 'returned') {
         await fetchReturnedQueue();
      }
      await fetchDecisionLog();
      await fetchReturnedCount();
      
      setDecisionModal({ type: null, request: null });
      setView('log');
    } catch (error) {
      console.error(`Error recording WIPUR supervisor ${decisionType}:`, error);
      const message = error.response?.data?.message || `Failed to ${decisionType} the request.`;
      toast.error(message);
    }
  };

  const openDecisionModal = (request, decisionType) => {
    setDecisionModal({ type: decisionType, request });
  };

  const closeDecisionModal = () => setDecisionModal({ type: null, request: null });

  const currentQueue = view === 'returned' ? returnedRequests : pendingRequests;
  const currentPagination = view === 'returned' ? returnedPagination : pagination;
  const currentLoading = loading;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <WIPURNavigationPanel />
      <main className="flex-1">
        <div className="px-6 sm:px-8 lg:px-12 py-8 space-y-6">
          
          <SupervisorTitleCard pendingCount={pagination.total ?? pendingRequests.length} />

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="w-full max-w-lg">
              <ViewSwitcher 
                active={view} 
                onChange={setView} 
                pendingCount={pagination.total ?? pendingRequests.length} 
                returnedCount={returnedPagination.total ?? returnedRequests.length}
                logCount={decisionLog.length} 
              />
            </div>
            <div className="relative w-full max-w-md">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none"><FaSearch className="h-4 w-4 text-slate-400" /></div>
              <input
                value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder={view === 'awaiting' ? 'Search awaiting requests…' : view === 'returned' ? 'Search returned requests…' : 'Search your decision log…'}
                className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-4 text-sm text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 transition"
              />
            </div>
          </div>

          {(view === 'awaiting' || view === 'returned') && (
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(320px,420px)_1fr] items-stretch">
              
              <div className="flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-slate-50 px-3 py-2.5">
                  <h2 className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
                     {view === 'awaiting' ? 'Review Queue' : 'Returned Requests'}
                  </h2>
                  <span className="text-[11px] font-medium text-slate-500">{currentPagination.total ?? currentQueue.length} total</span>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto">
                  {currentLoading && currentQueue.length === 0 ? (
                    <div className="px-4 py-10 text-center text-sm text-slate-500">Loading requests…</div>
                  ) : currentQueue.length === 0 ? (
                    <div className="px-4 py-10 text-center">
                      <p className="text-sm font-medium text-slate-600">No requests match</p>
                      <p className="mt-1 text-xs text-slate-400">Try a different search.</p>
                    </div>
                  ) : (
                    <ul className="divide-y divide-slate-100">
                      {currentQueue.map((request) => (
                        <li key={request.id}>
                          <QueueRow request={request} isSelected={selected?.id === request.id} onSelect={setSelected} />
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <QueuePagination currentPage={currentPagination.current_page ?? 1} lastPage={Math.max(1, currentPagination.last_page ?? 1)} onChange={setPage} />
              </div>

              <div className="min-h-[500px]">
                <RequestDetailPane 
                  request={selected} 
                  onOpenDecisionModal={openDecisionModal} 
                  onOpenLightbox={handleOpenLightbox} 
                />
              </div>
            </div>
          )}

          {view === 'log' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">Decisions I've recorded</h2>
                <span className="text-xs font-medium text-slate-500">{filteredLog.length} entr{filteredLog.length === 1 ? 'y' : 'ies'}</span>
              </div>
              {filteredLog.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-slate-100 text-slate-400 ring-1 ring-slate-200"><FaHistory className="h-6 w-6" /></div>
                  <p className="mt-3 text-sm font-medium text-slate-600">Nothing here yet</p>
                  <p className="mt-1 text-xs text-slate-400">Once you approve, return, or decline a request, it will appear here.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredLog.map((entry) => (
                    <DecisionLogEntry 
                      key={entry.id} 
                      entry={entry} 
                      onClick={setSelectedLogEntry}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </main>

      <WIPURApproveModal
        isOpen={decisionModal.type === 'Approved' && !!decisionModal.request}
        request={decisionModal.request}
        onClose={closeDecisionModal}
        onConfirm={(payload) => handleDecision(decisionModal.request, 'approve', payload)}
      />

      <WIPURReturnModal
        isOpen={decisionModal.type === 'Returned' && !!decisionModal.request}
        request={decisionModal.request}
        onClose={closeDecisionModal}
        onConfirm={(payload) => handleDecision(decisionModal.request, 'return', payload)}
      />

      <WIPURDeclineModal
        isOpen={decisionModal.type === 'Declined' && !!decisionModal.request}
        request={decisionModal.request}
        onClose={closeDecisionModal}
        onConfirm={(payload) => handleDecision(decisionModal.request, 'decline', payload)}
      />

      <WIPURLogDetails 
        isOpen={!!selectedLogEntry} 
        onClose={() => setSelectedLogEntry(null)} 
        entry={selectedLogEntry} 
      />

      {/* Image Lightbox Overlay */}
      {lightboxIndex !== null && lightboxImages.length > 0 && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
          onClick={() => setLightboxIndex(null)}
        >
          <button 
            onClick={() => setLightboxIndex(null)}
            className="absolute top-6 right-6 rounded-full bg-black/50 p-2 text-white hover:bg-black/80 transition-colors"
          >
            <FaTimes className="h-6 w-6" />
          </button>

          {lightboxIndex > 0 && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                if (lightboxIndex > 0) setLightboxIndex(prev => prev - 1);
              }}
              className="absolute left-6 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-3 text-white hover:bg-black/80 transition-colors"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          <img
            src={`/storage/${lightboxImages[lightboxIndex].file_path}`}
            alt={lightboxImages[lightboxIndex].original_name || 'Preview'}
            className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />

          {lightboxIndex < lightboxImages.length - 1 && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                if (lightboxIndex < lightboxImages.length - 1) setLightboxIndex(prev => prev + 1);
              }}
              className="absolute right-6 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-3 text-white hover:bg-black/80 transition-colors"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-4 py-1.5 text-sm font-medium text-white tracking-wide">
            {lightboxIndex + 1} / {lightboxImages.length}
          </div>
        </div>
      )}
    </div>
  );
}