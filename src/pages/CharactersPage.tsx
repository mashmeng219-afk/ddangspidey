import React, { useEffect, useState, useMemo } from 'react';
import { collection, onSnapshot, doc, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { CharacterItem } from '../types';
import { INITIAL_CHARACTERS } from '../data/seedData';
import { StorageUploader } from '../components/StorageUploader';
import { Modal } from '../components/Modal';
import { useRouter } from '../router';
import { MoonPhaseStrip } from '../components/MoonMotifs';
import { Plus, Search, Users } from 'lucide-react';

export const CharactersPage: React.FC = () => {
  const { isOwner } = useAuth();
  const { navigate } = useRouter();
  const [characters, setCharacters] = useState<CharacterItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal for adding new character
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formName, setFormName] = useState('');
  const [formTags, setFormTags] = useState('');
  const [formCoverUrl, setFormCoverUrl] = useState('');
  const [formMainImageUrl, setFormMainImageUrl] = useState('');
  const [formIntro, setFormIntro] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'characters'),
      (snapshot) => {
        if (!snapshot.empty) {
          const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as CharacterItem));
          list.sort((a, b) => (a.order || 0) - (b.order || 0));
          setCharacters(list);
        } else {
          setCharacters(INITIAL_CHARACTERS);
        }
        setLoading(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'characters');
      }
    );

    return () => unsubscribe();
  }, []);

  // Real-time filtering: Character name, keyword tags, work titles
  const filteredCharacters = useMemo(() => {
    if (!searchQuery.trim()) return characters;
    const query = searchQuery.trim().toLowerCase();

    return characters.filter((char) => {
      const matchName = char.name.toLowerCase().includes(query);
      const matchTags = char.keywordTags?.some((t) => t.toLowerCase().includes(query));
      const matchWorks = char.relatedWorks?.some((w) => w.title.toLowerCase().includes(query));
      return matchName || matchTags || matchWorks;
    });
  }, [characters, searchQuery]);

  const openAddModal = () => {
    setFormName('');
    setFormTags('');
    setFormCoverUrl('');
    setFormMainImageUrl('');
    setFormIntro('');
    setIsModalOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCoverUrl.trim()) {
      alert('커버 이미지를 등록해주세요.');
      return;
    }

    try {
      setSubmitting(true);
      const now = new Date().toISOString();
      const newId = `char-${Date.now()}`;
      const ref = doc(db, 'characters', newId);

      const tags = formTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const newChar: CharacterItem = {
        id: newId,
        name: formName.trim(),
        keywordTags: tags,
        coverUrl: formCoverUrl.trim(),
        mainImageUrl: formMainImageUrl.trim() || formCoverUrl.trim(),
        intro: formIntro.trim(),
        basicInfo: [],
        appearancePrompts: [],
        relationships: [],
        gallery: [],
        relatedWorks: [],
        relatedSongIds: [],
        order: characters.length + 1,
        createdAt: now,
      };

      await setDoc(ref, newChar);
      setIsModalOpen(false);
      navigate(`/characters/${newId}`);
    } catch (err) {
      alert('등록 중 오류가 발생했습니다: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
      {/* Editorial Page Header: Location name only */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-[rgba(11,31,75,0.12)] pb-6 mb-8">
        <div>
          <span className="font-editorial text-sm tracking-widest text-[#2F5BEA] uppercase block mb-1">
            03 / Archive
          </span>
          <h1 className="text-3xl sm:text-4xl font-semibold text-[#0B1F4B] tracking-tight">
            캐릭터
          </h1>
        </div>

        {isOwner && (
          <button
            onClick={openAddModal}
            className="mt-4 sm:mt-0 inline-flex items-center gap-1.5 px-4 py-2 bg-[#0B1F4B] text-white text-xs font-medium tracking-wide hover:bg-[#1D3FBB] transition-colors"
          >
            <Plus className="w-4 h-4" /> 캐릭터 추가
          </button>
        )}
      </div>

      {/* Top Search Bar: Real-time filtering by name, keywords, works */}
      <div className="relative mb-8 max-w-xl">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#0B1F4B]/40">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="이름, 키워드(태그), 작품 이름으로 검색..."
          className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-[rgba(11,31,75,0.18)] focus:border-[#1D3FBB] focus:outline-none placeholder:text-[#0B1F4B]/40 transition-colors shadow-sm"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-[#0B1F4B]/40 hover:text-[#0B1F4B]"
          >
            초기화
          </button>
        )}
      </div>

      {loading ? (
        <div className="py-20 text-center text-sm text-[#0B1F4B]/50 font-light">
          불러오는 중...
        </div>
      ) : filteredCharacters.length === 0 ? (
        <div className="py-24 text-center border border-dashed border-[rgba(11,31,75,0.15)] p-8">
          <Users className="w-8 h-8 mx-auto text-[#0B1F4B]/40 mb-3" />
          <p className="text-sm text-[#0B1F4B]/60">일치하는 캐릭터가 없습니다.</p>
        </div>
      ) : (
        /* 3-Column Block Grid: Strictly 3 columns even on mobile devices (scaling down) */
        <div className="grid grid-cols-3 gap-2 sm:gap-6">
          {filteredCharacters.map((char) => (
            <div
              key={char.id}
              onClick={() => navigate(`/characters/${char.id}`)}
              className="group relative cursor-pointer flex flex-col bg-[#FAF6EF] border border-[rgba(11,31,75,0.12)] p-2 sm:p-4 hover:border-[#1D3FBB] shadow-xs hover:shadow-md transition-all duration-300 overflow-hidden"
            >
              {/* Blue paper corner peek on hover */}
              <span
                className="absolute top-0 right-0 w-3.5 h-3.5 sm:w-5 sm:h-5 bg-[#1D3FBB] opacity-0 group-hover:opacity-100 transition-opacity duration-300 [clip-path:polygon(100%_0,0_0,100%_100%)] z-10"
                aria-hidden="true"
              />
              <span
                className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#2F5BEA] to-transparent opacity-0 group-hover:opacity-90 transition-opacity"
                aria-hidden="true"
              />

              {/* Cover Image Block */}
              <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#0B1F4B]/5 mb-2 sm:mb-3 border border-[rgba(11,31,75,0.06)]">
                <img
                  src={char.coverUrl}
                  alt={char.name}
                  loading="lazy"
                  className="w-full h-full object-cover object-center group-hover:scale-104 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-[#0B1F4B]/0 group-hover:bg-[#1D3FBB]/10 transition-colors duration-300" />
              </div>

              {/* Character Name & Tags */}
              <div className="text-center sm:text-left">
                <h2 className="text-xs sm:text-lg font-semibold text-[#0B1F4B] group-hover:text-[#1D3FBB] transition-colors truncate">
                  {char.name}
                </h2>
                {char.keywordTags && char.keywordTags.length > 0 && (
                  <p className="hidden sm:block text-[11px] text-[#0B1F4B]/55 truncate mt-0.5">
                    {char.keywordTags.map((t) => `#${t}`).join(' ')}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Character Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="새 캐릭터 추가"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold tracking-wider uppercase text-[#0B1F4B]/70 mb-1">
              캐릭터 이름 *
            </label>
            <input
              type="text"
              required
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="예: 이안 (Ian)"
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
            label="커버 이미지 (그리드 노출용) *"
            value={formCoverUrl}
            onChange={setFormCoverUrl}
            accept="image/*"
            folder="characters/covers"
            placeholder="https://... 또는 이미지 파일 업로드"
          />

          <StorageUploader
            label="대표 이미지 (상세 상단용, 미입력시 커버 동일)"
            value={formMainImageUrl}
            onChange={setFormMainImageUrl}
            accept="image/*"
            folder="characters/mains"
            placeholder="https://... 또는 이미지 파일 업로드"
          />

          <div>
            <label className="block text-xs font-semibold tracking-wider uppercase text-[#0B1F4B]/70 mb-1">
              소개글
            </label>
            <textarea
              rows={4}
              value={formIntro}
              onChange={(e) => setFormIntro(e.target.value)}
              placeholder="캐릭터의 서사와 설정을 입력하세요"
              className="w-full px-3 py-2 text-sm bg-white border border-[rgba(11,31,75,0.18)] focus:border-[#1D3FBB] focus:outline-none leading-relaxed"
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
              {submitting ? '생성 중...' : '캐릭터 생성'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
