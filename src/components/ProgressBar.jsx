function ProgressBar({ value }) {
  return (
    <div className="w-full">
      <div className="mb-1 flex items-center justify-between text-xs font-semibold text-slate-500">
        <span>Прогресс</span>
        <span>{value}%</span>
      </div>
      <div className="h-2.5 w-full rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-gradient-to-r from-brand-blue to-brand-green transition-all duration-500"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

export default ProgressBar;
