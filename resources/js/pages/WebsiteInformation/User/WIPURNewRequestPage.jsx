import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { usePage } from '@inertiajs/react';
import { toast } from 'react-toastify';
import WIPURNavigationPanel from '../WIPURNavigationPanel';

const REQUEST_DESC_MAX = 4000;

const emptyForm = () => ({
  request_desc: '',
  attachments: [],
});

export default function NewRequestPage() {
  const { auth } = usePage().props;

  // Match backend: pick the user's department with the lowest id (first)
  const department = useMemo(() => {
    const list = Array.isArray(auth?.user?.departments) ? auth.user.departments : [];
    const valid = list.filter((d) => d?.id && d?.name);
    if (valid.length === 0) return null;
    return [...valid].sort((a, b) => a.id - b.id)[0];
  }, [auth?.user?.departments]);

  const hasDepartment = !!department;
  const departmentName = department?.name ?? 'No department assigned';

  const [form, setForm] = useState(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setField = (key, value) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleFileChange = (e) => {
    setField('attachments', Array.from(e.target.files || []));
  };

  const handleCancel = () => {
    setForm(emptyForm());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!hasDepartment) {
      toast.error('No department is assigned to your account. Please contact an administrator.');
      return;
    }

    if (!form.request_desc.trim()) {
      toast.error('Please enter the website page/pages to be posted or updated.');
      return;
    }

    if (form.request_desc.length > REQUEST_DESC_MAX) {
      toast.error(`Description is too long (max ${REQUEST_DESC_MAX} characters).`);
      return;
    }

    try {
      setIsSubmitting(true);

      const fd = new FormData();
      fd.append('request_desc', form.request_desc.trim());
      // department_id intentionally NOT sent — backend auto-resolves

      form.attachments.forEach((file, i) => {
        fd.append(`attachments[${i}]`, file);
      });

      const { data } = await axios.post('/api/website-information/requests', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success(`Request submitted successfully. Reference: ${data?.control_number ?? '—'}`);
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

  const submitDisabled = isSubmitting || !hasDepartment;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <WIPURNavigationPanel />

      <main className="flex-1 bg-gray-50">
        <div className="px-6 sm:px-8 lg:px-12 py-8">
          <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <h1 className="text-3xl font-bold text-slate-800">New Website Information Request</h1>
            <p className="mt-2 text-sm text-slate-600">
              Submit the website page or pages you need posted or updated.
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit} noValidate>
            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="mb-6 flex items-center gap-3">
                <div>
                  <h2 className="text-lg font-bold uppercase tracking-wide text-slate-800">Request Information</h2>
                </div>
              </div>

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
                    Website Page/Pages to be Posted/Update: <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={form.request_desc}
                    onChange={(e) => setField('request_desc', e.target.value)}
                    rows={6}
                    maxLength={REQUEST_DESC_MAX}
                    placeholder="Enter the website page/pages to be posted or updated..."
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                  <div className="mt-1 text-right text-xs text-slate-500">
                    {form.request_desc.length} / {REQUEST_DESC_MAX}
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