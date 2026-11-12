import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, formatKoreanError } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { StoryItem } from '../types';
import { deleteAttachedStorageFiles } from '../utils/storageCleanup';
import { Modal } from '../components/Modal';
import { useRouter } from '../router';
import { Plus, BookOpen, Bookmark, Edit2, Trash2, AlertCircle } from 'lucide-react';

const BLUE_PALETTE = [
  { name: 'Ink Navy', hex: '#0B1F4B' },
  { name: 'Royal Blue', hex: '#1D3FBB' },
  { name: 'Cobalt', hex: '#2F5BEA' },
  { name: 'Slate Indigo', hex: '#1A365D' },
  { name: 'Deep Azure', hex: '#0F2C59' },
  { name: 'Sky Frost', hex: '#41729F' },
  { name: 'Midnight Blue', hex: '#001E3D' },
];

export const StoriesPage: React.FC = () => {
  const { isOwner } = useAuth();
  const { navigate } = useRouter();
  const [stories, setStories] = useState<StoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Add Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addTitle, setAddTitle] = useState('');
  const [addContent, setAddContent] = useState('');
  const [addColor, setAddColor] = useState(BLUE_PALETTE[0].hex);
  const [submittingAdd, setSubmittingAdd] = useState(false);

  // Edit Modal
  const [editingStory, setEditingStory] = useState<StoryItem | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editColor, setEditColor] = useState('');
  const [submittingEdit, setSubmittingEdit] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'stories'),
      (snapshot) => {
        if (!snapshot.empty) {
          const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as StoryItem));
          list.sort((a, b) => (a.order || 0) - (b.order || 0));
          setStories(list);
        } else {
          // Zero dummy/seed data fallback!
          setStories([]);
        }
        setLoading(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'stories');
      }
    );

    return () => unsubscribe();
  }, []);

  const openAddModal = () => {
    setErrorMsg(null);
    setAddTitle('');
    setAddContent('');
    setAddColor(BLUE_PALETTE[stories.length % BLUE_PALETTE.length].hex);
    setIsAddModalOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmittingAdd(true);
      setErrorMsg(null);
      const now = new Date().toISOString();
      const newId = `story-${Date.now()}`;
      const ref = doc(db, 'stories', newId);

      const newStory: StoryItem = {
        id: newId,
        title: addTitle.trim(),
        content: addContent.trim(),
        spineColor: addColor,
        order: stories.length + 1,
        createdAt: now,
      };

      await setDoc(ref, newStory, { merge: true });
      setIsAddModalOpen(false);
      navigate(`/stories/${newId}`);
    } catch (err) {
      setErrorMsg(formatKoreanError(err));
    } finally {
      setSubmittingAdd(false);
    }
  };

  const openEditModal = (story: StoryItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setErrorMsg(null);
    setEditingStory(story);
    setEditTitle(story.title);
    setEditContent(story.content);
    setEditColor(story.spineColor || BLUE_PALETTE[0].hex);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStory) return;

    try {
      setSubmittingEdit(true);
      setErrorMsg(null);
      const ref = doc(db, 'stories', editingStory.id);
      await setDoc(
        ref,
        {
          id: editingStory.id,
          title: editTitle.trim(),
          content: editContent.trim(),
          spineColor: editColor,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
      setEditingStory(null);
    } catch (err) {
      setErrorMsg(formatKoreanError(err));
    } finally {
      setSubmittingEdit(false);
    }
  };

  // Delete Story (Shelf card)
  const handleDelete = async (story: StoryItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!confirm('삭제할까요?')) return;

    try {
      setErrorMsg(null);
      // Clean up Storage files if attached (images, cover, etc.)
      await deleteAttachedStorageFiles(story);
      // Delete Firestore document
      await deleteDoc(doc(db, 'stories', story.id));
    } catch (err) {
      console.error('Delete story failed:', err);
      setErrorMsg(formatKoreanError(err));
    }
  };

  // Group stories into shelves (e.g. 5-7 books per shelf row)
  const booksPerShelf = 6;
  const shelves: StoryItem[][] = [];
  for (let i = 0; i < stories.length; i += booksPerShelf) {
    shelves.push(stories.slice(i, i + booksPerShelf));
  }
  if (shelves.length === 0) shelves.push([]);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
      {/* Editorial Page Header: Location name only */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-[rgba(11,31,75,0.12)] pb-6 mb-8">
        <div>
          <span className="font-editorial text-sm tracking-widest text-[#2F5BEA] uppercase block mb-1">
            04 / Archive
          </span>
          <h1 className="text-3xl sm:text-4xl font-semibold text-[#0B1F4B] tracking-tight">
            비하인드 스토리
          </h1>
        </div>

        {isOwner && (
          <button
            onClick={openAddModal}
            className="mt-4 sm:mt-0 inline-flex items-center gap-1.5 px-4 py-2 bg-[#0B1F4B] text-white text-xs font-medium tracking-wide hover:bg-[#1D3FBB] transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" /> 책 추가
          </button>
        )}
      </div>

      {/* Error Banner */}
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
          서고를 불러오는 중...
        </div>
      ) : stories.length === 0 ? (
        <div className="py-24 text-center border border-dashed border-[rgba(11,31,75,0.15)] p-8 bg-[#FAF8F5]/60">
          <BookOpen className="w-8 h-8 mx-auto text-[#0B1F4B]/40 mb-3" />
          <p className="text-sm text-[#0B1F4B]/70 font-medium">서고에 꽂힌 책이 없습니다.</p>
          {isOwner && (
            <button
              onClick={openAddModal}
              className="mt-3 text-xs text-[#1D3FBB] hover:underline"
            >
              첫 번째 책을 서고에 꽂아보세요
            </button>
          )}
        </div>
      ) : (
        /* Editorial Blue Bookshelf Container */
        <div className="bg-[#0B1F4B]/[0.02] border border-[rgba(11,31,75,0.14)] p-6 sm:p-12 shadow-sm rounded-none">
          <div className="space-y-16">
            {shelves.map((shelfBooks, shelfIdx) => (
              <div key={shelfIdx} className="relative">
                {/* Book Spines Standing on the Shelf */}
                <div className="flex items-end justify-start gap-3 sm:gap-6 min-h-[260px] sm:min-h-[300px] px-2 sm:px-6 pb-0 overflow-x-auto no-scrollbar">
                  {shelfBooks.map((book, bookIdx) => {
                    const color = book.spineColor || BLUE_PALETTE[bookIdx % BLUE_PALETTE.length].hex;
                    const heightClass =
                      bookIdx % 3 === 0
                        ? 'h-[230px] sm:h-[265px]'
                        : bookIdx % 2 === 0
                        ? 'h-[210px] sm:h-[245px]'
                        : 'h-[220px] sm:h-[255px]';
                    const widthClass =
                      bookIdx % 2 === 0
                        ? 'w-10 sm:w-14'
                        : 'w-11 sm:w-16';

                    return (
                      <div
                        key={book.id}
                        onClick={() => navigate(`/stories/${book.id}`)}
                        className={`group relative cursor-pointer flex-shrink-0 ${widthClass} ${heightClass} transition-all duration-300 ease-out hover:-translate-y-3 flex flex-col justify-between py-4 px-1.5 shadow-md hover:shadow-xl`}
                        style={{
                          backgroundColor: color,
                          boxShadow:
                            'inset 2px 0 3px rgba(255,255,255,0.15), inset -2px 0 3px rgba(0,0,0,0.3), 3px 6px 12px rgba(11,31,75,0.25)',
                        }}
                      >
                        {/* Owner Quick Controls (수정 / 삭제) on Hover */}
                        {isOwner && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="absolute -top-10 left-1/2 -translate-x-1/2 flex items-center gap-1 z-30 opacity-0 group-hover:opacity-100 transition-opacity bg-[#0B1F4B] p-1 shadow-lg border border-white/20"
                          >
                            <button
                              type="button"
                              onClick={(e) => openEditModal(book, e)}
                              className="p-1 text-white/80 hover:text-white transition-colors"
                              title="수정"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleDelete(book, e)}
                              className="p-1 text-red-400 hover:text-red-300 transition-colors"
                              title="삭제"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}

                        {/* Top Spine Ornament / Number */}
                        <div className="text-center">
                          <div className="w-full h-[1px] bg-white/20 mb-1" />
                          <span className="font-editorial text-[10px] text-white/60 tracking-widest block font-light">
                            {(shelfIdx * booksPerShelf + bookIdx + 1).toString().padStart(2, '0')}
                          </span>
                        </div>

                        {/* Spine Title: Vertical Text (writing-mode: vertical-rl) */}
                        <div className="flex-1 flex items-center justify-center my-2 overflow-hidden">
                          <span
                            className="writing-mode-vertical text-[11px] sm:text-xs text-white/95 font-medium tracking-wide line-clamp-1 select-none group-hover:text-white"
                            style={{ letterSpacing: '0.12em' }}
                          >
                            {book.title}
                          </span>
                        </div>

                        {/* Bottom Spine Bookmark Accent */}
                        <div className="text-center flex flex-col items-center">
                          <Bookmark className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#6FA8FF]/80 mb-1" />
                          <div className="w-full h-[1px] bg-white/20" />
                        </div>

                        {/* Hover Tooltip Preview */}
                        <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-[#0B1F4B] text-white text-[11px] py-1 px-2.5 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 shadow-lg">
                          {book.title} 읽기
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Editorial Blue Bookshelf Plank */}
                <div className="relative mt-0">
                  <div className="h-[3px] bg-gradient-to-r from-[#1D3FBB] via-[#6FA8FF] to-[#1D3FBB] opacity-60" />
                  <div className="h-4 sm:h-5 bg-[#0B1F4B] shadow-inner flex items-center px-4">
                    <div className="w-full h-[1px] bg-white/10" />
                  </div>
                  <div className="h-3 bg-gradient-to-b from-[rgba(11,31,75,0.18)] to-transparent" />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 pt-6 border-t border-[rgba(11,31,75,0.08)] text-center text-xs text-[#0B1F4B]/50 font-light">
            서고의 책등을 클릭하면 해당 비하인드 스토리를 읽으실 수 있습니다.
          </div>
        </div>
      )}

      {/* Add Story Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="새 책 등록 (비하인드 스토리)"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold tracking-wider uppercase text-[#0B1F4B]/70 mb-1">
              책 제목 *
            </label>
            <input
              type="text"
              required
              value={addTitle}
              onChange={(e) => setAddTitle(e.target.value)}
              placeholder="예: 제7관측소의 마지막 밤"
              className="w-full px-3 py-2 text-sm bg-white border border-[rgba(11,31,75,0.18)] focus:border-[#1D3FBB] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold tracking-wider uppercase text-[#0B1F4B]/70 mb-2">
              책등 색상
            </label>
            <div className="flex flex-wrap gap-2.5">
              {BLUE_PALETTE.map((pal) => (
                <button
                  key={pal.hex}
                  type="button"
                  onClick={() => setAddColor(pal.hex)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs border transition-all ${
                    addColor === pal.hex
                      ? 'border-[#0B1F4B] ring-2 ring-[#2F5BEA]'
                      : 'border-[rgba(11,31,75,0.15)] hover:border-[#2F5BEA]'
                  }`}
                >
                  <span
                    className="w-3.5 h-3.5 rounded-none shadow-sm"
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
              rows={12}
              required
              value={addContent}
              onChange={(e) => setAddContent(e.target.value)}
              placeholder="본문 내용을 입력하세요. 줄바꿈과 문단 구분이 자연스럽게 반영됩니다."
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
              {submittingAdd ? '등록 중...' : '서고에 꽂기'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Story Modal */}
      <Modal
        isOpen={Boolean(editingStory)}
        onClose={() => setEditingStory(null)}
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
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
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
                  onClick={() => setEditColor(pal.hex)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 text-xs border ${
                    editColor === pal.hex
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
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-[rgba(11,31,75,0.18)] focus:border-[#1D3FBB] focus:outline-none leading-relaxed"
            />
          </div>

          <div className="pt-4 flex justify-end gap-2 border-t border-[rgba(11,31,75,0.1)]">
            <button
              type="button"
              onClick={() => setEditingStory(null)}
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
