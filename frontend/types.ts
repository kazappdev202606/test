export type Player = 'O' | 'X';
export type BoardState = (Player | null)[];

export interface ScoreState {
  oWins: number;
  xWins: number;
  draws: number;
}

export type GameMode = 'pvp' | 'ai_easy' | 'ai_unbeatable';

export interface WinningLine {
  line: [number, number, number];
  direction: 'row' | 'col' | 'diag-main' | 'diag-anti';
}

export interface HealthCheckItem {
  id: string;
  label: string;
  status: 'passed' | 'warning' | 'checking';
  value: string;
  detail: string;
}
