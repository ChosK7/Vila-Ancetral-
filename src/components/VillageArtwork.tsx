import React, { useState } from 'react';
import { GameState, JobType, Villager } from '../types/game';

interface VillageArtworkProps {
  gameState: GameState;
  onSelectVillager?: (villager: Villager) => void;
  selectedVillagerId?: string | null;
}

export const VillageArtwork: React.FC<VillageArtworkProps> = ({
  gameState,
  onSelectVillager,
  selectedVillagerId,
}) => {
  const [viewMode, setViewMode] = useState<'overview' | 'fields' | 'construction' | 'monument'>('overview');
  const [hoveredVillager, setHoveredVillager] = useState<Villager | null>(null);

  const { villagers, buildings, currentEra, seasonIndex, zigguratStagesCompleted } = gameState;
  const seasons = ['Primavera', 'Verão', 'Outono', 'Inverno'] as const;
  const currentSeason = seasons[seasonIndex];

  // Helper counts
  const farmers = villagers.filter((v) => v.job === 'farmer');
  const lumberjacks = villagers.filter((v) => v.job === 'lumberjack');
  const quarrymen = villagers.filter((v) => v.job === 'quarryman');
  const potters = villagers.filter((v) => v.job === 'potter');
  const elders = villagers.filter((v) => v.job === 'elder');
  const guards = villagers.filter((v) => v.job === 'guard');
  const builders = villagers.filter((v) => v.job === 'builder');
  const idles = villagers.filter((v) => v.job === 'idle');

  const hasWalls = (buildings.stone_wall?.count || 0) > 0;
  const hasGranary = (buildings.granary?.count || 0) > 0;
  const hasWell = (buildings.village_well?.count || 0) > 0;
  const hasCookingPit = (buildings.cooking_pit?.count || 0) > 0;
  const hasGrinding = (buildings.grain_grinding?.count || 0) > 0;
  const hasLonghouse = (buildings.longhouse?.count || 0) > 0;
  const stoneDwellingsCount = buildings.stone_dwelling?.count || 0;
  const hutsCount = buildings.hut?.count || 1;
  const hasZiggurat = (buildings.ziggurat?.count || 0) > 0 || zigguratStagesCompleted > 0;

  // Render a Morphe/History styled stickman character with round white head and tunic
  const renderCharacter = (
    villager: Villager,
    x: number,
    y: number,
    action: 'sickle' | 'carry_wheat' | 'grind' | 'guard' | 'elder' | 'builder' | 'wood' | 'idle',
    scale: number = 1,
    flip: boolean = false
  ) => {
    const isSelected = selectedVillagerId === villager.id;
    const isHovered = hoveredVillager?.id === villager.id;

    return (
      <g
        key={villager.id}
        transform={`translate(${x}, ${y}) scale(${flip ? -scale : scale}, ${scale})`}
        className="cursor-pointer transition-transform duration-200 hover:scale-105"
        onClick={() => onSelectVillager && onSelectVillager(villager)}
        onMouseEnter={() => setHoveredVillager(villager)}
        onMouseLeave={() => setHoveredVillager(null)}
      >
        {/* Selection / Hover Glow Indicator */}
        {(isSelected || isHovered) && (
          <ellipse
            cx="0"
            cy="15"
            rx="22"
            ry="8"
            fill={isSelected ? '#F59E0B' : '#E5E7EB'}
            opacity={isSelected ? 0.6 : 0.4}
            className="animate-pulse"
          />
        )}

        {/* Shadow */}
        <ellipse cx="0" cy="46" rx="14" ry="4" fill="#000000" opacity="0.18" />

        {/* Legs */}
        {action === 'grind' ? (
          // Kneeling legs
          <g stroke="#1F1B18" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none">
            <path d="M -6 28 L -12 38 L -4 42" />
            <path d="M 6 28 L 12 38 L 4 42" />
          </g>
        ) : (
          // Standing / walking stick legs
          <g stroke="#1F1B18" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none">
            <path d="M -4 26 L -7 44 L -11 45" />
            <path d="M 4 26 L 7 44 L 11 45" />
          </g>
        )}

        {/* Tunic / Body */}
        <path
          d={
            action === 'grind'
              ? 'M -10 6 L 10 6 L 12 30 L -12 30 Z'
              : 'M -8 4 L 8 4 L 12 28 L -12 28 Z'
          }
          fill={villager.tunicColor || '#8C5A32'}
          stroke="#1F1B18"
          strokeWidth="2.4"
          strokeLinejoin="round"
        />

        {/* Tunic Belt / Hem line */}
        <path
          d="M -10 22 Q 0 24 10 22"
          stroke="#1F1B18"
          strokeWidth="1.8"
          fill="none"
        />

        {/* Head: Iconic White Circle with clean black outline */}
        <circle
          cx="0"
          cy="-10"
          r="14"
          fill="#FFFFFF"
          stroke="#1F1B18"
          strokeWidth="2.6"
        />

        {/* Hair Styles */}
        {villager.hairStyle === 'spiky' && (
          <path
            d="M -11 -18 Q -9 -25 -5 -21 Q -2 -26 2 -21 Q 6 -26 9 -20 Q 12 -23 13 -17"
            stroke="#1F1B18"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />
        )}
        {villager.hairStyle === 'side' && (
          <path
            d="M -13 -16 Q -6 -24 3 -21 Q 10 -22 13 -15 Q 11 -12 8 -13"
            stroke="#1F1B18"
            strokeWidth="2.4"
            fill="#2B241E"
          />
        )}
        {villager.hairStyle === 'wavy' && (
          <g fill="#2B241E">
            <path d="M -14 -12 Q -16 -24 0 -24 Q 15 -24 14 -10 Q 13 -2 15 2 Q 11 1 11 -8 Q 10 -18 0 -18 Q -10 -18 -11 -6 Q -13 0 -15 2 Q -13 -4 -14 -12 Z" />
          </g>
        )}
        {villager.hairStyle === 'elder' && (
          <g>
            {/* White/grey messy elder hair and beard */}
            <path
              d="M -13 -15 Q -10 -24 0 -24 Q 10 -24 14 -14 Q 16 -5 14 0"
              stroke="#5A524C"
              strokeWidth="2.8"
              fill="none"
            />
            {/* Beard */}
            <path
              d="M -8 -2 Q 0 10 0 16 Q 0 10 8 -2"
              fill="#ECE7DE"
              stroke="#5A524C"
              strokeWidth="1.8"
            />
          </g>
        )}
        {villager.hairStyle === 'bun' && (
          <g>
            <circle cx="0" cy="-24" r="5" fill="#2B241E" stroke="#1F1B18" strokeWidth="2" />
            <path d="M -10 -18 Q 0 -22 10 -18" stroke="#1F1B18" strokeWidth="2.5" fill="none" />
          </g>
        )}

        {/* Eyes: iconic black dots */}
        <circle cx="-4" cy="-10" r="1.8" fill="#1F1B18" />
        <circle cx="4" cy="-10" r="1.8" fill="#1F1B18" />

        {/* Eyebrows */}
        <path d="M -7 -14 Q -4 -16 -2 -14" stroke="#1F1B18" strokeWidth="1.4" fill="none" />
        <path d="M 2 -14 Q 4 -16 7 -14" stroke="#1F1B18" strokeWidth="1.4" fill="none" />

        {/* Mouth: gentle simple stroke */}
        {villager.morale > 70 ? (
          <path d="M -3 -4 Q 0 -1 3 -4" stroke="#1F1B18" strokeWidth="1.6" fill="none" strokeLinecap="round" />
        ) : (
          <path d="M -3 -3 L 3 -3" stroke="#1F1B18" strokeWidth="1.6" strokeLinecap="round" />
        )}

        {/* Arms & Action Tools */}
        {action === 'sickle' && (
          <g>
            {/* Bent forward reaping with sickle */}
            <path d="M -6 8 L -14 16 L -16 26" stroke="#1F1B18" strokeWidth="2.4" strokeLinecap="round" fill="none" />
            <path d="M 4 8 L -6 20 L -12 28" stroke="#1F1B18" strokeWidth="2.4" strokeLinecap="round" fill="none" />
            {/* Curved Sickle blade */}
            <path
              d="M -16 26 Q -26 24 -24 14 Q -22 8 -16 10"
              stroke="#4A5568"
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
            />
            {/* Wooden Handle */}
            <line x1="-12" y1="28" x2="-17" y2="25" stroke="#78350F" strokeWidth="3" strokeLinecap="round" />
          </g>
        )}

        {action === 'carry_wheat' && (
          <g>
            {/* Carrying large wheat bundle */}
            <path d="M -8 10 L -18 16 L -12 24" stroke="#1F1B18" strokeWidth="2.4" strokeLinecap="round" fill="none" />
            <path d="M 8 10 L -4 18 L 8 22" stroke="#1F1B18" strokeWidth="2.4" strokeLinecap="round" fill="none" />
            {/* Big Wheat sheaf */}
            <g transform="translate(-18, 10) rotate(-25)">
              <ellipse cx="0" cy="0" rx="14" ry="7" fill="#EAB308" stroke="#854D0E" strokeWidth="1.6" />
              <path d="M -14 -4 L 14 -4 M -12 0 L 12 0 M -13 4 L 13 4" stroke="#A16207" strokeWidth="1.2" />
              {/* Ears of grain flaring out */}
              <path d="M 12 -5 Q 24 -12 22 -3 M 12 0 Q 25 0 24 5 M 12 4 Q 22 10 20 1" stroke="#CA8A04" strokeWidth="1.8" />
              {/* Twine wrap */}
              <rect x="-3" y="-7" width="5" height="14" rx="2" fill="#78350F" stroke="#451A03" strokeWidth="1" />
            </g>
          </g>
        )}

        {action === 'grind' && (
          <g>
            {/* Hands holding stone pestle in mortar */}
            <path d="M -6 10 L -10 24 L -12 28" stroke="#1F1B18" strokeWidth="2.4" strokeLinecap="round" fill="none" />
            <path d="M 6 10 L -4 24 L -10 28" stroke="#1F1B18" strokeWidth="2.4" strokeLinecap="round" fill="none" />
            {/* Pestle */}
            <line x1="-10" y1="20" x2="-12" y2="34" stroke="#6B7280" strokeWidth="4.5" strokeLinecap="round" />
            {/* Mortar stone */}
            <ellipse cx="-12" cy="38" rx="12" ry="7" fill="#9CA3AF" stroke="#374151" strokeWidth="2" />
            <ellipse cx="-12" cy="36" rx="9" ry="4" fill="#D1D5DB" />
            {/* Ground flour dots */}
            <circle cx="-13" cy="36" r="1.5" fill="#FEF08A" />
            <circle cx="-9" cy="37" r="1.2" fill="#FEF08A" />
          </g>
        )}

        {action === 'guard' && (
          <g>
            {/* Spear and wooden shield */}
            {/* Spear arm */}
            <path d="M 6 10 L 16 16 L 16 26" stroke="#1F1B18" strokeWidth="2.4" strokeLinecap="round" fill="none" />
            {/* Tall spear */}
            <line x1="16" y1="-26" x2="16" y2="44" stroke="#78350F" strokeWidth="2.5" />
            <polygon points="16,-34 13,-24 19,-24" fill="#94A3B8" stroke="#1E293B" strokeWidth="1.5" />
            {/* Shield arm & Shield */}
            <path d="M -6 10 L -14 16" stroke="#1F1B18" strokeWidth="2.4" strokeLinecap="round" fill="none" />
            <ellipse cx="-16" cy="18" rx="10" ry="18" fill="#B45309" stroke="#1F1B18" strokeWidth="2.2" />
            <circle cx="-16" cy="18" r="4" fill="#FDE68A" stroke="#1F1B18" strokeWidth="1.4" />
          </g>
        )}

        {action === 'elder' && (
          <g>
            {/* Holding cuneiform clay tablet with stylus */}
            <path d="M -6 10 L -12 18 L -6 22" stroke="#1F1B18" strokeWidth="2.4" strokeLinecap="round" fill="none" />
            <path d="M 6 10 L 2 18 L -3 20" stroke="#1F1B18" strokeWidth="2.4" strokeLinecap="round" fill="none" />
            {/* Clay tablet */}
            <rect x="-18" y="14" width="13" height="16" rx="2" fill="#D97706" stroke="#78350F" strokeWidth="1.8" />
            {/* Cuneiform tally marks */}
            <path d="M -15 18 L -8 18 M -15 21 L -9 21 M -15 24 L -7 24 M -15 27 L -10 27" stroke="#451A03" strokeWidth="1.2" />
            {/* Reed stylus */}
            <line x1="2" y1="16" x2="-5" y2="20" stroke="#FEF08A" strokeWidth="1.8" strokeLinecap="round" />
          </g>
        )}

        {action === 'builder' && (
          <g>
            {/* Trowel / hammer & stone */}
            <path d="M -6 10 L -14 16 L -16 22" stroke="#1F1B18" strokeWidth="2.4" strokeLinecap="round" fill="none" />
            <path d="M 6 10 L 14 14 L 12 24" stroke="#1F1B18" strokeWidth="2.4" strokeLinecap="round" fill="none" />
            {/* Hammer / chisel */}
            <line x1="12" y1="20" x2="16" y2="28" stroke="#78350F" strokeWidth="2.5" />
            <rect x="14" y="26" width="6" height="3" fill="#64748B" stroke="#1E293B" strokeWidth="1.2" />
            {/* Stone block nearby */}
            <rect x="-26" y="24" width="12" height="8" rx="1" fill="#CBD5E1" stroke="#334155" strokeWidth="1.5" />
          </g>
        )}

        {action === 'wood' && (
          <g>
            {/* Stone axe */}
            <path d="M -6 10 L -12 16" stroke="#1F1B18" strokeWidth="2.4" strokeLinecap="round" fill="none" />
            <path d="M 6 10 L 14 6 L 16 16" stroke="#1F1B18" strokeWidth="2.4" strokeLinecap="round" fill="none" />
            {/* Axe handle */}
            <line x1="14" y1="4" x2="18" y2="24" stroke="#78350F" strokeWidth="2.5" strokeLinecap="round" />
            {/* Stone axe head */}
            <polygon points="12,6 16,3 15,10 11,8" fill="#64748B" stroke="#1E293B" strokeWidth="1.4" />
          </g>
        )}

        {action === 'idle' && (
          <g>
            {/* Resting / wandering hands */}
            <path d="M -6 10 L -12 18" stroke="#1F1B18" strokeWidth="2.4" strokeLinecap="round" fill="none" />
            <path d="M 6 10 L 12 18" stroke="#1F1B18" strokeWidth="2.4" strokeLinecap="round" fill="none" />
          </g>
        )}

        {/* Hover / selection name tag */}
        <g transform="translate(0, -32)" opacity={isHovered || isSelected ? 1 : 0.85}>
          <rect
            x="-28"
            y="-14"
            width="56"
            height="15"
            rx="4"
            fill="#FDFBF7"
            stroke="#2B241E"
            strokeWidth="1.4"
          />
          <text
            x="0"
            y="-3"
            textAnchor="middle"
            fontSize="9"
            fontWeight="bold"
            fill="#2B241E"
            fontFamily="Patrick Hand, cursive, sans-serif"
          >
            {villager.name}
          </text>
        </g>
      </g>
    );
  };

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border-3 border-[#33261D] bg-[#F7F0E4] shadow-xl select-none">
      {/* Top Banner Navigation & Era Indicator inside Artwork */}
      <div className="absolute top-3 left-3 right-3 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        <div className="pointer-events-auto bg-[#FDFBF7]/90 backdrop-blur-xs border-2 border-[#33261D] px-3 py-1.5 rounded-lg shadow-sm flex items-center gap-2">
          <span className="font-display font-bold text-sm tracking-wide text-[#78350F]">
            {gameState.currentEra === 1 && '🌾 Assentamento Agrícola'}
            {gameState.currentEra === 2 && '🛖 Aldeia Neolítica de Pedra'}
            {gameState.currentEra === 3 && '🏛️ Vila de Bronze & Casa Longa'}
            {gameState.currentEra === 4 && '🌟 Metrópole Fortificada do Zigurate'}
          </span>
          <span className="text-xs text-[#78350F]/70 font-semibold">·</span>
          <span className="text-xs font-hand text-stone-700 font-bold">
            {currentSeason} do Ano {gameState.year} (Turno {gameState.turn})
          </span>
        </div>

        {/* View Switcher Controls */}
        <div className="pointer-events-auto bg-[#FDFBF7]/90 backdrop-blur-xs border-2 border-[#33261D] p-1 rounded-lg shadow-sm flex items-center gap-1">
          <button
            onClick={() => setViewMode('overview')}
            className={`px-2.5 py-1 text-xs font-bold rounded transition-colors ${
              viewMode === 'overview'
                ? 'bg-[#E5B84B] text-[#2C241E] shadow-xs'
                : 'text-stone-700 hover:bg-[#EFE4CE]'
            }`}
          >
            Vila Completa
          </button>
          <button
            onClick={() => setViewMode('fields')}
            className={`px-2.5 py-1 text-xs font-bold rounded transition-colors ${
              viewMode === 'fields'
                ? 'bg-[#E5B84B] text-[#2C241E] shadow-xs'
                : 'text-stone-700 hover:bg-[#EFE4CE]'
            }`}
          >
            Campos de Trigo ({farmers.length})
          </button>
          <button
            onClick={() => setViewMode('construction')}
            className={`px-2.5 py-1 text-xs font-bold rounded transition-colors ${
              viewMode === 'construction'
                ? 'bg-[#E5B84B] text-[#2C241E] shadow-xs'
                : 'text-stone-700 hover:bg-[#EFE4CE]'
            }`}
          >
            Obras & Muralhas ({builders.length + quarrymen.length})
          </button>
          {hasZiggurat && (
            <button
              onClick={() => setViewMode('monument')}
              className={`px-2.5 py-1 text-xs font-bold rounded transition-colors ${
                viewMode === 'monument'
                  ? 'bg-[#E5B84B] text-[#2C241E] shadow-xs'
                  : 'text-stone-700 hover:bg-[#EFE4CE]'
              }`}
            >
              Zigurate
            </button>
          )}
        </div>
      </div>

      {/* Main SVG Scene Canvas */}
      <div className="w-full aspect-[16/9] min-h-[360px] max-h-[580px] relative overflow-hidden">
        <svg
          viewBox="0 0 1000 562"
          className="w-full h-full object-cover"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            {/* Paper Texture Filter */}
            <filter id="paperNoise">
              <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" result="noise" />
              <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.05 0" />
              <feComposite in2="SourceGraphic" in="gl" operator="in" />
            </filter>

            {/* Gradients */}
            <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={currentEra === 4 ? '#E2C29B' : '#9EBEC7'} />
              <stop offset="70%" stopColor={currentEra === 4 ? '#F3DCB7' : '#D1E3E7'} />
              <stop offset="100%" stopColor="#F5E8D0" />
            </linearGradient>

            <linearGradient id="fieldGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#DFAD46" />
              <stop offset="100%" stopColor="#C99432" />
            </linearGradient>

            <linearGradient id="groundGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#EAD8B8" />
              <stop offset="100%" stopColor="#D9BF95" />
            </linearGradient>
          </defs>

          {/* Sky */}
          <rect width="1000" height="562" fill="url(#skyGrad)" />

          {/* Clouds */}
          <g opacity="0.75">
            <path
              d="M 120 70 Q 140 50 170 60 Q 200 45 230 65 Q 250 80 230 90 L 130 90 Q 110 80 120 70 Z"
              fill="#FFFFFF"
              stroke="#8BA6AD"
              strokeWidth="1.8"
            />
            <path
              d="M 680 50 Q 700 35 730 45 Q 755 30 780 48 Q 800 62 780 72 L 690 72 Q 670 60 680 50 Z"
              fill="#FFFFFF"
              stroke="#8BA6AD"
              strokeWidth="1.8"
            />
          </g>

          {/* Distant Rolling Hills / Mountains */}
          <path
            d="M 0 170 Q 180 120 380 160 Q 560 110 740 150 Q 880 125 1000 165 L 1000 240 L 0 240 Z"
            fill="#B69A72"
            stroke="#2B241E"
            strokeWidth="2.2"
          />
          <path
            d="M 0 190 Q 240 145 460 185 Q 680 140 880 180 L 1000 185 L 1000 280 L 0 280 Z"
            fill="#C9AE84"
            stroke="#2B241E"
            strokeWidth="2.2"
          />

          {/* Distant Olive Trees & Scrub */}
          <g stroke="#2B241E" strokeWidth="1.8">
            <path d="M 115 150 Q 120 135 125 150 M 120 150 L 120 156" fill="#6B7D50" />
            <path d="M 380 140 Q 386 126 392 140 M 386 140 L 386 147" fill="#6B7D50" />
            <path d="M 670 135 Q 676 122 682 135 M 676 135 L 676 142" fill="#6B7D50" />
            <path d="M 890 155 Q 897 140 904 155 M 897 155 L 897 162" fill="#6B7D50" />
          </g>

          {/* Terraced Agricultural Fields (Wheat Strips like in Image 1 & 6) */}
          <g>
            {/* Field Section 1 */}
            <polygon
              points="20,195 340,150 480,185 140,240"
              fill="url(#fieldGrad)"
              stroke="#2B241E"
              strokeWidth="2.4"
            />
            {/* Field Section 2 */}
            <polygon
              points="350,150 670,185 580,270 240,230"
              fill="#E1AF48"
              stroke="#2B241E"
              strokeWidth="2.4"
            />
            {/* Harvested Furrows / Strips (Image 1 style) */}
            <polygon
              points="600,165 760,160 840,265 670,275"
              fill="#EBD0A0"
              stroke="#2B241E"
              strokeWidth="2.4"
            />
            {/* Furrow lines */}
            <line x1="620" y1="180" x2="690" y2="265" stroke="#B89762" strokeWidth="2" strokeDasharray="6 4" />
            <line x1="655" y1="175" x2="735" y2="265" stroke="#B89762" strokeWidth="2" strokeDasharray="6 4" />
            <line x1="695" y1="170" x2="780" y2="265" stroke="#B89762" strokeWidth="2" strokeDasharray="6 4" />

            {/* Standing Boundary Stones / Menhirs (Image 10 style) */}
            <g fill="#9CA3AF" stroke="#2B241E" strokeWidth="2">
              <polygon points="510,180 514,155 522,156 525,182" />
              <polygon points="565,190 570,162 578,164 582,192" />
              <polygon points="620,205 626,170 635,172 640,208" />
            </g>
          </g>

          {/* Main Village Soil / Settlement Floor */}
          <path
            d="M 0 245 Q 350 220 650 250 Q 850 240 1000 255 L 1000 562 L 0 562 Z"
            fill="url(#groundGrad)"
            stroke="#2B241E"
            strokeWidth="2.6"
          />

          {/* Dirt Pathways radiating like Image 9 */}
          <path
            d="M 480 320 L 120 540 M 520 320 L 880 540 M 500 320 L 500 550 M 470 310 L 160 270 M 530 310 L 850 280"
            stroke="#C4A579"
            strokeWidth="16"
            strokeLinecap="round"
            fill="none"
          />

          {/* ======================================================== */}
          {/* ARCHITECTURAL LAYERS ACCORDING TO BUILDINGS / ERAS */}
          {/* ======================================================== */}

          {/* 1. Stone Wall & Gate (Image 7 & 8) - Behind village if built */}
          {hasWalls && (
            <g>
              {/* Massive Curved Stone Wall */}
              <path
                d="M 80 250 Q 240 210 500 215 Q 780 210 960 250 L 960 305 Q 780 270 500 275 Q 240 270 80 305 Z"
                fill="#C4B49D"
                stroke="#2B241E"
                strokeWidth="2.6"
              />
              {/* Stone Ashlar Block Pattern */}
              <path
                d="M 140 240 L 140 300 M 200 235 L 200 295 M 260 230 L 260 290 M 320 228 L 320 288 M 700 228 L 700 288 M 760 230 L 760 290 M 820 235 L 820 295"
                stroke="#6E5D49"
                strokeWidth="1.8"
              />
              {/* Scaffolding & Wooden Hoist (Image 7 & 8) */}
              <g stroke="#78350F" strokeWidth="2.5" fill="none">
                {/* Scaffold A */}
                <line x1="280" y1="230" x2="280" y2="330" />
                <line x1="330" y1="230" x2="330" y2="330" />
                <line x1="270" y1="270" x2="340" y2="270" strokeWidth="4" />
                <line x1="280" y1="270" x2="330" y2="330" stroke="#A16207" strokeWidth="1.8" />
                {/* Pulley Rope & Stone Block */}
                <line x1="330" y1="210" x2="350" y2="185" />
                <line x1="350" y1="185" x2="350" y2="235" stroke="#33261D" strokeWidth="1.5" />
                <rect x="340" y="235" width="20" height="12" rx="2" fill="#9CA3AF" stroke="#2B241E" strokeWidth="1.8" />
              </g>
            </g>
          )}

          {/* 2. Ziggurat Monument (Image 11) - Renders prominently if under construction / completed */}
          {hasZiggurat && (
            <g transform="translate(680, 130) scale(0.85)">
              {/* Tier 1 (Base Terrace) */}
              <polygon
                points="0,150 50,70 290,70 340,150"
                fill="#C99E5C"
                stroke="#2B241E"
                strokeWidth="3"
              />
              {/* Tier 2 */}
              {(zigguratStagesCompleted >= 2 || (buildings.ziggurat?.count || 0) > 0) && (
                <polygon
                  points="45,70 85,15 255,15 295,70"
                  fill="#DFB26F"
                  stroke="#2B241E"
                  strokeWidth="2.8"
                />
              )}
              {/* Tier 3 & Shrine */}
              {(zigguratStagesCompleted >= 3 || (buildings.ziggurat?.count || 0) > 0) && (
                <polygon
                  points="85,15 115,-25 225,-25 255,15"
                  fill="#EDC785"
                  stroke="#2B241E"
                  strokeWidth="2.6"
                />
              )}
              {/* Golden Shrine on top */}
              {((buildings.ziggurat?.count || 0) > 0 || zigguratStagesCompleted >= 4) && (
                <g>
                  <rect x="135" y="-55" width="70" height="30" fill="#EAB308" stroke="#2B241E" strokeWidth="2.4" />
                  <polygon points="125,-55 170,-78 215,-55" fill="#CA8A04" stroke="#2B241E" strokeWidth="2.4" />
                </g>
              )}
              {/* Grand Central Staircase */}
              <polygon
                points="145,150 155,15 185,15 195,150"
                fill="#A3783E"
                stroke="#2B241E"
                strokeWidth="2.2"
              />
              {/* Steps lines */}
              <line x1="148" y1="130" x2="192" y2="130" stroke="#451A03" strokeWidth="1.5" />
              <line x1="150" y1="105" x2="190" y2="105" stroke="#451A03" strokeWidth="1.5" />
              <line x1="152" y1="80" x2="188" y2="80" stroke="#451A03" strokeWidth="1.5" />
              <line x1="154" y1="55" x2="186" y2="55" stroke="#451A03" strokeWidth="1.5" />
            </g>
          )}

          {/* 3. Central Longhouse (Image 9) if built */}
          {hasLonghouse ? (
            <g transform="translate(410, 240) scale(1.1)">
              {/* Wooden Chieftain Hall / Longhouse */}
              <polygon
                points="80,10 10,75 150,75"
                fill="#966A3D"
                stroke="#2B241E"
                strokeWidth="2.8"
              />
              {/* Crossed Timbers Gables on Ridge */}
              <line x1="70" y1="20" x2="90" y2="-5" stroke="#2B241E" strokeWidth="3" strokeLinecap="round" />
              <line x1="90" y1="20" x2="70" y2="-5" stroke="#2B241E" strokeWidth="3" strokeLinecap="round" />
              {/* Wooden Plank Walls */}
              <rect x="25" y="75" width="110" height="50" fill="#BA8E5E" stroke="#2B241E" strokeWidth="2.6" />
              {/* Vertical Timber planks */}
              <line x1="45" y1="75" x2="45" y2="125" stroke="#5E4021" strokeWidth="1.8" />
              <line x1="65" y1="75" x2="65" y2="125" stroke="#5E4021" strokeWidth="1.8" />
              <line x1="95" y1="75" x2="95" y2="125" stroke="#5E4021" strokeWidth="1.8" />
              <line x1="115" y1="75" x2="115" y2="125" stroke="#5E4021" strokeWidth="1.8" />
              {/* Doorway */}
              <rect x="70" y="88" width="20" height="37" fill="#241B14" stroke="#2B241E" strokeWidth="2.2" />
            </g>
          ) : (
            // Rustic Thatch Hut (Image 1 & 6)
            <g transform="translate(440, 260)">
              <polygon
                points="50,15 10,65 90,65"
                fill="#D4A74F"
                stroke="#2B241E"
                strokeWidth="2.6"
              />
              <rect x="20" y="65" width="60" height="35" fill="#C89D6E" stroke="#2B241E" strokeWidth="2.4" />
              <rect x="42" y="75" width="16" height="25" fill="#2B241E" />
            </g>
          )}

          {/* 4. Circular Stone Dwellings (Image 3 & 4) */}
          {stoneDwellingsCount > 0 && (
            <g transform="translate(180, 270) scale(0.95)">
              {/* Conical Thatched Roof */}
              <polygon points="55,5 5,55 105,55" fill="#C99E5C" stroke="#2B241E" strokeWidth="2.6" />
              {/* Straw thatch texture lines */}
              <line x1="55" y1="10" x2="30" y2="50" stroke="#8A6732" strokeWidth="1.5" />
              <line x1="55" y1="10" x2="80" y2="50" stroke="#8A6732" strokeWidth="1.5" />
              {/* Circular Dry-Stone Wall */}
              <rect x="12" y="55" width="86" height="42" rx="4" fill="#C2B299" stroke="#2B241E" strokeWidth="2.6" />
              {/* Stone mortar pattern */}
              <path
                d="M 15 68 Q 55 68 95 68 M 15 82 Q 55 82 95 82 M 35 55 L 35 68 M 65 55 L 65 68 M 45 68 L 45 82 M 80 68 L 80 82"
                stroke="#70614C"
                strokeWidth="1.6"
              />
              {/* Wooden lintel & doorway */}
              <rect x="44" y="65" width="22" height="32" rx="1" fill="#241B14" stroke="#2B241E" strokeWidth="2" />
            </g>
          )}

          {/* Additional Stone Dwellings if multiple */}
          {stoneDwellingsCount > 1 && (
            <g transform="translate(730, 290) scale(0.85)">
              <polygon points="55,5 5,55 105,55" fill="#C99E5C" stroke="#2B241E" strokeWidth="2.6" />
              <rect x="12" y="55" width="86" height="40" rx="4" fill="#C2B299" stroke="#2B241E" strokeWidth="2.6" />
              <rect x="44" y="65" width="22" height="30" fill="#241B14" stroke="#2B241E" strokeWidth="2" />
            </g>
          )}

          {/* Additional Straw Huts if early game */}
          {hutsCount > 1 && stoneDwellingsCount === 0 && (
            <g transform="translate(220, 260) scale(0.85)">
              <polygon points="50,15 10,65 90,65" fill="#D4A74F" stroke="#2B241E" strokeWidth="2.4" />
              <rect x="20" y="65" width="60" height="32" fill="#C89D6E" stroke="#2B241E" strokeWidth="2.2" />
              <rect x="42" y="75" width="16" height="22" fill="#2B241E" />
            </g>
          )}

          {/* 5. Silo & Granary (Image 2 style) */}
          {hasGranary && (
            <g transform="translate(320, 240) scale(0.85)">
              {/* Granary raised on stilts */}
              <rect x="15" y="40" width="70" height="50" rx="3" fill="#D49A58" stroke="#2B241E" strokeWidth="2.4" />
              <polygon points="50,15 8,40 92,40" fill="#B45309" stroke="#2B241E" strokeWidth="2.4" />
              {/* Stilts */}
              <line x1="22" y1="90" x2="22" y2="108" stroke="#78350F" strokeWidth="3" />
              <line x1="78" y1="90" x2="78" y2="108" stroke="#78350F" strokeWidth="3" />
              {/* Bundles of wheat stacked outside */}
              <g transform="translate(90, 85)">
                <ellipse cx="6" cy="10" rx="7" ry="12" fill="#EAB308" stroke="#78350F" strokeWidth="1.5" />
                <ellipse cx="16" cy="10" rx="7" ry="12" fill="#EAB308" stroke="#78350F" strokeWidth="1.5" />
              </g>
            </g>
          )}

          {/* 6. Stone Well (Image 4) */}
          {hasWell && (
            <g transform="translate(370, 390)">
              {/* Circular Stone Well Structure */}
              <ellipse cx="30" cy="20" rx="28" ry="12" fill="#9CA3AF" stroke="#2B241E" strokeWidth="2.6" />
              <ellipse cx="30" cy="18" rx="20" ry="7" fill="#2563EB" stroke="#1E3A8A" strokeWidth="1.8" />
              {/* Upright Posts and Crossbeam */}
              <line x1="12" y1="20" x2="12" y2="-12" stroke="#78350F" strokeWidth="2.8" strokeLinecap="round" />
              <line x1="48" y1="20" x2="48" y2="-12" stroke="#78350F" strokeWidth="2.8" strokeLinecap="round" />
              <line x1="8" y1="-12" x2="52" y2="-12" stroke="#78350F" strokeWidth="3" strokeLinecap="round" />
              {/* Rope and wooden bucket */}
              <line x1="30" y1="-12" x2="30" y2="10" stroke="#D97706" strokeWidth="1.6" />
              <rect x="25" y="8" width="10" height="9" rx="1" fill="#B45309" stroke="#451A03" strokeWidth="1.4" />
            </g>
          )}

          {/* 7. Cooking Pit with Fire & Pot (Image 3) */}
          {hasCookingPit && (
            <g transform="translate(620, 390)">
              {/* Circular Stone Ring */}
              <ellipse cx="30" cy="15" rx="26" ry="10" fill="#78716C" stroke="#2B241E" strokeWidth="2.2" />
              {/* Embers / Fire */}
              <polygon points="25,12 28,2 32,10 35,0 38,12" fill="#EF4444" stroke="#B91C1C" strokeWidth="1.2" />
              <polygon points="27,10 30,5 33,10" fill="#FBBF24" />
              {/* Bronze/Stone Cooking Pot */}
              <ellipse cx="30" cy="4" rx="12" ry="5" fill="#374151" stroke="#111827" strokeWidth="2" />
              <path d="M 18 4 Q 18 14 30 14 Q 42 14 42 4 Z" fill="#1F2937" stroke="#111827" strokeWidth="2" />
              {/* Animated Steam */}
              <path
                d="M 28 -4 Q 25 -14 30 -20 Q 35 -26 30 -32"
                stroke="#E5E7EB"
                strokeWidth="1.8"
                fill="none"
                opacity="0.75"
                strokeDasharray="4 3"
              />
            </g>
          )}

          {/* 8. Grain Grinding Stations (Image 3 & 4) */}
          {hasGrinding && (
            <g transform="translate(480, 440)">
              {/* Stone slab mortar */}
              <ellipse cx="20" cy="15" rx="18" ry="8" fill="#9CA3AF" stroke="#2B241E" strokeWidth="2" />
              <ellipse cx="20" cy="13" rx="12" ry="5" fill="#FEF08A" opacity="0.8" />
            </g>
          )}

          {/* Stooks / Wheat Sheaves standing in fields (Image 1 & 6) */}
          <g>
            {/* Bound sheaves dotted across field */}
            <g transform="translate(860, 220)">
              <ellipse cx="0" cy="10" rx="12" ry="20" fill="#EAB308" stroke="#78350F" strokeWidth="2" />
              <rect x="-10" y="8" width="20" height="4" fill="#451A03" rx="1" />
            </g>
            <g transform="translate(920, 230)">
              <ellipse cx="0" cy="8" rx="10" ry="17" fill="#EAB308" stroke="#78350F" strokeWidth="2" />
              <rect x="-8" y="7" width="16" height="3" fill="#451A03" rx="1" />
            </g>
            <g transform="translate(80, 250)">
              <ellipse cx="0" cy="8" rx="11" ry="18" fill="#EAB308" stroke="#78350F" strokeWidth="2" />
              <rect x="-9" y="7" width="18" height="3.5" fill="#451A03" rx="1" />
            </g>
          </g>

          {/* ======================================================== */}
          {/* CHARACTERS (THE STICKMEN WORKING IN REAL TIME) */}
          {/* ======================================================== */}

          {/* Render Farmers in the fields (Image 1, 6, 10 style) */}
          {farmers.map((villager, idx) => {
            const posX = 100 + (idx % 4) * 80 + (idx > 3 ? 40 : 0);
            const posY = 310 + Math.floor(idx / 4) * 55 + (idx % 2 === 0 ? 10 : -10);
            const isReaper = idx % 2 === 0;

            return renderCharacter(
              villager,
              posX,
              posY,
              isReaper ? 'sickle' : 'carry_wheat',
              1.05,
              idx % 2 === 1
            );
          })}

          {/* Render Lumberjacks in the grove (left edge) */}
          {lumberjacks.map((villager, idx) => {
            const posX = 50 + idx * 45;
            const posY = 400 + (idx % 2) * 40;
            return renderCharacter(villager, posX, posY, 'wood', 1.05, false);
          })}

          {/* Render Quarrymen & Stone Masons (near rocks/scaffolding) */}
          {quarrymen.map((villager, idx) => {
            const posX = 240 + idx * 55;
            const posY = 350 + (idx % 2) * 40;
            return renderCharacter(villager, posX, posY, 'builder', 1.05, false);
          })}

          {/* Render Builders (near active worksite / wall) */}
          {builders.map((villager, idx) => {
            const posX = 310 + idx * 50;
            const posY = 310 + (idx % 2) * 35;
            return renderCharacter(villager, posX, posY, 'builder', 1.05, true);
          })}

          {/* Render Grain Grinders & Potters (near grinding stones / cooking pit) */}
          {potters.map((villager, idx) => {
            const posX = 540 + idx * 45;
            const posY = 445;
            return renderCharacter(villager, posX, posY, 'grind', 1.05, false);
          })}

          {/* Render Elders & Planners (studying tablets / maps) */}
          {elders.map((villager, idx) => {
            const posX = 420 + idx * 45;
            const posY = 370 + (idx % 2) * 25;
            return renderCharacter(villager, posX, posY, 'elder', 1.05, false);
          })}

          {/* Render Guards with spears and shields (patrolling perimeter) */}
          {guards.map((villager, idx) => {
            const posX = 740 + (idx % 3) * 50;
            const posY = 360 + Math.floor(idx / 3) * 50;
            return renderCharacter(villager, posX, posY, 'guard', 1.08, idx % 2 === 1);
          })}

          {/* Render Idle villagers wandering peacefully */}
          {idles.map((villager, idx) => {
            const posX = 500 + idx * 60;
            const posY = 490 - (idx % 2) * 30;
            return renderCharacter(villager, posX, posY, 'idle', 1.05, false);
          })}

          {/* Labels & Annotations in Comic / Hand-drawn Style (as in user images) */}
          {hasLonghouse && (
            <g opacity="0.85" pointerEvents="none">
              <text x="500" y="235" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#3B2613" fontFamily="Patrick Hand, cursive">
                CASA LONGA (SEDE)
              </text>
            </g>
          )}

          {farmers.length > 0 && (
            <g opacity="0.8" pointerEvents="none">
              <text x="180" y="475" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#6B4E1B" fontFamily="Patrick Hand, cursive">
                COLHEITA DO TRIGO
              </text>
            </g>
          )}

          {guards.length > 0 && (
            <g opacity="0.8" pointerEvents="none">
              <text x="790" y="450" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#3B2613" fontFamily="Patrick Hand, cursive">
                GUARDAS & DEFESA
              </text>
            </g>
          )}

          {elders.length > 0 && (
            <g opacity="0.8" pointerEvents="none">
              <text x="440" y="420" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#3B2613" fontFamily="Patrick Hand, cursive">
                ANCIÃOS & PLANEJADORES
              </text>
            </g>
          )}
        </svg>

        {/* Selected Villager Floating Card if any selected */}
        {selectedVillagerId && (
          <div className="absolute bottom-3 left-3 bg-[#FDFBF7] border-2 border-[#33261D] rounded-xl p-3 shadow-lg max-w-xs animate-in fade-in slide-in-from-bottom-2">
            {(() => {
              const vil = villagers.find((v) => v.id === selectedVillagerId);
              if (!vil) return null;
              return (
                <div>
                  <div className="flex items-center justify-between gap-2 border-b border-stone-300 pb-1.5 mb-1.5">
                    <div>
                      <h4 className="font-hand font-bold text-base text-stone-900 leading-tight">
                        {vil.name}
                      </h4>
                      <p className="text-[11px] text-stone-500 font-medium">
                        Ofício: <span className="font-bold text-[#92400E]">{vil.job.toUpperCase()}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                        {vil.morale}% Moral
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-stone-700 italic">
                    Perk: <span className="font-semibold not-italic">{vil.trait.name}</span> ({vil.trait.description})
                  </p>
                </div>
              );
            })()}
          </div>
        )}

        {/* Total population quick indicator badge */}
        <div className="absolute bottom-3 right-3 bg-[#FDFBF7]/90 border-2 border-[#33261D] px-2.5 py-1 rounded-lg text-xs font-bold text-stone-800 shadow-sm pointer-events-none">
          👥 {villagers.length} Aldeões Ativos
        </div>
      </div>
    </div>
  );
};
