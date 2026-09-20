import React, { useState, useEffect, useCallback } from 'react';
import { 
  RotateCcw, 
  Trophy, 
  Bot, 
  Users, 
  Sparkles, 
  CheckCircle, 
  ShieldAlert, 
  Info, 
  ExternalLink,
  Zap,
  Volume2,
  VolumeX
} from 'lucide-react';
import { BoardState, Player, ScoreState, GameMode, WinningLine } from './types';
import { TicTacToeBoard } from './components/TicTacToeBoard';
import { DeploymentInspector } from './components/DeploymentInspector';

const WINNING_COMBINATIONS: { line: [number, number, number]; direction: 'row' | 'col' | 'diag-main' | 'diag-anti' }[] = [
  // Rows
  { line: [0, 1, 2], direction: 'row' },
  { line: [3, 4, 5], direction: 'row' },
  { line: [6, 7, 8], direction: 'row' },
  // Columns
  { line: [0, 3, 6], direction: 'col' },
  { line: [1, 4, 7], direction: 'col' },
  { line: [2, 5, 8], direction: 'col' },
  // Diagonals
  { line: [0, 4, 8], direction: 'diag-main' },
  { line: [2, 4, 6], direction: 'diag-anti' },
];

export default function App() {
  const [board, setBoard] = useState<BoardState>(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState<Player>('O');
  const [winner, setWinner] = useState<Player | 'draw' | null>(null);
  const [winningLine, setWinningLine] = useState<WinningLine | null>(null);
  const [gameMode, setGameMode] = useState<GameMode>('ai_easy');
  const [scores, setScores] = useState<ScoreState>({ oWins: 0, xWins: 0, draws: 0 });
  const [moveCount, setMoveCount] = useState<number>(0);
  const [isAiThinking, setIsAiThinking] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'game' | 'diagnostics'>('game');

  // Simple Web Audio API beeps for verified audio context
  const playTone = useCallback((type: 'click' | 'win' | 'draw') => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      if (type === 'click') {
        osc.frequency.setValueAtTime(440, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.1);
      } else if (type === 'win') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
        osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.12); // A5
        gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.35);
      } else if (type === 'draw') {
        osc.frequency.setValueAtTime(260, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.25);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.25);
      }
    } catch {
      // Audio context might be restricted before interaction
    }
  }, [soundEnabled]);

  const checkWinner = (squares: BoardState): { winner: Player; lineInfo: WinningLine } | null => {
    for (const combo of WINNING_COMBINATIONS) {
      const [a, b, c] = combo.line;
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return {
          winner: squares[a] as Player,
          lineInfo: combo,
        };
      }
    }
    return null;
  };

  // Minimax algorithm for unbeatable AI mode
  const minimax = (tempBoard: BoardState, depth: number, isMaximizing: boolean): number => {
    const result = checkWinner(tempBoard);
    if (result?.winner === 'X') return 10 - depth;
    if (result?.winner === 'O') return depth - 10;
    if (tempBoard.every((cell) => cell !== null)) return 0;

    if (isMaximizing) {
      let bestScore = -Infinity;
      for (let i = 0; i < 9; i++) {
        if (!tempBoard[i]) {
          tempBoard[i] = 'X';
          const score = minimax(tempBoard, depth + 1, false);
          tempBoard[i] = null;
          bestScore = Math.max(score, bestScore);
        }
      }
      return bestScore;
    } else {
      let bestScore = Infinity;
      for (let i = 0; i < 9; i++) {
        if (!tempBoard[i]) {
          tempBoard[i] = 'O';
          const score = minimax(tempBoard, depth + 1, true);
          tempBoard[i] = null;
          bestScore = Math.min(score, bestScore);
        }
      }
      return bestScore;
    }
  };

  const getBestAiMove = (currentBoard: BoardState, mode: GameMode): number => {
    const emptyIndices = currentBoard
      .map((val, idx) => (val === null ? idx : null))
      .filter((val): val is number => val !== null);

    if (emptyIndices.length === 0) return -1;

    // Easy AI: random or occasional block
    if (mode === 'ai_easy') {
      // 50% chance of random, 50% simple check
      if (Math.random() > 0.4) {
        return emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
      }
    }

    // Unbeatable AI or fallback smart move:
    let bestScore = -Infinity;
    let bestMove = emptyIndices[0];

    for (const idx of emptyIndices) {
      currentBoard[idx] = 'X';
      const score = minimax(currentBoard, 0, false);
      currentBoard[idx] = null;
      if (score > bestScore) {
        bestScore = score;
        bestMove = idx;
      }
    }
    return bestMove;
  };

  const handleCellClick = (index: number) => {
    if (board[index] || winner || isAiThinking) return;

    playTone('click');
    const newBoard = [...board];
    newBoard[index] = currentPlayer;
    setBoard(newBoard);
    setMoveCount((prev) => prev + 1);

    const winData = checkWinner(newBoard);
    if (winData) {
      setWinner(winData.winner);
      setWinningLine(winData.lineInfo);
      setScores((prev) => ({
        ...prev,
        [winData.winner === 'O' ? 'oWins' : 'xWins']: prev[winData.winner === 'O' ? 'oWins' : 'xWins'] + 1,
      }));
      playTone('win');
      return;
    }

    const isDraw = newBoard.every((cell) => cell !== null);
    if (isDraw) {
      setWinner('draw');
      setScores((prev) => ({ ...prev, draws: prev.draws + 1 }));
      playTone('draw');
      return;
    }

    const nextPlayer: Player = currentPlayer === 'O' ? 'X' : 'O';
    setCurrentPlayer(nextPlayer);

    // AI Turn Trigger if in AI mode and next player is X
    if (gameMode !== 'pvp' && nextPlayer === 'X') {
      setIsAiThinking(true);
      setTimeout(() => {
        const aiMove = getBestAiMove([...newBoard], gameMode);
        if (aiMove !== -1) {
          playTone('click');
          newBoard[aiMove] = 'X';
          setBoard([...newBoard]);
          setMoveCount((prev) => prev + 1);

          const aiWinData = checkWinner(newBoard);
          if (aiWinData) {
            setWinner(aiWinData.winner);
            setWinningLine(aiWinData.lineInfo);
            setScores((prev) => ({ ...prev, xWins: prev.xWins + 1 }));
            playTone('win');
          } else if (newBoard.every((cell) => cell !== null)) {
            setWinner('draw');
            setScores((prev) => ({ ...prev, draws: prev.draws + 1 }));
            playTone('draw');
          } else {
            setCurrentPlayer('O');
          }
        }
        setIsAiThinking(false);
      }, 350);
    }
  };

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setCurrentPlayer('O');
    setWinner(null);
    setWinningLine(null);
    setIsAiThinking(false);
  };

  const resetAllStats = () => {
    resetGame();
    setScores({ oWins: 0, xWins: 0, draws: 0 });
    setMoveCount(0);
  };

  return (
    <div className="min-h-screen flex flex-col justify-between p-4 sm:p-6 md:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <header className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                デプロイ確認 〇×ゲーム
              </h1>
              <span className="text-[10px] font-mono uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                Live Check
              </span>
            </div>
            <p className="text-xs text-slate-400">
              ホスティング・CDN・React 19 の稼働状態を確かめるスモークテストアプリ
            </p>
          </div>
        </div>

        {/* View switcher & audio toggle */}
        <div className="flex items-center gap-2 bg-slate-900 p-1.5 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('game')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              activeTab === 'game'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            対戦ボード
          </button>
          <button
            onClick={() => setActiveTab('diagnostics')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
              activeTab === 'diagnostics'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>環境診断</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          </button>
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            aria-label="効果音の切り替え"
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition"
            title={soundEnabled ? 'ミュートにする' : '効果音を鳴らす'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="my-6">
        {activeTab === 'game' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left: Mode Selection & Status */}
            <div className="lg:col-span-4 space-y-4 order-2 lg:order-1">
              {/* Game Mode */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2.5">
                  ゲームモード
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => { setGameMode('pvp'); resetGame(); }}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs transition ${
                      gameMode === 'pvp'
                        ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 font-semibold'
                        : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <Users className="w-4 h-4 mb-1" />
                    二人対戦
                  </button>
                  <button
                    onClick={() => { setGameMode('ai_easy'); resetGame(); }}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs transition ${
                      gameMode === 'ai_easy'
                        ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 font-semibold'
                        : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <Bot className="w-4 h-4 mb-1 text-cyan-400" />
                    AI 普通
                  </button>
                  <button
                    onClick={() => { setGameMode('ai_unbeatable'); resetGame(); }}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs transition ${
                      gameMode === 'ai_unbeatable'
                        ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 font-semibold'
                        : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <Sparkles className="w-4 h-4 mb-1 text-amber-400" />
                    AI 最強
                  </button>
                </div>
              </div>

              {/* Scoreboard */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    戦績スコア
                  </span>
                  <Trophy className="w-4 h-4 text-amber-400" />
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-[11px] text-cyan-400 font-semibold block">○ (あなた)</span>
                    <span className="text-xl font-bold font-mono text-slate-100">{scores.oWins}</span>
                  </div>
                  <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-[11px] text-slate-400 font-medium block">引き分け</span>
                    <span className="text-xl font-bold font-mono text-slate-100">{scores.draws}</span>
                  </div>
                  <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-[11px] text-rose-400 font-semibold block">
                      ✕ ({gameMode === 'pvp' ? 'Player 2' : 'AI'})
                    </span>
                    <span className="text-xl font-bold font-mono text-slate-100">{scores.xWins}</span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex gap-2">
                <button
                  onClick={resetGame}
                  className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 px-4 rounded-xl font-medium text-xs shadow-lg shadow-indigo-600/20 transition active:scale-95"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  再戦する
                </button>
                <button
                  onClick={resetAllStats}
                  className="px-3 py-2.5 rounded-xl text-xs bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800 transition"
                  title="スコアをゼロリセット"
                >
                  スコア初期化
                </button>
              </div>

              {/* Deployment hint */}
              <div className="p-3 bg-slate-900/40 border border-slate-800/80 rounded-xl text-xs text-slate-400 flex items-start gap-2">
                <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <span>
                  この画面が問題なく表示・クリック反応していれば、ホスティング環境でのJSバンドルとコンポーネントマウントは完全に成功しています。
                </span>
              </div>
            </div>

            {/* Right: Board & Turn Status */}
            <div className="lg:col-span-8 flex flex-col items-center justify-center order-1 lg:order-2">
              {/* Turn Banner */}
              <div className="mb-4 flex items-center gap-3">
                {!winner ? (
                  <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs sm:text-sm shadow-md">
                    <span className="text-slate-400">現在の手番:</span>
                    <span
                      className={`font-black tracking-widest ${
                        currentPlayer === 'O' ? 'text-cyan-400' : 'text-rose-400'
                      }`}
                    >
                      {currentPlayer === 'O' ? '○ (先手)' : '✕ (後手)'}
                    </span>
                    {isAiThinking && (
                      <span className="text-slate-400 text-xs italic flex items-center gap-1">
                        <span className="animate-spin inline-block w-2.5 h-2.5 border-2 border-indigo-400 border-t-transparent rounded-full"></span>
                        AI思考中...
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-5 py-2 rounded-full bg-slate-900 border text-sm font-semibold animate-bounce shadow-xl">
                    {winner === 'draw' ? (
                      <span className="text-amber-400">引き分け！ナイスファイト！</span>
                    ) : (
                      <span className="text-emerald-400 flex items-center gap-1.5">
                        <Trophy className="w-4 h-4 text-amber-400" />
                        プレイヤー {winner === 'O' ? '○' : '✕'} の勝利！
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* 3x3 Board */}
              <TicTacToeBoard
                board={board}
                onCellClick={handleCellClick}
                winningLine={winningLine}
                disabled={Boolean(winner) || isAiThinking}
                activePlayer={currentPlayer}
              />
            </div>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto space-y-6">
            <DeploymentInspector moveCount={moveCount} />
          </div>
        )}
      </main>

      {/* Footer Info */}
      <footer className="pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>Deploy Verification Matrix: All Systems Operational</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-mono text-[11px] text-slate-400">
            Build Target: Client SPA (React 19)
          </span>
        </div>
      </footer>
    </div>
  );
}
