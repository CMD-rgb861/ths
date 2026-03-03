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
  };

  const [form, setForm] = useState({ ...defaultForm, ...initialData });
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState({});

  const sectionFields = {
    basic: [
      'client_type', 'client_category', 'date_time_visited', 'sex', 'age',
      'region_of_residence', 'services_availed', 'who_to_evaluate',
      'client_category_other', 'who_to_evaluate_other', 'office_or_faculty_unit_transacted'
    ],
    cc: ['cc1', 'cc2', 'cc3'],
    sqd: ['sqd0','sqd1','sqd2','sqd3','sqd4','sqd5','sqd6','sqd7','sqd8'],
  };

  const sectionMap = ['basic','cc','sqd'];

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

    if (name === 'cc1') {
      clearError('cc2');
      clearError('cc3');
    }
  };

  const validateAll = () => {
    const newErrors = {};

    if (!form.client_type) newErrors.client_type = 'Client Type is required.';
    if (!form.client_category) newErrors.client_category = 'Client Category is required.';
    if (!form.date_time_visited) newErrors.date_time_visited = 'Date & Time of Visit is required.';
    if (!form.sex) newErrors.sex = 'Sex is required.';
    if (!form.age) newErrors.age = 'Age is required.';
    if (!form.region_of_residence) newErrors.region_of_residence = 'Region of residence is required.';
    if (!form.services_availed) newErrors.services_availed = 'Services availed is required.';
    if (!form.who_to_evaluate) newErrors.who_to_evaluate = 'Who to evaluate is required.';
    if (!form.office_or_faculty_unit_transacted) newErrors.office_or_faculty_unit_transacted = 'Office/Faculty Unit Transacted is required.';

    if (form.client_category === 'Others' && !form.client_category_other) {
      newErrors.client_category_other = 'Please specify the other Client Category.';
    }

    if (form.who_to_evaluate === 'Others' && !form.who_to_evaluate_other) {
      newErrors.who_to_evaluate_other = 'Please specify the other Who to Evaluate option.';
    }

    if (!form.cc1) newErrors.cc1 = 'CC1 is required.';
    if (!form.cc2 && form.cc1 !== '4') newErrors.cc2 = 'CC2 is required.';
    if (!form.cc3 && form.cc1 !== '4') newErrors.cc3 = 'CC3 is required.';

    for (let i = 0; i <= 8; i++) {
      const key = 'sqd' + i;
      if (!form[key]) newErrors[key] = 'This item is required.';
    }

    return newErrors;
  };

  const handleSubmit = async () => {
    const newErrors = validateAll();

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);

      if (errorInSection('basic')) setStep(0);
      else if (errorInSection('cc')) setStep(1);
      else if (errorInSection('sqd')) setStep(2);

      showNotification?.(
        'error',
        'Validation Error',
        'Please complete the required fields highlighted in red.'
      );
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

  const goNext = () => {
    const allErrors = validateAll();
    const currentSection = sectionMap[step];

    const filteredErrors = Object.fromEntries(
      Object.entries(allErrors).filter(([key]) =>
        sectionFields[currentSection].includes(key)
      )
    );

    setErrors(filteredErrors);

    if (Object.keys(filteredErrors).length > 0) {
      showNotification?.(
        'error',
        'Validation Error',
        'Please complete required fields before proceeding.'
      );
      return;
    }

    setStep((prev) => prev + 1);
  };

  const goBack = () => {
    setStep((prev) => prev - 1);
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
    { key: "sqd6", text: "SQD6. I feel the office was fair to everyone." },
    { key: "sqd7", text: "SQD7. I was treated courteously by the staff." },
    { key: "sqd8", text: "SQD8. I got what I needed from the government office." },
  ];

  // Render
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-3xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="mb-6">
          <h3 className="text-lg font-semibold">Client Satisfaction Measurement</h3>
          <div className="text-sm text-gray-600">Please complete the form below. Required fields are marked.</div>
          <div className="mt-4 p-4 bg-gray-50 border border-gray-100 rounded">
            <h4 className="text-sm font-semibold text-gray-800">HELP US SERVE YOU BETTER!</h4>
            <p className="mt-2 text-sm text-gray-700">
              This Client Satisfaction Measurement (CSM) tracks the customer experiences of government offices. Your feedback will help improve service. Personal info is confidential.
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* STEPS: Basic, CC, SQD */}
          {step === 0 && (
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold text-gray-800 mb-4">Basic Information</h4>
              <div className="space-y-4">

                {/* Client Type */}
                <div className={`${errors.client_type ? 'border border-red-500 rounded p-2' : ''}`}>
                  <p className="font-medium mb-1">Client Type *</p>
                  {['Citizen', 'Business', 'Government (Employee or another agency)'].map((type) => (
                    <label key={type} className="flex items-center gap-2 mb-1">
                      <input
                        type="checkbox"
                        checked={form.client_type === type}
                        onChange={() => {
                          setForm(prev => ({ ...prev, client_type: type })); // always set value
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
                        checked={form.client_category === cat}
                        onChange={() => {
                          setForm(prev => ({
                            ...prev,
                            client_category: cat, // always set value
                            client_category_other: cat === 'Others' ? prev.client_category_other : '', // clear if not Others
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
                      onChange={(e) => {
                        setForm(prev => ({ ...prev, client_category_other: e.target.value }));
                        clearError('client_category_other');
                      }}
                      className={`border rounded p-2 mt-1 w-full ${errors.client_category_other ? 'border-red-500' : ''}`}
                    />
                  )}
                </div>

                {/* Name */}
                <div className={`${errors.name ? 'border border-red-500 rounded p-2' : ''}`}>
                  <p className="font-medium mb-1">Name *</p>
                  <input
                    type="text"
                    name="name"
                    value={form.name || ''}
                    onChange={(e) => {
                      setForm(prev => ({ ...prev, name: e.target.value }));
                      clearError('name');
                    }}
                    className="border rounded p-2 w-full"
                  />
                </div>

                {/* Sex */}
                <div className={`${errors.sex ? 'border border-red-500 rounded p-2' : ''}`}>
                  <p className="font-medium mb-1">Sex *</p>
                  {['Male', 'Female'].map((sex) => (
                    <label key={sex} className="flex items-center gap-2 mb-1">
                      <input
                        type="checkbox"
                        checked={form.sex === sex}
                        onChange={() => {
                          setForm(prev => ({ ...prev, sex: sex }));
                          clearError('sex');
                        }}
                      />
                      <span>{sex}</span>
                    </label>
                  ))}
                </div>

                {/* Age */}
                <div className={`${errors.age ? 'border border-red-500 rounded p-2' : ''}`}>
                  <p className="font-medium mb-1">Age *</p>
                  <input
                    type="number"
                    name="age"
                    value={form.age || ''}
                    onChange={(e) => {
                      setForm(prev => ({ ...prev, age: e.target.value }));
                      clearError('age');
                    }}
                    className="border rounded p-2 w-full"
                  />
                </div>

                {/* Date & Time of Visit */}
                <div className={`${errors.date_time_visited ? 'border border-red-500 rounded p-2' : ''}`}>
                  <p className="font-medium mb-1">Date & Time of Visit *</p>
                  <input
                    type="datetime-local"
                    name="date_time_visited"
                    value={form.date_time_visited || ''}
                    onChange={(e) => {
                      setForm(prev => ({ ...prev, date_time_visited: e.target.value }));
                      clearError('date_time_visited');
                    }}
                    className="border rounded p-2 w-full"
                  />
                </div>

                {/* Region of Residence */}
                <div className={`${errors.region_of_residence ? 'border border-red-500 rounded p-2' : ''}`}>
                  <p className="font-medium mb-1">Region of Residence *</p>
                  <input
                    type="text"
                    name="region_of_residence"
                    value={form.region_of_residence || ''}
                    onChange={(e) => {
                      setForm(prev => ({ ...prev, region_of_residence: e.target.value }));
                      clearError('region_of_residence');
                    }}
                    className="border rounded p-2 w-full"
                  />
                </div>

                {/* Services Availed */}
                <div className={`${errors.services_availed ? 'border border-red-500 rounded p-2' : ''}`}>
                  <p className="font-medium mb-1">Services Availed *</p>
                  <input
                    type="text"
                    name="services_availed"
                    value={form.services_availed || ''}
                    onChange={(e) => {
                      setForm(prev => ({ ...prev, services_availed: e.target.value }));
                      clearError('services_availed');
                    }}
                    className="border rounded p-2 w-full"
                  />
                </div>

                {/* Who to Evaluate */}
                <div className={`${errors.who_to_evaluate || errors.who_to_evaluate_other ? 'border border-red-500 rounded p-2' : ''}`}>
                  <p className="font-medium mb-1">Who to Evaluate *</p>
                  {['Staff', 'Office', 'Others'].map((option) => (
                    <label key={option} className="flex items-center gap-2 mb-1">
                      <input
                        type="checkbox"
                        checked={form.who_to_evaluate === option}
                        onChange={() => {
                          setForm(prev => ({
                            ...prev,
                            who_to_evaluate: option,
                            who_to_evaluate_other: option === 'Others' ? prev.who_to_evaluate_other : '',
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
                      placeholder="Specify other"
                      value={form.who_to_evaluate_other || ''}
                      onChange={(e) => {
                        setForm(prev => ({ ...prev, who_to_evaluate_other: e.target.value }));
                        clearError('who_to_evaluate_other');
                      }}
                      className={`border rounded p-2 mt-1 w-full ${errors.who_to_evaluate_other ? 'border-red-500' : ''}`}
                    />
                  )}
                </div>

                {/* Office/Faculty Unit Transacted */}
                <div className={`${errors.office_or_faculty_unit_transacted ? 'border border-red-500 rounded p-2' : ''}`}>
                  <p className="font-medium mb-1">Office/Faculty Unit Transacted *</p>
                  <input
                    type="text"
                    name="office_or_faculty_unit_transacted"
                    value={form.office_or_faculty_unit_transacted || ''}
                    onChange={(e) => {
                      setForm(prev => ({ ...prev, office_or_faculty_unit_transacted: e.target.value }));
                      clearError('office_or_faculty_unit_transacted');
                    }}
                    className="border rounded p-2 w-full"
                  />
                </div>

              </div>
            </div>
          )}

          {/* STEP 1 CC */}
          {step === 1 && (
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold text-gray-800 mb-4">Core Criteria (CC) *</h4>
              <div className={`space-y-6 ${errorInSection('cc') ? 'border border-red-500 rounded p-3' : ''}`}>
                <p className="text-sm text-gray-600">
                  The Citizen's Charter (CC) is an official document that reflects the services of a government agency/office including its requirements, fees, and processing times among others. Please proceed with the questions below.
                </p>

                {['cc1', 'cc2', 'cc3'].map((ccField, idx) => {
                  // Determine the options for each CC field
                  const options = ccField === 'cc1' ? [
                    { value: "1", label: "1. I know what a CC is and I saw this office's CC." },
                    { value: "2", label: "2. I know what a CC is but did NOT see this office's CC." },
                    { value: "3", label: "3. I learned of the CC only when I saw this office's CC." },
                    { value: "4", label: '4. I do not know what a CC is and I did not see one in this office. (Answer "N/A" on CC2 and CC3)' },
                  ] : ccField === 'cc2' ? [
                    { value: "1", label: "Easy to see" },
                    { value: "2", label: "Somewhat easy to see" },
                    { value: "3", label: "Difficult to see" },
                    { value: "4", label: "Not visible at all" },
                    { value: "5", label: "N/A" },
                  ] : [
                    { value: "1", label: "Helped very much" },
                    { value: "2", label: "Somewhat helped" },
                    { value: "3", label: "Did not help" },
                    { value: "4", label: "N/A" },
                  ];

                  // Question text
                  let questionText = '';
                  if (ccField === 'cc1') questionText = 'CC1. Which of the following best describes your awareness of a CC?';
                  else if (ccField === 'cc2') questionText = 'CC2. If aware of CC (answered 1-3 in CC1), would you say that the CC was...?';
                  else if (ccField === 'cc3') questionText = 'CC3. If aware of CC (answered 1-3 in CC1), how much did the CC help you?';

                  // Optional: define x/y offsets per field or per option
                  const xOffset = 0; // adjust horizontal spacing
                  const yOffset = 0; // adjust vertical spacing

                  return (
                    <div
                      key={ccField}
                      className={`${errors[ccField] ? 'border border-red-500 rounded p-2' : ''} ${ccField !== 'cc1' && form.cc1 === "4" ? "opacity-50 pointer-events-none" : ""}`}
                    >
                      <p className="font-medium mb-2">{questionText}</p>

                      {options.map((opt, i) => (
                        <label
                          key={opt.value}
                          className="flex items-start gap-2 mb-1"
                          style={{
                            marginLeft: `${xOffset}px`,
                            marginTop: `${yOffset + i * 5}px` // adjust spacing between checkboxes
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={form[ccField] === opt.value}
                            onChange={() => {
                              setForm(prev => ({ ...prev, [ccField]: prev[ccField] === opt.value ? '' : opt.value }));
                              clearError(ccField);
                            }}
                            className="relative top-1.5" // adjust this number to align checkbox vertically with label
                          />
                          <span>{opt.label}</span>
                        </label>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ================= STEP 2 — SERVICE QUALITY DIMENSIONS (SQD) ================= */}
          {step === 2 && (
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold text-gray-800 mb-4">Service Quality Dimensions (SQD) *</h4>
              <div className={`space-y-4 ${errorInSection('sqd') ? 'border border-red-500 rounded p-3' : ''}`}>
                {sqdQuestions.map((q) => (
                  <div key={q.key} className={`${errors[q.key] ? 'border border-red-500 rounded p-2' : ''}`}>
                    <p className="font-medium mb-1">{q.text}</p>
                    {ratingOptions.map((opt) => (
                      <label key={opt.value} className="flex items-center gap-2 mb-1">
                        <input
                          type="checkbox"
                          checked={form[q.key] === opt.value}
                          onChange={() => {
                            setForm(prev => ({ ...prev, [q.key]: prev[q.key] === opt.value ? '' : opt.value }));
                            clearError(q.key);
                          }}
                        />
                        <span>{opt.label}</span>
                      </label>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================= STEPPER NAVIGATION BUTTONS ================= */}
          <div className="mt-6 flex justify-between">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border rounded"
              disabled={saving}
            >
              Cancel
            </button>

            <div className="flex gap-2">
              {step > 0 && (
                <button
                  type="button"
                  onClick={goBack}
                  className="px-4 py-2 border rounded"
                  disabled={saving}
                >
                  Previous
                </button>
              )}

              {step < 2 ? (
                <button
                  type="button"
                  onClick={goNext}
                  className="px-4 py-2 bg-blue-600 text-white rounded"
                >
                  Next
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="px-4 py-2 bg-blue-600 text-white rounded"
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save CSM'}
                </button>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}