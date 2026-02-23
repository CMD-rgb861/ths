import { useEffect, useState } from 'react';
import CategorySelector from './CategorySelector';
import axios from 'axios';

export default function JobOrderForm({ userRole, showNotification }) {  // Added showNotification
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const MAX_FILES = 3;
  const MAX_SIZE = 10 * 1024 * 1024; // 10MB

  const initialForm = {
    date: new Date().toISOString().split('T')[0],
    department_id: '',
    request_description: '',
    contact_no: '',
    signature_name: '',  // For admins
    categories: [],
  };

  const [form, setForm] = useState(initialForm);

  /* ---------------- FETCH DEPARTMENTS ---------------- */
  useEffect(() => {
    axios.get('/departments')
      .then(res => {
        const rows = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data?.data)
            ? res.data.data
            : [];

        if (rows.length > 0) {
          setDepartments(rows);
        } else {
          setDepartments([
            { id: 1, name: 'REO' },
            { id: 2, name: 'Admission Office' },
            { id: 3, name: 'VPSD' }
          ]);
        }
      })
      .catch(() => {
        setDepartments([
          { id: 1, name: 'REO' },
          { id: 2, name: 'Admission Office' },
          { id: 3, name: 'VPSD' }
        ]);
      });
  }, []);

  /* ---------------- SUBMIT ---------------- */
  const submit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      const data = new FormData();

      // Append normal fields
      data.append('date', form.date);
      data.append('department_id', form.department_id);
      data.append('request_description', form.request_description);
      data.append('contact_no', form.contact_no);
      data.append('signature_name', form.signature_name);

      form.categories.forEach((cat, index) => {
        data.append(`categories[${index}][id]`, cat.id);
        data.append(
          `categories[${index}][other_description]`,
          cat.other_description ?? ''
        );
      });

      attachments.forEach((file) => {
        data.append('files[]', file);
      });

      await axios.post('/job-orders', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // ✅ SUCCESS NOTIFICATION
      showNotification?.(
        'success',
        'Job Order Submitted',
        'Job Order submitted successfully.'
      );

      setForm(initialForm);
      setAttachments([]);

    } catch (error) {
      console.log(error);
      console.log(error.response);
      console.log(error.response?.data);

      // ❌ ERROR NOTIFICATION
      showNotification?.(
        'error',
        'Submission Failed',
        error.response?.data?.message || 'Failed to submit Job Order.'
      );

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">
          New Job Order
        </h1>
        <p className="text-sm text-gray-500">
          Submit a technical request to the IT Support Office
        </p>
      </div>

      <form onSubmit={submit} className="bg-white border border-gray-200 rounded-xl p-6 space-y-6">
        
        {/* Department */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Department
          </label>
          <select
            value={form.department_id}
            onChange={e => setForm({ ...form, department_id: e.target.value })}
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
          >
            <option value="">Select department</option>
            {departments.map(d => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        {/* Categories */}
        <CategorySelector
          value={form.categories}
          onChange={(cats) =>
            setForm({
              ...form,
              categories: cats.map(cat => ({
                id: cat.id ?? cat.value,
                other_description: cat.other_description ?? null
              }))
            })
          }
        />

        {/* Request Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Request Description
          </label>
          <textarea
            rows="4"
            value={form.request_description}
            onChange={e =>
              setForm({
                ...form,
                request_description: e.target.value
              })
            }
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
          />
        </div>

        {/* Attachments */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Attachments (Max 3 images, 10MB each)
          </label>

          <input
            type="file"
            accept="image/*"
            multiple
            className="cursor-pointer block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-lg file:border-0
              file:text-sm file:font-semibold
              file:bg-gray-100 file:text-gray-700
              hover:file:bg-gray-200
              file:cursor-pointer"
            onChange={(e) => {
              const files = Array.from(e.target.files);

              if (attachments.length + files.length > MAX_FILES) {
                showNotification?.(
                  'warning',
                  'Attachment Limit',
                  'Maximum of 3 images allowed.'
                );
                return;
              }

              const validFiles = [];

              for (let file of files) {
                if (file.size > MAX_SIZE) {
                  showNotification?.(
                    'warning',
                    'File Too Large',
                    `${file.name} exceeds 10MB limit.`
                  );
                  continue;
                }
                validFiles.push(file);
              }

              setAttachments(prev => [...prev, ...validFiles]);
            }}
          />

          {/* Preview */}
          {attachments.length > 0 && (
            <div className="mt-4 grid grid-cols-3 gap-4">
              {attachments.map((file, index) => (
                <div
                  key={index}
                  className="relative border rounded-lg overflow-hidden"
                >
                  <img
                    src={URL.createObjectURL(file)}
                    alt="preview"
                    className="w-full h-32 object-cover"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setAttachments(prev =>
                        prev.filter((_, i) => i !== index)
                      )
                    }
                    className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Contact No */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Contact No
          </label>
          <input
            type="text"
            value={form.contact_no}
            onChange={e => {
              const regex = /^[0-9\+\-]*$/;
              // Only update the form state if the input matches the pattern
              if (regex.test(e.target.value)) {
                setForm({ ...form, contact_no: e.target.value });
              }
            }}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
          />
        </div>

        {/* Signature Name (Admin Only) */}
        {userRole === 'admin' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Signature Name
            </label>
            <input
              type="text"
              value={form.signature_name}
              onChange={e =>
                setForm({ ...form, signature_name: e.target.value })
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
            />
          </div>
        )}

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center px-5 py-2 text-sm font-medium rounded-lg bg-gray-900 text-white hover:bg-black transition disabled:opacity-50"
          >
            {loading ? 'Submitting...' : 'Submit Job Order'}
          </button>
        </div>
      </form>
    </div>
  );
}