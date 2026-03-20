import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { createAssignment, clearJobStatus, setJobStarted } from '../features/assignmentsSlice';
import { useSocket } from '../hooks/useSocket';
import Layout from '../components/Layout';
import GenerationProgress from '../components/GenerationProgress';
import toast from 'react-hot-toast';
import {
  Upload,
  BookOpen,
  GraduationCap,
  Hash,
  Star,
  CalendarDays,
  AlignLeft,
  ChevronRight,
  X,
  Clock,
} from 'lucide-react';

const QUESTION_TYPES = [
  { value: 'mcq', label: 'Multiple Choice (MCQ)' },
  { value: 'short-answer', label: 'Short Answer' },
  { value: 'long-answer', label: 'Long Answer / Essay' },
  { value: 'true-false', label: 'True / False' },
  { value: 'fill-in-the-blanks', label: 'Fill in the Blanks' },
];

const SUBJECTS = [
  'Mathematics', 'Science', 'Physics', 'Chemistry', 'Biology',
  'English', 'Hindi', 'History', 'Geography', 'Civics',
  'Computer Science', 'Economics', 'Accountancy', 'Other',
];

const GRADES = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

export default function CreateAssignmentPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { creating, jobStatus, jobProgress, jobMessage } = useSelector((s) => s.assignments);

  const [assignmentId, setAssignmentId] = useState(null);
  const [file, setFile] = useState(null);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    title: '',
    subject: '',
    grade: '',
    questionTypes: ['short-answer'],
    numberOfQuestions: '',
    totalMarks: '',
    timeAllowed: '3 Hours',
    dueDate: '',
    additionalInstructions: '',
  });

  // Listen for real-time updates
  useSocket(assignmentId);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const toggleQuestionType = (type) => {
    setForm((prev) => {
      const has = prev.questionTypes.includes(type);
      return {
        ...prev,
        questionTypes: has
          ? prev.questionTypes.filter((t) => t !== type)
          : [...prev.questionTypes, type],
      };
    });
  };

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = 'Title is required';
    if (!form.subject) e.subject = 'Subject is required';
    if (!form.grade) e.grade = 'Grade is required';
    if (!form.numberOfQuestions || parseInt(form.numberOfQuestions) < 1)
      e.numberOfQuestions = 'Must be at least 1';
    if (!form.totalMarks || parseInt(form.totalMarks) < 1)
      e.totalMarks = 'Must be at least 1';
    if (form.questionTypes.length === 0)
      e.questionTypes = 'Select at least one question type';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const formData = new FormData();
    Object.entries(form).forEach(([key, val]) => {
      if (Array.isArray(val)) {
        val.forEach((v) => formData.append(key, v));
      } else {
        formData.append(key, val);
      }
    });
    if (file) formData.append('file', file);

    const result = await dispatch(createAssignment(formData));
    if (createAssignment.fulfilled.match(result)) {
      const newId = result.payload.assignmentId;
      setAssignmentId(newId);
      dispatch(setJobStarted({ message: 'Assignment created, starting AI generation...', progress: 5 }));
      toast.success('Assignment created! AI is generating your paper...');
    } else {
      toast.error(result.payload || 'Failed to create assignment');
    }
  };

  const handleProgressClose = () => {
    if (jobStatus === 'completed' && assignmentId) {
      dispatch(clearJobStatus());
      navigate(`/assignments/${assignmentId}`);
    } else {
      dispatch(clearJobStatus());
    }
  };

  const showProgress = assignmentId && (jobStatus === 'started' || jobStatus === 'progress' || jobStatus === 'completed' || jobStatus === 'failed');

  return (
    <Layout title="Create Assignment">
      {showProgress && (
        <GenerationProgress
          progress={jobProgress}
          message={jobMessage}
          status={jobStatus}
          onClose={handleProgressClose}
        />
      )}

      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Create New Assignment</h1>
          <p className="text-sm text-gray-500 mt-1">
            Fill in the details and our AI will generate a structured question paper for you.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Title */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Assignment Title <span className="text-red-500">*</span>
            </label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="e.g. Chapter 5 – Photosynthesis Mid-Term"
              className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 transition-all ${errors.title ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:border-gray-300'}`}
            />
            {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
          </div>

          {/* Subject & Grade */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-2">
                <BookOpen size={14} /> Subject <span className="text-red-500">*</span>
              </label>
              <select
                name="subject"
                value={form.subject}
                onChange={handleChange}
                className={`w-full border rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white ${errors.subject ? 'border-red-400' : 'border-gray-200'}`}
              >
                <option value="">Select subject</option>
                {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              {errors.subject && <p className="text-xs text-red-500 mt-1">{errors.subject}</p>}
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-2">
                <GraduationCap size={14} /> Grade <span className="text-red-500">*</span>
              </label>
              <select
                name="grade"
                value={form.grade}
                onChange={handleChange}
                className={`w-full border rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white ${errors.grade ? 'border-red-400' : 'border-gray-200'}`}
              >
                <option value="">Select grade</option>
                {GRADES.map((g) => <option key={g} value={g}>Grade {g}</option>)}
              </select>
              {errors.grade && <p className="text-xs text-red-500 mt-1">{errors.grade}</p>}
            </div>
          </div>

          {/* Question Types */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Question Types <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {QUESTION_TYPES.map(({ value, label }) => {
                const selected = form.questionTypes.includes(value);
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => toggleQuestionType(value)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                      selected
                        ? 'bg-orange-50 border-orange-300 text-orange-700 font-semibold'
                        : 'border-gray-200 text-gray-600 hover:border-orange-200 hover:bg-orange-50/50'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-md border-2 flex items-center justify-center flex-shrink-0 ${selected ? 'bg-orange-500 border-orange-500' : 'border-gray-300'}`}>
                      {selected && <span className="text-white text-[10px] font-bold">✓</span>}
                    </div>
                    {label}
                  </button>
                );
              })}
            </div>
            {errors.questionTypes && <p className="text-xs text-red-500 mt-2">{errors.questionTypes}</p>}
          </div>

          {/* Questions, Marks & Time */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-2">
                <Hash size={14} /> Number of Questions <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="numberOfQuestions"
                value={form.numberOfQuestions}
                onChange={handleChange}
                min="1"
                max="100"
                placeholder="e.g. 20"
                className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 ${errors.numberOfQuestions ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
              />
              {errors.numberOfQuestions && <p className="text-xs text-red-500 mt-1">{errors.numberOfQuestions}</p>}
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-2">
                <Star size={14} /> Total Marks <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="totalMarks"
                value={form.totalMarks}
                onChange={handleChange}
                min="1"
                placeholder="e.g. 100"
                className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 ${errors.totalMarks ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
              />
              {errors.totalMarks && <p className="text-xs text-red-500 mt-1">{errors.totalMarks}</p>}
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-2">
                <Clock size={14} /> Time Allowed
              </label>
              <select
                name="timeAllowed"
                value={form.timeAllowed}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
              >
                {['30 Minutes','45 Minutes','1 Hour','1.5 Hours','2 Hours','2.5 Hours','3 Hours','3.5 Hours','4 Hours'].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Due Date */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-2">
              <CalendarDays size={14} /> Due Date
            </label>
            <input
              type="date"
              name="dueDate"
              value={form.dueDate}
              onChange={handleChange}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 hover:border-gray-300"
            />
          </div>

          {/* Instructions */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-2">
              <AlignLeft size={14} /> Additional Instructions
            </label>
            <textarea
              name="additionalInstructions"
              value={form.additionalInstructions}
              onChange={handleChange}
              rows={3}
              placeholder="e.g. Focus on Chapter 5 and 6, include real-world examples, avoid calculus..."
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none hover:border-gray-300"
            />
          </div>

          {/* File Upload */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Attach Reference File (Optional)
            </label>
            <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-orange-300 hover:bg-orange-50/30 transition-all group">
              {file ? (
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Upload size={16} className="text-orange-500" />
                  <span className="font-medium">{file.name}</span>
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); setFile(null); }}
                    className="ml-2 text-gray-400 hover:text-red-500"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center text-gray-400 group-hover:text-orange-500 transition-colors">
                  <Upload size={24} />
                  <span className="text-xs mt-1.5 font-medium">Click to upload PDF, DOC, or TXT</span>
                  <span className="text-[11px] text-gray-300 mt-0.5">Max 10MB</span>
                </div>
              )}
              <input
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                className="hidden"
                onChange={(e) => setFile(e.target.files[0] || null)}
              />
            </label>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={creating}
            className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-sm py-4 px-6 rounded-xl transition-all hover:scale-[1.01] active:scale-[0.99] shadow-lg shadow-orange-200"
          >
            {creating ? (
              <>
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full spinner" />
                Creating...
              </>
            ) : (
              <>
                Generate Question Paper with AI
                <ChevronRight size={18} />
              </>
            )}
          </button>
        </form>
      </div>
    </Layout>
  );
}
