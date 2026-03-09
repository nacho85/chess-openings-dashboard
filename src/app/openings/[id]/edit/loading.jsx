export default function Loading() {
  return (
    <div className="h-full min-h-[300px] flex items-center justify-center">
      <div className="flex items-center gap-3 text-sm text-neutral-500">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-neutral-400 border-t-transparent" />
        Cargando vista de edición...
      </div>
    </div>
  );
}