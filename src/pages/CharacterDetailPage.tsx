import React, { useEffect, useState, useMemo } from 'react';
import {
  doc,
  onSnapshot,
  updateDoc,
  deleteDoc,
  collection,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../context/AuthContext';
import {
  CharacterItem,
  BasicInfoItem,
  AppearancePromptItem,
  CharacterRelationship,
  GalleryItem,
  RelatedWork,
  SongItem,
} from '../types';
import { INITIAL_CHARACTERS, INITIAL_SONGS } from '../data/seedData';
import { StorageUploader } from '../components/StorageUploader';
import { Modal } from '../components/Modal';
import { useRouter } from '../router';
import {
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Trash2,
  Copy,
  Check,
  Eye,
  EyeOff,
  ExternalLink,
  Music,
  Plus,
  X,
  Maximize2,
  Star,
  ArrowUpDown,
  Info,
} from 'lucide-react';

interface CharacterDetailPageProps {
  characterId: string;
}

// Preset relation colors within the blue editorial palette
const RELATION_COLORS: Record<string, string> = {
  친구: '#1D3FBB', // Royal
  동료: '#2F5BEA', // Cobalt
  조력자: '#41729F', // Slate Blue
  의뢰인: '#0B1F4B', // Ink Navy
  가족: '#1A365D', // Deep Indigo
  연인: '#2447BA', // Blue Accent
  라이벌: '#0F2C59', // Dark Azure
};

const DEFAULT_BASIC_INFO_PRESETS: { label: string; placeholder: string }[] = [
  { label: '나이', placeholder: '예: 24세' },
  { label: '성별', placeholder: '예: 남성 / 여성' },
  { label: '키', placeholder: '예: 178cm' },
  { label: '생일', placeholder: '예: 11월 12일' },
  { label: '종족', placeholder: '예: 인간' },
  { label: '직업', placeholder: '예: 기록원' },
  { label: '소속', placeholder: '예: 제7관측소' },
  { label: '성격 키워드', placeholder: '예: 침착함, 과묵함' },
];

export const CharacterDetailPage: React.FC<CharacterDetailPageProps> = ({ characterId }) => {
  const { isOwner } = useAuth();
  const { navigate } = useRouter();

  const [allCharacters, setAllCharacters] = useState<CharacterItem[]>([]);
  const [character, setCharacter] = useState<CharacterItem | null>(null);
  const [allSongs, setAllSongs] = useState<SongItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Active prompt tab index
  const [activePromptIndex, setActivePromptIndex] = useState(0);

  // Copy feedback state { [key]: boolean }
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Relationship description popup
  const [activeRelationPopup, setActiveRelationPopup] = useState<{
    targetName: string;
    relationName: string;
    description: string;
  } | null>(null);

  // Gallery Lightbox index
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // --------------------------------------------------------------------------
  // Modals for Owner Section-by-Section Editing
  // --------------------------------------------------------------------------
  const [activeModalSection, setActiveModalSection] = useState<
    'profile' | 'basicInfo' | 'intro' | 'prompts' | 'relationships' | 'gallery' | 'archives' | null
  >(null);

  // Form states for Section ① Profile
  const [formName, setFormName] = useState('');
  const [formTags, setFormTags] = useState('');
  const [formCoverUrl, setFormCoverUrl] = useState('');
  const [formMainImageUrl, setFormMainImageUrl] = useState('');

  // Form states for Section ② Basic Info
  const [formBasicInfo, setFormBasicInfo] = useState<BasicInfoItem[]>([]);

  // Form states for Section ③ Intro
  const [formIntro, setFormIntro] = useState('');

  // Form states for Section ④ Prompts
  const [formPrompts, setFormPrompts] = useState<AppearancePromptItem[]>([]);

  // Form states for Section ⑤ Relationships
  const [formRelationships, setFormRelationships] = useState<CharacterRelationship[]>([]);
  const [newRelTargetId, setNewRelTargetId] = useState('');
  const [newRelName, setNewRelName] = useState('친구');
  const [newRelDesc, setNewRelDesc] = useState('');

  // Form states for Section ⑥ Gallery
  const [formGallery, setFormGallery] = useState<GalleryItem[]>([]);
  const [newGalleryUrl, setNewGalleryUrl] = useState('');
  const [newGalleryCaption, setNewGalleryCaption] = useState('');

  // Form states for Section ⑦ Archives
  const [formWorks, setFormWorks] = useState<RelatedWork[]>([]);
  const [newWorkTitle, setNewWorkTitle] = useState('');
  const [newWorkLink, setNewWorkLink] = useState('');
  const [formSongIds, setFormSongIds] = useState<string[]>([]);

  const [submitting, setSubmitting] = useState(false);

  // Fetch all characters to support prev/next navigation & relationships
  useEffect(() => {
    const unsubChars = onSnapshot(
      collection(db, 'characters'),
      (snapshot) => {
        if (!snapshot.empty) {
          const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as CharacterItem));
          list.sort((a, b) => (a.order || 0) - (b.order || 0));
          setAllCharacters(list);
          const current = list.find((c) => c.id === characterId) || null;
          setCharacter(current);
        } else {
          setAllCharacters(INITIAL_CHARACTERS);
          const current = INITIAL_CHARACTERS.find((c) => c.id === characterId) || null;
          setCharacter(current);
        }
        setLoading(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'characters');
      }
    );

    const unsubSongs = onSnapshot(
      collection(db, 'songs'),
      (snapshot) => {
        if (!snapshot.empty) {
          setAllSongs(snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as SongItem)));
        } else {
          setAllSongs(INITIAL_SONGS);
        }
      },
      () => setAllSongs(INITIAL_SONGS)
    );

    return () => {
      unsubChars();
      unsubSongs();
    };
  }, [characterId]);

  // Keyboard navigation for Lightbox (ESC, Left, Right)
  useEffect(() => {
    if (lightboxIndex === null) return;
    const gallery = character?.gallery || [];

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLightboxIndex(null);
      } else if (e.key === 'ArrowLeft') {
        setLightboxIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : gallery.length - 1));
      } else if (e.key === 'ArrowRight') {
        setLightboxIndex((prev) => (prev !== null && prev < gallery.length - 1 ? prev + 1 : 0));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex, character]);

  // Compute Previous and Next characters
  const { prevChar, nextChar } = useMemo(() => {
    if (!character || allCharacters.length <= 1) {
      return { prevChar: null, nextChar: null };
    }
    const currentIndex = allCharacters.findIndex((c) => c.id === character.id);
    if (currentIndex === -1) return { prevChar: null, nextChar: null };

    const prev = currentIndex > 0 ? allCharacters[currentIndex - 1] : allCharacters[allCharacters.length - 1];
    const next = currentIndex < allCharacters.length - 1 ? allCharacters[currentIndex + 1] : allCharacters[0];
    return { prevChar: prev, nextChar: next };
  }, [character, allCharacters]);

  // Copy helper
  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey(null);
    }, 2000);
  };

  // --------------------------------------------------------------------------
  // Section Edit Openers
  // --------------------------------------------------------------------------
  const openProfileModal = () => {
    if (!character) return;
    setFormName(character.name);
    setFormTags(character.keywordTags?.join(', ') || '');
    setFormCoverUrl(character.coverUrl);
    setFormMainImageUrl(character.mainImageUrl || character.coverUrl);
    setActiveModalSection('profile');
  };

  const openBasicInfoModal = () => {
    if (!character) return;
    if (character.basicInfo && character.basicInfo.length > 0) {
      setFormBasicInfo([...character.basicInfo]);
    } else {
      // populate with default suggested items
      setFormBasicInfo(
        DEFAULT_BASIC_INFO_PRESETS.map((p, idx) => ({
          id: `bi-${idx}`,
          label: p.label,
          value: '',
        }))
      );
    }
    setActiveModalSection('basicInfo');
  };

  const openIntroModal = () => {
    if (!character) return;
    setFormIntro(character.intro || '');
    setActiveModalSection('intro');
  };

  const openPromptsModal = () => {
    if (!character) return;
    setFormPrompts(
      character.appearancePrompts && character.appearancePrompts.length > 0
        ? [...character.appearancePrompts]
        : [
            {
              id: `p-${Date.now()}`,
              versionName: '기본',
              mainPrompt: '',
              negativePrompt: '',
              notes: '',
              isPublic: true,
            },
          ]
    );
    setActiveModalSection('prompts');
  };

  const openRelationshipsModal = () => {
    if (!character) return;
    setFormRelationships([...(character.relationships || [])]);
    setNewRelTargetId('');
    setNewRelName('친구');
    setNewRelDesc('');
    setActiveModalSection('relationships');
  };

  const openGalleryModal = () => {
    if (!character) return;
    setFormGallery([...(character.gallery || [])]);
    setNewGalleryUrl('');
    setNewGalleryCaption('');
    setActiveModalSection('gallery');
  };

  const openArchivesModal = () => {
    if (!character) return;
    setFormWorks([...(character.relatedWorks || [])]);
    setFormSongIds([...(character.relatedSongIds || [])]);
    setNewWorkTitle('');
    setNewWorkLink('');
    setActiveModalSection('archives');
  };

  // --------------------------------------------------------------------------
  // Save Handlers for Each Section
  // --------------------------------------------------------------------------
  const saveSection = async (data: Partial<CharacterItem>) => {
    if (!character) return;
    try {
      setSubmitting(true);
      const ref = doc(db, 'characters', character.id);
      await updateDoc(ref, {
        ...data,
        updatedAt: new Date().toISOString(),
      });
      setActiveModalSection(null);
    } catch (err) {
      alert('저장 중 오류가 발생했습니다: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const tags = formTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    saveSection({
      name: formName.trim(),
      keywordTags: tags,
      coverUrl: formCoverUrl.trim(),
      mainImageUrl: formMainImageUrl.trim() || formCoverUrl.trim(),
    });
  };

  const handleSaveBasicInfo = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = formBasicInfo
      .map((item) => ({
        label: item.label.trim(),
        value: item.value.trim(),
      }))
      .filter((item) => item.label.length > 0);
    saveSection({ basicInfo: cleaned });
  };

  const handleSaveIntro = (e: React.FormEvent) => {
    e.preventDefault();
    saveSection({ intro: formIntro.trim() });
  };

  const handleSavePrompts = (e: React.FormEvent) => {
    e.preventDefault();
    saveSection({ appearancePrompts: formPrompts });
  };

  const handleSaveRelationships = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!character) return;

    try {
      setSubmitting(true);
      // 1. Update current character
      const ref = doc(db, 'characters', character.id);
      await updateDoc(ref, {
        relationships: formRelationships,
        updatedAt: new Date().toISOString(),
      });

      // 2. Synchronize bi-directionally to target characters
      for (const rel of formRelationships) {
        const target = allCharacters.find((c) => c.id === rel.targetCharacterId);
        if (target) {
          const targetRels = [...(target.relationships || [])];
          const existingIdx = targetRels.findIndex((r) => r.targetCharacterId === character.id);
          const mirror = {
            targetCharacterId: character.id,
            relationName: rel.relationName,
            description: rel.description || `${character.name}와의 관계`,
          };

          if (existingIdx >= 0) {
            targetRels[existingIdx] = mirror;
          } else {
            targetRels.push(mirror);
          }

          try {
            await updateDoc(doc(db, 'characters', target.id), {
              relationships: targetRels,
              updatedAt: new Date().toISOString(),
            });
          } catch {
            // best-effort sync
          }
        }
      }

      setActiveModalSection(null);
    } catch (err) {
      alert('관계도 저장 중 오류가 발생했습니다: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveGallery = (e: React.FormEvent) => {
    e.preventDefault();
    saveSection({ gallery: formGallery });
  };

  const handleSaveArchives = (e: React.FormEvent) => {
    e.preventDefault();
    saveSection({
      relatedWorks: formWorks,
      relatedSongIds: formSongIds,
    });
  };

  const handleDeleteCharacter = async () => {
    if (!character) return;
    if (!confirm(`'${character.name}' 캐릭터를 정말 삭제하시겠습니까?`)) return;

    try {
      await deleteDoc(doc(db, 'characters', character.id));
      navigate('/characters');
    } catch (err) {
      alert('삭제 중 오류가 발생했습니다: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  // --------------------------------------------------------------------------
  // SVG Relationship Graph Calculations
  // --------------------------------------------------------------------------
  const activeRelationships = useMemo(() => {
    if (!character) return [];
    // Get relationships defined on this character
    const list = [...(character.relationships || [])];
    // Also include relationships where another character points to this character (bi-directional view)
    allCharacters.forEach((other) => {
      if (other.id !== character.id && other.relationships) {
        const mirrorRel = other.relationships.find((r) => r.targetCharacterId === character.id);
        if (mirrorRel && !list.some((r) => r.targetCharacterId === other.id)) {
          list.push({
            targetCharacterId: other.id,
            relationName: mirrorRel.relationName,
            description: mirrorRel.description,
          });
        }
      }
    });
    return list;
  }, [character, allCharacters]);

  const svgGraph = useMemo(() => {
    const cx = 250;
    const cy = 200;
    const radius = 135;
    const count = activeRelationships.length;

    const nodes = activeRelationships.map((rel, index) => {
      const angle = (2 * Math.PI * index) / (count || 1) - Math.PI / 2;
      const x = cx + radius * Math.cos(angle);
      const y = cy + radius * Math.sin(angle);
      const targetChar = allCharacters.find((c) => c.id === rel.targetCharacterId);

      // Edge midpoint for relation badge
      const midX = (cx + x) / 2;
      const midY = (cy + y) / 2;
      const color = RELATION_COLORS[rel.relationName] || '#1D3FBB';

      return {
        ...rel,
        targetChar,
        x,
        y,
        midX,
        midY,
        color,
      };
    });

    return { cx, cy, nodes };
  }, [activeRelationships, allCharacters]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center text-sm text-[#0B1F4B]/50 font-light">
        캐릭터 아카이브를 불러오는 중...
      </div>
    );
  }

  if (!character) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <p className="text-sm text-[#0B1F4B]/60 mb-4">해당 캐릭터를 찾을 수 없습니다.</p>
        <button
          onClick={() => navigate('/characters')}
          className="text-xs text-[#1D3FBB] underline"
        >
          캐릭터 목록으로 돌아가기
        </button>
      </div>
    );
  }

  // Filter appearance prompts based on visitor / owner visibility
  const visiblePrompts = (character.appearancePrompts || []).filter(
    (p) => isOwner || p.isPublic
  );
  const currentPrompt = visiblePrompts[activePromptIndex] || visiblePrompts[0];

  // Non-empty basic info items for visitors
  const visibleBasicInfo = (character.basicInfo || []).filter(
    (item) => isOwner || item.value.trim().length > 0
  );

  // Connected songs
  const connectedSongs = allSongs.filter(
    (s) =>
      character.relatedSongIds?.includes(s.id) ||
      s.relatedCharacterIds?.includes(character.id)
  );

  return (
    <article className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-14 space-y-12 sm:space-y-16">
      {/* ============================================================ */}
      {/* Top Breadcrumb & Prev / Next Navigation                     */}
      {/* ============================================================ */}
      <div className="flex items-center justify-between border-b border-[rgba(11,31,75,0.12)] pb-4 text-xs">
        <button
          onClick={() => navigate('/characters')}
          className="inline-flex items-center gap-1.5 text-[#0B1F4B]/60 hover:text-[#0B1F4B] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>캐릭터 목록</span>
        </button>

        {/* Prev / Next Character links */}
        <div className="flex items-center gap-4 sm:gap-6">
          {prevChar && (
            <button
              onClick={() => navigate(`/characters/${prevChar.id}`)}
              className="inline-flex items-center gap-1 text-[#0B1F4B]/60 hover:text-[#1D3FBB] transition-colors"
              title={prevChar.name}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{prevChar.name}</span>
              <span className="sm:hidden">이전</span>
            </button>
          )}

          <span className="text-[#0B1F4B]/20">|</span>

          {nextChar && (
            <button
              onClick={() => navigate(`/characters/${nextChar.id}`)}
              className="inline-flex items-center gap-1 text-[#0B1F4B]/60 hover:text-[#1D3FBB] transition-colors"
              title={nextChar.name}
            >
              <span className="hidden sm:inline">{nextChar.name}</span>
              <span className="sm:hidden">다음</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}

          {isOwner && (
            <button
              onClick={handleDeleteCharacter}
              className="ml-2 text-red-500 hover:text-red-700 p-1"
              title="캐릭터 전체 삭제"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* ① SECTION: 대표 이미지 + 이름 (히어로)                         */}
      {/* ============================================================ */}
      <section className="relative">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-[rgba(11,31,75,0.08)]">
          <span className="font-editorial text-[11px] tracking-widest text-[#2F5BEA] uppercase font-light">
            01 PROFILE / 프로필
          </span>
          {isOwner && (
            <button
              onClick={openProfileModal}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs bg-[#0B1F4B] text-white hover:bg-[#1D3FBB] transition-colors"
            >
              <Edit2 className="w-3 h-3" /> 프로필 수정
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Large Main Representative Image (Left) */}
          <div className="md:col-span-5 bg-[#0B1F4B]/5 border border-[rgba(11,31,75,0.12)] overflow-hidden shadow-sm">
            <img
              src={character.mainImageUrl || character.coverUrl}
              alt={character.name}
              className="w-full h-auto object-cover max-h-[520px] mx-auto"
            />
          </div>

          {/* Name & Keyword Tags (Right) */}
          <div className="md:col-span-7 flex flex-col justify-center pt-2 sm:pt-4">
            <h1 className="text-3xl sm:text-5xl font-semibold text-[#0B1F4B] tracking-tight leading-tight mb-4">
              {character.name}
            </h1>

            {/* Keyword Tags */}
            {character.keywordTags && character.keywordTags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {character.keywordTags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 text-xs bg-[#DCE9FF]/60 text-[#1D3FBB] font-medium border border-[#DCE9FF]"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Quick excerpt / subline */}
            <div className="text-xs sm:text-sm text-[#0B1F4B]/60 font-light leading-relaxed border-t border-[rgba(11,31,75,0.08)] pt-4">
              {character.intro ? character.intro.slice(0, 140) + '...' : ''}
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* ② SECTION: 기본정보 (표 형태, key-value)                     */}
      {/* ============================================================ */}
      {(visibleBasicInfo.length > 0 || isOwner) && (
        <section className="pt-6 border-t border-[rgba(11,31,75,0.12)]">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-[rgba(11,31,75,0.08)]">
            <span className="font-editorial text-[11px] tracking-widest text-[#2F5BEA] uppercase font-light">
              02 INFORMATION / 기본정보
            </span>
            {isOwner && (
              <button
                onClick={openBasicInfoModal}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs bg-[#0B1F4B] text-white hover:bg-[#1D3FBB] transition-colors"
              >
                <Edit2 className="w-3 h-3" /> 기본정보 수정
              </button>
            )}
          </div>

          <div className="bg-white border border-[rgba(11,31,75,0.1)] divide-y divide-[rgba(11,31,75,0.08)]">
            {visibleBasicInfo.length === 0 ? (
              <div className="p-4 text-xs text-[#0B1F4B]/40 font-light text-center">
                등록된 기본정보 항목이 없습니다. (수정 버튼을 눌러 추가하세요)
              </div>
            ) : (
              visibleBasicInfo.map((info, idx) => (
                <div
                  key={info.id || idx}
                  className="flex items-center px-4 sm:px-6 py-3 text-xs sm:text-sm hover:bg-[#F9F9F8] transition-colors"
                >
                  <span className="w-28 sm:w-36 font-semibold text-[#0B1F4B]/70 tracking-tight flex-shrink-0">
                    {info.label}
                  </span>
                  <span className="text-[#0B1F4B] font-light leading-relaxed flex-1">
                    {info.value || (isOwner ? <span className="text-[#0B1F4B]/30">(미입력)</span> : '')}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>
      )}

      {/* ============================================================ */}
      {/* ③ SECTION: 간단한 소개글 (읽기 편한 폭 & 줄간격)               */}
      {/* ============================================================ */}
      <section className="pt-6 border-t border-[rgba(11,31,75,0.12)]">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-[rgba(11,31,75,0.08)]">
          <span className="font-editorial text-[11px] tracking-widest text-[#2F5BEA] uppercase font-light">
            03 INTRODUCTION / 소개
          </span>
          {isOwner && (
            <button
              onClick={openIntroModal}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs bg-[#0B1F4B] text-white hover:bg-[#1D3FBB] transition-colors"
            >
              <Edit2 className="w-3 h-3" /> 소개글 수정
            </button>
          )}
        </div>

        <div className="max-w-2xl bg-[#FBFBFA] p-5 sm:p-7 border border-[rgba(11,31,75,0.08)]">
          <p className="text-sm sm:text-base text-[#0B1F4B]/90 font-light leading-loose whitespace-pre-wrap">
            {character.intro || '등록된 소개글이 없습니다.'}
          </p>
        </div>
      </section>

      {/* ============================================================ */}
      {/* ④ SECTION: 외형 프롬프트 (Ice 파란 배경, 모노스페이스)        */}
      {/* ============================================================ */}
      {(visiblePrompts.length > 0 || isOwner) && (
        <section className="pt-6 border-t border-[rgba(11,31,75,0.12)]">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-[rgba(11,31,75,0.08)]">
            <span className="font-editorial text-[11px] tracking-widest text-[#2F5BEA] uppercase font-light">
              04 PROMPTS / 외형 프롬프트
            </span>
            {isOwner && (
              <button
                onClick={openPromptsModal}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs bg-[#0B1F4B] text-white hover:bg-[#1D3FBB] transition-colors"
              >
                <Edit2 className="w-3 h-3" /> 프롬프트 관리
              </button>
            )}
          </div>

          {visiblePrompts.length === 0 ? (
            <div className="p-6 bg-white border border-dashed border-[rgba(11,31,75,0.15)] text-center text-xs text-[#0B1F4B]/50 font-light">
              등록된 외형 프롬프트가 없습니다.
            </div>
          ) : (
            <div className="space-y-4">
              {/* Version Tabs */}
              {visiblePrompts.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {visiblePrompts.map((p, idx) => (
                    <button
                      key={p.id || idx}
                      onClick={() => setActivePromptIndex(idx)}
                      className={`px-3 py-1.5 text-xs font-medium border transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                        activePromptIndex === idx
                          ? 'bg-[#0B1F4B] text-white border-[#0B1F4B]'
                          : 'bg-white text-[#0B1F4B]/70 border-[rgba(11,31,75,0.15)] hover:border-[#1D3FBB]'
                      }`}
                    >
                      <span>{p.versionName}</span>
                      {!p.isPublic && (
                        <span className="text-[10px] text-amber-300 flex items-center">
                          <EyeOff className="w-2.5 h-2.5" />
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* Code Box: Ice Blue background */}
              {currentPrompt && (
                <div className="bg-[#DCE9FF]/35 border border-[#2F5BEA]/25 p-5 sm:p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-[#2F5BEA]/15">
                    <span className="text-xs font-semibold text-[#0B1F4B]">
                      버전: {currentPrompt.versionName}
                    </span>
                    {!currentPrompt.isPublic && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] bg-amber-100 text-amber-800 border border-amber-200">
                        <EyeOff className="w-3 h-3" /> 주인에게만 공개
                      </span>
                    )}
                  </div>

                  {/* 1. Main Prompt */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-mono font-semibold tracking-wider uppercase text-[#0B1F4B]/70">
                        Main Prompt
                      </span>
                      <button
                        onClick={() => handleCopy(currentPrompt.mainPrompt, 'main')}
                        className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 bg-white border border-[#2F5BEA]/30 text-[#1D3FBB] hover:bg-[#DCE9FF] transition-colors"
                      >
                        {copiedKey === 'main' ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-700">복사됨</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>복사</span>
                          </>
                        )}
                      </button>
                    </div>
                    <div className="bg-white/80 border border-[#2F5BEA]/20 p-3 font-mono text-xs sm:text-sm text-[#0B1F4B] leading-relaxed whitespace-pre-wrap select-all">
                      {currentPrompt.mainPrompt || '(비어 있음)'}
                    </div>
                  </div>

                  {/* 2. Negative Prompt */}
                  {currentPrompt.negativePrompt && (
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-mono font-semibold tracking-wider uppercase text-[#0B1F4B]/70">
                          Negative Prompt
                        </span>
                        <button
                          onClick={() => handleCopy(currentPrompt.negativePrompt || '', 'negative')}
                          className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 bg-white border border-[#2F5BEA]/30 text-[#1D3FBB] hover:bg-[#DCE9FF] transition-colors"
                        >
                          {copiedKey === 'negative' ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span className="text-emerald-700">복사됨</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>복사</span>
                            </>
                          )}
                        </button>
                      </div>
                      <div className="bg-white/80 border border-[#2F5BEA]/20 p-3 font-mono text-xs sm:text-sm text-[#0B1F4B]/80 leading-relaxed whitespace-pre-wrap select-all">
                        {currentPrompt.negativePrompt}
                      </div>
                    </div>
                  )}

                  {/* 3. Notes (Model, Seed, etc.) */}
                  {currentPrompt.notes && (
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-mono font-semibold tracking-wider uppercase text-[#0B1F4B]/70">
                          Memo / Generation Notes
                        </span>
                        <button
                          onClick={() => handleCopy(currentPrompt.notes || '', 'notes')}
                          className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 bg-white border border-[#2F5BEA]/30 text-[#1D3FBB] hover:bg-[#DCE9FF] transition-colors"
                        >
                          {copiedKey === 'notes' ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span className="text-emerald-700">복사됨</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>복사</span>
                            </>
                          )}
                        </button>
                      </div>
                      <div className="bg-white/80 border border-[#2F5BEA]/20 p-3 font-mono text-xs text-[#0B1F4B]/70 leading-relaxed whitespace-pre-wrap select-all">
                        {currentPrompt.notes}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* ============================================================ */}
      {/* ⑤ SECTION: 연관 캐릭터 관계도 (Pure SVG Radial Graph)          */}
      {/* ============================================================ */}
      {(activeRelationships.length > 0 || isOwner) && (
        <section className="pt-6 border-t border-[rgba(11,31,75,0.12)]">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-[rgba(11,31,75,0.08)]">
            <span className="font-editorial text-[11px] tracking-widest text-[#2F5BEA] uppercase font-light">
              05 RELATIONSHIPS / 인물 관계도
            </span>
            {isOwner && (
              <button
                onClick={openRelationshipsModal}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs bg-[#0B1F4B] text-white hover:bg-[#1D3FBB] transition-colors"
              >
                <Edit2 className="w-3 h-3" /> 관계 편집
              </button>
            )}
          </div>

          {activeRelationships.length === 0 ? (
            <div className="p-8 bg-white border border-dashed border-[rgba(11,31,75,0.15)] text-center text-xs text-[#0B1F4B]/50 font-light">
              등록된 인물 관계가 없습니다. (주인 계정에서 다른 캐릭터와의 관계를 추가해보세요)
            </div>
          ) : (
            <div className="bg-white border border-[rgba(11,31,75,0.12)] p-4 sm:p-6 shadow-xs relative">
              {/* Color Legend */}
              <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mb-4 text-[11px] text-[#0B1F4B]/70">
                <span className="font-medium text-[#0B1F4B]/50">관계 범례:</span>
                {Object.entries(RELATION_COLORS).map(([rel, color]) => (
                  <span key={rel} className="inline-flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                    <span>{rel}</span>
                  </span>
                ))}
              </div>

              {/* Pure SVG Graph Container with responsive viewBox */}
              <div className="w-full max-w-xl mx-auto aspect-[5/4] relative select-none">
                <svg
                  viewBox="0 0 500 400"
                  className="w-full h-full overflow-visible"
                >
                  <defs>
                    {/* Center Avatar Pattern */}
                    <pattern
                      id="avatar-center"
                      patternUnits="objectBoundingBox"
                      width="1"
                      height="1"
                    >
                      <image
                        href={character.coverUrl || character.mainImageUrl}
                        x="0"
                        y="0"
                        width="70"
                        height="70"
                        preserveAspectRatio="xMidYMid slice"
                      />
                    </pattern>

                    {/* Orbiting Avatar Patterns */}
                    {svgGraph.nodes.map((n, idx) => (
                      <pattern
                        key={idx}
                        id={`avatar-node-${idx}`}
                        patternUnits="objectBoundingBox"
                        width="1"
                        height="1"
                      >
                        <image
                          href={n.targetChar?.coverUrl || n.targetChar?.mainImageUrl || ''}
                          x="0"
                          y="0"
                          width="54"
                          height="54"
                          preserveAspectRatio="xMidYMid slice"
                        />
                      </pattern>
                    ))}
                  </defs>

                  {/* Connecting Edge Lines */}
                  {svgGraph.nodes.map((n, idx) => (
                    <g key={`edge-${idx}`}>
                      <line
                        x1={svgGraph.cx}
                        y1={svgGraph.cy}
                        x2={n.x}
                        y2={n.y}
                        stroke={n.color}
                        strokeWidth="2"
                        strokeDasharray="4 3"
                        opacity="0.85"
                      />
                      {/* Edge Label Pill (Clickable for description) */}
                      <g
                        className="cursor-pointer group"
                        onClick={() =>
                          setActiveRelationPopup({
                            targetName: n.targetChar?.name || '연관 캐릭터',
                            relationName: n.relationName,
                            description: n.description || '상세 관계 설명이 없습니다.',
                          })
                        }
                      >
                        <rect
                          x={n.midX - 22}
                          y={n.midY - 11}
                          width="44"
                          height="22"
                          rx="11"
                          fill="#FFFFFF"
                          stroke={n.color}
                          strokeWidth="1.5"
                          className="hover:fill-[#DCE9FF] transition-colors"
                        />
                        <text
                          x={n.midX}
                          y={n.midY + 4}
                          textAnchor="middle"
                          fontSize="10"
                          fontWeight="600"
                          fill={n.color}
                        >
                          {n.relationName}
                        </text>
                      </g>
                    </g>
                  ))}

                  {/* Center Node (Current Character) */}
                  <g className="cursor-default">
                    <circle
                      cx={svgGraph.cx}
                      cy={svgGraph.cy}
                      r="37"
                      fill="#FFFFFF"
                      stroke="#0B1F4B"
                      strokeWidth="3"
                    />
                    <circle
                      cx={svgGraph.cx}
                      cy={svgGraph.cy}
                      r="35"
                      fill="url(#avatar-center)"
                    />
                    <text
                      x={svgGraph.cx}
                      y={svgGraph.cy + 52}
                      textAnchor="middle"
                      fontSize="12"
                      fontWeight="700"
                      fill="#0B1F4B"
                    >
                      {character.name} (본인)
                    </text>
                  </g>

                  {/* Orbiting Peripheral Nodes */}
                  {svgGraph.nodes.map((n, idx) => (
                    <g
                      key={`node-${idx}`}
                      className="cursor-pointer group"
                      onClick={() => navigate(`/characters/${n.targetCharacterId}`)}
                    >
                      <circle
                        cx={n.x}
                        cy={n.y}
                        r="29"
                        fill="#FFFFFF"
                        stroke={n.color}
                        strokeWidth="2.5"
                        className="group-hover:stroke-width-3 transition-all"
                      />
                      <circle
                        cx={n.x}
                        cy={n.y}
                        r="27"
                        fill={`url(#avatar-node-${idx})`}
                      />
                      <text
                        x={n.x}
                        y={n.y + 42}
                        textAnchor="middle"
                        fontSize="11"
                        fontWeight="600"
                        fill="#0B1F4B"
                        className="group-hover:fill-[#1D3FBB] transition-colors"
                      >
                        {n.targetChar?.name || '캐릭터'}
                      </text>
                    </g>
                  ))}
                </svg>
              </div>

              <div className="mt-2 text-center text-[11px] text-[#0B1F4B]/50 font-light">
                노드를 클릭하면 해당 캐릭터로 이동하며, 선 위의 관계 라벨을 클릭하면 상세 설명이 표시됩니다.
              </div>
            </div>
          )}

          {/* Relation Description Popup Modal */}
          {activeRelationPopup && (
            <div
              className="fixed inset-0 z-50 bg-[#0B1F4B]/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
              onClick={() => setActiveRelationPopup(null)}
            >
              <div
                className="bg-white border border-[rgba(11,31,75,0.18)] max-w-sm w-full p-5 shadow-xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-[rgba(11,31,75,0.1)]">
                  <span className="text-xs font-semibold text-[#1D3FBB] flex items-center gap-1">
                    <Info className="w-3.5 h-3.5" />
                    {character.name} ↔ {activeRelationPopup.targetName} ({activeRelationPopup.relationName})
                  </span>
                  <button
                    onClick={() => setActiveRelationPopup(null)}
                    className="text-[#0B1F4B]/40 hover:text-[#0B1F4B]"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs sm:text-sm text-[#0B1F4B]/80 font-light leading-relaxed whitespace-pre-wrap">
                  {activeRelationPopup.description}
                </p>
                <div className="mt-4 pt-2 text-right">
                  <button
                    onClick={() => setActiveRelationPopup(null)}
                    className="px-3 py-1 bg-[#0B1F4B] text-white text-xs"
                  >
                    확인
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* ============================================================ */}
      {/* ⑥ SECTION: 이미지 모음 (데스크톱 4열 / 모바일 2열 + 라이트박스) */}
      {/* ============================================================ */}
      <section className="pt-6 border-t border-[rgba(11,31,75,0.12)]">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-[rgba(11,31,75,0.08)]">
          <span className="font-editorial text-[11px] tracking-widest text-[#2F5BEA] uppercase font-light">
            06 GALLERY / 갤러리
          </span>
          {isOwner && (
            <button
              onClick={openGalleryModal}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs bg-[#0B1F4B] text-white hover:bg-[#1D3FBB] transition-colors"
            >
              <Edit2 className="w-3 h-3" /> 갤러리 관리
            </button>
          )}
        </div>

        {character.gallery && character.gallery.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-5">
            {character.gallery.map((item, idx) => (
              <div
                key={item.id || idx}
                onClick={() => setLightboxIndex(idx)}
                className="group relative bg-[#FAF6EF] border border-[rgba(11,31,75,0.12)] p-2 pb-4 sm:p-2.5 sm:pb-5 shadow-[0_2px_6px_rgba(11,31,75,0.06),0_6px_14px_rgba(11,31,75,0.05)] hover:shadow-[0_8px_20px_rgba(11,31,75,0.12)] hover:-translate-y-1 transition-all duration-300 cursor-pointer [&:nth-child(odd)]:-rotate-0.5 [&:nth-child(even)]:rotate-0.5 hover:rotate-0"
              >
                {/* Photo frame inside polaroid */}
                <div className="relative aspect-[4/3] w-full bg-[#0B1F4B]/5 overflow-hidden border border-[rgba(11,31,75,0.08)]">
                  <img
                    src={item.url}
                    alt={item.caption || `${character.name} 갤러리 이미지 ${idx + 1}`}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-104 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-[#0B1F4B]/0 group-hover:bg-[#0B1F4B]/20 flex items-center justify-center transition-colors">
                    <Maximize2 className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>

                {/* Polaroid bottom caption strip */}
                <div className="mt-2 text-center">
                  <p className="text-[10px] sm:text-[11px] text-[#0B1F4B]/75 font-mono truncate px-1">
                    {item.caption || `Photograph ${idx + 1}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center text-xs text-[#0B1F4B]/50 font-light border border-dashed border-[rgba(11,31,75,0.15)]">
            등록된 갤러리 이미지가 없습니다.
          </div>
        )}

        {/* Gallery Lightbox Modal with Next / Prev and ESC */}
        {lightboxIndex !== null && character.gallery && (
          <div
            className="fixed inset-0 z-50 bg-[#0B1F4B]/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
            onClick={() => setLightboxIndex(null)}
          >
            {/* Close Button */}
            <button
              onClick={() => setLightboxIndex(null)}
              className="absolute top-4 right-4 text-white/70 hover:text-white p-2 z-50"
              aria-label="닫기 (ESC)"
            >
              <X className="w-7 h-7" />
            </button>

            {/* Prev Image Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex((prev) =>
                  prev !== null && prev > 0 ? prev - 1 : character.gallery.length - 1
                );
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white p-3 z-50"
              aria-label="이전 이미지"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>

            {/* Next Image Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex((prev) =>
                  prev !== null && prev < character.gallery.length - 1 ? prev + 1 : 0
                );
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white p-3 z-50"
              aria-label="다음 이미지"
            >
              <ChevronRight className="w-8 h-8" />
            </button>

            {/* Lightbox Content */}
            <div
              className="relative max-w-4xl max-h-[85vh] flex flex-col items-center"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={character.gallery[lightboxIndex]?.url}
                alt={character.gallery[lightboxIndex]?.caption || ''}
                className="max-w-full max-h-[75vh] object-contain shadow-2xl"
              />
              <div className="mt-3 text-center text-white/90">
                <p className="text-sm font-light">
                  {character.gallery[lightboxIndex]?.caption || character.name}
                </p>
                <span className="text-xs text-white/50 font-mono mt-1 block">
                  {lightboxIndex + 1} / {character.gallery.length}
                </span>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ============================================================ */}
      {/* ⑦ SECTION: 관련 작품 / 관련 음악 (맨 아래 유지)                */}
      {/* ============================================================ */}
      <section className="pt-6 border-t border-[rgba(11,31,75,0.12)]">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-[rgba(11,31,75,0.08)]">
          <span className="font-editorial text-[11px] tracking-widest text-[#2F5BEA] uppercase font-light">
            07 ARCHIVES / 관련 기록
          </span>
          {isOwner && (
            <button
              onClick={openArchivesModal}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs bg-[#0B1F4B] text-white hover:bg-[#1D3FBB] transition-colors"
            >
              <Edit2 className="w-3 h-3" /> 관련 작품/음악 편집
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Related Works List */}
          <div>
            <h3 className="text-xs font-semibold tracking-wider uppercase text-[#0B1F4B]/70 mb-3">
              관련 작품
            </h3>
            {character.relatedWorks && character.relatedWorks.length > 0 ? (
              <ul className="space-y-2.5">
                {character.relatedWorks.map((work, idx) => (
                  <li key={idx}>
                    <button
                      onClick={() => {
                        if (work.link.startsWith('/')) {
                          navigate(work.link);
                        } else {
                          window.open(work.link, '_blank');
                        }
                      }}
                      className="inline-flex items-center gap-2 text-xs sm:text-sm text-[#1D3FBB] hover:underline"
                    >
                      <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{work.title}</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-[#0B1F4B]/40 font-light">
                등록된 관련 작품이 없습니다.
              </p>
            )}
          </div>

          {/* Related Songs List */}
          <div>
            <h3 className="text-xs font-semibold tracking-wider uppercase text-[#0B1F4B]/70 mb-3">
              관련 음악
            </h3>
            {connectedSongs.length > 0 ? (
              <ul className="space-y-2.5">
                {connectedSongs.map((s) => (
                  <li key={s.id}>
                    <button
                      onClick={() => navigate('/songs')}
                      className="inline-flex items-center gap-2 text-xs sm:text-sm text-[#0B1F4B] hover:text-[#1D3FBB] transition-colors"
                    >
                      <Music className="w-3.5 h-3.5 text-[#2F5BEA] flex-shrink-0" />
                      <span className="font-medium underline underline-offset-2">
                        {s.title}
                      </span>
                      <span className="text-[11px] text-[#0B1F4B]/50">(노래 페이지로 이동)</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-[#0B1F4B]/40 font-light">
                연결된 관련 음악이 없습니다.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* OWNER MODALS (Section-by-Section)                            */}
      {/* ============================================================ */}

      {/* 1. Profile Modal */}
      <Modal
        isOpen={activeModalSection === 'profile'}
        onClose={() => setActiveModalSection(null)}
        title="대표 이미지 및 프로필 수정"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold tracking-wider uppercase text-[#0B1F4B]/70 mb-1">
              캐릭터 이름 *
            </label>
            <input
              type="text"
              required
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-[rgba(11,31,75,0.18)] focus:border-[#1D3FBB] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold tracking-wider uppercase text-[#0B1F4B]/70 mb-1">
              키워드 태그 (쉼표로 구분)
            </label>
            <input
              type="text"
              value={formTags}
              onChange={(e) => setFormTags(e.target.value)}
              placeholder="예: 기록자, 심해, 관측소"
              className="w-full px-3 py-2 text-sm bg-white border border-[rgba(11,31,75,0.18)] focus:border-[#1D3FBB] focus:outline-none"
            />
          </div>

          <StorageUploader
            label="대표 이미지 (상세 상단 노출용)"
            value={formMainImageUrl}
            onChange={setFormMainImageUrl}
            accept="image/*"
            folder="characters/mains"
          />

          <StorageUploader
            label="커버 이미지 (목록 3열 그리드 노출용)"
            value={formCoverUrl}
            onChange={setFormCoverUrl}
            accept="image/*"
            folder="characters/covers"
          />

          <div className="pt-4 flex justify-end gap-2 border-t border-[rgba(11,31,75,0.1)]">
            <button
              type="button"
              onClick={() => setActiveModalSection(null)}
              className="px-4 py-2 text-xs font-medium text-[#0B1F4B]/70 hover:text-[#0B1F4B]"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-[#0B1F4B] text-white text-xs font-medium tracking-wide hover:bg-[#1D3FBB] disabled:opacity-50"
            >
              {submitting ? '저장 중...' : '프로필 저장'}
            </button>
          </div>
        </form>
      </Modal>

      {/* 2. Basic Info Modal (Key-Value, Add/Remove/Reorder) */}
      <Modal
        isOpen={activeModalSection === 'basicInfo'}
        onClose={() => setActiveModalSection(null)}
        title="기본정보 항목 관리"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSaveBasicInfo} className="space-y-4">
          <p className="text-xs text-[#0B1F4B]/60 font-light">
            자유롭게 항목을 추가하거나 삭제, 값을 변경할 수 있습니다. 값이 비어 있는 항목은 방문자 화면에서 숨겨집니다.
          </p>

          <div className="space-y-2.5 max-h-[50vh] overflow-y-auto pr-1">
            {formBasicInfo.map((item, idx) => (
              <div
                key={item.id || idx}
                className="flex items-center gap-2 p-2 bg-[#FBFBFA] border border-[rgba(11,31,75,0.1)]"
              >
                <input
                  type="text"
                  placeholder="라벨 (예: 나이)"
                  value={item.label}
                  onChange={(e) => {
                    const next = [...formBasicInfo];
                    next[idx].label = e.target.value;
                    setFormBasicInfo(next);
                  }}
                  className="w-1/3 px-2.5 py-1.5 text-xs bg-white border border-[rgba(11,31,75,0.15)] focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="값 (예: 24세)"
                  value={item.value}
                  onChange={(e) => {
                    const next = [...formBasicInfo];
                    next[idx].value = e.target.value;
                    setFormBasicInfo(next);
                  }}
                  className="w-2/3 px-2.5 py-1.5 text-xs bg-white border border-[rgba(11,31,75,0.15)] focus:outline-none"
                />

                {/* Move up / down buttons */}
                <button
                  type="button"
                  onClick={() => {
                    if (idx === 0) return;
                    const next = [...formBasicInfo];
                    const tmp = next[idx - 1];
                    next[idx - 1] = next[idx];
                    next[idx] = tmp;
                    setFormBasicInfo(next);
                  }}
                  disabled={idx === 0}
                  className="p-1 text-[#0B1F4B]/40 hover:text-[#0B1F4B] disabled:opacity-20"
                  title="위로 이동"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (idx === formBasicInfo.length - 1) return;
                    const next = [...formBasicInfo];
                    const tmp = next[idx + 1];
                    next[idx + 1] = next[idx];
                    next[idx] = tmp;
                    setFormBasicInfo(next);
                  }}
                  disabled={idx === formBasicInfo.length - 1}
                  className="p-1 text-[#0B1F4B]/40 hover:text-[#0B1F4B] disabled:opacity-20"
                  title="아래로 이동"
                >
                  ↓
                </button>

                <button
                  type="button"
                  onClick={() => setFormBasicInfo(formBasicInfo.filter((_, i) => i !== idx))}
                  className="p-1 text-red-500 hover:text-red-700"
                  title="항목 삭제"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() =>
                setFormBasicInfo([
                  ...formBasicInfo,
                  { id: `bi-${Date.now()}`, label: '', value: '' },
                ])
              }
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#F4F6FB] border border-[rgba(11,31,75,0.15)] text-[#0B1F4B] text-xs hover:bg-white transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> 새 항목 추가
            </button>
          </div>

          <div className="pt-4 flex justify-end gap-2 border-t border-[rgba(11,31,75,0.1)]">
            <button
              type="button"
              onClick={() => setActiveModalSection(null)}
              className="px-4 py-2 text-xs font-medium text-[#0B1F4B]/70 hover:text-[#0B1F4B]"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-[#0B1F4B] text-white text-xs font-medium tracking-wide hover:bg-[#1D3FBB] disabled:opacity-50"
            >
              {submitting ? '저장 중...' : '기본정보 저장'}
            </button>
          </div>
        </form>
      </Modal>

      {/* 3. Intro Modal */}
      <Modal
        isOpen={activeModalSection === 'intro'}
        onClose={() => setActiveModalSection(null)}
        title="소개글 수정"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSaveIntro} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold tracking-wider uppercase text-[#0B1F4B]/70 mb-1">
              소개글 (권장 300자 내외)
            </label>
            <textarea
              rows={8}
              value={formIntro}
              onChange={(e) => setFormIntro(e.target.value)}
              placeholder="캐릭터의 서사와 특징을 입력하세요"
              className="w-full px-3 py-2 text-sm bg-white border border-[rgba(11,31,75,0.18)] focus:border-[#1D3FBB] focus:outline-none leading-relaxed"
            />
            <p className="mt-1 text-[11px] text-[#0B1F4B]/40 text-right">
              현재 {formIntro.length}자
            </p>
          </div>

          <div className="pt-4 flex justify-end gap-2 border-t border-[rgba(11,31,75,0.1)]">
            <button
              type="button"
              onClick={() => setActiveModalSection(null)}
              className="px-4 py-2 text-xs font-medium text-[#0B1F4B]/70 hover:text-[#0B1F4B]"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-[#0B1F4B] text-white text-xs font-medium tracking-wide hover:bg-[#1D3FBB] disabled:opacity-50"
            >
              {submitting ? '저장 중...' : '소개글 저장'}
            </button>
          </div>
        </form>
      </Modal>

      {/* 4. Prompts Modal */}
      <Modal
        isOpen={activeModalSection === 'prompts'}
        onClose={() => setActiveModalSection(null)}
        title="외형 프롬프트 관리"
        maxWidth="max-w-3xl"
      >
        <form onSubmit={handleSavePrompts} className="space-y-5">
          <p className="text-xs text-[#0B1F4B]/60 font-light">
            의상이나 설정별로 여러 버전의 프롬프트를 추가할 수 있습니다. 비공개로 설정된 프롬프트는 로그인한 주인에게만 보입니다.
          </p>

          <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-1">
            {formPrompts.map((prompt, idx) => (
              <div
                key={prompt.id || idx}
                className="p-4 bg-[#FBFBFA] border border-[rgba(11,31,75,0.12)] space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      required
                      placeholder="버전명 (예: 기본, 사복, 전투복)"
                      value={prompt.versionName}
                      onChange={(e) => {
                        const next = [...formPrompts];
                        next[idx].versionName = e.target.value;
                        setFormPrompts(next);
                      }}
                      className="px-2.5 py-1 text-xs font-semibold bg-white border border-[rgba(11,31,75,0.15)] focus:outline-none"
                    />

                    {/* Public / Private Toggle */}
                    <button
                      type="button"
                      onClick={() => {
                        const next = [...formPrompts];
                        next[idx].isPublic = !next[idx].isPublic;
                        setFormPrompts(next);
                      }}
                      className={`inline-flex items-center gap-1 text-[11px] px-2 py-1 border transition-colors ${
                        prompt.isPublic
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}
                    >
                      {prompt.isPublic ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      <span>{prompt.isPublic ? '전체 공개' : '주인만 비공개'}</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setFormPrompts(formPrompts.filter((_, i) => i !== idx))}
                    className="text-red-500 hover:text-red-700 p-1"
                    title="이 버전 삭제"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div>
                  <label className="block text-[11px] font-mono font-medium text-[#0B1F4B]/70 mb-1">
                    Main Prompt *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={prompt.mainPrompt}
                    onChange={(e) => {
                      const next = [...formPrompts];
                      next[idx].mainPrompt = e.target.value;
                      setFormPrompts(next);
                    }}
                    placeholder="긍정 프롬프트 태그를 입력하세요"
                    className="w-full px-3 py-2 text-xs font-mono bg-white border border-[rgba(11,31,75,0.15)] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono font-medium text-[#0B1F4B]/70 mb-1">
                    Negative Prompt
                  </label>
                  <textarea
                    rows={2}
                    value={prompt.negativePrompt || ''}
                    onChange={(e) => {
                      const next = [...formPrompts];
                      next[idx].negativePrompt = e.target.value;
                      setFormPrompts(next);
                    }}
                    placeholder="네거티브 프롬프트 (선택)"
                    className="w-full px-3 py-2 text-xs font-mono bg-white border border-[rgba(11,31,75,0.15)] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono font-medium text-[#0B1F4B]/70 mb-1">
                    Memo (사용 모델, 시드, CFG 스텝 등)
                  </label>
                  <input
                    type="text"
                    value={prompt.notes || ''}
                    onChange={(e) => {
                      const next = [...formPrompts];
                      next[idx].notes = e.target.value;
                      setFormPrompts(next);
                    }}
                    placeholder="예: NovelAI v3, CFG 6.5, Steps 28"
                    className="w-full px-3 py-1.5 text-xs font-mono bg-white border border-[rgba(11,31,75,0.15)] focus:outline-none"
                  />
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() =>
              setFormPrompts([
                ...formPrompts,
                {
                  id: `p-${Date.now()}`,
                  versionName: `버전 ${formPrompts.length + 1}`,
                  mainPrompt: '',
                  negativePrompt: '',
                  notes: '',
                  isPublic: true,
                },
              ])
            }
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#F4F6FB] border border-[rgba(11,31,75,0.15)] text-[#0B1F4B] text-xs hover:bg-white"
          >
            <Plus className="w-3.5 h-3.5" /> 새 프롬프트 버전 추가
          </button>

          <div className="pt-4 flex justify-end gap-2 border-t border-[rgba(11,31,75,0.1)]">
            <button
              type="button"
              onClick={() => setActiveModalSection(null)}
              className="px-4 py-2 text-xs font-medium text-[#0B1F4B]/70 hover:text-[#0B1F4B]"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-[#0B1F4B] text-white text-xs font-medium tracking-wide hover:bg-[#1D3FBB] disabled:opacity-50"
            >
              {submitting ? '저장 중...' : '프롬프트 저장'}
            </button>
          </div>
        </form>
      </Modal>

      {/* 5. Relationships Modal */}
      <Modal
        isOpen={activeModalSection === 'relationships'}
        onClose={() => setActiveModalSection(null)}
        title="인물 관계도 관리"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSaveRelationships} className="space-y-4">
          <p className="text-xs text-[#0B1F4B]/60 font-light">
            다른 캐릭터와의 관계를 추가하면 상대 캐릭터의 프로필에도 양방향으로 자동 반영됩니다.
          </p>

          {/* Existing relationships list */}
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {formRelationships.map((rel, idx) => {
              const target = allCharacters.find((c) => c.id === rel.targetCharacterId);
              return (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-2 p-2.5 bg-[#FBFBFA] border border-[rgba(11,31,75,0.1)] text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-semibold text-[#0B1F4B]">
                      {target?.name || '캐릭터'}
                    </span>
                    <span className="px-2 py-0.5 bg-[#DCE9FF] text-[#1D3FBB] font-medium text-[11px]">
                      {rel.relationName}
                    </span>
                    <span className="text-[#0B1F4B]/60 truncate font-light">
                      {rel.description || '(설명 없음)'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setFormRelationships(formRelationships.filter((_, i) => i !== idx))
                    }
                    className="text-red-500 hover:text-red-700 p-1 flex-shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Add New Relationship Block */}
          <div className="p-3 bg-white border border-dashed border-[rgba(11,31,75,0.2)] space-y-3">
            <span className="text-xs font-semibold text-[#0B1F4B] block">
              새 관계 추가
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-[#0B1F4B]/70 mb-1">
                  대상 캐릭터 선택 *
                </label>
                <select
                  value={newRelTargetId}
                  onChange={(e) => setNewRelTargetId(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-[rgba(11,31,75,0.18)] focus:outline-none"
                >
                  <option value="">캐릭터를 선택하세요</option>
                  {allCharacters
                    .filter((c) => c.id !== character.id)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#0B1F4B]/70 mb-1">
                  관계명 * (예: 친구, 라이벌, 가족, 연인, 동료)
                </label>
                <input
                  type="text"
                  placeholder="예: 친구, 라이벌, 가족, 동료"
                  value={newRelName}
                  onChange={(e) => setNewRelName(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-[rgba(11,31,75,0.18)] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[#0B1F4B]/70 mb-1">
                관계 설명 (라벨 클릭 시 팝업 내용)
              </label>
              <textarea
                rows={2}
                placeholder="서로 어떤 관계이며 어떤 일화가 있는지 한두 줄로 적어주세요"
                value={newRelDesc}
                onChange={(e) => setNewRelDesc(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-[rgba(11,31,75,0.18)] focus:outline-none leading-relaxed"
              />
            </div>

            <button
              type="button"
              disabled={!newRelTargetId || !newRelName.trim()}
              onClick={() => {
                if (!newRelTargetId || !newRelName.trim()) return;
                setFormRelationships([
                  ...formRelationships,
                  {
                    targetCharacterId: newRelTargetId,
                    relationName: newRelName.trim(),
                    description: newRelDesc.trim(),
                  },
                ]);
                setNewRelTargetId('');
                setNewRelName('친구');
                setNewRelDesc('');
              }}
              className="px-3 py-1.5 bg-[#1D3FBB] text-white text-xs disabled:opacity-40"
            >
              + 관계 목록에 추가
            </button>
          </div>

          <div className="pt-4 flex justify-end gap-2 border-t border-[rgba(11,31,75,0.1)]">
            <button
              type="button"
              onClick={() => setActiveModalSection(null)}
              className="px-4 py-2 text-xs font-medium text-[#0B1F4B]/70 hover:text-[#0B1F4B]"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-[#0B1F4B] text-white text-xs font-medium tracking-wide hover:bg-[#1D3FBB] disabled:opacity-50"
            >
              {submitting ? '저장 중...' : '관계도 저장'}
            </button>
          </div>
        </form>
      </Modal>

      {/* 6. Gallery Modal (Upload, Reorder, Delete, Set as Main) */}
      <Modal
        isOpen={activeModalSection === 'gallery'}
        onClose={() => setActiveModalSection(null)}
        title="갤러리 이미지 관리"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSaveGallery} className="space-y-4">
          <p className="text-xs text-[#0B1F4B]/60 font-light">
            이미지의 순서를 변경하거나 삭제할 수 있으며, 원하는 이미지를 "대표 이미지"로 즉시 지정할 수 있습니다.
          </p>

          <div className="space-y-2.5 max-h-[50vh] overflow-y-auto pr-1">
            {formGallery.map((item, idx) => (
              <div
                key={item.id || idx}
                className="flex items-center gap-3 p-2 bg-[#FBFBFA] border border-[rgba(11,31,75,0.1)] text-xs"
              >
                <img
                  src={item.url}
                  alt=""
                  className="w-12 h-12 object-cover flex-shrink-0 border border-[rgba(11,31,75,0.1)]"
                />
                <input
                  type="text"
                  placeholder="이미지 캡션 (선택)"
                  value={item.caption || ''}
                  onChange={(e) => {
                    const next = [...formGallery];
                    next[idx].caption = e.target.value;
                    setFormGallery(next);
                  }}
                  className="flex-1 px-2.5 py-1.5 text-xs bg-white border border-[rgba(11,31,75,0.15)] focus:outline-none"
                />

                {/* Set as representative image */}
                <button
                  type="button"
                  onClick={() => {
                    saveSection({ mainImageUrl: item.url });
                    alert('대표 이미지로 지정되었습니다.');
                  }}
                  className="px-2 py-1 text-[11px] bg-white border border-[rgba(11,31,75,0.15)] hover:border-[#1D3FBB] flex items-center gap-1"
                  title="대표 이미지로 설정"
                >
                  <Star className="w-3 h-3 text-amber-500" />
                  <span>대표</span>
                </button>

                {/* Move Up / Down */}
                <button
                  type="button"
                  onClick={() => {
                    if (idx === 0) return;
                    const next = [...formGallery];
                    const tmp = next[idx - 1];
                    next[idx - 1] = next[idx];
                    next[idx] = tmp;
                    setFormGallery(next);
                  }}
                  disabled={idx === 0}
                  className="p-1 text-[#0B1F4B]/40 hover:text-[#0B1F4B] disabled:opacity-20"
                  title="위로"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (idx === formGallery.length - 1) return;
                    const next = [...formGallery];
                    const tmp = next[idx + 1];
                    next[idx + 1] = next[idx];
                    next[idx] = tmp;
                    setFormGallery(next);
                  }}
                  disabled={idx === formGallery.length - 1}
                  className="p-1 text-[#0B1F4B]/40 hover:text-[#0B1F4B] disabled:opacity-20"
                  title="아래로"
                >
                  ↓
                </button>

                <button
                  type="button"
                  onClick={() => setFormGallery(formGallery.filter((_, i) => i !== idx))}
                  className="text-red-500 hover:text-red-700 p-1"
                  title="삭제"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Add new image to gallery */}
          <div className="p-3 bg-white border border-dashed border-[rgba(11,31,75,0.2)] space-y-2">
            <StorageUploader
              label="새 이미지 추가 (Storage 업로드 또는 URL)"
              value={newGalleryUrl}
              onChange={setNewGalleryUrl}
              accept="image/*"
              folder="characters/gallery"
            />
            <input
              type="text"
              placeholder="새 이미지 캡션 / 제목 / 날짜 (선택)"
              value={newGalleryCaption}
              onChange={(e) => setNewGalleryCaption(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-white border border-[rgba(11,31,75,0.18)] focus:outline-none"
            />
            <button
              type="button"
              disabled={!newGalleryUrl.trim()}
              onClick={() => {
                if (!newGalleryUrl.trim()) return;
                setFormGallery([
                  ...formGallery,
                  {
                    id: `g-${Date.now()}`,
                    url: newGalleryUrl.trim(),
                    caption: newGalleryCaption.trim(),
                  },
                ]);
                setNewGalleryUrl('');
                setNewGalleryCaption('');
              }}
              className="px-3 py-1.5 bg-[#1D3FBB] text-white text-xs disabled:opacity-40"
            >
              + 갤러리에 추가
            </button>
          </div>

          <div className="pt-4 flex justify-end gap-2 border-t border-[rgba(11,31,75,0.1)]">
            <button
              type="button"
              onClick={() => setActiveModalSection(null)}
              className="px-4 py-2 text-xs font-medium text-[#0B1F4B]/70 hover:text-[#0B1F4B]"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-[#0B1F4B] text-white text-xs font-medium tracking-wide hover:bg-[#1D3FBB] disabled:opacity-50"
            >
              {submitting ? '저장 중...' : '갤러리 저장'}
            </button>
          </div>
        </form>
      </Modal>

      {/* 7. Archives Modal (Related Works & Songs) */}
      <Modal
        isOpen={activeModalSection === 'archives'}
        onClose={() => setActiveModalSection(null)}
        title="관련 작품 및 관련 음악 관리"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSaveArchives} className="space-y-4">
          {/* Related works */}
          <div>
            <label className="block text-xs font-semibold tracking-wider uppercase text-[#0B1F4B]/70 mb-2">
              관련 작품 목록
            </label>
            <div className="space-y-2 mb-3 max-h-36 overflow-y-auto">
              {formWorks.map((work, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-2 p-2 bg-[#FBFBFA] border border-[rgba(11,31,75,0.08)] text-xs"
                >
                  <span className="font-medium text-[#0B1F4B]">{work.title}</span>
                  <span className="text-[#0B1F4B]/50 truncate max-w-[180px]">{work.link}</span>
                  <button
                    type="button"
                    onClick={() => setFormWorks(formWorks.filter((_, i) => i !== idx))}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="작품 제목 (예: 단편 애니메이션)"
                value={newWorkTitle}
                onChange={(e) => setNewWorkTitle(e.target.value)}
                className="w-1/2 px-2.5 py-1.5 text-xs bg-white border border-[rgba(11,31,75,0.18)] focus:outline-none"
              />
              <input
                type="text"
                placeholder="링크 (예: /videos)"
                value={newWorkLink}
                onChange={(e) => setNewWorkLink(e.target.value)}
                className="w-1/2 px-2.5 py-1.5 text-xs bg-white border border-[rgba(11,31,75,0.18)] focus:outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  if (!newWorkTitle.trim() || !newWorkLink.trim()) return;
                  setFormWorks([...formWorks, { title: newWorkTitle.trim(), link: newWorkLink.trim() }]);
                  setNewWorkTitle('');
                  setNewWorkLink('');
                }}
                className="px-3 py-1.5 bg-[#1D3FBB] text-white text-xs whitespace-nowrap"
              >
                추가
              </button>
            </div>
          </div>

          {/* Related songs selection */}
          <div className="border-t border-[rgba(11,31,75,0.1)] pt-4">
            <label className="block text-xs font-semibold tracking-wider uppercase text-[#0B1F4B]/70 mb-2">
              관련 음악 연결 (다중 선택 가능)
            </label>
            <div className="space-y-1.5 max-h-36 overflow-y-auto">
              {allSongs.map((song) => {
                const isSelected = formSongIds.includes(song.id);
                return (
                  <label
                    key={song.id}
                    className="flex items-center gap-2 text-xs p-1.5 hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormSongIds([...formSongIds, song.id]);
                        } else {
                          setFormSongIds(formSongIds.filter((id) => id !== song.id));
                        }
                      }}
                      className="accent-[#1D3FBB]"
                    />
                    <span className="font-medium text-[#0B1F4B]">{song.title}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-2 border-t border-[rgba(11,31,75,0.1)]">
            <button
              type="button"
              onClick={() => setActiveModalSection(null)}
              className="px-4 py-2 text-xs font-medium text-[#0B1F4B]/70 hover:text-[#0B1F4B]"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-[#0B1F4B] text-white text-xs font-medium tracking-wide hover:bg-[#1D3FBB] disabled:opacity-50"
            >
              {submitting ? '저장 중...' : '저장 완료'}
            </button>
          </div>
        </form>
      </Modal>
    </article>
  );
};
