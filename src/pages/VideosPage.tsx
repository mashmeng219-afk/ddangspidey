import React, { useEffect, useState, useRef } from 'react';
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { VideoItem } from '../types';
import { INITIAL_VIDEOS } from '../data/seedData';
import { Modal } from '../components/Modal';
import { RadiantNightMoon, MoonPhaseStrip } from '../components/MoonMotifs';
import { Plus, Edit2, Trash2, Video as VideoIcon, ExternalLink, Play } from 'lucide-react';

function extractYouTubeId(url: string): string {
  if (!url) return '';
  const trimmed = url.trim();
  // Standard watch v=
  const matchWatch = trimmed.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
  if (matchWatch && matchWatch[1]) return matchWatch[1];
  // Shorts
  const matchShorts = trimmed.match(/youtube\.com\/shorts\/([^"&?\/\s]{11})/i);
  if (matchShorts && matchShorts[1]) return matchShorts[1];
  // Direct 11 char ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
  return '';
}

interface VideoThumbnailProps {
  youtubeId: string;
  title: string;
}

const VideoThumbnail: React.FC<VideoThumbnailProps> = ({ youtubeId, title }) => {
  const [hasError, setHasError] = useState(false);

  if (hasError || !youtubeId) {
    return (
      <div className="w-full h-full bg-[#1D3FBB] flex items-center justify-center text-white/70">
        <VideoIcon className="w-5 h-5 text-white/80" />
      </div>
    );
  }

  return (
    <img
      src={`https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`}
      alt={title}
      loading="lazy"
      onError={() => setHasError(true)}
      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
    />
  );
};

export const VideosPage: React.FC = () => {
  const { isOwner } = useAuth();
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);

  const mainPlayerRef = useRef<HTMLDivElement | null>(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<VideoItem | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formYoutubeUrl, setFormYoutubeUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'videos'),
      (snapshot) => {
        let list: VideoItem[] = [];
        if (!snapshot.empty) {
          list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as VideoItem));
          list.sort((a, b) => (a.order || 0) - (b.order || 0));
          setVideos(list);
        } else {
          setVideos(INITIAL_VIDEOS);
          list = INITIAL_VIDEOS;
        }

        // Determine currently selected video from hash or first item
        const hashId = window.location.hash.replace('#', '');
        const matched = list.find((v) => v.id === hashId);
        if (matched) {
          setSelectedVideo(matched);
        } else if (list.length > 0) {
          setSelectedVideo((prev) => (prev ? list.find((v) => v.id === prev.id) || list[0] : list[0]));
        } else {
          setSelectedVideo(null);
        }

        setLoading(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'videos');
      }
    );

    return () => unsubscribe();
  }, []);

  // Handle Hash changes from external navigation / back button
  useEffect(() => {
    const handleHashChange = () => {
      const hashId = window.location.hash.replace('#', '');
      if (hashId && videos.length > 0) {
        const found = videos.find((v) => v.id === hashId);
        if (found) {
          setSelectedVideo(found);
        }
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [videos]);

  const handleSelectVideo = (vid: VideoItem) => {
    setSelectedVideo(vid);
    window.history.replaceState(null, '', `#${vid.id}`);
    if (mainPlayerRef.current) {
      mainPlayerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const openAddModal = () => {
    setEditingVideo(null);
    setFormTitle('');
    setFormDescription('');
    setFormYoutubeUrl('');
    setIsModalOpen(true);
  };

  const openEditModal = (video: VideoItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingVideo(video);
    setFormTitle(video.title);
    setFormDescription(video.description);
    setFormYoutubeUrl(video.youtubeUrl);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ytId = extractYouTubeId(formYoutubeUrl);
    if (!ytId) {
      alert('유효한 유튜브 영상 링크 또는 11자리 영상 ID를 입력해주세요.');
      return;
    }

    try {
      setSubmitting(true);
      const now = new Date().toISOString();
      if (editingVideo) {
        const ref = doc(db, 'videos', editingVideo.id);
        const updatedVideo: Partial<VideoItem> = {
          id: editingVideo.id,
          title: formTitle.trim(),
          description: formDescription.trim(),
          youtubeUrl: formYoutubeUrl.trim(),
          youtubeId: ytId,
          order: editingVideo.order || 1,
          createdAt: editingVideo.createdAt || now,
          updatedAt: now,
        };
        await setDoc(ref, updatedVideo, { merge: true });
        if (selectedVideo?.id === editingVideo.id) {
          setSelectedVideo((prev) => (prev ? { ...prev, ...updatedVideo } : null));
        }
      } else {
        const newId = `vid-${Date.now()}`;
        const ref = doc(db, 'videos', newId);
        const newVideo: VideoItem = {
          id: newId,
          title: formTitle.trim(),
          description: formDescription.trim(),
          youtubeUrl: formYoutubeUrl.trim(),
          youtubeId: ytId,
          order: videos.length + 1,
          createdAt: now,
          updatedAt: now,
        };
        await setDoc(ref, newVideo, { merge: true });
        setSelectedVideo(newVideo);
      }
      setIsModalOpen(false);
    } catch (err) {
      alert('저장 중 오류가 발생했습니다: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!confirm('삭제할까요?')) return;
    try {
      await deleteDoc(doc(db, 'videos', id));
      if (selectedVideo?.id === id) {
        const remaining = videos.filter((v) => v.id !== id);
        setSelectedVideo(remaining.length > 0 ? remaining[0] : null);
      }
    } catch (err) {
      alert('삭제 중 오류가 발생했습니다: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] bg-gradient-to-b from-[#060D20] via-[#0B1F4B] to-[#040816] text-[#DCE9FF] overflow-hidden select-none pb-24">
      {/* Night Sky Background Moon Motif */}
      <div className="relative pt-10 pb-6 flex flex-col items-center justify-center">
        <RadiantNightMoon size={100} />
        <div className="mt-3">
          <MoonPhaseStrip size={14} className="text-[#DCE9FF]/70" />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Editorial Page Header: Location name only */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-white/15 pb-5 mb-8">
          <div>
            <span className="font-editorial text-sm tracking-widest text-[#6FA8FF] uppercase block mb-1">
              01 / Archive
            </span>
            <h1 className="text-3xl sm:text-4xl font-semibold text-white tracking-tight">
              영상
            </h1>
          </div>

          {isOwner && (
            <button
              onClick={openAddModal}
              className="mt-4 sm:mt-0 inline-flex items-center gap-1.5 px-4 py-2 bg-[#1D3FBB] text-white text-xs font-medium tracking-wide hover:bg-[#2F5BEA] transition-colors border border-white/20 shadow-md"
            >
              <Plus className="w-4 h-4" /> 영상 추가
            </button>
          )}
        </div>

        {loading ? (
          <div className="py-24 text-center text-sm text-[#DCE9FF]/60 font-light">
            불러오는 중...
          </div>
        ) : videos.length === 0 ? (
          <div className="py-24 text-center border border-dashed border-white/20 p-8 bg-white/[0.02]">
            <VideoIcon className="w-8 h-8 mx-auto text-[#DCE9FF]/40 mb-3" />
            <p className="text-sm text-[#DCE9FF]/70">등록된 영상이 없습니다.</p>
          </div>
        ) : (
          <div className="space-y-10">
            {/* ============================================================ */}
            {/* 1. MAIN LARGE PLAYER (16:9, Thin White Border, YouTube Embed) */}
            {/* ============================================================ */}
            {selectedVideo && (
              <section ref={mainPlayerRef} className="scroll-mt-6 space-y-4">
                <div className="relative aspect-video w-full bg-black/90 overflow-hidden border border-white/40 shadow-2xl">
                  <iframe
                    key={selectedVideo.youtubeId}
                    src={`https://www.youtube-nocookie.com/embed/${selectedVideo.youtubeId}?autoplay=0&rel=0&modestbranding=1`}
                    title={selectedVideo.title}
                    allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full border-0"
                  />
                </div>

                {/* Main Player Title & Description */}
                <div className="p-4 sm:p-5 bg-white/[0.04] backdrop-blur-xs border border-white/15">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex-1">
                      <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-snug">
                        {selectedVideo.title}
                      </h2>
                      <p className="mt-2 text-xs sm:text-sm text-[#DCE9FF]/80 leading-relaxed font-light whitespace-pre-wrap">
                        {selectedVideo.description || '등록된 설명이 없습니다.'}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0 self-start">
                      <a
                        href={selectedVideo.youtubeUrl || `https://youtu.be/${selectedVideo.youtubeId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#6FA8FF] hover:text-white bg-white/[0.06] hover:bg-white/[0.12] border border-white/20 transition-colors"
                      >
                        YouTube에서 보기 <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* ============================================================ */}
            {/* 2. VIDEO LIST (Vertical Stack of Bars)                        */}
            {/* ============================================================ */}
            <section className="space-y-3">
              <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#6FA8FF]">
                  영상 목록 ({videos.length})
                </span>
                <span className="text-[11px] text-[#DCE9FF]/50 font-mono">
                  클릭하여 플레이어 전환
                </span>
              </div>

              <div className="space-y-2.5">
                {videos.map((vid) => {
                  const isCurrent = selectedVideo?.id === vid.id;

                  return (
                    <div
                      key={vid.id}
                      onClick={() => handleSelectVideo(vid)}
                      className={`group flex items-center justify-between gap-3 sm:gap-4 p-2.5 sm:p-3 transition-all duration-200 cursor-pointer border ${
                        isCurrent
                          ? 'bg-[#1D3FBB]/35 border-[#1D3FBB] shadow-lg ring-1 ring-[#2F5BEA]'
                          : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.08] hover:border-white/25'
                      }`}
                    >
                      {/* Left: 16:9 Small Thumbnail */}
                      <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                        <div className="relative w-24 sm:w-36 aspect-video bg-[#0B1F4B] flex-shrink-0 overflow-hidden border border-white/20">
                          <VideoThumbnail youtubeId={vid.youtubeId} title={vid.title} />
                          {isCurrent && (
                            <div className="absolute inset-0 bg-[#1D3FBB]/40 flex items-center justify-center">
                              <Play className="w-5 h-5 text-white fill-white" />
                            </div>
                          )}
                        </div>

                        {/* Right: Video Title (Mobile max 2 lines truncate) */}
                        <div className="min-w-0 flex-1">
                          <h3
                            className={`text-xs sm:text-sm font-medium line-clamp-2 leading-snug ${
                              isCurrent ? 'text-white font-semibold' : 'text-[#DCE9FF]/90 group-hover:text-white'
                            }`}
                          >
                            {vid.title}
                          </h3>
                          {vid.description && (
                            <p className="mt-1 text-[11px] text-[#DCE9FF]/55 line-clamp-1 hidden sm:block font-light">
                              {vid.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Right: Owner Controls (Edit & Delete) */}
                      {isOwner && (
                        <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0 pr-1">
                          <button
                            type="button"
                            onClick={(e) => openEditModal(vid, e)}
                            className="p-1.5 text-[#DCE9FF]/60 hover:text-white hover:bg-white/10 rounded-xs transition-colors"
                            title="수정"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDelete(vid.id, e)}
                            className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-xs transition-colors"
                            title="삭제"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingVideo ? '영상 수정' : '새 영상 등록'}
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-[#0B1F4B]">
          <div>
            <label className="block text-xs font-semibold tracking-wider uppercase text-[#0B1F4B]/70 mb-1">
              영상 제목 *
            </label>
            <input
              type="text"
              required
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder="예: 빗소리와 온실의 테마곡"
              className="w-full px-3 py-2 text-sm bg-white border border-[rgba(11,31,75,0.18)] focus:border-[#1D3FBB] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold tracking-wider uppercase text-[#0B1F4B]/70 mb-1">
              영상 설명
            </label>
            <textarea
              rows={3}
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="영상에 대한 상세한 설명을 입력하세요"
              className="w-full px-3 py-2 text-sm bg-white border border-[rgba(11,31,75,0.18)] focus:border-[#1D3FBB] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold tracking-wider uppercase text-[#0B1F4B]/70 mb-1">
              유튜브 링크 또는 ID *
            </label>
            <input
              type="text"
              required
              value={formYoutubeUrl}
              onChange={(e) => setFormYoutubeUrl(e.target.value)}
              placeholder="예: https://www.youtube.com/watch?v=... 또는 https://youtu.be/..."
              className="w-full px-3 py-2 text-sm bg-white border border-[rgba(11,31,75,0.18)] focus:border-[#1D3FBB] focus:outline-none"
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
              {submitting ? '저장 중...' : editingVideo ? '수정 완료' : '등록하기'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
