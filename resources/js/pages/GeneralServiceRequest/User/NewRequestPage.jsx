import React, { useMemo, useState } from 'react';
import axios from 'axios';
import { usePage } from '@inertiajs/react';
import { toast } from 'react-toastify';
import GJORNavigationPanel from '../GJORNavigationPanel';

// Static — mirrors the seeded `gjor_request_for` table.
const REQUEST_FOR_OPTIONS = [
  { id: 1, name: 'Janitor(s)' },
  { id: 2, name: 'Plumber(s)' },
  { id: 3, name: 'Engineer(s)' },
  { id: 4, name: 'Electrician(s)' },
  { id: 5, name: 'Carpenter(s)' },
  { id: 6, name: 'Others' },
];

// shape: { [requestForId]: { checked: boolean, quantity: number } }
const emptySelections = () =>
  Object.fromEntries(
    REQUEST_FOR_OPTIONS.map((o) => [o.id, { checked: false, quantity: 0 }])
  );

const emptyForm = () => ({
  purpose: '',
  location: '',
  contact_no: '',
  selections: emptySelections(),
  attachments: [],
  others: '',
});

export default function NewRequestPage() {
  const { auth } = usePage().props;

  const departments = useMemo(() => {
    const list = Array.isArray(auth?.user?.departments) ? auth.user.departments : [];
    return list.filter((d) => d?.name);
  }, [auth?.user?.departments]);

  const hasDepartment = departments.length > 0;
  const departmentName = useMemo(() => {
    if (!hasDepartment) return 'No department assigned';
    return departments.map((d) => d.name).filter(Boolean).join(', ');
  }, [departments, hasDepartment]);

  const [form, setForm] = useState(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setField = (key, value) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  // ── Toggle a row on/off ─────────────────────────────────────
  const toggleChecked = (id) => {
    setForm((prev) => {
      const current = prev.selections[id] ?? { checked: false, quantity: 0 };
      const nextChecked = !current.checked;
      return {
        ...prev,
        selections: {
          ...prev.selections,
          [id]: {
            checked: nextChecked,
            // Checking → start at 1; unchecking → reset to 0
            quantity: nextChecked ? Math.max(1, current.quantity) : 0,
          },
        },
      };
    });
  };

  // ── Change quantity (only meaningful when checked) ─────────
  const setQuantity = (id, value) => {
    const n = Math.max(0, Math.min(999, parseInt(value, 10) || 0));
    setForm((prev) => ({
      ...prev,
      selections: {
        ...prev.selections,
        [id]: {
          checked: true, // editing quantity implies checked
          quantity: n,
        },
      },
    }));
  };

  const handleFileChange = (e) => {
    setField('attachments', Array.from(e.target.files || []));
  };

  const handleCancel = () => {
    setForm(emptyForm());
  };

  // ── Totals: only checked rows with quantity > 0 ────────────
  const totalPersonnel = useMemo(
    () =>
      Object.values(form.selections).reduce(
        (sum, s) => sum + (s.checked ? s.quantity || 0 : 0),
        0
      ),
    [form.selections]
  );

  const othersId = REQUEST_FOR_OPTIONS.find((o) => o.name === 'Others')?.id;
  const needsOthersDesc =
    othersId && form.selections[othersId]?.checked && form.selections[othersId]?.quantity > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ── Validation: toasts only ───────────────────────────────
    if (!hasDepartment) {
      toast.error('No department is assigned to your account. Please contact an administrator.');
      return;
    }
    if (!form.purpose.trim()) {
      toast.error('Please describe the purpose of the request.');
      return;
    }
    if (!form.location.trim()) {
      toast.error('Please specify the location.');
      return;
    }
    if (totalPersonnel <= 0) {
      toast.error('Please check at least one request type and set a quantity.');
      return;
    }
    if (needsOthersDesc && !form.others.trim()) {
      toast.error('Please describe the "Others" request.');
      return;
    }

    // ── Submit: toasts for success/failure ────────────────────
    try {
      setIsSubmitting(true);

      const fd = new FormData();
      fd.append('purpose', form.purpose);
      fd.append('location', form.location);
      fd.append('contact_no', form.contact_no || '');
      fd.append('others_desc', needsOthersDesc ? form.others : '');

      let idx = 0;
      REQUEST_FOR_OPTIONS.forEach((opt) => {
        const s = form.selections[opt.id];
        if (s?.checked && s.quantity > 0) {
          fd.append(`items[${idx}][request_for_id]`, String(opt.id));
          fd.append(`items[${idx}][quantity]`, String(s.quantity));
          idx++;
        }
      });

      form.attachments.forEach((file, i) => {
        fd.append(`attachments[${i}]`, file);
      });

      const { data } = await axios.post('/api/gjor/job-orders', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const successMsg =
        `Request submitted successfully. Reference: ${data?.request_no ?? '—'}` +
        (data?.summary ? ` — ${data.summary}` : '');

      toast.success(successMsg);
      setForm(emptyForm());
    } catch (err) {
      let errorMessage = 'Something went wrong. Please try again.';

      if (axios.isAxiosError(err)) {
        const serverMessage = err.response?.data?.message;
        const serverErrors = err.response?.data?.errors;

        if (serverErrors && typeof serverErrors === 'object') {
          const firstField = Object.keys(serverErrors)[0];
          const firstError = serverErrors[firstField];
          if (Array.isArray(firstError) && firstError.length > 0) {
            errorMessage = firstError[0];
          } else if (firstError) {
            errorMessage = String(firstError);
          }
        } else if (serverMessage) {
          errorMessage = serverMessage;
        }
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }

      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitDisabled = isSubmitting || !hasDepartment || totalPersonnel <= 0;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <GJORNavigationPanel />

      <main className="flex-1 bg-gray-50">
        <div className="px-6 sm:px-8 lg:px-12 py-8">
          <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <h1 className="text-3xl font-bold text-slate-800">New General Service Request</h1>
            <p className="mt-2 text-sm text-slate-600">
              Submit a service request for maintenance or support needs. The system will route it based on your account.
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit} noValidate>
            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="mb-6 flex items-center gap-3">
                <div>
                  <h2 className="text-lg font-bold uppercase tracking-wide text-slate-800">Request Information</h2>
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                {/* LEFT COLUMN */}
                <div className="space-y-6">
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Department <span className="text-red-500">*</span>
                    </label>
                    {hasDepartment ? (
                      <div className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800">
                        {departmentName}
                      </div>
                    ) : (
                      <div className="w-full rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
                        No department is assigned to your account. Please contact an administrator.
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Purpose <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={form.purpose}
                      onChange={(e) => setField('purpose', e.target.value)}
                      rows={5}
                      placeholder="Describe the purpose of the request..."
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Location <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={form.location}
                      onChange={(e) => setField('location', e.target.value)}
                      rows={3}
                      placeholder="Enter the exact location where the service is needed..."
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />
                  </div>
                </div>

                {/* RIGHT COLUMN */}
                <div className="space-y-6">
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Request For <span className="text-red-500">*</span>
                      </label>
                      <span className="text-xs font-semibold text-blue-700">
                        {totalPersonnel} personnel
                      </span>
                    </div>

                    <p className="mb-3 text-xs text-slate-500">
                      Check the types you need, then set how many of each.
                    </p>

                    <div className="grid gap-2">
                      {REQUEST_FOR_OPTIONS.map((opt) => {
                        const s = form.selections[opt.id] ?? { checked: false, quantity: 0 };
                        return (
                          <div
                            key={opt.id}
                            className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-2.5 transition ${
                              s.checked
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-slate-200 bg-white'
                            }`}
                          >
                            <label className="flex flex-1 cursor-pointer items-center gap-3">
                              <input
                                type="checkbox"
                                checked={s.checked}
                                onChange={() => toggleChecked(opt.id)}
                                className="h-4 w-4 cursor-pointer rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span
                                className={`text-sm font-medium ${
                                  s.checked ? 'text-blue-700' : 'text-slate-700'
                                }`}
                              >
                                {opt.name}
                              </span>
                            </label>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setQuantity(opt.id, s.quantity - 1)}
                                disabled={!s.checked || s.quantity <= 0}
                                className="h-7 w-7 cursor-pointer rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                                aria-label={`Decrease ${opt.name}`}
                              >
                                −
                              </button>
                              <input
                                type="number"
                                min="0"
                                max="999"
                                value={s.quantity}
                                onChange={(e) => setQuantity(opt.id, e.target.value)}
                                disabled={!s.checked}
                                className="w-14 rounded-md border border-slate-300 bg-white px-2 py-1 text-center text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                              />
                              <button
                                type="button"
                                onClick={() => setQuantity(opt.id, s.quantity + 1)}
                                disabled={!s.checked || s.quantity >= 999}
                                className="h-7 w-7 cursor-pointer rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                                aria-label={`Increase ${opt.name}`}
                              >
                                +
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {needsOthersDesc && (
                      <div className="mt-3">
                        <input
                          type="text"
                          value={form.others}
                          onChange={(e) => setField('others', e.target.value)}
                          placeholder="Please specify other request type"
                          className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Contact Number
                    </label>
                    <input
                      type="text"
                      value={form.contact_no}
                      onChange={(e) => setField('contact_no', e.target.value)}
                      placeholder="Enter contact number"
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                  📎
                </div>
                <div>
                  <h2 className="text-lg font-bold uppercase tracking-wide text-slate-800">Attachments</h2>
                  <p className="text-sm text-slate-500">Upload supporting documents or photos (optional)</p>
                </div>
              </div>

              <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-6">
                <input
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="block w-full cursor-pointer text-sm text-slate-600 file:mr-4 file:cursor-pointer file:rounded-xl file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-blue-700"
                />

                {form.attachments.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {form.attachments.map((file, index) => (
                      <div
                        key={`${file.name}-${index}`}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                      >
                        {file.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={handleCancel}
                disabled={isSubmitting}
                className="cursor-pointer rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitDisabled}
                className="cursor-pointer rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? 'Submitting…' : 'Submit Request'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}