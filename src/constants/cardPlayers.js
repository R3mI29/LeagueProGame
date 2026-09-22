// Pool de cartes du mode "Draft aux packs" — calibré sur l'historique compétitif réel.
// Échelle impitoyable : 90+ réservé aux performances historiques majeures.

export const RARITIES = ['Commune', 'Rare', 'Épique', 'Légendaire', 'WANTED'];

// Probabilités de tirage par emplacement de carte dans un pack (en %).
export const RARITY_WEIGHTS = {
  Commune: 620,
  Rare: 280,
  'Épique': 80,
  'Légendaire': 15,
  WANTED : 5
};

export const RARITY_COLORS = {
  Commune: '#8b9bb4',
  Rare: '#00e5ff',
  'Épique': '#ff3366',
  'Légendaire': '#ffd700',
  WANTED: '#ffffff'
};

export const CARD_POOL = [
  // ==========================================
  // --- TOPLANE ---
  // ==========================================
  {
    "id": "zeus-t1-academy",
    "baseName": "Zeus",
    "variant": "T1 Academy Zeus",
    "role": "Top",
    "rating": 72,
    "rarity": "Commune"
  },
  {
    "id": "zeus-t1-2023",
    "baseName": "Zeus",
    "variant": "T1 Zeus",
    "role": "Top",
    "rating": 86,
    "rarity": "Rare"
  },
  {
    "id": "hle-zeus",
    "baseName": "Zeus",
    "variant": "HLE Zeus",
    "role": "Top",
    "rating": 87,
    "rarity": "Rare",
    "image": "/cardsImg/2026-players/hle_zeus.webp"
  },
  {
    "id": "zeus-worlds-2023",
    "baseName": "Zeus",
    "variant": "World Champion Zeus",
    "role": "Top",
    "rating": 91,
    "rarity": "Épique"
  },
  {
    "id": "zeus-mvp-2023",
    "baseName": "Zeus",
    "variant": "Worlds MVP Zeus",
    "role": "Top",
    "rating": 92,
    "rarity": "Légendaire"
  },
  {
    "id": "bin-suning",
    "baseName": "Bin",
    "variant": "Suning Bin",
    "role": "Top",
    "rating": 81,
    "rarity": "Commune"
  },
  {
    "id": "bin-blg-2024",
    "baseName": "Bin",
    "variant": "BLG Bin",
    "role": "Top",
    "rating": 88,
    "rarity": "Rare"
  },
  {
    "id": "bin-FirstStand-2026",
    "baseName": "Bin",
    "variant": "First Stand MVP Bin",
    "role": "Top",
    "rating": 90,
    "rarity": "Épique",
    "image": "/cardsImg/others/firststand_mvp_bin.png"
  },
  {
    "id": "bin-lpl-mvp",
    "baseName": "Bin",
    "variant": "LPL Finals MVP Bin",
    "role": "Top",
    "rating": 91,
    "rarity": "Légendaire"
  },
  {
    "id": "369-tes-2020",
    "baseName": "369",
    "variant": "TES 369",
    "role": "Top",
    "rating": 79,
    "rarity": "Commune"
  },
  {
    "id": "369-jdg-2023",
    "baseName": "369",
    "variant": "JDG 369",
    "role": "Top",
    "rating": 87,
    "rarity": "Rare"
  },
  {
    "id": "369-lpl-champion",
    "baseName": "369",
    "variant": "LPL Champion 369",
    "role": "Top",
    "rating": 86,
    "rarity": "Épique"
  },
  {
    "id": "kiin-afreeca",
    "baseName": "Kiin",
    "variant": "Afreeca Kiin",
    "role": "Top",
    "rating": 82,
    "rarity": "Commune"
  },
  {
    "id": "kiin-geng-2024",
    "baseName": "Kiin",
    "variant": "Gen.G Kiin",
    "role": "Top",
    "rating": 88,
    "rarity": "Rare"
  },
  {
    "id": "kiin-lck-mvp",
    "baseName": "Kiin",
    "variant": "LCK Finals MVP Kiin",
    "role": "Top",
    "rating": 90,
    "rarity": "Épique"
  },
  {
    "id": "brokenblade-s04",
    "baseName": "BrokenBlade",
    "variant": "S04 BrokenBlade",
    "role": "Top",
    "rating": 74,
    "rarity": "Commune"
  },
  {
    "id": "brokenblade-g2",
    "baseName": "BrokenBlade",
    "variant": "G2 BrokenBlade",
    "role": "Top",
    "rating": 82,
    "rarity": "Rare",
    "image": "/cardsImg/2026-players/g2_brokenblade.webp"
  },
  {
    "id": "adam-kcorp",
    "baseName": "Adam",
    "variant": "KCorp Adam",
    "role": "Top",
    "rating": 71,
    "rarity": "Commune"
  },
  {
    "id": "adam-bds",
    "baseName": "Adam",
    "variant": "BDS Adam",
    "role": "Top",
    "rating": 76,
    "rarity": "Rare"
  },
  {
    "id": "impact-skt",
    "baseName": "Impact",
    "variant": "SKT T1 Impact",
    "role": "Top",
    "rating": 81,
    "rarity": "Commune"
  },
  {
    "id": "impact-tl",
    "baseName": "Impact",
    "variant": "TL Impact",
    "role": "Top",
    "rating": 77,
    "rarity": "Rare"
  },
  {
    "id": "doran-griffin",
    "baseName": "Doran",
    "variant": "Griffin Doran",
    "role": "Top",
    "rating": 73,
    "rarity": "Commune"
  },
  {
    "id": "doran-geng",
    "baseName": "Doran",
    "variant": "Gen.G Doran",
    "role": "Top",
    "rating": 83,
    "rarity": "Rare"
  },
  {
    "id": "doran-lck-champ",
    "baseName": "Doran",
    "variant": "LCK Champion Doran",
    "role": "Top",
    "rating": 84,
    "rarity": "Épique"
  },
  {
    "id": "wunder-splyce",
    "baseName": "Wunder",
    "variant": "Splyce Wunder",
    "role": "Top",
    "rating": 72,
    "rarity": "Commune"
  },
  {
    "id": "wunder-g2",
    "baseName": "Wunder",
    "variant": "MSI Champion Wunder",
    "role": "Top",
    "rating": 87,
    "rarity": "Rare"
  },

  // ==========================================
  // --- JUNGLE ---
  // ==========================================
  {
    "id": "canyon-dwg-2019",
    "baseName": "Canyon",
    "variant": "Damwon Canyon",
    "role": "Jungle",
    "rating": 79,
    "rarity": "Commune"
  },
  {
    "id": "canyon-geng-2024",
    "baseName": "Canyon",
    "variant": "Gen.G Canyon",
    "role": "Jungle",
    "rating": 88,
    "rarity": "Rare"
  },
  {
    "id": "canyon-worlds-2020",
    "baseName": "Canyon",
    "variant": "World Champion Canyon",
    "role": "Jungle",
    "rating": 92,
    "rarity": "Épique"
  },
  {
    "id": "canyon-mvp-2020",
    "baseName": "Canyon",
    "variant": "Worlds MVP Canyon",
    "role": "Jungle",
    "rating": 93,
    "rarity": "Légendaire"
  },
  {
    "id": "kanavi-griffin",
    "baseName": "Kanavi",
    "variant": "Griffin Kanavi",
    "role": "Jungle",
    "rating": 70,
    "rarity": "Commune"
  },
  {
    "id": "kanavi-jdg-2023",
    "baseName": "Kanavi",
    "variant": "JDG Kanavi",
    "role": "Jungle",
    "rating": 88,
    "rarity": "Rare"
  },
  {
    "id": "kanavi-msi-2023",
    "baseName": "Kanavi",
    "variant": "MSI Champion Kanavi",
    "role": "Jungle",
    "rating": 90,
    "rarity": "Épique"
  },
  {
    "id": "kanavi-lpl-mvp",
    "baseName": "Kanavi",
    "variant": "LPL MVP Kanavi",
    "role": "Jungle",
    "rating": 91,
    "rarity": "Légendaire"
  },
  {
    "id": "painter-t1-2026-sub",
    "baseName": "Painter",
    "variant": "T1 Painter",
    "role": "Jungle",
    "rating": 66,
    "rarity": "Commune",
    "image": "/cardsImg/2026-players/T1_Painter.webp"
  },
  {
    "id": "oner-t1-academy",
    "baseName": "Oner",
    "variant": "T1 Academy Oner",
    "role": "Jungle",
    "rating": 71,
    "rarity": "Commune"
  },
  {
    "id": "oner-t1-2022",
    "baseName": "Oner",
    "variant": "T1 Oner",
    "role": "Jungle",
    "rating": 85,
    "rarity": "Rare"
  },
  {
    "id": "oner-worlds-2023",
    "baseName": "Oner",
    "variant": "World Champion Oner",
    "role": "Jungle",
    "rating": 90,
    "rarity": "Épique"
  },
  {
    "id": "peanut-rox",
    "baseName": "Peanut",
    "variant": "ROX Peanut",
    "role": "Jungle",
    "rating": 86,
    "rarity": "Commune"
  },
  {
    "id": "peanut-hle",
    "baseName": "Peanut",
    "variant": "HLE Peanut",
    "role": "Jungle",
    "rating": 85,
    "rarity": "Rare"
  },
  {
    "id": "peanut-lck-mvp",
    "baseName": "Peanut",
    "variant": "LCK MVP Peanut",
    "role": "Jungle",
    "rating": 88,
    "rarity": "Épique"
  },
  {
    "id": "tian-fpx",
    "baseName": "Tian",
    "variant": "FPX Tian",
    "role": "Jungle",
    "rating": 84,
    "rarity": "Commune"
  },
  {
    "id": "tian-tes",
    "baseName": "Tian",
    "variant": "TES Tian",
    "role": "Jungle",
    "rating": 82,
    "rarity": "Rare"
  },
  {
    "id": "tian-mvp",
    "baseName": "Tian",
    "variant": "Worlds MVP Tian",
    "role": "Jungle",
    "rating": 90,
    "rarity": "Épique"
  },
  {
    "id": "elyoya-mad",
    "baseName": "Elyoya",
    "variant": "MAD Elyoya",
    "role": "Jungle",
    "rating": 81,
    "rarity": "Rare"
  },
  {
    "id": "yike-ldlc",
    "baseName": "Yike",
    "variant": "LDLC Yike",
    "role": "Jungle",
    "rating": 72,
    "rarity": "Commune"
  },
  {
    "id": "yike-g2",
    "baseName": "Yike",
    "variant": "G2 Yike",
    "role": "Jungle",
    "rating": 81,
    "rarity": "Rare"
  },
  {
    "id": "blg-xun",
    "baseName": "Xun",
    "variant": "BLG Xun",
    "role": "Jungle",
    "rating": 85,
    "rarity": "Rare",
    "image": "/cardsImg/2026-players/blg_xun.webp"
  },
  {
    "id": "jankos-h2k",
    "baseName": "Jankos",
    "variant": "H2K Jankos",
    "role": "Jungle",
    "rating": 79,
    "rarity": "Commune"
  },
  {
    "id": "jankos-g2",
    "baseName": "Jankos",
    "variant": "G2 Jankos",
    "role": "Jungle",
    "rating": 87,
    "rarity": "Rare"
  },
  {
    "id": "razork-misfits",
    "baseName": "Razork",
    "variant": "Misfits Razork",
    "role": "Jungle",
    "rating": 74,
    "rarity": "Commune"
  },
  {
    "id": "razork-fnc",
    "baseName": "Razork",
    "variant": "Fnatic Razork",
    "role": "Jungle",
    "rating": 80,
    "rarity": "Rare"
  },

  // ==========================================
  // --- MIDLANE ---
  // ==========================================
  {
    "id": "sk-serin",
    "baseName": "Serin",
    "variant": "SK Serin",
    "role": "Mid",
    "rating": 59,
    "rarity": "Commune",
    "image": "/cardsImg/2026-players/SK_serin.webp"
  },
  {
    "id": "faker-t1-2022",
    "baseName": "Faker",
    "variant": "T1 Faker",
    "role": "Mid",
    "rating": 86,
    "rarity": "Rare",
    "image": "/cardsImg/others/faker_T1.png"
  },
  {
    "id": "faker-4x-champ",
    "baseName": "Faker",
    "variant": "World Champion Faker",
    "role": "Mid",
    "rating": 92,
    "rarity": "Épique",
    "image": "/cardsImg/others/T1_faker_2023.png"
  },
  {
    "id": "faker-hall-of-legends",
    "baseName": "Faker",
    "variant": "Unkillable Demon King Faker",
    "role": "Mid",
    "rating": 99,
    "rarity": "WANTED",
    "image": "/cardsImg/others/faker_UDK2.jpg"
  },
  {
    "id": "nongshim-scout",
    "baseName": "Scout",
    "variant": "NS Scout",
    "role": "Mid",
    "rating": 73,
    "rarity": "Commune",
    "image": "/cardsImg/2026-players/NS_scout.webp"
  },
  {
    "id": "chovy-geng-2023",
    "baseName": "Chovy",
    "variant": "Gen.G Chovy",
    "role": "Mid",
    "rating": 87,
    "rarity": "Rare",
    "image": "/cardsImg/2026-players/geng_chovy.webp"
  },
  {
    "id": "chovy-msi-2024",
    "baseName": "Chovy",
    "variant": "MSI Champion Chovy",
    "role": "Mid",
    "rating": 91,
    "rarity": "Épique"
  },
  {
    "id": "chovy-4peat",
    "baseName": "Chovy",
    "variant": "LCK Champion Chovy",
    "role": "Mid",
    "rating": 90,
    "rarity": "Légendaire"
  },
  {
    "id": "GX-jackies",
    "baseName": "Jackies",
    "variant": "GX Jackies",
    "role": "Mid",
    "rating": 69,
    "rarity": "Commune",
    "image": "/cardsImg/2026-players/GX_jackies.webp"
  },
  {
    "id": "showmaker-dk-2024",
    "baseName": "ShowMaker",
    "variant": "DK ShowMaker",
    "role": "Mid",
    "rating": 83,
    "rarity": "Rare",
    "image": "/cardsImg/2026-players/dk_showmaker.webp"
  },
  {
    "id": "showmaker-worlds-2020",
    "baseName": "ShowMaker",
    "variant": "World Champion ShowMaker",
    "role": "Mid",
    "rating": 91,
    "rarity": "Épique"
  },
  {
    "id": "showmaker-DK-icon",
    "baseName": "ShowMaker",
    "variant": "Mentor ShowMaker",
    "role": "Mid",
    "rating": 96,
    "rarity": "WANTED",
    "image": "/cardsImg/others/showmaker_mentor.jpg"
  },
  {
    "id": "shifters-nuc",
    "baseName": "Nuc",
    "variant": "SHFT Nuc",
    "role": "Mid",
    "rating": 65,
    "rarity": "Commune",
    "image": "/cardsImg/2026-players/SHFT_nuc.webp"
  },
  {
    "id": "knight-blg-2024",
    "baseName": "Knight",
    "variant": "BLG Knight",
    "role": "Mid",
    "rating": 87,
    "rarity": "Rare",
    "image": "/cardsImg/2026-players/blg_knight.webp"
  },
  {
    "id": "kc-kyeahoo-2026",
    "baseName": "Kyeahoo",
    "variant": "KC Kyeahoo",
    "role": "Mid",
    "rating": 77,
    "rarity": "Rare",
    "image": "/cardsImg/2026-players/kc_kyeahoo.webp"
  },
  {
    "id": "knight-msi-2023",
    "baseName": "Knight",
    "variant": "MSI Champion Knight",
    "role": "Mid",
    "rating": 90,
    "rarity": "Épique"
  },
  {
    "id": "knight-lpl-mvp",
    "baseName": "Knight",
    "variant": "LPL Finals MVP Knight",
    "role": "Mid",
    "rating": 90,
    "rarity": "Légendaire"
  },
  {
    "id": "DRX_ucal",
    "baseName": "Ucal",
    "variant": "DRX Ucal",
    "role": "Mid",
    "rating": 69,
    "rarity": "Commune",
    "image": "/cardsImg/2026-players/DRX_ucal.webp"
  },
  {
    "id": "rookie-ig",
    "baseName": "Rookie",
    "variant": "IG Rookie",
    "role": "Mid",
    "rating": 84,
    "rarity": "Rare",
    "image": "/cardsImg/2026-players/IG_rookie.webp"
  },
  {
    "id": "rookie-worlds-2018",
    "baseName": "Rookie",
    "variant": "World Champion Rookie",
    "role": "Mid",
    "rating": 93,
    "rarity": "Épique"
  },
  {
    "id": "fnc-vladi",
    "baseName": "Vladi",
    "variant": "FNC Vladi",
    "role": "Mid",
    "rating": 71,
    "rarity": "Commune",
    "image": "/cardsImg/2026-players/FNC_vladi.webp"
  },
  {
    "id": "caps-g2-2024",
    "baseName": "Caps",
    "variant": "G2 Caps",
    "role": "Mid",
    "rating": 83,
    "rarity": "Rare",
    "image": "/cardsImg/2026-players/g2_caps.webp"
  },
  {
    "id": "caps-msi-mvp",
    "baseName": "Caps",
    "variant": "MSI MVP Caps",
    "role": "Mid",
    "rating": 90,
    "rarity": "Épique",
    "image": "/cardsImg/others/msi_mvp_caps.png"
  },
  {
    "id": "FEARX-vicla",
    "baseName": "Vicla",
    "variant": "FRX Vicla",
    "role": "Mid",
    "rating": 70,
    "rarity": "Commune",
    "image": "/cardsImg/2026-players/FEARX_vicla.webp"
  },
  {
    "id": "nisqy-c9",
    "baseName": "Nisqy",
    "variant": "C9 Nisqy",
    "role": "Mid",
    "rating":80,
    "rarity": "Rare",
    "image": "/cardsImg/others/cloud9_nisqy.png"

  },
  {
    "id": "navi_poby",
    "baseName": "Poby",
    "variant": "Navi Poby",
    "role": "Mid",
    "rating": 65,
    "rarity": "Commune",
    "image": "/cardsImg/2026-players/navi_poby.webp"
  },
  {
    "id": "bdd-kt",
    "baseName": "Bdd",
    "variant": "KT Bdd",
    "role": "Mid",
    "rating": 82,
    "rarity": "Rare",
    "image": "/cardsImg/2026-players/KT_bdd.webp"
  },
  {
    "id": "bdd-lck-mvp",
    "baseName": "Bdd",
    "variant": "LCK MVP Bdd",
    "role": "Mid",
    "rating": 88,
    "rarity": "Épique"
  },
  {
    "id": "larssen-RGE",
    "baseName": "Larssen",
    "variant": "LEC Champion Larssen",
    "role": "Mid",
    "rating": 78,
    "rarity": "Rare",
    "image": "/cardsImg/others/larssen_lec_champ.png"
  },
  {
    "id": "BRO-roamer",
    "baseName": "Roamer",
    "variant": "BRO Roamer",
    "role": "Mid",
    "rating": 63,
    "rarity": "Commune",
    "image": "/cardsImg/2026-players/BRO_roamer.webp"
  },
  {
    "id": "DNS_clozer",
    "baseName": "Clozer",
    "variant": "DNS Clozer",
    "role": "Mid",
    "rating": 64,
    "rarity": "Commune",
    "image": "/cardsImg/2026-players/DNS_clozer.webp"
  },

  // ==========================================
  // --- ADC ---
  // ==========================================
  {
    "id": "ruler-ssg",
    "baseName": "Ruler",
    "variant": "SSG Ruler",
    "role": "ADC",
    "rating": 89,
    "rarity": "Commune",
    "image": "/cardsImg/others/ssg_ruler.png"
  },
  {
    "id": "ruler-jdg-2023",
    "baseName": "Ruler",
    "variant": "JDG Ruler",
    "role": "ADC",
    "rating": 90,
    "rarity": "Rare"
  },
  {
    "id": "ruler-msi-2023",
    "baseName": "Ruler",
    "variant": "MSI Champion Ruler",
    "role": "ADC",
    "rating": 91,
    "rarity": "Épique"
  },
  {
    "id": "ruler-worlds-mvp",
    "baseName": "Ruler",
    "variant": "Worlds MVP Ruler",
    "role": "ADC",
    "rating": 92,
    "rarity": "Légendaire"
  },
  {
    "id": "viper-griffin",
    "baseName": "Viper",
    "variant": "Griffin Viper",
    "role": "ADC",
    "rating": 85,
    "rarity": "Commune"
  },
  {
    "id": "viper-hle-2024",
    "baseName": "Viper",
    "variant": "HLE Viper",
    "role": "ADC",
    "rating": 88,
    "rarity": "Rare"
  },
  {
    "id": "viper-blg-2026",
    "baseName": "Viper",
    "variant": "BLG Viper",
    "role": "ADC",
    "rating": 88,
    "rarity": "Rare"
  },
  {
    "id": "viper-worlds-2021",
    "baseName": "Viper",
    "variant": "World Champion Viper",
    "role": "ADC",
    "rating": 92,
    "rarity": "Épique"
  },
  {
    "id": "viper-lpl-mvp",
    "baseName": "Viper",
    "variant": "LPL MVP Viper",
    "role": "ADC",
    "rating": 91,
    "rarity": "Légendaire"
  },
  {
    "id": "gumayusi-academy",
    "baseName": "Gumayusi",
    "variant": "T1 Academy Gumayusi",
    "role": "ADC",
    "rating": 72,
    "rarity": "Commune"
  },
  {
    "id": "gumayusi-t1-2022",
    "baseName": "Gumayusi",
    "variant": "T1 Gumayusi",
    "role": "ADC",
    "rating": 86,
    "rarity": "Rare",
    "image": "/cardsImg/webp/t1_gumayusi.webp"
  },
  {
    "id": "gumayusi-worlds-2023",
    "baseName": "Gumayusi",
    "variant": "World Champion Gumayusi",
    "role": "ADC",
    "rating": 91,
    "rarity": "Épique"
  },
  {
    "id": "gumayusi-franchise",
    "baseName": "Gumayusi",
    "variant": "Franchise Player Gumayusi",
    "role": "ADC",
    "rating": 88,
    "rarity": "Légendaire"
  },
  {
    "id": "elk-we",
    "baseName": "Elk",
    "variant": "WE Elk",
    "role": "ADC",
    "rating": 77,
    "rarity": "Commune"
  },
  {
    "id": "elk-blg-2024",
    "baseName": "Elk",
    "variant": "BLG Elk",
    "role": "ADC",
    "rating": 87,
    "rarity": "Rare"
  },
  {
    "id": "elk-lpl-mvp",
    "baseName": "Elk",
    "variant": "LPL MVP Elk",
    "role": "ADC",
    "rating": 88,
    "rarity": "Épique"
  },
  {
    "id": "jackeylove-ig",
    "baseName": "JackeyLove",
    "variant": "IG JackeyLove",
    "role": "ADC",
    "rating": 86,
    "rarity": "Commune"
  },
  {
    "id": "jackeylove-tes-2024",
    "baseName": "JackeyLove",
    "variant": "TES JackeyLove",
    "role": "ADC",
    "rating": 85,
    "rarity": "Rare"
  },
  {
    "id": "jackeylove-worlds",
    "baseName": "JackeyLove",
    "variant": "World Champion JackeyLove",
    "role": "ADC",
    "rating": 89,
    "rarity": "Épique"
  },
  {
    "id": "peyz-challengers",
    "baseName": "Peyz",
    "variant": "Gen.G Academy Peyz",
    "role": "ADC",
    "rating": 72,
    "rarity": "Commune"
  },
  {
    "id": "peyz-geng-2024",
    "baseName": "Peyz",
    "variant": "Gen.G Peyz",
    "role": "ADC",
    "rating": 86,
    "rarity": "Rare"
  },
  {
    "id": "peyz-finals-mvp",
    "baseName": "Peyz",
    "variant": "LCK Finals MVP Peyz",
    "role": "ADC",
    "rating": 87,
    "rarity": "Épique"
  },
  {
    "id": "caliste-kcb",
    "baseName": "Caliste",
    "variant": "KCB Caliste",
    "role": "ADC",
    "rating": 72,
    "rarity": "Commune"
  },
  {
    "id": "caliste-kcorp-2024",
    "baseName": "Caliste",
    "variant": "KC Caliste",
    "role": "ADC",
    "rating": 77,
    "rarity": "Rare",
    "image": "/cardsImg/2026-players/kc_caliste.webp"
  },
  {
    "id": "hanssama-misfits",
    "baseName": "Hans Sama",
    "variant": "Misfits Hans Sama",
    "role": "ADC",
    "rating": 78,
    "rarity": "Commune"
  },
  {
    "id": "hanssama-g2",
    "baseName": "Hans Sama",
    "variant": "G2 Hans-Sama",
    "role": "ADC",
    "rating": 82,
    "rarity": "Rare"
  },
  {
    "id": "upset-s04",
    "baseName": "Upset",
    "variant": "S04 Upset",
    "role": "ADC",
    "rating": 76,
    "rarity": "Commune"
  },
  {
    "id": "upset-kcorp",
    "baseName": "Upset",
    "variant": "KC Upset",
    "role": "ADC",
    "rating": 73,
    "rarity": "Rare"
  },

  // ==========================================
  // --- SUPPORT ---
  // ==========================================
  {
    "id": "keria-drx",
    "baseName": "Keria",
    "variant": "DRX Keria",
    "role": "Support",
    "rating": 82,
    "rarity": "Commune"
  },
  {
    "id": "keria-t1-2022",
    "baseName": "Keria",
    "variant": "T1 Keria",
    "role": "Support",
    "rating": 90,
    "rarity": "Rare"
  },
  {
    "id": "keria-worlds-2023",
    "baseName": "Keria",
    "variant": "World Champion Keria",
    "role": "Support",
    "rating": 91,
    "rarity": "Épique"
  },
  {
    "id": "keria-lck-mvp",
    "baseName": "Keria",
    "variant": "LCK MVP Keria",
    "role": "Support",
    "rating": 91,
    "rarity": "Légendaire"
  },
  {
    "id": "missing-we",
    "baseName": "Missing",
    "variant": "WE Missing",
    "role": "Support",
    "rating": 76,
    "rarity": "Commune"
  },
  {
    "id": "missing-jdg-2023",
    "baseName": "Missing",
    "variant": "JDG Missing",
    "role": "Support",
    "rating": 87,
    "rarity": "Rare"
  },
  {
    "id": "missing-msi-2023",
    "baseName": "Missing",
    "variant": "MSI Champion Missing",
    "role": "Support",
    "rating": 88,
    "rarity": "Épique"
  },
  {
    "id": "delight-brion",
    "baseName": "Delight",
    "variant": "BRION Delight",
    "role": "Support",
    "rating": 74,
    "rarity": "Commune"
  },
  {
    "id": "delight-geng",
    "baseName": "Delight",
    "variant": "Gen.G Delight",
    "role": "Support",
    "rating": 84,
    "rarity": "Rare"
  },
  {
    "id": "delight-hle-2024",
    "baseName": "Delight",
    "variant": "HLE Delight",
    "role": "Support",
    "rating": 87,
    "rarity": "Épique"
  },
  {
    "id": "lehends-griffin",
    "baseName": "Lehends",
    "variant": "Griffin Lehends",
    "role": "Support",
    "rating": 81,
    "rarity": "Commune"
  },
  {
    "id": "lehends-geng-2024",
    "baseName": "Lehends",
    "variant": "Gen.G Lehends",
    "role": "Support",
    "rating": 89,
    "rarity": "Rare"
  },
  {
    "id": "lehends-lck-mvp",
    "baseName": "Lehends",
    "variant": "LCK MVP Lehends",
    "role": "Support",
    "rating": 90,
    "rarity": "Épique"
  },
  {
    "id": "mikyx-splyce",
    "baseName": "Mikyx",
    "variant": "Splyce Mikyx",
    "role": "Support",
    "rating": 73,
    "rarity": "Commune"
  },
  {
    "id": "mikyx-g2-2024",
    "baseName": "Mikyx",
    "variant": "G2 Mikyx",
    "role": "Support",
    "rating": 81,
    "rarity": "Rare"
  },
  {
    "id": "mikyx-msi-2019",
    "baseName": "Mikyx",
    "variant": "MSI Champion Mikyx",
    "role": "Support",
    "rating": 88,
    "rarity": "Épique"
  },
  {
    "id": "targamas-giants",
    "baseName": "Targamas",
    "variant": "Giants Targamas",
    "role": "Support",
    "rating": 67,
    "rarity": "Commune"
  },
  {
    "id": "targamas-kcorp-2024",
    "baseName": "Targamas",
    "variant": "KC Targamas",
    "role": "Support",
    "rating": 70,
    "rarity": "Rare"
  },
  {
    "id": "hylissang-uol",
    "baseName": "Hylissang",
    "variant": "UOL Hylissang",
    "role": "Support",
    "rating": 74,
    "rarity": "Commune"
  },
  {
    "id": "hylissang-fnc",
    "baseName": "Hylissang",
    "variant": "Fnatic Hylissang",
    "role": "Support",
    "rating": 81,
    "rarity": "Rare"
  },
  {
    "id": "corejj-ssg",
    "baseName": "CoreJJ",
    "variant": "SSG CoreJJ",
    "role": "Support",
    "rating": 88,
    "rarity": "Commune"
  },
  {
    "id": "corejj-tl",
    "baseName": "CoreJJ",
    "variant": "TL CoreJJ",
    "role": "Support",
    "rating": 80,
    "rarity": "Rare"
  },
  {
    "id": "meiko-edg",
    "baseName": "Meiko",
    "variant": "EDG Meiko",
    "role": "Support",
    "rating": 84,
    "rarity": "Commune"
  },
  {
    "id": "meiko-tes",
    "baseName": "Meiko",
    "variant": "TES Meiko",
    "role": "Support",
    "rating": 83,
    "rarity": "Rare",
    "image": "/cardsImg/others/tes_meiko.png"
  },
  {
    "id": "meiko-worlds-2021",
    "baseName": "Meiko",
    "variant": "World Champion Meiko",
    "role": "Support",
    "rating": 90,
    "rarity": "Épique"
  },
  {
    "id": "meiko-LPL-Legend",
    "baseName": "Meiko",
    "variant": "LPL Legend Meiko",
    "role": "Support",
    "rating": 92,
    "rarity": "Légendaire"
  }
];