import {
  VideoItem,
  SongItem,
  CharacterItem,
  StoryItem,
  QuestionItem,
  HomeCardItem,
  NoticeItem,
  TalkItem,
} from '../types';

export const INITIAL_HOME_CARDS: HomeCardItem[] = [
  {
    id: 'card-intro',
    type: 'intro',
    title: 'Archive Record',
    subtitle: '기록자의 서재',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200&auto=format&fit=crop',
    text: '파란 새벽의 정적과 밤의 파편들을 수집하는 개인 아카이브입니다. 영상과 노래, 캐릭터의 서사를 하나의 공간에 조용히 기록해 나갑니다.',
    link: '/characters',
  },
  {
    id: 'card-notice',
    type: 'notice',
    title: '공지사항 안내',
    subtitle: '최신 업데이트',
    image: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?q=80&w=1200&auto=format&fit=crop',
    text: '신규 캐릭터 ‘노아’의 상세 설정과 새로운 비하인드 스토리 단편 2편이 서고에 추가되었습니다.',
    link: '/notices/notice-01',
  },
  {
    id: 'card-news',
    type: 'news',
    title: '신작소식: 달의 잔향',
    subtitle: 'New Release',
    image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1200&auto=format&fit=crop',
    text: '제7관측소의 새벽 풍경을 담은 첫 번째 오리지널 테마 트랙 음원과 가사가 공개되었습니다.',
    link: '/songs',
  },
];

export const INITIAL_NOTICES: NoticeItem[] = [];

export const INITIAL_TALKS: TalkItem[] = [
  {
    id: 'talk-01',
    title: '밤에 듣기 좋은 피아노 코드에 관하여',
    content: `세라의 테마곡을 작곡할 때 가장 신경 썼던 부분은 건반의 잔향이 사라지는 순간이었습니다.
완벽하게 조율된 그랜드 피아노보다, 낡은 업라이트 피아노에서 건반을 뗐을 때 댐퍼가 펠트를 누르며 나는 미세한 털썩임과 빗소리가 섞일 때 비로소 그 밤의 온도가 완성되는 기분이 들거든요.

다음 작업에서는 첼로의 피치카토를 섞어볼까 구상 중입니다.`,
    images: [
      'https://images.unsplash.com/photo-1520523839898-507127053c37?q=80&w=800&auto=format&fit=crop',
    ],
    date: '2026-03-09',
    createdAt: '2026-03-09T22:30:00Z',
  },
  {
    id: 'talk-02',
    title: '이안의 관측소 초기 스케치 노트',
    content: `처음 제7관측소를 구상했을 때는 눈 덮인 산꼭대기 천문대를 생각했었습니다.
하지만 파도 소리가 끝없이 귓가를 맴도는 망망대해의 외로운 등대 같은 형태가 이안의 성격과 훨씬 더 잘 어울린다는 것을 깨달았죠.

새벽 3시 40분마다 켜지는 옥상의 회전등, 그리고 오래된 구리빛 망원경. 스케치북 몇 장을 가득 채운 설정들을 조만간 갤러리에도 조금씩 풀어보겠습니다.`,
    images: [
      'https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=800&auto=format&fit=crop',
    ],
    date: '2026-03-04',
    createdAt: '2026-03-04T16:15:00Z',
  },
  {
    id: 'talk-03',
    title: '푸른색 잉크를 고르는 기준',
    content: `글을 쓸 때 쓰는 잉크는 두 가지 파란색을 번갈아 씁니다.
하나는 완전히 어두운 밤하늘색(Midnight Navy), 다른 하나는 빛이 비치면 코발트빛이 도는 블루(Royal Azure).

종이 위에 잉크가 젖어 들어가는 몇 초 동안의 그 색변화가 작업하는 사람에게 주는 고요한 위로가 있는 것 같습니다. 여러분은 어떤 색을 가장 오래 바라보고 계신가요?`,
    images: [
      'https://images.unsplash.com/photo-1455390582262-044cdead277a?q=80&w=800&auto=format&fit=crop',
    ],
    date: '2026-02-25',
    createdAt: '2026-02-25T13:00:00Z',
  },
];

