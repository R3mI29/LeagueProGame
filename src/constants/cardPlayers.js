// Pool de cartes du mode "Draft aux packs" — calibré sur l'historique compétitif réel.
// Échelle impitoyable : 90+ réservé aux performances historiques majeures.

export const RARITIES = ['Commune', 'Rare', 'Épique', 'Légendaire', 'WANTED'];

// Probabilités de tirage par emplacement de carte dans un pack (en %).
export const RARITY_WEIGHTS = {
  Commune: 633,
  Rare: 290,
  'Épique': 40,
  'Légendaire': 10,
  WANTED : 3
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
    "id": "edg_zdz",
    "baseName": "zdz",
    "variant": "EDG zdz",
    "role": "Top",
    "rating": 68,
    "rarity": "Commune",
    "image": "/cardsImg/2026-players/EDG_zdz.webp"
  },
  {
    "id": "t1-zeus",
    "baseName": "Zeus",
    "variant": "T1 Zeus",
    "role": "Top",
    "rating": 83,
    "rarity": "Rare",
    "image": "/cardsImg/others/T1_zeus.png"
  },
  {
    "id": "hle-zeus",
    "baseName": "Zeus",
    "variant": "HLE Zeus",
    "role": "Top",
    "rating": 82,
    "rarity": "Rare",
    "image": "/cardsImg/2026-players/hle_zeus.webp"
  },
  {
    "id": "zeus-worlds-2023",
    "baseName": "Zeus",
    "variant": "World Champion Zeus",
    "role": "Top",
    "rating": 88,
    "rarity": "Épique"
  },
  {
    "id": "zeus-mvp-2023",
    "baseName": "Zeus",
    "variant": "Worlds MVP Zeus",
    "role": "Top",
    "rating": 94,
    "rarity": "Légendaire"
  },
  {
    "id": "NAVI-adam",
    "baseName": "Adam",
    "variant": "NAVI Adam",
    "role": "Top",
    "rating": 69,
    "rarity": "Commune",
    "image": "/cardsImg/2026-players/NAVI_adam.webp"
  },
  {
    "id": "blg-bin",
    "baseName": "Bin",
    "variant": "BLG Bin",
    "role": "Top",
    "rating": 83,
    "rarity": "Rare",
    "image": "/cardsImg/2026-players/BLG_bin.webp"
  },
  {
    "id": "bin-FirstStand-2026",
    "baseName": "Bin",
    "variant": "First Stand MVP Bin",
    "role": "Top",
    "rating": 89,
    "rarity": "Épique",
    "image": "/cardsImg/others/firststand_mvp_bin.png"
  },
  {
    "id": "bin-lpl-mvp",
    "baseName": "Bin",
    "variant": "LPL Finals MVP Bin",
    "role": "Top",
    "rating": 92,
    "rarity": "Légendaire"
  },
  {
    "id": "szygenda",
    "baseName": "Szygenda",
    "variant": "Szygenda",
    "role": "Top",
    "rating": 51,
    "rarity": "Commune",
    "image": "/cardsImg/2026-players/szygenda.webp"
  },
  {
    "id": "tes-369",
    "baseName": "369",
    "variant": "TES 369",
    "role": "Top",
    "rating": 81,
    "rarity": "Rare",
    "image": "/cardsImg/2026-players/TES_369.webp"
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
    "id": "bro-morgan",
    "baseName": "Morgan",
    "variant": "BRO Morgan",
    "role": "Top",
    "rating": 63,
    "rarity": "Commune",
    "image": "/cardsImg/2026-players/BRO_morgan.webp"
  },
  {
    "id": "gen-kiin",
    "baseName": "Kiin",
    "variant": "Gen.G Kiin",
    "role": "Top",
    "rating": 82,
    "rarity": "Rare",
    "image": "/cardsImg/2026-players/GENG_kiin.webp"
  },
  {
    "id": "kiin-lck-mvp",
    "baseName": "Kiin",
    "variant": "LCK Finals MVP Kiin",
    "role": "Top",
    "rating": 88,
    "rarity": "Épique"
  },
  {
    "id": "gx-odoamne",
    "baseName": "Odoamne",
    "variant": "GX Odoamne",
    "role": "Top",
    "rating": 66,
    "rarity": "Commune",
    "image": "/cardsImg/2026-players/GX_odoamne.webp"
  },
  {
    "id": "brokenblade-g2",
    "baseName": "BrokenBlade",
    "variant": "G2 BrokenBlade",
    "role": "Top",
    "rating": 80,
    "rarity": "Rare",
    "image": "/cardsImg/2026-players/g2_brokenblade.webp"
  },
  {
    "id": "NAVI-maynter",
    "baseName": "Maynter",
    "variant": "NAVI Maynter",
    "role": "Top",
    "rating": 62,
    "rarity": "Commune",
    "image": "/cardsImg/2026-players/NAVI_maynter.webp"
  },
  {
    "id": "fnc-oscarinin",
    "baseName": "Oscarinin",
    "variant": "FNC Oscarinin",
    "role": "Top",
    "rating": 75,
    "rarity": "Rare",
    "image": "/cardsImg/2026-players/FNC_oscarinin.webp"
  },
  {
    "id": "sen-impact",
    "baseName": "Impact",
    "variant": "SEN Impact",
    "role": "Top",
    "rating": 70,
    "rarity": "Commune",
    "image": "/cardsImg/2026-players/SEN_impact.webp"
  },
  {
    "id": "fly-bwipo",
    "baseName": "Bwipo",
    "variant": "FLY Bwipo",
    "role": "Top",
    "rating": 76,
    "rarity": "Rare",
    "image": "/cardsImg/2026-players/FLY_bwipo.webp"
  },
  {
    "id": "dns-dudu",
    "baseName": "DuDu",
    "variant": "DNS DuDu",
    "role": "Top",
    "rating": 61,
    "rarity": "Commune",
    "image": "/cardsImg/2026-players/DNS_dudu.webp"
  },
  {
    "id": "t1-doran",
    "baseName": "Doran",
    "variant": "T1 Doran",
    "role": "Top",
    "rating": 78,
    "rarity": "Rare",
    "image": "/cardsImg/2026-players/T1_doran.webp"
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
    "id": "sk-wunder",
    "baseName": "Wunder",
    "variant": "SK Wunder",
    "role": "Top",
    "rating": 67,
    "rarity": "Commune",
    "image": "/cardsImg/2026-players/SK_wunder.webp"
  },
  {
    "id": "g2-wunder-2019",
    "baseName": "Wunder",
    "variant": "G2 Wunder",
    "role": "Top",
    "rating": 79,
    "rarity": "Rare",
    "image": "/cardsImg/others/G2_wunder.png"
  },
  {
    "id": "theshy-legend",
    "baseName": "TheShy",
    "variant": "Legend TheShy",
    "role": "Top",
    "rating": 97,
    "rarity": "WANTED",
    "image": "/cardsImg/others/TheShy_legend.jpg"
  },

  {
    "id": "bro-gideon",
    "baseName": "Gideon",
    "variant": "BRO Gideon",
    "role": "Jungle",
    "rating": 64,
    "rarity": "Commune",
    "image": "/cardsImg/2026-players/BRO_gideon.webp"
  },
  {
    "id": "gen-canyon",
    "baseName": "Canyon",
    "variant": "Gen.G Canyon",
    "role": "Jungle",
    "rating": 83,
    "rarity": "Rare",
    "image": "/cardsImg/2026-players/GENG_canyon.webp"
  },
  {
    "id": "canyon-worlds-2020",
    "baseName": "Canyon",
    "variant": "World Champion Canyon",
    "role": "Jungle",
    "rating": 89,
    "rarity": "Épique"
  },
  {
    "id": "canyon-mvp-2020",
    "baseName": "Canyon",
    "variant": "Worlds MVP Canyon",
    "role": "Jungle",
    "rating": 94,
    "rarity": "Légendaire"
  },
  {
    "id": "gx-isma",
    "baseName": "Isma",
    "variant": "GX Isma",
    "role": "Jungle",
    "rating": 65,
    "rarity": "Commune",
    "image": "/cardsImg/2026-players/GX_isma.webp"
  },
  {
    "id": "jdg-kanavi",
    "baseName": "Kanavi",
    "variant": "JDG Kanavi",
    "role": "Jungle",
    "rating": 82,
    "rarity": "Rare",
    "image": "/cardsImg/others/JDG_kanavi.png"
  },
  {
    "id": "kanavi-msi-2023",
    "baseName": "Kanavi",
    "variant": "MSI Champion Kanavi",
    "role": "Jungle",
    "rating": 89,
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
    "rating": 62,
    "rarity": "Commune",
    "image": "/cardsImg/2026-players/T1_Painter.webp"
  },
  {
    "id": "frx-raptor",
    "baseName": "Raptor",
    "variant": "FRX Raptor",
    "role": "Jungle",
    "rating": 64,
    "rarity": "Commune",
    "image": "/cardsImg/2026-players/FRX_raptor.webp"
  },
  {
    "id": "t1-oner",
    "baseName": "Oner",
    "variant": "T1 Oner",
    "role": "Jungle",
    "rating": 81,
    "rarity": "Rare",
    "image": "/cardsImg/2026-players/T1_oner.webp"
  },
  {
    "id": "oner-worlds-2023",
    "baseName": "Oner",
    "variant": "World Champion Oner",
    "role": "Jungle",
    "rating": 88,
    "rarity": "Épique"
  },
  {
    "id": "DKC-sharvel",
    "baseName": "Sharvel",
    "variant": "DK.C Sharvel",
    "role": "Jungle",
    "rating": 68,
    "rarity": "Commune",
    "image": "/cardsImg/2026-players/DKC_sharvel.webp"
  },
  {
    "id": "hle-peanut",
    "baseName": "Peanut",
    "variant": "HLE Peanut",
    "role": "Jungle",
    "rating": 79,
    "rarity": "Rare",
    "image": "/cardsImg/2026-players/HLE_peanut.webp"
  },
  {
    "id": "peanut-lck-mvp",
    "baseName": "Peanut",
    "variant": "LCK MVP Peanut",
    "role": "Jungle",
    "rating": 86,
    "rarity": "Épique"
  },
  {
    "id": "C9-blaber",
    "baseName": "Blaber",
    "variant": "C9 Blaber",
    "role": "Jungle",
    "rating": 71,
    "rarity": "Commune",
    "image": "/cardsImg/2026-players/C9_blaber.webp"
  },
  {
    "id": "tes-tian",
    "baseName": "Tian",
    "variant": "TES Tian",
    "role": "Jungle",
    "rating": 80,
    "rarity": "Rare",
    "image": "/cardsImg/2026-players/TES_tian.webp"
  },
  {
    "id": "tian-mvp",
    "baseName": "Tian",
    "variant": "Worlds MVP Tian",
    "role": "Jungle",
    "rating": 89,
    "rarity": "Épique"
  },
  {
    "id": "mad-elyoya",
    "baseName": "Elyoya",
    "variant": "MAD Lions Elyoya",
    "role": "Jungle",
    "rating": 77,
    "rarity": "Rare",
    "image": "/cardsImg/others/MAD_elyoya.png"
  },
  {
    "id": "th-sheo",
    "baseName": "Sheo",
    "variant": "TH Sheo",
    "role": "Jungle",
    "rating": 64,
    "rarity": "Commune",
    "image": "/cardsImg/2026-players/TH_sheo.webp"
  },
  {
    "id": "kc-yike",
    "baseName": "Yike",
    "variant": "KC Yike",
    "role": "Jungle",
    "rating": 78,
    "rarity": "Rare",
    "image": "/cardsImg/2026-players/KC_yike.webp"
  },
  {
    "id": "blg-xun",
    "baseName": "Xun",
    "variant": "BLG Xun",
    "role": "Jungle",
    "rating": 80,
    "rarity": "Rare",
    "image": "/cardsImg/2026-players/blg_xun.webp"
  },
  {
    "id": "vit-lyncas",
    "baseName": "Lyncas",
    "variant": "VIT Lyncas",
    "role": "Jungle",
    "rating": 66,
    "rarity": "Commune",
    "image": "/cardsImg/2026-players/VIT_lyncas.webp"
  },
  {
    "id": "g2-jankos",
    "baseName": "Jankos",
    "variant": "G2 Jankos",
    "role": "Jungle",
    "rating": 79,
    "rarity": "Rare",
    "image": "/cardsImg/others/G2_jankos.png"
  },
  {
    "id": "th-daglas",
    "baseName": "Daglas",
    "variant": "TH Daglas",
    "role": "Jungle",
    "rating": 62,
    "rarity": "Commune",
    "image": "/cardsImg/2026-players/TH_daglas.webp"
  },
  {
    "id": "fnc-razork",
    "baseName": "Razork",
    "variant": "FNC Razork",
    "role": "Jungle",
    "rating": 75,
    "rarity": "Rare",
    "image": "/cardsImg/2026-players/FNC_razork.webp"
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
    "rating": 85,
    "rarity": "Rare",
    "image": "/cardsImg/others/faker_T1.png"
  },
  {
    "id": "faker-6x-champ",
    "baseName": "Faker",
    "variant": "6x World Champion Faker",
    "role": "Mid",
    "rating": 95,
    "rarity": "Épique",
    "image": "/cardsImg/others/T1_faker_2023.png"
  },
  {
    "id": "faker-hall-of-legends",
    "baseName": "Faker",
    "variant": "Unkillable Demon King",
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
    "rating": 85,
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
    "variant": "LCK 4x Champion Chovy",
    "role": "Mid",
    "rating": 93,
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
    "rating": 82,
    "rarity": "Rare",
    "image": "/cardsImg/2026-players/dk_showmaker.webp"
  },
  {
    "id": "showmaker-worlds-2020",
    "baseName": "ShowMaker",
    "variant": "World Champion ShowMaker",
    "role": "Mid",
    "rating": 88,
    "rarity": "Épique"
  },
  {
    "id": "showmaker-DK-mentor",
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
    "rating": 85,
    "rarity": "Rare",
    "image": "/cardsImg/2026-players/blg_knight.webp"
  },
  {
    "id": "kc-kyeahoo-2026",
    "baseName": "Kyeahoo",
    "variant": "KC Kyeahoo",
    "role": "Mid",
    "rating": 75,
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
    "id": "knight-lpl-legend",
    "baseName": "Knight",
    "variant": "LPL Legend Knight",
    "role": "Mid",
    "rating": 93,
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
    "rating": 81,
    "rarity": "Rare",
    "image": "/cardsImg/2026-players/IG_rookie.webp"
  },
  {
    "id": "rookie-worlds-2018",
    "baseName": "Rookie",
    "variant": "World Champion Rookie",
    "role": "Mid",
    "rating": 89,
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
    "rating": 82,
    "rarity": "Rare",
    "image": "/cardsImg/2026-players/g2_caps.webp"
  },
  {
    "id": "caps-msi-mvp",
    "baseName": "Caps",
    "variant": "MSI MVP Caps",
    "role": "Mid",
    "rating": 89,
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
    "rating":78,
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
    "rating": 80,
    "rarity": "Rare",
    "image": "/cardsImg/2026-players/KT_bdd.webp"
  },
  {
    "id": "bdd-lck-mvp",
    "baseName": "Bdd",
    "variant": "LCK MVP Bdd",
    "role": "Mid",
    "rating": 87,
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
    "rating": 81,
    "rarity": "Rare",
    "image": "/cardsImg/others/ssg_ruler.png"
  },
  {
    "id": "jdg-ruler",
    "baseName": "Ruler",
    "variant": "JDG Ruler",
    "role": "ADC",
    "rating": 85,
    "rarity": "Rare"
  },
  {
    "id": "ruler-msi-2023",
    "baseName": "Ruler",
    "variant": "MSI Champion Ruler",
    "role": "ADC",
    "rating": 89,
    "rarity": "Épique"
  },
  {
    "id": "ruler-worlds-mvp",
    "baseName": "Ruler",
    "variant": "Worlds MVP Ruler",
    "role": "ADC",
    "rating": 95,
    "rarity": "Légendaire"
  },
  {
    "id": "ns-jiwoo",
    "baseName": "Jiwoo",
    "variant": "NS Jiwoo",
    "role": "ADC",
    "rating": 69,
    "rarity": "Commune"
  },
  {
    "id": "hle-viper",
    "baseName": "Viper",
    "variant": "HLE Viper",
    "role": "ADC",
    "rating": 81,
    "rarity": "Rare"
  },
  {
    "id": "blg-viper",
    "baseName": "Viper",
    "variant": "BLG Viper",
    "role": "ADC",
    "rating": 83,
    "rarity": "Rare"
  },
  {
    "id": "viper-worlds-2021",
    "baseName": "Viper",
    "variant": "World Champion Viper",
    "role": "ADC",
    "rating": 88,
    "rarity": "Épique"
  },
  {
    "id": "viper-lpl-mvp",
    "baseName": "Viper",
    "variant": "LPL MVP Viper",
    "role": "ADC",
    "rating": 90,
    "rarity": "Légendaire"
  },
  {
    "id": "bro-envyy",
    "baseName": "Envyy",
    "variant": "BRO Envyy",
    "role": "ADC",
    "rating": 62,
    "rarity": "Commune"
  },
  {
    "id": "gumayusi-t1-2022",
    "baseName": "Gumayusi",
    "variant": "T1 Gumayusi",
    "role": "ADC",
    "rating": 82,
    "rarity": "Rare",
    "image": "/cardsImg/webp/t1_gumayusi.webp"
  },
  {
    "id": "gumayusi-worlds-2023",
    "baseName": "Gumayusi",
    "variant": "World Champion Gumayusi",
    "role": "ADC",
    "rating": 88,
    "rarity": "Épique"
  },
  {
    "id": "gumayusi-franchise",
    "baseName": "Gumayusi",
    "variant": "Franchise Player Gumayusi",
    "role": "ADC",
    "rating": 93,
    "rarity": "Légendaire"
  },
  {
    "id": "gx-patrik",
    "baseName": "Patrik",
    "variant": "GX Patrik",
    "role": "ADC",
    "rating": 66,
    "rarity": "Commune"
  },
  {
    "id": "blg-elk",
    "baseName": "Elk",
    "variant": "BLG Elk",
    "role": "ADC",
    "rating": 80,
    "rarity": "Rare"
  },
  {
    "id": "elk-lpl-mvp",
    "baseName": "Elk",
    "variant": "LPL MVP Elk",
    "role": "ADC",
    "rating": 85,
    "rarity": "Épique"
  },
  {
    "id": "sk-rahel",
    "baseName": "Rahel",
    "variant": "SK Rahel",
    "role": "ADC",
    "rating": 68,
    "rarity": "Commune"
  },
  {
    "id": "tes-jackeylove",
    "baseName": "JackeyLove",
    "variant": "TES JackeyLove",
    "role": "ADC",
    "rating": 82,
    "rarity": "Rare"
  },
  {
    "id": "jackeylove-worlds",
    "baseName": "JackeyLove",
    "variant": "World Champion JackeyLove",
    "role": "ADC",
    "rating": 87,
    "rarity": "Épique"
  },
  {
    "id": "kdf-bull",
    "baseName": "Bull",
    "variant": "KDF Bull",
    "role": "ADC",
    "rating": 67,
    "rarity": "Commune"
  },
  {
    "id": "gen-peyz",
    "baseName": "Peyz",
    "variant": "Gen.G Peyz",
    "role": "ADC",
    "rating": 82,
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
    "id": "rge-comp",
    "baseName": "Comp",
    "variant": "RGE Comp",
    "role": "ADC",
    "rating": 65,
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
    "id": "bds-ice",
    "baseName": "Ice",
    "variant": "BDS Ice",
    "role": "ADC",
    "rating": 71,
    "rarity": "Commune"
  },
  {
    "id": "g2-hanssama",
    "baseName": "Hans Sama",
    "variant": "G2 Hans Sama",
    "role": "ADC",
    "rating": 79,
    "rarity": "Rare"
  },
  {
    "id": "kc-upset",
    "baseName": "Upset",
    "variant": "KC Upset",
    "role": "ADC",
    "rating": 71,
    "rarity": "Rare"
  },
  {
    "id": "uzi-msi-2018",
    "baseName": "Uzi",
    "variant": "MSI Champion Uzi",
    "role": "ADC",
    "rating": 89,
    "rarity": "Épique",
    "image": "/cardsImg/others/uzi_msi.png"
  },
  {
    "id": "uzi-adc-god",
    "baseName": "Uzi",
    "variant": "ADC God Uzi",
    "role": "ADC",
    "rating": 95,
    "rarity": "WANTED",
    "image": "/cardsImg/others/uzi_adc_god.png"
    
  },

  // ==========================================
  // --- SUPPORT ---
  // ==========================================
  {
    "id": "ns-peter",
    "baseName": "Peter",
    "variant": "NS Peter",
    "role": "Support",
    "rating": 64,
    "rarity": "Commune"
  },
  {
    "id": "t1-keria",
    "baseName": "Keria",
    "variant": "T1 Keria",
    "role": "Support",
    "rating": 84,
    "rarity": "Rare"
  },
  {
    "id": "keria-worlds-2023",
    "baseName": "Keria",
    "variant": "World Champion Keria",
    "role": "Support",
    "rating": 89,
    "rarity": "Épique"
  },
  {
    "id": "keria-lck-mvp",
    "baseName": "Keria",
    "variant": "LCK MVP Keria",
    "role": "Support",
    "rating": 92,
    "rarity": "Légendaire"
  },
  {
    "id": "bro-effort",
    "baseName": "Effort",
    "variant": "BRO Effort",
    "role": "Support",
    "rating": 61,
    "rarity": "Commune"
  },
  {
    "id": "jdg-missing",
    "baseName": "Missing",
    "variant": "JDG Missing",
    "role": "Support",
    "rating": 83,
    "rarity": "Rare"
  },
  {
    "id": "missing-msi-2023",
    "baseName": "Missing",
    "variant": "MSI Champion Missing",
    "role": "Support",
    "rating": 86,
    "rarity": "Épique"
  },
  {
    "id": "gx-ignar",
    "baseName": "IgNar",
    "variant": "GX IgNar",
    "role": "Support",
    "rating": 65,
    "rarity": "Commune"
  },
  {
    "id": "gen-delight",
    "baseName": "Delight",
    "variant": "Gen.G Delight",
    "role": "Support",
    "rating": 82,
    "rarity": "Rare"
  },
  {
    "id": "delight-hle-2024",
    "baseName": "Delight",
    "variant": "HLE Delight",
    "role": "Support",
    "rating": 85,
    "rarity": "Épique"
  },
  {
    "id": "fnc-jun",
    "baseName": "Jun",
    "variant": "FNC Jun",
    "role": "Support",
    "rating": 72,
    "rarity": "Commune"
  },
  {
    "id": "gen-lehends",
    "baseName": "Lehends",
    "variant": "Gen.G Lehends",
    "role": "Support",
    "rating": 81,
    "rarity": "Rare"
  },
  {
    "id": "lehends-lck-mvp",
    "baseName": "Lehends",
    "variant": "LCK MVP Lehends",
    "role": "Support",
    "rating": 87,
    "rarity": "Épique"
  },
  {
    "id": "sk-luon",
    "baseName": "Luon",
    "variant": "SK Luon",
    "role": "Support",
    "rating": 66,
    "rarity": "Commune"
  },
  {
    "id": "g2-mikyx",
    "baseName": "Mikyx",
    "variant": "G2 Mikyx",
    "role": "Support",
    "rating": 80,
    "rarity": "Rare"
  },
  {
    "id": "mikyx-msi-2019",
    "baseName": "Mikyx",
    "variant": "MSI Champion Mikyx",
    "role": "Support",
    "rating": 86,
    "rarity": "Épique"
  },
  {
    "id": "rge-zoelys",
    "baseName": "Zoelys",
    "variant": "RGE Zoelys",
    "role": "Support",
    "rating": 62,
    "rarity": "Commune"
  },
  {
    "id": "kc-targamas",
    "baseName": "Targamas",
    "variant": "KC Targamas",
    "role": "Support",
    "rating": 76,
    "rarity": "Rare"
  },
  {
    "id": "bds-labrov",
    "baseName": "Labrov",
    "variant": "BDS Labrov",
    "role": "Support",
    "rating": 70,
    "rarity": "Commune"
  },
  {
    "id": "vit-hylissang",
    "baseName": "Hylissang",
    "variant": "VIT Hylissang",
    "role": "Support",
    "rating": 55,
    "rarity": "Commune"
  },
  {
    "id": "mdk-alvaro",
    "baseName": "Alvaro",
    "variant": "MDK Alvaro",
    "role": "Support",
    "rating": 69,
    "rarity": "Commune"
  },
  {
    "id": "tl-corejj",
    "baseName": "CoreJJ",
    "variant": "TL CoreJJ",
    "role": "Support",
    "rating": 76,
    "rarity": "Rare"
  },
  {
    "id": "th-kaiser",
    "baseName": "Kaiser",
    "variant": "TH Kaiser",
    "role": "Support",
    "rating": 67,
    "rarity": "Commune"
  },
  {
    "id": "meiko-tes",
    "baseName": "Meiko",
    "variant": "TES Meiko",
    "role": "Support",
    "rating": 81,
    "rarity": "Rare",
    "image": "/cardsImg/others/tes_meiko.png"
  },
  {
    "id": "meiko-worlds-2021",
    "baseName": "Meiko",
    "variant": "World Champion Meiko",
    "role": "Support",
    "rating": 88,
    "rarity": "Épique"
  },
  {
    "id": "meiko-LPL-Legend",
    "baseName": "Meiko",
    "variant": "LPL Legend Meiko",
    "role": "Support",
    "rating": 92,
    "rarity": "Légendaire"
  },
  {
    "id": "Shwomaker-Prime",
    "baseName": "Showmaker",
    "variant": "THE MAGICIAN",
    "role": "Mid",
    "rating": 97,
    "rarity": "WANTED",
    "image": "/cardsImg/others/showmaker_prime.jpg"
  },
];
