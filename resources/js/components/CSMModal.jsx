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
    services_availed: '',
    service_provider_name: '',
    who_to_evaluate: '',
    office_or_faculty_unit_transacted: '',
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
      'client_type', 'client_category', 'name', 'email_address',
      'date_time_visited', 'sex', 'age',
      'services_availed', 'who_to_evaluate',
      'client_category_other', 'who_to_evaluate_other',
      'office_or_faculty_unit_transacted',
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

  const validateAll = () => {
    const newErrors = {};

    if (!form.client_type) newErrors.client_type = 'Client Type is required.';
    if (!form.client_category) newErrors.client_category = 'Client Category is required.';
    if (!form.date_time_visited) newErrors.date_time_visited = 'Date & Time of Visit is required.';
    if (!form.sex) newErrors.sex = 'Sex is required.';  
    if (!form.age) newErrors.age = 'Age is required.';
    if (!form.services_availed) newErrors.services_availed = 'Services availed is required.';
    if (!form.who_to_evaluate) newErrors.who_to_evaluate = 'Who to evaluate is required.';
    
    if (!form.office_or_faculty_unit_transacted) {
      newErrors.office_or_faculty_unit_transacted = 'Office/Faculty Unit Transacted is required.';
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

    // Email validation (optional, but if filled, must be valid)
    if (form.email_address) {
      // Simple email regex for validation
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(form.email_address)) {
        newErrors.email_address = 'Please enter a valid email address.';
      }
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
    {
      value: "5",
      label: "Strongly Agree",
      image: "/images/emojis/Strongly Agree.png",
    },
    {
      value: "4",
      label: "Agree",
      image: "/images/emojis/Agree.png",
    },
    {
      value: "3",
      label: "Neither Agree nor Disagree",
      image: "/images/emojis/Neutral.png",
    },
    {
      value: "2",
      label: "Disagree",
      image: "/images/emojis/Disagree.png",
    },
    {
      value: "1",
      label: "Strongly Disagree",
      image: "/images/emojis/Strongly Disagree.png",
    },
    {
      value: "6",
      label: "N/A Not Applicable",
      image: "/images/emojis/Not_Applicable.png",
    },
  ];

  const sqdQuestions = [
    { key: "sqd0", text: "SQD0. I am satisfied with the service that I availed." },
    { key: "sqd1", text: "SQD1. I spent a reasonable amount of time for my transaction." },
    { key: "sqd2", text: "SQD2. The office followed the transaction's requirements and steps based on the information provided." },
    { key: "sqd3", text: "SQD3. The steps (including payment) I needed to do for my transaction were easy and simple." },
    { key: "sqd4", text: "SQD4. I easily found information about my transaction from the office or its website." },
    { key: "sqd5", text: "SQD5. I paid a reasonable amount of fees for my transaction." },
    { key: "sqd6", text: "SQD6. I feel the office was fair to everyone, or 'walang palakasan', during my transaction." },
    { key: "sqd7", text: "SQD7. I was treated courteously by the staff, and (if asked for help) the staff was helpful." },
    { key: "sqd8", text: "SQD8. I got what I needed from the government office, or (if denied) denial of request was sufficiently explained to me." },
  ];

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="mb-6">
          <h3 className="text-2xl font-bold text-gray-900 mb-3">Client Satisfaction Measurement</h3>

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

        <div className="space-y-6">
          {step === 0 && (
            <div className="bg-white rounded-xl border border-gray-200">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-t-xl">
                <h4 className="font-semibold text-lg">Basic Information</h4>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Client Type */}
                <div className={`${errors.client_type ? 'border-2 border-red-500 rounded-lg p-4 bg-red-50' : ''}`}>
                  <p className="font-semibold text-gray-900 mb-3">
                    Client Type <span className="text-red-500">*</span>
                    {errors.client_type && (
                      <span className="ml-2 text-xs text-red-600">{errors.client_type}</span>
                    )}
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {['Citizen', 'Business', 'Government (Employee or another agency)'].map((type) => (
                      <label key={type} className="flex items-center gap-2 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition">
                        <input
                          type="checkbox"
                          checked={form.client_type === type}
                          onChange={() => {
                            setForm(prev => ({ ...prev, client_type: type }));
                            clearError('client_type');
                          }}
                          className="w-4 h-4 accent-blue-600"
                        />
                        <span className="text-sm">{type}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Client Category */}
                <div className={`${(errors.client_category || errors.client_category_other) ? 'border-2 border-red-500 rounded-lg p-4 bg-red-50' : ''}`}>
                  <p className="font-semibold text-gray-900 mb-3">
                    Client Category <span className="text-red-500">*</span>
                    {errors.client_category && (
                      <span className="ml-2 text-xs text-red-600">{errors.client_category}</span>
                    )}
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {['Student', 'Visitor', 'Faculty', 'Admin/Personnel', 'Others'].map((cat) => (
                      <label key={cat} className="flex items-center gap-2 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition">
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
                          className="w-4 h-4 accent-blue-600"
                        />
                        <span className="text-sm">{cat}</span>
                      </label>
                    ))}
                  </div>
                  {form.client_category === 'Others' && (
                    <>
                      <input
                        type="text"
                        name="client_category_other"
                        placeholder="Please specify"
                        value={form.client_category_other || ''}
                        onChange={(e) => { setForm(prev => ({ ...prev, client_category_other: e.target.value })); clearError('client_category_other'); }}
                        className={`mt-3 w-full rounded-lg border p-3 focus:ring-2 focus:ring-blue-400 focus:outline-none ${errors.client_category_other ? 'border-red-500' : 'border-gray-300'}`}
                      />
                      {errors.client_category_other && (
                        <div className="text-xs text-red-600 mt-1">{errors.client_category_other}</div>
                      )}
                    </>
                  )}
                </div>

                {/* Name and Email */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Name */}
                  <div>
                    <label className="font-semibold text-gray-900 mb-2 block">Name (Optional)</label>
                    <input
                      type="text"
                      name="name"
                      value={form.name || ''}
                      onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:outline-none"
                      placeholder="Enter your name"
                    />
                  </div>
                  {/* Email */}
                  <div>
                    <label className="font-semibold text-gray-900 mb-2 block">Email Address (Optional)</label>
                    <input
                      type="email"
                      name="email_address"
                      value={form.email_address || ''}
                      onChange={(e) => setForm(prev => ({ ...prev, email_address: e.target.value }))}
                      className={`w-full p-3 rounded-lg border focus:ring-2 focus:ring-blue-400 focus:outline-none ${errors.email_address ? 'border-red-500' : 'border-gray-300'}`}
                      placeholder="your.email@example.com"
                    />
                    {errors.email_address && (
                      <div className="text-xs text-red-600 mt-1">{errors.email_address}</div>
                    )}
                  </div>
                </div>

                {/* Sex */}
                <div className={`${errors.sex ? 'border-2 border-red-500 bg-red-50 rounded-lg p-4' : ''}`}>
                  <p className="font-semibold text-gray-900 mb-2">
                    Sex <span className="text-red-500">*</span>
                    {errors.sex && (
                      <span className="ml-2 text-xs text-red-600">{errors.sex}</span>
                    )}
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {['Male', 'Female', 'Prefer not to say'].map(sex => (
                      <label key={sex} className="flex items-center gap-2 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition flex-1 justify-center">
                        <input
                          type="checkbox"
                          checked={form.sex === sex}
                          onChange={() => { setForm(prev => ({ ...prev, sex })); clearError('sex'); }}
                          className="w-4 h-4 accent-blue-600"
                        />
                        <span className="text-sm font-medium">{sex}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Age and Date/Time */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Age */}
                  <div className={`${errors.age ? 'border-2 border-red-500 bg-red-50 rounded-lg p-4' : ''}`}>
                    <label className="font-semibold text-gray-900 mb-2 block">
                      Age <span className="text-red-500">*</span>
                      {errors.age && (
                        <span className="ml-2 text-xs text-red-600">{errors.age}</span>
                      )}
                    </label>
                    <input
                      type="number"
                      name="age"
                      value={form.age || ''}
                      onChange={(e) => { setForm(prev => ({ ...prev, age: e.target.value })); clearError('age'); }}
                      className={`w-full p-3 rounded-lg border ${errors.age ? 'border-red-500' : 'border-gray-300'} focus:ring-2 focus:ring-blue-400 focus:outline-none`}
                      placeholder="Enter your age"
                    />
                  </div>

                  {/* Date & Time */}
                  <div className={`${errors.date_time_visited ? 'border-2 border-red-500 bg-red-50 rounded-lg p-4' : ''}`}>
                    <label className="font-semibold text-gray-900 mb-2 block">
                      Date & Time of Visit <span className="text-red-500">*</span>
                      {errors.date_time_visited && (
                        <span className="ml-2 text-xs text-red-600">{errors.date_time_visited}</span>
                      )}
                    </label>
                    <input
                      type="datetime-local"
                      name="date_time_visited"
                      value={form.date_time_visited || ''}
                      onChange={(e) => { setForm(prev => ({ ...prev, date_time_visited: e.target.value })); clearError('date_time_visited'); }}
                      className={`w-full p-3 rounded-lg border ${errors.date_time_visited ? 'border-red-500' : 'border-gray-300'} focus:ring-2 focus:ring-blue-400 focus:outline-none`}
                    />
                  </div>
                </div>

                {/* Services Availed */}
                <div className={`${errors.services_availed ? 'border-2 border-red-500 bg-red-50 rounded-lg p-4' : ''}`}>
                  <label className="font-semibold text-gray-900 mb-2 block">
                    Services Availed <span className="text-red-500">*</span>
                    {errors.services_availed && (
                      <span className="ml-2 text-xs text-red-600">{errors.services_availed}</span>
                    )}
                  </label>
                  <input
                    type="text"
                    name="services_availed"
                    value={form.services_availed || ''}
                    onChange={(e) => { setForm(prev => ({ ...prev, services_availed: e.target.value })); clearError('services_availed'); }}
                    className={`w-full p-3 rounded-lg border ${errors.services_availed ? 'border-red-500' : 'border-gray-300'} focus:ring-2 focus:ring-blue-400 focus:outline-none`}
                    placeholder="Specify services"
                  />
                </div>

                {/* Service Provider Name */}
                <div>
                  <label className="font-semibold text-gray-900 mb-2 block">Service Provider Name (Optional)</label>
                  <input
                    type="text"
                    name="service_provider_name"
                    value={form.service_provider_name || ''}
                    onChange={(e) => setForm(prev => ({ ...prev, service_provider_name: e.target.value }))}
                    className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:outline-none"
                    placeholder="Name of person who provided service"
                  />
                </div>

                {/* Who to Evaluate */}
                <div className={`${(errors.who_to_evaluate || errors.who_to_evaluate_other) ? 'border-2 border-red-500 bg-red-50 rounded-lg p-4' : ''}`}>
                  <p className="font-semibold text-gray-900 mb-3">
                    Who are you evaluating? <span className="text-red-500">*</span>
                    {errors.who_to_evaluate && (
                      <span className="ml-2 text-xs text-red-600">{errors.who_to_evaluate}</span>
                    )}
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {['Student', 'Faculty', 'Admin/Personnel', 'Others'].map(option => (
                    <label key={option} className="flex items-center gap-2 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition">
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
                        className="w-4 h-4 accent-blue-600"
                      />
                      <span className="text-sm">{option}</span>
                    </label>
                  ))}
                  </div>
                  {form.who_to_evaluate === 'Others' && (
                    <>
                      <input
                        type="text"
                        name="who_to_evaluate_other"
                        placeholder="Please specify"
                        value={form.who_to_evaluate_other || ''}
                        onChange={(e) => { setForm(prev => ({ ...prev, who_to_evaluate_other: e.target.value })); clearError('who_to_evaluate_other'); }}
                        className={`mt-3 w-full rounded-lg border p-3 focus:ring-2 focus:ring-blue-400 focus:outline-none ${errors.who_to_evaluate_other ? 'border-red-500' : 'border-gray-300'}`}
                      />
                      {errors.who_to_evaluate_other && (
                        <div className="text-xs text-red-600 mt-1">{errors.who_to_evaluate_other}</div>
                      )}
                    </>
                  )}
                </div>

                {/* Office/Faculty Unit Transacted */}
                <div className={`${errors.office_or_faculty_unit_transacted ? 'border-2 border-red-500 bg-red-50 rounded-lg p-4' : ''}`}>
                  <label className="font-semibold text-gray-900 mb-2 block">
                    Office/Faculty Unit Transacted <span className="text-red-500">*</span>
                    {errors.office_or_faculty_unit_transacted && (
                      <span className="ml-2 text-xs text-red-600">{errors.office_or_faculty_unit_transacted}</span>
                    )}
                  </label>
                  <input
                    type="text"
                    name="office_or_faculty_unit_transacted"
                    value={form.office_or_faculty_unit_transacted || ''}
                    onChange={(e) => { setForm(prev => ({ ...prev, office_or_faculty_unit_transacted: e.target.value })); clearError('office_or_faculty_unit_transacted'); }}
                    className={`w-full p-3 rounded-lg border ${errors.office_or_faculty_unit_transacted ? 'border-red-500' : 'border-gray-300'} focus:ring-2 focus:ring-blue-400 focus:outline-none`}
                    placeholder="Enter office/faculty unit"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="bg-white rounded-xl border border-gray-200">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-t-xl">
                <h4 className="font-semibold text-lg">Core Criteria (CC)</h4>
              </div>

              <div className="p-6">
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded">
                  <p className="text-sm text-blue-900">
                    <strong>Citizen's Charter (CC)</strong> is an official document that reflects the services of a government agency/office including its requirements, fees, and processing times.
                  </p>
                </div>

                <div className="space-y-6">
                  {['cc1', 'cc2', 'cc3'].map((ccField) => {
                    const options = ccField === 'cc1' ? [
                      { value: "1", label: "I know what a CC is and I saw this office's CC" },
                      { value: "2", label: "I know what a CC is but did NOT see this office's CC" },
                      { value: "3", label: "I learned of the CC only when I saw this office's CC" },
                      { value: "4", label: "I do not know what a CC is and did not see one in this office" },
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
                    if (ccField === 'cc1') questionText = 'CC1. Which best describes your awareness of a Citizen\'s Charter?';
                    else if (ccField === 'cc2') questionText = 'CC2. If aware of CC (answered 1-3 in CC1), how visible was the CC?';
                    else if (ccField === 'cc3') questionText = 'CC3. If aware of CC (answered 1-3 in CC1), how much did the CC help you?';

                    const isDisabled = ccField !== 'cc1' && form.cc1 === "4";

                    return (
                      <div
                        key={ccField}
                        className={`${errors[ccField] ? 'border-2 border-red-500 bg-red-50' : 'border border-gray-200'} rounded-lg p-5 ${isDisabled ? 'opacity-50 bg-gray-50' : 'bg-white'}`}
                      >
                        <p className="font-semibold text-gray-900 mb-4">
                          {questionText} <span className="text-red-500">*</span>
                          {errors[ccField] && (
                            <span className="ml-2 text-xs text-red-600">{errors[ccField]}</span>
                          )}
                        </p>

                        <div className="space-y-2">
                          {options.map((opt) => (
                            <label 
                              key={opt.value} 
                              className={`flex items-start gap-3 p-3 border rounded-lg transition ${
                                isDisabled 
                                  ? 'cursor-not-allowed' 
                                  : 'hover:bg-gray-50 cursor-pointer'
                              } ${form[ccField] === opt.value ? 'bg-blue-50 border-blue-300' : ''}`}
                            >
                              <input
                                type="checkbox"
                                checked={form[ccField] === opt.value}
                                onChange={() => {
                                  const newValue = form[ccField] === opt.value ? '' : opt.value;
                                  setForm(prev => {
                                    const updated = { ...prev, [ccField]: newValue };
                                    if (ccField === 'cc1' && newValue === '4') {
                                      updated.cc2 = '5';
                                      updated.cc3 = '4';
                                    } else if (ccField === 'cc1') {
                                      updated.cc2 = '';
                                      updated.cc3 = '';
                                    }
                                    return updated;
                                  });
                                  clearError(ccField);
                                  if (ccField === 'cc1') {
                                    clearError('cc2');
                                    clearError('cc3');
                                  }
                                }}
                                className="w-4 h-4 mt-0.5 accent-blue-600 flex-shrink-0"
                                disabled={isDisabled}
                              />
                              <span className="text-sm">{opt.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {step === 2 && !showFeedback && (
            <div className="bg-white rounded-xl border border-gray-200">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-t-xl">
                <h4 className="font-semibold text-lg">Service Quality Dimensions (SQD)</h4>
                <p className="text-sm text-blue-100 mt-1">Question {currentSQD + 1} of {sqdQuestions.length}</p>
              </div>

              <div className="p-6">
                <div className={`${errors[sqdQuestions[currentSQD].key] ? 'border-2 border-red-500 bg-red-50' : 'border border-gray-200'} rounded-lg p-6`}>
                  <p className="font-semibold text-gray-900 text-center mb-6 text-lg">
                    {sqdQuestions[currentSQD].text} <span className="text-red-500">*</span>
                    {errors[sqdQuestions[currentSQD].key] && (
                      <span className="ml-2 text-xs text-red-600">{errors[sqdQuestions[currentSQD].key]}</span>
                    )}
                  </p>

                  <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                    {ratingOptions.map((opt) => {
                    const isSelected = form[sqdQuestions[currentSQD].key] === opt.value;

                    return (
                      <label
                        key={opt.value}
                        className={`flex flex-col items-center justify-start p-4 border-2 rounded-lg cursor-pointer transition-all min-h-[130px] ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50 shadow-md'
                            : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {
                            setForm(prev => ({
                              ...prev,
                              [sqdQuestions[currentSQD].key]:
                                prev[sqdQuestions[currentSQD].key] === opt.value ? '' : opt.value
                            }));
                            clearError(sqdQuestions[currentSQD].key);
                          }}
                          className="sr-only"
                        />

                        <img
                          src={opt.image}
                          alt={opt.label}
                          className="w-12 h-12 object-contain mb-3"
                        />

                        <span className="text-xs text-center font-medium text-gray-700 leading-tight">
                          {opt.label}
                        </span>
                      </label>
                    );
                  })}
                  </div>

                  <div className="mt-6 w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-400 to-blue-600 h-2 transition-all duration-300"
                      style={{ width: `${((currentSQD + 1) / sqdQuestions.length) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 2 && showFeedback && (
            <div className="bg-white rounded-xl border border-gray-200">
              <div className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-t-xl">
                <h4 className="font-semibold text-lg">Additional Feedback (Optional)</h4>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="font-semibold text-gray-900 mb-2 block">Suggestions for Improvement</label>
                  <textarea
                    name="suggestions"
                    value={form.suggestions || ''}
                    onChange={(e) => setForm(prev => ({ ...prev, suggestions: e.target.value }))
                    }
                    className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:outline-none"
                    placeholder="Share your thoughts on how we can improve our services..."
                    rows={4}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 flex justify-between items-center bg-gray-50 p-4 rounded-lg border border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2.5 border-2 border-gray-300 rounded-lg hover:bg-white hover:border-gray-400 transition font-medium"
              disabled={saving}
            >
              Cancel
            </button>

            <div className="flex gap-3">
              {(step > 0 || (step === 2 && currentSQD > 0)) && (
                <button
                  type="button"
                  onClick={() => {
                    if (step === 2 && showFeedback) {
                      setShowFeedback(false);
                      return;
                    }

                    if (step === 2 && currentSQD > 0) {
                      setCurrentSQD(prev => prev - 1);
                      return;
                    }

                    goBack();
                  }}
                  className="px-6 py-2.5 border-2 border-gray-300 rounded-lg hover:bg-white hover:border-gray-400 transition font-medium"
                  disabled={saving}
                >
                  ← Previous
                </button>
              )}

              {step < 2 ? (
                <button
                  type="button"
                  onClick={goNext}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium shadow-md"
                >
                  Next →
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    const currentKey = sqdQuestions[currentSQD].key;

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
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={saving}
                >
                  {saving
                    ? 'Saving...'
                    : currentSQD < sqdQuestions.length - 1
                    ? 'Next →'
                    : !showFeedback
                    ? 'Continue →'
                    : '✓ Submit Form'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}