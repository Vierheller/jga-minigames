'use client';

import { useState, useEffect, useCallback } from 'react';
import { useGame } from '../../context/GameContext';
import PlayerStatus from '../../components/PlayerStatus';

type Board = number[][];
type Direction = 'up' | 'down' | 'left' | 'right';

const GRID_SIZE = 4;
const WIN_POINTS = 2000;
const BONUS_POINTS = 3000;

export default function PuzzleGame() {
  const [board, setBoard] = useState<Board>(() => 
    Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(0))
  );
  const [score, setScore] = useState(0);
  const [gameWon, setGameWon] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [moves, setMoves] = useState(0);
  const [timeBonus, setTimeBonus] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  const { gameState, completeChallenge, isChallengeLocked, addTimeBonus, timeLeft } = useGame();
  const isAlreadyCompleted = gameState.completedChallenges.includes('puzzle');
  const isLocked = isChallengeLocked('puzzle');

  // Initialize board with two random tiles
  const initializeBoard = useCallback(() => {
    const newBoard = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(0));
    addRandomTile(newBoard);
    addRandomTile(newBoard);
    return newBoard;
  }, []);

  // Add random tile (2 or 4) to empty position
  const addRandomTile = (board: Board) => {
    const emptyCells: [number, number][] = [];
    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        if (board[i][j] === 0) {
          emptyCells.push([i, j]);
        }
      }
    }
    
    if (emptyCells.length > 0) {
      const [row, col] = emptyCells[Math.floor(Math.random() * emptyCells.length)];
      board[row][col] = Math.random() < 0.9 ? 2 : 4;
    }
  };

  // Initialize game
  useEffect(() => {
    if (!isLocked) {
      setBoard(initializeBoard());
    }
  }, [initializeBoard, isLocked]);

  // Move tiles in specified direction
  const moveTiles = (board: Board, direction: Direction): { newBoard: Board; scoreGained: number; moved: boolean } => {
    const newBoard = board.map(row => [...row]);
    let scoreGained = 0;
    let moved = false;

    const moveRow = (row: number[], reverse = false) => {
      if (reverse) row.reverse();
      
      // Remove zeros
      const filtered = row.filter(val => val !== 0);
      
      // Merge adjacent equal tiles
      const merged: number[] = [];
      let i = 0;
      while (i < filtered.length) {
        if (i < filtered.length - 1 && filtered[i] === filtered[i + 1]) {
          const mergedValue = filtered[i] * 2;
          merged.push(mergedValue);
          scoreGained += mergedValue;
          i += 2;
        } else {
          merged.push(filtered[i]);
          i++;
        }
      }
      
      // Add zeros back
      while (merged.length < GRID_SIZE) {
        merged.push(0);
      }
      
      if (reverse) merged.reverse();
      
      // Check if row changed
      for (let j = 0; j < GRID_SIZE; j++) {
        if (row[j] !== merged[j]) moved = true;
      }
      
      return merged;
    };

    if (direction === 'left' || direction === 'right') {
      for (let i = 0; i < GRID_SIZE; i++) {
        newBoard[i] = moveRow(newBoard[i], direction === 'right');
      }
    } else {
      // Transpose, move, transpose back
      for (let j = 0; j < GRID_SIZE; j++) {
        const column = newBoard.map(row => row[j]);
        const movedColumn = moveRow(column, direction === 'down');
        for (let i = 0; i < GRID_SIZE; i++) {
          newBoard[i][j] = movedColumn[i];
        }
      }
    }

    return { newBoard, scoreGained, moved };
  };

  // Check if game is over
  const isGameOver = (board: Board): boolean => {
    // Check for empty cells
    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        if (board[i][j] === 0) return false;
      }
    }

    // Check for possible merges
    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        const current = board[i][j];
        if (
          (i < GRID_SIZE - 1 && board[i + 1][j] === current) ||
          (j < GRID_SIZE - 1 && board[i][j + 1] === current)
        ) {
          return false;
        }
      }
    }

    return true;
  };

  // Handle move
  const handleMove = (direction: Direction) => {
    if (gameWon || gameOver) return;

    if (!gameStarted) setGameStarted(true);

    const { newBoard, scoreGained, moved } = moveTiles(board, direction);
    
    if (moved) {
      addRandomTile(newBoard);
      setBoard(newBoard);
      const newScore = score + scoreGained;
      setScore(newScore);
      setMoves(prev => prev + 1);

      // Check for bonus time at 3000 points
      if (newScore >= BONUS_POINTS && !timeBonus) {
        setTimeBonus(true);
        addTimeBonus(60); // Add 1 minute bonus
      }

      // Check win condition at 2000 points
      if (newScore >= WIN_POINTS && !isAlreadyCompleted && !gameWon) {
        setGameWon(true);
        completeChallenge('puzzle', '3', 2);
      } else if (isGameOver(newBoard)) {
        setGameOver(true);
      }
    }
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (isLocked) return;
      
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          handleMove('up');
          break;
        case 'ArrowDown':
          e.preventDefault();
          handleMove('down');
          break;
        case 'ArrowLeft':
          e.preventDefault();
          handleMove('left');
          break;
        case 'ArrowRight':
          e.preventDefault();
          handleMove('right');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [board, gameWon, gameOver, isLocked]);

  const resetGame = () => {
    setBoard(initializeBoard());
    setScore(0);
    setGameWon(false);
    setGameOver(false);
    setMoves(0);
    setTimeBonus(false);
    setGameStarted(false);
  };

  const getTileColor = (value: number): string => {
    const colors: { [key: number]: string } = {
      0: 'bg-gray-700',
      2: 'bg-blue-500',
      4: 'bg-blue-600',
      8: 'bg-purple-500',
      16: 'bg-purple-600',
      32: 'bg-pink-500',
      64: 'bg-pink-600',
      128: 'bg-red-500',
      256: 'bg-red-600',
      512: 'bg-orange-500',
      1024: 'bg-orange-600',
      2048: 'bg-yellow-500',
    };
    return colors[value] || 'bg-green-500';
  };

  const getProgressPercentage = () => {
    return Math.min((score / WIN_POINTS) * 100, 100);
  };

  const getBonusProgressPercentage = () => {
    if (score < WIN_POINTS) return 0;
    return Math.min(((score - WIN_POINTS) / (BONUS_POINTS - WIN_POINTS)) * 100, 100);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLocked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-black text-white p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-3xl font-bold mb-4">Herausforderung gesperrt</h1>
          <p className="text-lg text-gray-300 mb-6">
            Schließe zuerst die Gedächtnis-Herausforderung ab!
          </p>
          <button 
            onClick={() => window.location.href = '/'}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-semibold transition-colors"
          >
            ← Zurück zum Hauptmenü
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-black text-white p-4">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-8">
          <button 
            onClick={() => window.location.href = '/'}
            className="absolute top-4 right-4 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
          >
            ← Zurück
          </button>
          
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            🧪 Formel-Puzzle
          </h1>
          <p className="text-lg text-gray-300">
            Sammle {WIN_POINTS} Punkte, um die perfekte Formel zu synthetisieren!
          </p>
          
          {isAlreadyCompleted && (
            <div className="mt-4 bg-green-900/30 border border-green-500 rounded-lg p-3 max-w-md mx-auto">
              <p className="text-green-400 text-sm">
                ✅ Bereits abgeschlossen! Ziffer 3 erhalten.
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* Left Side - Player Status */}
          <div className="lg:w-1/4 w-full">
            <PlayerStatus 
              currentGame="Formel-Synthese"
              className="sticky top-4"
            />
          </div>

          {/* Right Side - Game Content */}
          <div className="lg:w-3/4 w-full">
            
            {/* Game Progress */}
            <div className="mb-6 bg-black/40 border border-blue-500/30 rounded-lg p-4">
              <h3 className="text-lg font-bold text-center mb-4 text-blue-400">🎯 Synthese-Fortschritt</h3>
              
              {/* Game Timer */}
              <div className="mb-4 text-center">
                <div className={`text-2xl font-mono ${timeLeft < 30 ? 'text-red-400' : 'text-green-400'}`}>
                  {formatTime(timeLeft)}
                </div>
                <div className="text-sm text-gray-400">Verbleibende Zeit</div>
              </div>

              {/* Main Progress Bar */}
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span>Ziel: {WIN_POINTS} Punkte</span>
                  <span className="text-green-400">{score}/{WIN_POINTS}</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-500 ease-out"
                    style={{ width: `${getProgressPercentage()}%` }}
                  ></div>
                </div>
                {score >= WIN_POINTS && (
                  <div className="text-center mt-2 text-green-400 font-bold">
                    ✅ Ziel erreicht!
                  </div>
                )}
              </div>

              {/* Bonus Progress Bar */}
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span>Bonus: {BONUS_POINTS} Punkte</span>
                  <span className="text-yellow-400">{Math.max(0, score - WIN_POINTS)}/{BONUS_POINTS - WIN_POINTS}</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 transition-all duration-500 ease-out"
                    style={{ width: `${getBonusProgressPercentage()}%` }}
                  ></div>
                </div>
                {timeBonus && (
                  <div className="text-center mt-2 text-yellow-400 font-bold">
                    ⏰ +60s Bonus Zeit erhalten!
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 text-center text-sm">
                <div>
                  <div className="text-yellow-400 font-bold">{score}</div>
                  <div className="text-gray-400">Punkte</div>
                </div>
                <div>
                  <div className="text-blue-400 font-bold">{moves}</div>
                  <div className="text-gray-400">Züge</div>
                </div>
                <div>
                  <div className={score >= WIN_POINTS ? 'text-green-400' : 'text-orange-400'}>
                    {score >= WIN_POINTS ? '✅' : '⏳'}
                  </div>
                  <div className="text-gray-400">Status</div>
                </div>
              </div>
            </div>
            
            {/* Game Board */}
            <div className="bg-gray-800 p-4 rounded-lg mb-8 max-w-md mx-auto">
              <div className="grid grid-cols-4 gap-2">
                {board.map((row, i) =>
                  row.map((cell, j) => (
                    <div
                      key={`${i}-${j}`}
                      className={`
                        aspect-square rounded-lg flex items-center justify-center font-bold text-lg
                        ${getTileColor(cell)}
                        ${cell === 0 ? 'text-gray-500' : 'text-white'}
                        transition-all duration-200
                      `}
                    >
                      {cell !== 0 && cell}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Controls */}
            <div className="text-center mb-8">
              <p className="text-gray-400 mb-4">Verwende die Pfeiltasten oder klicke die Buttons:</p>
              <div className="grid grid-cols-3 gap-2 max-w-48 mx-auto">
                <div></div>
                <button 
                  onClick={() => handleMove('up')}
                  className="bg-gray-700 hover:bg-gray-600 p-3 rounded-lg transition-colors"
                >
                  ↑
                </button>
                <div></div>
                <button 
                  onClick={() => handleMove('left')}
                  className="bg-gray-700 hover:bg-gray-600 p-3 rounded-lg transition-colors"
                >
                  ←
                </button>
                <button 
                  onClick={resetGame}
                  className="bg-red-600 hover:bg-red-500 p-3 rounded-lg transition-colors text-sm"
                >
                  Reset
                </button>
                <button 
                  onClick={() => handleMove('right')}
                  className="bg-gray-700 hover:bg-gray-600 p-3 rounded-lg transition-colors"
                >
                  →
                </button>
                <div></div>
                <button 
                  onClick={() => handleMove('down')}
                  className="bg-gray-700 hover:bg-gray-600 p-3 rounded-lg transition-colors"
                >
                  ↓
                </button>
                <div></div>
              </div>
            </div>
          </div>
        </div>

        {/* Game Won Modal */}
        {gameWon && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-8 rounded-lg text-center max-w-md mx-4">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-2xl font-bold mb-4">Perfekte Formel!</h2>
              <p className="mb-4">
                Dominik hat {score} Punkte erreicht und die Formel erfolgreich synthetisiert!
              </p>
              <p className="text-lg font-semibold mb-6 text-yellow-200">
                Zweite Ziffer des Codes: <span className="text-3xl">3</span>
              </p>
              <div className="flex gap-4 justify-center">
                <button 
                  onClick={() => window.location.href = '/game/maze'}
                  className="px-6 py-3 bg-green-600 hover:bg-green-500 rounded-lg font-semibold transition-colors"
                >
                  Nächste Herausforderung →
                </button>
                <button 
                  onClick={resetGame}
                  className="px-6 py-3 bg-gray-600 hover:bg-gray-500 rounded-lg font-semibold transition-colors"
                >
                  Nochmal spielen
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Game Over Modal */}
        {gameOver && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="bg-gradient-to-br from-red-600 to-red-700 p-8 rounded-lg text-center max-w-md mx-4">
              <div className="text-6xl mb-4">💀</div>
              <h2 className="text-2xl font-bold mb-4">Zeit abgelaufen!</h2>
              <p className="mb-6">
                Das Experiment ist fehlgeschlagen. Du hattest {score} von {WIN_POINTS} benötigten Punkten.
              </p>
              <button 
                onClick={resetGame}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-semibold transition-colors"
              >
                Neuer Versuch
              </button>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="text-center text-gray-400 text-sm mt-8">
          <p>Kombiniere gleiche Zahlen, um höhere Verbindungen zu erstellen!</p>
          <p className="mt-2">Erreiche {WIN_POINTS} Punkte, um die nächste Code-Ziffer zu erhalten.</p>
        </div>
      </div>
    </div>
  );
} 