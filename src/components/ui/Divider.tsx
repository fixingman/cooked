export function Divider({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="flex-1 h-px bg-parchment-300" />
      <span className="text-parchment-400 text-[8px] leading-none">◆</span>
      <div className="flex-1 h-px bg-parchment-300" />
    </div>
  );
}
