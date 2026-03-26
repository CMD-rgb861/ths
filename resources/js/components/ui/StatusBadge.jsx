const map = {
  Pending: "bg-yellow-100 text-yellow-800",
  Ongoing: "bg-blue-100 text-blue-800",
  Completed: "bg-green-100 text-green-800",
  Cancelled: "bg-red-100 text-red-800",
  "Cancelled by User": "bg-red-200 text-red-900 border border-red-400",
  Unserviceable: "bg-gray-200 text-gray-800",
};

export default function StatusBadge({ status }) {
  if (!status) return null;

  return (
    <span className={`badge ${map[status] ?? "bg-gray-100 text-gray-700"}`}>
      {status}
    </span>
  );
}
