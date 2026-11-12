export type HomeCardType = 'intro' | 'notice' | 'news';

export interface HomeCardItem {
  id: string;
  type: HomeCardType;
  title: string;
  subtitle?: string;
  image: string;
  text: string;
  link: string;
  updatedAt?: string;
}

export interface HeroCardItem {
  num: string;
  labelEn: string;
  labelKo: string;
  desc: string;
  href: string;
}

export interface SingleTalkDoc {
  text: string;
  images: string[];
  updatedAt?: string;
}

export interface NoticeItem {
  id: string;
  title: string;
  content: string;
  date: string;
  createdAt: string;
  updatedAt?: string;
}

export interface TalkItem {
  id: string;
  title: string;
  content: string;
  images: string[];
  date: string;
  createdAt: string;
  updatedAt?: string;
}

export interface VideoItem {
  id: string;
  title: string;
  description: string;
  youtubeUrl: string;
  youtubeId: string;
  order: number;
  createdAt: string;
  updatedAt?: string;
}

export interface SongItem {
  id: string;
  title: string;
  audioUrl: string;
  coverUrl?: string;
  audioPath?: string;
  coverPath?: string;
  lyrics: string;
  relatedCharacterIds?: string[];
  order: number;
  createdAt: string;
  updatedAt?: string;
}

export interface BasicInfoItem {
  id?: string;
  label: string;
  value: string;
}

export interface AppearancePromptItem {
  id?: string;
  versionName: string;
  mainPrompt: string;
  negativePrompt?: string;
  notes?: string;
  isPublic: boolean;
}

export interface CharacterRelationship {
  targetCharacterId: string;
  relationName: string;
  description?: string;
}

export interface GalleryItem {
  id?: string;
  url: string;
  caption?: string;
}

export interface RelatedWork {
  title: string;
  link: string;
}

export interface CharacterItem {
  id: string;
  name: string;
  keywordTags: string[];
  coverUrl: string;
  mainImageUrl: string;
  intro: string;
  basicInfo?: BasicInfoItem[];
  appearancePrompts?: AppearancePromptItem[];
  relationships?: CharacterRelationship[];
  gallery: GalleryItem[];
  relatedWorks: RelatedWork[];
  relatedSongIds?: string[];
  order: number;
  createdAt: string;
  updatedAt?: string;
}

export interface StoryItem {
  id: string;
  title: string;
  content: string;
  spineColor: string;
  order: number;
  createdAt: string;
  updatedAt?: string;
}

export interface QuestionItem {
  id: string;
  question: string;
  answer?: string;
  answered: boolean;
  createdAt: string;
  answeredAt?: string;
}
