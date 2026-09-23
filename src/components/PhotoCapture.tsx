import React, { useRef, useState } from 'react';
import { Camera, Image as ImageIcon, X, Plus, ZoomIn, ArrowLeft } from 'lucide-react';
import { useHardwareBack } from '../hooks/useHardwareBack';

interface PhotoCaptureProps {
  photos: string[];
  onChange: (photos: string[]) => void;
  maxPhotos?: number;
  label?: string;
}

export const PhotoCapture: React.FC<PhotoCaptureProps> = ({
  photos,
  onChange,
  maxPhotos = 3,
  label = 'Foto Bukti Pengerjaan (Wajib min. 1)',
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [compressing, setCompressing] = useState(false);
  const [selectedPreviewPhoto, setSelectedPreviewPhoto] = useState<string | null>(null);

  // Hook hardware back button when previewing photo to avoid exiting app
  useHardwareBack(!!selectedPreviewPhoto, () => setSelectedPreviewPhoto(null), 'photo_preview');

  // Compress image on canvas to lightweight JPEG (<100KB)
  const processImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (readerEvent) => {
        const img = new Image();
        img.onload = () => {
          const maxWidth = 800;
          const maxHeight = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(readerEvent.target?.result as string);
            return;
          }

          // Draw image
          ctx.drawImage(img, 0, 0, width, height);

          // Add timestamp watermark
          const now = new Date();
          const timeStr = `${now.toLocaleDateString('id-ID')} ${now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`;
          ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
          ctx.fillRect(0, height - 26, width, 26);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 12px sans-serif';
          ctx.fillText(`SiCheck • ${timeStr}`, 10, height - 8);

          // Export compressed JPEG quality 0.65
          const dataUrl = canvas.toDataURL('image/jpeg', 0.65);
          resolve(dataUrl);
        };
        img.onerror = () => reject(new Error('Gagal memuat gambar'));
        img.src = readerEvent.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Gagal membaca file'));
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setCompressing(true);
    const newPhotos: string[] = [];

    try {
      const remainingSlots = maxPhotos - photos.length;
      const countToProcess = Math.min(files.length, remainingSlots);

      for (let i = 0; i < countToProcess; i++) {
        const compressed = await processImage(files[i]);
        newPhotos.push(compressed);
      }

      onChange([...photos, ...newPhotos]);
    } catch (err: any) {
      alert('Gagal memproses foto: ' + err.message);
    } finally {
      setCompressing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removePhoto = (indexToRemove: number) => {
    const updated = photos.filter((_, idx) => idx !== indexToRemove);
    onChange(updated);
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
          <Camera className="w-3.5 h-3.5 text-blue-600" />
          <span>{label}</span>
          <span className="text-[10px] text-slate-400 font-normal">
            ({photos.length}/{maxPhotos})
          </span>
        </label>
        {photos.length > 0 && (
          <span className="text-[10px] text-slate-400">Ketuk foto untuk perbesar</span>
        )}
      </div>

      <div className="flex flex-wrap gap-2.5">
        {photos.map((photo, idx) => (
          <div
            key={idx}
            className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-200 shadow-xs group bg-slate-100"
          >
            <img
              src={photo}
              alt={`Bukti ${idx + 1}`}
              onClick={() => setSelectedPreviewPhoto(photo)}
              className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition"
              title="Ketuk untuk melihat ukuran penuh"
            />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removePhoto(idx);
              }}
              className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-red-600 active:scale-90 transition z-10"
              title="Hapus foto"
            >
              <X className="w-3 h-3" />
            </button>
            <div
              onClick={() => setSelectedPreviewPhoto(photo)}
              className="absolute bottom-0 inset-x-0 bg-black/40 text-white text-[9px] py-0.5 text-center cursor-pointer pointer-events-none"
            >
              Zoom
            </div>
          </div>
        ))}

        {photos.length < maxPhotos && (
          <button
            type="button"
            disabled={compressing}
            onClick={() => fileInputRef.current?.click()}
            className="w-20 h-20 rounded-xl border-2 border-dashed border-blue-200 bg-blue-50/50 hover:bg-blue-50 active:scale-95 text-blue-600 flex flex-col items-center justify-center gap-1 text-[10px] font-medium transition cursor-pointer"
          >
            {compressing ? (
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Camera className="w-5 h-5" />
                <span>+ Foto</span>
              </>
            )}
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Enlarged Photo Modal with explicit Back button & Hardware Back handling */}
      {selectedPreviewPhoto && (
        <div
          onClick={() => setSelectedPreviewPhoto(null)}
          className="fixed inset-0 z-50 bg-black/95 flex flex-col justify-between p-4 animate-in fade-in"
        >
          {/* Header with Back button */}
          <div className="flex items-center justify-between text-white pb-2 z-10">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedPreviewPhoto(null);
              }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-semibold backdrop-blur-xs transition active:scale-95"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali</span>
            </button>
            <span className="text-xs text-slate-300">Foto Bukti Kebersihan</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedPreviewPhoto(null);
              }}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Photo Container */}
          <div className="flex-1 flex items-center justify-center my-auto">
            <img
              src={selectedPreviewPhoto}
              alt="Foto Diperbesar"
              onClick={(e) => e.stopPropagation()}
              className="max-w-full max-h-[78vh] object-contain rounded-xl shadow-2xl"
            />
          </div>

          {/* Footer note */}
          <div className="text-center text-[11px] text-slate-400 pt-2">
            Ketuk tombol Kembali atau area gelap untuk menutup
          </div>
        </div>
      )}
    </div>
  );
};
