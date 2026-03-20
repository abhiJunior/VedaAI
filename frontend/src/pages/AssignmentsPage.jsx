import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchAllAssignments } from '../features/assignmentsSlice';
import Layout from '../components/Layout';
import { Plus, Clock, CheckCircle, AlertCircle, Loader, FileText } from 'lucide-react';

const statusConfig = {
  pending: { label: 'Pending', color: 'text-gray-500 bg-gray-100', icon: Clock },
  processing: { label: 'Generating...', color: 'text-orange-600 bg-orange-50', icon: Loader },
  completed: { label: 'Completed', color: 'text-emerald-700 bg-emerald-50', icon: CheckCircle },
  failed: { label: 'Failed', color: 'text-red-600 bg-red-50', icon: AlertCircle },
};

function EmptyState({ onCreateClick }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      {/* Illustration */}
      <div className="relative mb-6">
        <div className="w-32 h-32 rounded-full bg-gray-100 flex items-center justify-center">
          <div className="relative">
            <FileText size={48} className="text-gray-300" />
            <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
              <span className="text-red-400 text-lg font-bold">✕</span>
            </div>
          </div>
        </div>
        <div className="absolute top-2 left-0 w-4 h-4 bg-orange-300 rounded-full opacity-60" />
        <div className="absolute bottom-0 right-2 w-3 h-3 bg-blue-300 rounded-full opacity-60" />
      </div>

      <h2 className="text-xl font-bold text-gray-800 mb-2">No assignments yet</h2>
      <p className="text-sm text-gray-500 text-center max-w-xs mb-8">
        Create your first assignment to start collecting and grading student submissions.
        You can set up rubrics, define marking criteria, and let AI assist with grading.
      </p>
      <button
        onClick={onCreateClick}
        className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white font-semibold text-sm py-3 px-6 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-md"
      >
        <Plus size={16} />
        Create Your First Assignment
      </button>
    </div>
  );
}

export default function AssignmentsPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { list, loading } = useSelector((state) => state.assignments);

  useEffect(() => {
    dispatch(fetchAllAssignments());
  }, [dispatch]);

  const handleCreate = () => navigate('/assignments/create');

  if (loading) {
    return (
      <Layout title="Assignment">
        <div className="flex items-center justify-center py-32">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-orange-200 border-t-orange-500 rounded-full spinner" />
            <p className="text-sm text-gray-500">Loading assignments...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Assignment">
      {list.length === 0 ? (
        <EmptyState onCreateClick={handleCreate} />
      ) : (
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Assignments</h1>
              <p className="text-sm text-gray-500 mt-0.5">{list.length} assignment{list.length !== 1 ? 's' : ''}</p>
            </div>
            <button
              onClick={handleCreate}
              className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white font-semibold text-sm py-2.5 px-5 rounded-xl transition-all hover:scale-[1.02] shadow-sm"
            >
              <Plus size={15} />
              New Assignment
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {list.map((assignment) => {
              const statusInfo = statusConfig[assignment.status] || statusConfig.pending;
              const StatusIcon = statusInfo.icon;
              return (
                <div
                  key={assignment._id}
                  onClick={() => navigate(`/assignments/${assignment._id}`)}
                  className="bg-white rounded-2xl p-5 border border-gray-100 hover:border-orange-200 hover:shadow-md cursor-pointer transition-all duration-200 hover:-translate-y-0.5 group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center group-hover:bg-orange-100 transition-colors">
                      <FileText size={18} className="text-orange-500" />
                    </div>
                    <span className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${statusInfo.color}`}>
                      <StatusIcon size={12} className={assignment.status === 'processing' ? 'spinner' : ''} />
                      {statusInfo.label}
                    </span>
                  </div>

                  <h3 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-1">{assignment.title}</h3>
                  <p className="text-xs text-gray-500 mb-3">
                    {assignment.subject} • Grade {assignment.grade}
                  </p>

                  <div className="flex items-center justify-between text-xs text-gray-400 pt-3 border-t border-gray-50">
                    <span>{assignment.numberOfQuestions} questions</span>
                    <span>{assignment.totalMarks} marks</span>
                    <span>{new Date(assignment.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Layout>
  );
}
