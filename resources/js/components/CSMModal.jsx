import React, { useState, useEffect } from 'react';

export default function CSMModal({
  isOpen,
  initialData = {},
  onSave,
  onCancel,
  showNotification,
}) {
  const defaultForm = {
    client_type: '',
    client_category: '',
    name: '',
    sex: '',
    age: '',
    date_time_visited: '',
    region_of_residence: '',
    services_availed: '',
    service_provider_name: '',
    who_to_evaluate: '',
    office_or_faculty_unit_transacted: '',
    student_program: '',
    cc1: '', cc2: '', cc3: '',
    sqd0: '', sqd1: '', sqd2: '', sqd3: '', sqd4: '',
    sqd5: '', sqd6: '', sqd7: '', sqd8: '',
    client_category_other: '',
    who_to_evaluate_other: '',
    suggestions: '',
    email_address: '',
    ...initialData,
  };

  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [openSection, setOpenSection] = useState('basic');
  const [errors, setErrors] = useState({});

  const sectionFields = {
    basic: ['client_type', 'client_category', 'date_time_visited', 'sex', 'age', 'region_of_residence', 'services_availed', 'who_to_evaluate', 'client_category_other', 'who_to_evaluate_other'],
    cc: ['cc1', 'cc2', 'cc3'],
    sqd: ['sqd0','sqd1','sqd2','sqd3','sqd4','sqd5','sqd6','sqd7','sqd8'],
  };

  const errorInSection = (section) => {
    const keys = sectionFields[section] || [];
    return keys.some((k) => Boolean(errors[k]));
  };

  const clearError = (field) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const copy = { ...prev };
      delete copy[field];
      return copy;
    });
  };

  useEffect(() => {
    setForm({ ...defaultForm, ...initialData });
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    clearError(name);

    setForm((prev) => {
      let updated = { ...prev, [name]: value };

      if (name === 'cc1') {
        if (value === '4') {
          updated.cc2 = '5';
          updated.cc3 = '4';
        } else {
          updated.cc2 = '';
          updated.cc3 = '';
        }
      }

      return updated;
    });

    // clear dependent CC errors when cc1 changes
    if (name === 'cc1') {
      clearError('cc2');
      clearError('cc3');
    }
  };

  const isBasicComplete =
    form.client_type &&
    form.client_category &&
    form.date_time_visited;

  const handleSubmit = async () => {
    // Validation -> map field -> message
    const newErrors = {};

    // Basic required fields (match backend required fields)
    if (!form.client_type) newErrors.client_type = 'Client Type is required.';
    if (!form.client_category) newErrors.client_category = 'Client Category is required.';
    if (!form.date_time_visited) newErrors.date_time_visited = 'Date & Time of Visit is required.';
    if (!form.sex) newErrors.sex = 'Sex is required.';
    if (!form.age) newErrors.age = 'Age is required.';
    if (!form.region_of_residence) newErrors.region_of_residence = 'Region of residence is required.';
    if (!form.services_availed) newErrors.services_availed = 'Services availed is required.';
    if (!form.who_to_evaluate) newErrors.who_to_evaluate = 'Who to evaluate is required.';

    if (form.client_category === 'Others' && !form.client_category_other) {
      newErrors.client_category_other = 'Please specify the other Client Category.';
    }

    if (form.who_to_evaluate === 'Others' && !form.who_to_evaluate_other) {
      newErrors.who_to_evaluate_other = 'Please specify the other Who to Evaluate option.';
    }

    // CC
    if (!form.cc1) newErrors.cc1 = 'CC1 is required.';
    if (!form.cc2 && form.cc1 !== '4') newErrors.cc2 = 'CC2 is required.'; 
    if (!form.cc3 && form.cc1 !== '4') newErrors.cc3 = 'CC3 is required.';

    // SQD
    for (let i = 0; i <= 8; i++) {
      const key = 'sqd' + i;
      if (!form[key]) newErrors[key] = 'This item is required.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      // expand first section with errors for convenience
      if (errorInSection('basic')) setOpenSection('basic');
      else if (errorInSection('cc')) setOpenSection('cc');
      else if (errorInSection('sqd')) setOpenSection('sqd');

      showNotification?.('error', 'Validation Error', 'Please complete the required fields highlighted in red.');
      return;
    }

    setSaving(true);
    try {
      await onSave(form);
    } catch (err) {
      console.error('CSMModal save failed', err);
      showNotification?.('error', 'Save Failed', 'Failed to save CSM.');
    } finally {
      setSaving(false);
    }
  };

  const ratingOptions = [
    { value: "1", label: "Strongly Disagree" },
    { value: "2", label: "Disagree" },
    { value: "3", label: "Neither Agree nor Disagree" },
    { value: "4", label: "Agree" },
    { value: "5", label: "Strongly Agree" },
    { value: "6", label: "N/A Not Applicable" },
  ];

  const sqdQuestions = [
    { key: "sqd0", text: "SQD0. I am satisfied with the service that I availed." },
    { key: "sqd1", text: "SQD1. I spent a reasonable amount of time for my transaction." },
    { key: "sqd2", text: "SQD2. The office followed the transaction's requirements and steps based on the information provided." },
    { key: "sqd3", text: "SQD3. The steps (including payment) I needed to do for my transaction were easy and simple." },
    { key: "sqd4", text: "SQD4. I easily found information about my transaction from the office or its website." },
    { key: "sqd5", text: "SQD5. I paid a reasonable amount of fees for my transaction." },
    { key: "sqd6", text: "SQD6. I feel the office was fair to everyone, or \"walang palakasan\" during my transaction." },
    { key: "sqd7", text: "SQD7. I was treated courteously by the staff, and (if asked for help) the staff was helpful." },
    { key: "sqd8", text: "SQD8. I got what I needed from the government office, or (if denied) the denial of request was sufficiently explained to me." },
  ];

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-3xl p-6 max-h-[90vh] overflow-y-auto">

        <div className="mb-6">
          <h3 className="text-lg font-semibold">
            Client Satisfaction Measurement
          </h3>
          <div className="text-sm text-gray-600">Please complete the form below. Required fields are marked.</div>

          <div className="mt-4 p-4 bg-gray-50 border border-gray-100 rounded">
            <h4 className="text-sm font-semibold text-gray-800">HELP US SERVE YOU BETTER!</h4>
            <p className="mt-2 text-sm text-gray-700">
              This Client Satisfaction Measurement (CSM) tracks the customer experiences of government offices. Your feedback on your recently concluded transaction will help this office provide a better service. Personal information shared will be kept confidential and you always have the option to not answer this form.
            </p>
          </div>
        </div>

        <div className="space-y-6">

          {/* BASIC INFORMATION */}
          <div className="border rounded-lg p-4">
            <button
              type="button"
              onClick={() => setOpenSection(openSection === 'basic' ? null : 'basic')}
              className="w-full text-left font-semibold text-gray-800"
            >
              Basic Information
            </button>

            {(openSection === 'basic' || errorInSection('basic')) && (
              <div className="mt-4 space-y-4">

                {/* Client Type */}
                <div className={`${errors.client_type ? 'border border-red-500 rounded p-2' : ''}`}>
                  <p className="font-medium mb-1">Client Type *</p>
                  {['Citizen', 'Business', 'Government (Employee or another agency)'].map((type) => (
                    <label key={type} className="flex items-center gap-2 mb-1">
                      <input
                        type="checkbox"
                        name="client_type"
                        value={type}
                        checked={form.client_type === type}
                        onChange={() => {
                          setForm((prev) => ({
                            ...prev,
                            client_type: prev.client_type === type ? '' : type
                          }));
                          clearError('client_type');
                        }}
                      />
                      <span>{type}</span>
                    </label>
                  ))}
                </div>

                {/* Client Category */}
                <div className={`${errors.client_category || errors.client_category_other ? 'border border-red-500 rounded p-2' : ''}`}>
                  <p className="font-medium mb-1">Client Category *</p>
                  {['Student', 'Visitor', 'Faculty', 'Admin/Personnel', 'Others'].map((cat) => (
                    <label key={cat} className="flex items-center gap-2 mb-1">
                      <input
                        type="checkbox"
                        name="client_category"
                        value={cat}
                        checked={form.client_category === cat}
                        onChange={() => {
                          setForm((prev) => ({
                            ...prev,
                            client_category: prev.client_category === cat ? '' : cat,
                            client_category_other: prev.client_category === cat ? '' : prev.client_category_other
                          }));
                          clearError('client_category');
                          clearError('client_category_other');
                        }}
                      />
                      <span>{cat}</span>
                    </label>
                  ))}
                  {form.client_category === 'Others' && (
                    <input
                      type="text"
                      name="client_category_other"
                      placeholder="Specify other category"
                      value={form.client_category_other || ''}
                      onChange={(e) => { setForm((prev) => ({ ...prev, client_category_other: e.target.value })); clearError('client_category_other'); }}
                      className={`border rounded p-2 mt-1 w-full ${errors.client_category_other ? 'border-red-500' : ''}`}
                    />
                  )}
                </div>

                {/* Name */}
                <div>
                  <p className="font-medium mb-1">Name (Optional) *</p>
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    className="border rounded p-2 w-full"
                    placeholder="Name (optional)"
                  />
                </div>

                {/* Sex */}
                <div className={`${errors.sex ? 'border border-red-500 rounded p-2' : ''}`}>
                  <p className="font-medium mb-1">Sex</p>
                  {['Male', 'Female'].map((sex) => (
                    <label key={sex} className="flex items-center gap-2 mb-1">
                      <input
                        type="checkbox"
                        name="sex"
                        value={sex}
                        checked={form.sex === sex}
                        onChange={() => {
                          setForm((prev) => ({
                            ...prev,
                            sex: prev.sex === sex ? '' : sex
                          }));
                          clearError('sex');
                        }}
                      />
                      <span>{sex}</span>
                    </label>
                  ))}
                </div>

                {/* Age */}
                <div>
                <p className="font-medium mb-1">Age*</p>
                  <input
                    name="age"
                    type="number"
                    value={form.age}
                    onChange={handleChange}
                    className={`border rounded p-2 w-full ${errors.age ? 'border-red-500' : ''}`}
                    placeholder="Age"
                  />
                </div>

                {/* Date and Time Visited */}
                <div>
                <p className="font-medium mb-1">Date & Time of Visit*</p>
                  <input
                    name="date_time_visited"
                    type="datetime-local"
                    value={form.date_time_visited}
                    onChange={handleChange}
                    className={`border rounded p-2 w-full ${errors.date_time_visited ? 'border-red-500' : ''}`}
                    placeholder="Date & Time of Visit"
                  />
                </div>

                {/* Region of Residence */}
                <div>
                <p className="font-medium mb-1">Region of Residence*</p>
                  <input
                    name="region_of_residence"
                    value={form.region_of_residence}
                    onChange={handleChange}
                    className={`border rounded p-2 w-full ${errors.region_of_residence ? 'border-red-500' : ''}`}
                    placeholder="Region of Residence"
                  />
                </div>

                {/* Services Availed */}
                <div>
                <p className="font-medium mb-1">Services Availed*</p>
                  <input
                    name="services_availed"
                    value={form.services_availed}
                    onChange={handleChange}
                    className={`border rounded p-2 w-full ${errors.services_availed ? 'border-red-500' : ''}`}
                    placeholder="Services Availed"
                  />
                </div>

                {/* Service Provider Name */}
                <div>
                <p className="font-medium mb-1">Name of Person Who Provided Service (optional)</p>
                  <input
                    name="service_provider_name"
                    value={form.service_provider_name}
                    onChange={handleChange}
                    className="border rounded p-2 w-full"
                    placeholder="Name of Person Who Provided Service (optional)"
                  />
                </div>

                {/* Who to Evaluate */}
                <div className={`${errors.who_to_evaluate || errors.who_to_evaluate_other ? 'border border-red-500 rounded p-2' : ''}`}>
                  <p className="font-medium mb-1">Which of the following are you going to evaluate?</p>
                  {['Student', 'Faculty', 'Admin/Personnel', 'Others'].map((option) => (
                    <label key={option} className="flex items-center gap-2 mb-1">
                      <input
                        type="checkbox"
                        name="who_to_evaluate"
                        value={option}
                        checked={form.who_to_evaluate === option}
                        onChange={() => {
                          setForm((prev) => ({
                            ...prev,
                            who_to_evaluate: prev.who_to_evaluate === option ? '' : option,
                            who_to_evaluate_other: prev.who_to_evaluate === option ? '' : prev.who_to_evaluate_other
                          }));
                          clearError('who_to_evaluate');
                          clearError('who_to_evaluate_other');
                        }}
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                  {form.who_to_evaluate === 'Others' && (
                    <input
                      type="text"
                      name="who_to_evaluate_other"
                      placeholder="Specify others"
                      value={form.who_to_evaluate_other || ''}
                      onChange={(e) => { setForm((prev) => ({ ...prev, who_to_evaluate_other: e.target.value })); clearError('who_to_evaluate_other'); }}
                      className={`border rounded p-2 mt-1 w-full ${errors.who_to_evaluate_other ? 'border-red-500' : ''}`}
                    />
                  )}
                </div>

                {/* Office/Faculty Unit Transacted */}
                <div>
                <p className="font-medium mb-1">Office/Faculty Unit Transacted*</p>
                  <input
                    name="office_or_faculty_unit_transacted"
                    value={form.office_or_faculty_unit_transacted}
                    onChange={handleChange}
                    className="border rounded p-2 w-full"
                    placeholder="Office/Faculty Unit Transacted"
                  />
                </div>

                {/* Student Program */}
                <div>
                <p className="font-medium mb-1">Student Program (if applicable)</p>
                  <input
                    name="student_program"
                    value={form.student_program}
                    onChange={handleChange}
                    className="border rounded p-2 w-full"
                    placeholder="Student Program (if applicable)"
                  />
                </div>

              </div>
            )}
          </div>

          {/* CORE CRITERIA (CC) */}
          <div className="border rounded-lg p-4">
            <button
              type="button"
              onClick={() => setOpenSection(openSection === 'cc' ? null : 'cc')}
              className="w-full text-left font-semibold text-gray-800"
            >
              Core Criteria (CC) *
            </button>

            {(openSection === 'cc' || errorInSection('cc')) && (
              <div className={`mt-4 space-y-6 ${errorInSection('cc') ? 'border border-red-500 rounded p-3' : ''}`}>

                {/* CC1 */}
                <p className="text-sm text-gray-600 mb-3">
                The Criteria's Charter is an official document that reflects the services of a government agency/office including its requirements, fees, and processing times among others. Proceed with the questions.
                </p>
                <div>
                <p className="font-medium mb-2">
                    CC1. Which of the following best describes your awareness of a CC?
                </p>
                {[
                    { value: "1", label: "1. I know what a CC is and I saw this office's CC." },
                    { value: "2", label: "2. I know what a CC is but did NOT see this office's CC." },
                    { value: "3", label: "3. I learned of the CC only when I saw this office's CC." },
                    { value: "4", label: '4. I do not know what a CC is and I did not see one in this office. (Answer "N/A" on CC2 and CC3)' },
                ].map((option) => (
                    <label key={option.value} className="flex items-start gap-2 mb-1">
                    <input
                        type="radio"
                        name="cc1"
                        value={option.value}
                        checked={form.cc1 === option.value}
                        onChange={handleChange}
                        className="relative top-1.5" 
                    />
                    <span>{option.label}</span>
                    </label>
                ))}
                </div>

                {/* CC2 */}
                <div className={form.cc1 === "4" ? "opacity-50 pointer-events-none" : ""}>
                  <p className="font-medium mb-2">
                    CC2. If aware of CC (answered 1-3 in CC1), would you say that the CC was...?
                  </p>
                  {[{ value: "1", label: "Easy to see" },
                    { value: "2", label: "Somewhat easy to see" },
                    { value: "3", label: "Difficult to see" },
                    { value: "4", label: "Not visible at all" },
                    { value: "5", label: "N/A" },
                  ].map((option) => (
                    <label key={option.value} className="flex items-center gap-2 mb-1">
                      <input
                        type="radio"
                        name="cc2"
                        value={option.value}
                        checked={form.cc2 === option.value}
                        onChange={handleChange}
                      />
                      <span>{option.label}</span>
                    </label>
                  ))}
                </div>

                {/* CC3 */}
                <div className={form.cc1 === "4" ? "opacity-50 pointer-events-none" : ""}>
                  <p className="font-medium mb-2">
                    CC3. If aware of CC (answered 1-3 in CC1), how much did the CC help you?
                  </p>
                  {[{ value: "1", label: "Helped very much" },
                    { value: "2", label: "Somewhat helped" },
                    { value: "3", label: "Did not help" },
                    { value: "4", label: "N/A" },
                  ].map((option) => (
                    <label key={option.value} className="flex items-center gap-2 mb-1">
                      <input
                        type="radio"
                        name="cc3"
                        value={option.value}
                        checked={form.cc3 === option.value}
                        onChange={handleChange}
                      />
                      <span>{option.label}</span>
                    </label>
                  ))}
                </div>

              </div>
            )}
          </div>

          {/* SQD SECTION */}
          <div className="border rounded-lg p-4">
            <button
              type="button"
              onClick={() => setOpenSection(openSection === 'sqd' ? null : 'sqd')}
              className="w-full text-left font-semibold text-gray-800"
            >
              Service Quality Dimensions (SQD)
            </button>

            {(openSection === 'sqd' || errorInSection('sqd')) && (
              <div className="mt-4 space-y-6">
                {sqdQuestions.map((q) => (
                  <div key={q.key} className={`${errors[q.key] ? 'border border-red-500 rounded p-2' : ''}`}>
                    <p className="font-medium mb-2">{q.text}</p>
                    {ratingOptions.map((option) => (
                      <label key={option.value} className="flex items-center gap-2 mb-1">
                        <input
                          type="radio"
                          name={q.key}
                          value={option.value}
                          checked={form[q.key] === option.value}
                          onChange={(e) => { handleChange(e); clearError(q.key); }}
                        />
                        <span>{option.label}</span>
                      </label>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>

            {/* ================= SUGGESTIONS ================= */}
            <div className="border rounded-lg p-4">
            <label className="block text-sm font-medium">
                Suggestions (optional)
            </label>
            <textarea
                name="suggestions"
                value={form.suggestions}
                onChange={handleChange}
                className="w-full border rounded p-2 mt-1"
                rows={3}
            />
            </div>

            <div className="border rounded-lg p-4">
            <label className="block text-sm font-medium">
                Email Address (optional)
            </label>
            <input
                name="email_address"
                value={form.email_address}
                onChange={handleChange}
                className="w-full border rounded p-2 mt-1"
            />
            </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => { onCancel && onCancel(); }}
            className="px-4 py-2 border rounded"
            disabled={saving}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-600 text-white rounded"
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save CSM'}
          </button>
        </div>

      </div>
    </div>
  );
}