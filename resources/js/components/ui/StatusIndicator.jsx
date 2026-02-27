import { FaCheck, FaSpinner } from 'react-icons/fa';

// Shows a small indicator beneath the StatusBadge for Ongoing jobs when
// an action report exists. The text differs depending on whether the
// current user is the requester or an admin.
const StatusIndicator = ({ status, actionReport, requesterId }) => {
  const user = JSON.parse(localStorage.getItem('user'));
  const isRequester = user?.id === requesterId;

  // Only handle Ongoing state here
  if (status !== 'Ongoing') return null;

  // If there's no action report (admin hasn't saved action report yet),
  // Don't render an indicator until the action report has meaningful content.
  // Some backends create an empty `action_report` record on Accept — we
  // should not show the waiting indicator until the admin actually
  // submits the action report fields (diagnosis, action_taken, technician,
  // dates, or remarks).
  const hasReportContent = actionReport && (
    !!actionReport.diagnosis ||
    !!actionReport.action_taken ||
    !!actionReport.serviced_by ||
    !!actionReport.date_started ||
    !!actionReport.date_finished ||
    !!actionReport.remarks
  );

  if (!hasReportContent) return null;

  // Consider confirmed if backend provided a confirmed_at timestamp or a boolean
  const isConfirmed = !!(actionReport.confirmed_at || actionReport.confirmed || actionReport.conformed);

  if (isConfirmed) {
    return (
      <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
        <FaCheck className="mr-1" />
        {isRequester ? 'Confirmed' : 'Conformed'}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">
      <FaSpinner className="mr-1 animate-spin" />
      {isRequester ? 'Waiting for your confirmation' : 'Waiting for confirmation'}
    </span>
  );
};

export default StatusIndicator;
