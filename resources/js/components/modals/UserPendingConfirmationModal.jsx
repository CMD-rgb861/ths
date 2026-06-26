import { useEffect, useState, useCallback, memo } from 'react';
import axios from 'axios';
import CSMModal from './CSMModal';

const TABS = ['Details', 'Dates'];

const Field = memo(({ title, description, children }) => (
  <div className="space-y-1">
    <label className="text-sm font-semibold">{title}</label>
    {children}
    {description && (
      <p className="text-xs text-gray-500">{description}</p>
    )}
  </div>
));

Field.displayName = 'Field';

export default function JobOrderOngoingModal({
  jobId,
  isOpen,
  onClose,
  onStatusChange,
  showNotification,
  isAdmin,
  isEditable = true
}) {
  const currentUser = JSON.parse(localStorage.getItem('user'));
  const [job, setJob] = useState(null);
  const [activeTab, setActiveTab] = useState(TABS[0]);
  const [confirming, setConfirming] = useState(false);
  const [isCsmModalOpen, setIsCsmModalOpen] = useState(false);

  const [form, setForm] = useState({
    diagnosis: '',
    action_taken: '',
    status: 'Pending',
    serviced_by: '',
    date_accepted: '',
    date_started: '',
    date_finished: '',
    cancel: false,
    unserviceable: false,
    remarks: '',
  });

  // Add these state hooks at the top of your component function
  const [hardwareFields, setHardwareFields] = useState({
    serial_number: '',
    brand_name: '',
    brand_model: '',
  });
  const [softwareName, setSoftwareName] = useState('');

  // Computed states
  const isCompleted = job?.action_report?.status === 'Completed';
  const isCancelled = job?.action_report?.status === 'Cancelled';
  const requestStatusName = job?.request_status?.name || job?.status;
  const cancelledById =
    job?.action_report?.cancelled_by &&
    (typeof job.action_report.cancelled_by === 'object'
      ? job.action_report.cancelled_by.id
      : job.action_report.cancelled_by);
  const isCancelledByUser =
    isCancelled &&
    cancelledById &&
    job?.requester &&
    cancelledById === job.requester.id;
  const isCancelledByAdminOrTech =
    isCancelled &&
    cancelledById &&
    job?.requester &&
    cancelledById !== job.requester.id;

  // A denial is persisted as Completed + Closed with only remarks and without actual service-work details.
  const hasServiceWorkDetails = !!(
    job?.action_report?.diagnosis ||
    job?.action_report?.serviced_by ||
    job?.action_report?.date_started ||
    job?.action_report?.date_finished ||
    job?.action_report?.serial_number ||
    job?.action_report?.software_name
  );
  const isDeniedByAdminOrTech =
    requestStatusName === 'Completed' &&
    job?.action_report?.action_taken === 'Closed' &&
    !!job?.action_report?.remarks &&
    !hasServiceWorkDetails;

  const getActorName = (value) => {
    if (!value) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'object') return value.name || '';
    return '';
  };

  const deniedByName =
    getActorName(job?.action_report?.cancelled_by) ||
    getActorName(job?.action_report?.accepted_by) ||
    getActorName(job?.action_report?.serviced_by) ||
    '—';

  const deniedAt = job?.action_report?.cancelled_at || job?.action_report?.updated_at;
  const isConfirmed = !!job?.action_report?.confirmed_at;
  const isRequester = job?.requester?.id === currentUser?.id;

  // Read only if cancelled/denied or admin/tech restrictions apply
  const readOnly = isCancelledByUser || isCancelledByAdminOrTech || isDeniedByAdminOrTech || !isAdmin || !isEditable || isCompleted;

  const showConfirmButtonUser =
    isRequester &&
    job?.action_report?.status === 'Ongoing' &&
    form.diagnosis &&
    form.action_taken &&
    !isConfirmed;


  // Date formatting utilities
  const formatDisplayDate = (dateString) => {
    if (!dateString) return '—';

    const isoString = dateString.includes(' ')
      ? dateString.replace(' ', 'T') + '+08:00'
      : dateString;

    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '—';

    return d.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  const formatDateTime = (value) => {
    if (!value) return '';

    const isoString = value.includes(' ')
      ? value.replace(' ', 'T') + '+08:00'
      : value;

    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '';

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };


  // Load job order data
  const loadJob = useCallback(() => {
    if (!jobId) return;

    axios
      .get(`/job-orders/${jobId}`)
      .then((res) => {
        const data = res.data;
        setJob(data);

        const ar = data.action_report;
        const newForm = {
          diagnosis: ar?.diagnosis || '',
          action_taken: ar?.action_taken || '',
          status: ar?.status && !isNaN(ar.status) ? parseInt(ar.status, 10) : 'Pending',
          serviced_by: ar?.serviced_by?.id || '',
          date_accepted: formatDateTime(ar?.accepted_at) || '',
          date_started: formatDateTime(ar?.date_started) || '',
          date_finished: formatDateTime(ar?.date_finished) || '',
          cancel: ar?.status === 'Cancelled',
          unserviceable: ar?.status === 'Unserviceable',
          remarks: ar?.remarks || '',
        };
        setForm(newForm);


        setHardwareFields({
          serial_number: ar?.serial_number || '',
          brand_name: ar?.brand_name || '',
          brand_model: ar?.brand_model || '',
        });
        setSoftwareName(ar?.software_name || '');
      })
    .catch((err) => console.error('Load job failed:', err));
  }, [jobId]);

  // Reload job data when modal opens
  useEffect(() => {
    if (isOpen) {
      loadJob();
    }
  }, [isOpen, jobId, loadJob]);



  const handleClose = () => {
    onClose();
  };

  const handleConfirm = async () => {
    if (!job?.id || confirming) return;

    setConfirming(true);

    try {
      await axios.patch(`/job-orders/${job.id}/confirm-diagnosis`);

      showNotification?.(
        'success',
        'Job Confirmed',
        'You have successfully confirmed the completion of this job.'
      );

      axios.post(`/job-orders/${job.id}/mark-notifications-read`)
        .catch(err => console.error('Failed to mark notifications as read:', err));

      const updatedJob = {
        ...job,
        action_report: {
          ...job.action_report,
          confirmed_at: new Date().toISOString(),
        },
      };

      setJob(updatedJob);
      if (onStatusChange) onStatusChange(updatedJob);
      loadJob();
    } catch (err) {
      console.error('Confirmation error:', err);
      const errorMessage = err.response?.data?.message || 'Something went wrong while confirming.';

      showNotification?.(
        'error',
        'Confirmation Failed',
        errorMessage
      );
    } finally {
      setConfirming(false);
    }
  };

  const handleCsmCancel = () => {
    setIsCsmModalOpen(false);
  };

  const handleCsmSave = async (formData) => {
    try {
      const payload = { ...formData };

      const intFields = [
        'cc1','cc2','cc3',
        'sqd0','sqd1','sqd2','sqd3','sqd4','sqd5','sqd6','sqd7','sqd8',
        'age'
      ];

      intFields.forEach((k) => {
        if (payload[k] !== undefined && payload[k] !== null && payload[k] !== '') {
          const v = parseInt(payload[k], 10);
          payload[k] = Number.isNaN(v) ? payload[k] : v;
        } else {
          delete payload[k];
        }
      });

      if (payload.date_time_visited && payload.date_time_visited.includes('T')) {
        payload.date_time_visited = payload.date_time_visited.replace('T', ' ') + ':00';
      }

      await axios.post(`/job-orders/${job.id}/action-report/csm`, payload);

      showNotification?.('success', 'Saved', 'CSM saved successfully.');
      setIsCsmModalOpen(false);

      const res = await axios.get(`/job-orders/${job.id}`);
      const updatedJob = res.data;
      setJob(updatedJob);
      if (onStatusChange) onStatusChange(updatedJob);
    } catch (err) {
      console.error('CSM save failed', err);

      if (err?.response?.status === 422 && err.response.data) {
        showNotification?.('error', 'Validation Error', 'Please complete the required fields.');
        return;
      }

      showNotification?.('error', 'Save Failed', 'Failed to save CSM.');
    }
  };

  if (!isOpen || !job) return null;

  // Helper: Get category names for this job
  const categoryNames = job?.categories?.map(c => c.name) || [];

  // Helper: Show hardware fields if any of these are checked
  const showHardwareFields = ['Computer Desktop', 'Printer', 'Laptop'].some(name => categoryNames.includes(name));
  const showSoftwareField = categoryNames.includes('Software');

  // Helper: Get status name from backend
  const getJobOrderStatusName = () => {
    // Prefer the related request_status.name if loaded, fallback to job.status (string or id)
    if (job?.request_status?.name) return job.request_status.name;
    if (typeof job?.status === 'string') return job.status;
    return '—';
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-7xl rounded-lg shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-white px-8 py-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Job Order - Pending Confirmation</h2>
          <p className="text-gray-600 mt-1">Review and update job order details and action report</p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-8">
            {/* Left Side - Job Information */}
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Job Information
                </h3>
                <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Job Order No.</p>
                      <p className="text-sm font-medium text-gray-900">{job.job_order_no || '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Date Created</p>
                      <p className="text-sm font-medium text-gray-900">{formatDisplayDate(job.created_at)}</p>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Department</p>
                    <p className="text-sm text-gray-900">{job.department?.name || '—'}</p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Categories</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {job.categories?.length > 0 ? (
                        job.categories.map((cat, idx) => (
                          <span key={idx} className="inline-flex items-center px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium border border-blue-200">
                            {cat.name}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-gray-400 italic">No categories</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Request Description</p>
                    <p className="text-sm text-gray-700 leading-relaxed">{job.request_description || '—'}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Requester Information
                </h3>
                <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
                  {job?.signature_name && job.requester?.role === 'admin' && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Signatory</p>
                      <p className="text-sm text-gray-900">{job.signature_name}</p>
                    </div>
                  )}
                  
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Requested By</p>
                    <p className="text-sm text-gray-900">
                      {job?.requester?.name ? (
                        job?.signature_name && job.requester?.role === 'admin' 
                          ? `(${job.requester.name})` 
                          : job.requester.name
                      ) : '—'}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Contact Number</p>
                    <p className="text-sm text-gray-900">{job.contact_no || '—'}</p>
                  </div>
                </div>
              </div>

              {/* Attachments Section */}
              {job.attachments?.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                    Attachments
                  </h3>
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="grid grid-cols-2 gap-3">
                      {job.attachments.map((file) => {
                        const fileUrl = `/storage/${file.file_path}`;

                        if (file.type === 'image') {
                          return (
                            <a
                              key={file.id}
                              href={fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="group relative block rounded-lg overflow-hidden border border-gray-200 hover:border-blue-500 transition-all"
                            >
                              <img
                                src={fileUrl}
                                alt={file.original_name}
                                className="w-full h-32 object-cover"
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                            </a>
                          );
                        }

                        if (file.type === 'pdf') {
                          return (
                            <a
                              key={file.id}
                              href={fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex flex-col items-center justify-center h-32 border border-gray-200 rounded-lg bg-red-50 hover:bg-red-100 hover:border-red-400 transition-all"
                            >
                              <svg className="w-10 h-10 text-red-500 mb-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                              </svg>
                              <span className="text-xs font-medium text-red-700">View PDF</span>
                            </a>
                          );
                        }

                        return null;
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Side - Action Report */}
            <div className="space-y-6">
              {/* Current Status at the top right */}
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide flex items-center">
                  <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                  Action Report
                </h3>
                {/* Current Status pill and report button */}
                <div className="flex items-center gap-2">
                  {/* Add label for current status */}
                  <span className="text-sm font-bold text-gray-700 mr-2">
                    Status:
                  </span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-700">
                    {getJobOrderStatusName()}
                  </span>
                  {/* Show Completed Report button */}
                  {isCompleted && (
                    <button
                      onClick={() =>
                        window.open(
                          `/job-orders/${jobId}/completed/pdf`,
                          "_blank"
                        )
                      }
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      View Report
                    </button>
                  )}
                  {/* Remove Unserviceable Report button from here */}
                </div>
              </div>

              {/* If cancelled/denied, show summary info and hide action report fields */}
              {(isCancelledByUser || isCancelledByAdminOrTech || isDeniedByAdminOrTech) ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 space-y-4">
                  <div className="flex items-center text-red-700">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span className="font-semibold">
                      {isDeniedByAdminOrTech
                        ? 'This job order was declined by an admin/technician.'
                        : isCancelledByUser
                        ? "This job order was cancelled by the requester."
                        : "This job order was declined"}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold">{isDeniedByAdminOrTech ? 'Declined by:' : 'Cancelled by:'}</span>{' '}
                    {isDeniedByAdminOrTech
                      ? deniedByName
                      : isCancelledByUser
                      ? job?.requester?.name || '—'
                      : (job?.action_report?.cancelled_by?.name ||
                         (typeof job.action_report.cancelled_by === 'object'
                           ? job.action_report.cancelled_by.name
                           : '—'))}
                  </div>
                  <div>
                    <span className="font-semibold">{isDeniedByAdminOrTech ? 'Declined at:' : 'Cancelled at:'}</span>{' '}
                    {(isDeniedByAdminOrTech ? deniedAt : job?.action_report?.cancelled_at)
                      ? formatDisplayDate(isDeniedByAdminOrTech ? deniedAt : job.action_report.cancelled_at)
                      : '—'}
                  </div>
                  {job?.action_report?.remarks && (
                    <div>
                      <span className="font-semibold">{isDeniedByAdminOrTech ? 'Decline Reason:' : 'Reason:'}</span>{' '}
                      {job.action_report.remarks}
                    </div>
                  )}
                </div>
              ) : (
                // ...existing code for tabs and action report fields...
                <>
                  {/* Tabs */}
                  <div className="flex space-x-1 border-b border-gray-200 mb-6">
                    {TABS.map((tab) => (
                      <button
                        key={tab}
                        className={`px-4 py-2 text-sm font-medium transition-colors ${
                          activeTab === tab
                            ? 'text-blue-600 border-b-2 border-blue-600'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                        onClick={() => setActiveTab(tab)}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                  <div className="space-y-6">
                    {activeTab === 'Details' && (
                      <div className="space-y-4">
                        {/* Assigned To: (Technician) - move to top */}
                        <Field title="Assign To:">
                          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-900">
                            {job?.action_report?.serviced_by?.name || '—'}
                          </div>
                        </Field>

                        {/* Show the rest of the Action Report fields only if a technician is selected */}
                        <>
                            <Field title="Diagnosis">
                              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-900">
                                {form.diagnosis || '—'}
                              </div>
                            </Field>

                            {/* Action Taken field first */}
                            <Field title="Action Taken">
                              <div className="flex items-center gap-2">
                                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-900">
                                  {form.action_taken || '—'}
                                </div>
                                {/* Show Unserviceable Report button if Unserviceable and Completed */}
                                {job?.action_report?.action_taken === "Unserviceable" &&
                                  (job?.request_status?.name === "Completed" ||
                                    job?.status === "Completed") && (
                                  <button
                                    onClick={() =>
                                      window.open(
                                        `/job-orders/${jobId}/unserviceable/pdf`,
                                        "_blank"
                                      )
                                    }
                                    className="inline-flex items-center px-4 py-2 bg-gray-700 text-white text-xs font-medium rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all ml-2"
                                  >
                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    View Unserviceable Report
                                  </button>
                                )}
                              </div>
                            </Field>

                            {/* Hardware extra fields - moved after Action Taken */}
                            {showHardwareFields && (
                              <div className="space-y-3">
                                <div>
                                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                                    Serial Number
                                  </label>
                                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm text-gray-900">
                                    {hardwareFields.serial_number || '—'}
                                  </div>
                                </div>

                                <div>
                                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                                    Brand Name
                                  </label>
                                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm text-gray-900">
                                    {hardwareFields.brand_name || '—'}
                                  </div>
                                </div>

                                <div>
                                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                                    Brand Model
                                  </label>
                                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm text-gray-900">
                                    {hardwareFields.brand_model || '—'}
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Software extra field - moved after Action Taken */}
                            {showSoftwareField && (
                              <div className="space-y-3">
                                <div>
                                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                                    Software Name
                                  </label>
                                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm text-gray-900">
                                    {softwareName || '—'}
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Show remarks if present */}
                            {form.remarks && (
                              <div className="mt-2">
                                <label className="block text-sm font-semibold text-gray-700 mb-1">
                                  Remarks
                                </label>
                                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-900">
                                  {form.remarks}
                                </div>
                              </div>
                            )}
                        </>
                      </div>
                    )}

                    {activeTab === 'Dates' && (
                      <div className="space-y-4">
                        <Field title="Date Accepted">
                          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-900">
                            {formatDisplayDate(form.date_accepted) || '—'}
                          </div>
                        </Field>

                        <Field title="Date Started">
                          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-900">
                            {formatDisplayDate(form.date_started) || '—'}
                          </div>
                        </Field>

                        <Field title="Date Finished">
                          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-900">
                            {formatDisplayDate(form.date_finished) || '—'}
                          </div>
                        </Field>

                        <Field title="Confirmed At">
                          {isConfirmed ? (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                              <div className="flex items-center">
                                <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="text-sm font-medium text-green-900">
                                  {formatDisplayDate(job?.action_report?.confirmed_at)}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                              <div className="flex items-center">
                                <svg className="w-5 h-5 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="text-sm font-medium text-yellow-900">
                                  Awaiting confirmation
                                </span>
                              </div>
                            </div>
                          )}
                        </Field>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-gray-50 border-t border-gray-200 px-8 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {showConfirmButtonUser && (
              <button
                onClick={() => setIsCsmModalOpen(true)}
                disabled={confirming}
                className={`inline-flex items-center px-6 py-2.5 rounded-lg text-white text-sm font-medium transition-all ${
                  confirming
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500'
                }`}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {confirming ? 'Confirming...' : 'Confirm Completion'}
              </button>
            )}

            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-2.5 bg-gray-700 text-white rounded-lg text-sm font-medium hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all"
            >
              Close
            </button>
          </div>
        </div>

        <CSMModal
          isOpen={isCsmModalOpen}
          initialData={{ rating: '', comments: '' }}
          onSave={handleCsmSave}
          onCancel={handleCsmCancel}
          showNotification={showNotification}
          job={job}
          onStatusChange={onStatusChange}
          loadJob={loadJob}
        />

      </div>
    </div>
  );
}