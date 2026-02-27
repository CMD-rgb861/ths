import { useEffect, useState, useCallback, memo } from 'react';
import axios from 'axios';
import UnserviceableModal from './UnserviceableModal';
import CSMModal from './CSMModal';

const STATUS_OPTIONS = ['Pending', 'Ongoing', 'Cancelled'];
const TABS = ['Details', 'Dates'];

const Info = memo(({ label, value }) => (
  <div>
    <div className="text-xs text-gray-500">{label}</div>
    <div className="text-sm font-medium text-gray-900 break-words">
      {value || '—'}
    </div>
  </div>
));

const Field = memo(({ title, description, children }) => (
  <div className="space-y-1">
    <label className="text-sm font-semibold">{title}</label>
    {children}
    {description && (
      <p className="text-xs text-gray-500">{description}</p>
    )}
  </div>
));

export default function JobOrderOngoingModal({
  jobId,
  isOpen,
  onClose,
  onStatusChange,
  showNotification,
  isAdmin,
  isEditable = true
}) {
  const [job, setJob] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [showConfirmForAdmin, setShowConfirmForAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState(TABS[0]);
  const [isUnserviceableModalOpen, setIsUnserviceableModalOpen] = useState(false);
  

  const currentUser = JSON.parse(localStorage.getItem('user'));

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
  });

  // CSM (Client Satisfaction Measurement) states
  const [csmChecked, setCsmChecked] = useState(false);
  const [csmCompleted, setCsmCompleted] = useState(false);
  const [isCsmModalOpen, setIsCsmModalOpen] = useState(false);
  

  // ================= COMPUTED STATES =================

  const isCompleted =
    job?.action_report?.status === 'Completed';
  
  const isUnserviceable =
    job?.action_report?.status === 'Unserviceable';

  const isCancelled =
    job?.action_report?.status === 'Cancelled';

  const isConfirmed =
    !!job?.action_report?.confirmed_at;

  const isRequester =
    job?.requester?.id === currentUser?.id;
    

