export function Message({ text }: { text?: string }) {
  if (!text) return null;

  return (
    <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      {text}
    </div>
  );
}
