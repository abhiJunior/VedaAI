import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAssignment, regenerateAssignment, clearJobStatus, setJobStarted } from '../features/assignmentsSlice';
import { useSocket } from '../hooks/useSocket';
import Layout from '../components/Layout';
import DifficultyBadge from '../components/DifficultyBadge';
import GenerationProgress from '../components/GenerationProgress';
import {
  Download,
  RefreshCw,
  Clock,
  BookOpen,
  GraduationCap,
  Star,
  AlertCircle,
  Loader,
  User,
  Hash,
} from 'lucide-react';
import toast from 'react-hot-toast';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function StudentInfoRow({ icon: Icon, label }) {
  return (
    <div className="flex items-center gap-2 text-sm text-gray-600">
      <Icon size={14} className="text-gray-400 flex-shrink-0" />
      <span className="font-medium w-20">{label}:</span>
      <div className="flex-1 border-b border-gray-300 border-dashed h-5" />
    </div>
  );
}

export default function OutputPage() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { currentAssignment, loading, creating, jobStatus, jobProgress, jobMessage } = useSelector(
    (s) => s.assignments
  );
  const [studentInfo, setStudentInfo] = useState({ name: '', roll: '', section: '' });

  // Subscribe to real-time updates
  useSocket(id);

  useEffect(() => {
    if (id) dispatch(fetchAssignment(id));
  }, [id, dispatch]);

  // Re-fetch after job completes
  useEffect(() => {
    if (jobStatus === 'completed') {
      setTimeout(() => {
        dispatch(fetchAssignment(id));
        dispatch(clearJobStatus());
      }, 1200);
    }
  }, [jobStatus, id, dispatch]);

  const handleRegenerate = async () => {
    const result = await dispatch(regenerateAssignment(id));
    if (regenerateAssignment.fulfilled.match(result)) {
      dispatch(setJobStarted({ message: 'Re-queued for AI generation...', progress: 5 }));
      toast.success('Regenerating your question paper...');
    } else {
      toast.error('Failed to regenerate');
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const base = import.meta.env.VITE_API_BASE_URL || '/api';
      const response = await fetch(`${base}/assignments/${id}/pdf`);
      if (!response.ok) throw new Error('PDF not available');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${currentAssignment?.title || 'question-paper'}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('PDF download not available yet');
    }
  };

  const showProgress =
    jobStatus === 'started' || jobStatus === 'progress' || jobStatus === 'failed';

  if (loading && !currentAssignment) {
    return (
      <Layout title="Question Paper">
        <div className="flex items-center justify-center py-32">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-orange-200 border-t-orange-500 rounded-full spinner" />
            <p className="text-sm text-gray-500">Loading paper...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!currentAssignment) {
    return (
      <Layout title="Question Paper">
        <div className="flex flex-col items-center justify-center py-32">
          <AlertCircle size={40} className="text-gray-300 mb-3" />
          <p className="text-gray-500">Assignment not found</p>
          <button onClick={() => navigate('/assignments')} className="mt-4 text-orange-500 text-sm font-medium hover:underline">
            Go back to assignments
          </button>
        </div>
      </Layout>
    );
  }

  const { title, subject, grade, status, result, dueDate, numberOfQuestions, totalMarks, timeAllowed } = currentAssignment;
  const paper = result;

  return (
    <Layout title="Question Paper">
      {showProgress && (
        <GenerationProgress
          progress={jobProgress}
          message={jobMessage}
          status={jobStatus}
          onClose={() => dispatch(clearJobStatus())}
        />
      )}

      <div className="max-w-3xl mx-auto">
        {/* Action bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{title}</h1>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1 text-sm text-gray-500">
              <span className="flex items-center gap-1"><BookOpen size={13} /> {subject}</span>
              <span className="flex items-center gap-1"><GraduationCap size={13} /> Grade {grade}</span>
              <span className="flex items-center gap-1"><Star size={13} /> {totalMarks} marks</span>
              {timeAllowed && (
                <span className="flex items-center gap-1"><Clock size={13} /> {timeAllowed}</span>
              )}
              {dueDate && (
                <span className="flex items-center gap-1">
                  <Clock size={13} /> Due {new Date(dueDate).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleRegenerate}
              disabled={creating || status === 'processing'}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:border-gray-300 hover:bg-gray-50 transition-all disabled:opacity-50"
            >
              <RefreshCw size={14} className={creating ? 'spinner' : ''} />
              Regenerate
            </button>
            {status === 'completed' && (
              <button
                onClick={handleDownloadPDF}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded-xl transition-all shadow-sm"
              >
                <Download size={14} />
                Download PDF
              </button>
            )}
          </div>
        </div>

        {/* Processing state */}
        {status === 'processing' && !paper && (
          <div className="bg-orange-50 border border-orange-200 rounded-2xl p-10 text-center">
            <div className="w-14 h-14 border-4 border-orange-200 border-t-orange-500 rounded-full spinner mx-auto mb-4" />
            <p className="text-orange-700 font-semibold">AI is generating your question paper...</p>
            <p className="text-orange-500 text-sm mt-1">This usually takes 10–30 seconds</p>
          </div>
        )}

        {/* Failed state */}
        {status === 'failed' && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
            <AlertCircle size={36} className="text-red-400 mx-auto mb-3" />
            <p className="text-red-700 font-semibold">Generation failed</p>
            <p className="text-red-500 text-sm mt-1">{currentAssignment.errorMessage || 'An error occurred during AI generation.'}</p>
            <button
              onClick={handleRegenerate}
              className="mt-4 px-5 py-2.5 bg-red-500 text-white text-sm font-semibold rounded-xl hover:bg-red-600 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Question paper */}
        {status === 'completed' && paper?.sections?.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-fade-in">
            {/* Paper header */}
            <div className="bg-gradient-to-r from-gray-900 to-gray-700 text-white px-8 py-6 text-center">
              <h2 className="text-xl font-bold tracking-wide uppercase">
                {paper.paperTitle || `${subject} Question Paper`}
              </h2>
              <p className="text-gray-300 text-sm mt-1">
                {paper.subject} | Grade: {paper.grade} | Time: {timeAllowed || paper.timeAllowed || '3 Hours'} | Total Marks: {paper.totalMarks}
              </p>
            </div>

            <div className="px-8 py-6">
              {/* General instructions */}
              <div className="border border-gray-200 rounded-xl p-4 mb-6 bg-gray-50">
                <p className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">General Instructions</p>
                <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside">
                  <li>Read all questions carefully before answering.</li>
                  <li>Write answers in the space provided.</li>
                  <li>All questions are compulsory unless stated otherwise.</li>
                  <li>Marks for each question are indicated in brackets.</li>
                </ul>
              </div>

              {/* Student info */}
              <div className="border border-gray-200 rounded-xl p-5 mb-6">
                <p className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">Student Information</p>
                <div className="grid grid-cols-1 gap-3">
                  <StudentInfoRow icon={User} label="Name" />
                  <div className="grid grid-cols-2 gap-4">
                    <StudentInfoRow icon={Hash} label="Roll No." />
                    <StudentInfoRow icon={BookOpen} label="Section" />
                  </div>
                </div>
              </div>

              {/* Sections */}
              {paper.sections.map((section, sIdx) => {
                let questionCounter = 0;
                paper.sections.slice(0, sIdx).forEach((s) => { questionCounter += s.questions.length; });

                return (
                  <div key={sIdx} className="mb-8">
                    {/* Section header */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-gray-900 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                        {ALPHABET[sIdx]}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">{section.title}</h3>
                        {section.instruction && (
                          <p className="text-xs text-gray-500 mt-0.5">{section.instruction}</p>
                        )}
                      </div>
                    </div>

                    {/* Questions */}
                    <div className="space-y-3">
                      {section.questions.map((q, qIdx) => {
                        const num = questionCounter + qIdx + 1;
                        return (
                          <div
                            key={qIdx}
                            className="border border-gray-100 rounded-xl p-4 hover:border-gray-200 transition-colors"
                          >
                            <div className="flex items-start gap-3">
                              <span className="w-7 h-7 rounded-lg bg-gray-100 text-gray-600 text-xs font-bold flex items-center justify-center flex-shrink-0">
                                {num}
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-gray-800 leading-relaxed">{q.question}</p>

                                {/* MCQ Options */}
                                {q.options && q.options.length > 0 && (
                                  <div className="mt-2.5 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                    {q.options.map((opt, oIdx) => (
                                      <div key={oIdx} className="flex items-center gap-2 text-xs text-gray-600">
                                        <span className="font-semibold text-gray-400">({String.fromCharCode(65 + oIdx)})</span>
                                        {opt}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                                <DifficultyBadge difficulty={q.difficulty} />
                                <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                                  [{q.marks}M]
                                </span>
                              </div>
                            </div>

                            {/* Answer space for non-MCQ */}
                            {(!q.options || q.options.length === 0) && (
                              <div className="mt-3 border-t border-dashed border-gray-200 pt-2">
                                <div className="space-y-1">
                                  {Array.from({ length: q.marks > 4 ? 6 : 3 }).map((_, i) => (
                                    <div key={i} className="w-full h-5 border-b border-gray-100" />
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* Footer */}
              <div className="text-center text-xs text-gray-400 border-t border-gray-100 pt-4 mt-4">
                *** End of Question Paper *** | Generated by VedaAI
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
