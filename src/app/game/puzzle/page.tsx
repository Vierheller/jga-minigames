'use client';

import { useState, useEffect, useCallback } from 'react';
import { useGame } from '../../context/GameContext';

type Board = number[][];
type Direction = 'up' | 'down' | 'left' | 'right';

const GRID_SIZE = 4;
const WIN_TILE = 2048;

export default function PuzzleGame() {
  const [board, setBoard] = useState<Board>(() => 
    Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(0))
  );
  const [score, setScore] = useState(0);
  const [gameWon, setGameWon] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [moves, setMoves] = useState(0);

  const { gameState, completeChallenge, isChallengeLocked } = useGame();
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

  // Check for win condition
  const checkWin = (board: Board): boolean => {
    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        if (board[i][j] === WIN_TILE) return true;
      }
    }
    return false;
  };

  // Handle move
  const handleMove = (direction: Direction) => {
    if (gameWon || gameOver) return;

    const { newBoard, scoreGained, moved } = moveTiles(board, direction);
    
    if (moved) {
      addRandomTile(newBoard);
      setBoard(newBoard);
      setScore(prev => prev + scoreGained);
      setMoves(prev => prev + 1);

      if (checkWin(newBoard) && !isAlreadyCompleted) {
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
      <div className="max-w-2xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-8">
          <button 
            onClick={() => window.location.href = '/'}
            className="absolute top-4 left-4 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
          >
            ← Zurück
          </button>
          
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            🧪 Formel-Puzzle
          </h1>
          <p className="text-lg text-gray-300">
            Kombiniere die Verbindungen bis zur perfekten Formel (2048)!
          </p>
          
          {isAlreadyCompleted && (
            <div className="mt-4 bg-green-900/30 border border-green-500 rounded-lg p-3 max-w-md mx-auto">
              <p className="text-green-400 text-sm">
                ✅ Bereits abgeschlossen! Ziffer 3 erhalten.
              </p>
            </div>
          )}
        </div>

        {/* Game Stats */}
        <div className="flex justify-center items-center gap-8 mb-8">
          <div className="bg-black/30 px-4 py-2 rounded-lg">
            <span className="text-yellow-400">🏆 Punkte: {score}</span>
          </div>
          <div className="bg-black/30 px-4 py-2 rounded-lg">
            <span className="text-blue-400">🎯 Züge: {moves}</span>
          </div>
          <div className="bg-black/30 px-4 py-2 rounded-lg">
            <span className="text-green-400">🎯 Ziel: 2048</span>
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

        {/* Game Won Modal */}
        {gameWon && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-8 rounded-lg text-center max-w-md mx-4">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-2xl font-bold mb-4">Perfekte Formel!</h2>
              <p className="mb-4">
                Dominik hat die 2048-Verbindung erfolgreich synthetisiert!
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
              <h2 className="text-2xl font-bold mb-4">Experiment fehlgeschlagen!</h2>
              <p className="mb-6">
                Die Verbindungen sind instabil geworden. Das Gift wirkt stärker...
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
        <div className="text-center text-gray-400 text-sm">
          <p>Kombiniere gleiche Zahlen, um höhere Verbindungen zu erstellen!</p>
          <p className="mt-2">Erreiche 2048, um die nächste Code-Ziffer zu erhalten.</p>
        </div>
      </div>
    </div>
  );
} 