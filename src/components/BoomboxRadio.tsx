import React from 'react';
import { SongItem } from '../types';
import { Play, Pause, Disc, Volume2, VolumeX, FileText } from 'lucide-react';

interface BoomboxRadioProps {
  currentSong: SongItem | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isDragOver: boolean;
  onDropSong: (e: React.DragEvent) => void;
  onDragOverDeck: (e: React.DragEvent) => void;
  onDragLeaveDeck: () => void;
  onTogglePlay: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (vol: number) => void;
  onEject: () => void;
  onToggleLyrics: () => void;
  isLyricsOpen: boolean;
}

export const BoomboxRadio: React.FC<BoomboxRadioProps> = ({
  currentSong,
  isPlaying,
  currentTime,
  duration,
  volume,
  isDragOver,
  onDropSong,
  onDragOverDeck,
  onDragLeaveDeck,
  onTogglePlay,
  onSeek,
  onVolumeChange,
  onEject,
  onToggleLyrics,
  isLyricsOpen,
}) => {
  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="relative w-full max-w-[620px] mx-auto select-none">
      {/* BOOMBOX BODY CONTAINER */}
      <div
        className="relative bg-gradient-to-b from-[#18233C] via-[#0E1A33] to-[#081226] border-2 border-[rgba(220,233,255,0.25)] rounded-2xl p-5 sm:p-7 shadow-[0_20px_50px_rgba(4,10,26,0.65),inset_0_1px_1px_rgba(255,255,255,0.25)]"
        style={{
          boxShadow: isDragOver
            ? '0 0 35px rgba(111, 168, 255, 0.75), inset 0 0 20px rgba(111, 168, 255, 0.3)'
            : undefined,
        }}
      >
        {/* Top Boombox Handle with Metallic Brackets */}
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-44 sm:w-60 h-6 border-t-4 border-x-4 border-[#3D527D] rounded-t-xl bg-gradient-to-b from-[#2B3B5E] to-transparent pointer-events-none" />

        {/* Boombox Header Bar: Analog Tuner Display & Status LEDs */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#1D3FBB] border border-[#6FA8FF] shadow-[0_0_8px_#6FA8FF]" />
            <span className="font-editorial text-xs sm:text-sm tracking-widest text-[#DCE9FF]/80 uppercase">
              ARCHIVE STEREO DECK
            </span>
          </div>

          {/* VU Meter & Frequency Needle */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-black/40 rounded border border-white/10 font-mono text-[10px] text-[#6FA8FF]">
            <span className="text-[#DCE9FF]/60">FM</span>
            <span>89.5 MHz</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-1" />
          </div>
        </div>

        {/* MAIN PANEL: Left Speaker, Center Cassette Deck, Right Speaker */}
        <div className="grid grid-cols-12 gap-3 sm:gap-4 items-center">
          {/* Left Speaker */}
          <div className="col-span-3 flex flex-col items-center justify-center">
            <div
              className={`relative w-20 h-20 sm:w-28 sm:h-28 rounded-full bg-gradient-to-br from-[#12192B] to-[#080D1A] border-2 border-white/15 flex items-center justify-center shadow-inner ${
                isPlaying ? 'animate-speaker-vibe' : ''
              }`}
            >
              {/* Speaker Grille Rings */}
              <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-full border border-white/10 flex items-center justify-center">
                <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-[#1A2644] border border-[#6FA8FF]/30 flex items-center justify-center">
                  <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-[#2F5BEA]" />
                </div>
              </div>
            </div>
            <span className="font-mono text-[9px] text-[#DCE9FF]/40 tracking-wider mt-2 uppercase">
              CH-L
            </span>
          </div>

          {/* Center: Cassette Insertion Deck (Interactive Dropzone & Clickable Lyrics Trigger) */}
          <div className="col-span-6 flex flex-col items-center">
            <div
              onDrop={onDropSong}
              onDragOver={onDragOverDeck}
              onDragLeave={onDragLeaveDeck}
              onClick={currentSong ? onToggleLyrics : undefined}
              className={`relative w-full aspect-[16/10] bg-black/70 border-2 rounded-lg p-2.5 sm:p-3 transition-all duration-300 flex flex-col justify-between overflow-hidden cursor-pointer ${
                isDragOver
                  ? 'border-[#6FA8FF] bg-[#1D3FBB]/20 shadow-[0_0_24px_rgba(111,168,255,0.7)] scale-[1.02]'
                  : currentSong
                  ? 'border-[#2F5BEA]/60 hover:border-[#6FA8FF] shadow-lg'
                  : 'border-white/20 border-dashed hover:border-white/40'
              }`}
              title={currentSong ? '한 번 더 클릭하면 가사가 펼쳐집니다' : '테이프를 이곳으로 드래그하거나 아래 테이프를 클릭하세요'}
            >
              {/* Acrylic Window Reflection Overlay */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.04] to-white/[0.1] pointer-events-none" />

              {/* Top Slot Status Label */}
              <div className="relative z-10 flex items-center justify-between text-[10px] font-mono text-[#DCE9FF]/75">
                <span>{currentSong ? 'TAPE LOADED' : 'SLOT EMPTY'}</span>
                {currentSong && (
                  <span className="text-[#6FA8FF] flex items-center gap-1">
                    <FileText className="w-3 h-3" />
                    <span>{isLyricsOpen ? '가사 닫기' : '가사 보기'}</span>
                  </span>
                )}
              </div>

              {/* Center Deck Interior: Two Rotating Spindles */}
              <div className="relative z-10 my-auto w-full flex items-center justify-around py-1">
                {/* Left Spool */}
                <div
                  className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-white/30 bg-[#152038] flex items-center justify-center ${
                    isPlaying ? 'animate-cassette-spin' : ''
                  }`}
                >
                  <div className="w-5 h-5 rounded-full bg-white/40 border border-black/50 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-black/80" />
                  </div>
                </div>

                {/* Tape Bridge Tape Display */}
                {currentSong ? (
                  <div className="px-2 py-1 bg-[#1D3FBB] text-white text-center rounded max-w-[130px] sm:max-w-[150px] shadow-sm">
                    <p className="text-[11px] sm:text-xs font-semibold truncate leading-tight">
                      {currentSong.title}
                    </p>
                  </div>
                ) : (
                  <div className="text-center px-1">
                    <p className="text-[10px] sm:text-[11px] text-[#DCE9FF]/50 font-light">
                      {isDragOver ? '여기에 놓으세요!' : '테이프를 삽입구에 드래그'}
                    </p>
                  </div>
                )}

                {/* Right Spool */}
                <div
                  className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-white/30 bg-[#152038] flex items-center justify-center ${
                    isPlaying ? 'animate-cassette-spin' : ''
                  }`}
                >
                  <div className="w-5 h-5 rounded-full bg-white/40 border border-black/50 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-black/80" />
                  </div>
                </div>
              </div>

              {/* Bottom Deck Indicator */}
              <div className="relative z-10 flex items-center justify-between text-[9px] font-mono text-[#DCE9FF]/50 border-t border-white/10 pt-1">
                <span>HEAD DECK AUTO-REVERSE</span>
                <span>{currentSong ? formatTime(currentTime) : '--:--'}</span>
              </div>
            </div>
          </div>

          {/* Right Speaker */}
          <div className="col-span-3 flex flex-col items-center justify-center">
            <div
              className={`relative w-20 h-20 sm:w-28 sm:h-28 rounded-full bg-gradient-to-bl from-[#12192B] to-[#080D1A] border-2 border-white/15 flex items-center justify-center shadow-inner ${
                isPlaying ? 'animate-speaker-vibe' : ''
              }`}
            >
              {/* Speaker Grille Rings */}
              <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-full border border-white/10 flex items-center justify-center">
                <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-[#1A2644] border border-[#6FA8FF]/30 flex items-center justify-center">
                  <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-[#2F5BEA]" />
                </div>
              </div>
            </div>
            <span className="font-mono text-[9px] text-[#DCE9FF]/40 tracking-wider mt-2 uppercase">
              CH-R
            </span>
          </div>
        </div>

        {/* BOTTOM CONTROLS STRIP (Play, Scrubber, Volume, Eject) */}
        <div className="mt-5 pt-4 border-t border-white/15 space-y-3">
          {/* Progress Scrubber */}
          <div className="flex items-center gap-2 text-xs font-mono text-[#DCE9FF]/70">
            <span className="w-10 text-right text-[11px]">{formatTime(currentTime)}</span>
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              disabled={!currentSong}
              onChange={(e) => onSeek(parseFloat(e.target.value))}
              className="flex-1 h-1.5 bg-black/50 rounded-lg appearance-none cursor-pointer accent-[#6FA8FF] disabled:opacity-40"
            />
            <span className="w-10 text-[11px]">{formatTime(duration)}</span>
          </div>

          {/* Functional Buttons: Play/Pause, Eject, Volume Slider, Lyrics Toggle */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2">
              {/* Play / Pause Button */}
              <button
                type="button"
                onClick={onTogglePlay}
                disabled={!currentSong}
                className="px-4 py-2 bg-gradient-to-r from-[#1D3FBB] to-[#2F5BEA] hover:from-[#2F5BEA] hover:to-[#6FA8FF] text-white rounded font-medium text-xs flex items-center gap-1.5 shadow-md disabled:opacity-40 disabled:pointer-events-none transition-all active:scale-95"
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isPlaying ? '일시정지' : '재생'}</span>
              </button>

              {/* Eject Button */}
              <button
                type="button"
                onClick={onEject}
                disabled={!currentSong}
                className="px-3 py-2 bg-white/10 hover:bg-white/20 text-[#DCE9FF] rounded text-xs flex items-center gap-1 transition-colors disabled:opacity-30 disabled:pointer-events-none"
                title="카세트 테이프 꺼내기"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="12 4 4 14 20 14" />
                  <rect x="4" y="17" width="16" height="3" />
                </svg>
                <span className="hidden sm:inline">꺼내기</span>
              </button>

              {/* Lyrics Panel Toggle Button */}
              {currentSong?.lyrics && (
                <button
                  type="button"
                  onClick={onToggleLyrics}
                  className={`px-3 py-2 rounded text-xs flex items-center gap-1 transition-colors ${
                    isLyricsOpen
                      ? 'bg-[#6FA8FF] text-[#0B1F4B] font-semibold'
                      : 'bg-white/10 hover:bg-white/20 text-[#DCE9FF]'
                  }`}
                  title="가사 보기"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>가사</span>
                </button>
              )}
            </div>

            {/* Volume Control */}
            <div className="flex items-center gap-2 text-[#DCE9FF]/80">
              <button
                type="button"
                onClick={() => onVolumeChange(volume === 0 ? 0.8 : 0)}
                className="p-1 hover:text-white"
                title={volume === 0 ? '음소거 해제' : '음소거'}
              >
                {volume === 0 ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={volume}
                onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                className="w-16 sm:w-20 h-1.5 bg-black/50 rounded appearance-none cursor-pointer accent-[#6FA8FF]"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
