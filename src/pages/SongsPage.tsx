import React, { useEffect, useState, useRef } from 'react';
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { SongItem, CharacterItem } from '../types';
import { INITIAL_SONGS, INITIAL_CHARACTERS } from '../data/seedData';
import { Modal } from '../components/Modal';
import { MoonPhaseStrip } from '../components/MoonMotifs';
import { useRouter } from '../router';
import {
  Plus,
  Play,
  Pause,
  Volume2,
  VolumeX,
  FileText,
  Disc,
  Edit2,
  Trash2,
  Upload,
  Link as LinkIcon,
  AlertCircle,
  X,
  Music,
  Check,
  User,
} from 'lucide-react';

// Format seconds to mm:ss
function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

// Client-side image compression: max 1200px width/height, quality 0.88
async function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    img.onload = () => {
      const maxDim = 1200;
      let width = img.width;
      let height = img.height;
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(file);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else resolve(file);
        },
        'image/jpeg',
        0.88
      );
    };
    reader.readAsDataURL(file);
  });
}

// CD Disc Graphic Component
interface CDDiscProps {
  coverUrl?: string;
  isPlaying: boolean;
  isExtended: boolean;
  slideDirection: 'left' | 'right';
  title: string;
}

const CDDisc: React.FC<CDDiscProps> = ({
  coverUrl,
  isPlaying,
  isExtended,
  slideDirection,
  title,
}) => {
  return (
    <div
      className={`absolute inset-0 z-0 transition-transform duration-500 ease-out pointer-events-none flex items-center justify-center ${
        isExtended
          ? slideDirection === 'right'
            ? 'translate-x-[48%]'
            : '-translate-x-[48%]'
          : 'translate-x-0'
      }`}
    >
      {/* Outer Disc: Rotating when playing, paused when stopped */}
      <div
        className="w-[94%] h-[94%] rounded-full shadow-xl relative overflow-hidden flex items-center justify-center border border-white/50"
        style={{
          background:
            'radial-gradient(circle at 50% 50%, #202738 0%, #0B1F4B 45%, #182542 70%, #0d1526 100%)',
          animation: 'spin 8s linear infinite',
          animationPlayState: isPlaying ? 'running' : 'paused',
        }}
      >
        {/* Subtle Conic Rainbow Iridescent Sheen */}
        <div
          className="absolute inset-0 opacity-40 mix-blend-color-dodge pointer-events-none"
          style={{
            background:
              'conic-gradient(from 45deg, rgba(255,255,255,0.7) 0deg, rgba(111,168,255,0.5) 40deg, rgba(255,180,200,0.5) 85deg, rgba(180,255,230,0.5) 130deg, rgba(255,255,255,0.7) 180deg, rgba(111,168,255,0.5) 220deg, rgba(255,180,200,0.5) 265deg, rgba(180,255,230,0.5) 310deg, rgba(255,255,255,0.7) 360deg)',
          }}
        />

        {/* Concentric Vinyl/CD Grooves */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none opacity-25"
          viewBox="0 0 200 200"
        >
          <circle cx="100" cy="100" r="92" fill="none" stroke="white" strokeWidth="0.75" />
          <circle cx="100" cy="100" r="82" fill="none" stroke="white" strokeWidth="0.5" />
          <circle cx="100" cy="100" r="72" fill="none" stroke="white" strokeWidth="0.5" />
          <circle cx="100" cy="100" r="62" fill="none" stroke="white" strokeWidth="0.5" />
          <circle cx="100" cy="100" r="50" fill="none" stroke="white" strokeWidth="0.75" />
        </svg>

        {/* Clear Plastic Inner Band */}
        <div className="w-[46%] h-[46%] rounded-full border border-white/40 bg-white/10 backdrop-blur-[1px] flex items-center justify-center relative shadow-inner">
          {/* Center Label (Cover Thumbnail or Royal Blue Hub) */}
          <div className="w-[74%] h-[74%] rounded-full overflow-hidden border border-white/60 bg-[#1D3FBB] shadow-md flex items-center justify-center text-center p-1 relative">
            {coverUrl ? (
              <img src={coverUrl} alt={title} className="w-full h-full object-cover rounded-full" />
            ) : (
              <span className="text-[9px] font-mono font-bold tracking-widest text-white/90 uppercase">
                CD
              </span>
            )}
            {/* Center Spindle Hole */}
            <div className="absolute w-[30%] h-[30%] rounded-full bg-[#FAF8F5] border border-[rgba(11,31,75,0.3)] shadow-inner" />
          </div>
        </div>
      </div>
    </div>
  );
};

export const SongsPage: React.FC = () => {
  const { isOwner } = useAuth();
  const { navigate } = useRouter();
  const [songs, setSongs] = useState<SongItem[]>([]);
  const [characters, setCharacters] = useState<CharacterItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Audio Playback State
  const [currentSong, setCurrentSong] = useState<SongItem | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [isLyricsOpen, setIsLyricsOpen] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);

  // Responsive Layout detection for edge column direction
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1200
  );

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Modal states for adding/editing album
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSong, setEditingSong] = useState<SongItem | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formLyrics, setFormLyrics] = useState('');
  const [formCharacterId, setFormCharacterId] = useState('');

  // Audio input modes (file upload vs URL link)
  const [audioMode, setAudioMode] = useState<'upload' | 'url'>('upload');
  const [formAudioUrl, setFormAudioUrl] = useState('');
  const [selectedAudioFile, setSelectedAudioFile] = useState<File | null>(null);

  // Cover image mode (file upload vs URL link)
  const [coverMode, setCoverMode] = useState<'upload' | 'url'>('upload');
  const [formCoverUrl, setFormCoverUrl] = useState('');
  const [selectedCoverFile, setSelectedCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  // Upload Progress & Submitting state
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadStatusText, setUploadStatusText] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);

  // Window resize listener
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Subscribe to Songs & Characters
  useEffect(() => {
    const unsubSongs = onSnapshot(
      collection(db, 'songs'),
      (snapshot) => {
        if (!snapshot.empty) {
          const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as SongItem));
          list.sort((a, b) => (a.order || 0) - (b.order || 0));
          setSongs(list);
        } else {
          setSongs(INITIAL_SONGS);
        }
        setLoading(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'songs');
      }
    );

    const unsubChars = onSnapshot(
      collection(db, 'characters'),
      (snapshot) => {
        if (!snapshot.empty) {
          setCharacters(snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as CharacterItem)));
        } else {
          setCharacters(INITIAL_CHARACTERS);
        }
      },
      () => setCharacters(INITIAL_CHARACTERS)
    );

    return () => {
      unsubSongs();
      unsubChars();
    };
  }, []);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, []);

  // Volume sync
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Audio Event Listeners
  const onTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      setDuration(audioRef.current.duration || 0);
    }
  };

  const onLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration || 0);
    }
  };

  const onSongEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const onAudioError = () => {
    setAudioError('재생할 수 없는 파일이에요');
    setIsPlaying(false);
  };

  // Determine slide direction so CD does not clip on the right edge
  const getSlideDirection = (index: number): 'left' | 'right' => {
    if (windowWidth >= 1024) {
      return index % 4 === 3 ? 'left' : 'right';
    }
    if (windowWidth >= 768) {
      return index % 3 === 2 ? 'left' : 'right';
    }
    return index % 2 === 1 ? 'left' : 'right';
  };

  // Handle Album Click:
  // 1) Click -> CD slides out + audio plays
  // 2) Same album click -> pause audio & freeze CD rotation (CD remains extended)
  // 3) Click again -> resume playback from paused position
  // 4) Click another album -> previous CD retracts, new CD slides out & plays
  const handleAlbumClick = (song: SongItem) => {
    setAudioError(null);

    // Clicking the already active album: Toggle Play / Pause
    if (currentSong?.id === song.id) {
      if (isPlaying) {
        if (audioRef.current) {
          audioRef.current.pause();
        }
        setIsPlaying(false);
      } else {
        if (audioRef.current) {
          audioRef.current
            .play()
            .then(() => setIsPlaying(true))
            .catch((err) => {
              console.warn('Playback error:', err);
              setAudioError('재생할 수 없는 파일이에요');
              setIsPlaying(false);
            });
        }
      }
      return;
    }

    // Clicking a new album: Switch track and start playing
    setCurrentSong(song);
    setIsLyricsOpen(false); // Close lyrics sheet when switching tracks
    if (audioRef.current) {
      audioRef.current.src = song.audioUrl;
      audioRef.current.currentTime = 0;
      audioRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch((err) => {
          console.warn('Auto-play blocked or error:', err);
          setIsPlaying(false);
        });
    }
  };

  // Bottom player bar toggle
  const handleTogglePlay = () => {
    if (!audioRef.current || !currentSong) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => {
          setAudioError('재생할 수 없는 파일이에요');
          setIsPlaying(false);
        });
    }
  };

  // Seek handler
  const handleSeek = (newTime: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  // Open Add Album Modal
  const openAddModal = () => {
    setEditingSong(null);
    setFormTitle('');
    setFormLyrics('');
    setFormCharacterId('');
    setAudioMode('upload');
    setFormAudioUrl('');
    setSelectedAudioFile(null);
    setCoverMode('upload');
    setFormCoverUrl('');
    setSelectedCoverFile(null);
    setCoverPreview(null);
    setUploadProgress(null);
    setFormError(null);
    setIsModalOpen(true);
  };

  // Open Edit Album Modal
  const openEditModal = (song: SongItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingSong(song);
    setFormTitle(song.title);
    setFormLyrics(song.lyrics);
    setFormCharacterId(song.relatedCharacterIds?.[0] || '');
    setFormAudioUrl(song.audioUrl);
    setAudioMode(song.audioUrl ? 'url' : 'upload');
    setSelectedAudioFile(null);
    setFormCoverUrl(song.coverUrl || '');
    setCoverMode(song.coverUrl ? 'url' : 'upload');
    setSelectedCoverFile(null);
    setCoverPreview(song.coverUrl || null);
    setUploadProgress(null);
    setFormError(null);
    setIsModalOpen(true);
  };

  // Handle Cover File Selection with Preview
  const handleCoverFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('커버 이미지는 5MB 이하의 파일만 업로드할 수 있습니다.');
      return;
    }
    if (!file.type.startsWith('image/')) {
      alert('.jpg, .png, .webp 형식의 이미지 파일을 선택해주세요.');
      return;
    }

    setSelectedCoverFile(file);
    const url = URL.createObjectURL(file);
    setCoverPreview(url);
  };

  // Handle Audio File Selection
  const handleAudioFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      alert('음원 파일은 20MB 이하의 MP3 파일만 업로드할 수 있습니다.');
      return;
    }
    const isAudio =
      file.type.startsWith('audio/') || /\.(mp3|wav|ogg|m4a|aac)$/i.test(file.name);
    if (!isAudio) {
      alert('.mp3 또는 오디오 형식의 파일을 선택해주세요.');
      return;
    }

    setSelectedAudioFile(file);
  };

  // Submit Album (Add / Edit) with Robust Upload and Orphan File Cleanup
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const titleTrimmed = formTitle.trim();
    if (!titleTrimmed) {
      setFormError('곡 제목을 입력해주세요.');
      return;
    }

    // Validate Audio Source
    let finalAudioUrl = formAudioUrl.trim();
    if (audioMode === 'upload' && !selectedAudioFile && !finalAudioUrl) {
      setFormError('MP3 음원 파일을 업로드하거나 링크를 입력해주세요.');
      return;
    }
    if (audioMode === 'url' && !finalAudioUrl) {
      setFormError('음원 링크 URL을 입력해주세요.');
      return;
    }

    let finalCoverUrl = formCoverUrl.trim();

    let uploadedAudioPath: string | null = null;
    let uploadedCoverPath: string | null = null;

    try {
      setSubmitting(true);
      const timestamp = Date.now();

      // 1. Upload Cover Image (if file selected)
      if (coverMode === 'upload' && selectedCoverFile) {
        setUploadStatusText('커버 이미지 압축 및 업로드 중...');
        const compressedBlob = await compressImage(selectedCoverFile);
        const coverPath = `covers/${timestamp}_${selectedCoverFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        uploadedCoverPath = coverPath;

        const coverRef = ref(storage, coverPath);
        const coverUploadTask = uploadBytesResumable(coverRef, compressedBlob, {
          contentType: 'image/jpeg',
        });

        await new Promise<void>((resolve, reject) => {
          coverUploadTask.on(
            'state_changed',
            (snapshot) => {
              const progress = Math.round(
                (snapshot.bytesTransferred / snapshot.totalBytes) * 30
              );
              setUploadProgress(progress);
            },
            (error) => reject(error),
            async () => {
              finalCoverUrl = await getDownloadURL(coverUploadTask.snapshot.ref);
              resolve();
            }
          );
        });
      }

      // 2. Upload Audio File (if file selected)
      if (audioMode === 'upload' && selectedAudioFile) {
        setUploadStatusText('MP3 음원 업로드 중...');
        const audioPath = `songs/${timestamp}_${selectedAudioFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        uploadedAudioPath = audioPath;

        const audioRefStorage = ref(storage, audioPath);
        const audioUploadTask = uploadBytesResumable(audioRefStorage, selectedAudioFile, {
          contentType: selectedAudioFile.type || 'audio/mpeg',
        });

        await new Promise<void>((resolve, reject) => {
          audioUploadTask.on(
            'state_changed',
            (snapshot) => {
              const progress =
                30 +
                Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 70);
              setUploadProgress(progress);
            },
            (error) => reject(error),
            async () => {
              finalAudioUrl = await getDownloadURL(audioUploadTask.snapshot.ref);
              resolve();
            }
          );
        });
      }

      setUploadStatusText('Firestore에 정보 저장 중...');
      const now = new Date().toISOString();
      const relatedCharacterIds = formCharacterId ? [formCharacterId] : [];

      if (editingSong) {
        const songRef = doc(db, 'songs', editingSong.id);
        const updatedSong: Partial<SongItem> = {
          id: editingSong.id,
          title: titleTrimmed,
          audioUrl: finalAudioUrl,
          coverUrl: finalCoverUrl || undefined,
          lyrics: formLyrics.trim(),
          relatedCharacterIds,
          order: editingSong.order || 1,
          createdAt: editingSong.createdAt || now,
          updatedAt: now,
        };
        if (uploadedAudioPath) updatedSong.audioPath = uploadedAudioPath;
        if (uploadedCoverPath) updatedSong.coverPath = uploadedCoverPath;

        await setDoc(songRef, updatedSong, { merge: true });

        if (currentSong?.id === editingSong.id) {
          setCurrentSong((prev) => (prev ? { ...prev, ...updatedSong } : null));
        }
      } else {
        const newId = `song-${timestamp}`;
        const songRef = doc(db, 'songs', newId);
        const newSong: SongItem = {
          id: newId,
          title: titleTrimmed,
          audioUrl: finalAudioUrl,
          coverUrl: finalCoverUrl || undefined,
          audioPath: uploadedAudioPath || undefined,
          coverPath: uploadedCoverPath || undefined,
          lyrics: formLyrics.trim(),
          relatedCharacterIds,
          order: songs.length + 1,
          createdAt: now,
          updatedAt: now,
        };
        await setDoc(songRef, newSong, { merge: true });
      }

      setIsModalOpen(false);
    } catch (err) {
      console.error('Failed to save album:', err);
      // Clean up orphaned storage uploads if saving failed
      if (uploadedCoverPath) {
        deleteObject(ref(storage, uploadedCoverPath)).catch(() => {});
      }
      if (uploadedAudioPath) {
        deleteObject(ref(storage, uploadedAudioPath)).catch(() => {});
      }
      const msg = err instanceof Error ? err.message : String(err);
      setFormError(`저장 중 오류가 발생했습니다: ${msg}`);
    } finally {
      setSubmitting(false);
      setUploadProgress(null);
      setUploadStatusText('');
    }
  };

  // Delete Album (with confirmation and Storage cleanup)
  const handleDelete = async (song: SongItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!confirm('삭제할까요?')) return;

    try {
      if (currentSong?.id === song.id) {
        if (audioRef.current) {
          audioRef.current.pause();
        }
        setIsPlaying(false);
        setCurrentSong(null);
        setIsLyricsOpen(false);
      }

      await deleteDoc(doc(db, 'songs', song.id));

      // Clean up Storage files if path is saved
      if (song.audioPath) {
        deleteObject(ref(storage, song.audioPath)).catch(() => {});
      }
      if (song.coverPath) {
        deleteObject(ref(storage, song.coverPath)).catch(() => {});
      }
    } catch (err) {
      alert('삭제 중 오류가 발생했습니다: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  // Get related character name
  const getCharacterName = (charId?: string) => {
    if (!charId) return null;
    return characters.find((c) => c.id === charId)?.name || null;
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#FAF8F5] text-[#0B1F4B] px-4 sm:px-6 py-10 sm:py-16 pb-36">
      {/* Hidden Native Audio Element */}
      <audio
        ref={audioRef}
        onTimeUpdate={onTimeUpdate}
        onLoadedMetadata={onLoadedMetadata}
        onEnded={onSongEnded}
        onError={onAudioError}
        preload="auto"
      />

      <div className="max-w-6xl mx-auto">
        {/* Editorial Page Header: Location name only */}
        <div className="border-b border-[rgba(11,31,75,0.12)] pb-6 mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="font-editorial text-sm tracking-widest text-[#2F5BEA] uppercase block mb-1">
              02 / Archive
            </span>
            <h1 className="text-3xl sm:text-4xl font-semibold text-[#0B1F4B] tracking-tight">
              노래
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-[#0B1F4B]/60 font-light">
              앨범을 클릭하면 커버 뒤에서 CD가 빠져나오며 재생됩니다.
            </p>
          </div>

          <div className="flex items-center gap-4 self-start sm:self-auto">
            <MoonPhaseStrip size={14} className="text-[#1D3FBB] opacity-60" />
            {isOwner && (
              <button
                onClick={openAddModal}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1D3FBB] text-white text-xs font-semibold tracking-wide hover:bg-[#2F5BEA] transition-colors rounded-xs shadow-xs"
              >
                <Plus className="w-4 h-4" /> 앨범 추가
              </button>
            )}
          </div>
        </div>

        {/* Audio Error Alert */}
        {audioError && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 text-xs text-red-700 flex items-center justify-between rounded-xs max-w-md mx-auto">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
              <span>{audioError}</span>
            </div>
            <button
              onClick={() => setAudioError(null)}
              className="text-red-500 hover:text-red-700 text-sm font-bold ml-2"
            >
              ×
            </button>
          </div>
        )}

        {/* ============================================================ */}
        {/* ALBUM GRID: 4 cols Desktop, 3 Tablet, 2 Mobile               */}
        {/* ============================================================ */}
        {loading ? (
          <div className="py-24 text-center text-sm text-[#0B1F4B]/50 font-light">
            앨범을 꺼내는 중...
          </div>
        ) : songs.length === 0 ? (
          <div className="py-24 text-center border border-dashed border-[rgba(11,31,75,0.15)] p-8 bg-[#F6EFE3]/40">
            <Music className="w-10 h-10 mx-auto text-[#0B1F4B]/25 mb-3" />
            <p className="text-base font-medium text-[#0B1F4B]/70">아직 곡이 없어요</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 sm:gap-x-12 gap-y-12 sm:gap-y-16 pt-4">
            {songs.map((song, idx) => {
              const isSelected = currentSong?.id === song.id;
              const isCurrentPlaying = isSelected && isPlaying;
              const slideDir = getSlideDirection(idx);
              const charName = getCharacterName(song.relatedCharacterIds?.[0]);

              return (
                <div
                  key={song.id}
                  className="flex flex-col items-center group relative select-none"
                  style={{ zIndex: isSelected ? 30 : 10 }}
                >
                  {/* Album Cover & CD Container */}
                  <div
                    onClick={() => handleAlbumClick(song)}
                    className="relative w-full aspect-square cursor-pointer transition-transform duration-300 hover:scale-[1.02]"
                  >
                    {/* The CD Disc: Sits behind the cover, slides out when active */}
                    <CDDisc
                      coverUrl={song.coverUrl}
                      isPlaying={isCurrentPlaying}
                      isExtended={isSelected}
                      slideDirection={slideDir}
                      title={song.title}
                    />

                    {/* Square Cover Sleeve: Sits in front of the disc */}
                    <div className="relative z-10 w-full h-full bg-[#FAF8F5] border border-[rgba(11,31,75,0.15)] shadow-md overflow-hidden group-hover:shadow-lg transition-shadow">
                      {song.coverUrl ? (
                        <img
                          src={song.coverUrl}
                          alt={song.title}
                          loading="lazy"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        /* Blue palette fallback cover */
                        <div className="w-full h-full bg-gradient-to-br from-[#1D3FBB] to-[#0B1F4B] text-white flex flex-col items-center justify-center p-4 text-center relative overflow-hidden">
                          <Disc className="w-12 h-12 text-[#6FA8FF]/80 mb-2 stroke-[1.2]" />
                          <span className="text-xs font-semibold tracking-tight text-white/95 line-clamp-2 px-1">
                            {song.title}
                          </span>
                          <span className="text-[10px] text-[#DCE9FF]/60 font-mono mt-1">
                            ARCHIVE
                          </span>
                        </div>
                      )}

                      {/* Small Playing Badge on Cover */}
                      {isSelected && (
                        <div className="absolute top-2 left-2 z-20 px-2 py-0.5 bg-[#0B1F4B]/80 backdrop-blur-xs text-white text-[10px] font-mono flex items-center gap-1 rounded-xs">
                          {isCurrentPlaying ? (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-[#6FA8FF] animate-pulse" />
                              재생 중
                            </>
                          ) : (
                            <>
                              <Pause className="w-2.5 h-2.5 text-white/80" />
                              정지됨
                            </>
                          )}
                        </div>
                      )}

                      {/* Owner Hover Controls */}
                      {isOwner && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="absolute top-2 right-2 z-30 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 p-1 rounded-xs backdrop-blur-xs"
                        >
                          <button
                            type="button"
                            onClick={(e) => openEditModal(song, e)}
                            className="p-1 text-white hover:text-[#6FA8FF] transition-colors"
                            title="수정"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDelete(song, e)}
                            className="p-1 text-red-300 hover:text-red-400 transition-colors"
                            title="삭제"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Album Title & Character Subtitle Below */}
                  <div className="w-full mt-3 text-center px-1">
                    <h3
                      onClick={() => handleAlbumClick(song)}
                      className="text-xs sm:text-sm font-semibold text-[#0B1F4B] truncate cursor-pointer hover:text-[#1D3FBB] transition-colors"
                      title={song.title}
                    >
                      {song.title}
                    </h3>

                    {charName && (
                      <p className="text-[11px] text-[#0B1F4B]/50 font-light truncate mt-0.5">
                        {charName}
                      </p>
                    )}

                    {/* Lyrics toggle button appears for the currently active album */}
                    {isSelected && (
                      <div className="mt-2 flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => setIsLyricsOpen((prev) => !prev)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-xs font-medium transition-all ${
                            isLyricsOpen
                              ? 'bg-[#1D3FBB] text-white shadow-xs'
                              : 'bg-[#DCE9FF]/70 text-[#1D3FBB] hover:bg-[#DCE9FF]'
                          }`}
                        >
                          <FileText className="w-3 h-3" />
                          가사 {isLyricsOpen ? '접기' : '보기'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ============================================================ */}
        {/* UNFOLDED CREAM PAPER LYRICS SHEET                            */}
        {/* ============================================================ */}
        {isLyricsOpen && currentSong && (
          <div className="mt-12 max-w-2xl mx-auto transition-all duration-300 animate-in fade-in slide-in-from-top-4">
            <div className="paper-sheet p-6 sm:p-8 relative shadow-xl paper-fold-line rounded-xs border border-[rgba(11,31,75,0.12)]">
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setIsLyricsOpen(false)}
                className="absolute top-4 right-4 text-[#0B1F4B]/50 hover:text-[#0B1F4B] p-1 transition-colors"
                title="가사 접기"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Header */}
              <div className="text-center pb-4 border-b border-[rgba(11,31,75,0.12)] mb-5">
                <span className="font-editorial text-[10px] tracking-widest text-[#1D3FBB] uppercase block mb-1">
                  Lyrics Sheet
                </span>
                <h2 className="text-lg sm:text-xl font-semibold text-[#0B1F4B] tracking-tight">
                  {currentSong.title}
                </h2>
                {currentSong.relatedCharacterIds?.[0] && (
                  <button
                    onClick={() => navigate(`/characters/${currentSong.relatedCharacterIds![0]}`)}
                    className="mt-1.5 inline-flex items-center gap-1 text-xs text-[#1D3FBB] hover:underline"
                  >
                    <User className="w-3 h-3" />
                    관련 캐릭터: {getCharacterName(currentSong.relatedCharacterIds[0])}
                  </button>
                )}
              </div>

              {/* Lyrics Content with Pretendard font and pre-wrap */}
              <div className="text-xs sm:text-sm text-[#0B1F4B]/85 font-light leading-relaxed whitespace-pre-wrap max-h-80 overflow-y-auto pr-2 select-text">
                {currentSong.lyrics || '가사가 없어요'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* BOTTOM PLAYBACK BAR: Persistent while a song is selected     */}
      {/* ============================================================ */}
      {currentSong && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#FAF8F5]/95 backdrop-blur-md border-t border-[rgba(11,31,75,0.15)] shadow-2xl px-4 py-2.5 sm:py-3 transition-transform duration-300">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-6">
            {/* Left: Song Info */}
            <div className="flex items-center gap-3 min-w-0 w-full sm:w-1/4">
              <div className="w-10 h-10 rounded-xs bg-[#1D3FBB] flex-shrink-0 overflow-hidden border border-[rgba(11,31,75,0.15)]">
                {currentSong.coverUrl ? (
                  <img
                    src={currentSong.coverUrl}
                    alt={currentSong.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white">
                    <Disc className="w-5 h-5 text-[#6FA8FF]" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-xs sm:text-sm font-semibold text-[#0B1F4B] truncate">
                  {currentSong.title}
                </h4>
                <p className="text-[11px] text-[#0B1F4B]/50 truncate font-light">
                  {getCharacterName(currentSong.relatedCharacterIds?.[0]) || 'Archive'}
                </p>
              </div>
            </div>

            {/* Center: Play/Pause & Seek Slider */}
            <div className="flex-1 w-full max-w-xl flex flex-col items-center gap-1">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleTogglePlay}
                  className="w-8 h-8 rounded-full bg-[#1D3FBB] text-white flex items-center justify-center hover:bg-[#2F5BEA] transition-colors shadow-sm"
                  title={isPlaying ? '정지' : '재생'}
                >
                  {isPlaying ? (
                    <Pause className="w-4 h-4 fill-white" />
                  ) : (
                    <Play className="w-4 h-4 fill-white ml-0.5" />
                  )}
                </button>
              </div>

              {/* Progress Slider */}
              <div className="w-full flex items-center gap-2 text-[11px] text-[#0B1F4B]/60 font-mono">
                <span className="w-8 text-right">{formatTime(currentTime)}</span>
                <input
                  type="range"
                  min={0}
                  max={duration || 100}
                  value={currentTime}
                  onChange={(e) => handleSeek(Number(e.target.value))}
                  className="flex-1 h-1 bg-[rgba(11,31,75,0.15)] rounded-lg appearance-none cursor-pointer accent-[#1D3FBB]"
                />
                <span className="w-8">{formatTime(duration)}</span>
              </div>
            </div>

            {/* Right: Volume & Lyrics Button */}
            <div className="hidden sm:flex items-center justify-end gap-4 w-1/4">
              <button
                type="button"
                onClick={() => setIsLyricsOpen((prev) => !prev)}
                className={`p-1.5 rounded-xs transition-colors text-xs font-medium flex items-center gap-1 ${
                  isLyricsOpen
                    ? 'text-[#1D3FBB] bg-[#DCE9FF]/70'
                    : 'text-[#0B1F4B]/60 hover:text-[#0B1F4B]'
                }`}
                title="가사 보기/접기"
              >
                <FileText className="w-4 h-4" />
                <span className="text-[11px]">가사</span>
              </button>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsMuted((prev) => !prev)}
                  className="text-[#0B1F4B]/60 hover:text-[#0B1F4B] p-1"
                  title={isMuted ? '음소거 해제' : '음소거'}
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-4 h-4 text-red-500" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={isMuted ? 0 : volume}
                  onChange={(e) => {
                    setIsMuted(false);
                    setVolume(Number(e.target.value));
                  }}
                  className="w-16 h-1 bg-[rgba(11,31,75,0.15)] rounded-lg appearance-none cursor-pointer accent-[#1D3FBB]"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* OWNER MODAL: ADD / EDIT ALBUM                                */}
      {/* ============================================================ */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => !submitting && setIsModalOpen(false)}
        title={editingSong ? '앨범 수정' : '새 앨범 추가'}
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-[#0B1F4B]">
          {formError && (
            <div className="p-3 bg-red-50 border border-red-200 text-xs text-red-700 rounded-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          {/* 1. Title */}
          <div>
            <label className="block text-xs font-semibold tracking-wider uppercase text-[#0B1F4B]/75 mb-1">
              곡 제목 *
            </label>
            <input
              type="text"
              required
              disabled={submitting}
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder="예: 달의 잔향 (Echo of the Moon)"
              className="w-full px-3 py-2 text-sm bg-white border border-[rgba(11,31,75,0.18)] focus:border-[#1D3FBB] focus:outline-none"
            />
          </div>

          {/* 2. Audio Source (Direct MP3 Upload or URL link) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold tracking-wider uppercase text-[#0B1F4B]/75 flex items-center gap-1.5">
                <Music className="w-3.5 h-3.5 text-[#1D3FBB]" />
                음원 파일 (MP3 업로드 또는 링크) *
              </label>

              <div className="inline-flex rounded-sm bg-[#0B1F4B]/5 p-0.5 border border-[rgba(11,31,75,0.1)] text-xs">
                <button
                  type="button"
                  onClick={() => setAudioMode('upload')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-xs transition-all font-medium ${
                    audioMode === 'upload'
                      ? 'bg-white text-[#1D3FBB] shadow-xs'
                      : 'text-[#0B1F4B]/60 hover:text-[#0B1F4B]'
                  }`}
                >
                  <Upload className="w-3 h-3" />
                  파일 업로드
                </button>
                <button
                  type="button"
                  onClick={() => setAudioMode('url')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-xs transition-all font-medium ${
                    audioMode === 'url'
                      ? 'bg-white text-[#1D3FBB] shadow-xs'
                      : 'text-[#0B1F4B]/60 hover:text-[#0B1F4B]'
                  }`}
                >
                  <LinkIcon className="w-3 h-3" />
                  링크 입력
                </button>
              </div>
            </div>

            {audioMode === 'upload' ? (
              <div className="space-y-1.5">
                <input
                  type="file"
                  accept="audio/mpeg,audio/mp3,audio/*"
                  disabled={submitting}
                  onChange={handleAudioFileChange}
                  className="w-full text-xs text-[#0B1F4B] file:mr-3 file:py-2 file:px-3 file:border file:border-[rgba(11,31,75,0.2)] file:text-xs file:font-semibold file:bg-[#FAF8F5] file:text-[#0B1F4B] hover:file:bg-[#DCE9FF]/50 cursor-pointer"
                />
                <p className="text-[11px] text-[#0B1F4B]/50 font-light">
                  최대 20MB 이하의 .mp3 파일을 선택하세요.
                </p>
                {selectedAudioFile && (
                  <p className="text-xs text-emerald-700 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> {selectedAudioFile.name} (
                    {(selectedAudioFile.size / (1024 * 1024)).toFixed(1)}MB)
                  </p>
                )}
              </div>
            ) : (
              <div>
                <input
                  type="url"
                  disabled={submitting}
                  value={formAudioUrl}
                  onChange={(e) => setFormAudioUrl(e.target.value)}
                  placeholder="https://example.com/song.mp3"
                  className="w-full px-3 py-2 text-sm bg-white border border-[rgba(11,31,75,0.18)] focus:border-[#1D3FBB] focus:outline-none"
                />
              </div>
            )}
          </div>

          {/* 3. Cover Image (File Upload with Auto-Resize or URL link) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold tracking-wider uppercase text-[#0B1F4B]/75 flex items-center gap-1.5">
                <Disc className="w-3.5 h-3.5 text-[#1D3FBB]" />
                커버 이미지 (선택 사항)
              </label>

              <div className="inline-flex rounded-sm bg-[#0B1F4B]/5 p-0.5 border border-[rgba(11,31,75,0.1)] text-xs">
                <button
                  type="button"
                  onClick={() => setCoverMode('upload')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-xs transition-all font-medium ${
                    coverMode === 'upload'
                      ? 'bg-white text-[#1D3FBB] shadow-xs'
                      : 'text-[#0B1F4B]/60 hover:text-[#0B1F4B]'
                  }`}
                >
                  <Upload className="w-3 h-3" />
                  이미지 업로드
                </button>
                <button
                  type="button"
                  onClick={() => setCoverMode('url')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-xs transition-all font-medium ${
                    coverMode === 'url'
                      ? 'bg-white text-[#1D3FBB] shadow-xs'
                      : 'text-[#0B1F4B]/60 hover:text-[#0B1F4B]'
                  }`}
                >
                  <LinkIcon className="w-3 h-3" />
                  이미지 링크
                </button>
              </div>
            </div>

            {coverMode === 'upload' ? (
              <div className="space-y-2">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  disabled={submitting}
                  onChange={handleCoverFileChange}
                  className="w-full text-xs text-[#0B1F4B] file:mr-3 file:py-2 file:px-3 file:border file:border-[rgba(11,31,75,0.2)] file:text-xs file:font-semibold file:bg-[#FAF8F5] file:text-[#0B1F4B] hover:file:bg-[#DCE9FF]/50 cursor-pointer"
                />
                <p className="text-[11px] text-[#0B1F4B]/50 font-light">
                  5MB 이하 .jpg, .png, .webp (업로드 시 1200px 이하로 자동 최적화 압축)
                </p>
                {coverPreview && (
                  <div className="flex items-center gap-3 p-2 bg-[#F6EFE3]/50 border border-[rgba(11,31,75,0.1)] rounded-xs">
                    <img
                      src={coverPreview}
                      alt="Preview"
                      className="w-14 h-14 object-cover border border-[rgba(11,31,75,0.15)]"
                    />
                    <span className="text-xs text-[#0B1F4B]/70">미리보기</span>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <input
                  type="url"
                  disabled={submitting}
                  value={formCoverUrl}
                  onChange={(e) => {
                    setFormCoverUrl(e.target.value);
                    setCoverPreview(e.target.value);
                  }}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3 py-2 text-sm bg-white border border-[rgba(11,31,75,0.18)] focus:border-[#1D3FBB] focus:outline-none"
                />
              </div>
            )}
          </div>

          {/* 4. Related Character */}
          <div>
            <label className="block text-xs font-semibold tracking-wider uppercase text-[#0B1F4B]/75 mb-1">
              관련 캐릭터 (선택)
            </label>
            <select
              disabled={submitting}
              value={formCharacterId}
              onChange={(e) => setFormCharacterId(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-[rgba(11,31,75,0.18)] focus:border-[#1D3FBB] focus:outline-none"
            >
              <option value="">연결 안 함</option>
              {characters.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* 5. Lyrics */}
          <div>
            <label className="block text-xs font-semibold tracking-wider uppercase text-[#0B1F4B]/75 mb-1">
              가사
            </label>
            <textarea
              rows={6}
              disabled={submitting}
              value={formLyrics}
              onChange={(e) => setFormLyrics(e.target.value)}
              placeholder="가사를 입력하세요 (줄바꿈이 그대로 보존됩니다)"
              className="w-full px-3 py-2 text-sm bg-white border border-[rgba(11,31,75,0.18)] focus:border-[#1D3FBB] focus:outline-none leading-relaxed"
            />
          </div>

          {/* Upload Progress Bar */}
          {submitting && (
            <div className="space-y-1.5 p-3 bg-[#DCE9FF]/40 border border-[#2F5BEA]/30 rounded-xs">
              <div className="flex justify-between text-xs text-[#1D3FBB] font-medium">
                <span>{uploadStatusText || '업로드 중...'}</span>
                {uploadProgress !== null && <span>{uploadProgress}%</span>}
              </div>
              <div className="w-full h-1.5 bg-white rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#1D3FBB] transition-all duration-300"
                  style={{ width: `${uploadProgress ?? 50}%` }}
                />
              </div>
            </div>
          )}

          {/* Modal Actions */}
          <div className="pt-4 flex justify-end gap-2 border-t border-[rgba(11,31,75,0.1)]">
            <button
              type="button"
              disabled={submitting}
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-[#0B1F4B]/70 hover:text-[#0B1F4B] transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-[#0B1F4B] text-white text-xs font-medium tracking-wide hover:bg-[#1D3FBB] transition-colors disabled:opacity-50"
            >
              {submitting
                ? uploadProgress !== null
                  ? `업로드 중 (${uploadProgress}%)...`
                  : '저장 중...'
                : editingSong
                ? '수정 완료'
                : '등록하기'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
