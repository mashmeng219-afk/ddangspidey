import React, { useEffect, useState } from 'react';
import { doc, onSnapshot, setDoc, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { StoryItem } from '../types';
import { INITIAL_STORIES } from '../data/seedData';
import { Modal } from '../components/Modal';
import { useRouter } from '../router';
import { ArrowLeft, Edit2, Trash2 } from 'lucide-react';

interface StoryDetailPageProps {
  storyId: string;
}

const BLUE_PALETTE = [
  { name: 'Ink Navy', hex: '#0B1F4B' },
  { name: 'Royal Blue', hex: '#1D3FBB' },
  { name: 'Cobalt', hex: '#2F5BEA' },
  { name: 'Slate Indigo', hex: '#1A365D' },
  { name: 'Deep Azure', hex: '#0F2C59' },
  { name: 'Sky Frost', hex: '#41729F' },
  { name: 'Midnight Blue', hex: '#001E3D' },
];

export const StoryDetailPage: React.FC<StoryDetailPageProps> = ({ storyId }) => {
  const { isOwner } = useAuth();
  const { navigate } = useRouter();

  const [story, setStory] = useState<StoryItem | null>(null);
  const [loading, setLoading] = useState(true);

  // Edit modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formColor, setFormColor] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, 'stories', storyId),
      (snap) => {
        if (snap.exists()) {
          setStory({ id: snap.id, ...snap.data() } as StoryItem);
        } else {
          const found = INITIAL_STORIES.find((s) => s.id === storyId);
          setStory(found || null);
        }
        setLoading(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, `stories/${storyId}`);
      }
    );

    return () => unsub();
  }, [storyId]);

  const openEditModal = () => {
    if (!story) return;
    setFormTitle(story.title);
    setFormContent(story.content);
    setFormColor(story.spineColor || '#0B1F4B');
    setIsEditModalOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!story) return;

    try {
      setSubmitting(true);
      const ref = doc(db, 'stories', story.id);
      await setDoc(
        ref,
        {
          id: story.id,
          title: formTitle.trim(),
          content: formContent.trim(),
          spineColor: formColor,
          order: story.order || 1,
          createdAt: story.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
      setIsEditModalOpen(false);
    } catch (err) {
      alert('수정 중 오류가 발생했습니다: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!story) return;
    if (!confirm(`'${story.title}' 책을 서고에서 삭제하시겠습니까?`)) return;

    try {
      await deleteDoc(doc(db, 'stories', story.id));
      navigate('/stories');
    } catch (err) {
      alert('삭제 중 오류가 발생했습니다: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center text-sm text-[#0B1F4B]/50 font-light">
        책을 펼치는 중...
      </div>
    );
  }

  if (!story) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <p className="text-sm text-[#0B1F4B]/60 mb-4">해당 스토리를 찾을 수 없습니다.</p>
        <button
          onClick={() => navigate('/stories')}
          className="text-xs text-[#1D3FBB] underline"
        >
          서고로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <article className="max-w-2xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
      {/* Top back navigation */}
      <div className="flex items-center justify-between border-b border-[rgba(11,31,75,0.1)] pb-4 mb-10">
        <button
          onClick={() => navigate('/stories')}
          className="inline-flex items-center gap-1.5 text-xs text-[#0B1F4B]/60 hover:text-[#0B1F4B] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>서고 목록</span>
        </button>

        {isOwner && (
          <div className="flex items-center gap-2">
            <button
              onClick={openEditModal}
              className="inline-flex items-center gap-1 px-3 py-1 bg-[#0B1F4B] text-white text-xs hover:bg-[#1D3FBB] transition-colors"
            >
              <Edit2 className="w-3 h-3" /> 수정
            </button>
            <button
              onClick={handleDelete}
              className="inline-flex items-center gap-1 px-3 py-1 text-red-600 border border-red-200 hover:bg-red-50 text-xs transition-colors"
            >
              <Trash2 className="w-3 h-3" /> 삭제
            </button>
          </div>
        )}
      </div>

      {/* Stationery Paper Sheet (편지지 느낌, 가로 접힘선, 크림 종이 질감) */}
      <div className="paper-sheet p-6 sm:p-12 md:p-14 relative shadow-[0_4px_24px_rgba(11,31,75,0.08)] paper-fold-line mb-10">
        {/* Story Reading Room Header */}
        <header className="mb-10 text-center">
          <div
            className="w-12 h-1 mx-auto mb-5"
            style={{ backgroundColor: story.spineColor || '#1D3FBB' }}
          />
          <span className="font-editorial text-xs tracking-widest text-[#2F5BEA] uppercase block mb-2">
            Behind Story
          </span>
          <h1 className="text-2xl sm:text-3xl font-semibold text-[#0B1F4B] tracking-tight leading-snug">
            {story.title}
          </h1>
          {story.createdAt && (
            <time className="block text-xs text-[#0B1F4B]/40 font-mono mt-3">
              {new Date(story.createdAt).toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </time>
          )}
        </header>

        {/* Paper Fold Crease Line */}
        <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-[rgba(11,31,75,0.12)] to-transparent my-8" />

        {/* Story Content */}
        <div className="prose prose-navy max-w-none">
          <div className="text-sm sm:text-base text-[#0B1F4B]/90 font-light leading-loose whitespace-pre-wrap tracking-wide space-y-6">
            {story.content}
          </div>
        </div>
      </div>

      {/* Footer Back Button */}
      <footer className="mt-16 pt-8 border-t border-[rgba(11,31,75,0.12)] flex justify-center">
        <button
          onClick={() => navigate('/stories')}
          className="inline-flex items-center gap-1.5 px-6 py-2.5 border border-[rgba(11,31,75,0.2)] hover:border-[#1D3FBB] text-xs font-medium tracking-wide text-[#0B1F4B] hover:text-[#1D3FBB] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> 서고로 돌아가기
        </button>
      </footer>

      {/* Edit Story Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="스토리 수정"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold tracking-wider uppercase text-[#0B1F4B]/70 mb-1">
              책 제목 *
            </label>
            <input
              type="text"
              required
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-[rgba(11,31,75,0.18)] focus:border-[#1D3FBB] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold tracking-wider uppercase text-[#0B1F4B]/70 mb-2">
              책등 색상
            </label>
            <div className="flex flex-wrap gap-2">
              {BLUE_PALETTE.map((pal) => (
                <button
                  key={pal.hex}
                  type="button"
                  onClick={() => setFormColor(pal.hex)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 text-xs border ${
                    formColor === pal.hex
                      ? 'border-[#0B1F4B] ring-2 ring-[#2F5BEA]'
                      : 'border-[rgba(11,31,75,0.15)] hover:border-[#2F5BEA]'
                  }`}
                >
                  <span
                    className="w-3 h-3"
                    style={{ backgroundColor: pal.hex }}
                  />
                  <span>{pal.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold tracking-wider uppercase text-[#0B1F4B]/70 mb-1">
              본문 *
            </label>
            <textarea
              rows={14}
              required
              value={formContent}
              onChange={(e) => setFormContent(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-[rgba(11,31,75,0.18)] focus:border-[#1D3FBB] focus:outline-none leading-relaxed"
            />
          </div>

          <div className="pt-4 flex justify-end gap-2 border-t border-[rgba(11,31,75,0.1)]">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-[#0B1F4B]/70 hover:text-[#0B1F4B]"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-[#0B1F4B] text-white text-xs font-medium tracking-wide hover:bg-[#1D3FBB] disabled:opacity-50"
            >
              {submitting ? '저장 중...' : '수정 완료'}
            </button>
          </div>
        </form>
      </Modal>
    </article>
  );
};
