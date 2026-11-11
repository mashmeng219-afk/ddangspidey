import React, { useEffect, useState } from 'react';
import { doc, onSnapshot, setDoc, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { NoticeItem } from '../types';
import { INITIAL_NOTICES } from '../data/seedData';
import { Modal } from '../components/Modal';
import { useRouter } from '../router';
import { ArrowLeft, Edit2, Trash2, Calendar } from 'lucide-react';

interface NoticeDetailPageProps {
  noticeId: string;
}

export const NoticeDetailPage: React.FC<NoticeDetailPageProps> = ({ noticeId }) => {
  const { isOwner } = useAuth();
  const { navigate } = useRouter();

  const [notice, setNotice] = useState<NoticeItem | null>(null);
  const [loading, setLoading] = useState(true);

  // Edit modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formDate, setFormDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, 'notices', noticeId),
      (snap) => {
        if (snap.exists()) {
          setNotice({ id: snap.id, ...snap.data() } as NoticeItem);
        } else {
          const found = INITIAL_NOTICES.find((n) => n.id === noticeId);
          setNotice(found || null);
        }
        setLoading(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, `notices/${noticeId}`);
      }
    );

    return () => unsub();
  }, [noticeId]);

  const openEditModal = () => {
    if (!notice) return;
    setFormTitle(notice.title);
    setFormContent(notice.content);
    setFormDate(notice.date || '');
    setIsEditModalOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notice) return;

    try {
      setSubmitting(true);
      await setDoc(
        doc(db, 'notices', notice.id),
        {
          id: notice.id,
          title: formTitle.trim(),
          content: formContent.trim(),
          date: formDate,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
      setIsEditModalOpen(false);
    } catch (err) {
      alert('공지 수정 중 오류가 발생했습니다: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!notice) return;
    if (!confirm(`'${notice.title}' 공지를 삭제하시겠습니까?`)) return;

    try {
      await deleteDoc(doc(db, 'notices', notice.id));
      navigate('/notices');
    } catch (err) {
      alert('삭제 중 오류가 발생했습니다: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center text-sm text-[#0B1F4B]/50 font-light">
        불러오는 중...
      </div>
    );
  }

  if (!notice) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <p className="text-sm text-[#0B1F4B]/60 mb-4">해당 공지사항을 찾을 수 없습니다.</p>
        <button
          onClick={() => navigate('/notices')}
          className="text-xs text-[#1D3FBB] underline"
        >
          공지사항 목록으로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <article className="max-w-2xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
      {/* Top back navigation */}
      <div className="flex items-center justify-between border-b border-[rgba(11,31,75,0.1)] pb-4 mb-8">
        <button
          onClick={() => navigate('/notices')}
          className="inline-flex items-center gap-1.5 text-xs text-[#0B1F4B]/60 hover:text-[#0B1F4B] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>공지사항 목록</span>
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

      {/* Notice Content Paper Sheet */}
      <div className="paper-sheet p-6 sm:p-10 relative paper-fold-line shadow-sm mb-8">
        <header className="mb-8 pb-6 border-b border-[rgba(11,31,75,0.08)]">
          <div className="flex items-center gap-2 text-xs text-[#2F5BEA] font-mono mb-2">
            <Calendar className="w-3.5 h-3.5" />
            <span>{notice.date || (notice.createdAt ? notice.createdAt.slice(0, 10) : '')}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-[#0B1F4B] tracking-tight leading-snug">
            {notice.title}
          </h1>
        </header>

        {/* Content */}
        <div className="text-sm sm:text-base text-[#0B1F4B]/85 font-light leading-relaxed whitespace-pre-wrap">
          {notice.content}
        </div>
      </div>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="공지사항 수정"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold tracking-wider uppercase text-[#0B1F4B]/70 mb-1">
              제목 *
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
            <label className="block text-xs font-semibold tracking-wider uppercase text-[#0B1F4B]/70 mb-1">
              작성 날짜
            </label>
            <input
              type="date"
              value={formDate}
              onChange={(e) => setFormDate(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-[rgba(11,31,75,0.18)] focus:border-[#1D3FBB] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold tracking-wider uppercase text-[#0B1F4B]/70 mb-1">
              내용 *
            </label>
            <textarea
              rows={12}
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
