const difficultyConfig = {
  easy: {
    label: 'Easy',
    classes: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
  },
  medium: {
    label: 'Medium',
    classes: 'bg-amber-100 text-amber-700 border border-amber-200',
  },
  hard: {
    label: 'Hard',
    classes: 'bg-red-100 text-red-700 border border-red-200',
  },
};

export default function DifficultyBadge({ difficulty }) {
  const config = difficultyConfig[difficulty?.toLowerCase()] || difficultyConfig.medium;
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${config.classes}`}
    >
      {config.label}
    </span>
  );
}
