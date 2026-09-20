import React from 'react';
import { BoardState, Player, WinningLine } from '../types';

interface TicTacToeBoardProps {
  board: BoardState;
  onCellClick: (index: number) => void;
  winningLine: WinningLine | null;
  disabled: boolean;
  activePlayer: Player;
}

export const TicTacToeBoard: React.FC<TicTacToeBoardProps> = ({
  board,
  onCellClick,
  winningLine,
  disabled,
  activePlayer,
}) => {
  const isWinningCell = (index: number): boolean => {
    return winningLine ? winningLine.line.includes(index) : false;
  };

  return (
    <div className="relative p-3 sm:p-5 bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-3xl shadow-2xl backdrop-blur-lg">
      <div className="grid grid-cols-3 gap-2.5 sm:gap-3.5 w-72 sm:w-80 h-72 sm:h-80 mx-auto">
        {board.map((cell, index) => {
          const isWin = isWinningCell(index);
          return (
            <button
              key={index}
              onClick={() => onCellClick(index)}
              disabled={disabled || cell !== null}
              aria-label={`マス ${index + 1}: ${cell || '空'}`}
              className={`relative rounded-2xl flex items-center justify-center text-4xl sm:text-5xl font-black transition-all duration-200 transform select-none ${
                isWin
                  ? 'bg-emerald-500/20 border-2 border-emerald-400 text-emerald-300 shadow-[0_0_25px_rgba(52,211,153,0.4)] scale-105 z-10'
                  : cell
                  ? 'bg-slate-900/90 border border-slate-700/80 shadow-inner'
                  : 'bg-slate-800/40 hover:bg-slate-800/80 border border-slate-800 hover:border-indigo-500/50 active:scale-95 cursor-pointer hover:shadow-lg'
              }`}
            >
              {cell === 'O' && (
                <div className="text-cyan-400 drop-shadow-[0_0_12px_rgba(34,211,238,0.7)] animate-in zoom-in-50 duration-150">
                  <svg className="w-12 h-12 sm:w-14 sm:h-14 stroke-current fill-none stroke-[7]" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="34" />
                  </svg>
                </div>
              )}
              {cell === 'X' && (
                <div className="text-rose-400 drop-shadow-[0_0_12px_rgba(251,113,133,0.7)] animate-in zoom-in-50 duration-150">
                  <svg className="w-12 h-12 sm:w-14 sm:h-14 stroke-current fill-none stroke-[8] stroke-linecap-round" viewBox="0 0 100 100">
                    <line x1="24" y1="24" x2="76" y2="76" />
                    <line x1="76" y1="24" x2="24" y2="76" />
                  </svg>
                </div>
              )}
              {!cell && !disabled && (
                <span className="opacity-0 hover:opacity-20 transition-opacity text-slate-400 text-3xl font-light">
                  {activePlayer === 'O' ? '○' : '✕'}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
