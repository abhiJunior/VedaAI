import { useEffect } from 'react';
import { CheckCircle, AlertCircle, Loader } from 'lucide-react';

const steps = [
  { threshold: 10, label: 'Queued for generation', icon: 'loader' },
  { threshold: 30, label: 'Building AI prompt...', icon: 'loader' },
  { threshold: 50, label: 'AI is generating questions...', icon: 'loader' },
  { threshold: 75, label: 'Parsing & validating response...', icon: 'loader' },
  { threshold: 100, label: 'Question paper ready!', icon: 'check' },
];

export default function GenerationProgress({ progress, message, status, onClose }) {
  const isFailed = status === 'failed';
  const isCompleted = status === 'completed';

  const currentStepIndex = steps.findLastIndex((s) => progress >= s.threshold);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md mx-4 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col items-center mb-6">
          {isFailed ? (
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-3">
              <AlertCircle size={32} className="text-red-500" />
            </div>
          ) : isCompleted ? (
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-3">
              <CheckCircle size={32} className="text-emerald-500" />
            </div>
          ) : (
            <div className="relative w-16 h-16 mb-3">
              <div className="w-16 h-16 rounded-full border-4 border-orange-100 border-t-orange-500 spinner" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-bold text-orange-600">{progress}%</span>
              </div>
            </div>
          )}

          <h3 className="text-lg font-bold text-gray-900">
            {isFailed
              ? 'Generation Failed'
              : isCompleted
              ? 'Paper Generated!'
              : 'Generating Question Paper'}
          </h3>
          <p className="text-sm text-gray-500 text-center mt-1">{message}</p>
        </div>

        {/* Progress bar */}
        {!isFailed && (
          <div className="mb-6">
            <div className="flex justify-between text-xs text-gray-400 mb-1.5">
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-orange-400 to-orange-600 rounded-full transition-all duration-700 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Steps */}
        <div className="space-y-2.5">
          {steps.map((step, idx) => {
            const isDone = idx < currentStepIndex || isCompleted;
            const isActive = idx === currentStepIndex && !isFailed && !isCompleted;

            return (
              <div key={idx} className="flex items-center gap-3">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                    isDone || (isCompleted && step.icon === 'check')
                      ? 'bg-emerald-500'
                      : isActive
                      ? 'bg-orange-500'
                      : 'bg-gray-100'
                  }`}
                >
                  {isDone || (isCompleted) ? (
                    <CheckCircle size={14} className="text-white" />
                  ) : isActive ? (
                    <Loader size={14} className="text-white spinner" />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-gray-300" />
                  )}
                </div>
                <span
                  className={`text-sm ${
                    isDone || isActive ? 'text-gray-800 font-medium' : 'text-gray-400'
                  }`}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Failed close button */}
        {(isFailed || isCompleted) && (
          <button
            onClick={onClose}
            className="mt-6 w-full py-2.5 rounded-xl bg-gray-900 text-white font-semibold text-sm hover:bg-gray-800 transition-colors"
          >
            {isFailed ? 'Close' : 'View Paper'}
          </button>
        )}
      </div>
    </div>
  );
}
