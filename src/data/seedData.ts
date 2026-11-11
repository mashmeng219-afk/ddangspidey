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

export const INITIAL_NOTICES: NoticeItem[] = [
  {
    id: 'notice-01',
    title: '봄맞이 아카이브 정기 업데이트 안내',
    content: `안녕하세요, 기록자입니다.

봄을 맞아 아카이브의 전반적인 레이아웃 개편과 함께 신규 콘텐츠가 대거 추가되었습니다.

1. 신규 캐릭터 '노아 (Noah)'의 배경 서사 및 갤러리 공개
2. 비하인드 스토리 서고에 신규 단편 소설 2편 '나침반이 가리키지 않는 곳', '푸른 잉크의 레시피' 꽂힘
3. 음원 플레이어 탐색바 최적화 및 가사 뷰어 개선

앞으로도 잔잔하고 깊이 있는 기록들을 꾸준히 축적해 나가겠습니다. 찾아와 주셔서 감사합니다.`,
    date: '2026-03-10',
    createdAt: '2026-03-10T09:00:00Z',
  },
  {
    id: 'notice-02',
    title: '익명 질문함 운영 방침 및 답변 주기 안내',
    content: `익명 질문함에 보내주시는 따뜻한 관심에 감사드립니다.

- 질문은 50자 이내로 자유롭게 작성하실 수 있습니다.
- 답변은 주 1~2회 일괄 정리하여 공개 답변 목록에 게시됩니다.
- 개인적인 작업 과정, 캐릭터 설정 질문 등을 환영합니다.`,
    date: '2026-03-05',
    createdAt: '2026-03-05T14:00:00Z',
  },
  {
    id: 'notice-03',
    title: '스토리 서고 블루 에디션 오픈',
    content: `전통적인 우드톤 대신 아카이브의 시그니처 컬러인 딥 네이비와 로열 블루를 입힌 가상 서고가 문을 열었습니다. 각 책등을 클릭하여 책을 꺼내 읽듯 편안하게 소설을 감상해 보세요.`,
    date: '2026-02-28',
    createdAt: '2026-02-28T18:00:00Z',
  },
  {
    id: 'notice-04',
    title: '오디오 트랙 고음질 스트리밍 안내',
    content: `오리지널 트랙들의 스트리밍 음질이 개선되었습니다. 이제 모바일 환경에서도 끊김 없이 깔끔한 사운드로 감상하실 수 있습니다.`,
    date: '2026-02-20',
    createdAt: '2026-02-20T11:00:00Z',
  },
  {
    id: 'notice-05',
    title: '아카이브 리뉴얼 및 반응형 최적화 완료',
    content: `모바일과 태블릿, 데스크톱 전 기기에서 최적의 비율로 3열 캐릭터 그리드와 12컬럼 에디토리얼 레이아웃을 제공하도록 화면 구성을 재조정했습니다.`,
    date: '2026-02-15',
    createdAt: '2026-02-15T10:00:00Z',
  },
];

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

