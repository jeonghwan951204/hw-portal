export default function StatusPanel({ loading, error, emptyMessage }) {
  if (loading) {
    return (
      <div className="py-16 text-center text-sm text-slate-400">
        불러오는 중입니다...
      </div>
    );
  }

  if (error) {
    return (
      <div className="m-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
        {error}
      </div>
    );
  }

  return (
    <div className="py-16 text-center text-sm text-slate-400">
      {emptyMessage}
    </div>
  );
}
