/**
 * 10種類のキャラクター定義データ
 */
const CHARACTERS = [
  {
    id: 1,
    name: "クマさん",
    color: "#FF9F43",
    bgLight: "#FFF5E6",
    balloonColor: "#FFEAA7",
    icon: `<svg viewBox="0 0 100 100" width="100%" height="100%">
      <circle cx="22" cy="22" r="14" fill="#E67E22"/>
      <circle cx="78" cy="22" r="14" fill="#E67E22"/>
      <circle cx="22" cy="22" r="8" fill="#FAD7A0"/>
      <circle cx="78" cy="22" r="8" fill="#FAD7A0"/>
      <circle cx="50" cy="55" r="38" fill="#F39C12"/>
      <ellipse cx="50" cy="64" rx="16" ry="12" fill="#FAD7A0"/>
      <ellipse cx="50" cy="58" rx="6" ry="4" fill="#2C3E50"/>
      <circle cx="36" cy="48" r="4" fill="#2C3E50"/>
      <circle cx="64" cy="48" r="4" fill="#2C3E50"/>
      <path d="M 46 64 Q 50 68 54 64" stroke="#2C3E50" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    </svg>`
  },
  {
    id: 2,
    name: "ウサちゃん",
    color: "#FF78B6",
    bgLight: "#FFEBF3",
    balloonColor: "#FFD3E2",
    icon: `<svg viewBox="0 0 100 100" width="100%" height="100%">
      <ellipse cx="32" cy="22" rx="10" ry="24" fill="#FF85C0"/>
      <ellipse cx="68" cy="22" rx="10" ry="24" fill="#FF85C0"/>
      <ellipse cx="32" cy="24" rx="5" ry="16" fill="#FFD6E7"/>
      <ellipse cx="68" cy="24" rx="5" ry="16" fill="#FFD6E7"/>
      <circle cx="50" cy="60" r="34" fill="#FFADD2"/>
      <ellipse cx="50" cy="67" rx="12" ry="8" fill="#FFFFFF"/>
      <polygon points="50,63 46,60 54,60" fill="#FF4D4F"/>
      <circle cx="36" cy="54" r="4" fill="#2C3E50"/>
      <circle cx="64" cy="54" r="4" fill="#2C3E50"/>
      <ellipse cx="28" cy="60" rx="5" ry="3" fill="#FF7875" opacity="0.6"/>
      <ellipse cx="72" cy="60" rx="5" ry="3" fill="#FF7875" opacity="0.6"/>
    </svg>`
  },
  {
    id: 3,
    name: "ニャンコ",
    color: "#54A0FF",
    bgLight: "#EBF3FF",
    balloonColor: "#C7ECEE",
    icon: `<svg viewBox="0 0 100 100" width="100%" height="100%">
      <polygon points="18,18 40,32 16,48" fill="#48DBFB"/>
      <polygon points="82,18 60,32 84,48" fill="#48DBFB"/>
      <polygon points="22,24 36,34 20,44" fill="#FFD6E7"/>
      <polygon points="78,24 64,34 80,44" fill="#FFD6E7"/>
      <circle cx="50" cy="58" r="35" fill="#00D2D3"/>
      <ellipse cx="50" cy="66" rx="14" ry="9" fill="#FFFFFF"/>
      <polygon points="50,62 46,59 54,59" fill="#FF6B6B"/>
      <ellipse cx="35" cy="52" rx="4" ry="5" fill="#2C3E50"/>
      <ellipse cx="65" cy="52" rx="4" ry="5" fill="#2C3E50"/>
      <circle cx="36" cy="50" r="1.5" fill="#FFFFFF"/>
      <circle cx="66" cy="50" r="1.5" fill="#FFFFFF"/>
      <!-- ヒゲ -->
      <line x1="18" y1="58" x2="32" y2="60" stroke="#2C3E50" stroke-width="2"/>
      <line x1="16" y1="66" x2="32" y2="65" stroke="#2C3E50" stroke-width="2"/>
      <line x1="82" y1="58" x2="68" y2="60" stroke="#2C3E50" stroke-width="2"/>
      <line x1="84" y1="66" x2="68" y2="65" stroke="#2C3E50" stroke-width="2"/>
    </svg>`
  },
  {
    id: 4,
    name: "ワンコ",
    color: "#10AC84",
    bgLight: "#E6F7F2",
    balloonColor: "#55E6C1",
    icon: `<svg viewBox="0 0 100 100" width="100%" height="100%">
      <ellipse cx="18" cy="48" rx="12" ry="22" fill="#8395A7"/>
      <ellipse cx="82" cy="48" rx="12" ry="22" fill="#8395A7"/>
      <circle cx="50" cy="55" r="36" fill="#C8D6E5"/>
      <ellipse cx="50" cy="65" rx="16" ry="12" fill="#FFFFFF"/>
      <ellipse cx="50" cy="59" rx="7" ry="5" fill="#2C3E50"/>
      <circle cx="36" cy="48" r="4" fill="#2C3E50"/>
      <circle cx="64" cy="48" r="4" fill="#2C3E50"/>
      <path d="M 50 64 L 50 72 Q 44 76 42 70" stroke="#2C3E50" stroke-width="2.5" fill="none"/>
      <path d="M 50 72 Q 56 76 58 70" stroke="#2C3E50" stroke-width="2.5" fill="none"/>
    </svg>`
  },
  {
    id: 5,
    name: "ライオン丸",
    color: "#EE5253",
    bgLight: "#FFEAEB",
    balloonColor: "#FF7675",
    icon: `<svg viewBox="0 0 100 100" width="100%" height="100%">
      <!-- たてがみ -->
      <circle cx="50" cy="50" r="46" fill="#FF9F43"/>
      <!-- 顔 -->
      <circle cx="50" cy="54" r="32" fill="#FECA57"/>
      <circle cx="28" cy="30" r="8" fill="#FF9F43"/>
      <circle cx="72" cy="30" r="8" fill="#FF9F43"/>
      <ellipse cx="50" cy="62" rx="14" ry="10" fill="#FFF"/>
      <polygon points="50,57 44,53 56,53" fill="#2C3E50"/>
      <circle cx="36" cy="48" r="4" fill="#2C3E50"/>
      <circle cx="64" cy="48" r="4" fill="#2C3E50"/>
      <path d="M 44 65 Q 50 70 56 65" stroke="#2C3E50" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    </svg>`
  },
  {
    id: 6,
    name: "ペンちゃん",
    color: "#2E86DE",
    bgLight: "#E8F2FD",
    balloonColor: "#74B9FF",
    icon: `<svg viewBox="0 0 100 100" width="100%" height="100%">
      <circle cx="50" cy="52" r="38" fill="#2C3E50"/>
      <ellipse cx="50" cy="58" rx="26" ry="28" fill="#FFFFFF"/>
      <!-- くちばし -->
      <polygon points="50,48 40,58 60,58" fill="#FF9F43"/>
      <circle cx="36" cy="42" r="4" fill="#2C3E50"/>
      <circle cx="64" cy="42" r="4" fill="#2C3E50"/>
      <circle cx="37" cy="41" r="1.5" fill="#FFFFFF"/>
      <circle cx="65" cy="41" r="1.5" fill="#FFFFFF"/>
      <ellipse cx="28" cy="52" rx="5" ry="3" fill="#FF7875" opacity="0.5"/>
      <ellipse cx="72" cy="52" rx="5" ry="3" fill="#FF7875" opacity="0.5"/>
    </svg>`
  },
  {
    id: 7,
    name: "パンダ君",
    color: "#576574",
    bgLight: "#F1F2F6",
    balloonColor: "#DFE4EA",
    icon: `<svg viewBox="0 0 100 100" width="100%" height="100%">
      <circle cx="22" cy="24" r="14" fill="#2C3E50"/>
      <circle cx="78" cy="24" r="14" fill="#2C3E50"/>
      <circle cx="50" cy="55" r="36" fill="#FFFFFF" stroke="#F1F2F6" stroke-width="2"/>
      <!-- 目のまわり黒目かこみ -->
      <ellipse cx="34" cy="48" rx="10" ry="12" fill="#2C3E50" transform="rotate(-15 34 48)"/>
      <ellipse cx="66" cy="48" rx="10" ry="12" fill="#2C3E50" transform="rotate(15 66 48)"/>
      <circle cx="35" cy="46" r="3.5" fill="#FFFFFF"/>
      <circle cx="65" cy="46" r="3.5" fill="#FFFFFF"/>
      <ellipse cx="50" cy="62" rx="6" ry="4" fill="#2C3E50"/>
      <path d="M 45 68 Q 50 72 55 68" stroke="#2C3E50" stroke-width="2" fill="none"/>
    </svg>`
  },
  {
    id: 8,
    name: "コンちゃん",
    color: "#FF9F1C",
    bgLight: "#FFF4E5",
    balloonColor: "#FFC048",
    icon: `<svg viewBox="0 0 100 100" width="100%" height="100%">
      <polygon points="15,12 42,35 12,50" fill="#FF9F1C"/>
      <polygon points="85,12 58,35 88,50" fill="#FF9F1C"/>
      <polygon points="20,18 36,34 18,44" fill="#FFFFFF"/>
      <polygon points="80,18 64,34 82,44" fill="#FFFFFF"/>
      <circle cx="50" cy="56" r="35" fill="#FF9F1C"/>
      <path d="M 20 62 Q 50 88 80 62 Q 50 92 20 62" fill="#FFFFFF"/>
      <ellipse cx="50" cy="64" rx="5" ry="4" fill="#2C3E50"/>
      <ellipse cx="36" cy="48" rx="3.5" ry="5" fill="#2C3E50"/>
      <ellipse cx="64" cy="48" rx="3.5" ry="5" fill="#2C3E50"/>
    </svg>`
  },
  {
    id: 9,
    name: "ホウちゃん",
    color: "#9A59B5",
    bgLight: "#F5EEF8",
    balloonColor: "#D8B5FF",
    icon: `<svg viewBox="0 0 100 100" width="100%" height="100%">
      <circle cx="50" cy="52" r="38" fill="#8E44AD"/>
      <!-- 大きな目 -->
      <circle cx="34" cy="45" r="14" fill="#FFFFFF"/>
      <circle cx="66" cy="45" r="14" fill="#FFFFFF"/>
      <circle cx="34" cy="45" r="6" fill="#2C3E50"/>
      <circle cx="66" cy="45" r="6" fill="#2C3E50"/>
      <circle cx="36" cy="43" r="2" fill="#FFFFFF"/>
      <circle cx="68" cy="43" r="2" fill="#FFFFFF"/>
      <!-- くちばし -->
      <polygon points="50,52 44,64 56,64" fill="#F39C12"/>
      <!-- お腹の羽模様 -->
      <path d="M 40 70 Q 50 65 60 70 M 42 76 Q 50 71 58 76" stroke="#D8B5FF" stroke-width="2.5" fill="none"/>
    </svg>`
  },
  {
    id: 10,
    name: "ロボ君",
    color: "#00CEC9",
    bgLight: "#E6FAF9",
    balloonColor: "#81ECEC",
    icon: `<svg viewBox="0 0 100 100" width="100%" height="100%">
      <line x1="50" y1="10" x2="50" y2="25" stroke="#00CEC9" stroke-width="4"/>
      <circle cx="50" cy="10" r="5" fill="#FF7675"/>
      <rect x="18" y="25" width="64" height="55" rx="10" fill="#00CEC9"/>
      <rect x="25" y="33" width="50" height="24" rx="5" fill="#2D3436"/>
      <circle cx="38" cy="45" r="5" fill="#74B9FF"/>
      <circle cx="62" cy="45" r="5" fill="#74B9FF"/>
      <rect x="30" y="65" width="40" height="6" rx="3" fill="#FFFFFF"/>
      <line x1="36" y1="65" x2="36" y2="71" stroke="#2D3436" stroke-width="2"/>
      <line x1="50" y1="65" x2="50" y2="71" stroke="#2D3436" stroke-width="2"/>
      <line x1="64" y1="65" x2="64" y2="71" stroke="#2D3436" stroke-width="2"/>
    </svg>`
  }
];

function getCharacterById(id) {
  const numId = parseInt(id, 10);
  return CHARACTERS.find(c => c.id === numId) || CHARACTERS[0];
}
