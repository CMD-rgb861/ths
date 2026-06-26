
import { useEffect, useState } from 'react';
import CategorySelector from './CategorySelector';
import axios from 'axios';

export default function JobOrderForm({ userRole, showNotification }) {  // Added showNotification
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const MAX_FILES = 3;
  const MAX_SIZE = 10 * 1024 * 1024; // 10MB

  const formatToManilaDate = () => {
    const date = new Date();
    // Get the date in Manila timezone
    return new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Manila' })).toISOString().split('T')[0]; 
  };

  // Use this function to set the initial date value in Manila time
  const initialForm = {
    date: formatToManilaDate(),
    department_id: '',
    request_description: '',
    contact_no: '',
    signature_name: '',
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
  // For example, on submit, convert the date to UTC
  const submit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      const data = new FormData();
      const formattedDate = new Date(form.date).toISOString();

      data.append('date', formattedDate);
      data.append('department_id', form.department_id);
      data.append('request_description', form.request_description);
      data.append('contact_no', form.contact_no);
      data.append('signature_name', form.signature_name);

      form.categories.forEach((cat, index) => {
        data.append(`categories[${index}][id]`, cat.id);
        data.append(`categories[${index}][other_description]`, cat.other_description ?? '');
      });

      attachments.forEach((file) => {
        data.append('files[]', file);
      });

      // Submit form data to the server
      const response = await axios.post('/job-orders', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Show success notification
      showNotification?.('success', 'Job Order Submitted', 'Job Order submitted successfully.');

      // Reset form
      setForm(initialForm);
      setAttachments([]);

    } catch (error) {
      // Log the error details to the console for further investigation
      console.log('Submission Error:', error);

      // Show error notification
      showNotification?.('error', 'Submission Failed', error.response?.data?.message || 'Failed to submit Job Order.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900">New Job Order Request</h1>
        <p className="text-sm text-gray-600 mt-1">
          Submit a technical request to the IT Support Office
        </p>
      </div>

      <form onSubmit={submit} className="space-y-6">
        {/* Main Form Card */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-8">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-6 flex items-center">
            <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Request Information
          </h3>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Department */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Department <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.department_id}
                  onChange={e => setForm({ ...form, department_id: e.target.value })}
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value="">Select department</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Contact No */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Contact Number
                </label>
                <input
                  type="text"
                  value={form.contact_no}
                  onChange={e => {
                    const regex = /^[0-9\+\-]*$/;
                    if (regex.test(e.target.value)) {
                      setForm({ ...form, contact_no: e.target.value });
                    }
                  }}
                  placeholder="Enter contact number"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Signature Name (Admin Only) */}
              {userRole === 'admin' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Signature Name
                  </label>
                  <input
                    type="text"
                    value={form.signature_name}
                    onChange={e =>
                      setForm({ ...form, signature_name: e.target.value })
                    }
                    placeholder="Enter signatory name"
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
              )}
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Request Description */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Request Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows="6"
                  value={form.request_description}
                  onChange={e =>
                    setForm({
                      ...form,
                      request_description: e.target.value
                    })
                  }
                  required
                  placeholder="Describe your technical request in detail..."
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Categories Card */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-8">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-6 flex items-center">
            <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            Service Categories <span className="text-red-500 ml-1">*</span>
          </h3>

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
        </div>

        {/* Attachments Card */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-8">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-6 flex items-center">
            <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
            Attachments
            <span className="ml-2 text-xs font-normal text-gray-500">(Optional - Max 3 images, 10MB each)</span>
          </h3>

          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-400 transition-colors">
              <input
                type="file"
                accept="image/*"
                multiple
                id="file-upload"
                className="hidden"
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
              <label
                htmlFor="file-upload"
                className="flex flex-col items-center cursor-pointer"
              >
                <svg className="w-12 h-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span className="text-sm font-medium text-gray-700 mb-1">
                  Click to upload images
                </span>
                <span className="text-xs text-gray-500">
                  PNG, JPG, GIF up to 10MB
                </span>
              </label>
            </div>

            {/* Preview */}
            {attachments.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {attachments.map((file, index) => (
                  <div
                    key={index}
                    className="relative group border border-gray-200 rounded-lg overflow-hidden"
                  >
                    <img
                      src={URL.createObjectURL(file)}
                      alt="preview"
                      className="w-full h-40 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setAttachments(prev =>
                          prev.filter((_, i) => i !== index)
                        )
                      }
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg opacity-0 group-hover:opacity-100"
                      title="Remove image"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-2 truncate">
                      {file.name}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center px-8 py-3 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Submitting...
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Submit Job Order
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