export const INITIAL_VIDEOS: VideoItem[] = [
  {
    id: 'vid-01',
    title: 'Blue Horizon (Official Animation)',
    description: '어스름한 새벽의 기억과 끝없이 이어지는 지평선을 그린 단편 애니메이션.',
    youtubeUrl: 'https://www.youtube.com/watch?v=kJQP7kiw5Fk',
    youtubeId: 'kJQP7kiw5Fk',
    order: 1,
    createdAt: '2026-03-01T10:00:00Z',
  },
  {
    id: 'vid-02',
    title: 'Archive Memory Clip 02',
    description: '작업실에서 기록한 사운드스케이프와 비하인드 스케치 영상.',
    youtubeUrl: 'https://www.youtube.com/watch?v=5qap5aO4i9A',
    youtubeId: '5qap5aO4i9A',
    order: 2,
    createdAt: '2026-03-05T14:30:00Z',
  },
];

export const INITIAL_SONGS: SongItem[] = [
  {
    id: 'song-01',
    title: '달의 잔향 (Echo of the Moon)',
    audioUrl: 'https://commondatastorage.googleapis.com/codeskulptor-demos/DDR_assets/Kangaroo_MusiQue_-_The_Neverending_Story.mp3',
    coverUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=800&auto=format&fit=crop',
    lyrics: `차가운 밤공기 사이로
스며드는 오래된 기억
지워지지 않는 푸른빛 궤적을 따라
우리는 다시 걷는다.

침묵 속에 피어난
작은 촛불 하나
너의 숨결이 머문 자리마다
남겨진 이야기들.

영원하지 않아도 좋아
이 순간이 끝이어도
너와 나눈 밤의 멜로디는
별빛처럼 남아있을 테니.`,
    relatedCharacterIds: ['char-01'],
    order: 1,
    createdAt: '2026-03-02T12:00:00Z',
  },
  {
    id: 'song-02',
    title: 'Midnight Waltz #04',
    audioUrl: 'https://commondatastorage.googleapis.com/codeskulptor-assets/Epoq-Lepidoptera.ogg',
    coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=800&auto=format&fit=crop',
    lyrics: `그림자가 길어지는 자정
거리엔 우리 둘만의 왈츠
발걸음마다 흩어지는 네이비빛 꿈들

잊혀진 계절의 페이지를 넘기며
들려오는 희미한 속삭임
"우리는 여기에 있었어"`,
    relatedCharacterIds: ['char-02'],
    order: 2,
    createdAt: '2026-03-07T18:00:00Z',
  },
];

