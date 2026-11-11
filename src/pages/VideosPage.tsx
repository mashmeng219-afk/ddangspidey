import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { VideoItem } from '../types';
import { INITIAL_VIDEOS } from '../data/seedData';
import { Modal } from '../components/Modal';
import { RadiantNightMoon, MoonPhaseStrip } from '../components/MoonMotifs';
import { Plus, Edit2, Trash2, Video as VideoIcon, ExternalLink } from 'lucide-react';

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

export const VideosPage: React.FC = () => {
  const { isOwner } = useAuth();
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);

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
        if (!snapshot.empty) {
          const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as VideoItem));
          list.sort((a, b) => (a.order || 0) - (b.order || 0));
          setVideos(list);
        } else {
          setVideos(INITIAL_VIDEOS);
        }
        setLoading(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'videos');
      }
    );

    return () => unsubscribe();
  }, []);

  const openAddModal = () => {
    setEditingVideo(null);
    setFormTitle('');
    setFormDescription('');
    setFormYoutubeUrl('');
    setIsModalOpen(true);
  };

  const openEditModal = (video: VideoItem) => {
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
        await updateDoc(ref, {
          title: formTitle.trim(),
          description: formDescription.trim(),
          youtubeUrl: formYoutubeUrl.trim(),
          youtubeId: ytId,
          updatedAt: now,
        });
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
        };
        await setDoc(ref, newVideo);
      }
      setIsModalOpen(false);
    } catch (err) {
      alert('저장 중 오류가 발생했습니다: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('이 영상을 삭제하시겠습니까?')) return;
    try {
      await deleteDoc(doc(db, 'videos', id));
    } catch (err) {
      alert('삭제 중 오류가 발생했습니다: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] bg-gradient-to-b from-[#060D20] via-[#0B1F4B] to-[#040816] text-[#DCE9FF] overflow-hidden select-none">
      {/* Night Sky Background Stars & Vertical Glow Ray with Radiant Moon */}
      <div className="relative pt-12 pb-8 flex flex-col items-center justify-center">
        <RadiantNightMoon size={110} />
        <div className="mt-4">
          <MoonPhaseStrip size={14} className="text-[#DCE9FF]/70" />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-20">
        {/* Editorial Page Header: Location name only */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-white/15 pb-6 mb-10">
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
              className="mt-4 sm:mt-0 inline-flex items-center gap-1.5 px-4 py-2 bg-[#1D3FBB] text-white text-xs font-medium tracking-wide hover:bg-[#2F5BEA] transition-colors border border-white/20"
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
          <div className="py-24 text-center border border-dashed border-white/20 p-8 rounded-none bg-white/[0.02]">
            <VideoIcon className="w-8 h-8 mx-auto text-[#DCE9FF]/40 mb-3" />
            <p className="text-sm text-[#DCE9FF]/70">등록된 영상이 없습니다.</p>
          </div>
        ) : (
          /* Card Grid: Small player with thin white border + Title + 1-line description */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {videos.map((vid) => (
              <article
                key={vid.id}
                className="group flex flex-col bg-white/[0.05] backdrop-blur-sm border border-white/20 hover:border-white/70 p-4 transition-all duration-300 shadow-xl"
              >
                {/* Embed player with thin crisp white border */}
                <div className="relative aspect-video w-full bg-black/60 overflow-hidden mb-3.5 border border-white/40 group-hover:border-white/80 transition-colors">
                  <iframe
                    loading="lazy"
                    src={`https://www.youtube-nocookie.com/embed/${vid.youtubeId}?autoplay=0&rel=0&modestbranding=1`}
                    title={vid.title}
                    allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full border-0"
                  />
                </div>

                {/* Title & 1-line Description */}
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <h2 className="text-base font-semibold text-white leading-snug line-clamp-1 mb-1">
                      {vid.title}
                    </h2>
                    <p className="text-xs text-[#DCE9FF]/75 line-clamp-1 leading-relaxed font-light">
                      {vid.description || '등록된 설명이 없습니다.'}
                    </p>
                  </div>

                  {/* Owner controls & youtube link */}
                  <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                    <a
                      href={vid.youtubeUrl || `https://youtu.be/${vid.youtubeId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-[#6FA8FF] hover:text-white transition-colors"
                    >
                      YouTube에서 보기 <ExternalLink className="w-3 h-3" />
                    </a>

                    {isOwner && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditModal(vid)}
                          className="text-[#DCE9FF]/70 hover:text-white p-1 transition-colors"
                          title="수정"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(vid.id)}
                          className="text-red-400/80 hover:text-red-300 p-1 transition-colors"
                          title="삭제"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </article>
            ))}
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
              한 줄 설명
            </label>
            <input
              type="text"
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="예: 비 오는 날 온실에서 녹음한 작업 영상"
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