const readOnly =
  !isAdmin ||
  !isEditable ||
  isCompleted;

  const showConfirmButtonUser =
    !isAdmin &&
    isRequester &&
    job?.action_report?.status === 'Ongoing' &&
    form.diagnosis &&
    form.action_taken &&
    !isConfirmed;

  const showConfirmButtonForAdmin =
    isAdmin &&
    isRequester &&
    showConfirmForAdmin &&
    job?.action_report?.status === 'Ongoing' &&
    form.diagnosis &&
    form.action_taken &&
    !isConfirmed;

  // ================= FORMATTERS =================
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

    // Convert to YYYY-MM-DDTHH:MM for datetime-local
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // ================= LOAD JOB =================

  const loadJob = useCallback(() => {
    if (!jobId) return;

    setLoading(true);

    axios
      .get(`/job-orders/${jobId}`)
      .then((res) => {
        const data = res.data;
        setJob(data);

        // Update the form state based on the fetched job data
        setForm({
          diagnosis: data.action_report?.diagnosis || '',
          action_taken: data.action_report?.action_taken || '',
          status: data.action_report?.status || 'Pending',
          serviced_by: data.action_report?.serviced_by?.id || '',  // Default to empty string
          date_accepted: formatDateTime(data.action_report?.accepted_at) || '',
          date_started: formatDateTime(data.action_report?.date_started) || '',  // Default to empty string
          date_finished: formatDateTime(data.action_report?.date_finished) || '',  // Default to empty string
          cancel: data.action_report?.status === "Cancelled",  // Fetch cancel status
          unserviceable: data.action_report?.status === "Unserviceable",  // Fetch unserviceable status
          remarks: data.action_report?.remarks || '',  // Populate remarks
        });
        // Reset admin-confirm flag whenever job is (re)loaded
        setShowConfirmForAdmin(false);
  // CSM: if action_report indicates CSM was completed, reflect it
  const csmDone = !!data.action_report?.csm_completed;
  setCsmCompleted(csmDone);
  setCsmChecked(csmDone);

      })
      .catch((err) => console.error('Load job failed:', err))
      .finally(() => setLoading(false));
  }, [jobId]);

  // ================= LOAD TECHNICIANS =================

  useEffect(() => {
    axios
      .get('/technicians')
      .then((res) => setUsers(res.data))
      .catch(() => setUsers([]));
  }, []);

  // ================= RELOAD WHEN OPEN =================

  useEffect(() => {
    if (isOpen) {
      loadJob();
    }
  }, [isOpen, jobId, loadJob]);

  // ================= HANDLE UNSERVICEABLE CHANGE =================

  const handleUnserviceableChange = (e) => {
    const { checked } = e.target;

    // If trying to check → open modal FIRST
    if (checked) {
      setIsUnserviceableModalOpen(true);
    }

    // If trying to uncheck → allow unchecking directly
    else {
      setForm((prev) => ({
        ...prev,
        unserviceable: false,
      }));
    }
};

  // ================= HANDLE CHANGE =================

  const handleChange = (e) => {
    if (readOnly && !isAdmin) return; // Allow only admins to make changes

    const { name, value, type, checked } = e.target;

    if (type === 'checkbox') {
    if (name === 'cancel') {
      setForm((prev) => ({
        ...prev,
        cancel: checked,
        unserviceable: checked ? false : prev.unserviceable,
      }));
    }

    if (name === 'unserviceable') {
      setForm((prev) => ({
        ...prev,
        unserviceable: checked,
        cancel: checked ? false : prev.cancel,
      }));
    }
    } else {
      setForm((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  // ================= SAVE ACTION REPORT =================

  const handleSave = async () => {
    console.log('Form before save:', form);

    if (!job?.id || saving) return;

    // ================= VALIDATION =================

    if (!form.serviced_by || !form.date_started || !form.date_finished) {
      showNotification(
        "error",
        "Validation Failed",
        "Technician, Date Started, and Date Finished are required."
      );
      return;
    }

    if (!form.diagnosis || !form.action_taken) {
      showNotification(
        "error",
        "Validation Failed",
        "Diagnosis and Action Taken are required."
      );
      return;
    }

    if (form.cancel && !form.remarks) {
      showNotification(
        "error",
        "Validation Failed",
        "Remarks are required when cancelling a job."
      );
      return;
    }

    if (form.unserviceable && !form.remarks) {
      showNotification(
        "error",
        "Validation Failed",
        "Remarks are required when marking as Unserviceable."
      );
      return;
    }

    setSaving(true);

    const updatedForm = {
      ...form,
      // Explicitly set to false so the admin-side shows "Waiting for confirmation"
      // immediately after Save Changes.
      conformed: false,
    };

    console.log('Updated form with conformed:', updatedForm);

    let request;

    try {
      // 🔴 CANCEL
      if (form.cancel) {
        await Promise.all([
          axios.put(`/job-orders/${job.id}/action-report`, {
            diagnosis: form.diagnosis,
            action_taken: form.action_taken,
            serviced_by: form.serviced_by,
            date_started: form.date_started,
            date_finished: form.date_finished,
            remarks: form.remarks,
          }),
          axios.put(`/job-orders/${job.id}`, {
            status: "Cancelled",
          }),
        ]);
      }

      // 🟡 UNSERVICEABLE
      else if (form.unserviceable) {
        await Promise.all([
          axios.put(`/job-orders/${job.id}/action-report`, {
            diagnosis: form.diagnosis,
            action_taken: form.action_taken,
            serviced_by: form.serviced_by,
            date_started: form.date_started,
            date_finished: form.date_finished,
            remarks: form.remarks,
          }),
          axios.put(`/job-orders/${job.id}`, {
            status: "Unserviceable",
          }),
        ]);
      }

      // 🟢 NORMAL SAVE
      else {
        await axios.put(
          `/job-orders/${job.id}/action-report`,
          updatedForm
        );
      }

      showNotification(
        "success",
        "Action Report Updated",
        "The job order action report was saved successfully."
      );

      // ✅ Fetch updated job ONLY ONCE
      const res = await axios.get(`/job-orders/${job.id}`);
      const updatedJob = res.data;

      // ✅ Update modal state directly (NO loadJob call)
      setJob(updatedJob);

      setForm({
        diagnosis: updatedJob.action_report?.diagnosis || '',
        action_taken: updatedJob.action_report?.action_taken || '',
        status: updatedJob.action_report?.status || 'Pending',
        serviced_by: updatedJob.action_report?.serviced_by?.id || '',
        date_accepted: formatDateTime(updatedJob.action_report?.accepted_at) || '',
        date_started: formatDateTime(updatedJob.action_report?.date_started) || '',
        date_finished: formatDateTime(updatedJob.action_report?.date_finished) || '',
        cancel: updatedJob.action_report?.status === "Cancelled",
        unserviceable: updatedJob.action_report?.status === "Unserviceable",
        remarks: updatedJob.action_report?.remarks || '',
      });
      // Ensure parent list gets updated immediately. If the job is Ongoing,
      // explicitly set a client-side `conformed` flag to false so the
      // `StatusIndicator` will render the "Waiting for confirmation" state
      // right after Save Changes.
      try {
        const notifyJob = { ...updatedJob };
        if (notifyJob.action_report && notifyJob.action_report.status === 'Ongoing') {
          notifyJob.action_report.conformed = false;
        }
        if (onStatusChange) onStatusChange(notifyJob);
      } catch (e) {
        // ignore notify errors
      }
      // If admin saved and the report is in Ongoing + has required fields and not yet confirmed,
      // show the confirm button beside Save Changes for the admin.
      if (isAdmin) {
        const ar = updatedJob.action_report || {};
        const shouldShowConfirmForAdmin =
          ar.status === 'Ongoing' &&
          ar.diagnosis &&
          ar.action_taken &&
          !ar.confirmed_at;

        setShowConfirmForAdmin(shouldShowConfirmForAdmin);
      }

    } catch (err) {
      console.error(err);
      showNotification(
        "error",
        "Update Failed",
        "Something went wrong while updating the action report."
      );
    } finally {
      setSaving(false);
    }
  };

  // ================= CONFIRM COMPLETION =================

  const handleConfirm = async () => {
    if (!job?.id || confirming) return;

    setConfirming(true);

    try {
      // Send confirm request
      await axios.patch(`/job-orders/${job.id}/confirm-diagnosis`);

      showNotification(
        'success',
        'Job Confirmed',
        'You have successfully confirmed the completion of this job.'
      );

      // Optimistic UI update: mark the action_report as confirmed locally
      const updatedJob = {
        ...job,
        action_report: {
          ...job.action_report,
          confirmed_at: new Date().toISOString(),
        },
      };

      setJob(updatedJob);

      // Notify parent immediately with optimistic data if provided
      if (onStatusChange) onStatusChange(updatedJob);

      // Refresh in background to get authoritative data, but don't await it
      loadJob();
    } catch (err) {
      console.error(err);
      showNotification(
        'error',
        'Confirmation Failed',
        'Something went wrong while confirming.'
      );
    } finally {
      setConfirming(false);
    }
  };

  // ================= CSM (Client Satisfaction Measurement) =================
  const requesterIsUser = job?.requester?.role === 'user';

  const handleCsmCheckboxChange = (e) => {
    const checked = e.target.checked;
    // If checking and CSM not yet completed -> open modal to fill it
    if (checked) {
      if (csmCompleted) {
        setCsmChecked(true);
      } else {
        setCsmChecked(true);
        setIsCsmModalOpen(true);
      }
    } else {
      // Unchecking disables completion
      setCsmChecked(false);
      setCsmCompleted(false);
    }
  };

  

  const handleCsmCancel = () => {
    setIsCsmModalOpen(false);
    setCsmChecked(false);
    // don't mark completed
  };

  const handleCsmSave = async (formData) => {
    // form validation is handled by the CSM modal; just submit payload

    try {
      // Normalize payload: convert numeric-string fields to integers and
      // convert datetime-local into a format Laravel accepts reliably.
      const payload = { ...formData };

      // Integer fields expected by backend
      const intFields = [
        'cc1','cc2','cc3',
        'sqd0','sqd1','sqd2','sqd3','sqd4','sqd5','sqd6','sqd7','sqd8',
        'age'
      ];

      intFields.forEach((k) => {
        if (payload[k] !== undefined && payload[k] !== null && payload[k] !== '') {
          // parseInt on radio/string values
          const v = parseInt(payload[k], 10);
          payload[k] = Number.isNaN(v) ? payload[k] : v;
        } else {
          // remove empty strings to let server handle nullable vs required_if
          delete payload[k];
        }
      });

      // Normalize date_time_visited from `YYYY-MM-DDTHH:MM` to `YYYY-MM-DD HH:MM:00`
      if (payload.date_time_visited) {
        const dt = payload.date_time_visited;
        if (dt.includes('T')) {
          payload.date_time_visited = dt.replace('T', ' ') + ':00';
        }
      }

      // Save CSM to backend - endpoint should be implemented server-side
      await axios.post(`/job-orders/${job.id}/action-report/csm`, payload);

      showNotification('success', 'Saved', 'CSM saved successfully.');

      setCsmCompleted(true);
      setCsmChecked(true);
      setIsCsmModalOpen(false);

      // Refresh job and notify parent
      const res = await axios.get(`/job-orders/${job.id}`);
      const updatedJob = res.data;
      setJob(updatedJob);
      if (onStatusChange) onStatusChange(updatedJob);
    } catch (err) {
      console.error('CSM save failed', err);

      // Surface server validation messages when available
      if (err?.response?.status === 422 && err.response.data) {
        const data = err.response.data;
        // Laravel returns errors in `errors` key; show concise message
        const validationErrors = data.errors ? Object.entries(data.errors).map(([k, v]) => `${k}: ${v.join(', ')}`).join('\n') : data.message || 'Validation failed';
        showNotification('error', 'Save Failed', validationErrors);
        console.error('Validation details:', data);
        return;
      }

      showNotification('error', 'Save Failed', 'Failed to save CSM.');
    }
  };

  const handleClose = () => {
    onClose();
  };

  if (!isOpen || !job) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-6xl rounded-2xl shadow-2xl overflow-hidden max-h-[90vh]">

        {/* ================= HEADER ================= */}
        <div className="flex justify-between items-center px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">
            Job Order Details
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-800 text-xl"
          >
            ✕
          </button>
        </div>

        {/* ================= CONTENT ================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8 overflow-y-auto">

          {/* LEFT SIDE */}
          <div className="space-y-4">
            <h3 className="font-semibold border-b pb-2">
              Job Information
            </h3>

            <Info label="Job Order No." value={job.job_order_no} />
            <Info label="Date" value={formatDisplayDate(job.created_at)} />
            <Info label="Department" value={job.department?.name} />
            <Info
              label="Categories"
              value={job.categories?.map(c => c.name).join(', ')}
            />
            <Info
              label="Request Description"
              value={job.request_description}
            />
            {job?.signature_name && job.requester?.role === 'admin' && (
              <Info label="Signatory" value={job.signature_name} />
            )}

            <Info
              label="Requested By"
              value={
                job?.requester?.name
                  ? (job?.signature_name && job.requester?.role === 'admin' ? `(${job.requester.name})` : job.requester.name)
                  : '—'
              }
            />
            <Info label="Contact No." value={job.contact_no} />

            {/* ================= ATTACHMENTS SECTION ================= */}
            {job.attachments?.length > 0 && (
              <div className="space-y-2 pt-4">
                <h4 className="text-sm font-semibold text-gray-700 border-b pb-1">
                  Attachments
                </h4>

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
                          className="block"
                        >
                          <img
                            src={fileUrl}
                            alt={file.original_name}
                            className="rounded-lg border hover:opacity-80 transition cursor-pointer object-cover h-32 w-full"
                          />
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
                          className="flex items-center justify-center h-32 border rounded-lg bg-gray-100 hover:bg-gray-200 transition text-sm font-medium"
                        >
                          📄 View PDF
                        </a>
                      );
                    }

                    return null;
                  })}
                </div>
              </div>
            )}
            {/* ========================================================= */}
          </div>

          {/* RIGHT SIDE (UNCHANGED) */}
          <div className="space-y-4 flex flex-col">
            <h3 className="font-semibold border-b pb-2">
              Action Report
            </h3>

            <div className="flex space-x-2 border-b">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  className={`px-3 py-1 text-sm font-medium ${
                    activeTab === tab
                      ? 'border-b-2 border-gray-900'
                      : 'text-gray-500'
                  }`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="mt-4 space-y-4 overflow-y-auto max-h-[60vh]">

              {activeTab === 'Details' && (
                <>
                  <Field title="Diagnosis">
                    {readOnly ? (
                      <div className="text-sm font-medium text-gray-900">{form.diagnosis || '—'}</div>
                    ) : (
                      <textarea
                        name="diagnosis"
                        value={form.diagnosis}
                        onChange={handleChange}
                        className="w-full border rounded-lg p-2 text-sm"
                        rows="3"
                        disabled={readOnly}
                      />
                    )}
                  </Field>

                  <Field title="Action Taken">
                    {readOnly ? (
                      <div className="text-sm font-medium text-gray-900">{form.action_taken || '—'}</div>
                    ) : (
                      <textarea
                        name="action_taken"
                        value={form.action_taken}
                        onChange={handleChange}
                        className="w-full border rounded-lg p-2 text-sm"
                        rows="3"
                        disabled={readOnly}
                      />
                    )}
                  </Field>

                  <Field title="Status:">
                    <div className="flex items-center justify-start gap-3">
                      <div className="text-sm font-medium text-gray-900">
                        {form.status || '—'}
                      </div>

                      {/* Show Completed report button when status is Completed */}
                      {isCompleted && (
                        <button
                          onClick={() =>
                            window.open(
                              `/job-orders/${jobId}/completed/pdf`,
                              "_blank"
                            )
                          }
                          className={`px-3 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl shadow-md hover:bg-indigo-700 hover:shadow-lg active:scale-95 transition-all duration-200`}
                        >
                          View Report
                        </button>
                      )}
                    </div>
                  </Field>

                  {/* ================= RENDER THE CHECKBOXES ================= */}

                  {isAdmin && (
                    <Field title="Cancellation / Unserviceable">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-6">

                        {/* LEFT SIDE – CHECKBOXES */}
                        <div className="flex items-center space-x-6">

                          {/* Cancel */}
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              id="cancel"
                              name="cancel"
                              checked={form.cancel}
                              onChange={handleChange}
                              className="mr-2 h-4 w-4 accent-red-600"
                              disabled={readOnly}
                            />
                            <label htmlFor="cancel" className="text-sm font-medium text-gray-700">
                              Cancel
                            </label>
                          </div>

                          {/* Unserviceable */}
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              id="unserviceable"
                              name="unserviceable"
                              checked={form.unserviceable}
                              onChange={handleUnserviceableChange}
                              className="mr-2 h-4 w-4 accent-blue-600"
                              disabled={readOnly}
                            />
                            <label htmlFor="unserviceable" className="text-sm font-medium text-gray-700">
                              Unserviceable
                            </label>
                          </div>

                        </div>

                        {isUnserviceable &&  (
                          <button
                            onClick={() =>
                              window.open(
                                `/job-orders/${jobId}/unserviceable/pdf`,
                                "_blank"
                              )
                            }
                            className="
                              px-3 py-2
                              bg-indigo-600
                              text-white
                              text-sm font-semibold
                              rounded-xl
                              shadow-md
                              hover:bg-indigo-700
                              hover:shadow-lg
                              active:scale-95
                              transition-all duration-200
                            "
                          >
                            View Report
                          </button>
                        )}

                      </div>
                    </Field>
                  )}

                  {/* Show Unserviceable Modal when open */}
                  <UnserviceableModal
                    isOpen={isUnserviceableModalOpen}
                    jobId={jobId}
                    showNotification={showNotification}
                    onClose={() => {
                      // Cancel
                      setIsUnserviceableModalOpen(false);
                    }}
                    onSaved={() => {
                      // Only when successfully saved
                      setIsUnserviceableModalOpen(false);
                      setForm((prev) => ({
                        ...prev,
                        cancel: false,
                        unserviceable: true,
                      }));
                    }}
                  />


                  <Field title="Technician">
                    {readOnly ? (
                      <div className="text-sm font-medium text-gray-900">
                        {job?.action_report?.serviced_by?.name || '—'}
                      </div>
                    ) : (
                      <select
                        name="serviced_by"
                        value={form.serviced_by}
                        onChange={handleChange}
                        className="w-full border rounded-lg p-2 text-sm"
                        disabled={readOnly}
                      >
                        <option value="">Select Technician</option>
                        {users.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name}
                          </option>
                        ))}
                      </select>

                    )}
                  </Field>

                  <Field title="Remarks">
                    {/* Show Remarks in Admin Side */}
                    {readOnly ? (
                      // User Side: Only show if remarks are not empty
                      form.remarks ? (
                        <div className="text-sm font-medium text-gray-900">{form.remarks || '—'}</div>
                      ) : (
                        // Don't render anything if remarks are empty
                        <div className="hidden" />
                      )
                    ) : (
                      // Admin Side: Always show remarks field, editable
                      <textarea
                        name="remarks"
                        value={form.remarks}
                        onChange={handleChange}
                        className="w-full border rounded-lg p-2 text-sm"
                        rows="3"
                        disabled={readOnly}
                      />
                    )}
                  </Field>
                </>
              )}

              {activeTab === 'Dates' && (
 
                  <>
                    <Field title="Date Accepted">
                      {readOnly ? (
                        <div className="text-sm font-medium text-gray-900">
                          {formatDisplayDate(form.date_accepted) || '—'}
                        </div>
                      ) : (
                        <input
                          type="datetime-local"
                          value={form.date_accepted || ''}
                          disabled
                          className="w-full border rounded-lg p-2 text-sm bg-gray-100"
                        />
                      )}
                    </Field>

                    <Field title="Date Started">
                      {readOnly ? (
                        <div className="text-sm font-medium text-gray-900">
                          {formatDisplayDate(form.date_started) || '—'}
                        </div>
                      ) : (
                        <input
                          type="datetime-local"
                          name="date_started"
                          value={form.date_started || ''}
                          onChange={handleChange}
                          disabled={readOnly}
                          className="w-full border rounded-lg p-2 text-sm"
                        />
                      )}
                    </Field>

                    <Field title="Date Finished">
                      {readOnly ? (
                        <div className="text-sm font-medium text-gray-900">
                          {formatDisplayDate(form.date_finished) || '—'}
                        </div>
                      ) : (
                        <input
                          type="datetime-local"
                          name="date_finished"
                          value={form.date_finished || ''}
                          onChange={handleChange}
                          disabled={readOnly}
                          className="w-full border rounded-lg p-2 text-sm"
                        />
                      )}
                    </Field>

                    <Field title="Confirmed At">
                    {isConfirmed ? (
                      <div className="text-sm font-medium text-gray-900">
                        {formatDisplayDate(job?.action_report?.confirmed_at) || '—'}
                      </div>
                    ) : (
                      <div className="text-sm font-medium text-gray-500">Not confirmed yet</div>
                    )}
                  </Field>
                  </>
                )}

            </div>
          </div>
        </div>
        

        {(!readOnly || showConfirmButtonUser) && (
          <div className="px-8 pb-4 flex flex-col sm:flex-row sm:items-center gap-3 border-t bg-white">
            <div className="flex items-center gap-3">
              {showConfirmButtonForAdmin && (
                <button
                  onClick={handleConfirm}
                  disabled={confirming}
                  className={`px-6 py-2 rounded-lg text-white ${
                    confirming
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  {confirming ? 'Confirming...' : 'Confirm'}
                </button>
              )}

              {!readOnly && (
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className={`px-6 py-2 rounded-lg text-white ${
                    saving
                      ? 'bg-gray-500 cursor-not-allowed'
                      : 'bg-gray-900 hover:bg-gray-800'
                  }`}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              )}
            </div>

            {showConfirmButtonUser && (
              <div className="flex items-center gap-4 ml-auto">
                {/* CSM checkbox for requester when requester is a regular user */}
                {requesterIsUser && isRequester && (
                  <label className="inline-flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={csmChecked}
                      onChange={handleCsmCheckboxChange}
                      className="h-4 w-4"
                    />
                    <span className="text-sm">Client Satisfaction Measurement (CSM)</span>
                  </label>
                )}

                <button
                  onClick={handleConfirm}
                  disabled={confirming || (requesterIsUser && !csmCompleted)}
                  className={`px-6 py-2 rounded-lg text-white ${
                    confirming || (requesterIsUser && !csmCompleted)
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  {confirming ? 'Confirming...' : 'Confirm'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* CSM modal — delegate to reusable component */}
        <CSMModal
          isOpen={isCsmModalOpen}
          initialData={{ rating: '', comments: '' }}
          onSave={handleCsmSave}
          onCancel={handleCsmCancel}
          showNotification={showNotification}
        />

      </div>
    </div>
  );
}
