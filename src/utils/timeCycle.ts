export type TimePhase =
  | 'dawn'
  | 'morning'
  | 'noon'
  | 'afternoon'
  | 'sunset'
  | 'evening'
  | 'midnight'
  | 'deep_night';

export type DailyRoutine = 'breakfast' | 'work' | 'lunch' | 'dinner' | 'sleep';

export interface CelestialTimeInfo {
  hour: number;
  minute: number;
  timeFormatted: string;
  isDay: boolean;
  phase: TimePhase;
  icon: string; // Sun icon during day, Moon icon during night
  celestialName: string;
  routine: DailyRoutine;
  routineTitle: string;
  routineIcon: string;
  routineDescription: string;
  sunPositionProgress: number; // 0 to 1 for sky arc
}

/**
 * Returns celestial info, sun/moon icon and village routine based on 24h gameHour.
 * - Amanhecer (06:00 - 08:00): Café da Manhã
 * - Manhã (08:00 - 12:00): Trabalho e Coleta
 * - Meio-Dia (12:00 - 13:30): Almoço da Vila
 * - Tarde (13:30 - 18:00): Trabalho e Coleta
 * - Entardecer (18:00 - 19:30): Retorno à Vila / Pôr do Sol
 * - Noite (19:30 - 21:30): Jantar à Luz da Fogueira
 * - Madrugada (21:30 - 05:30): Descanso e Estrelas
 */
export function getCelestialTimeInfo(gameHour: number): CelestialTimeInfo {
  // Normalize hour to 0 - 23.999
  const normalizedHour = ((gameHour % 24) + 24) % 24;
  const hourInt = Math.floor(normalizedHour);
  const minute = Math.floor((normalizedHour - hourInt) * 60);
  const timeFormatted = `${String(hourInt).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

  const isDay = normalizedHour >= 5.5 && normalizedHour < 19.5;

  let phase: TimePhase = 'morning';
  let icon = '☀️';
  let celestialName = 'Sol Radiante';
  let routine: DailyRoutine = 'work';
  let routineTitle = 'Trabalho nas Coletas';
  let routineIcon = '🌾';
  let routineDescription = 'Aldeões empenhados na colheita e afazeres da aldeia';

  if (normalizedHour >= 5.5 && normalizedHour < 8.0) {
    // 05:30 - 07:59: Amanhecer & Café da Manhã
    phase = 'dawn';
    icon = '🌅'; // Ícone do sol nascente no amanhecer
    celestialName = 'Sol Nascente';
    routine = 'breakfast';
    routineTitle = 'Café da Manhã';
    routineIcon = '☕';
    routineDescription = 'Aldeões reúnem-se ao amanhecer para o desjejum e café';
  } else if (normalizedHour >= 8.0 && normalizedHour < 12.0) {
    // 08:00 - 11:59: Manhã de trabalho
    phase = 'morning';
    icon = '☀️'; // Ícone do sol da manhã
    celestialName = 'Sol da Manhã';
    routine = 'work';
    routineTitle = 'Trabalho da Manhã';
    routineIcon = '🪵';
    routineDescription = 'Coleta intensiva de alimentos, madeiras e pedras';
  } else if (normalizedHour >= 12.0 && normalizedHour < 13.5) {
    // 12:00 - 13:29: Meio-Dia & Almoço
    phase = 'noon';
    icon = '🌞'; // Ícone do sol a pino ao meio-dia
    celestialName = 'Sol a Pino (Meio-Dia)';
    routine = 'lunch';
    routineTitle = 'Almoço da Vila';
    routineIcon = '🍲';
    routineDescription = 'Pausa do meio-dia: todos almoçam juntos ao redor da fogueira';
  } else if (normalizedHour >= 13.5 && normalizedHour < 18.0) {
    // 13:30 - 17:59: Tarde de trabalho
    phase = 'afternoon';
    icon = '🌤️'; // Ícone do sol da tarde
    celestialName = 'Sol da Tarde';
    routine = 'work';
    routineTitle = 'Trabalho da Tarde';
    routineIcon = '🪨';
    routineDescription = 'Segunda jornada de coleta e construções da vila';
  } else if (normalizedHour >= 18.0 && normalizedHour < 19.5) {
    // 18:00 - 19:29: Pôr do Sol / Entardecer
    phase = 'sunset';
    icon = '🌇'; // Ícone do sol poente
    celestialName = 'Pôr do Sol';
    routine = 'work';
    routineTitle = 'Fim do Expediente';
    routineIcon = '🛖';
    routineDescription = 'Os aldeões encerram as tarefas e voltam para o centro';
  } else if (normalizedHour >= 19.5 && normalizedHour < 21.5) {
    // 19:30 - 21:29: Noite & Jantar
    phase = 'evening';
    icon = '🌙'; // Ícone da lua no início da noite
    celestialName = 'Lua Crescente';
    routine = 'dinner';
    routineTitle = 'Jantar à Noite';
    routineIcon = '🥘';
    routineDescription = 'Jantar comunitário sob as primeiras estrelas e fogueira viva';
  } else if (normalizedHour >= 21.5 || normalizedHour < 2.0) {
    // 21:30 - 01:59: Plena Noite / Meia-Noite
    phase = 'midnight';
    icon = '🌕'; // Ícone da lua cheia na meia-noite
    celestialName = 'Lua Cheia';
    routine = 'sleep';
    routineTitle = 'Descanso da Vila';
    routineIcon = '⛺';
    routineDescription = 'Aldeões descansam ao calor das brasas da fogueira';
  } else {
    // 02:00 - 05:29: Madrugada
    phase = 'deep_night';
    icon = '🌘'; // Ícone da lua minguante na madrugada
    celestialName = 'Lua da Madrugada';
    routine = 'sleep';
    routineTitle = 'Silêncio Noturno';
    routineIcon = '✨';
    routineDescription = 'Serenidade nas cabanas antes do novo amanhecer';
  }

  // Sun / Moon arc progress (0 at 06:00 sunrise, 0.5 at 12:00 noon, 1.0 at 18:00 sunset)
  let sunPositionProgress = 0;
  if (isDay) {
    sunPositionProgress = (normalizedHour - 5.5) / 14.0;
  } else {
    const nightHour = normalizedHour >= 19.5 ? normalizedHour - 19.5 : normalizedHour + 4.5;
    sunPositionProgress = nightHour / 10.0;
  }

  return {
    hour: hourInt,
    minute,
    timeFormatted,
    isDay,
    phase,
    icon,
    celestialName,
    routine,
    routineTitle,
    routineIcon,
    routineDescription,
    sunPositionProgress,
  };
}
