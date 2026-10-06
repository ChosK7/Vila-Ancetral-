/**
 * GameClock.ts
 *
 * Módulo central de controle do relógio do jogo.
 * REGRA DEFINITIVA: 1 dia completo do jogo (24 horas) dura exatamente 15 minutos reais (900 segundos).
 */

export const REAL_DAY_DURATION_SECONDS = 900;
export const GAME_HOURS_PER_DAY = 24;
export const TICK_MS = 200;
export const GAME_HOURS_PER_SECOND = GAME_HOURS_PER_DAY / REAL_DAY_DURATION_SECONDS; // 24 / 900 = 0.0266666667
export const STEP_HOURS_PER_TICK = GAME_HOURS_PER_SECOND * (TICK_MS / 1000); // 0.005333333333333333

export interface AdvanceGameHourResult {
  nextHour: number;
  wrapped: boolean;
  remainingHour: number;
}

/**
 * Retorna o avanço em horas do jogo por cada tick do timer (200ms).
 */
export function getStepHoursPerTick(): number {
  return STEP_HOURS_PER_TICK;
}

/**
 * Avança a hora do jogo respeitando o ciclo de 24 horas.
 *
 * @param currentHour Hora atual do jogo (0.0 a 24.0)
 * @param step Quantidade opcional de horas a avançar (padrão: STEP_HOURS_PER_TICK)
 * @returns Objeto com nextHour, wrapped (se passou de 24h) e remainingHour (sobra após passar de 24h)
 */
export function advanceGameHour(
  currentHour: number,
  step: number = STEP_HOURS_PER_TICK
): AdvanceGameHourResult {
  const calculatedNext = currentHour + step;

  if (calculatedNext >= GAME_HOURS_PER_DAY) {
    const remainingHour = calculatedNext - GAME_HOURS_PER_DAY;
    return {
      nextHour: remainingHour,
      wrapped: true,
      remainingHour,
    };
  }

  return {
    nextHour: calculatedNext,
    wrapped: false,
    remainingHour: 0,
  };
}
