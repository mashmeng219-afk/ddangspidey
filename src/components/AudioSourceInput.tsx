import React, { useState, useRef } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';
import { UploadCloud, Link as LinkIcon, Loader2, Check, Music, Volume2, AlertCircle } from 'lucide-react';

interface AudioSourceInputProps {
  value: string;
  onChange: (url: string) => void;
  disabled?: boolean;
}

export const AudioSourceInput: React.FC<AudioSourceInputProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  // Determine initial mode: If value is already a Firebase storage URL or empty, default to upload tab; else url tab
  const [mode, setMode] = useState<'upload' | 'url'>(() => {
    if (!value) return 'upload';
    if (value.includes('firebasestorage') || value.startsWith('blob:')) return 'upload';
    return 'url';
  });

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleUploadFile = async (file: File) => {
    if (!file) return;

    // Validate audio file type or extension
    const isAudio = file.type.startsWith('audio/') || /\.(mp3|wav|ogg|m4a|aac|flac)$/i.test(file.name);
    if (!isAudio) {
      setErrorMsg('MP3 또는 오디오 형식의 파일(.mp3, .wav 등)을 선택해주세요.');
      return;
    }

    try {
      setErrorMsg(null);
      setUploading(true);
      setUploadProgress('오디오 파일 업로드 중...');

      const timestamp = Date.now();
      const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const storageRef = ref(storage, `songs/${timestamp}_${safeName}`);

      const snapshot = await uploadBytes(storageRef, file, {
        contentType: file.type || 'audio/mpeg',
      });

      const downloadUrl = await getDownloadURL(snapshot.ref);
      onChange(downloadUrl);
      setUploadedFileName(file.name);
      setUploadProgress('업로드 완료!');
      setTimeout(() => setUploadProgress(null), 2500);
    } catch (err: unknown) {
      console.error('Audio upload failed:', err);
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(`업로드 중 오류가 발생했습니다: ${msg}. 링크 직접 입력 방식으로 등록할 수도 있습니다.`);
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleUploadFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled || uploading) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleUploadFile(file);
    }
  };

  return (
    <div className="space-y-2">
      {/* Label and Mode Switcher Tabs */}
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold tracking-wider uppercase text-[#0B1F4B]/80 flex items-center gap-1.5">
          <Music className="w-3.5 h-3.5 text-[#1D3FBB]" />
          오디오 음원 (MP3 업로드 / 링크) *
        </label>

        {/* Segmented Control Buttons */}
        <div className="inline-flex rounded-sm bg-[#0B1F4B]/5 p-0.5 border border-[rgba(11,31,75,0.1)] text-xs">
          <button
            type="button"
            onClick={() => setMode('upload')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-xs transition-all font-medium ${
              mode === 'upload'
                ? 'bg-white text-[#1D3FBB] shadow-xs'
                : 'text-[#0B1F4B]/60 hover:text-[#0B1F4B]'
            }`}
          >
            <UploadCloud className="w-3 h-3" />
            MP3 직접 업로드
          </button>
          <button
            type="button"
            onClick={() => setMode('url')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-xs transition-all font-medium ${
              mode === 'url'
                ? 'bg-white text-[#1D3FBB] shadow-xs'
                : 'text-[#0B1F4B]/60 hover:text-[#0B1F4B]'
            }`}
          >
            <LinkIcon className="w-3 h-3" />
            링크(URL) 붙여넣기
          </button>
        </div>
      </div>

      {/* Error message alert */}
      {errorMsg && (
        <div className="p-2.5 bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-1.5 rounded-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span className="leading-tight">{errorMsg}</span>
        </div>
      )}

      {/* Mode 1: Direct MP3 File Upload */}
      {mode === 'upload' && (
        <div className="space-y-2">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => !uploading && fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xs p-5 sm:p-6 text-center cursor-pointer transition-all ${
              isDragOver
                ? 'border-[#1D3FBB] bg-[#DCE9FF]/30 scale-[1.01]'
                : 'border-[rgba(11,31,75,0.2)] bg-white hover:border-[#1D3FBB] hover:bg-[#FAF6EF]/50'
            } ${uploading || disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*,.mp3,.wav,.ogg,.m4a"
              disabled={uploading || disabled}
              onChange={handleFileChange}
              className="hidden"
            />

            <div className="flex flex-col items-center justify-center gap-1.5">
              {uploading ? (
                <>
                  <Loader2 className="w-7 h-7 text-[#1D3FBB] animate-spin mb-1" />
                  <p className="text-xs font-semibold text-[#1D3FBB]">{uploadProgress}</p>
                  <p className="text-[11px] text-[#0B1F4B]/50 font-light">
                    잠시만 기다려주세요...
                  </p>
                </>
              ) : (
                <>
                  <div className="w-10 h-10 rounded-full bg-[#DCE9FF]/50 text-[#1D3FBB] flex items-center justify-center mb-1">
                    <UploadCloud className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-semibold text-[#0B1F4B]">
                    MP3 파일을 클릭하여 선택하거나 여기로 드래그하세요
                  </p>
                  <p className="text-[11px] text-[#0B1F4B]/50 font-light">
                    지원 포맷: .mp3, .wav, .m4a, .ogg 등 (Firebase Storage에 안전하게 저장됩니다)
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Upload Status Card */}
          {value && (
            <div className="flex items-center justify-between text-xs bg-[#FAF6EF] border border-[rgba(11,31,75,0.12)] p-2.5 rounded-xs">
              <div className="min-w-0 pr-2">
                <span className="text-[11px] text-[#0B1F4B]/50 block">현재 등록된 오디오:</span>
                <span className="font-mono text-[#0B1F4B] truncate block text-[11px] max-w-[320px]">
                  {uploadedFileName || value}
                </span>
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 px-2 py-1 rounded-xs border border-emerald-200 flex-shrink-0 font-medium">
                <Check className="w-3.5 h-3.5" /> 업로드됨
              </span>
            </div>
          )}
        </div>
      )}

      {/* Mode 2: Paste Audio URL */}
      {mode === 'url' && (
        <div className="space-y-2">
          <input
            type="url"
            value={value}
            disabled={disabled}
            onChange={(e) => {
              setErrorMsg(null);
              onChange(e.target.value);
            }}
            placeholder="https://example.com/audio/song.mp3"
            className="w-full px-3 py-2.5 text-sm bg-white border border-[rgba(11,31,75,0.18)] focus:border-[#1D3FBB] focus:outline-none transition-colors"
          />
          <p className="text-[11px] text-[#0B1F4B]/50 font-light">
            웹에 공개된 MP3 오디오 파일의 직접 접근 가능한 URL을 입력하세요.
          </p>
        </div>
      )}

      {/* Instant Audio Preview Player */}
      {value && (
        <div className="mt-2 p-3 bg-[#FAF6EF] border border-[rgba(11,31,75,0.12)] rounded-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-semibold text-[#1D3FBB] flex items-center gap-1">
              <Volume2 className="w-3.5 h-3.5" />
              오디오 미리듣기
            </span>
            <span className="text-[10px] text-[#0B1F4B]/40 font-mono">
              미리 듣고 정상 재생되는지 확인하세요
            </span>
          </div>
          <audio
            controls
            src={value}
            className="w-full h-8"
            preload="metadata"
          />
        </div>
      )}
    </div>
  );
};