export const INITIAL_CHARACTERS: CharacterItem[] = [
  {
    id: 'char-01',
    name: '이안 (Ian)',
    keywordTags: ['기록자', '심해', '푸른빛', '관측소'],
    coverUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=800&auto=format&fit=crop',
    mainImageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=1200&auto=format&fit=crop',
    intro: '끝없는 바다 한가운데에 위치한 제7관측소의 마지막 기록원. 시간의 흐름 속에서 사라져가는 미세한 주파수와 빛을 수집하여 기록지에 남긴다. 감정을 쉽게 드러내지 않지만, 밤이 오면 낡은 오르골을 틀어놓고 별을 바라보는 버릇이 있다.',
    basicInfo: [
      { id: 'b-1', label: '나이', value: '24세' },
      { id: 'b-2', label: '성별', value: '남성' },
      { id: 'b-3', label: '키', value: '178cm' },
      { id: 'b-4', label: '생일', value: '11월 12일' },
      { id: 'b-5', label: '종족', value: '인간' },
      { id: 'b-6', label: '직업', value: '제7관측소 기록원' },
      { id: 'b-7', label: '소속', value: '등대연맹 천체관측과' },
      { id: 'b-8', label: '성격 키워드', value: '침착함, 과묵함, 섬세한 관찰력' },
    ],
    appearancePrompts: [
      {
        id: 'p-1',
        versionName: '기본 (제복)',
        mainPrompt: '1boy, Ian, deep navy observatory uniform with brass buttons, dark blue hair, calm grey eyes, holding leather logbook, misty ocean lighthouse balcony, soft morning dawn lighting, highly detailed anime illustration, masterpiece',
        negativePrompt: 'low quality, blurry, deformed fingers, bright sunlight, modern buildings',
        notes: 'NovelAI / NAI Diffusion v3 (Prompt weight 1.1, Steps 28, CFG 6.5)',
        isPublic: true,
      },
      {
        id: 'p-2',
        versionName: '사복 (관측소 일상)',
        mainPrompt: '1boy, oversized charcoal wool knit sweater, white shirt collar, messy dark blue hair, reading by candlelight, rain outside observatory window, cozy melancholic atmosphere',
        negativePrompt: 'bad anatomy, neon colors, text, watermark',
        notes: 'Midjourney v6, --ar 3:4 --stylize 150',
        isPublic: true,
      },
    ],
    relationships: [
      {
        targetCharacterId: 'char-02',
        relationName: '친구',
        description: '온실에서 왈츠를 연주하는 세라에게 밤마다 바다의 주파수 테이프를 보내주는 오랜 친구.',
      },
      {
        targetCharacterId: 'char-03',
        relationName: '동료',
        description: '관측소 보급선을 몰고 오는 항해사 노아. 미지의 바람과 해류 정보를 교환함.',
      },
    ],
    gallery: [
      {
        id: 'g-1',
        url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=800&auto=format&fit=crop',
        caption: '제7관측소 새벽의 바다 전경 (2026.02)',
      },
      {
        id: 'g-2',
        url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=800&auto=format&fit=crop',
        caption: '이안의 책상과 푸른 잉크병',
      },
      {
        id: 'g-3',
        url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=800&auto=format&fit=crop',
        caption: '별무리 관측 망원경',
      },
      {
        id: 'g-4',
        url: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?q=80&w=800&auto=format&fit=crop',
        caption: '밤일지 초안 노트',
      },
    ],
    relatedWorks: [
      {
        title: '단편 애니메이션: Blue Horizon',
        link: '/videos',
      },
      {
        title: '비하인드: 제7관측소의 마지막 밤',
        link: '/stories',
      },
    ],
    relatedSongIds: ['song-01'],
    order: 1,
    createdAt: '2026-03-01T08:00:00Z',
  },
  {
    id: 'char-02',
    name: '세라 (Sera)',
    keywordTags: ['피아니스트', '자정', '그림자', '유리온실'],
    coverUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=800&auto=format&fit=crop',
    mainImageUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=1200&auto=format&fit=crop',
    intro: '도심 외곽 버려진 온실에서 밤마다 아무도 듣지 않는 왈츠를 연주하는 음악가. 유리창에 부딪히는 빗소리에 맞춰 즉흥 연주를 녹음하는 것을 즐긴다.',
    basicInfo: [
      { id: 'b-1', label: '나이', value: '22세' },
      { id: 'b-2', label: '성별', value: '여성' },
      { id: 'b-3', label: '키', value: '164cm' },
      { id: 'b-4', label: '생일', value: '4월 19일' },
      { id: 'b-5', label: '종족', value: '인간' },
      { id: 'b-6', label: '직업', value: '온실 피아니스트' },
      { id: 'b-7', label: '소속', value: '무소속' },
      { id: 'b-8', label: '성격 키워드', value: '몽환적, 감수성, 장난기' },
    ],
    appearancePrompts: [
      {
        id: 'p-1',
        versionName: '기본 (온실 드레스)',
        mainPrompt: '1girl, Sera, ivory vintage lace dress, wavy light brown hair, playing antique upright piano, abandoned botanical greenhouse, raindrops on glass ceiling, night, moody cinematic blue lighting',
        negativePrompt: 'lowres, bad hands, modern electronics',
        notes: 'Midjourney v6, --ar 3:4',
        isPublic: true,
      },
    ],
    relationships: [
      {
        targetCharacterId: 'char-01',
        relationName: '친구',
        description: '이안이 보내준 바다 소리에 영감을 받아 자정의 왈츠 멜로디를 작곡해 들려줌.',
      },
      {
        targetCharacterId: 'char-03',
        relationName: '조력자',
        description: '노아가 먼 바다에서 건져 온 낡은 해양 악보들을 복원하고 연주해 주는 음악적 동반자.',
      },
    ],
    gallery: [
      {
        id: 'g-1',
        url: 'https://images.unsplash.com/photo-1520523839898-507127053c37?q=80&w=800&auto=format&fit=crop',
        caption: '낡은 업라이트 피아노 (2026.03)',
      },
      {
        id: 'g-2',
        url: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?q=80&w=800&auto=format&fit=crop',
        caption: '새벽의 서리 낀 온실 유리창',
      },
    ],
    relatedWorks: [
      {
        title: '비하인드: 유리온실의 자정 왈츠',
        link: '/stories',
      },
    ],
    relatedSongIds: ['song-02'],
    order: 2,
    createdAt: '2026-03-03T09:00:00Z',
  },
  {
    id: 'char-03',
    name: '노아 (Noah)',
    keywordTags: ['항해사', '청동나침반', '바람', '모노로그'],
    coverUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=800&auto=format&fit=crop',
    mainImageUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=1200&auto=format&fit=crop',
    intro: '바람의 방향을 온몸으로 읽는 청년. 지도에 표시되지 않은 섬을 찾아 작은 돛단배로 대양을 횡단하며 잊혀진 민담과 노래들을 병에 담아 수집한다.',
    basicInfo: [
      { id: 'b-1', label: '나이', value: '26세' },
      { id: 'b-2', label: '성별', value: '남성' },
      { id: 'b-3', label: '키', value: '182cm' },
      { id: 'b-4', label: '생일', value: '8월 7일' },
      { id: 'b-5', label: '종족', value: '인간' },
      { id: 'b-6', label: '직업', value: '자유 항해사' },
      { id: 'b-7', label: '소속', value: '방랑자 길드' },
      { id: 'b-8', label: '성격 키워드', value: '자유분방, 호기심, 대담함' },
    ],
    appearancePrompts: [
      {
        id: 'p-1',
        versionName: '기본 (항해복)',
        mainPrompt: '1boy, Noah, weathered leather coat, windblown brown hair, holding antique brass compass, standing on deck of wooden sailboat, vast deep ocean waves, stormy blue sky, highly detailed',
        negativePrompt: 'low quality, deformed hands',
        notes: 'NovelAI / NAI v3',
        isPublic: true,
      },
    ],
    relationships: [
      {
        targetCharacterId: 'char-01',
        relationName: '동료',
        description: '제7관측소에 정기 보급품을 전달하고 해도에 없는 항로를 함께 연구함.',
      },
      {
        targetCharacterId: 'char-02',
        relationName: '의뢰인',
        description: '외딴 무인도에서 수습한 빗물에 젖은 악보 조각들을 세라에게 전해줌.',
      },
    ],
    gallery: [
      {
        id: 'g-1',
        url: 'https://images.unsplash.com/photo-1498084393753-b411b2d26b34?q=80&w=800&auto=format&fit=crop',
        caption: '청동 나침반과 오래된 항해도',
      },
      {
        id: 'g-2',
        url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800&auto=format&fit=crop',
        caption: '파도가 멈춘 백사장 (2026.01)',
      },
    ],
    relatedWorks: [
      {
        title: '비하인드: 나침반이 가리키지 않는 곳',
        link: '/stories',
      },
    ],
    relatedSongIds: [],
    order: 3,
    createdAt: '2026-03-04T11:00:00Z',
  },
];

export const INITIAL_STORIES: StoryItem[] = [];

export const INITIAL_QUESTIONS: QuestionItem[] = [];
