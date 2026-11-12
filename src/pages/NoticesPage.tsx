import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, formatKoreanError } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { NoticeItem } from '../types';
import { deleteAttachedStorageFiles } from '../utils/storageCleanup';
import { Modal } from '../components/Modal';
import { useRouter } from '../router';
import { Plus, Bell, ChevronRight, Calendar, Edit2, Trash2, AlertCircle } from 'lucide-react';

export const NoticesPage: React.FC = () => {
  const { isOwner } = useAuth();
  const { navigate } = useRouter();
  const [notices, setNotices] = useState<NoticeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Add Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addTitle, setAddTitle] = useState('');
  const [addContent, setAddContent] = useState('');
  const [addDate, setAddDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [submittingAdd, setSubmittingAdd] = useState(false);

  // Edit Modal
  const [editingNotice, setEditingNotice] = useState<NoticeItem | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editDate, setEditDate] = useState('');
  const [submittingEdit, setSubmittingEdit] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'notices'),
      (snapshot) => {
        if (!snapshot.empty) {
          const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as NoticeItem));
          list.sort((a, b) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime());
          setNotices(list);
        } else {
          // Zero dummy/seed data fallback!
          setNotices([]);
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
    setErrorMsg(null);
    setAddTitle('');
    setAddContent('');
    setAddDate(new Date().toISOString().split('T')[0]);
    setIsAddModalOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmittingAdd(true);
      setErrorMsg(null);
      const newId = `notice-${Date.now()}`;
      const now = new Date().toISOString();
      const newNotice: NoticeItem = {
        id: newId,
        title: addTitle.trim(),
        content: addContent.trim(),
        date: addDate,
        createdAt: now,
      };

      await setDoc(doc(db, 'notices', newId), newNotice, { merge: true });
      setIsAddModalOpen(false);
      navigate(`/notices/${newId}`);
    } catch (err) {
      setErrorMsg(formatKoreanError(err));
    } finally {
      setSubmittingAdd(false);
    }
  };

  const openEditModal = (notice: NoticeItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setErrorMsg(null);
    setEditingNotice(notice);
    setEditTitle(notice.title);
    setEditContent(notice.content);
    setEditDate(notice.date || new Date().toISOString().split('T')[0]);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNotice) return;

    try {
      setSubmittingEdit(true);
      setErrorMsg(null);
      await setDoc(
        doc(db, 'notices', editingNotice.id),
        {
          id: editingNotice.id,
          title: editTitle.trim(),
          content: editContent.trim(),
          date: editDate,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
      setEditingNotice(null);
    } catch (err) {
      setErrorMsg(formatKoreanError(err));
    } finally {
      setSubmittingEdit(false);
    }
  };

  // Delete Notice
  const handleDelete = async (notice: NoticeItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!confirm('삭제할까요?')) return;

    try {
      setErrorMsg(null);
      // Clean up Storage files if attached
      await deleteAttachedStorageFiles(notice);
      // Delete document
      await deleteDoc(doc(db, 'notices', notice.id));
    } catch (err) {
      console.error('Delete notice failed:', err);
      setErrorMsg(formatKoreanError(err));
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
            className="mt-4 sm:mt-0 inline-flex items-center gap-1.5 px-4 py-2 bg-[#0B1F4B] text-white text-xs font-medium tracking-wide hover:bg-[#1D3FBB] transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" /> 공지 작성
          </button>
        )}
      </div>

      {/* Error alert banner */}
      {errorMsg && (
        <div className="mb-6 p-3 bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2 rounded-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div className="flex-1 leading-relaxed">{errorMsg}</div>
          <button
            onClick={() => setErrorMsg(null)}
            className="text-red-500 hover:text-red-700 font-bold ml-2 text-sm"
          >
            ×
          </button>
        </div>
      )}

      {loading ? (
        <div className="py-20 text-center text-sm text-[#0B1F4B]/50 font-light">
          불러오는 중...
        </div>
      ) : notices.length === 0 ? (
        <div className="py-24 text-center border border-dashed border-[rgba(11,31,75,0.15)] p-8 bg-[#FAF8F5]/60">
          <Bell className="w-8 h-8 mx-auto text-[#0B1F4B]/40 mb-3" />
          <p className="text-sm text-[#0B1F4B]/70 font-medium">등록된 공지사항이 없습니다.</p>
          {isOwner && (
            <button
              onClick={openAddModal}
              className="mt-3 text-xs text-[#1D3FBB] hover:underline"
            >
              새 공지사항을 작성해보세요
            </button>
          )}
        </div>
      ) : (
        <div className="divide-y divide-[rgba(11,31,75,0.08)] paper-sheet">
          {notices.map((n) => (
            <div
              key={n.id}
              onClick={() => navigate(`/notices/${n.id}`)}
              className="group cursor-pointer p-4 sm:p-5 flex items-center justify-between hover:bg-[#F4F6FB] transition-colors"
            >
              <div className="min-w-0 pr-4 flex-1">
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

              {/* Right: Owner Controls & Chevron */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {isOwner && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity mr-1"
                  >
                    <button
                      type="button"
                      onClick={(e) => openEditModal(n, e)}
                      className="p-1.5 text-[#0B1F4B]/60 hover:text-[#1D3FBB] hover:bg-[#DCE9FF]/50 rounded-xs transition-colors"
                      title="수정"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDelete(n, e)}
                      className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xs transition-colors"
                      title="삭제"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
                <ChevronRight className="w-4 h-4 text-[#0B1F4B]/30 group-hover:text-[#1D3FBB] group-hover:translate-x-0.5 transition-all" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
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
              value={addTitle}
              onChange={(e) => setAddTitle(e.target.value)}
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
              value={addDate}
              onChange={(e) => setAddDate(e.target.value)}
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
              value={addContent}
              onChange={(e) => setAddContent(e.target.value)}
              placeholder="공지사항 본문을 입력하세요"
              className="w-full px-3 py-2 text-sm bg-white border border-[rgba(11,31,75,0.18)] focus:border-[#1D3FBB] focus:outline-none leading-relaxed"
            />
          </div>

          <div className="pt-4 flex justify-end gap-2 border-t border-[rgba(11,31,75,0.1)]">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-[#0B1F4B]/70 hover:text-[#0B1F4B]"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={submittingAdd}
              className="px-5 py-2 bg-[#0B1F4B] text-white text-xs font-medium tracking-wide hover:bg-[#1D3FBB] disabled:opacity-50"
            >
              {submittingAdd ? '등록 중...' : '공지 게시'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={Boolean(editingNotice)}
        onClose={() => setEditingNotice(null)}
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
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-[rgba(11,31,75,0.18)] focus:border-[#1D3FBB] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold tracking-wider uppercase text-[#0B1F4B]/70 mb-1">
              작성 날짜
            </label>
            <input
              type="date"
              value={editDate}
              onChange={(e) => setEditDate(e.target.value)}
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
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-[rgba(11,31,75,0.18)] focus:border-[#1D3FBB] focus:outline-none leading-relaxed"
            />
          </div>

          <div className="pt-4 flex justify-end gap-2 border-t border-[rgba(11,31,75,0.1)]">
            <button
              type="button"
              onClick={() => setEditingNotice(null)}
              className="px-4 py-2 text-xs font-medium text-[#0B1F4B]/70 hover:text-[#0B1F4B]"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={submittingEdit}
              className="px-5 py-2 bg-[#0B1F4B] text-white text-xs font-medium tracking-wide hover:bg-[#1D3FBB] disabled:opacity-50"
            >
              {submittingEdit ? '저장 중...' : '수정 완료'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
