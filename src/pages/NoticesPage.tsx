import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { NoticeItem } from '../types';
import { INITIAL_NOTICES } from '../data/seedData';
import { Modal } from '../components/Modal';
import { useRouter } from '../router';
import { Plus, Bell, ChevronRight, Calendar } from 'lucide-react';

export const NoticesPage: React.FC = () => {
  const { isOwner } = useAuth();
  const { navigate } = useRouter();
  const [notices, setNotices] = useState<NoticeItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formDate, setFormDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'notices'),
      (snapshot) => {
        if (!snapshot.empty) {
          const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as NoticeItem));
          list.sort((a, b) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime());
          setNotices(list);
        } else {
          setNotices(INITIAL_NOTICES);
        }
        setLoading(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'notices');
      }
    );

    return () => unsubscribe();
  }, []);

  const openAddModal = () => {
    setFormTitle('');
    setFormContent('');
    setFormDate(new Date().toISOString().split('T')[0]);
    setIsModalOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const newId = `notice-${Date.now()}`;
      const now = new Date().toISOString();
      const newNotice: NoticeItem = {
        id: newId,
        title: formTitle.trim(),
        content: formContent.trim(),
        date: formDate,
        createdAt: now,
      };

      await setDoc(doc(db, 'notices', newId), newNotice);
      setIsModalOpen(false);
      navigate(`/notices/${newId}`);
    } catch (err) {
      alert('공지 등록 중 오류가 발생했습니다: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
      {/* Editorial Page Header: Location name only */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-[rgba(11,31,75,0.12)] pb-6 mb-8">
        <div>
          <span className="font-editorial text-sm tracking-widest text-[#2F5BEA] uppercase block mb-1">
            Archive Notice
          </span>
          <h1 className="text-3xl sm:text-4xl font-semibold text-[#0B1F4B] tracking-tight">
            공지사항
          </h1>
        </div>

        {isOwner && (
          <button
            onClick={openAddModal}
            className="mt-4 sm:mt-0 inline-flex items-center gap-1.5 px-4 py-2 bg-[#0B1F4B] text-white text-xs font-medium tracking-wide hover:bg-[#1D3FBB] transition-colors"
          >
            <Plus className="w-4 h-4" /> 공지 작성
          </button>
        )}
      </div>

      {loading ? (
        <div className="py-20 text-center text-sm text-[#0B1F4B]/50 font-light">
          불러오는 중...
        </div>
      ) : notices.length === 0 ? (
        <div className="py-24 text-center border border-dashed border-[rgba(11,31,75,0.15)] p-8">
          <Bell className="w-8 h-8 mx-auto text-[#0B1F4B]/40 mb-3" />
          <p className="text-sm text-[#0B1F4B]/60">등록된 공지사항이 없습니다.</p>
        </div>
      ) : (
        <div className="divide-y divide-[rgba(11,31,75,0.08)] paper-sheet">
          {notices.map((n) => (
            <div
              key={n.id}
              onClick={() => navigate(`/notices/${n.id}`)}
              className="group cursor-pointer p-4 sm:p-5 flex items-center justify-between hover:bg-[#F4F6FB] transition-colors"
            >
              <div className="min-w-0 pr-4">
                <div className="flex items-center gap-2 text-[11px] text-[#0B1F4B]/50 font-mono mb-1">
                  <Calendar className="w-3 h-3" />
                  <span>{n.date || (n.createdAt ? n.createdAt.slice(0, 10) : '')}</span>
                </div>
                <h2 className="text-sm sm:text-base font-semibold text-[#0B1F4B] group-hover:text-[#1D3FBB] transition-colors truncate">
                  {n.title}
                </h2>
                <p className="text-xs text-[#0B1F4B]/60 line-clamp-1 mt-1 font-light">
                  {n.content}
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-[#0B1F4B]/30 group-hover:text-[#1D3FBB] group-hover:translate-x-0.5 transition-all flex-shrink-0" />
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="새 공지사항 작성"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold tracking-wider uppercase text-[#0B1F4B]/70 mb-1">
              제목 *
            </label>
            <input
              type="text"
              required
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder="공지 제목을 입력하세요"
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
              rows={10}
              required
              value={formContent}
              onChange={(e) => setFormContent(e.target.value)}
              placeholder="공지사항 본문을 입력하세요"
              className="w-full px-3 py-2 text-sm bg-white border border-[rgba(11,31,75,0.18)] focus:border-[#1D3FBB] focus:outline-none leading-relaxed"
            />
          </div>

          <div className="pt-4 flex justify-end gap-2 border-t border-[rgba(11,31,75,0.1)]">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-[#0B1F4B]/70 hover:text-[#0B1F4B]"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-[#0B1F4B] text-white text-xs font-medium tracking-wide hover:bg-[#1D3FBB] disabled:opacity-50"
            >
              {submitting ? '등록 중...' : '공지 게시'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
