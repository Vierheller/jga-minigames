'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useGame } from '../../context/GameContext';
import PlayerStatus from '../../components/PlayerStatus';

interface Position {
  x: number;
  y: number;
}

interface Obstacle {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'car' | 'cone' | 'barrier';
  speed: number;
}

interface Collectible {
  id: number;
  x: number;
  y: number;
  type: 'speed' | 'time';
  collected: boolean;
}

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const AMBULANCE_SIZE = 40;
const ROAD_WIDTH = 300;
const ROAD_LANES = 3;
const LANE_WIDTH = ROAD_WIDTH / ROAD_LANES;

export default function AmbulanceGame() {
  const [ambulancePos, setAmbulancePos] = useState<Position>({ x: GAME_WIDTH / 2, y: GAME_HEIGHT - 60 });
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [collectibles, setCollectibles] = useState<Collectible[]>([]);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [distance, setDistance] = useState(0);
  const [speed, setSpeed] = useState(30);
  const [timeBonus, setTimeBonus] = useState(0);
  const [phase, setPhase] = useState<'to_home' | 'at_home' | 'to_hospital'>('to_home');
  const [keys, setKeys] = useState({ left: false, right: false, up: false, down: false });
  const [progressPercentage, setProgressPercentage] = useState(0);
  
  const gameRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const obstacleIdRef = useRef(0);
  const collectibleIdRef = useRef(0);
  const keysRef = useRef({ left: false, right: false, up: false, down: false });
  const ambulancePosRef = useRef<Position>({ x: GAME_WIDTH / 2, y: GAME_HEIGHT - 60 });
  const ambulanceElementRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  const { gameState, addTimeBonus } = useGame();
  const isLocked = gameState.completedChallenges.length === 0; // Ambulance unlocked after first challenge

  // Game constants
  const TARGET_DISTANCE = 1000; // Distance to home (adjusted for ~2 min total gameplay)
  const MAX_SPEED = 120; // Increased for faster progression

  // Initialize game
  const initializeGame = useCallback(() => {
    const initialPos = { x: GAME_WIDTH / 2, y: GAME_HEIGHT - 60 };
    setAmbulancePos(initialPos);
    ambulancePosRef.current = initialPos;
    setObstacles([]);
    setCollectibles([]);
    setScore(0);
    setDistance(0);
    setSpeed(30); // Slightly higher starting speed
    setTimeBonus(0);
    setPhase('to_home');
    setGameWon(false);
    setGameOver(false);
    setGameStarted(false);
  }, []);

  // Update progress percentage when distance or phase changes
  useEffect(() => {
    let newPercentage = 0;
    
    if (phase === 'to_home') {
      // 0% to 100% when driving to home
      newPercentage = Math.min((distance / TARGET_DISTANCE) * 100, 100);
    } else if (phase === 'at_home') {
      // Stay at 100% when at home
      newPercentage = 100;
    } else if (phase === 'to_hospital') {
      // 100% to 0% when driving back to hospital
      const returnProgress = Math.max(0, (distance - TARGET_DISTANCE) / TARGET_DISTANCE);
      newPercentage = Math.max(0, 100 - (returnProgress * 100));
    }
    
    setProgressPercentage(newPercentage);
    
    // Also update DOM directly for immediate visual feedback
    if (progressBarRef.current) {
      progressBarRef.current.style.width = `${Math.round(newPercentage)}%`;
    }
    
    console.log(newPercentage);
  }, [distance, phase, TARGET_DISTANCE]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!gameStarted || gameOver || gameWon) return;
      
      switch (e.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
          e.preventDefault();
          setKeys(prev => ({ ...prev, left: true }));
          keysRef.current.left = true;
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          e.preventDefault();
          setKeys(prev => ({ ...prev, right: true }));
          keysRef.current.right = true;
          break;
        case 'ArrowUp':
        case 'w':
        case 'W':
          e.preventDefault();
          setKeys(prev => ({ ...prev, up: true }));
          keysRef.current.up = true;
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          e.preventDefault();
          setKeys(prev => ({ ...prev, down: true }));
          keysRef.current.down = true;
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
          setKeys(prev => ({ ...prev, left: false }));
          keysRef.current.left = false;
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          setKeys(prev => ({ ...prev, right: false }));
          keysRef.current.right = false;
          break;
        case 'ArrowUp':
        case 'w':
        case 'W':
          setKeys(prev => ({ ...prev, up: false }));
          keysRef.current.up = false;
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          setKeys(prev => ({ ...prev, down: false }));
          keysRef.current.down = false;
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameStarted, gameOver, gameWon]);

  // Spawn obstacles
  const spawnObstacle = useCallback(() => {
    const roadStart = (GAME_WIDTH - ROAD_WIDTH) / 2;
    const lane = Math.floor(Math.random() * ROAD_LANES);
    const x = roadStart + lane * LANE_WIDTH + LANE_WIDTH / 2;
    
    const types: ('car' | 'cone' | 'barrier')[] = ['car', 'cone', 'barrier'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    const obstacle: Obstacle = {
      id: obstacleIdRef.current++,
      x,
      y: -50,
      width: type === 'car' ? 35 : type === 'cone' ? 20 : 40,
      height: type === 'car' ? 60 : type === 'cone' ? 20 : 30,
      type,
      speed: 1 // All obstacles move at the same base speed
    };

    setObstacles(prev => [...prev, obstacle]);
  }, []);

  // Spawn collectibles
  const spawnCollectible = useCallback(() => {
    const roadStart = (GAME_WIDTH - ROAD_WIDTH) / 2;
    const lane = Math.floor(Math.random() * ROAD_LANES);
    const x = roadStart + lane * LANE_WIDTH + LANE_WIDTH / 2;
    
    const types: ('speed' | 'time')[] = ['speed', 'time'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    const collectible: Collectible = {
      id: collectibleIdRef.current++,
      x,
      y: -30,
      type,
      collected: false
    };

    setCollectibles(prev => [...prev, collectible]);
  }, []);

  // Collision detection
  const checkCollision = useCallback((rect1: any, rect2: any) => {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
  }, []);

  // Game loop
  useEffect(() => {
    if (!gameStarted || gameOver || gameWon) return;

    let lastTime = 0;

    const gameLoop = (currentTime: number) => {
      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;
      
      // Skip first frame to avoid huge deltaTime
      if (deltaTime > 100) {
        animationRef.current = requestAnimationFrame(gameLoop);
        return;
      }
      
      // Normalize deltaTime to 60fps (16.67ms per frame)
      const normalizedDelta = deltaTime / 16.67;
      
      // Move ambulance
      const currentKeys = keysRef.current;
      let newX = ambulancePosRef.current.x;
      let newY = ambulancePosRef.current.y;

      if (currentKeys.left && newX > (GAME_WIDTH - ROAD_WIDTH) / 2) {
        newX -= 1.5 * normalizedDelta;
      }
      if (currentKeys.right && newX < (GAME_WIDTH + ROAD_WIDTH) / 2 - AMBULANCE_SIZE) {
        newX += 1.5 * normalizedDelta;
      }
      if (currentKeys.up && newY > 0) {
        newY -= 1 * normalizedDelta;
      }
      if (currentKeys.down && newY < GAME_HEIGHT - AMBULANCE_SIZE) {
        newY += 1 * normalizedDelta;
      }

      // Update ref immediately
      ambulancePosRef.current = { x: newX, y: newY };
      
      // Update DOM element directly for smooth movement
      if (ambulanceElementRef.current) {
        ambulanceElementRef.current.style.left = `${newX}px`;
        ambulanceElementRef.current.style.top = `${newY}px`;
      }

      // Update state less frequently for React components that need it
      setAmbulancePos({ x: newX, y: newY });

      // Update distance and speed
      setDistance(prev => {
        const newDistance = prev + (speed * 0.01 * normalizedDelta); // Much slower distance progression for realistic speeds
        
        // Check phase transitions
        if (phase === 'to_home' && newDistance >= TARGET_DISTANCE) {
          setPhase('at_home');
          setTimeout(() => setPhase('to_hospital'), 2000);
          return TARGET_DISTANCE;
        } else if (phase === 'to_hospital' && newDistance >= TARGET_DISTANCE * 2) {
          setGameWon(true);
          return TARGET_DISTANCE * 2;
        }
        
        return newDistance;
      });


      // Move obstacles
      setObstacles(prev => prev.map(obstacle => ({
        ...obstacle,
        y: obstacle.y + (speed * 0.05) * normalizedDelta // Adjusted for realistic speeds
      })).filter(obstacle => obstacle.y < GAME_HEIGHT + 100));

      // Move collectibles
      setCollectibles(prev => prev.map(collectible => ({
        ...collectible,
        y: collectible.y + (speed * 0.05) * normalizedDelta // Same speed as obstacles
      })).filter(collectible => collectible.y < GAME_HEIGHT + 50 && !collectible.collected));

      // Check collisions with obstacles
      setObstacles(prev => {
        for (const obstacle of prev) {
          // Adjust collision box to match visual positioning (obstacle is centered on x)
          // Make collision boxes slightly smaller for more forgiving gameplay
          const margin = 3; // 3px margin for more forgiving collisions
          const obstacleCollisionBox = {
            x: obstacle.x - obstacle.width / 2 + margin,
            y: obstacle.y + margin,
            width: obstacle.width - (margin * 2),
            height: obstacle.height - (margin * 2)
          };
          
          const ambulanceCollisionBox = {
            x: ambulancePosRef.current.x + margin,
            y: ambulancePosRef.current.y + margin,
            width: AMBULANCE_SIZE - (margin * 2),
            height: AMBULANCE_SIZE - (margin * 2)
          };
          
          if (checkCollision(ambulanceCollisionBox, obstacleCollisionBox)) {
            setGameOver(true);
            return prev;
          }
        }
        return prev;
      });

      // Check collisions with collectibles
      setCollectibles(prev => prev.map(collectible => {
        if (!collectible.collected && checkCollision(
          { x: ambulancePosRef.current.x, y: ambulancePosRef.current.y, width: AMBULANCE_SIZE, height: AMBULANCE_SIZE },
          { x: collectible.x - 15, y: collectible.y - 15, width: 30, height: 30 }
        )) {
          if (collectible.type === 'speed') {
            setSpeed(s => Math.min(MAX_SPEED, s + 10));
          } else if (collectible.type === 'time') {
            addTimeBonus(15);
            setTimeBonus(t => t + 15);
          }
          setScore(s => s + 100);
          return { ...collectible, collected: true };
        }
        return collectible;
      }));

      // Spawn new obstacles and collectibles (frame-rate independent)
      if (Math.random() < (0.008 * normalizedDelta)) { // Reduced spawn rate for slower gameplay
        spawnObstacle();
      }
      if (Math.random() < (0.002 * normalizedDelta)) { // Reduced spawn rate for slower gameplay
        spawnCollectible();
      }

      animationRef.current = requestAnimationFrame(gameLoop);
    };

    animationRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gameStarted, gameOver, gameWon, speed, phase, checkCollision, spawnObstacle, spawnCollectible, addTimeBonus]);

  // Focus game on mount
  useEffect(() => {
    if (gameRef.current && !isLocked) {
      gameRef.current.focus();
    }
  }, [isLocked]);

  const startGame = () => {
    setGameStarted(true);
  };

  const resetGame = () => {
    initializeGame();
  };

  const getObstacleEmoji = (type: string) => {
    switch (type) {
      case 'car': return '🚗';
      case 'cone': return '🚧';
      case 'barrier': return '🚧';
      default: return '🚗';
    }
  };

  const getCollectibleEmoji = (type: string) => {
    switch (type) {
      case 'speed': return '⚡';
      case 'time': return '⏰';
      default: return '⭐';
    }
  };

  const getPhaseText = () => {
    switch (phase) {
      case 'to_home': return 'Zu Hause';
      case 'at_home': return 'Zu Hause';
      case 'to_hospital': return 'Krankenhaus';
      default: return 'Krankenhaus';
    }
  };

  const getProgressPercentage = () => {
    if (phase === 'to_home') {
      // 0% to 100% when driving to home
      const progress = Math.min((distance / TARGET_DISTANCE) * 100, 100);
      return progress;
    } else if (phase === 'at_home') {
      // Stay at 100% when at home
      return 100;
    } else if (phase === 'to_hospital') {
      // 100% to 0% when driving back to hospital
      const returnProgress = Math.max(0, (distance - TARGET_DISTANCE) / TARGET_DISTANCE);
      return Math.max(0, 100 - (returnProgress * 100));
    }
    return 0;
  };

  if (isLocked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-black text-white p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-3xl font-bold mb-4">Bonus-Herausforderung</h1>
          <p className="text-lg text-gray-300 mb-6">
            Schließe zuerst die Hauptherausforderungen ab!
          </p>
          <button 
            onClick={() => window.location.href = '/'}
            className="px-6 py-3 bg-red-600 hover:bg-red-500 rounded-lg font-semibold transition-colors"
          >
            ← Zurück zum Hauptmenü
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={gameRef}
      tabIndex={0}
      className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-black text-white p-4 focus:outline-none"
      onClick={() => gameRef.current?.focus()}
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
          
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
            🚨 Krankenwagen-Fahrt
          </h1>
          <p className="text-lg text-gray-300 mb-4">
            Fahre sicher von der Klinik nach Hause und zurück!
          </p>
          <div className="bg-blue-900/30 border border-blue-500 rounded-lg p-3 max-w-md mx-auto mb-4">
            <p className="text-sm text-blue-200 text-center">
              🎯 <strong>BONUS-MISSION:</strong> Sammle Zeitboni für das Hauptspiel!
            </p>
            <p className="text-xs text-blue-300 text-center mt-2">
              ⚡ Geschwindigkeit • ⏰ Zeitbonus • 🚧 Hindernisse vermeiden
            </p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* Left Side - Player Status */}
          <div className="lg:w-1/4 w-full">
            <PlayerStatus 
              currentGame={`🚨 Fahrt: ${getPhaseText()}`}
              className="sticky top-4"
            />
          </div>

          {/* Right Side - Game Content */}
          <div className="lg:w-3/4 w-full">
            
            {/* Game Stats */}
            <div className="mb-6 bg-black/40 border border-red-500/30 rounded-lg p-4">
              <h3 className="text-lg font-bold text-center mb-4 text-red-400">🚨 Fahrt-Status</h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-sm mb-4">
                <div>
                  <div className="text-yellow-400 font-bold">{score}</div>
                  <div className="text-gray-400">Punkte</div>
                </div>
                <div>
                  <div className="text-green-400 font-bold">{speed} km/h</div>
                  <div className="text-gray-400">Geschwindigkeit</div>
                </div>
                <div>
                  <div className="text-blue-400 font-bold">{Math.round(distance)}m</div>
                  <div className="text-gray-400">Strecke</div>
                </div>
                <div>
                  <div className="text-purple-400 font-bold">{timeBonus}s</div>
                  <div className="text-gray-400">Zeitbonus</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span>🏥 Krankenhaus</span>
                  <span className="text-orange-400">
                    {phase === 'to_home' ? '→ Zu Hause' : 
                     phase === 'at_home' ? '🏠 Zu Hause' : 
                     '→ Krankenhaus'}
                  </span>
                  <span>🏠 Zuhause</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                  <div 
                    ref={progressBarRef}
                    key={`progress-${progressPercentage}`}
                    className="h-full bg-gradient-to-r from-red-500 via-orange-500 to-green-500 transition-all duration-300"
                    style={{ 
                      width: `${Math.round(progressPercentage)}%`,
                      '--progress': `${Math.round(progressPercentage)}%`
                    } as React.CSSProperties}
                  ></div>
                </div>
                <div className="text-xs text-gray-400 mt-1 text-center">
                  Gesamtstrecke: {TARGET_DISTANCE * 2}m (Hin- und Rückfahrt)
                </div>
              </div>
            </div>
            
            {/* Game Area */}
            <div className="bg-gray-800 rounded-lg p-4 mb-6">
              {!gameStarted ? (
                <div className="flex flex-col items-center justify-center h-96">
                  <div className="text-6xl mb-4">🚨</div>
                  <h2 className="text-2xl font-bold mb-4">Notfall-Transport</h2>
                  <p className="text-gray-300 text-center mb-6 max-w-md">
                    Dominik muss dringend nach Hause, um wichtige Medikamente zu holen! 
                    Fahre sicher durch den Verkehr und sammle Boni.
                  </p>
                  <button 
                    onClick={startGame}
                    className="px-8 py-4 bg-red-600 hover:bg-red-500 rounded-lg font-bold text-lg transition-colors"
                  >
                    🚨 Notfall-Fahrt starten!
                  </button>
                </div>
              ) : (
                <div 
                  className="relative bg-gray-600 mx-auto overflow-hidden"
                  style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}
                >
                  {/* Road */}
                  <div 
                    className="absolute bg-gray-700"
                    style={{ 
                      left: (GAME_WIDTH - ROAD_WIDTH) / 2, 
                      width: ROAD_WIDTH, 
                      height: GAME_HEIGHT 
                    }}
                  >
                    {/* Lane dividers */}
                    {[1, 2].map(lane => (
                      <div
                        key={lane}
                        className="absolute w-1 h-full bg-yellow-400 opacity-50"
                        style={{ left: lane * LANE_WIDTH }}
                      />
                    ))}
                  </div>

                  {/* Ambulance */}
                  <div
                    ref={ambulanceElementRef}
                    className="absolute text-3xl"
                    style={{
                      left: ambulancePos.x,
                      top: ambulancePos.y,
                      width: AMBULANCE_SIZE,
                      height: AMBULANCE_SIZE
                    }}
                  >
                    🚑
                  </div>

                  {/* Obstacles */}
                  {obstacles.map(obstacle => (
                    <div
                      key={obstacle.id}
                      className="absolute text-2xl"
                      style={{
                        left: obstacle.x - obstacle.width / 2,
                        top: obstacle.y,
                        width: obstacle.width,
                        height: obstacle.height
                      }}
                    >
                      {getObstacleEmoji(obstacle.type)}
                    </div>
                  ))}

                  {/* Collectibles */}
                  {collectibles.filter(c => !c.collected).map(collectible => (
                    <div
                      key={collectible.id}
                      className="absolute text-xl animate-pulse"
                      style={{
                        left: collectible.x - 15,
                        top: collectible.y - 15,
                        width: 30,
                        height: 30
                      }}
                    >
                      {getCollectibleEmoji(collectible.type)}
                    </div>
                  ))}

                  {/* Phase indicator */}
                  {phase === 'at_home' && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <div className="bg-green-600 p-6 rounded-lg text-center">
                        <div className="text-4xl mb-2">🏠</div>
                        <div className="text-xl font-bold">Zu Hause angekommen!</div>
                        <div className="text-sm">Medikamente geholt... Rückfahrt startet...</div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="text-center mb-8">
              <p className="text-gray-400 mb-4">Steuerung: Pfeiltasten oder WASD</p>
              
              {/* Mobile Controls */}
              <div className="grid grid-cols-3 gap-2 max-w-48 mx-auto mb-4">
                <div></div>
                <button 
                  onMouseDown={() => {
                    setKeys(prev => ({ ...prev, up: true }));
                    keysRef.current.up = true;
                  }}
                  onMouseUp={() => {
                    setKeys(prev => ({ ...prev, up: false }));
                    keysRef.current.up = false;
                  }}
                  onTouchStart={() => {
                    setKeys(prev => ({ ...prev, up: true }));
                    keysRef.current.up = true;
                  }}
                  onTouchEnd={() => {
                    setKeys(prev => ({ ...prev, up: false }));
                    keysRef.current.up = false;
                  }}
                  className="bg-gray-700 hover:bg-gray-600 p-3 rounded-lg transition-colors"
                >
                  ↑
                </button>
                <div></div>
                <button 
                  onMouseDown={() => {
                    setKeys(prev => ({ ...prev, left: true }));
                    keysRef.current.left = true;
                  }}
                  onMouseUp={() => {
                    setKeys(prev => ({ ...prev, left: false }));
                    keysRef.current.left = false;
                  }}
                  onTouchStart={() => {
                    setKeys(prev => ({ ...prev, left: true }));
                    keysRef.current.left = true;
                  }}
                  onTouchEnd={() => {
                    setKeys(prev => ({ ...prev, left: false }));
                    keysRef.current.left = false;
                  }}
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
                  onMouseDown={() => {
                    setKeys(prev => ({ ...prev, right: true }));
                    keysRef.current.right = true;
                  }}
                  onMouseUp={() => {
                    setKeys(prev => ({ ...prev, right: false }));
                    keysRef.current.right = false;
                  }}
                  onTouchStart={() => {
                    setKeys(prev => ({ ...prev, right: true }));
                    keysRef.current.right = true;
                  }}
                  onTouchEnd={() => {
                    setKeys(prev => ({ ...prev, right: false }));
                    keysRef.current.right = false;
                  }}
                  className="bg-gray-700 hover:bg-gray-600 p-3 rounded-lg transition-colors"
                >
                  →
                </button>
                <div></div>
                <button 
                  onMouseDown={() => {
                    setKeys(prev => ({ ...prev, down: true }));
                    keysRef.current.down = true;
                  }}
                  onMouseUp={() => {
                    setKeys(prev => ({ ...prev, down: false }));
                    keysRef.current.down = false;
                  }}
                  onTouchStart={() => {
                    setKeys(prev => ({ ...prev, down: true }));
                    keysRef.current.down = true;
                  }}
                  onTouchEnd={() => {
                    setKeys(prev => ({ ...prev, down: false }));
                    keysRef.current.down = false;
                  }}
                  className="bg-gray-700 hover:bg-gray-600 p-3 rounded-lg transition-colors"
                >
                  ↓
                </button>
              </div>

              {/* Legend */}
              <div className="text-xs text-gray-400 space-y-1">
                <div>🚑 Krankenwagen | 🚗 Verkehr | 🚧 Hindernisse</div>
                <div>⚡ Geschwindigkeitsboost (+0.1 km/h) | ⏰ Zeitbonus (+15s)</div>
              </div>
            </div>
          </div>
        </div>

        {/* Game Won Modal */}
        {gameWon && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="bg-gradient-to-br from-green-600 to-green-700 p-8 rounded-lg text-center max-w-md mx-4">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-2xl font-bold mb-4">Mission erfolgreich!</h2>
              <p className="mb-4">
                Dominik ist sicher nach Hause und zurück gefahren!
              </p>
              <p className="text-lg font-semibold mb-6 text-yellow-200">
                Zeitbonus erhalten: <span className="text-3xl">+{timeBonus} Sekunden</span>
              </p>
              <div className="flex gap-4 justify-center">
                <button 
                  onClick={() => window.location.href = '/'}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-semibold transition-colors"
                >
                  Zurück zum Hauptspiel
                </button>
                <button 
                  onClick={resetGame}
                  className="px-6 py-3 bg-gray-600 hover:bg-gray-500 rounded-lg font-semibold transition-colors"
                >
                  Nochmal fahren
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Game Over Modal */}
        {gameOver && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="bg-gradient-to-br from-red-600 to-red-700 p-8 rounded-lg text-center max-w-md mx-4">
              <div className="text-6xl mb-4">💥</div>
              <h2 className="text-2xl font-bold mb-4">Unfall!</h2>
              <p className="mb-6">
                Der Krankenwagen ist mit einem Hindernis kollidiert! 
                Dominik muss vorsichtiger fahren.
              </p>
              <button 
                onClick={resetGame}
                className="px-6 py-3 bg-red-600 hover:bg-red-500 rounded-lg font-semibold transition-colors"
              >
                Neuer Versuch
              </button>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="text-center text-gray-400 text-sm mt-8">
          <p>Fahre sicher durch den Verkehr und sammle Boni für das Hauptspiel!</p>
          <p className="mt-2">Vermeide Kollisionen und erreiche beide Ziele für maximalen Zeitbonus.</p>
        </div>
      </div>
    </div>
  );
} 