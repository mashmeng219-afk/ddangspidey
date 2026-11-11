import React, { useState } from 'react';
import { SongItem, CharacterItem } from '../types';
import { Edit2, Trash2, GripVertical, Disc } from 'lucide-react';

interface CassetteTapeProps {
  song: SongItem;
  index: number;
  isCurrent: boolean;
  relatedCharacter?: CharacterItem | null;
  onSelectSong: (song: SongItem) => void;
  onDragStart: (e: React.DragEvent, song: SongItem) => void;
  onOpenEdit?: (song: SongItem) => void;
  onDelete?: (songId: string) => void;
  isOwner?: boolean;
}

// Preset rotation angles and paper label tints for natural scattered realism
const ROTATION_ANGLES = [-4.5, 3.5, -2, 5, -3.5, 4, -5, 2.5];
const LABEL_COLORS = [
  'bg-[#F6EFE3] text-[#0B1F4B]',
  'bg-[#FAF6EF] text-[#0B1F4B]',
  'bg-[#DCE9FF] text-[#0B1F4B]',
  'bg-[#E9F0FA] text-[#0B1F4B]',
];

export const CassetteTape: React.FC<CassetteTapeProps> = ({
  song,
  index,
  isCurrent,
  relatedCharacter,
  onSelectSong,
  onDragStart,
  onOpenEdit,
  onDelete,
  isOwner = false,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const angle = ROTATION_ANGLES[index % ROTATION_ANGLES.length];
  const labelColorClass = LABEL_COLORS[index % LABEL_COLORS.length];

  const handleContextMenu = (e: React.MouseEvent) => {
    if (isOwner) {
      e.preventDefault();
      setShowMenu((prev) => !prev);
    }
  };

  return (
    <div
      className="relative select-none group inline-block m-2 sm:m-3"
      style={{
        transform: isCurrent ? 'scale(0.92) opacity(0.35)' : `rotate(${angle}deg)`,
        transition: 'transform 0.3s ease, filter 0.3s ease',
      }}
      onContextMenu={handleContextMenu}
    >
      {/* TAPE CONTAINER: Draggable & Clickable */}
      <div
        draggable={!isCurrent}
        onDragStart={(e) => onDragStart(e, song)}
        onClick={() => onSelectSong(song)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelectSong(song);
          }
        }}
        tabIndex={0}
        role="button"
        aria-label={`${song.title} 카세트 테이프, 라디오에 넣으려면 클릭하거나 드래그하세요`}
        className={`relative w-[210px] sm:w-[240px] h-[130px] sm:h-[148px] bg-gradient-to-b from-[#1C2438] via-[#101726] to-[#0A0F1C] border border-white/20 rounded-lg p-2.5 shadow-[0_8px_18px_rgba(4,10,24,0.45)] hover:shadow-[0_14px_28px_rgba(29,63,187,0.35)] hover:-translate-y-1.5 transition-all cursor-grab active:cursor-grabbing focus:outline-none focus:ring-2 focus:ring-[#6FA8FF] ${
          isCurrent ? 'opacity-35 pointer-events-none' : ''
        }`}
      >
        {/* 4 Corner Screws */}
        <span className="absolute top-1.5 left-1.5 w-1.5 h-1.5 rounded-full bg-white/30 border border-black/40" />
        <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-white/30 border border-black/40" />
        <span className="absolute bottom-1.5 left-1.5 w-1.5 h-1.5 rounded-full bg-white/30 border border-black/40" />
        <span className="absolute bottom-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-white/30 border border-black/40" />

        {/* Vintage Paper Tape Label */}
        <div className={`relative w-full h-[66px] sm:h-[76px] ${labelColorClass} border border-[rgba(11,31,75,0.18)] rounded-xs p-2 flex flex-col justify-between shadow-xs overflow-hidden`}>
          {/* Top Label Line: Side A / Index */}
          <div className="flex items-center justify-between text-[9px] font-mono opacity-65 border-b border-[rgba(11,31,75,0.1)] pb-0.5">
            <span className="font-editorial uppercase tracking-widest">SIDE A</span>
            <span>NO. {(index + 1).toString().padStart(2, '0')}</span>
          </div>

          {/* Song Title on Cassette Label */}
          <div className="my-auto">
            <h3 className="text-xs sm:text-sm font-semibold tracking-tight truncate leading-tight">
              {song.title}
            </h3>
          </div>

          {/* Bottom Label Stripe */}
          <div className="flex items-center justify-between text-[8px] font-mono text-[#1D3FBB] opacity-80 pt-0.5">
            <span>TYPE I (NORMAL)</span>
            <span>HIGH OUTPUT</span>
          </div>
        </div>

        {/* Transparent Center Tape Window with Magnetic Ribbon & 2 Spools */}
        <div className="mt-2 w-full h-8 sm:h-9 bg-black/75 border border-white/10 rounded-xs flex items-center justify-around px-4 relative overflow-hidden">
          {/* Brown magnetic tape ribbon */}
          <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 h-2.5 bg-[#4A3222] border-y border-[#291B12] opacity-85" />

          {/* Left Spool Reel */}
          <div className="relative z-10 w-6 h-6 rounded-full bg-white/90 border border-gray-400 flex items-center justify-center">
            <div className="w-2.5 h-2.5 rounded-full bg-black/80" />
          </div>

          {/* Center Tape Level View */}
          <div className="relative z-10 text-[8px] font-mono text-white/50 tracking-widest">
            60 MIN
          </div>

          {/* Right Spool Reel */}
          <div className="relative z-10 w-6 h-6 rounded-full bg-white/90 border border-gray-400 flex items-center justify-center">
            <div className="w-2.5 h-2.5 rounded-full bg-black/80" />
          </div>
        </div>

        {/* Drag Handle Indicator */}
        <div className="absolute bottom-1 right-2 flex items-center gap-1 text-[9px] text-[#DCE9FF]/40 font-mono">
          <GripVertical className="w-3 h-3" />
          <span>DRAG</span>
        </div>
      </div>

      {/* ATTACHED POLAROID PHOTO SCRAP (Character image, if linked to a character) */}
      {relatedCharacter?.coverUrl && (
        <div
          className="absolute -top-3 -right-3 sm:-right-4 w-12 sm:w-14 h-15 sm:h-17 bg-[#FAF6EF] p-1 pb-2 border border-[rgba(11,31,75,0.15)] shadow-md pointer-events-none rotate-6 z-10"
          title={`관련 캐릭터: ${relatedCharacter.name}`}
        >
          {/* Paperclip Graphic */}
          <div className="absolute -top-1.5 left-2 w-2.5 h-4 border-2 border-slate-400 rounded-full bg-transparent" />
          <img
            src={relatedCharacter.coverUrl}
            alt={relatedCharacter.name}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Owner Context Action Menu (Edit / Delete) */}
      {isOwner && (
        <div className="absolute top-2 right-2 z-20 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onOpenEdit && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenEdit(song);
              }}
              className="p-1.5 bg-[#0B1F4B]/90 hover:bg-[#1D3FBB] text-white rounded shadow text-xs transition-colors"
              title="노래 수정"
            >
              <Edit2 className="w-3 h-3" />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(song.id);
              }}
              className="p-1.5 bg-red-600/90 hover:bg-red-700 text-white rounded shadow text-xs transition-colors"
              title="노래 삭제"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
