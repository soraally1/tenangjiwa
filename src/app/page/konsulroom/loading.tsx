export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#B3E5FC] to-[#FFF3E0] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-4 border-[#1E498E]/30 border-t-[#1E498E] animate-spin"></div>
        <p className="text-[#1E498E] font-medium">Memuat ruang konsultasi...</p>
      </div>
    </div>
  );
}