export const INITIAL_STORIES: StoryItem[] = [
  {
    id: 'story-01',
    title: '제7관측소의 마지막 밤',
    content: `바다는 어둠보다 더 짙은 침묵으로 물들어 있었다.
시계의 초침이 벽을 두드리는 소리만이 방 안의 유일한 생명 신호였다.

이안은 잉크가 마른 펜촉을 다시 병에 담갔다. 푸른빛이 도는 흑색 잉크. 수십 년간 관측소의 모든 기록을 남겨온 바로 그 색상이었다.

"오늘 밤 02시 14분, 동쪽 수평선에서 알 수 없는 3.4Hz의 파동이 12초간 관측됨."

손가락 끝에 닿는 종이의 감촉은 서늘했다.
바람이 창틀을 흔들 때마다, 창문 너머로 부서지는 파도의 포말이 하얗게 빛났다. 그 포말 너머에 무엇이 있는지 아는 사람은 아무도 없었다. 누구도 묻지 않았고, 누구도 답을 구하려 하지 않았으니까.

하지만 이안에게는 이 고요함이 전부였다. 아무도 기억하지 않을 순간들을 적어두는 일. 언젠가 이 관측소가 파도에 잠겨 흔적조차 사라진다 해도, 이 기록 어딘가에 한 사람이 새벽을 온전히 지켰다는 증거는 남아있을 것이다.

그는 창문을 열었다. 차갑고 짠 바닷바람이 뺨을 스쳤다.
저 멀리 수평선에서 첫 새벽빛이 푸른 베일을 벗기 시작하고 있었다.`,
    spineColor: '#0B1F4B',
    order: 1,
    createdAt: '2026-03-01T00:00:00Z',
  },
  {
    id: 'story-02',
    title: '유리온실의 자정 왈츠',
    content: `빗방울이 유리 천장을 두드리는 소리는 완벽한 3박자였다.
탁, 타닥, 탁.

세라는 낡은 피아노 앞에 앉아 건반 위에 손을 올렸다. 튜닝이 어긋난 건반들이 묘한 불협화음을 만들어냈지만, 그녀는 그 불협화음이야말로 비 오는 밤에 가장 잘 어울린다고 생각했다.

첫 번째 코드가 울리자 온실 안의 무성한 고사리 잎들이 미세하게 떨렸다.
도심의 불빛은 이곳까지 닿지 않았다. 오직 희미한 가로등 빛만이 온실 유리를 통과해 긴 그림자를 드리울 뿐이었다.

그녀의 왈츠는 누구에게 들려주기 위한 것이 아니었다.
다만 흐르는 시간을 조금 더 느리게, 부드럽게 흘려보내기 위한 주문이었다.

새벽 세 시, 마지막 페달에서 발을 뗐을 때 비는 마침내 잦아들었다. 온실 안에는 흙냄새와 물비린내, 그리고 아직 가라앉지 않은 피아노 현의 잔향만이 감돌고 있었다.`,
    spineColor: '#1D3FBB',
    order: 2,
    createdAt: '2026-03-03T00:00:00Z',
  },
  {
    id: 'story-03',
    title: '나침반이 가리키지 않는 곳',
    content: `지도 제작자들은 언제나 경계선을 그린다.
여기까지는 땅이고, 여기서부터는 바다라고.

하지만 바다 위에서 배를 띄우고 나면 그 선들은 아무런 의미도 없어진다. 물결은 국경을 알지 못하고, 바람은 어떤 조약에도 서명하지 않는다.

노아는 나침반의 덮개를 열었다. 자침은 북쪽을 가리키고 있었지만, 그가 가고 싶은 곳은 북쪽이 아니었다.
"바람이 부는 곳으로 가야 해."

돛을 높이 올렸다. 배 밑바닥을 가르는 파도의 저항감이 발바닥을 통해 온몸으로 전해졌다.
아무런 이정표도 없는 망망대해에서 나아갈 수 있는 유일한 힘은, 목적지가 존재한다는 믿음뿐이다.

그 믿음 하나로, 노아는 다시 한번 노를 단단히 쥐었다.`,
    spineColor: '#2F5BEA',
    order: 3,
    createdAt: '2026-03-05T00:00:00Z',
  },
  {
    id: 'story-04',
    title: '푸른 잉크의 레시피',
    content: `가장 깊은 바다의 색을 종이에 담기 위해선 세 가지가 필요하다.
첫째, 달빛이 들지 않는 밤에 빻은 코발트 광물 가루.
둘째, 새벽 다섯 시에 채취한 이슬 세 방울.
그리고 셋째, 결코 말로 전하지 못한 감정 한 줌.

이 레시피는 오래된 연금술 책 귀퉁이에 낙서처럼 적혀 있었다.
우리는 매일 글을 쓰지만, 정작 가장 중요한 단어는 종이 위에 올리지 못한다.

그래서 푸른 잉크는 늘 마르기 전까지 짙은 검은색을 띠다가, 종이의 섬유 속으로 깊숙이 침투하고 나서야 비로소 은은한 푸른빛을 드러낸다. 비밀처럼, 조용하게.`,
    spineColor: '#1A365D',
    order: 4,
    createdAt: '2026-03-08T00:00:00Z',
  },
];

export const INITIAL_QUESTIONS: QuestionItem[] = [
  {
    id: 'q-01',
    question: '주로 어떤 시간에 영감을 받아 작업하시나요?',
    answer: '자정부터 새벽 3시 사이의 고요한 시간을 가장 좋아합니다. 세상의 모든 소음이 잦아들었을 때 떠오르는 생각들을 모아 기록하고 있어요.',
    answered: true,
    createdAt: '2026-03-06T11:00:00Z',
    answeredAt: '2026-03-06T15:20:00Z',
  },
  {
    id: 'q-02',
    question: '캐릭터들의 세계관은 하나의 이야기로 연결되나요?',
    answer: '네, 이안의 관측소와 세라의 온실, 노아의 바다는 모두 같은 하늘 아래 다른 장소들입니다. 곳곳에 숨겨둔 접점들을 찾아보시면 더 재미있으실 거예요.',
    answered: true,
    createdAt: '2026-03-07T09:30:00Z',
    answeredAt: '2026-03-07T12:10:00Z',
  },
];
