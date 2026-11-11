import React from 'react';
import { AuthProvider } from './context/AuthContext';
import { RouterProvider, useRouter } from './router';
import { Header } from './components/Header';
import { HomePage } from './pages/HomePage';
import { VideosPage } from './pages/VideosPage';
import { SongsPage } from './pages/SongsPage';
import { CharactersPage } from './pages/CharactersPage';
import { CharacterDetailPage } from './pages/CharacterDetailPage';
import { StoriesPage } from './pages/StoriesPage';
import { StoryDetailPage } from './pages/StoryDetailPage';
import { QuestionsPage } from './pages/QuestionsPage';
import { NoticesPage } from './pages/NoticesPage';
import { NoticeDetailPage } from './pages/NoticeDetailPage';
import { LoginPage } from './pages/LoginPage';
import { MoonPhaseStrip } from './components/MoonMotifs';

const MainContent: React.FC = () => {
  const { path, params } = useRouter();

  let pageContent: React.ReactNode = null;

  if (path === '/') {
    pageContent = <HomePage />;
  } else if (path === '/videos') {
    pageContent = <VideosPage />;
  } else if (path === '/songs') {
    pageContent = <SongsPage />;
  } else if (path === '/characters') {
    pageContent = <CharactersPage />;
  } else if (path.startsWith('/characters/') && params.id) {
    pageContent = <CharacterDetailPage characterId={params.id} />;
  } else if (path === '/stories') {
    pageContent = <StoriesPage />;
  } else if (path.startsWith('/stories/') && params.id) {
    pageContent = <StoryDetailPage storyId={params.id} />;
  } else if (path === '/questions') {
    pageContent = <QuestionsPage />;
  } else if (path === '/notices') {
    pageContent = <NoticesPage />;
  } else if (path.startsWith('/notices/') && params.id) {
    pageContent = <NoticeDetailPage noticeId={params.id} />;
  } else if (path === '/talks' || path.startsWith('/talks/')) {
    pageContent = <HomePage />;
  } else if (path === '/login') {
    pageContent = <LoginPage />;
  } else {
    pageContent = <HomePage />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FBFBFA] text-[#0B1F4B]">
      <Header />
      <main className="flex-1">{pageContent}</main>
      <footer className="relative border-t border-[rgba(11,31,75,0.1)] py-10 bg-[#FAF6EF] text-[#0B1F4B]">
        <div className="max-w-6xl mx-auto px-4 flex flex-col items-center gap-5">
          {/* Moon phase strip ornament */}
          <MoonPhaseStrip className="text-[#1D3FBB] opacity-80" size={16} glowColor="rgba(47, 91, 234, 0.3)" />

          <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#0B1F4B]/50 font-light pt-2 border-t border-[rgba(11,31,75,0.06)]">
            <span className="font-editorial text-[11px] tracking-widest uppercase text-[#0B1F4B]/70">
              01 Video · 02 Song · 03 Character · 04 Story · 05 Question
            </span>
            <span className="text-[11px] font-mono">
              Archive © {new Date().getFullYear()}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider>
        <MainContent />
      </RouterProvider>
    </AuthProvider>
  );
}
