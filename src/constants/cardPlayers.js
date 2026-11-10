// Pool de cartes du mode "Draft aux packs" — calibré sur l'historique compétitif réel.
// Échelle impitoyable : 90+ réservé aux performances historiques majeures.

export const RARITIES = ['Commune', 'Rare', 'Épique', 'Légendaire', 'WANTED'];

export const RARITY_ORDER = {
  'Commune': 1,
  'Rare': 2,
  'Épique': 3,
  'Légendaire': 4,
  'WANTED': 5,
  'SECRET': 6,
};

// Probabilités de tirage par emplacement de carte dans un pack (en %).
export const RARITY_WEIGHTS = {
  Commune: 633,
  Rare: 290,
  'Épique': 40,
  'Légendaire': 10,
  WANTED: 3,
};

export const RARITY_COLORS = {
  Commune: '#8b9bb4',
  Rare: '#00e5ff',
  'Épique': '#ff3366',
  'Légendaire': '#ffd700',
  WANTED: '#ffffff',
};

export const CARD_POOL = [

  // ============================================================================
  // LCK (CORÉE DU SUD)
  // ============================================================================

  // --- [LCK] T1 ---
  // Doran
  {
    "id": "t1-doran",
    "baseName": "Doran",
    "variant": "T1 Doran",
    "role": "Top",
    "rating": 77,
    "rarity": "Rare",
    "image": "/cardsImg/2026-players/T1_doran.webp",
    "nationality": "KR",
    "teamTag": "T1",
    "league": "LCK"
  },
  {
    "id": "t1-doran-world_champion",
    "baseName": "Doran",
    "variant": "World Champion",
    "role": "Top",
    "rating": 89,
    "rarity": "Légendaire",
    "image": "/cardsImg/others/doran_T1_red.png",
    "nationality": "KR",
    "teamTag": "T1",
    "league": "LCK"
  },
  // Zeus
  {
    "id": "t1-zeus",
    "baseName": "Zeus",
    "variant": "T1 Zeus",
    "role": "Top",
    "rating": 82,
    "rarity": "Rare",
    "image": "/cardsImg/others/T1_zeus.png",
    "nationality": "KR",
    "teamTag": "T1",
    "league": "LCK"
  },
  {
    "id": "zeus-lck",
    "baseName": "Zeus",
    "variant": "LCK champ Zeus",
    "role": "Top",
    "rating": 84,
    "rarity": "Épique",
    "image": "/cardsImg/others/zeus_lck_2022.jpg",
    "nationality": "KR",
    "teamTag": "T1",
    "league": "LCK"
  },
  {
    "id": "zeus-mvp-2023",
    "baseName": "Zeus",
    "variant": "Worlds Finals MVP",
    "role": "Top",
    "rating": 94,
    "rarity": "WANTED",
    "image": "/cardsImg/others/worldsMVP_zeus.jpg",
    "video": "/videos/zeus_career.mp4",
    "nationality": "KR",
    "teamTag": "T1",
    "league": "LCK"
  },
  // Oner
  {
    "id": "t1-oner",
    "baseName": "Oner",
    "variant": "T1 Oner",
    "role": "Jungle",
    "rating": 80,
    "rarity": "Rare",
    "image": "/cardsImg/2026-players/T1_oner.webp",
    "nationality": "KR",
    "teamTag": "T1",
    "league": "LCK"
  },
  {
    "id": "oner-lck",
    "baseName": "Oner",
    "variant": "LCK 2022 Spring Champion",
    "role": "Jungle",
    "rating": 83,
    "rarity": "Épique",
    "image": "/cardsImg/others/Oner_blondie.jpg",
    "nationality": "KR",
    "teamTag": "T1",
    "league": "LCK"
  },
  // Painter
  {
    "id": "painter-t1-2026-sub",
    "baseName": "Painter",
    "variant": "T1 Painter",
    "role": "Jungle",
    "rating": 55,
    "rarity": "Commune",
    "image": "/cardsImg/2026-players/T1_Painter.webp",
    "nationality": "KR",
    "teamTag": "T1",
    "league": "LCK"
  },
  // Faker
  {
    "id": "faker-t1-2022",
    "baseName": "Faker",
    "variant": "T1 Faker",
    "role": "Mid",
    "rating": 83,
    "rarity": "Rare",
    "image": "/cardsImg/others/faker_T1.png",
    "nationality": "KR",
    "teamTag": "T1",
    "league": "LCK"
  },
  {
    "id": "faker-6x-champ",
    "baseName": "Faker",
    "variant": "6x World Champion",
    "role": "Mid",
    "rating": 94,
    "rarity": "Légendaire",
    "image": "/cardsImg/others/T1_faker.jpg",
    "nationality": "KR",
    "teamTag": "T1",
    "league": "LCK"
  },
  {
    "id": "faker-hall-of-legends",
    "baseName": "Faker",
    "variant": "Unkillable Demon King",
    "role": "Mid",
    "rating": 99,
    "rarity": "WANTED",
    "image": "/cardsImg/others/faker_UDK2.jpg",
    "nationality": "KR",
    "teamTag": "T1",
    "league": "LCK",
    "video": "/videos/faker_unkillable.mp4"
  },
  // Gumayusi
  {
    "id": "gumayusi-t1-2022",
    "baseName": "Gumayusi",
    "variant": "T1 Gumayusi",
    "role": "ADC",
    "rating": 81,
    "rarity": "Rare",
    "image": "/cardsImg/webp/t1_gumayusi.webp",
    "nationality": "KR",
    "teamTag": "T1",
    "league": "LCK"
  },
  {
    "id": "gumayusi-T1-legend",
    "baseName": "Gumayusi",
    "variant": "T1 Legend",
    "role": "ADC",
    "rating": 92,
    "rarity": "Légendaire",
    "image": "/cardsImg/others/T1_gumayusi.jpg",
    "nationality": "KR",
    "teamTag": "T1",
    "league": "LCK"
  },
  // Peyz
  {
    "id": "T1-peyz",
    "baseName": "Peyz",
    "variant": "T1 Peyz",
    "role": "ADC",
    "rating": 83,
    "rarity": "Rare",
    "image": "/cardsImg/2026-players/T1_peyz.webp",
    "nationality": "KR",
    "teamTag": "T1",
    "league": "LCK"
  },
  // Keria
  {
    "id": "t1-keria",
    "baseName": "Keria",
    "variant": "T1 Keria",
    "role": "Support",
    "rating": 83,
    "rarity": "Rare",
    "image": "/cardsImg/2026-players/T1_keria.webp",
    "nationality": "KR",
    "teamTag": "T1",
    "league": "LCK"
  },
  {
    "id": "keria-lck-mvp",
    "baseName": "Keria",
    "variant": "LCK MVP Keria",
    "role": "Support",
    "rating": 87,
    "rarity": "Épique",
    "image": "/cardsImg/others/T1_keria_2022.jpg",
    "nationality": "KR",
    "teamTag": "T1",
    "league": "LCK"
  },
  {
    "id": "keria-worlds-2023",
    "baseName": "Keria",
    "variant": "3x World Champion",
    "role": "Support",
    "rating": 93,
    "rarity": "Légendaire",
    "image": "/cardsImg/others/T1_keria.jpg",
    "nationality": "KR",
    "teamTag": "T1",
    "league": "LCK"
  },
  {
    "id": "keria-3PEAT-WC",
    "baseName": "Keria",
    "variant": "3PEAT Worlds",
    "role": "Support",
    "rating": 96,
    "rarity": "WANTED",
    "image": "/cardsImg/others/3PEAT_keria.jpg",
    "nationality": "KR",
    "teamTag": "T1",
    "league": "LCK",
    "video": "/videos/keria_worlds.mp4"
  },

  // --- [LCK] SKT ---
  // Peanut
  {
    "id": "peanut-lck-mvp",
    "baseName": "Peanut",
    "variant": "LCK MVP Peanut",
    "role": "Jungle",
    "rating": 85,
    "rarity": "Épique",
    "image": "/cardsImg/others/SKT_peanut.jpg",
    "nationality": "KR",
    "teamTag": "SKT",
    "league": "LCK"
  },

  // --- [LCK] GEN ---
  // Kiin
  {
    "id": "gen-kiin",
    "baseName": "Kiin",
    "variant": "Gen.G Kiin",
    "role": "Top",
    "rating": 81,
    "rarity": "Rare",
    "image": "/cardsImg/2026-players/GENG_kiin.webp",
    "nationality": "KR",
    "teamTag": "GEN",
    "league": "LCK"
  },
  {
    "id": "kiin-lck-mvp",
    "baseName": "Kiin",
    "variant": "LCK Finals MVP",
    "role": "Top",
    "rating": 86,
    "rarity": "Épique",
    "image": "/cardsImg/others/geng_kiin_lck.jpg",
    "nationality": "KR",
    "teamTag": "GEN",
    "league": "LCK"
  },
  // Canyon
  {
    "id": "gen-canyon",
    "baseName": "Canyon",
    "variant": "Gen.G Canyon",
    "role": "Jungle",
    "rating": 81,
    "rarity": "Rare",
    "image": "/cardsImg/2026-players/GENG_canyon.webp",
    "nationality": "KR",
    "teamTag": "GEN",
    "league": "LCK"
  },
  {
    "id": "canyon-ewc",
    "baseName": "Canyon",
    "variant": "EWC 2025 Champion",
    "role": "Jungle",
    "rating": 85,
    "rarity": "Épique",
    "image": "/cardsImg/others/GenG_Canyon.jpg",
    "nationality": "KR",
    "teamTag": "GEN",
    "league": "LCK"
  },
  // Chovy
  {
    "id": "chovy-geng-2023",
    "baseName": "Chovy",
    "variant": "Gen.G Chovy",
    "role": "Mid",
    "rating": 83,
    "rarity": "Rare",
    "image": "/cardsImg/2026-players/geng_chovy.webp",
    "nationality": "KR",
    "teamTag": "GEN",
    "league": "LCK"
  },
  {
    "id": "chovy-msi-2024",
    "baseName": "Chovy",
    "variant": "2025 EWC Champion",
    "role": "Mid",
    "rating": 86,
    "rarity": "Épique",
    "image": "/cardsImg/others/chovy_epic.jpg",
    "nationality": "KR",
    "teamTag": "GEN",
    "league": "LCK"
  },
  {
    "id": "chovy-4peat",
    "baseName": "Chovy",
    "variant": "LCK 4PEAT",
    "role": "Mid",
    "rating": 92,
    "rarity": "Légendaire",
    "image": "/cardsImg/others/GENG_chovy_leg.jpg",
    "nationality": "KR",
    "teamTag": "GEN",
    "league": "LCK"
  },
  // Peyz
  {
    "id": "peyz-finals-mvp",
    "baseName": "Peyz",
    "variant": "LCK Finals MVP Peyz",
    "role": "ADC",
    "rating": 88,
    "rarity": "Épique",
    "image": "/cardsImg/others/peyz_lck_mvp.jpg",
    "nationality": "KR",
    "teamTag": "GEN",
    "league": "LCK"
  },
  // Ruler
  {
    "id": "GenG-ruler",
    "baseName": "Ruler",
    "variant": "Gen.G Ruler",
    "role": "ADC",
    "rating": 81,
    "rarity": "Rare",
    "image": "/cardsImg/2026-players/GENG_ruler.webp",
    "nationality": "KR",
    "teamTag": "GEN",
    "league": "LCK"
  },
  {
    "id": "gen-ruler-champion",
    "baseName": "Ruler",
    "variant": "LCK Finals MVP",
    "role": "ADC",
    "rating": 90,
    "rarity": "Légendaire",
    "image": "/cardsImg/external/ruler_wanted.jpg",
    "nationality": "KR",
    "teamTag": "GEN",
    "league": "LCK"
  },
  // Duro
  {
    "id": "geng-duro",
    "baseName": "Duro",
    "variant": "Gen.G Duro",
    "role": "Support",
    "rating": 83,
    "rarity": "Rare",
    "image": "/cardsImg/2026-players/GENG_duro.webp",
    "nationality": "KR",
    "teamTag": "GEN",
    "league": "LCK"
  },
  // Lehends
  {
    "id": "lehends-lck-2x",
    "baseName": "Lehends",
    "variant": "2x LCK champion",
    "role": "Support",
    "rating": 86,
    "rarity": "Épique",
    "image": "/cardsImg/others/lck_lehends_geng.jpg",
    "nationality": "KR",
    "teamTag": "GEN",
    "league": "LCK"
  },
  {
    "id": "lehends-msi_mvp",
    "baseName": "Lehends",
    "variant": "2024 MSI MVP",
    "role": "Support",
    "rating": 90,
    "rarity": "Légendaire",
    "image": "/cardsImg/others/msi_mvp_lehends.jpg",
    "nationality": "KR",
    "teamTag": "GEN",
    "league": "LCK"
  },

  // --- [LCK] SSG ---
  // Ambition
  {
    "id": "ssg-ambition-world-champion",
    "baseName": "Ambition",
    "variant": "World Champion",
    "role": "Jungle",
    "rating": 91,
    "rarity": "Légendaire",
    "image": "/cardsImg/external/ssg_ambition.jpg",
    "nationality": "KR",
    "teamTag": "SSG",
    "league": "LCK"
  },
  // Crown
  {
    "id": "ssg-crown-world-champion",
    "baseName": "Crown",
    "variant": "World Champion",
    "role": "Mid",
    "rating": 91,
    "rarity": "Légendaire",
    "image": "/cardsImg/external/ssg_crown.jpg",
    "nationality": "KR",
    "teamTag": "SSG",
    "league": "LCK"
  },
  // Ruler
  {
    "id": "ruler-ssg",
    "baseName": "Ruler",
    "variant": "SSG Ruler",
    "role": "ADC",
    "rating": 80,
    "rarity": "Rare",
    "image": "/cardsImg/others/ssg_ruler.png",
    "nationality": "KR",
    "teamTag": "SSG",
    "league": "LCK"
  },
  {
    "id": "ruler-worlds-mvp",
    "baseName": "Ruler",
    "variant": "Worlds Finals MVP",
    "role": "ADC",
    "rating": 94,
    "rarity": "WANTED",
    "image": "/cardsImg/external/ruler_worlds_mvp.jpg",
    "nationality": "KR",
    "teamTag": "SSG",
    "league": "LCK"
  },

  // --- [LCK] HLE ---
  // Doran
  {
    "id": "doran-lck-champ",
    "baseName": "Doran",
    "variant": "LCK Champion Doran",
    "role": "Top",
    "rating": 83,
    "rarity": "Épique",
    "image": "/cardsImg/others/doran_lck_hle.jpg",
    "nationality": "KR",
    "teamTag": "HLE",
    "league": "LCK"
  },
  // Zeus
  {
    "id": "hle-zeus",
    "baseName": "Zeus",
    "variant": "HLE Zeus",
    "role": "Top",
    "rating": 81,
    "rarity": "Rare",
    "image": "/cardsImg/2026-players/hle_zeus.webp",
    "nationality": "KR",
    "teamTag": "HLE",
    "league": "LCK"
  },
  {
    "id": "zeus-mvp-msi",
    "baseName": "Zeus",
    "variant": "2026 MSI MVP",
    "role": "Top",
    "rating": 91,
    "rarity": "Légendaire",
    "image": "/cardsImg/others/MSI_MVP_zeus.jpg",
    "nationality": "KR",
    "teamTag": "HLE",
    "league": "LCK"
  },
  // Peanut
  {
    "id": "hle-peanut",
    "baseName": "Peanut",
    "variant": "HLE Peanut",
    "role": "Jungle",
    "rating": 78,
    "rarity": "Rare",
    "image": "/cardsImg/2026-players/HLE_peanut.webp",
    "nationality": "KR",
    "teamTag": "HLE",
    "league": "LCK"
  },
  // Zeka
  {
    "id": "zeka-FST-mvp",
    "baseName": "Zeka",
    "variant": "First Stand MVP Zeka",
    "role": "Mid",
    "rating": 87,
    "rarity": "Épique",
    "image": "/cardsImg/others/FST_MVP_ZEKA.jpg",
    "nationality": "KR",
    "teamTag": "HLE",
    "league": "LCK"
  },

  
  // Delight
  {
    "id": "hle-delight",
    "baseName": "Delight",
    "variant": "HLE Delight",
    "role": "Support",
    "rating": 80,
    "rarity": "Rare",
    "image": "/cardsImg/2026-players/HLE_delight.webp",
    "nationality": "KR",
    "teamTag": "HLE",
    "league": "LCK"
  },
  {
    "id": "delight-hle-2024",
    "baseName": "Delight",
    "variant": "2025 First Stand Champion",
    "role": "Support",
    "rating": 84,
    "rarity": "Épique",
    "image": "/cardsImg/others/delight_firststand_2025.jpg",
    "nationality": "KR",
    "teamTag": "HLE",
    "league": "LCK"
  },

  // --- [LCK] DK ---
  // Canyon
  {
    "id": "canyon-lck-champion",
    "baseName": "Canyon",
    "variant": "5x LCK champion",
    "role": "Jungle",
    "rating": 90,
    "rarity": "Légendaire",
    "image": "/cardsImg/others/LCK_geng_canyon.jpg",
    "nationality": "KR",
    "teamTag": "DK",
    "league": "LCK"
  },
  // ShowMaker
  {
    "id": "showmaker-dk-2024",
    "baseName": "ShowMaker",
    "variant": "DK ShowMaker",
    "role": "Mid",
    "rating": 81,
    "rarity": "Rare",
    "image": "/cardsImg/2026-players/dk_showmaker.webp",
    "nationality": "KR",
    "teamTag": "DK",
    "league": "LCK"
  },
  {
    "id": "showmaker-ewc-2020",
    "baseName": "ShowMaker",
    "variant": "2026 EWC ShowMaker",
    "role": "Mid",
    "rating": 86,
    "rarity": "Épique",
    "image": "/cardsImg/others/DK_2026_showmaker.jpg",
    "nationality": "KR",
    "teamTag": "DK",
    "league": "LCK"
  },
  {
    "id": "showmaker-DK-mentor",
    "baseName": "ShowMaker",
    "variant": "Mentor",
    "role": "Mid",
    "rating": 93,
    "rarity": "WANTED",
    "image": "/cardsImg/others/showmaker_mentor.jpg",
    "nationality": "KR",
    "teamTag": "DK",
    "league": "LCK",
    "video": "/videos/showmaker_legend.mp4"
  },
  // Career
  {
    "id": "dk_career",
    "baseName": "Career",
    "variant": "DK Career",
    "role": "Support",
    "rating": 81,
    "rarity": "Rare",
    "image": "/cardsImg/2026-players/dk_career.webp",
    "nationality": "KR",
    "teamTag": "DK",
    "league": "LCK"
  },
  {
    "id": "dk_career_ewc",
    "baseName": "Career",
    "variant": "EWC Champion",
    "role": "Support",
    "rating": 85,
    "rarity": "Épique",
    "image": "/cardsImg/others/dk_career_ewc.jpg",
    "nationality": "KR",
    "teamTag": "DK",
    "league": "LCK"
  },

  // --- [LCK] DWG ---
  // Canyon
  {
    "id": "dwg-canyon-champion",
    "baseName": "Canyon",
    "variant": "DWG Legend",
    "role": "Jungle",
    "rating": 93,
    "rarity": "Légendaire",
    "image": "/cardsImg/others/DWG_canyon.jpeg",
    "nationality": "KR",
    "teamTag": "DWG",
    "league": "LCK"
  },
  {
    "id": "canyon-mvp-2020",
    "baseName": "Canyon",
    "variant": "Worlds MVP",
    "role": "Jungle",
    "rating": 95,
    "rarity": "WANTED",
    "image": "/cardsImg/others/DWG_canyon_WORLDS.jpeg",
    "nationality": "KR",
    "teamTag": "DWG",
    "league": "LCK"
  },
  // ShowMaker
  {
    "id": "showmaker-prime",
    "baseName": "ShowMaker",
    "variant": "THE MAGICIAN",
    "role": "Mid",
    "rating": 96,
    "rarity": "WANTED",
    "image": "/cardsImg/others/showmaker_prime.jpg",
    "nationality": "KR",
    "teamTag": "DWG",
    "league": "LCK",
    "video": "/videos/showmaker_legend.mp4"
  },
  // BeryL
  {
    "id": "dwg-beryl-world-champion",
    "baseName": "BeryL",
    "variant": "World Champion",
    "role": "Support",
    "rating": 91,
    "rarity": "Légendaire",
    "image": "/cardsImg/external/dwg_beryl.jpg",
    "nationality": "KR",
    "teamTag": "DRX",
    "league": "LCK"
  },

  // --- [LCK] DK.C ---
  // Sharvel
  {
    "id": "DKC-sharvel",
    "baseName": "Sharvel",
    "variant": "DK.C Sharvel",
    "role": "Jungle",
    "rating": 67,
    "rarity": "Commune",
    "image": "/cardsImg/2026-players/DKC_sharvel.webp",
    "nationality": "KR",
    "teamTag": "DK.C",
    "league": "LCK"
  },

  // --- [LCK] KT ---
  // Bdd
  {
    "id": "bdd-kt",
    "baseName": "Bdd",
    "variant": "KT Bdd",
    "role": "Mid",
    "rating": 79,
    "rarity": "Rare",
    "image": "/cardsImg/2026-players/KT_bdd.webp",
    "nationality": "KR",
    "teamTag": "KT",
    "league": "LCK"
  },
  {
    "id": "bdd-lck-mvp",
    "baseName": "Bdd",
    "variant": "2025 Worlds finalist",
    "role": "Mid",
    "rating": 86,
    "rarity": "Épique",
    "image": "/cardsImg/others/world_finalist_bdd_2025.jpg",
    "nationality": "KR",
    "teamTag": "KT",
    "league": "LCK"
  },
  // Effort
  {
    "id": "kt-effort",
    "baseName": "Effort",
    "variant": "KT Effort",
    "role": "Support",
    "rating": 70,
    "rarity": "Commune",
    "image": "/cardsImg/2026-players/KT_effort.webp",
    "nationality": "KR",
    "teamTag": "KT",
    "league": "LCK"
  },

  // --- [LCK] DRX ---
  // Kingen
  {
    "id": "drx-kingen-finals-mvp",
    "baseName": "Kingen",
    "variant": "Worlds Finals MVP",
    "role": "Top",
    "rating": 92,
    "rarity": "WANTED",
    "image": "/cardsImg/external/drx_kingen.jpg",
    "nationality": "KR",
    "teamTag": "DRX",
    "league": "LCK"
  },
  // Pyosik
  {
    "id": "drx-pyosik-world-champion",
    "baseName": "Pyosik",
    "variant": "World Champion",
    "role": "Jungle",
    "rating": 90,
    "rarity": "Légendaire",
    "image": "/cardsImg/external/drx_pyosik.jpg",
    "nationality": "KR",
    "teamTag": "DRX",
    "league": "LCK"
  },
  // Ucal
  {
    "id": "DRX_ucal",
    "baseName": "Ucal",
    "variant": "DRX Ucal",
    "role": "Mid",
    "rating": 68,
    "rarity": "Commune",
    "image": "/cardsImg/2026-players/DRX_ucal.webp",
    "nationality": "KR",
    "teamTag": "DRX",
    "league": "LCK"
  },
  // Zeka
  {
    "id": "drx-zeka-world-champion",
    "baseName": "Zeka",
    "variant": "World Champion",
    "role": "Mid",
    "rating": 92,
    "rarity": "Légendaire",
    "image": "/cardsImg/external/drx_zeka.jpg",
    "nationality": "KR",
    "teamTag": "DRX",
    "league": "LCK"
  },
  // Deft
  {
    "id": "drx-deft-last-dance",
    "baseName": "Deft",
    "variant": "World Champion",
    "role": "ADC",
    "rating": 93,
    "rarity": "Légendaire",
    "image": "/cardsImg/external/drx_deft.jpg",
    "nationality": "KR",
    "teamTag": "DRX",
    "league": "LCK"
  },
  // Jiwoo
  {
    "id": "drx-jiwoo",
    "baseName": "Jiwoo",
    "variant": "DRX Jiwoo",
    "role": "ADC",
    "rating": 68,
    "rarity": "Commune",
    "image": "/cardsImg/2026-players/DRX_jiwoo.webp",
    "nationality": "KR",
    "teamTag": "DRX",
    "league": "LCK"
  },

  // --- [LCK] BRO ---
  // Morgan
  {
    "id": "bro-morgan",
    "baseName": "Morgan",
    "variant": "BRO Morgan",
    "role": "Top",
    "rating": 62,
    "rarity": "Commune",
    "image": "/cardsImg/2026-players/BRO_morgan.webp",
    "nationality": "KR",
    "teamTag": "BRO",
    "league": "LCK"
  },
  // Gideon
  {
    "id": "bro-gideon",
    "baseName": "Gideon",
    "variant": "BRO Gideon",
    "role": "Jungle",
    "rating": 63,
    "rarity": "Commune",
    "image": "/cardsImg/2026-players/BRO_gideon.webp",
    "nationality": "KR",
    "teamTag": "BRO",
    "league": "LCK"
  },
  // Roamer
  {
    "id": "BRO-roamer",
    "baseName": "Roamer",
    "variant": "BRO Roamer",
    "role": "Mid",
    "rating": 62,
    "rarity": "Commune",
    "image": "/cardsImg/2026-players/BRO_roamer.webp",
    "nationality": "KR",
    "teamTag": "BRO",
    "league": "LCK"
  },
  // Teddy
  {
    "id": "bro-teddy",
    "baseName": "Teddy",
    "variant": "BRO Teddy",
    "role": "ADC",
    "rating": 69,
    "rarity": "Commune",
    "image": "/cardsImg/2026-players/BRO_teddy.webp",
    "nationality": "KR",
    "teamTag": "BRO",
    "league": "LCK"
  },

  // --- [LCK] DNS ---
  // DuDu
  {
    "id": "dns-dudu",
    "baseName": "DuDu",
    "variant": "DNS DuDu",
    "role": "Top",
    "rating": 60,
    "rarity": "Commune",
    "image": "/cardsImg/2026-players/DNS_dudu.webp",
    "nationality": "KR",
    "teamTag": "DNS",
    "league": "LCK"
  },
  // Clozer
  {
    "id": "DNS_clozer",
    "baseName": "Clozer",
    "variant": "DNS Clozer",
    "role": "Mid",
    "rating": 63,
    "rarity": "Commune",
    "image": "/cardsImg/2026-players/DNS_clozer.webp",
    "nationality": "KR",
    "teamTag": "DNS",
    "league": "LCK"
  },
  // Deokdam
  {
    "id": "DNS-deokdam",
    "baseName": "Deokdam",
    "variant": "DNS Deokdam",
    "role": "ADC",
    "rating": 66,
    "rarity": "Commune",
    "image": "/cardsImg/2026-players/DNS_deokdam.webp",
    "nationality": "KR",
    "teamTag": "DNS",
    "league": "LCK"
  },
  // Peter
  {
    "id": "dns-peter",
    "baseName": "Peter",
    "variant": "DNS Peter",
    "role": "Support",
    "rating": 65,
    "rarity": "Commune",
    "image": "/cardsImg/2026-players/DNS_peter.webp",
    "nationality": "KR",
    "teamTag": "DNS",
    "league": "LCK"
  },

  // --- [LCK] FRX ---
  // Raptor
  {
    "id": "frx-raptor",
    "baseName": "Raptor",
    "variant": "FRX Raptor",
    "role": "Jungle",
    "rating": 63,
    "rarity": "Commune",
    "image": "/cardsImg/2026-players/FRX_raptor.webp",
    "nationality": "KR",
    "teamTag": "FRX",
    "league": "LCK"
  },
  // Vicla
  {
    "id": "FEARX-vicla",
    "baseName": "Vicla",
    "variant": "FRX Vicla",
    "role": "Mid",
    "rating": 69,
    "rarity": "Commune",
    "image": "/cardsImg/2026-players/FEARX_vicla.webp",
    "nationality": "KR",
    "teamTag": "FRX",
    "league": "LCK"
  },
  // Kellin
  {
    "id": "frx-kellin",
    "baseName": "Kellin",
    "variant": "FRX Kellin",
    "role": "Support",
    "rating": 66,
    "rarity": "Commune",
    "image": "/cardsImg/2026-players/FRX_kellin.webp",
    "nationality": "KR",
    "teamTag": "FRX",
    "league": "LCK"
  },

  // --- [LCK] NS ---
  // Sponge
  {
    "id": "ns-sponge",
    "baseName": "Sponge",
    "variant": "NS Sponge",
    "role": "Jungle",
    "rating": 67,
    "rarity": "Commune",
    "image": "/cardsImg/2026-players/NS_sponge.webp",
    "nationality": "KR",
    "teamTag": "NS",
    "league": "LCK"
  },
  // Scout
  {
    "id": "nongshim-scout",
    "baseName": "Scout",
    "variant": "NS Scout",
    "role": "Mid",
    "rating": 72,
    "rarity": "Commune",
    "image": "/cardsImg/2026-players/NS_scout.webp",
    "nationality": "KR",
    "teamTag": "NS",
    "league": "LCK"
  },
  // Lehends
  {
    "id": "ns-lehends",
    "baseName": "Lehends",
    "variant": "NS Lehends",
    "role": "Support",
    "rating": 73,
    "rarity": "Rare",
    "image": "/cardsImg/2026-players/NS_lehends.webp",
    "nationality": "KR",
    "teamTag": "NS",
    "league": "LCK"
  },

  // --- [LCK] ROX ---
  // Smeb
  {
    "id": "custom-smeb-1793401108574",
    "baseName": "Smeb",
    "variant": "lck legend",
    "role": "Top",
    "rating": 93,
    "rarity": "WANTED",
    "image": "/cardsImg/custom/smeb_legend.jpg",
    "nationality": "KR",
    "teamTag": "ROX",
    "league": "LCK",
    "video": "/videos/smeb_lck_legend.mp4",
    "themeColor": "#fffafa"
  },

  // ============================================================================
  // LEC (EUROPE)
  // ============================================================================

  // --- [LEC] G2 ---
  // BrokenBlade
  {
    "id": "brokenblade-g2",
    "baseName": "BrokenBlade",
    "variant": "G2 BrokenBlade",
    "role": "Top",
    "rating": 79,
    "rarity": "Rare",
    "image": "/cardsImg/2026-players/g2_brokenblade.webp",
    "nationality": "DE",
    "teamTag": "G2",
    "league": "LEC"
  },
  // Wunder
  {
    "id": "g2-wunder-2019",
    "baseName": "Wunder",
    "variant": "G2 Wunder",
    "role": "Top",
    "rating": 78,
    "rarity": "Rare",
    "image": "/cardsImg/others/G2_wunder.png",
    "nationality": "DK",
    "teamTag": "G2",
    "league": "LEC"
  },
  // Jankos
  {
    "id": "g2-jankos",
    "baseName": "Jankos",
    "variant": "G2 Jankos",
    "role": "Jungle",
    "rating": 78,
    "rarity": "Rare",
    "image": "/cardsImg/others/G2_jankos.png",
    "nationality": "PL",
    "teamTag": "G2",
    "league": "LEC"
  },
  {
    "id": "g2-jankos-msi-champion",
    "baseName": "Jankos",
    "variant": "MSI Champion",
    "role": "Jungle",
    "rating": 85,
    "rarity": "Épique",
    "image": "/cardsImg/external/g2_jankos.jpg",
    "nationality": "PL",
    "teamTag": "G2",
    "league": "LEC"
  },
  // Caps
  {
    "id": "caps-g2-2024",
    "baseName": "Caps",
    "variant": "G2 Caps",
    "role": "Mid",
    "rating": 81,
    "rarity": "Rare",
    "image": "/cardsImg/2026-players/g2_caps.webp",
    "nationality": "DK",
    "teamTag": "G2",
    "league": "LEC"
  },
  {
    "id": "caps-msi-mvp",
    "baseName": "Caps",
    "variant": "2019 MSI MVP",
    "role": "Mid",
    "rating": 91,
    "rarity": "Légendaire",
    "image": "/cardsImg/others/CAPS-MSI.avif",
    "nationality": "DK",
    "teamTag": "G2",
    "league": "LEC"
  },
  // Hans Sama
  {
    "id": "g2-hanssama",
    "baseName": "Hans Sama",
    "variant": "G2 Hans Sama",
    "role": "ADC",
    "rating": 78,
    "rarity": "Rare",
    "image": "/cardsImg/2026-players/G2_hans-sama.webp",
    "nationality": "FR",
    "teamTag": "G2",
    "league": "LEC"
  },
  // Labrov
  {
    "id": "g2-labrov",
    "baseName": "Labrov",
    "variant": "G2 Labrov",
    "role": "Support",
    "rating": 79,
    "rarity": "Rare",
    "image": "/cardsImg/2026-players/G2_labrov.webp",
    "nationality": "GR",
    "teamTag": "G2",
    "league": "LEC"
  },
  // Mikyx
  {
    "id": "mikyx-msi-2019",
    "baseName": "Mikyx",
    "variant": "MSI Champion Mikyx",
    "role": "Support",
    "rating": 85,
    "rarity": "Épique",
    "image": "/cardsImg/others/MSI_2019_mikyx.jpg",
    "nationality": "SI",
    "teamTag": "G2",
    "league": "LEC"
  },

  // --- [LEC] FNC ---
  // Empyros
  {
    "id": "fnc-empyros",
    "baseName": "Empyros",
    "variant": "FNC Empyros",
    "role": "Top",
    "rating": 53,
    "rarity": "Commune",
    "image": "/cardsImg/2026-players/FNC_empyros.webp",
    "nationality": "GR",
    "teamTag": "FNC",
    "league": "LEC"
  },
  // Huni
  {
    "id": "fnc-huni-18-0",
    "baseName": "Huni",
    "variant": "18-0 LEC",
    "role": "Top",
    "rating": 86,
    "rarity": "Épique",
    "image": "/cardsImg/external/fnc_huni.jpg",
    "nationality": "KR",
    "teamTag": "FNC",
    "league": "LEC"
  },
  // Oscarinin
  {
    "id": "fnc-oscarinin",
    "baseName": "Oscarinin",
    "variant": "FNC Oscarinin",
    "role": "Top",
    "rating": 72,
    "rarity": "Rare",
    "image": "/cardsImg/2026-players/FNC_oscarinin.webp",
    "nationality": "ES",
    "teamTag": "FNC",
    "league": "LEC"
  },
  // Soboro
  {
    "id": "fnc-soboro",
    "baseName": "Soboro",
    "variant": "FNC Soboro",
    "role": "Top",
    "rating": 67,
    "rarity": "Commune",
    "image": "/cardsImg/2026-players/FNC_soboro.webp",
    "nationality": "KR",
    "teamTag": "FNC",
    "league": "LEC"
  },
  // Razork
  {
    "id": "fnc-razork",
    "baseName": "Razork",
    "variant": "FNC Razork",
    "role": "Jungle",
    "rating": 74,
    "rarity": "Rare",
    "image": "/cardsImg/2026-players/FNC_razork.webp",
    "nationality": "ES",
    "teamTag": "FNC",
    "league": "LEC"
  },
  // Humanoid
  {
    "id": "fnc-humanoid-champion",
    "baseName": "Humanoid",
    "variant": "2x LEC Champion",
    "role": "Mid",
    "rating": 83,
    "rarity": "Épique",
    "image": "/cardsImg/external/fnc_humanoid.jpg",
    "nationality": "CZ",
    "teamTag": "FNC",
    "league": "LEC"
  },
  // Vladi
  {
    "id": "fnc-vladi",
    "baseName": "Vladi",
    "variant": "FNC Vladi",
    "role": "Mid",
    "rating": 70,
    "rarity": "Commune",
    "image": "/cardsImg/2026-players/FNC_vladi.webp",
    "nationality": "GR",
    "teamTag": "FNC",
    "league": "LEC"
  },
  // Rekkles
  {
    "id": "fnc-rekkles-legend",
    "baseName": "Rekkles",
    "variant": "4x LEC Champion",
    "role": "ADC",
    "rating": 87,
    "rarity": "Épique",
    "image": "/cardsImg/external/fnc_rekkles.jpg",
    "nationality": "SE",
    "teamTag": "FNC",
    "league": "LEC"
  },

  // --- [LEC] KC ---
  // Canna
  {
    "id": "kc-canna",
    "baseName": "Canna",
    "variant": "KC Canna",
    "role": "Top",
    "rating": 77,
    "rarity": "Rare",
    "image": "/cardsImg/2026-players/KC_canna.webp",
    "nationality": "KR",
    "teamTag": "KC",
    "league": "LEC"
  },
  {
    "id": "kc-canna-champion",
    "baseName": "Canna",
    "variant": "LEC Champion Canna",
    "role": "Top",
    "rating": 82,
    "rarity": "Épique",
    "image": "/cardsImg/others/canna_lec_winner.jpg",
    "nationality": "KR",
    "teamTag": "KC",
    "league": "LEC"
  },
  // Yike
  {
    "id": "kc-yike",
    "baseName": "Yike",
    "variant": "KC Yike",
    "role": "Jungle",
    "rating": 77,
    "rarity": "Rare",
    "image": "/cardsImg/2026-players/KC_yike.webp",
    "nationality": "SE",
    "teamTag": "KC",
    "league": "LEC"
  },
  // Kyeahoo
  {
    "id": "kc-kyeahoo-2026",
    "baseName": "Kyeahoo",
    "variant": "KC Kyeahoo",
    "role": "Mid",
    "rating": 74,
    "rarity": "Rare",
    "image": "/cardsImg/2026-players/kc_kyeahoo.webp",
    "nationality": "KR",
    "teamTag": "KC",
    "league": "LEC"
  },
  // Caliste
  {
    "id": "caliste-kcorp-2024",
    "baseName": "Caliste",
    "variant": "KC Caliste",
    "role": "ADC",
    "rating": 76,
    "rarity": "Rare",
    "image": "/cardsImg/2026-players/kc_caliste.webp",
    "nationality": "FR",
    "teamTag": "KC",
    "league": "LEC"
  },
  {
    "id": "caliste-2026",
    "baseName": "Caliste",
    "variant": "EWC 2026 Caliste",
    "role": "ADC",
    "rating": 85,
    "rarity": "Épique",
    "image": "/cardsImg/fullart/caliste_star.jpg",
    "nationality": "FR",
    "teamTag": "KC",
    "league": "LEC"
  },
  /*
  // Carte en réserve pour future rareté / occasion :
  {
    "id": "kc-caliste-first-stand",
    "baseName": "Caliste",
    "variant": "First Stand Caliste",
    "role": "ADC",
    "rating": 86,
    "rarity": "Épique",
    "image": "/cardsImg/fullart/caliste_firststand.jpg",
    "nationality": "FR",
    "teamTag": "KC",
    "league": "LEC"
  },
  */
  {
    "id": "caliste-prodige",
    "baseName": "Caliste",
    "variant": "Le Prodige",
    "role": "ADC",
    "rating": 88,
    "rarity": "WANTED",
    "image": "/cardsImg/others/caliste_prodigy.jpg",
    "nationality": "FR",
    "teamTag": "KC",
    "league": "LEC",
    "video": "/videos/caliste_prodige.mp4"
  },
  // Upset
  {
    "id": "kc-upset",
    "baseName": "Upset",
    "variant": "KC Upset",
    "role": "ADC",
    "rating": 60,
    "rarity": "Commune",
    "image": "/cardsImg/others/KC_upset.png",
    "nationality": "DE",
    "teamTag": "KC",
    "league": "LEC"
  },
  // Targamas
  {
    "id": "kc-targamas",
    "baseName": "Targamas",
    "variant": "KC Targamas",
    "role": "Support",
    "rating": 75,
    "rarity": "Rare",
    "image": "/cardsImg/2026-players/KC_targamas.webp",
    "nationality": "BE",
    "teamTag": "KC",
    "league": "LEC"
  },

  // --- [LEC] KCB ---
  // Tao
  {
    "id": "kcb-tao",
    "baseName": "Tao",
    "variant": "KCB Tao",
    "role": "Top",
    "rating": 54,
    "rarity": "Commune",
    "image": "/cardsImg/2026-players/KCB_tao.webp",
    "nationality": "IT",
    "teamTag": "KCB",
    "league": "LEC"
  },

  // --- [LEC] GX ---
  // Lot
  {
    "id": "gx-lot",
    "baseName": "Lot",
    "variant": "GX Lot",
    "role": "Top",
    "rating": 68,
    "rarity": "Commune",
    "image": "/cardsImg/2026-players/GX_lot.webp",
    "nationality": "TR",
    "teamTag": "GX",
    "league": "LEC"
  },
  // Odoamne
  {
    "id": "gx-odoamne",
    "baseName": "Odoamne",
    "variant": "GX Odoamne",
    "role": "Top",
    "rating": 65,
    "rarity": "Commune",
    "image": "/cardsImg/2026-players/GX_odoamne.webp",
    "nationality": "RO",
    "teamTag": "GX",
    "league": "LEC"
  },
  // Oscarinin
  {
    "id": "gx-oscarinin",
    "baseName": "Oscarinin",
    "variant": "GX Oscarinin",
    "role": "Top",
    "rating": 68,
    "rarity": "Commune",
    "image": "/cardsImg/2026-players/GX_oscarinin.webp",
    "nationality": "ES",
    "teamTag": "GX",
    "league": "LEC"
  },
  // Isma
  {
    "id": "gx-isma",
    "baseName": "Isma",
    "variant": "GX Isma",
    "role": "Jungle",
    "rating": 64,
    "rarity": "Commune",
    "image": "/cardsImg/2026-players/GX_isma.webp",
    "nationality": "FR",
    "teamTag": "GX",
    "league": "LEC"
  },
  // Jackies
  {
    "id": "GX-jackies",
    "baseName": "Jackies",
    "variant": "GX Jackies",
    "role": "Mid",
    "rating": 68,
    "rarity": "Commune",
    "image": "/cardsImg/2026-players/GX_jackies.webp",
    "nationality": "CZ",
    "teamTag": "GX",
    "league": "LEC"
  },
  // Jun
  {
    "id": "gx-jun",
    "baseName": "Jun",
    "variant": "GX Jun",
    "role": "Support",
    "rating": 64,
    "rarity": "Commune",
    "image": "/cardsImg/2026-players/GX_jun.webp",
    "nationality": "KR",
    "teamTag": "GX",
    "league": "LEC"
  },

  // --- [LEC] TH ---
  // Tracyn
  {
    "id": "th-tracyn",
    "baseName": "Tracyn",
    "variant": "TH Tracyn",
    "role": "Top",
    "rating": 60,
    "rarity": "Commune",
    "image": "/cardsImg/2026-players/TH_tracyn.webp",
    "nationality": "PL",
    "teamTag": "TH",
    "league": "LEC"
  },
  // Daglas
  {
    "id": "th-daglas",
    "baseName": "Daglas",
    "variant": "TH Daglas",
    "role": "Jungle",
    "rating": 61,
    "rarity": "Commune",
    "image": "/cardsImg/2026-players/TH_daglas.webp",
    "nationality": "PL",
    "teamTag": "TH",
    "league": "LEC"
  },
  // Sheo
  {
    "id": "th-sheo",
    "baseName": "Sheo",
    "variant": "TH Sheo",
    "role": "Jungle",
    "rating": 63,
    "rarity": "Commune",
    "image": "/cardsImg/2026-players/TH_sheo.webp",
    "nationality": "FR",
    "teamTag": "TH",
    "league": "LEC"
  },
  // Flakked
  {
    "id": "th-flakked",
    "baseName": "Flakked",
    "variant": "TH Flakked",
    "role": "ADC",
    "rating": 64,
    "rarity": "Commune",
    "image": "/cardsImg/2026-players/TH_flakked.webp",
    "nationality": "ES",
    "teamTag": "TH",
    "league": "LEC"
  },
  // Ice
  {
    "id": "th-ice",
    "baseName": "Ice",
    "variant": "TH Ice",
    "role": "ADC",
    "rating": 70,
    "rarity": "Commune",
    "image": "/cardsImg/2026-players/TH_ice.webp",
    "nationality": "KR",
    "teamTag": "TH",
    "league": "LEC"
  },
  // Stend
  {
    "id": "th-stend",
    "baseName": "Stend",
    "variant": "TH Stend",
    "role": "Support",
    "rating": 57,
    "rarity": "Commune",
    "image": "/cardsImg/2026-players/TH_stend.webp",
    "nationality": "FR",
    "teamTag": "TH",
    "league": "LEC"
  },
  // Way
  {
    "id": "th-way",
    "baseName": "Way",
    "variant": "TH Way",
    "role": "Support",
    "rating": 59,
    "rarity": "Commune",
    "image": "/cardsImg/2026-players/TH_way.webp",
    "nationality": "KR",
    "teamTag": "TH",
    "league": "LEC"
  },

  // --- [LEC] SK ---
  // Wunder
  {
    "id": "sk-wunder",
    "baseName": "Wunder",
    "variant": "SK Wunder",
    "role": "Top",
    "rating": 66,
    "rarity": "Commune",
    "image": "/cardsImg/2026-players/SK_wunder.webp",
    "nationality": "DK",
    "teamTag": "SK",
    "league": "LEC"
  },
  // Serin
  {
    "id": "sk-serin",
    "baseName": "Serin",
    "variant": "SK Serin",
    "role": "Mid",
    "rating": 58,
    "rarity": "Commune",
    "image": "/cardsImg/2026-players/SK_serin.webp",
    "nationality": "TR",
    "teamTag": "SK",
    "league": "LEC"
  },
  // Jopa
  {
    "id": "sk-jopa",
    "baseName": "Jopa",
    "variant": "SK Jopa",
    "role": "ADC",
    "rating": 69,
    "rarity": "Commune",
    "image": "/cardsImg/2026-players/SK_jopa.webp",
    "nationality": "RS",
    "teamTag": "SK",
    "league": "LEC"
  },
  // Mikyx
  {
    "id": "sk-mikyx",
    "baseName": "Mikyx",
    "variant": "SK Mikyx",
    "role": "Support",
    "rating": 62,
    "rarity": "Commune",
    "image": "/cardsImg/2026-players/SK_mikyx.webp",
    "nationality": "SI",
    "teamTag": "SK",
    "league": "LEC"
  },

  // --- [LEC] VIT ---
  // Naak Nako
  {
    "id": "VIT_Naak-Nako",
    "baseName": "Naak Nako",
    "variant": "VIT Naak Nako",
    "role": "Top",
    "rating": 75,
    "rarity": "Rare",
    "image": "/cardsImg/2026-players/VIT_naak-nako.webp",
    "nationality": "FR",
    "teamTag": "VIT",
    "league": "LEC"
  },
  // Lyncas
  {
    "id": "vit-lyncas",
    "baseName": "Lyncas",
    "variant": "VIT Lyncas",
    "role": "Jungle",
    "rating": 65,
    "rarity": "Commune",
    "image": "/cardsImg/2026-players/VIT_lyncas.webp",
    "nationality": "LT",
    "teamTag": "VIT",
    "league": "LEC"
  },
  // Hylissang
  {
    "id": "vit-hylissang",
    "baseName": "Hylissang",
    "variant": "VIT Hylissang",
    "role": "Support",
    "rating": 54,
    "rarity": "Commune",
    "image": "/cardsImg/2026-players/VIT_hylissang.webp",
    "nationality": "BG",
    "teamTag": "VIT",
    "league": "LEC"
  },

  // --- [LEC] MDK ---
  // Alvaro
  {
    "id": "mdk-alvaro",
    "baseName": "Alvaro",
    "variant": "MDK Alvaro",
    "role": "Support",
    "rating": 68,
    "rarity": "Commune",
    "image": "/cardsImg/2026-players/MDK_alvaro.webp",
    "nationality": "ES",
    "teamTag": "MDK",
    "league": "LEC"
  },

  // --- [LEC] MAD ---
  // Elyoya
  {
    "id": "mad-elyoya",
    "baseName": "Elyoya",
    "variant": "MAD Lions Elyoya",
    "role": "Jungle",
    "rating": 76,
    "rarity": "Rare",
    "image": "/cardsImg/others/MAD_elyoya.png",
    "nationality": "ES",
    "teamTag": "MAD",
    "league": "LEC"
  },

  // --- [LEC] MKOI ---
  // Myrwn
  {
    "id": "mkoi-myrwn",
    "baseName": "Myrwn",
    "variant": "MKOI Myrwn",
    "role": "Top",
    "rating": 70,
    "rarity": "Commune",
    "image": "/cardsImg/2026-players/MKOI_myrwn.webp",
    "nationality": "ES",
    "teamTag": "MKOI",
    "league": "LEC"
  },

  // --- [LEC] RGE ---
  // Szygenda
  {
    "id": "szygenda",
    "baseName": "Szygenda",
    "variant": "Szygenda",
    "role": "Top",
    "rating": 50,
    "rarity": "Commune",
    "image": "/cardsImg/2026-players/szygenda.webp",
    "nationality": "DK",
    "teamTag": "RGE",
    "league": "LEC"
  },
  // Larssen
  {
    "id": "larssen-RGE",
    "baseName": "Larssen",
    "variant": "LEC Champion Larssen",
    "role": "Mid",
    "rating": 77,
    "rarity": "Rare",
    "image": "/cardsImg/others/larssen_lec_champ.png",
    "nationality": "SE",
    "teamTag": "RGE",
    "league": "LEC"
  },

  // --- [LEC] NAVI ---
  // Adam
  {
    "id": "NAVI-adam",
    "baseName": "Adam",
    "variant": "NAVI Adam",
    "role": "Top",
    "rating": 68,
    "rarity": "Commune",
    "image": "/cardsImg/2026-players/NAVI_adam.webp",
    "nationality": "FR",
    "teamTag": "NAVI",
    "league": "LEC"
  },
  // Maynter
  {
    "id": "NAVI-maynter",
    "baseName": "Maynter",
    "variant": "NAVI Maynter",
    "role": "Top",
    "rating": 61,
    "rarity": "Commune",
    "image": "/cardsImg/2026-players/NAVI_maynter.webp",
    "nationality": "UA",
    "teamTag": "NAVI",
    "league": "LEC"
  },
  // Poby
  {
    "id": "navi_poby",
    "baseName": "Poby",
    "variant": "Navi Poby",
    "role": "Mid",
    "rating": 64,
    "rarity": "Commune",
    "image": "/cardsImg/2026-players/navi_poby.webp",
    "nationality": "KR",
    "teamTag": "NAVI",
    "league": "LEC"
  },

  // --- [LEC] SHFT ---
  // Rooster
  {
    "id": "shft-rooster",
    "baseName": "Rooster",
    "variant": "SHFT Rooster",
    "role": "Top",
    "rating": 68,
    "rarity": "Commune",
    "image": "/cardsImg/2026-players/SHFT_rooster.webp",
    "nationality": "KR",
    "teamTag": "SHFT",
    "league": "LEC"
  },
  // Nuc
  {
    "id": "shifters-nuc",
    "baseName": "Nuc",
    "variant": "SHFT Nuc",
    "role": "Mid",
    "rating": 64,
    "rarity": "Commune",
    "image": "/cardsImg/2026-players/SHFT_nuc.webp",
    "nationality": "FR",
    "teamTag": "SHFT",
    "league": "LEC"
  },

  // --- [LEC] LR ---
  // Thebausffs
  {
    "id": "lr-baus",
    "baseName": "Thebausffs",
    "variant": "LR Bausffs",
    "role": "Top",
    "rating": 59,
    "rarity": "Commune",
    "image": "/cardsImg/2026-players/LR_baus.webp",
    "nationality": "SE",
    "teamTag": "LR",
    "league": "LEC"
  },

  // ============================================================================
  // LPL (CHINE)
  // ============================================================================

  // --- [LPL] BLG ---
  // Bin
  {
    "id": "blg-bin",
    "baseName": "Bin",
    "variant": "BLG Bin",
    "role": "Top",
    "rating": 82,
    "rarity": "Rare",
    "image": "/cardsImg/2026-players/BLG_bin.webp",
    "nationality": "CN",
    "teamTag": "BLG",
    "league": "LPL"
  },
  {
    "id": "bin-FirstStand-2026",
    "baseName": "Bin",
    "variant": "First Stand MVP Bin",
    "role": "Top",
    "rating": 88,
    "rarity": "Épique",
    "image": "/cardsImg/others/BLG-Bin-FST.jpg",
    "nationality": "CN",
    "teamTag": "BLG",
    "league": "LPL"
  },
  {
    "id": "bin-lpl-mvp",
    "baseName": "Bin",
    "variant": "2x LPL Finals MVP",
    "role": "Top",
    "rating": 92,
    "rarity": "Légendaire",
    "image": "/cardsImg/others/BLG_bin.jpg",
    "nationality": "CN",
    "teamTag": "BLG",
    "league": "LPL"
  },
  // Xun
  {
    "id": "blg-xun",
    "baseName": "Xun",
    "variant": "BLG Xun",
    "role": "Jungle",
    "rating": 79,
    "rarity": "Rare",
    "image": "/cardsImg/2026-players/blg_xun.webp",
    "nationality": "CN",
    "teamTag": "BLG",
    "league": "LPL"
  },
  {
    "id": "xun-3x-MSI-finalist",
    "baseName": "Xun",
    "variant": "3x MSI finalist",
    "role": "Jungle",
    "rating": 85,
    "rarity": "Épique",
    "image": "/cardsImg/others/Xun_2026.png",
    "nationality": "CN",
    "teamTag": "BLG",
    "league": "LPL"
  },
  {
    "id": "xun-LPL-4x",
    "baseName": "Xun",
    "variant": "4x LPL Champion",
    "role": "Jungle",
    "rating": 89,
    "rarity": "Légendaire",
    "image": "/cardsImg/others/Xun_LPL_BLG.jpg",
    "nationality": "CN",
    "teamTag": "BLG",
    "league": "LPL"
  },
  // Knight
  {
    "id": "knight-blg-2024",
    "baseName": "Knight",
    "variant": "BLG Knight",
    "role": "Mid",
    "rating": 84,
    "rarity": "Rare",
    "image": "/cardsImg/2026-players/blg_knight.webp",
    "nationality": "CN",
    "teamTag": "BLG",
    "league": "LPL"
  },
  {
    "id": "knight-fst-2026",
    "baseName": "Knight",
    "variant": "FST Champion",
    "role": "Mid",
    "rating": 87,
    "rarity": "Épique",
    "image": "/cardsImg/others/FST_knight.jpg",
    "nationality": "CN",
    "teamTag": "BLG",
    "league": "LPL"
  },
  {
    "id": "blg-knight-finals-mvp",
    "baseName": "Knight",
    "variant": "LPL Finals MVP Knight",
    "role": "Mid",
    "rating": 91,
    "rarity": "Légendaire",
    "image": "/cardsImg/others/BLG-knight-2.jpg",
    "nationality": "CN",
    "teamTag": "BLG",
    "league": "LPL"
  },
  // Elk
  {
    "id": "blg-elk",
    "baseName": "Elk",
    "variant": "BLG Elk",
    "role": "ADC",
    "rating": 79,
    "rarity": "Rare",
    "image": "/cardsImg/others/BLG_elk.png",
    "nationality": "CN",
    "teamTag": "BLG",
    "league": "LPL"
  },
  {
    "id": "elk-lpl-mvp",
    "baseName": "Elk",
    "variant": "LPL MVP",
    "role": "ADC",
    "rating": 85,
    "rarity": "Épique",
    "image": "/cardsImg/others/elk_lpl_mvp.jpg",
    "nationality": "CN",
    "teamTag": "BLG",
    "league": "LPL"
  },
  // Viper
  {
    "id": "hle-viper",
    "baseName": "Viper",
    "variant": "HLE Viper",
    "role": "ADC",
    "rating": 80,
    "rarity": "Rare",
    "image": "/cardsImg/others/HLE_viper.png",
    "nationality": "KR",
    "teamTag": "HLE",
    "league": "LCK"
  },
  {
    "id": "blg-viper",
    "baseName": "Viper",
    "variant": "BLG Viper",
    "role": "ADC",
    "rating": 82,
    "rarity": "Rare",
    "image": "/cardsImg/2026-players/BLG_viper.webp",
    "nationality": "KR",
    "teamTag": "BLG",
    "league": "LPL"
  },
  {
    "id": "viper-lpl-champion",
    "baseName": "Viper",
    "variant": "First Stand Champion",
    "role": "ADC",
    "rating": 85,
    "rarity": "Épique",
    "image": "/cardsImg/others/viper_2026.jpg",
    "nationality": "KR",
    "teamTag": "BLG",
    "league": "LCK"
  },/*
  {
    "id": "viper-lpl-MVP",
    "baseName": "Viper",
    "variant": "LPL MVP",
    "role": "ADC",
    "rating": 87,
    "rarity": "Épique",
    "image": "/cardsImg/others/blg_viper_lpl.jpg",
    "nationality": "KR",
    "teamTag": "BLG",
    "league": "LPL"
  },*/
  {
    "id": "viper-lpl-3x",
    "baseName": "Viper",
    "variant": "3x LPL Champion & MVP",
    "role": "ADC",
    "rating": 90,
    "rarity": "Légendaire",
    "image": "/cardsImg/others/BLG_viper_leg.jpg",
    "nationality": "KR",
    "teamTag": "BLG",
    "league": "LPL"
  },
  // ON
  {
    "id": "blg-on-lpl",
    "baseName": "ON",
    "variant": "5x LPL champion",
    "role": "Support",
    "rating": 87,
    "rarity": "Épique",
    "image": "/cardsImg/others/BLG-ON-LPL.jpg",
    "nationality": "CN",
    "teamTag": "BLG",
    "league": "LPL"
  },

  // --- [LPL] JDG ---
  // 369
  {
    "id": "369-lpl-champion",
    "baseName": "369",
    "variant": "2023 MSI Champion",
    "role": "Top",
    "rating": 86,
    "rarity": "Épique",
    "image": "/cardsImg/others/msi_jdg_369.jpg",
    "nationality": "CN",
    "teamTag": "JDG",
    "league": "LPL"
  },
  // JunJia
  {
    "id": "jdg-junjia",
    "baseName": "JunJia",
    "variant": "JDG JunJia",
    "role": "Jungle",
    "rating": 73,
    "rarity": "Rare",
    "image": "/cardsImg/2026-players/JDG_junjia.webp",
    "nationality": "TW",
    "teamTag": "JDG",
    "league": "LPL"
  },
  // Kanavi
  {
    "id": "jdg-kanavi",
    "baseName": "Kanavi",
    "variant": "JDG Kanavi",
    "role": "Jungle",
    "rating": 81,
    "rarity": "Rare",
    "image": "/cardsImg/others/JDG_kanavi.png",
    "nationality": "KR",
    "teamTag": "JDG",
    "league": "LPL"
  },
  {
    "id": "kanavi-msi-2023",
    "baseName": "Kanavi",
    "variant": "MSI Champion Kanavi",
    "role": "Jungle",
    "rating": 88,
    "rarity": "Épique",
    "image": "/cardsImg/others/JDG_kanavi.jpg",
    "nationality": "KR",
    "teamTag": "JDG",
    "league": "LPL"
  },
  {
    "id": "kanavi-lpl-mvp",
    "baseName": "Kanavi",
    "variant": "LPL 5x Champion",
    "role": "Jungle",
    "rating": 90,
    "rarity": "Légendaire",
    "image": "/cardsImg/others/kanavi_lpl_flag.jpg",
    "nationality": "KR",
    "teamTag": "JDG",
    "league": "LPL"
  },
  {
    "id": "kanavi-lpl-WANTED",
    "baseName": "Kanavi",
    "variant": "Insatiable",
    "role": "Jungle",
    "rating": 94,
    "rarity": "WANTED",
    "image": "/cardsImg/others/kanavi_chinese.jpg",
    "nationality": "KR",
    "teamTag": "JDG",
    "league": "LPL"
  },
  // Knight
  {
    "id": "knight-lpl-legend",
    "baseName": "Knight",
    "variant": "LPL Legend",
    "role": "Mid",
    "rating": 92,
    "rarity": "Légendaire",
    "image": "/cardsImg/others/JDG_knight_msi.png",
    "nationality": "CN",
    "teamTag": "JDG",
    "league": "LPL"
  },
  // Ruler
  {
    "id": "ruler-msi-2023",
    "baseName": "Ruler",
    "variant": "MSI Champion",
    "role": "ADC",
    "rating": 87,
    "rarity": "Épique",
    "image": "/cardsImg/others/jdg_ruler_msi.jpg",
    "nationality": "KR",
    "teamTag": "JDG",
    "league": "LPL"
  },
  /*
  // Carte en réserve pour future rareté / occasion :
  {
    "id": "jdg-ruler-golden-road",
    "baseName": "Ruler",
    "variant": "Golden Road Ruler",
    "role": "ADC",
    "rating": 92,
    "rarity": "Légendaire",
    "image": "/cardsImg/fullart/JDG_ruler.png",
    "nationality": "KR",
    "teamTag": "JDG",
    "league": "LPL"
  },
  */
  // JDG 2023 Missing
  {
    "id": "ruler-missing-redemption",
    "baseName": "JDG 2023 Missing",
    "variant": "La Rédemption",
    "role": "Support",
    "rating": 95,
    "rarity": "SECRET",
    "image": "/cardsImg/others/ruler_missing_DUO.jpg",
    "nationality": "CN",
    "teamTag": "JDG",
    "league": "LPL",
    "themeColor": "#E5142E"
  },
  // Missing
  {
    "id": "jdg-missing",
    "baseName": "Missing",
    "variant": "JDG MISSING",
    "role": "Support",
    "rating": 80,
    "rarity": "Rare",
    "image": "/cardsImg/others/JDG_missing.png",
    "nationality": "CN",
    "teamTag": "JDG",
    "league": "LPL"
  },
  {
    "id": "3LPL-missing",
    "baseName": "Missing",
    "variant": "3x LPL Champion",
    "role": "Support",
    "rating": 87,
    "rarity": "Épique",
    "image": "/cardsImg/others/JDG_missing.jpg",
    "nationality": "CN",
    "teamTag": "JDG",
    "league": "LPL"
  },
  {
    "id": "missing-msi-2023",
    "baseName": "Missing",
    "variant": "MSI Champion Missing",
    "role": "Support",
    "rating": 86,
    "rarity": "Épique",
    "image": "/cardsImg/others/MSI_MISSING.jpeg",
    "nationality": "CN",
    "teamTag": "JDG",
    "league": "LPL"
  },
  // Vampire
  {
    "id": "JDG-2026-vampire",
    "baseName": "Vampire",
    "variant": "JDG Vampire",
    "role": "Support",
    "rating": 77,
    "rarity": "Rare",
    "image": "/cardsImg/2026-players/JDG_vampire.webp",
    "nationality": "CN",
    "teamTag": "JDG",
    "league": "LPL"
  },

  // --- [LPL] TES ---
  // 369
  {
    "id": "tes-369",
    "baseName": "369",
    "variant": "TES 369",
    "role": "Top",
    "rating": 80,
    "rarity": "Rare",
    "image": "/cardsImg/2026-players/TES_369.webp",
    "nationality": "CN",
    "teamTag": "TES",
    "league": "LPL"
  },
  // Tian
  {
    "id": "tes-tian",
    "baseName": "Tian",
    "variant": "TES Tian",
    "role": "Jungle",
    "rating": 79,
    "rarity": "Rare",
    "image": "/cardsImg/2026-players/TES_tian.webp",
    "nationality": "CN",
    "teamTag": "TES",
    "league": "LPL"
  },
  // JackeyLove
  {
    "id": "tes-jackeylove",
    "baseName": "JackeyLove",
    "variant": "TES JackeyLove",
    "role": "ADC",
    "rating": 81,
    "rarity": "Rare",
    "image": "/cardsImg/2026-players/TES_jackeylove.webp",
    "nationality": "CN",
    "teamTag": "TES",
    "league": "LPL"
  },
  // Meiko
  {
    "id": "meiko-tes",
    "baseName": "Meiko",
    "variant": "TES Meiko",
    "role": "Support",
    "rating": 80,
    "rarity": "Rare",
    "image": "/cardsImg/others/tes_meiko.png",
    "nationality": "CN",
    "teamTag": "TES",
    "league": "LPL"
  },

  // --- [LPL] EDG ---
  // zdz
  {
    "id": "edg_zdz",
    "baseName": "zdz",
    "variant": "EDG zdz",
    "role": "Top",
    "rating": 67,
    "rarity": "Commune",
    "image": "/cardsImg/2026-players/EDG_zdz.webp",
    "nationality": "CN",
    "teamTag": "EDG",
    "league": "LPL"
  },
  // Scout
  {
    "id": "edg-scout-champion",
    "baseName": "Scout",
    "variant": "LPL Champion",
    "role": "Mid",
    "rating": 88,
    "rarity": "Épique",
    "image": "/cardsImg/external/edg_scout.jpg",
    "nationality": "KR",
    "teamTag": "EDG",
    "league": "LPL"
  },
  {
    "id": "edg-scout-finals-mvp",
    "baseName": "Scout",
    "variant": "Worlds Finals MVP",
    "role": "Mid",
    "rating": 92,
    "rarity": "WANTED",
    "image": "/cardsImg/external/scout_wanted.jpg",
    "nationality": "KR",
    "teamTag": "EDG",
    "league": "LPL"
  },
  // Viper
  {
    "id": "edg-viper-world-champion",
    "baseName": "Viper",
    "variant": "World Champion",
    "role": "ADC",
    "rating": 92,
    "rarity": "Légendaire",
    "image": "/cardsImg/external/edg_viper.jpg",
    "nationality": "KR",
    "teamTag": "EDG",
    "league": "LPL"
  },
  // Meiko
  {
    "id": "meiko-edg-msi",
    "baseName": "Meiko",
    "variant": "MSI Champion Meiko",
    "role": "Support",
    "rating": 86,
    "rarity": "Épique",
    "image": "/cardsImg/others/EDG_meiko_MSI.png",
    "nationality": "CN",
    "teamTag": "EDG",
    "league": "LPL"
  },
  {
    "id": "meiko-LPL-Legend",
    "baseName": "Meiko",
    "variant": "LPL Legend",
    "role": "Support",
    "rating": 92,
    "rarity": "Légendaire",
    "image": "/cardsImg/others/legend_MEIKO.jpg",
    "nationality": "CN",
    "teamTag": "EDG",
    "league": "LPL"
  },

  // --- [LPL] IG ---
  // TheShy
  {
    "id": "theshy-legend",
    "baseName": "TheShy",
    "variant": "Legend",
    "role": "Top",
    "rating": 96,
    "rarity": "WANTED",
    "image": "/cardsImg/others/TheShy_legend.jpg",
    "nationality": "KR",
    "teamTag": "IG",
    "league": "LPL",
    "video": "/videos/theshy_god.mp4"
  },
  // Rookie
  {
    "id": "rookie-ig",
    "baseName": "Rookie",
    "variant": "IG Rookie",
    "role": "Mid",
    "rating": 80,
    "rarity": "Rare",
    "image": "/cardsImg/2026-players/IG_rookie.webp",
    "nationality": "KR",
    "teamTag": "IG",
    "league": "LPL"
  },
  {
    "id": "rookie-IG_2019",
    "baseName": "Rookie",
    "variant": "LPL Champion",
    "role": "Mid",
    "rating": 85,
    "rarity": "Épique",
    "image": "/cardsImg/others/IG_Rookie_2019.jpg",
    "nationality": "KR",
    "teamTag": "IG",
    "league": "LPL"
  },
  // JackeyLove
  {
    "id": "ig-jackeylove-world-champion",
    "baseName": "JackeyLove",
    "variant": "World Champion",
    "role": "ADC",
    "rating": 91,
    "rarity": "Légendaire",
    "image": "/cardsImg/external/ig_jackeylove.jpg",
    "nationality": "CN",
    "teamTag": "IG",
    "league": "LPL"
  },

  // --- [LPL] RNG ---
  // Uzi
  {
    "id": "uzi-msi-2018",
    "baseName": "Uzi",
    "variant": "MSI MVP",
    "role": "ADC",
    "rating": 91,
    "rarity": "Légendaire",
    "image": "/cardsImg/others/uzi_msi.webp",
    "nationality": "CN",
    "teamTag": "RNG",
    "league": "LPL"
  },
  {
    "id": "uzi-adc-god",
    "baseName": "Uzi",
    "variant": "ADC God",
    "role": "ADC",
    "rating": 94,
    "rarity": "WANTED",
    "image": "/cardsImg/others/uzi_adc_god.png",
    "nationality": "CN",
    "teamTag": "RNG",
    "league": "LPL",
    "video": "/videos/uzi_adcgod.mp4"
  },

  // --- [LPL] FPX ---
  // Tian
  {
    "id": "tian-lpl-champ",
    "baseName": "Tian",
    "variant": "LPL Champion",
    "role": "Jungle",
    "rating": 84,
    "rarity": "Épique",
    "image": "/cardsImg/others/FPX_Tian_LPL.jpg",
    "nationality": "CN",
    "teamTag": "FPX",
    "league": "LPL"
  },
  {
    "id": "fpx-tian-finals-mvp",
    "baseName": "Tian",
    "variant": "Worlds Finals MVP",
    "role": "Jungle",
    "rating": 93,
    "rarity": "WANTED",
    "image": "/cardsImg/external/fpx_tian.jpg",
    "nationality": "CN",
    "teamTag": "FPX",
    "league": "LPL"
  },
  // Doinb
  {
    "id": "fpx-doinb-world-champion",
    "baseName": "Doinb",
    "variant": "World Champion",
    "role": "Mid",
    "rating": 92,
    "rarity": "Légendaire",
    "image": "/cardsImg/external/fpx_doinb.jpg",
    "nationality": "KR",
    "teamTag": "FPX",
    "league": "LPL"
  },
  // --- [LPL] FPX ---
  // FLandre
  {
    "id": "Flandre-lpl-champ",
    "baseName": "Flandre",
    "variant": "3x LPL Champion",
    "role": "Top",
    "rating": 87,
    "rarity": "Épique",
    "image": "/cardsImg/others/AL_Flandre_msi.jpg",
    "nationality": "CN",
    "teamTag": "AL",
    "league": "LPL"
  },
  // Hope
  {
    "id": "Hope-lpl-champ",
    "baseName": "Hope",
    "variant": "3x LPL Champion",
    "role": "ADC",
    "rating": 87,
    "rarity": "Épique",
    "image": "/cardsImg/webp/AL_HOPE.webp",
    "nationality": "CN",
    "teamTag": "AL",
    "league": "LPL"
  },





  // ============================================================================
  // LCS (AMÉRIQUE DU NORD)
  // ============================================================================

  // --- [LCS] FLY ---
  // Bwipo
  {
    "id": "fly-bwipo",
    "baseName": "Bwipo",
    "variant": "FLY Bwipo",
    "role": "Top",
    "rating": 75,
    "rarity": "Rare",
    "image": "/cardsImg/2026-players/FLY_bwipo.webp",
    "nationality": "BE",
    "teamTag": "FLY",
    "league": "LCS"
  },
  // Massu
  {
    "id": "FLY-massu",
    "baseName": "Massu",
    "variant": "FLY Massu",
    "role": "ADC",
    "rating": 75,
    "rarity": "Rare",
    "image": "/cardsImg/2026-players/FLY_massu.webp",
    "nationality": "CA",
    "teamTag": "FLY",
    "league": "LCS"
  },

  // --- [LCS] TL ---
  // Doublelift
  {
    "id": "tl-doublelift-4peat",
    "baseName": "Doublelift",
    "variant": "8x LCS Champion",
    "role": "ADC",
    "rating": 88,
    "rarity": "Légendaire",
    "image": "/cardsImg/external/tl_doublelift.jpg",
    "nationality": "US",
    "teamTag": "TL",
    "league": "LCS"
  },
  // CoreJJ
  {
    "id": "tl-corejj",
    "baseName": "CoreJJ",
    "variant": "TL CoreJJ",
    "role": "Support",
    "rating": 75,
    "rarity": "Rare",
    "image": "/cardsImg/2026-players/TL_corejj.webp",
    "nationality": "KR",
    "teamTag": "TL",
    "league": "LCS"
  },

  // --- [LCS] C9 ---
  // Blaber
  {
    "id": "C9-blaber",
    "baseName": "Blaber",
    "variant": "C9 Blaber",
    "role": "Jungle",
    "rating": 70,
    "rarity": "Commune",
    "image": "/cardsImg/2026-players/C9_blaber.webp",
    "nationality": "US",
    "teamTag": "C9",
    "league": "LCS"
  },
  {
    "id": "blaber-c9-lcs",
    "baseName": "Blaber",
    "variant": "4x LCS champion",
    "role": "Jungle",
    "rating": 85,
    "rarity": "Épique",
    "image": "/cardsImg/others/C9_blaber_lcs.jpg",
    "nationality": "US",
    "teamTag": "C9",
    "league": "LCS"
  },
  // Nisqy
  {
    "id": "nisqy-c9",
    "baseName": "Nisqy",
    "variant": "C9 Nisqy",
    "role": "Mid",
    "rating": 77,
    "rarity": "Rare",
    "image": "/cardsImg/others/cloud9_nisqy.png",
    "nationality": "BE",
    "teamTag": "C9",
    "league": "LCS"
  },

  // --- [LCS] SEN ---
  // Impact
  {
    "id": "sen-impact",
    "baseName": "Impact",
    "variant": "SEN Impact",
    "role": "Top",
    "rating": 69,
    "rarity": "Commune",
    "image": "/cardsImg/2026-players/SEN_impact.webp",
    "nationality": "KR",
    "teamTag": "SEN",
    "league": "LCS"
  },
  // Rahel
  {
    "id": "sen-rahel",
    "baseName": "Rahel",
    "variant": "EN Rahel",
    "role": "ADC",
    "rating": 60,
    "rarity": "Commune",
    "image": "/cardsImg/2026-players/SEN_rahel.webp",
    "nationality": "KR",
    "teamTag": "SEN",
    "league": "LCS"
  },

  // --- [LCS] TSM ---
  // Bjergsen
  {
    "id": "tsm-bjergsen-6x-champ",
    "baseName": "Bjergsen",
    "variant": "6x LCS Champion",
    "role": "Mid",
    "rating": 86,
    "rarity": "Épique",
    "image": "/cardsImg/external/tsm_bjergsen.jpg",
    "nationality": "DK",
    "teamTag": "TSM",
    "league": "LCS"
  },
];

/**
 * Enregistre ou met à jour une carte dans le CARD_POOL en mémoire vive.
 */
export function registerCardInPool(card) {
  if (!card || !card.id) return;
  const idx = CARD_POOL.findIndex(c => c.id === card.id);
  if (idx !== -1) {
    CARD_POOL[idx] = card;
  } else {
    CARD_POOL.push(card);
  }
}

/**
 * Retire une carte du CARD_POOL en mémoire vive.
 */
export function unregisterCardFromPool(cardId) {
  if (!cardId) return;
  const idx = CARD_POOL.findIndex(c => c.id === cardId);
  if (idx !== -1) {
    CARD_POOL.splice(idx, 1);
  }
}
