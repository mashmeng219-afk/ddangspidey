import React, { useEffect, useState, useRef } from 'react';
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { SongItem, CharacterItem } from '../types';
import { INITIAL_SONGS, INITIAL_CHARACTERS } from '../data/seedData';
import { AudioSourceInput } from '../components/AudioSourceInput';
import { Modal } from '../components/Modal';
import { BoomboxRadio } from '../components/BoomboxRadio';
import { CassetteTape } from '../components/CassetteTape';
import { MoonPhaseStrip } from '../components/MoonMotifs';
import { useRouter } from '../router';
import { Plus, Music, X, FileText, User, ChevronDown, Disc } from 'lucide-react';

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
  const [isDragOver, setIsDragOver] = useState(false);
  const [isLyricsOpen, setIsLyricsOpen] = useState(false);

  // Hidden Audio Element Ref
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Modal states for adding/editing song
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSong, setEditingSong] = useState<SongItem | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formAudioUrl, setFormAudioUrl] = useState('');
  const [formLyrics, setFormLyrics] = useState('');
  const [formCharacterId, setFormCharacterId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Load songs & characters from Firestore
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

  // Sync volume with audio element
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Insert & Play Song
  const insertAndPlaySong = (song: SongItem) => {
    setCurrentSong(song);
    setIsLyricsOpen(false); // reset lyrics sheet closed on new tape
    if (audioRef.current) {
      audioRef.current.src = song.audioUrl;
      audioRef.current.currentTime = 0;
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => {
          console.warn('Auto-play blocked or error:', err);
          setIsPlaying(false);
        });
    }
  };

  // Drag & Drop Handlers
  const handleDragStart = (e: React.DragEvent, song: SongItem) => {
    e.dataTransfer.setData('application/json', JSON.stringify(song));
    e.dataTransfer.effectAllowed = 'copyMove';
  };

  const handleDragOverDeck = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setIsDragOver(true);
  };

  const handleDragLeaveDeck = () => {
    setIsDragOver(false);
  };

  const handleDropSong = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    try {
      const data = e.dataTransfer.getData('application/json');
      if (data) {
        const song: SongItem = JSON.parse(data);
        insertAndPlaySong(song);
      }
    } catch (err) {
      console.error('Failed to parse dropped song:', err);
    }
  };

  // Toggle Play / Pause
  const handleTogglePlay = () => {
    if (!audioRef.current || !currentSong) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
  };

  // Seek handler
  const handleSeek = (newTime: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  // Eject tape
  const handleEject = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlaying(false);
    setCurrentSong(null);
    setCurrentTime(0);
    setIsLyricsOpen(false);
  };

  // Audio event listeners
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

  // Modal Openers
  const openAddModal = () => {
    setEditingSong(null);
    setFormTitle('');
    setFormAudioUrl('');
    setFormLyrics('');
    setFormCharacterId('');
    setIsModalOpen(true);
  };

  const openEditModal = (song: SongItem) => {
    setEditingSong(song);
    setFormTitle(song.title);
    setFormAudioUrl(song.audioUrl);
    setFormLyrics(song.lyrics);
    setFormCharacterId(song.relatedCharacterIds?.[0] || '');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formAudioUrl.trim()) {
      alert('오디오 파일(mp3)을 업로드하거나 오디오 URL을 입력해주세요.');
      return;
    }

    try {
      setSubmitting(true);
      const now = new Date().toISOString();
      const relatedCharacterIds = formCharacterId ? [formCharacterId] : [];

      if (editingSong) {
        const ref = doc(db, 'songs', editingSong.id);
        // Using setDoc with { merge: true } instead of updateDoc
        // so that if the document does not exist yet in Firestore, it is automatically created!
        const updatedSong: SongItem = {
          id: editingSong.id,
          title: formTitle.trim(),
          audioUrl: formAudioUrl.trim(),
          lyrics: formLyrics.trim(),
          relatedCharacterIds,
          order: editingSong.order || 1,
          createdAt: editingSong.createdAt || now,
          updatedAt: now,
        };
        await setDoc(ref, updatedSong, { merge: true });
        if (currentSong?.id === editingSong.id) {
          setCurrentSong((prev) => (prev ? {
            ...prev,
            title: formTitle.trim(),
            audioUrl: formAudioUrl.trim(),
            lyrics: formLyrics.trim(),
            relatedCharacterIds,
          } : null));
        }
      } else {
        const newId = `song-${Date.now()}`;
        const ref = doc(db, 'songs', newId);
        const newSong: SongItem = {
          id: newId,
          title: formTitle.trim(),
          audioUrl: formAudioUrl.trim(),
          lyrics: formLyrics.trim(),
          relatedCharacterIds,
          order: songs.length + 1,
          createdAt: now,
          updatedAt: now,
        };
        await setDoc(ref, newSong, { merge: true });
      }
      setIsModalOpen(false);
    } catch (err) {
      alert('저장 중 오류가 발생했습니다: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('이 곡을 삭제하시겠습니까?')) return;
    try {
      if (currentSong?.id === id) {
        handleEject();
      }
      await deleteDoc(doc(db, 'songs', id));
    } catch (err) {
      alert('삭제 중 오류가 발생했습니다: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  // Find related character for attached photo scrap
  const getRelatedCharacter = (charId?: string) => {
    if (!charId) return null;
    return characters.find((c) => c.id === charId) || null;
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] bg-gradient-to-b from-[#0F1E36] via-[#1D3FBB] to-[#E2E8F0] text-[#0B1F4B] px-4 sm:px-6 py-8 sm:py-12 overflow-hidden">
      {/* Hidden Native Audio Element */}
      <audio
        ref={audioRef}
        onTimeUpdate={onTimeUpdate}
        onLoadedMetadata={onLoadedMetadata}
        onEnded={onSongEnded}
        preload="auto"
      />

      {/* Background Star & Paper Grain Overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-10 mix-blend-screen"
        style={{
          backgroundImage: 'radial-gradient(#DCE9FF 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Editorial Page Header: Location name only */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-white/20 pb-5 mb-8">
          <div>
            <span className="font-editorial text-sm tracking-widest text-[#DCE9FF]/80 uppercase block mb-1">
              02 / Archive
            </span>
            <h1 className="text-3xl sm:text-4xl font-semibold text-white tracking-tight">
              노래
            </h1>
            <p className="mt-1 text-xs text-[#DCE9FF]/70 font-light">
              카세트 테이프를 라디오 데크에 드래그하거나 탭하여 재생하세요.
            </p>
          </div>

          <div className="mt-4 sm:mt-0 flex items-center gap-4">
            <MoonPhaseStrip size={14} className="text-[#DCE9FF]/70" />
            {isOwner && (
              <button
                onClick={openAddModal}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-[#0B1F4B] text-xs font-semibold tracking-wide hover:bg-[#DCE9FF] transition-colors shadow-md rounded-xs"
              >
                <Plus className="w-4 h-4" /> 곡 추가
              </button>
            )}
          </div>
        </div>

        {/* ============================================================ */}
        {/* CENTER AREA: VINTAGE BOOMBOX RADIO WITH ACTIVE DECK         */}
        {/* ============================================================ */}
        <section className="py-4 sm:py-6">
          <BoomboxRadio
            currentSong={currentSong}
            isPlaying={isPlaying}
            currentTime={currentTime}
            duration={duration}
            volume={volume}
            isDragOver={isDragOver}
            onDropSong={handleDropSong}
            onDragOverDeck={handleDragOverDeck}
            onDragLeaveDeck={handleDragLeaveDeck}
            onTogglePlay={handleTogglePlay}
            onSeek={handleSeek}
            onVolumeChange={setVolume}
            onEject={handleEject}
            onToggleLyrics={() => setIsLyricsOpen((prev) => !prev)}
            isLyricsOpen={isLyricsOpen}
          />

          {/* UNFOLDED CREAM PAPER LYRICS SHEET (한 번 더 클릭 시 펼쳐지는 편지지) */}
          {isLyricsOpen && currentSong && (
            <div className="max-w-[580px] mx-auto mt-6 transition-all duration-500 animate-in fade-in slide-in-from-top-4">
              <div className="paper-sheet p-6 sm:p-8 relative shadow-2xl paper-fold-line rounded-xs">
                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => setIsLyricsOpen(false)}
                  className="absolute top-4 right-4 text-[#0B1F4B]/50 hover:text-[#0B1F4B] p-1"
                  title="가사 접기"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Lyrics Header */}
                <div className="text-center pb-4 border-b border-[rgba(11,31,75,0.1)] mb-5">
                  <span className="font-editorial text-[10px] tracking-widest text-[#1D3FBB] uppercase block mb-1">
                    Lyrics Sheet
                  </span>
                  <h2 className="text-lg sm:text-xl font-semibold text-[#0B1F4B] tracking-tight">
                    {currentSong.title}
                  </h2>
                  {currentSong.relatedCharacterIds?.[0] && (
                    <button
                      onClick={() => navigate(`/characters/${currentSong.relatedCharacterIds![0]}`)}
                      className="mt-1 inline-flex items-center gap-1 text-xs text-[#1D3FBB] hover:underline"
                    >
                      <User className="w-3 h-3" />
                      관련 캐릭터 보기
                    </button>
                  )}
                </div>

                {/* Lyrics Body */}
                <div className="text-xs sm:text-sm text-[#0B1F4B]/85 font-light leading-relaxed whitespace-pre-wrap max-h-72 overflow-y-auto pr-2 select-text">
                  {currentSong.lyrics || '등록된 가사가 없습니다.'}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* ============================================================ */}
        {/* SCATTERED CASSETTE TAPES TABLE                               */}
        {/* ============================================================ */}
        <section className="mt-8 pt-6 border-t border-white/20">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Disc className="w-4 h-4 text-[#DCE9FF]" />
              <h2 className="text-sm sm:text-base font-semibold text-white tracking-tight">
                카세트 컬렉션 ({songs.length})
              </h2>
            </div>
            <span className="text-xs text-[#DCE9FF]/70 font-mono">
              클릭하거나 라디오로 드래그
            </span>
          </div>

          {loading ? (
            <div className="py-16 text-center text-sm text-white/60 font-light">
              테이프 상자를 여는 중...
            </div>
          ) : songs.length === 0 ? (
            <div className="py-16 text-center border border-dashed border-white/20 p-8 bg-white/[0.04] text-white">
              <Music className="w-8 h-8 mx-auto text-white/40 mb-2" />
              <p className="text-sm text-white/70">등록된 테이프가 없습니다.</p>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 p-4 sm:p-6 bg-white/[0.06] backdrop-blur-xs border border-white/15 rounded-xl shadow-inner min-h-[220px]">
              {songs.map((song, idx) => {
                const isCurrent = currentSong?.id === song.id;
                const charId = song.relatedCharacterIds?.[0];
                const char = getRelatedCharacter(charId);

                return (
                  <CassetteTape
                    key={song.id}
                    song={song}
                    index={idx}
                    isCurrent={isCurrent}
                    relatedCharacter={char}
                    onSelectSong={insertAndPlaySong}
                    onDragStart={handleDragStart}
                    onOpenEdit={openEditModal}
                    onDelete={handleDelete}
                    isOwner={isOwner}
                  />
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Add / Edit Song Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSong ? '노래 수정' : '새 노래 등록'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold tracking-wider uppercase text-[#0B1F4B]/70 mb-1">
              곡 제목 *
            </label>
            <input
              type="text"
              required
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder="예: 달의 잔향"
              className="w-full px-3 py-2 text-sm bg-white border border-[rgba(11,31,75,0.18)] focus:border-[#1D3FBB] focus:outline-none"
            />
          </div>

          <AudioSourceInput
            value={formAudioUrl}
            onChange={setFormAudioUrl}
            disabled={submitting}
          />

          <div>
            <label className="block text-xs font-semibold tracking-wider uppercase text-[#0B1F4B]/70 mb-1">
              관련 캐릭터 연결 (선택)
            </label>
            <select
              value={formCharacterId}
              onChange={(e) => setFormCharacterId(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-[rgba(11,31,75,0.18)] focus:border-[#1D3FBB] focus:outline-none"
            >
              <option value="">연결 안 함</option>
              {characters.map((char) => (
                <option key={char.id} value={char.id}>
                  {char.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold tracking-wider uppercase text-[#0B1F4B]/70 mb-1">
              가사 입력
            </label>
            <textarea
              rows={8}
              value={formLyrics}
              onChange={(e) => setFormLyrics(e.target.value)}
              placeholder="가사를 입력하세요 (줄바꿈 반영)"
              className="w-full px-3 py-2 text-sm bg-white border border-[rgba(11,31,75,0.18)] focus:border-[#1D3FBB] focus:outline-none leading-relaxed"
            />
          </div>

          <div className="pt-4 flex justify-end gap-2 border-t border-[rgba(11,31,75,0.1)]">
            <button
              type="button"
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
              {submitting ? '저장 중...' : editingSong ? '수정 완료' : '등록하기'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
