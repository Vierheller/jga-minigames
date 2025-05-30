'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useGame } from '../../context/GameContext';
import PlayerStatus from '../../components/PlayerStatus';

type CellType = 'empty' | 'wall' | 'destructible' | 'bomb' | 'explosion' | 'player' | 'exit' | 'powerup';

interface Cell {
  type: CellType;
  bombTimer?: number;
  explosionTimer?: number;
  powerupType?: 'extraBomb' | 'biggerExplosion' | 'speed';
}

interface Position {
  x: number;
  y: number;
}

const GRID_SIZE = 13;
const BOMB_TIMER = 3000; // 3 seconds
const EXPLOSION_DURATION = 1000; // 1 second

export default function MazeGame() {
  const [grid, setGrid] = useState<Cell[][]>([]);
  const [playerPos, setPlayerPos] = useState<Position>({ x: 1, y: 1 });
  const [exitPos, setExitPos] = useState<Position>({ x: 11, y: 11 });
  const [gameWon, setGameWon] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [bombs, setBombs] = useState<Position[]>([]);
  const [maxBombs, setMaxBombs] = useState(1);
  const [explosionRange, setExplosionRange] = useState(1);
  const [moveSpeed, setMoveSpeed] = useState(200);
  const [lastMoveTime, setLastMoveTime] = useState(0);
  const [timeLeft, setTimeLeft] = useState(120); // 2 minutes
  const [gameStarted, setGameStarted] = useState(false);

  const { gameState, completeChallenge, isChallengeLocked } = useGame();
  const isAlreadyCompleted = gameState.completedChallenges.includes('maze');
  const isLocked = isChallengeLocked('maze');

  const gameContainerRef = useRef<HTMLDivElement>(null);

  // Initialize grid
  const initializeGrid = useCallback(() => {
    const newGrid: Cell[][] = Array(GRID_SIZE).fill(null).map(() => 
      Array(GRID_SIZE).fill(null).map(() => ({ type: 'empty' }))
    );

    // Create walls (border and internal pattern)
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        if (x === 0 || y === 0 || x === GRID_SIZE - 1 || y === GRID_SIZE - 1) {
          newGrid[y][x] = { type: 'wall' };
        } else if (x % 2 === 0 && y % 2 === 0) {
          newGrid[y][x] = { type: 'wall' };
        }
      }
    }

    // Add destructible blocks randomly
    for (let y = 1; y < GRID_SIZE - 1; y++) {
      for (let x = 1; x < GRID_SIZE - 1; x++) {
        if (newGrid[y][x].type === 'empty') {
          // Don't block starting area
          if ((x === 1 && y === 1) || (x === 2 && y === 1) || (x === 1 && y === 2)) {
            continue;
          }
          // Don't block exit area
          if ((x === 11 && y === 11) || (x === 10 && y === 11) || (x === 11 && y === 10)) {
            continue;
          }
          if (Math.random() < 0.6) {
            newGrid[y][x] = { type: 'destructible' };
          }
        }
      }
    }

    // Ensure exit is accessible
    newGrid[exitPos.y][exitPos.x] = { type: 'exit' };
    
    // Add some powerups in destructible blocks
    let powerupsPlaced = 0;
    for (let y = 1; y < GRID_SIZE - 1 && powerupsPlaced < 3; y++) {
      for (let x = 1; x < GRID_SIZE - 1 && powerupsPlaced < 3; x++) {
        if (newGrid[y][x].type === 'destructible' && Math.random() < 0.1) {
          const powerups: ('extraBomb' | 'biggerExplosion' | 'speed')[] = ['extraBomb', 'biggerExplosion', 'speed'];
          newGrid[y][x].powerupType = powerups[powerupsPlaced % 3];
          powerupsPlaced++;
        }
      }
    }

    return newGrid;
  }, [exitPos]);

  // Initialize game
  useEffect(() => {
    if (!isLocked) {
      setGrid(initializeGrid());
    }
  }, [initializeGrid, isLocked]);

  // Game timer
  useEffect(() => {
    if (gameStarted && timeLeft > 0 && !gameWon && !gameOver) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !gameWon) {
      setGameOver(true);
    }
  }, [timeLeft, gameStarted, gameWon, gameOver]);

  // Handle bomb explosions
  useEffect(() => {
    const explodeBomb = (grid: Cell[][], bombX: number, bombY: number) => {
      const directions = [
        { dx: 0, dy: 0 }, // Center
        { dx: 1, dy: 0 }, { dx: -1, dy: 0 }, // Horizontal
        { dx: 0, dy: 1 }, { dx: 0, dy: -1 }  // Vertical
      ];

      const destroyedBombs: Position[] = [];

      directions.forEach(({ dx, dy }) => {
        for (let i = 0; i <= explosionRange; i++) {
          const x = bombX + dx * i;
          const y = bombY + dy * i;

          if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) break;

          const cell = grid[y][x];
          
          if (cell.type === 'wall') break;
          
          if (cell.type === 'destructible') {
            // Check for powerup
            if (cell.powerupType) {
              grid[y][x] = { type: 'powerup', powerupType: cell.powerupType };
            } else {
              grid[y][x] = { type: 'explosion', explosionTimer: EXPLOSION_DURATION };
            }
            break;
          } else if (cell.type === 'empty') {
            grid[y][x] = { type: 'explosion', explosionTimer: EXPLOSION_DURATION };
          } else if (cell.type === 'bomb') {
            // Another bomb was destroyed by this explosion
            console.log('Bomb at', x, y, 'destroyed by explosion from', bombX, bombY);
            destroyedBombs.push({ x, y });
            grid[y][x] = { type: 'explosion', explosionTimer: EXPLOSION_DURATION };
          }

          // Check if player is caught in explosion
          if (x === playerPos.x && y === playerPos.y) {
            setGameOver(true);
          }
        }
      });

      // Remove destroyed bombs from the bombs array
      if (destroyedBombs.length > 0) {
        setBombs(prev => {
          const newBombs = prev.filter(bomb => 
            !destroyedBombs.some(destroyed => destroyed.x === bomb.x && destroyed.y === bomb.y)
          );
          console.log('Chain explosion destroyed', destroyedBombs.length, 'bombs. Bombs before:', prev.length, 'after:', newBombs.length);
          return newBombs;
        });
      }
    };

    const interval = setInterval(() => {
      setGrid(prevGrid => {
        const newGrid = prevGrid.map(row => 
          row.map(cell => ({ 
            ...cell,
            bombTimer: cell.bombTimer,
            explosionTimer: cell.explosionTimer,
            powerupType: cell.powerupType
          }))
        );
        let hasChanges = false;

        // Handle bomb timers
        for (let y = 0; y < GRID_SIZE; y++) {
          for (let x = 0; x < GRID_SIZE; x++) {
            const cell = newGrid[y][x];
            if (cell.type === 'bomb' && cell.bombTimer !== undefined) {
              console.log('Bomb timer at', x, y, ':', cell.bombTimer);
              if (cell.bombTimer <= 0) {
                // Explode bomb
                console.log('Exploding bomb at:', x, y);
                explodeBomb(newGrid, x, y);
                // Remove the original exploding bomb
                setBombs(prev => {
                  const newBombs = prev.filter(bomb => !(bomb.x === x && bomb.y === y));
                  console.log('Removing original bomb at', x, y, '. Bombs before:', prev.length, 'after:', newBombs.length);
                  return newBombs;
                });
                hasChanges = true;
              } else {
                cell.bombTimer = cell.bombTimer - 100;
                hasChanges = true;
              }
            } else if (cell.type === 'explosion' && cell.explosionTimer !== undefined) {
              if (cell.explosionTimer <= 0) {
                cell.type = 'empty';
                delete cell.explosionTimer;
                hasChanges = true;
              } else {
                cell.explosionTimer = cell.explosionTimer - 100;
                hasChanges = true;
              }
            }
          }
        }

        return hasChanges ? newGrid : prevGrid;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [explosionRange, playerPos]);

  const canMoveTo = useCallback((x: number, y: number): boolean => {
    if (isAlreadyCompleted) return false; // Prevent movement if completed
    if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) return false;
    if (!grid || !grid[y] || !grid[y][x]) return false;
    const cell = grid[y][x];
    return cell.type === 'empty' || cell.type === 'exit' || cell.type === 'powerup' || cell.type === 'bomb';
  }, [isAlreadyCompleted, grid]);

  const collectPowerup = useCallback((powerupType: 'extraBomb' | 'biggerExplosion' | 'speed') => {
    console.log('Collecting powerup:', powerupType);
    switch (powerupType) {
      case 'extraBomb':
        setMaxBombs(prev => {
          console.log('Increasing maxBombs from', prev, 'to', prev + 1);
          return prev + 1;
        });
        break;
      case 'biggerExplosion':
        setExplosionRange(prev => {
          console.log('Increasing explosionRange from', prev, 'to', prev + 1);
          return prev + 1;
        });
        break;
      case 'speed':
        setMoveSpeed(prev => {
          const newSpeed = Math.max(100, prev - 50);
          console.log('Increasing speed from', prev, 'to', newSpeed);
          return newSpeed;
        });
        break;
    }
  }, []);

  const handleMove = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
    if (gameWon || gameOver || !grid || grid.length === 0) return;
    
    const now = Date.now();
    if (now - lastMoveTime < moveSpeed) return;
    
    if (!gameStarted) setGameStarted(true);
    setLastMoveTime(now);

    const directions = {
      up: { x: 0, y: -1 },
      down: { x: 0, y: 1 },
      left: { x: -1, y: 0 },
      right: { x: 1, y: 0 }
    };

    const { x: dx, y: dy } = directions[direction];
    const newX = playerPos.x + dx;
    const newY = playerPos.y + dy;

    if (canMoveTo(newX, newY)) {
      setPlayerPos({ x: newX, y: newY });

      // Check for powerup collection
      const cell = grid[newY][newX];
      if (cell.type === 'powerup' && cell.powerupType) {
        collectPowerup(cell.powerupType);
        setGrid(prev => {
          const newGrid = prev.map(row => row.map(c => ({ ...c })));
          newGrid[newY][newX] = { type: 'empty' };
          return newGrid;
        });
      }

      // Check for exit
      if (newX === exitPos.x && newY === exitPos.y && !isAlreadyCompleted) {
        setGameWon(true);
        completeChallenge('maze', '9', 3);
      }
    }
  }, [gameWon, gameOver, grid, lastMoveTime, moveSpeed, gameStarted, playerPos, canMoveTo, exitPos, isAlreadyCompleted, completeChallenge, collectPowerup]);

  const placeBomb = useCallback(() => {
    console.log('placeBomb called - current bombs:', bombs.length, 'maxBombs:', maxBombs);
    if (gameWon || gameOver || bombs.length >= maxBombs || !grid || grid.length === 0) {
      console.log('placeBomb blocked:', { gameWon, gameOver, bombsLength: bombs.length, maxBombs, gridReady: grid.length > 0 });
      return;
    }
    
    const { x, y } = playerPos;
    const currentCell = grid[y][x];
    
    // Can only place bomb on empty space or where player is standing
    if (currentCell.type !== 'empty') {
      console.log('Cannot place bomb - cell type:', currentCell.type);
      return;
    }

    console.log('Placing bomb at:', x, y, 'with timer:', BOMB_TIMER);

    setGrid(prev => {
      const newGrid = prev.map(row => 
        row.map(cell => ({ 
          ...cell,
          bombTimer: cell.bombTimer,
          explosionTimer: cell.explosionTimer,
          powerupType: cell.powerupType
        }))
      );
      newGrid[y][x] = { 
        type: 'bomb', 
        bombTimer: BOMB_TIMER,
        explosionTimer: undefined,
        powerupType: undefined
      };
      console.log('Bomb placed in grid:', newGrid[y][x]);
      return newGrid;
    });

    setBombs(prev => {
      const newBombs = [...prev, { x, y }];
      console.log('Bombs after placement:', newBombs.length);
      return newBombs;
    });
  }, [gameWon, gameOver, bombs.length, maxBombs, grid, playerPos]);

  // Keyboard controls
  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    if (isLocked || !grid || grid.length === 0) return;
    
    // Prevent default for all game keys to avoid browser scrolling/navigation
    const gameKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'W', 's', 'S', 'a', 'A', 'd', 'D', ' ', 'Enter'];
    if (gameKeys.includes(e.key)) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    switch (e.key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        handleMove('up');
        break;
      case 'ArrowDown':
      case 's':
      case 'S':
        handleMove('down');
        break;
      case 'ArrowLeft':
      case 'a':
      case 'A':
        handleMove('left');
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        handleMove('right');
        break;
      case ' ':
      case 'Enter':
        placeBomb();
        break;
    }
  }, [isLocked, grid, handleMove, placeBomb]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  // Focus game container on mount to capture keyboard events
  useEffect(() => {
    if (gameContainerRef.current && !isLocked) {
      gameContainerRef.current.focus();
    }
  }, [isLocked]);

  const resetGame = () => {
    setGrid(initializeGrid());
    setPlayerPos({ x: 1, y: 1 });
    setBombs([]);
    setMaxBombs(1);
    setExplosionRange(1);
    setMoveSpeed(200);
    setGameWon(false);
    setGameOver(false);
    setTimeLeft(120);
    setGameStarted(false);
    setLastMoveTime(0);
  };

  const getCellDisplay = (cell: Cell, x: number, y: number) => {
    if (x === playerPos.x && y === playerPos.y) {
      return { emoji: '🧑‍🔬', bg: 'bg-blue-500', text: 'text-white', countdown: null, isExit: false };
    }
    
    switch (cell.type) {
      case 'wall':
        return { emoji: '🧱', bg: 'bg-gray-800', text: 'text-gray-300', countdown: null, isExit: false };
      case 'destructible':
        return { emoji: '📦', bg: 'bg-yellow-700', text: 'text-yellow-200', countdown: null, isExit: false };
      case 'bomb':
        const timer = Math.max(1, Math.ceil((cell.bombTimer || 0) / 1000));
        return { emoji: `💣`, bg: 'bg-red-600', text: 'text-white', countdown: timer, isExit: false };
      case 'explosion':
        return { emoji: '💥', bg: 'bg-orange-500', text: 'text-white', countdown: null, isExit: false };
      case 'exit':
        return { emoji: '🎯', bg: 'bg-green-600', text: 'text-white', countdown: null, isExit: true };
      case 'powerup':
        const powerupEmojis = {
          extraBomb: '💣',
          biggerExplosion: '💥',
          speed: '⚡'
        };
        return { 
          emoji: powerupEmojis[cell.powerupType!], 
          bg: 'bg-purple-600', 
          text: 'text-white',
          countdown: null,
          isExit: false
        };
      default:
        return { emoji: '', bg: 'bg-gray-600', text: 'text-gray-400', countdown: null, isExit: false };
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLocked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-green-900 to-black text-white p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-3xl font-bold mb-4">Herausforderung gesperrt</h1>
          <p className="text-lg text-gray-300 mb-6">
            Schließe zuerst die Formel-Puzzle Herausforderung ab!
          </p>
          <button 
            onClick={() => window.location.href = '/'}
            className="px-6 py-3 bg-green-600 hover:bg-green-500 rounded-lg font-semibold transition-colors"
          >
            ← Zurück zum Hauptmenü
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={gameContainerRef}
      tabIndex={0}
      className="min-h-screen bg-gradient-to-br from-gray-900 via-green-900 to-black text-white p-4 focus:outline-none"
      onFocus={() => console.log('Game focused')}
      onClick={() => gameContainerRef.current?.focus()}
    >
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-8">
          <button 
            onClick={() => window.location.href = '/'}
            className="absolute top-4 right-4 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
          >
            ← Zurück
          </button>
          
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
            🌀 Labyrinth-Flucht
          </h1>
          <p className="text-lg text-gray-300 mb-4">
            Navigiere durch das Allergie-Labyrinth und erreiche den Ausgang!
          </p>
          <div className="bg-blue-900/30 border border-blue-500 rounded-lg p-3 max-w-md mx-auto mb-4">
            <p className="text-sm text-blue-200 text-center">
              🎯 <strong>ZIEL:</strong> Erreiche das pulsierende Ziel <span className="animate-pulse">🎯</span>
            </p>
            <p className="text-xs text-blue-300 text-center mt-2">
              💣 Zerstöre Hindernisse • ⚡ Sammle Power-ups • 🚪 Finde den Ausgang
            </p>
          </div>
          
          {isAlreadyCompleted && (
            <div className="mt-4 bg-green-900/30 border border-green-500 rounded-lg p-3 max-w-md mx-auto">
              <p className="text-green-400 text-sm">
                ✅ Bereits abgeschlossen! Ziffer 9 erhalten.
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* Left Side - Player Status */}
          <div className="lg:w-1/4 w-full">
            <PlayerStatus 
              currentGame="Labyrinth-Flucht"
              className="sticky top-4"
            />
          </div>

          {/* Right Side - Game Content */}
          <div className="lg:w-3/4 w-full">
            
            {/* Game Stats */}
            <div className="mb-6 bg-black/40 border border-green-500/30 rounded-lg p-4">
              <h3 className="text-lg font-bold text-center mb-4 text-green-400">🎯 Labyrinth-Status</h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-sm">
                <div>
                  <div className={`text-2xl font-mono ${timeLeft < 30 ? 'text-red-400' : 'text-green-400'}`}>
                    {formatTime(timeLeft)}
                  </div>
                  <div className="text-gray-400">Zeit</div>
                </div>
                <div>
                  <div className="text-blue-400 font-bold">{bombs.length}/{maxBombs}</div>
                  <div className="text-gray-400">Bomben</div>
                </div>
                <div>
                  <div className="text-orange-400 font-bold">{explosionRange}</div>
                  <div className="text-gray-400">Explosions-Radius</div>
                </div>
                <div>
                  <div className="text-purple-400 font-bold">{Math.round(300 - moveSpeed)}%</div>
                  <div className="text-gray-400">Geschwindigkeit</div>
                </div>
              </div>
            </div>
            
            {/* Game Board */}
            <div className="bg-gray-800 p-4 rounded-lg mb-6 max-w-2xl mx-auto">
              {grid.length === 0 ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-gray-400">Lade Labyrinth...</div>
                </div>
              ) : (
                <div className="grid grid-cols-13 gap-1">
                  {grid.map((row, y) =>
                    row.map((cell, x) => {
                      const { emoji, bg, text, countdown, isExit } = getCellDisplay(cell, x, y);
                      return (
                        <div
                          key={`${x}-${y}`}
                          className={`
                            aspect-square rounded flex items-center justify-center text-2xl font-bold relative
                            ${bg} ${text}
                            ${isExit ? 'animate-pulse ring-2 ring-yellow-400 ring-offset-1' : ''}
                            transition-all duration-200
                          `}
                        >
                          <div className="flex flex-col items-center justify-center">
                            <div className="text-2xl">{emoji}</div>
                            {countdown && countdown > 0 && (
                              <div className="text-xs font-bold text-yellow-300 absolute bottom-0 w-full text-center">
                                {countdown}
                              </div>
                            )}
                            {isExit && (
                              <div className="absolute -top-1 -right-1 text-xs">✨</div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="text-center mb-8">
              <p className="text-gray-400 mb-4">Steuerung: Pfeiltasten/WASD zum Bewegen, Leertaste für Bomben</p>
              
              {/* Mobile Controls */}
              <div className="grid grid-cols-3 gap-2 max-w-48 mx-auto mb-4">
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
                  onClick={placeBomb}
                  className="bg-red-600 hover:bg-red-500 p-3 rounded-lg transition-colors text-sm"
                >
                  💣
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
                <button 
                  onClick={resetGame}
                  className="bg-gray-600 hover:bg-gray-500 p-2 rounded-lg transition-colors text-xs"
                >
                  Reset
                </button>
              </div>

              {/* Legend */}
              <div className="text-xs text-gray-400 space-y-1">
                <div className="text-center font-semibold text-yellow-400 mb-2">🎯 ERREICHE DAS ZIEL 🎯</div>
                <div>🧑‍🔬 Du | 📦 Hindernis | 💣 Bombe | 💥 Explosion</div>
                <div>💣 Extra Bombe | 💥 Größere Explosion | ⚡ Geschwindigkeit</div>
                <div className="text-green-400 font-semibold">🎯 = AUSGANG (Ziel erreichen!)</div>
              </div>
            </div>
          </div>
        </div>

        {/* Game Won Modal */}
        {gameWon && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="bg-gradient-to-br from-green-600 to-green-700 p-8 rounded-lg text-center max-w-md mx-4">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-2xl font-bold mb-4">Labyrinth verlassen!</h2>
              <p className="mb-4">
                Dominik hat erfolgreich das Allergie-Labyrinth durchquert und den Ausgang erreicht!
              </p>
              <p className="text-lg font-semibold mb-6 text-yellow-200">
                Dritte Ziffer des Codes: <span className="text-3xl">9</span>
              </p>
              <div className="flex gap-4 justify-center">
                <button 
                  onClick={() => window.location.href = '/game/riddle'}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-semibold transition-colors"
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
              <h2 className="text-2xl font-bold mb-4">Explosion!</h2>
              <p className="mb-6">
                {timeLeft === 0 
                  ? 'Die Zeit ist abgelaufen! Die Allergie wirkt stärker...' 
                  : 'Dominik wurde von einer Explosion erfasst! Das Labyrinth ist gefährlich...'}
              </p>
              <button 
                onClick={resetGame}
                className="px-6 py-3 bg-green-600 hover:bg-green-500 rounded-lg font-semibold transition-colors"
              >
                Neuer Versuch
              </button>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="text-center text-gray-400 text-sm mt-8">
          <p>Zerstöre Hindernisse mit Bomben und sammle Power-ups!</p>
          <p className="mt-2">Erreiche den grünen Ausgang, um die nächste Code-Ziffer zu erhalten.</p>
        </div>
      </div>
    </div>
  );
} 