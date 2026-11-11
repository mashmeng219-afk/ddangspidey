import React, { useState } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';
import { UploadCloud, Link as LinkIcon, Loader2, Check } from 'lucide-react';

interface StorageUploaderProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  accept?: string;
  folder?: string;
  placeholder?: string;
}

export const StorageUploader: React.FC<StorageUploaderProps> = ({
  label,
  value,
  onChange,
  accept = 'image/*',
  folder = 'uploads',
  placeholder = 'https://...',
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [isUrlMode, setIsUrlMode] = useState(!value.startsWith('blob:') && !value.includes('firebasestorage'));

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      setUploadProgress('업로드 중...');
      const timestamp = Date.now();
      const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const fileRef = ref(storage, `${folder}/${timestamp}_${safeName}`);

      const snapshot = await uploadBytes(fileRef, file);
      const downloadUrl = await getDownloadURL(snapshot.ref);
      onChange(downloadUrl);
      setUploadProgress('업로드 완료');
      setTimeout(() => setUploadProgress(null), 2000);
    } catch (err: unknown) {
      console.error('Storage upload failed:', err);
      // Fallback: If Firebase storage rule/bucket is restricted, notify user and allow direct URL
      alert('파일 업로드 중 오류가 발생했습니다. 직접 URL을 입력할 수도 있습니다: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold tracking-wider uppercase text-[#0B1F4B]/70">
          {label}
        </label>
        <button
          type="button"
          onClick={() => setIsUrlMode(!isUrlMode)}
          className="text-[11px] text-[#2F5BEA] hover:underline flex items-center gap-1"
        >
          {isUrlMode ? (
            <>
              <UploadCloud className="w-3 h-3" /> 파일 업로드로 전환
            </>
          ) : (
            <>
              <LinkIcon className="w-3 h-3" /> 직접 URL 입력으로 전환
            </>
          )}
        </button>
      </div>

      {isUrlMode ? (
        <input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-3 py-2 text-sm bg-white border border-[rgba(11,31,75,0.18)] focus:border-[#1D3FBB] focus:outline-none transition-colors"
        />
      ) : (
        <div className="space-y-2">
          <label className="flex items-center justify-center gap-2 px-4 py-3 border border-dashed border-[rgba(11,31,75,0.25)] hover:border-[#1D3FBB] bg-white cursor-pointer transition-colors text-xs text-[#0B1F4B]/80">
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-[#1D3FBB]" />
                <span>{uploadProgress || '업로드 중...'}</span>
              </>
            ) : (
              <>
                <UploadCloud className="w-4 h-4 text-[#1D3FBB]" />
                <span>파일 선택 ({accept})</span>
              </>
            )}
            <input
              type="file"
              accept={accept}
              disabled={uploading}
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
          {value && (
            <div className="flex items-center justify-between text-xs text-[#0B1F4B]/70 bg-[#DCE9FF]/30 px-3 py-1.5 border border-[#DCE9FF]">
              <span className="truncate max-w-[280px]">{value}</span>
              <span className="text-emerald-600 flex items-center gap-0.5">
                <Check className="w-3.5 h-3.5" /> 설정됨
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
