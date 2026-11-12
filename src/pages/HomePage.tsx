import React, { useEffect, useState, useRef, useCallback } from 'react';
import { collection, onSnapshot, doc, setDoc, query, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../context/AuthContext';
import {
  HomeCardItem,
  NoticeItem,
  SingleTalkDoc,
} from '../types';
import {
  INITIAL_HOME_CARDS,
  INITIAL_VIDEOS,
  INITIAL_SONGS,
  INITIAL_CHARACTERS,
} from '../data/seedData';
import { Modal } from '../components/Modal';
import { StorageUploader } from '../components/StorageUploader';
import { useRouter } from '../router';
import { TornPaperDivider } from '../components/TornPaper';
import { MoonPhaseStrip } from '../components/MoonMotifs';
import { HeroSection } from '../components/HeroSection';
import {
  ArrowRight,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Edit2,
  Bell,
  MessageSquareDashed,
  Calendar,
  X,
  Maximize2,
} from 'lucide-react';

const DEFAULT_SINGLE_TALK: SingleTalkDoc = {
  text: `작업실에서 기록하는 생각들과 제작 비하인드 조각들입니다.

세라의 테마곡을 구상할 때 가장 집중했던 것은 비 오는 날 버려진 온실 안에서 울려 퍼지는 건반의 잔향이었습니다. 완벽하게 정제된 디지털 사운드보다, 낡은 업라이트 피아노 현이 빗소리와 섞여 빚어내는 불협화음이야말로 그 밤의 온도를 가장 진실하게 담아낸다고 믿거든요.

다음 프로젝트에서는 이안의 관측소에서 채집한 심해 주파수와 첼로의 피치카토를 결합한 새로운 음향 실험을 준비 중입니다. 조만간 스케치 노트와 함께 들려드릴 수 있기를 바랍니다.`,
  images: [
    'https://images.unsplash.com/photo-1520523839898-507127053c37?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=800&auto=format&fit=crop',
  ],
  updatedAt: '2026-03-09',
};

export const HomePage: React.FC = () => {
  const { isOwner } = useAuth();
  const { navigate } = useRouter();

  // Single Talk Document state
  const [singleTalk, setSingleTalk] = useState<SingleTalkDoc>(DEFAULT_SINGLE_TALK);
  const [isEditTalkModalOpen, setIsEditTalkModalOpen] = useState(false);
  const [editTalkText, setEditTalkText] = useState('');
  const [editTalkImages, setEditTalkImages] = useState<string[]>([]);
  const [newTalkImageUrl, setNewTalkImageUrl] = useState('');
  const [submittingTalk, setSubmittingTalk] = useState(false);
  const [talkLightboxImage, setTalkLightboxImage] = useState<string | null>(null);

  // Existing lower section data: Slider cards, notices, counts
  const [cards, setCards] = useState<HomeCardItem[]>(INITIAL_HOME_CARDS);
  const [notices, setNotices] = useState<NoticeItem[]>([]);
  const [counts, setCounts] = useState({
    videos: INITIAL_VIDEOS.length,
    songs: INITIAL_SONGS.length,
    characters: INITIAL_CHARACTERS.length,
    stories: 0,
    questions: 0,
  });

  // Slider state
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  // Edit Card Modal (Existing Slider)
  const [editingCard, setEditingCard] = useState<HomeCardItem | null>(null);
  const [cardTitle, setCardTitle] = useState('');
  const [cardSubtitle, setCardSubtitle] = useState('');
  const [cardImage, setCardImage] = useState('');
  const [cardText, setCardText] = useState('');
  const [cardLink, setCardLink] = useState('');
  const [submittingCard, setSubmittingCard] = useState(false);

  // Smooth scroll to hash on mount if present
  useEffect(() => {
    if (window.location.hash === '#talk-section') {
      setTimeout(() => {
        document.getElementById('talk-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 300);
    }
  }, []);

  // Firestore listeners
  useEffect(() => {
    // 1. Single Talk Document (doc 'main')
    const unsubSingleTalk = onSnapshot(
      doc(db, 'talks', 'main'),
      (snap) => {
        if (snap.exists()) {
          setSingleTalk(snap.data() as SingleTalkDoc);
        } else {
          setSingleTalk(DEFAULT_SINGLE_TALK);
        }
      },
      () => setSingleTalk(DEFAULT_SINGLE_TALK)
    );

    // 2. Home Slider Cards
    const unsubCards = onSnapshot(
      collection(db, 'homeCards'),
      (snap) => {
        if (!snap.empty) {
          const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as HomeCardItem));
          const sorted = ['intro', 'notice', 'news'].map((type) => {
            const found = list.find((c) => c.type === type);
            return found || INITIAL_HOME_CARDS.find((c) => c.type === type)!;
          });
          setCards(sorted);
        } else {
          setCards(INITIAL_HOME_CARDS);
        }
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'homeCards')
    );

    // 3. Notices
    const unsubNotices = onSnapshot(
      collection(db, 'notices'),
      (snap) => {
        if (!snap.empty) {
          const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as NoticeItem));
          list.sort((a, b) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime());
          setNotices(list);
        } else {
          setNotices([]);
        }
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'notices')
    );

    // 4. Counts
    const unsubVids = onSnapshot(
      collection(db, 'videos'),
      (s) => setCounts((prev) => ({ ...prev, videos: s.empty ? INITIAL_VIDEOS.length : s.size })),
      (err) => console.warn('Count listener videos fallback:', err)
    );
    const unsubSongs = onSnapshot(
      collection(db, 'songs'),
      (s) => setCounts((prev) => ({ ...prev, songs: s.empty ? INITIAL_SONGS.length : s.size })),
      (err) => console.warn('Count listener songs fallback:', err)
    );
    const unsubChars = onSnapshot(
      collection(db, 'characters'),
      (s) => setCounts((prev) => ({ ...prev, characters: s.empty ? INITIAL_CHARACTERS.length : s.size })),
      (err) => console.warn('Count listener characters fallback:', err)
    );
    const unsubStories = onSnapshot(
      collection(db, 'stories'),
      (s) => setCounts((prev) => ({ ...prev, stories: s.size })),
      (err) => console.warn('Count listener stories fallback:', err)
    );
    const qQuestions = isOwner
      ? collection(db, 'questions')
      : query(collection(db, 'questions'), where('answered', '==', true));
    const unsubQuestions = onSnapshot(
      qQuestions,
      (s) => setCounts((prev) => ({ ...prev, questions: s.size })),
      (err) => console.warn('Count listener questions fallback:', err)
    );

    return () => {
      unsubSingleTalk();
      unsubCards();
      unsubNotices();
      unsubVids();
      unsubSongs();
      unsubChars();
      unsubStories();
      unsubQuestions();
    };
  }, []);

  // Automatic sliding timer (every 5 seconds)
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % cards.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [isPaused, cards.length]);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % cards.length);
  }, [cards.length]);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + cards.length) % cards.length);
  }, [cards.length]);

  // Touch Swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsPaused(true);
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    setIsPaused(false);
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 50;
    if (distance > minSwipeDistance) {
      nextSlide();
    } else if (distance < -minSwipeDistance) {
      prevSlide();
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  // Slider Card Editing
  const openEditCardModal = (card: HomeCardItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCard(card);
    setCardTitle(card.title || '');
    setCardSubtitle(card.subtitle || '');
    setCardImage(card.image || '');
    setCardText(card.text || '');
    setCardLink(card.link || '');
  };

  const handleSaveCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCard) return;

    try {
      setSubmittingCard(true);
      const cardRef = doc(db, 'homeCards', editingCard.id);
      await setDoc(
        cardRef,
        {
          id: editingCard.id,
          type: editingCard.type,
          title: cardTitle.trim(),
          subtitle: cardSubtitle.trim(),
          image: cardImage.trim(),
          text: cardText.trim(),
          link: cardLink.trim(),
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
      setEditingCard(null);
    } catch (err) {
      alert('카드 수정 실패: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setSubmittingCard(false);
    }
  };

  // Single Talk Editing
  const openEditTalkModal = () => {
    setEditTalkText(singleTalk.text || '');
    setEditTalkImages([...(singleTalk.images || [])]);
    setNewTalkImageUrl('');
    setIsEditTalkModalOpen(true);
  };

  const handleSaveTalk = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmittingTalk(true);
      const finalImages = [...editTalkImages];
      if (newTalkImageUrl.trim() && !finalImages.includes(newTalkImageUrl.trim())) {
        finalImages.push(newTalkImageUrl.trim());
      }

      const talkRef = doc(db, 'talks', 'main');
      const updated: SingleTalkDoc = {
        text: editTalkText.trim(),
        images: finalImages,
        updatedAt: new Date().toISOString().split('T')[0],
      };

      await setDoc(talkRef, updated, { merge: true });
      setIsEditTalkModalOpen(false);
    } catch (err) {
      alert('구상&잡담 저장 실패: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setSubmittingTalk(false);
    }
  };


  // Latest notice for Card 2
  const latestNotice = notices[0];

  // 5 Category definitions for lower section
  const categoryBlocks = [
    {
      num: '01',
      title: '영상',
      count: counts.videos,
      href: '/videos',
      bgClass: 'bg-[#0B1F4B] text-white hover:bg-[#071534]',
      numClass: 'text-[#6FA8FF]',
      borderClass: 'border-[rgba(255,255,255,0.1)]',
    },
    {
      num: '02',
      title: '노래',
      count: counts.songs,
      href: '/songs',
      bgClass: 'bg-[#1D3FBB] text-white hover:bg-[#152e8d]',
      numClass: 'text-[#DCE9FF]',
      borderClass: 'border-[rgba(255,255,255,0.12)]',
    },
    {
      num: '03',
      title: '캐릭터',
      count: counts.characters,
      href: '/characters',
      bgClass: 'bg-[#2F5BEA] text-white hover:bg-[#1e44c2]',
      numClass: 'text-white',
      borderClass: 'border-[rgba(255,255,255,0.15)]',
    },
    {
      num: '04',
      title: '비하인드 스토리',
      count: counts.stories,
      href: '/stories',
      bgClass: 'bg-[#6FA8FF] text-[#0B1F4B] hover:bg-[#5895f5]',
      numClass: 'text-[#0B1F4B]',
      borderClass: 'border-[rgba(11,31,75,0.12)]',
    },
    {
      num: '05',
      title: '익명 질문함',
      count: counts.questions,
      href: '/questions',
      bgClass: 'bg-[#DCE9FF] text-[#0B1F4B] hover:bg-[#c6dcff]',
      numClass: 'text-[#1D3FBB]',
      borderClass: 'border-[rgba(11,31,75,0.1)]',
    },
  ];

  return (
    <div className="w-full">
      {/* ============================================================ */}
      {/* NEW HERO SECTION: 100vh White Paper, Centered Note & Bubbles */}
      {/* ============================================================ */}
      <HeroSection
        latestNotice={latestNotice}
        singleTalk={singleTalk}
        onNavigateNotice={(noticeId) => navigate(`/notices/${noticeId}`)}
        onScrollToTalk={() => {
          document.getElementById('talk-section')?.scrollIntoView({ behavior: 'smooth' });
        }}
        onScrollToArchive={() => {
          document.getElementById('archive-content')?.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      {/* ============================================================ */}
      {/* EXISTING HOME CONTENT (Placed below Hero)                    */}
      {/* ============================================================ */}
      <div id="archive-content" className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-16 space-y-12 sm:space-y-16">
        {/* UPPER AREA: Desktop 8 col (Slider) + 4 col (Category Blocks) */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left 8-Columns: Auto-Sliding Card Container */}
          <div
            className="lg:col-span-8 relative bg-white border border-[rgba(11,31,75,0.12)] overflow-hidden shadow-sm flex flex-col justify-between"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Card Slides */}
            <div className="relative min-h-[380px] sm:min-h-[440px] flex-1 overflow-hidden">
              {cards.map((card, idx) => {
                const isActive = idx === currentSlide;

                // Override Card 2 with latest notice if available
                const displayTitle =
                  card.type === 'notice' && latestNotice ? latestNotice.title : card.title;
                const displayText =
                  card.type === 'notice' && latestNotice
                    ? latestNotice.content.slice(0, 120) + (latestNotice.content.length > 120 ? '...' : '')
                    : card.text;
                const displayLink =
                  card.type === 'notice' && latestNotice ? `/notices/${latestNotice.id}` : card.link;

                return (
                  <div
                    key={card.id || idx}
                    className={`absolute inset-0 transition-opacity duration-700 ease-in-out flex flex-col justify-between ${
                      isActive ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'
                    }`}
                  >
                    {/* Card Background Image with Gradient Overlay */}
                    <div className="absolute inset-0">
                      <img
                        src={card.image}
                        alt={displayTitle}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0B1F4B]/95 via-[#0B1F4B]/55 to-black/20" />
                    </div>

                    {/* Top Bar on Card: Badge & Owner Edit */}
                    <div className="relative z-20 p-5 sm:p-7 flex items-center justify-between">
                      <span className="font-editorial text-xs tracking-widest uppercase px-3 py-1 bg-white/15 backdrop-blur-md text-white border border-white/20">
                        {card.type === 'intro'
                          ? '01 / Introduction'
                          : card.type === 'notice'
                          ? '02 / Notice'
                          : '03 / Release News'}
                      </span>

                      {isOwner && (
                        <button
                          onClick={(e) => openEditCardModal(card, e)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs bg-white/80 hover:bg-white text-[#0B1F4B] font-medium backdrop-blur-md transition-colors"
                        >
                          <Edit2 className="w-3 h-3" /> 카드 수정
                        </button>
                      )}
                    </div>

                    {/* Bottom Content Area */}
                    <div
                      onClick={() => displayLink && navigate(displayLink)}
                      className="relative z-20 p-5 sm:p-8 cursor-pointer group"
                    >
                      {card.subtitle && (
                        <span className="text-xs text-[#6FA8FF] tracking-wider uppercase font-medium mb-1 block">
                          {card.subtitle}
                        </span>
                      )}

                      <h2
                        className={`font-semibold text-white tracking-tight leading-snug group-hover:text-[#6FA8FF] transition-colors ${
                          card.type === 'intro' ? 'text-2xl sm:text-4xl' : 'text-xl sm:text-3xl'
                        }`}
                      >
                        {displayTitle}
                      </h2>

                      <p className="mt-2.5 sm:mt-3 text-xs sm:text-sm text-white/85 font-light leading-relaxed max-w-xl line-clamp-3">
                        {displayText}
                      </p>

                      <div className="mt-4 inline-flex items-center gap-1.5 text-xs text-[#6FA8FF] group-hover:text-white font-medium transition-colors">
                        <span>바로가기</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Slider Navigation Bar: Indicator Dots + Arrow Controls */}
            <div className="relative z-20 px-5 sm:px-8 py-3 bg-[#0B1F4B] border-t border-white/10 flex items-center justify-between">
              {/* 3 Dot Indicators */}
              <div className="flex items-center gap-2">
                {cards.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentSlide(idx)}
                    className={`transition-all duration-300 rounded-full ${
                      currentSlide === idx
                        ? 'w-6 h-2 bg-[#6FA8FF]'
                        : 'w-2 h-2 bg-white/40 hover:bg-white/70'
                    }`}
                    aria-label={`슬라이드 ${idx + 1}로 이동`}
                  />
                ))}
              </div>

              {/* Left/Right Prev/Next Arrows */}
              <div className="flex items-center gap-1">
                <button
                  onClick={prevSlide}
                  className="p-1.5 text-white/60 hover:text-white transition-colors"
                  aria-label="이전 슬라이드"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={nextSlide}
                  className="p-1.5 text-white/60 hover:text-white transition-colors"
                  aria-label="다음 슬라이드"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Right 4-Columns: 5 Category Blocks */}
          <div className="lg:col-span-4 flex flex-col justify-between grid grid-cols-2 lg:grid-cols-1 gap-2.5 sm:gap-3">
            {categoryBlocks.map((block) => (
              <div
                key={block.num}
                onClick={() => navigate(block.href)}
                className={`group cursor-pointer p-4 sm:p-4.5 transition-all duration-300 flex items-center justify-between border ${block.borderClass} ${block.bgClass} shadow-xs hover:shadow-md`}
              >
                <div className="flex items-baseline gap-2.5 sm:gap-3 min-w-0">
                  <span className={`font-editorial text-lg sm:text-xl font-light ${block.numClass}`}>
                    {block.num}
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-sm sm:text-base font-semibold tracking-tight truncate">
                      {block.title}
                    </h3>
                    <span className="text-[11px] opacity-70 font-mono">
                      {block.count} items
                    </span>
                  </div>
                </div>

                <div className="opacity-60 group-hover:opacity-100 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-300 pl-2">
                  <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Moon Phase Section Ornament */}
        <div className="flex items-center justify-center py-2 select-none" aria-hidden="true">
          <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-[rgba(11,31,75,0.12)] to-transparent" />
          <MoonPhaseStrip className="px-6 text-[#1D3FBB] opacity-75" size={15} />
          <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-[rgba(11,31,75,0.12)] to-transparent" />
        </div>

        {/* LOWER AREA: Desktop 2-Column Side-by-Side (Notices + Single Talk Space) */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-10 pt-2">
          {/* Left Column: 공지사항 (Notices) */}
          <div id="notices-section" className="flex flex-col justify-between scroll-mt-24">
            <div>
              <div className="flex items-baseline justify-between pb-3 border-b border-[rgba(11,31,75,0.15)] mb-4">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-[#1D3FBB]" />
                  <h2 className="text-lg font-semibold text-[#0B1F4B] tracking-tight">
                    공지사항
                  </h2>
                </div>
                <button
                  onClick={() => navigate('/notices')}
                  className="text-xs text-[#1D3FBB] hover:underline font-medium"
                >
                  전체 보기 →
                </button>
              </div>

              {notices.length === 0 ? (
                <p className="py-8 text-center text-xs text-[#0B1F4B]/50 font-light">
                  등록된 공지사항이 없습니다.
                </p>
              ) : (
                <ul className="divide-y divide-[rgba(11,31,75,0.08)] bg-white border border-[rgba(11,31,75,0.1)]">
                  {notices.slice(0, 5).map((n) => (
                    <li
                      key={n.id}
                      onClick={() => navigate(`/notices/${n.id}`)}
                      className="group cursor-pointer p-3 sm:p-3.5 hover:bg-[#F4F6FB] transition-colors flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0">
                        <span className="text-[#0B1F4B]/40 font-mono text-[11px] block mb-0.5">
                          {n.date || (n.createdAt ? n.createdAt.slice(0, 10) : '')}
                        </span>
                        <p className="font-medium text-[#0B1F4B] group-hover:text-[#1D3FBB] transition-colors truncate">
                          {n.title}
                        </p>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-[#0B1F4B]/30 group-hover:text-[#1D3FBB] group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Right Column: 구상&잡담 (Simplified Single Dedicated Note Space) */}
          <div id="talk-section" className="flex flex-col justify-between scroll-mt-24">
            <div>
              <div className="flex items-baseline justify-between pb-3 border-b border-[rgba(11,31,75,0.15)] mb-4">
                <div className="flex items-center gap-2">
                  <MessageSquareDashed className="w-4 h-4 text-[#2F5BEA]" />
                  <h2 className="text-lg font-semibold text-[#0B1F4B] tracking-tight">
                    구상&잡담
                  </h2>
                </div>

                {/* Owner Edit Button */}
                {isOwner && (
                  <button
                    onClick={openEditTalkModal}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs bg-[#0B1F4B] text-white hover:bg-[#1D3FBB] transition-colors"
                  >
                    <Edit2 className="w-3 h-3" /> 수정
                  </button>
                )}
              </div>

              {/* Dedicated Single Talk Content Box */}
              <div className="bg-white border border-[rgba(11,31,75,0.12)] p-5 sm:p-6 shadow-xs space-y-4">
                {singleTalk.updatedAt && (
                  <div className="flex items-center gap-1.5 text-[11px] text-[#0B1F4B]/45 font-mono">
                    <Calendar className="w-3 h-3" />
                    <span>마지막 기록: {singleTalk.updatedAt}</span>
                  </div>
                )}

                {/* Attached Images */}
                {singleTalk.images && singleTalk.images.length > 0 && (
                  <div
                    className={`grid gap-3 ${
                      singleTalk.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'
                    }`}
                  >
                    {singleTalk.images.map((img, idx) => (
                      <div
                        key={idx}
                        onClick={() => setTalkLightboxImage(img)}
                        className="group relative aspect-[4/3] bg-gray-50 border border-[rgba(11,31,75,0.08)] overflow-hidden cursor-pointer"
                      >
                        <img
                          src={img}
                          alt=""
                          className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-[#0B1F4B]/0 group-hover:bg-[#0B1F4B]/20 flex items-center justify-center transition-colors">
                          <Maximize2 className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Body Text */}
                <p className="text-xs sm:text-sm text-[#0B1F4B]/85 font-light leading-relaxed whitespace-pre-wrap">
                  {singleTalk.text}
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Lightbox Modal for Single Talk Images */}
      {talkLightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-[#0B1F4B]/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setTalkLightboxImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <button
              onClick={() => setTalkLightboxImage(null)}
              className="absolute -top-10 right-0 text-white/80 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={talkLightboxImage}
              alt=""
              className="max-w-full max-h-[85vh] object-contain shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      {/* Edit Single Talk Modal (Owner Only) */}
      <Modal
        isOpen={isEditTalkModalOpen}
        onClose={() => setIsEditTalkModalOpen(false)}
        title="구상&잡담 글 수정"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSaveTalk} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold tracking-wider uppercase text-[#0B1F4B]/70 mb-1">
              본문 내용 *
            </label>
            <textarea
              rows={9}
              required
              value={editTalkText}
              onChange={(e) => setEditTalkText(e.target.value)}
              placeholder="작업실 비하인드, 구상 중인 프로젝트, 생각들을 자유롭게 적어보세요"
              className="w-full px-3 py-2 text-sm bg-white border border-[rgba(11,31,75,0.18)] focus:border-[#1D3FBB] focus:outline-none leading-relaxed"
            />
          </div>

          {/* Attached Images */}
          <div className="border-t border-[rgba(11,31,75,0.1)] pt-3">
            <label className="block text-xs font-semibold tracking-wider uppercase text-[#0B1F4B]/70 mb-2">
              첨부 이미지 목록 ({editTalkImages.length})
            </label>
            {editTalkImages.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {editTalkImages.map((img, idx) => (
                  <div key={idx} className="relative w-16 h-16 border bg-gray-50 overflow-hidden">
                    <img src={img} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setEditTalkImages(editTalkImages.filter((_, i) => i !== idx))}
                      className="absolute top-0 right-0 bg-red-600 text-white p-0.5"
                      title="삭제"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-2">
              <StorageUploader
                label="새 이미지 추가 (Storage 업로드 또는 URL)"
                value={newTalkImageUrl}
                onChange={setNewTalkImageUrl}
                accept="image/*"
                folder="talks"
              />
              {newTalkImageUrl && (
                <button
                  type="button"
                  onClick={() => {
                    setEditTalkImages([...editTalkImages, newTalkImageUrl.trim()]);
                    setNewTalkImageUrl('');
                  }}
                  className="px-3 py-1 bg-[#1D3FBB] text-white text-xs"
                >
                  목록에 추가
                </button>
              )}
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-2 border-t border-[rgba(11,31,75,0.1)]">
            <button
              type="button"
              onClick={() => setIsEditTalkModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-[#0B1F4B]/70 hover:text-[#0B1F4B]"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={submittingTalk}
              className="px-5 py-2 bg-[#0B1F4B] text-white text-xs font-medium tracking-wide hover:bg-[#1D3FBB] disabled:opacity-50"
            >
              {submittingTalk ? '저장 중...' : '저장 완료'}
            </button>
          </div>
        </form>
      </Modal>


      {/* Edit Existing Slider Card Modal (Owner Only) */}
      <Modal
        isOpen={Boolean(editingCard)}
        onClose={() => setEditingCard(null)}
        title="홈 슬라이드 카드 수정"
        maxWidth="max-w-xl"
      >
        {editingCard && (
          <form onSubmit={handleSaveCard} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold tracking-wider uppercase text-[#0B1F4B]/70 mb-1">
                카드 제목 *
              </label>
              <input
                type="text"
                required
                value={cardTitle}
                onChange={(e) => setCardTitle(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-[rgba(11,31,75,0.18)] focus:border-[#1D3FBB] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold tracking-wider uppercase text-[#0B1F4B]/70 mb-1">
                서브타이틀 (상단 라벨)
              </label>
              <input
                type="text"
                value={cardSubtitle}
                onChange={(e) => setCardSubtitle(e.target.value)}
                placeholder="예: New Release, 작가 소개 등"
                className="w-full px-3 py-2 text-sm bg-white border border-[rgba(11,31,75,0.18)] focus:border-[#1D3FBB] focus:outline-none"
              />
            </div>

            <StorageUploader
              label="카드 배경 이미지 *"
              value={cardImage}
              onChange={setCardImage}
              accept="image/*"
              folder="home-cards"
            />

            <div>
              <label className="block text-xs font-semibold tracking-wider uppercase text-[#0B1F4B]/70 mb-1">
                짧은 소개글 (2~3줄) *
              </label>
              <textarea
                rows={3}
                required
                value={cardText}
                onChange={(e) => setCardText(e.target.value)}
                placeholder="카드에 표시될 2~3줄의 간결한 소개 문구를 입력하세요"
                className="w-full px-3 py-2 text-sm bg-white border border-[rgba(11,31,75,0.18)] focus:border-[#1D3FBB] focus:outline-none leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold tracking-wider uppercase text-[#0B1F4B]/70 mb-1">
                연결 링크 (경로 또는 URL)
              </label>
              <input
                type="text"
                value={cardLink}
                onChange={(e) => setCardLink(e.target.value)}
                placeholder="예: /characters 또는 /notices/notice-01"
                className="w-full px-3 py-2 text-sm bg-white border border-[rgba(11,31,75,0.18)] focus:border-[#1D3FBB] focus:outline-none"
              />
            </div>

            <div className="pt-4 flex justify-end gap-2 border-t border-[rgba(11,31,75,0.1)]">
              <button
                type="button"
                onClick={() => setEditingCard(null)}
                className="px-4 py-2 text-xs font-medium text-[#0B1F4B]/70 hover:text-[#0B1F4B]"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={submittingCard}
                className="px-5 py-2 bg-[#0B1F4B] text-white text-xs font-medium tracking-wide hover:bg-[#1D3FBB] disabled:opacity-50"
              >
                {submittingCard ? '저장 중...' : '변경사항 저장'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
