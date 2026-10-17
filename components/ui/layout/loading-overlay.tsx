interface LoadingOverlayProps {
  message: string;
}

export function LoadingOverlay({ message }: LoadingOverlayProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex cursor-wait items-center justify-center bg-black/70"
      role="status"
      aria-live="polite"
      aria-label={message}
    >
      <div className="flex items-center gap-3 rounded-lg border border-gray-700 bg-gray-900 px-6 py-4 text-white shadow-xl">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-gray-600 border-t-blue-400" />
        <span>{message}</span>
      </div>
    </div>
  );
}