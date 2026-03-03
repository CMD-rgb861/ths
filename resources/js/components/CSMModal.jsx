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
  const [currentSQD, setCurrentSQD] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [errors, setErrors] = useState({});

  const sectionFields = {
    basic: [
      'client_type', 'client_category', 'date_time_visited', 'sex', 'age',
      'region_of_residence', 'services_availed', 'who_to_evaluate',
      'client_category_other', 'who_to_evaluate_other', 'office_or_faculty_unit_transacted', 'student_program'
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
    if (isOpen) {
      setForm({ ...defaultForm, ...initialData });
      setStep(0);
      setCurrentSQD(0);
      setShowFeedback(false);
      setErrors({});
    }
  }, [isOpen]);

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
    if (form.client_category === 'Student' && !form.student_program) {
      newErrors.student_program = "Student's Program is required.";
    }

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
    <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl p-6 max-h-[90vh] overflow-y-auto">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-3">Client Satisfaction Measurement</h3>

        {/* Horizontal Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-4 overflow-hidden shadow-inner">
          <div
            className="bg-gradient-to-r from-blue-400 to-blue-600 h-2 transition-all duration-300"
            style={{ width: `${((step + 1) / sectionMap.length) * 100}%` }}
          ></div>
        </div>

        <p className="text-sm text-gray-600">Please complete the form below. Required fields are marked <span className="text-red-500">*</span>.</p>

        <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-lg shadow-sm">
          <h4 className="text-sm font-semibold text-blue-700">HELP US SERVE YOU BETTER!</h4>
          <p className="mt-2 text-sm text-blue-800">
            This Client Satisfaction Measurement (CSM) tracks the customer experiences of government offices. Your feedback will help this office provide a better service. Personal information shared will be kept confidential and you always have the option to not answer this form.
          </p>
        </div>
      </div>

        {/* Step Content */}
        <div className="space-y-6">
          {step === 0 && (
            <div className="bg-gray-50 rounded-xl p-6 shadow-sm border border-gray-100">
              <h4 className="font-semibold text-gray-900 mb-4 text-lg">Basic Information</h4>
              <div className="space-y-4">
                {/* Example: Client Type */}
                <div className={`${errors.client_type ? 'border border-red-500 rounded-lg p-3 bg-red-50' : ''}`}>
                  <p className="font-medium mb-2">Client Type <span className="text-red-500">*</span></p>
                  <div className="flex flex-wrap gap-4">
                    {['Citizen', 'Business', 'Government (Employee or another agency)'].map((type) => (
                      <label key={type} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={form.client_type === type}
                          onChange={() => {
                            setForm(prev => ({ ...prev, client_type: type }));
                            clearError('client_type');
                          }}
                          className="accent-blue-600"
                        />
                        <span>{type}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Client Category */}
                <div className={`${errors.client_category || errors.client_category_other ? 'border border-red-500 rounded-lg p-3 bg-red-50' : ''}`}>
                  <p className="font-medium mb-2">Client Category <span className="text-red-500">*</span></p>
                  <div className="flex flex-wrap gap-4">
                    {['Student', 'Visitor', 'Faculty', 'Admin/Personnel', 'Others'].map((cat) => (
                      <label key={cat} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={form.client_category === cat}
                          onChange={() => {
                            setForm(prev => ({
                              ...prev,
                              client_category: cat,
                              client_category_other: cat === 'Others' ? prev.client_category_other : '',
                            }));
                            clearError('client_category');
                            clearError('client_category_other');
                          }}
                          className="accent-blue-600"
                        />
                        <span>{cat}</span>
                      </label>
                    ))}
                  </div>
                  {form.client_category === 'Others' && (
                    <input
                      type="text"
                      name="client_category_other"
                      placeholder="Specify other category"
                      value={form.client_category_other || ''}
                      onChange={(e) => setForm(prev => ({ ...prev, client_category_other: e.target.value }))}
                      className={`mt-2 w-full rounded-lg border p-2 focus:ring-1 focus:ring-blue-400 ${errors.client_category_other ? 'border-red-500' : 'border-gray-300'}`}
                    />
                  )}
                </div>

                {/* Name */}
                <div className={`${errors.name ? 'border border-red-500 bg-red-50 rounded-lg p-3' : ''}`}>
                  <label className="font-medium mb-1 block">Name (Optional)</label>
                  <input
                    type="text"
                    name="name"
                    value={form.name || ''}
                    onChange={(e) => { setForm(prev => ({ ...prev, name: e.target.value })); clearError('name'); }}
                    className={`w-full p-2 rounded-lg border ${errors.name ? 'border-red-500' : 'border-gray-300'} focus:ring-1 focus:ring-blue-400 focus:outline-none`}
                    placeholder="Enter your name"
                  />
                </div>

                {/* Sex */}
                <div className={`${errors.sex ? 'border border-red-500 bg-red-50 rounded-lg p-3' : ''}`}>
                  <p className="font-medium mb-2">Sex <span className="text-red-500">*</span></p>
                  <div className="flex gap-4">
                    {['Male', 'Female'].map(sex => (
                      <label key={sex} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={form.sex === sex}
                          onChange={() => { setForm(prev => ({ ...prev, sex })); clearError('sex'); }}
                          className="accent-blue-600"
                        />
                        <span>{sex}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Age */}
                <div className={`${errors.age ? 'border border-red-500 bg-red-50 rounded-lg p-3' : ''}`}>
                  <label className="font-medium mb-1 block">Age <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    name="age"
                    value={form.age || ''}
                    onChange={(e) => { setForm(prev => ({ ...prev, age: e.target.value })); clearError('age'); }}
                    className={`w-full p-2 rounded-lg border ${errors.age ? 'border-red-500' : 'border-gray-300'} focus:ring-1 focus:ring-blue-400 focus:outline-none`}
                    placeholder="Enter your age"
                  />
                </div>

                {/* Date & Time of Visit */}
                <div className={`${errors.date_time_visited ? 'border border-red-500 bg-red-50 rounded-lg p-3' : ''}`}>
                  <label className="font-medium mb-1 block">Date & Time of Visit <span className="text-red-500">*</span></label>
                  <input
                    type="datetime-local"
                    name="date_time_visited"
                    value={form.date_time_visited || ''}
                    onChange={(e) => { setForm(prev => ({ ...prev, date_time_visited: e.target.value })); clearError('date_time_visited'); }}
                    className={`w-full p-2 rounded-lg border ${errors.date_time_visited ? 'border-red-500' : 'border-gray-300'} focus:ring-1 focus:ring-blue-400 focus:outline-none`}
                  />
                </div>

                {/* Region of Residence */}
                <div className={`${errors.region_of_residence ? 'border border-red-500 bg-red-50 rounded-lg p-3' : ''}`}>
                  <label className="font-medium mb-1 block">Region of Residence <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    name="region_of_residence"
                    value={form.region_of_residence || ''}
                    onChange={(e) => { setForm(prev => ({ ...prev, region_of_residence: e.target.value })); clearError('region_of_residence'); }}
                    className={`w-full p-2 rounded-lg border ${errors.region_of_residence ? 'border-red-500' : 'border-gray-300'} focus:ring-1 focus:ring-blue-400 focus:outline-none`}
                    placeholder="Enter region of residence"
                  />
                </div>

                {/* Services Availed */}
                <div className={`${errors.services_availed ? 'border border-red-500 bg-red-50 rounded-lg p-3' : ''}`}>
                  <label className="font-medium mb-1 block">Services Availed <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    name="services_availed"
                    value={form.services_availed || ''}
                    onChange={(e) => { setForm(prev => ({ ...prev, services_availed: e.target.value })); clearError('services_availed'); }}
                    className={`w-full p-2 rounded-lg border ${errors.services_availed ? 'border-red-500' : 'border-gray-300'} focus:ring-1 focus:ring-blue-400 focus:outline-none`}
                    placeholder="Specify services availed"
                  />
                </div>

                {/* Name of the Person Who Provided Service (Optional) */}
                <div className="mt-4">
                  <label className="font-medium mb-1 block">Name of the person who provided service (Optional)</label>
                  <input
                    type="text"
                    name="service_provider_name"
                    value={form.service_provider_name || ''}
                    onChange={(e) => setForm(prev => ({ ...prev, service_provider_name: e.target.value }))}
                    className="w-full p-2 rounded-lg border border-gray-300 focus:ring-1 focus:ring-blue-400 focus:outline-none"
                    placeholder="Enter name of service provider (optional)"
                  />
                </div>

                {/* Who to Evaluate */}
                <div className={`${errors.who_to_evaluate || errors.who_to_evaluate_other ? 'border border-red-500 bg-red-50 rounded-lg p-3' : ''}`}>
                  <p className="font-medium mb-2">Which of the following are you going to evaluate? <span className="text-red-500">*</span></p>
                  <div className="flex flex-wrap gap-4">
                    {['Student', 'Faculty', 'Admin/Personnel', 'Others'].map(option => (
                    <label key={option} className="flex items-center gap-2">
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
                        className="accent-blue-600"
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                  </div>
                  {form.who_to_evaluate === 'Others' && (
                    <input
                      type="text"
                      name="who_to_evaluate_other"
                      placeholder="Specify other"
                      value={form.who_to_evaluate_other || ''}
                      onChange={(e) => { setForm(prev => ({ ...prev, who_to_evaluate_other: e.target.value })); clearError('who_to_evaluate_other'); }}
                      className={`mt-2 w-full rounded-lg border p-2 focus:ring-1 focus:ring-blue-400 focus:outline-none ${errors.who_to_evaluate_other ? 'border-red-500' : 'border-gray-300'}`}
                    />
                  )}
                </div>

                {/* Office/Faculty Unit Transacted */}
                <div className={`${errors.office_or_faculty_unit_transacted ? 'border border-red-500 bg-red-50 rounded-lg p-3' : ''}`}>
                  <label className="font-medium mb-1 block">Office/Faculty Unit Transacted <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    name="office_or_faculty_unit_transacted"
                    value={form.office_or_faculty_unit_transacted || ''}
                    onChange={(e) => { setForm(prev => ({ ...prev, office_or_faculty_unit_transacted: e.target.value })); clearError('office_or_faculty_unit_transacted'); }}
                    className={`w-full p-2 rounded-lg border ${errors.office_or_faculty_unit_transacted ? 'border-red-500' : 'border-gray-300'} focus:ring-1 focus:ring-blue-400 focus:outline-none`}
                    placeholder="Enter office/faculty unit"
                  />
                </div>

                  {/* Student's Program */}
                  {form.client_category === 'Student' && (
                    <div className={`${errors.student_program ? 'border border-red-500 bg-red-50 rounded-lg p-3' : ''}`}>
                      <label className="font-medium mb-1 block">Student's Program <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        name="student_program"
                        value={form.student_program || ''}
                        onChange={(e) => { 
                          setForm(prev => ({ ...prev, student_program: e.target.value })); 
                          clearError('student_program'); 
                        }}
                        className={`w-full p-2 rounded-lg border ${errors.student_program ? 'border-red-500' : 'border-gray-300'} focus:ring-1 focus:ring-blue-400 focus:outline-none`}
                        placeholder="Enter your program"
                      />
                    </div>
                  )}
              </div>
            </div>
          )}

          {/* ================= STEP 1 — CORE CRITERIA (CC) ================= */}
          {step === 1 && (
            <div className="bg-gray-50 rounded-xl p-6 shadow-sm border border-gray-100">
              <h4 className="font-semibold text-gray-900 mb-4 text-lg">Core Criteria (CC) *</h4>

              <p className="text-sm text-gray-600 mb-6">
                The Citizen's Charter (CC) is an official document that reflects the services of a government agency/office including its requirements, fees, and processing times. Please answer the questions below.
              </p>

              <div className="space-y-6">
                {['cc1', 'cc2', 'cc3'].map((ccField) => {
                  const options = ccField === 'cc1' ? [
                    { value: "1", label: "I know what a CC is and I saw this office's CC" },
                    { value: "2", label: "I know what a CC is but did NOT see this office's CC" },
                    { value: "3", label: "I learned of the CC only when I saw this office's CC" },
                    { value: "4", label: "I do not know what a CC is and did not see one in this office (Answer N/A on CC2 and CC3)" },
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

                  let questionText = '';
                  if (ccField === 'cc1') questionText = 'CC1. Which best describes your awareness of a CC?';
                  else if (ccField === 'cc2') questionText = 'CC2. If aware of CC (answered 1-3 in CC1), how visible was the CC?';
                  else if (ccField === 'cc3') questionText = 'CC3. If aware of CC (answered 1-3 in CC1), how much did the CC help you?';

                  const isDisabled = ccField !== 'cc1' && form.cc1 === "4"; // disable CC2/CC3 if N/A

                  return (
                    <div
                      key={ccField}
                      className={`${errors[ccField] ? 'border border-red-500 bg-red-50 rounded-lg p-3' : ''} ${isDisabled ? 'opacity-50 pointer-events-none' : ''}`}
                    >
                      <p className="font-medium mb-3">{questionText} <span className="text-red-500">*</span></p>

                      <div className="flex flex-col gap-2">
                        {options.map((opt) => (
                          <label key={opt.value} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={form[ccField] === opt.value}
                              onChange={() => {
                                setForm(prev => ({ ...prev, [ccField]: prev[ccField] === opt.value ? '' : opt.value }));
                                clearError(ccField);
                              }}
                              className="accent-blue-600"
                              disabled={isDisabled}
                            />
                            <span>{opt.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ================= STEP 2 — SERVICE QUALITY DIMENSIONS (SQD) ================= */}
          {step === 2 && !showFeedback && (
            <div className="bg-gray-50 rounded-xl p-6 shadow-sm border border-gray-100">
              <h4 className="font-semibold text-gray-900 mb-4 text-lg">Service Quality Dimensions (SQD) *</h4>

              <p className="text-sm text-gray-600 mb-6">
                The Citizen's Charter (CC) is an official document that reflects the services of a government agency/office including its requirements, fees, and processing times. Please answer the questions below.
              </p>

              <div className={`${errorInSection('sqd') ? 'border border-red-500 rounded-lg p-4 bg-red-50' : ''}`}>
              {/* Current SQD Question */}
              <p className="font-medium mb-4">
                {sqdQuestions[currentSQD].text} <span className="text-red-500">*</span>
              </p>

             {/* Emoji Rating Options */}
              <div className="flex justify-between gap-2">
                {ratingOptions.map((opt, index) => { 
                  // Emoji only for the first 5 ratings
                  const emoji = index < 5
                    ? opt.value === "1" ? "😢" :
                      opt.value === "2" ? "🙁" :
                      opt.value === "3" ? "😐" :
                      opt.value === "4" ? "🙂" :
                      "😃"
                    : null; // N/A has no emoji

                  return (
                    <label key={opt.value} className="flex flex-col items-center w-full">
                      <input
                        type="checkbox"
                        checked={form[sqdQuestions[currentSQD].key] === opt.value}
                        onChange={() => {
                          setForm(prev => ({ 
                            ...prev, 
                            [sqdQuestions[currentSQD].key]: prev[sqdQuestions[currentSQD].key] === opt.value ? '' : opt.value 
                          }));
                          clearError(sqdQuestions[currentSQD].key);
                        }}
                        className="accent-blue-600 w-6 h-6 mb-2"
                      />
                      {emoji && <span className="text-2xl">{emoji}</span>}
                      <span className="text-xs text-center mt-1">{opt.label}</span>
                    </label>
                  );
                })}
              </div>

              {/* SQD Progress */}
              <div className="mt-4 w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-400 to-blue-600 h-2 transition-all duration-300"
                  style={{ width: `${((currentSQD + 1) / sqdQuestions.length) * 100}%` }}
                ></div>
              </div>
            </div>
            </div>
          )}

          {/* ================= OPTIONAL — Suggestions & Email ================= */}
          {step === 2 && showFeedback && (
            <div className="bg-gray-50 rounded-xl p-6 shadow-sm border border-gray-100 mt-6">
              <h4 className="font-semibold text-gray-900 mb-4 text-lg">Additional Feedback (Optional)</h4>

              {/* Suggestions */}
              <div className="mb-4">
                <label className="font-medium mb-1 block">Suggestions on how we can further improve our services (optional)</label>
                <textarea
                  name="suggestions"
                  value={form.suggestions || ''}
                  onChange={(e) => setForm(prev => ({ ...prev, suggestions: e.target.value }))}
                  className="w-full p-2 rounded-lg border border-gray-300 focus:ring-1 focus:ring-blue-400 focus:outline-none"
                  placeholder="Enter any suggestions or comments (optional)"
                  rows={3}
                />
              </div>

              {/* Email Address */}
              <div>
                <label className="font-medium mb-1 block">Email Address (optional)</label>
                <input
                  type="email"
                  name="email_address"
                  value={form.email_address || ''}
                  onChange={(e) => setForm(prev => ({ ...prev, email_address: e.target.value }))}
                  className="w-full p-2 rounded-lg border border-gray-300 focus:ring-1 focus:ring-blue-400 focus:outline-none"
                  placeholder="Enter your email (optional)"
                />
              </div>
            </div>
          )}

           {/* Navigation Buttons */}
            <div className="mt-6 flex justify-between">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 border rounded-lg hover:bg-gray-100 transition"
                disabled={saving}
              >
                Cancel
              </button>

              <div className="flex gap-2">
                {/* Previous Button */}
                {(step > 0 || (step === 2 && currentSQD > 0)) && (
                  <button
                    type="button"
                    onClick={() => {
                        // If currently on Additional Feedback
                        if (step === 2 && showFeedback) {
                          setShowFeedback(false);
                          return;
                        }

                        // If inside SQD questions
                        if (step === 2 && currentSQD > 0) {
                          setCurrentSQD(prev => prev - 1);
                          return;
                        }

                        // Otherwise go back a step
                        goBack();
                      }}
                    className="px-4 py-2 border rounded-lg hover:bg-gray-100 transition"
                    disabled={saving}
                  >
                    Previous
                  </button>
                )}

                {/* Next / Save Button */}
                {step < 2 ? (
                  <button
                    type="button"
                    onClick={goNext}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      const currentKey = sqdQuestions[currentSQD].key;

                      // 🚨 Require rating before moving forward
                      if (!form[currentKey]) {
                        setErrors(prev => ({
                          ...prev,
                          [currentKey]: 'This item is required.',
                        }));

                        showNotification?.(
                          'error',
                          'Rating Required',
                          'Please select a rating before proceeding.'
                        );

                        return;
                      }

                      if (currentSQD < sqdQuestions.length - 1) {
                        setCurrentSQD(prev => prev + 1);
                      } else if (!showFeedback) {
                        setShowFeedback(true);
                      } else {
                        handleSubmit();
                      }
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    disabled={saving}
                  >
                    {saving
                    ? 'Saving...'
                    : currentSQD < sqdQuestions.length - 1
                    ? 'Next'
                    : !showFeedback
                    ? 'Continue'
                    : 'Save CSM'}
                  </button>
                )}
              </div>
            </div>
        </div>
      </div>
    </div>
  );
}