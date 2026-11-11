import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, doc, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { StoryItem } from '../types';
import { INITIAL_STORIES } from '../data/seedData';
import { Modal } from '../components/Modal';
import { useRouter } from '../router';
import { Plus, BookOpen, Bookmark } from 'lucide-react';

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

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formColor, setFormColor] = useState(BLUE_PALETTE[0].hex);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'stories'),
      (snapshot) => {
        if (!snapshot.empty) {
          const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as StoryItem));
          list.sort((a, b) => (a.order || 0) - (b.order || 0));
          setStories(list);
        } else {
          setStories(INITIAL_STORIES);
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
    setFormTitle('');
    setFormContent('');
    setFormColor(BLUE_PALETTE[stories.length % BLUE_PALETTE.length].hex);
    setIsModalOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const now = new Date().toISOString();
      const newId = `story-${Date.now()}`;
      const ref = doc(db, 'stories', newId);

      const newStory: StoryItem = {
        id: newId,
        title: formTitle.trim(),
        content: formContent.trim(),
        spineColor: formColor,
        order: stories.length + 1,
        createdAt: now,
      };

      await setDoc(ref, newStory, { merge: true });
      setIsModalOpen(false);
      navigate(`/stories/${newId}`);
    } catch (err) {
      alert('스토리 등록 중 오류가 발생했습니다: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setSubmitting(false);
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
      <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-[rgba(11,31,75,0.12)] pb-6 mb-12">
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
            className="mt-4 sm:mt-0 inline-flex items-center gap-1.5 px-4 py-2 bg-[#0B1F4B] text-white text-xs font-medium tracking-wide hover:bg-[#1D3FBB] transition-colors"
          >
            <Plus className="w-4 h-4" /> 책 추가
          </button>
        )}
      </div>

      {loading ? (
        <div className="py-20 text-center text-sm text-[#0B1F4B]/50 font-light">
          서고를 불러오는 중...
        </div>
      ) : stories.length === 0 ? (
        <div className="py-24 text-center border border-dashed border-[rgba(11,31,75,0.15)] p-8">
          <BookOpen className="w-8 h-8 mx-auto text-[#0B1F4B]/40 mb-3" />
          <p className="text-sm text-[#0B1F4B]/60">서고에 꽂힌 책이 없습니다.</p>
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
                    // Slightly varying heights for editorial realism
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
                  {/* Top edge highlight */}
                  <div className="h-[3px] bg-gradient-to-r from-[#1D3FBB] via-[#6FA8FF] to-[#1D3FBB] opacity-60" />
                  {/* Main solid blue shelf plank */}
                  <div className="h-4 sm:h-5 bg-[#0B1F4B] shadow-inner flex items-center px-4">
                    <div className="w-full h-[1px] bg-white/10" />
                  </div>
                  {/* Shelf underside shadow */}
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
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
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
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder="예: 제7관측소의 마지막 밤"
              className="w-full px-3 py-2 text-sm bg-white border border-[rgba(11,31,75,0.18)] focus:border-[#1D3FBB] focus:outline-none"
            />
          </div>

          {/* Blue Tone Selector */}
          <div>
            <label className="block text-xs font-semibold tracking-wider uppercase text-[#0B1F4B]/70 mb-2">
              책등 색상 (에디토리얼 블루 팔레트)
            </label>
            <div className="flex flex-wrap gap-2.5">
              {BLUE_PALETTE.map((pal) => (
                <button
                  key={pal.hex}
                  type="button"
                  onClick={() => setFormColor(pal.hex)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs border transition-all ${
                    formColor === pal.hex
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
              본문 (단편 소설 / 비하인드 기록) *
            </label>
            <textarea
              rows={12}
              required
              value={formContent}
              onChange={(e) => setFormContent(e.target.value)}
              placeholder="본문 내용을 입력하세요. 줄바꿈과 문단 구분이 자연스럽게 반영됩니다."
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
              {submitting ? '등록 중...' : '서고에 꽂기'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
