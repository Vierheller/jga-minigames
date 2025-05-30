'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useGame } from '../../context/GameContext';
import PlayerStatus from '../../components/PlayerStatus';

interface HeartBeat {
  id: number;
  time: number;
  hit: boolean;
  missed: boolean;
  perfect: boolean;
}

interface ECGPoint {
  x: number;
  y: number;
}

export default function HeartRhythmGame() {
  const [gameStarted, setGameStarted] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [heartRate, setHeartRate] = useState(72); // Normal resting heart rate
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(90); // 90 seconds to complete
  const [beats, setBeats] = useState<HeartBeat[]>([]);
  const [ecgData, setEcgData] = useState<ECGPoint[]>([]);
  const [difficulty, setDifficulty] = useState(1);
  const [heartHealth, setHeartHealth] = useState(100);
  const [lastBeatTime, setLastBeatTime] = useState(0);
  const [perfectHits, setPerfectHits] = useState(0);
  const [totalBeats, setTotalBeats] = useState(0);

  const gameRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const beatIdRef = useRef(0);
  const gameStartTimeRef = useRef(0);
  const audioContextRef = useRef<AudioContext | null>(null);

  const { gameState, completeChallenge } = useGame();
  const isLocked = !gameState.completedChallenges.includes('maze'); // Unlocked after maze
  const isAlreadyCompleted = gameState.completedChallenges.includes('rhythm');

  // Game constants
  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 300;
  const BEAT_TOLERANCE = 200; // ms tolerance for hitting beats
  const PERFECT_TOLERANCE = 100; // ms tolerance for perfect hits

  // Initialize game
  const initializeGame = useCallback(() => {
    setGameStarted(false);
    setGameWon(false);
    setGameOver(false);
    setHeartRate(72);
    setScore(0);
    setStreak(0);
    setTimeLeft(90);
    setBeats([]);
    setEcgData([]);
    setDifficulty(1);
    setHeartHealth(100);
    setLastBeatTime(0);
    setPerfectHits(0);
    setTotalBeats(0);
    beatIdRef.current = 0;
  }, []);

  // Generate heart beat pattern
  const generateBeatPattern = useCallback(() => {
    const now = Date.now();
    const interval = (60 / heartRate) * 1000; // Convert BPM to ms
    const variation = difficulty * 30; // Reduced variation to prevent overlapping
    const minInterval = 400; // Minimum 400ms between beats to prevent overlapping
    
    const newBeats: HeartBeat[] = [];
    let lastBeatTime = now;
    
    // Get the last existing beat time to continue from there
    const existingBeats = beats.filter(b => !b.hit && !b.missed);
    if (existingBeats.length > 0) {
      lastBeatTime = Math.max(...existingBeats.map(b => b.time));
    }
    
    for (let i = 0; i < 20; i++) {
      const baseTime = lastBeatTime + (i + 1) * interval;
      const randomVariation = (Math.random() - 0.5) * variation;
      let beatTime = baseTime + randomVariation;
      
      // Ensure minimum spacing between beats
      if (i > 0) {
        const previousBeatTime = newBeats[i - 1].time;
        if (beatTime - previousBeatTime < minInterval) {
          beatTime = previousBeatTime + minInterval;
        }
      }
      
      newBeats.push({
        id: beatIdRef.current++,
        time: beatTime,
        hit: false,
        missed: false,
        perfect: false
      });
    }
    
    setBeats(prev => [...prev.filter(b => !b.hit && !b.missed), ...newBeats]);
  }, [heartRate, difficulty, beats]);

  // Generate ECG wave data
  const generateECGData = useCallback(() => {
    const points: ECGPoint[] = [];
    const baselineY = CANVAS_HEIGHT / 2;
    
    for (let x = 0; x < CANVAS_WIDTH; x += 2) {
      let y = baselineY;
      
      // Add some baseline noise
      y += (Math.random() - 0.5) * 5;
      
      // Add heart beat spikes at regular intervals
      const beatInterval = (CANVAS_WIDTH / 10) * (72 / heartRate);
      const beatPhase = (x % beatInterval) / beatInterval;
      
      if (beatPhase > 0.4 && beatPhase < 0.6) {
        // QRS complex (main spike)
        const spikePhase = (beatPhase - 0.4) / 0.2;
        if (spikePhase < 0.3) {
          y -= spikePhase * 80; // Q wave
        } else if (spikePhase < 0.7) {
          y += (spikePhase - 0.3) * 200; // R wave
        } else {
          y -= (spikePhase - 0.7) * 100; // S wave
        }
      } else if (beatPhase > 0.7 && beatPhase < 0.9) {
        // T wave
        const tPhase = (beatPhase - 0.7) / 0.2;
        y += Math.sin(tPhase * Math.PI) * 30;
      }
      
      points.push({ x, y });
    }
    
    setEcgData(points);
  }, [heartRate]);

  // Draw ECG on canvas
  const drawECG = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Draw grid
    ctx.strokeStyle = '#0f4f3c';
    ctx.lineWidth = 1;
    
    // Vertical lines
    for (let x = 0; x < CANVAS_WIDTH; x += 20) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, CANVAS_HEIGHT);
      ctx.stroke();
    }
    
    // Horizontal lines
    for (let y = 0; y < CANVAS_HEIGHT; y += 20) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(CANVAS_WIDTH, y);
      ctx.stroke();
    }
    
    // Calculate scroll offset for moving ECG
    const now = Date.now();
    const gameTime = now - gameStartTimeRef.current;
    const scrollSpeed = 100; // pixels per second
    const scrollOffset = (gameTime / 1000 * scrollSpeed) % CANVAS_WIDTH;
    
    // Draw ECG line (scrolling from right to left)
    if (ecgData.length > 1) {
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2;
      ctx.beginPath();
      
      let firstPoint = true;
      for (let i = 0; i < ecgData.length; i++) {
        const x = (ecgData[i].x - scrollOffset + CANVAS_WIDTH) % CANVAS_WIDTH;
        const y = ecgData[i].y;
        
        if (firstPoint) {
          ctx.moveTo(x, y);
          firstPoint = false;
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
    }
    
    // Fixed timing line (always at 50% from left - center of screen)
    const timingLineX = CANVAS_WIDTH * 0.5;
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(timingLineX, 0);
    ctx.lineTo(timingLineX, CANVAS_HEIGHT);
    ctx.stroke();
    
    // Draw beat indicators (scrolling from right to left)
    const renderedBeats: { x: number; beat: HeartBeat }[] = [];
    
    beats.forEach(beat => {
      const beatGameTime = beat.time - gameStartTimeRef.current;
      const beatX = CANVAS_WIDTH - (gameTime - beatGameTime) / 1000 * scrollSpeed;
      
      // Only draw beats that are visible on screen
      if (beatX >= -20 && beatX <= CANVAS_WIDTH + 20) {
        // Check if this beat would overlap with already rendered beats
        const minDistance = 25; // Minimum 25 pixels between beat indicators
        const wouldOverlap = renderedBeats.some(rendered => 
          Math.abs(rendered.x - beatX) < minDistance
        );
        
        if (!wouldOverlap) {
          renderedBeats.push({ x: beatX, beat });
          
          ctx.fillStyle = beat.hit ? '#10b981' : beat.missed ? '#ef4444' : '#fbbf24';
          ctx.beginPath();
          ctx.arc(beatX, CANVAS_HEIGHT / 2, 8, 0, 2 * Math.PI);
          ctx.fill();
          
          // Pulse effect for upcoming beats near the timing line
          if (!beat.hit && !beat.missed && Math.abs(beatX - timingLineX) < 50) {
            ctx.strokeStyle = '#fbbf24';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(beatX, CANVAS_HEIGHT / 2, 12 + Math.sin(gameTime / 100) * 4, 0, 2 * Math.PI);
            ctx.stroke();
          }
        }
      }
    });
    
    // Add timing line label
    ctx.fillStyle = '#ef4444';
    ctx.font = '12px monospace';
    ctx.fillText('TIMING', timingLineX - 25, 20);
  }, [ecgData, beats]);

  // Handle beat input
  const handleBeatInput = useCallback(() => {
    const now = Date.now();
    const gameTime = now - gameStartTimeRef.current;
    const scrollSpeed = 100; // pixels per second (same as in drawECG)
    const timingLineX = CANVAS_WIDTH * 0.5;
    
    // Find the beat closest to the timing line
    let closestBeat: HeartBeat | null = null;
    let closestDistance = Infinity;
    
    beats.forEach(beat => {
      if (beat.hit || beat.missed) return;
      
      const beatGameTime = beat.time - gameStartTimeRef.current;
      const beatX = CANVAS_WIDTH - (gameTime - beatGameTime) / 1000 * scrollSpeed;
      const distance = Math.abs(beatX - timingLineX);
      
      if (distance < closestDistance && distance < 100) { // Within 100 pixels of timing line
        closestDistance = distance;
        closestBeat = beat;
      }
    });
    
    if (!closestBeat) return;
    
    // Calculate timing accuracy based on distance from timing line
    const currentBeat = closestBeat as HeartBeat;
    const beatGameTime = currentBeat.time - gameStartTimeRef.current;
    const beatX = CANVAS_WIDTH - (gameTime - beatGameTime) / 1000 * scrollSpeed;
    const pixelDistance = Math.abs(beatX - timingLineX);
    const timeDistance = (pixelDistance / scrollSpeed) * 1000; // Convert to milliseconds
    
    if (timeDistance <= BEAT_TOLERANCE) {
      // Hit!
      const isPerfect = timeDistance <= PERFECT_TOLERANCE;
      
      setBeats(prev => prev.map(beat => 
        beat.id === currentBeat.id 
          ? { ...beat, hit: true, perfect: isPerfect }
          : beat
      ));
      
      if (isPerfect) {
        setScore(s => s + 100);
        setStreak(s => s + 1);
        setPerfectHits(p => p + 1);
        setHeartHealth(h => Math.min(100, h + 2));
      } else {
        setScore(s => s + 50);
        setStreak(s => s + 1);
        setHeartHealth(h => Math.min(100, h + 1));
      }
      
      setTotalBeats(t => t + 1);
      setLastBeatTime(now);
      
      // Play beat sound
      playBeatSound(isPerfect);
      
    } else {
      // Miss - reset streak
      setStreak(0);
      setHeartHealth(h => Math.max(0, h - 5));
    }
  }, [beats]);

  // Play beat sound
  const playBeatSound = useCallback((isPerfect: boolean) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    const ctx = audioContextRef.current;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.frequency.setValueAtTime(isPerfect ? 800 : 600, ctx.currentTime);
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.1);
  }, []);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!gameStarted || gameOver || gameWon) return;
      
      if (e.code === 'Space' || e.key === 'Enter') {
        e.preventDefault();
        handleBeatInput();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameStarted, gameOver, gameWon, handleBeatInput]);

  // Game loop
  useEffect(() => {
    if (!gameStarted || gameOver || gameWon) return;

    const gameLoop = () => {
      const now = Date.now();
      const gameTime = now - gameStartTimeRef.current;
      const scrollSpeed = 100; // pixels per second
      
      // Check for missed beats (beats that have scrolled past the left edge)
      setBeats(prev => prev.map(beat => {
        if (!beat.hit && !beat.missed) {
          const beatGameTime = beat.time - gameStartTimeRef.current;
          const beatX = CANVAS_WIDTH - (gameTime - beatGameTime) / 1000 * scrollSpeed;
          
          // If beat has scrolled off the left side of screen, mark as missed
          if (beatX < -50) {
            setHeartHealth(h => Math.max(0, h - 10));
            setStreak(0);
            return { ...beat, missed: true };
          }
        }
        return beat;
      }));
      
      // Update difficulty based on time
      const elapsed = (now - gameStartTimeRef.current) / 1000;
      const newDifficulty = 1 + Math.floor(elapsed / 20) * 0.5; // Increase every 20 seconds
      setDifficulty(newDifficulty);
      
      // Update heart rate based on health and difficulty
      const targetRate = 72 + (difficulty - 1) * 10 + (100 - heartHealth) * 0.3;
      setHeartRate(hr => hr + (targetRate - hr) * 0.1);
      
      // Generate new beats if needed
      if (beats.filter(b => !b.hit && !b.missed).length < 10) {
        generateBeatPattern();
      }
      
      // Update ECG
      generateECGData();
      drawECG();
      
      // Check win/lose conditions
      if (heartHealth <= 0) {
        setGameOver(true);
      } else if (timeLeft <= 0) {
        if (heartHealth >= 50) {
          setGameWon(true);
          // Award code digit
          completeChallenge('rhythm', '2', 4);
        } else {
          setGameOver(true);
        }
      }
      
      animationRef.current = requestAnimationFrame(gameLoop);
    };

    animationRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gameStarted, gameOver, gameWon, beats, heartHealth, timeLeft, difficulty, generateBeatPattern, generateECGData, drawECG, perfectHits, totalBeats, gameState, completeChallenge]);

  // Timer countdown
  useEffect(() => {
    if (!gameStarted || gameOver || gameWon || timeLeft <= 0) return;
    
    const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [gameStarted, gameOver, gameWon, timeLeft]);

  // Focus game on mount
  useEffect(() => {
    if (gameRef.current && !isLocked) {
      gameRef.current.focus();
    }
  }, [isLocked]);

  const startGame = () => {
    if (isAlreadyCompleted) return; // Prevent starting if completed
    setGameStarted(true);
    gameStartTimeRef.current = Date.now();
    generateBeatPattern();
    generateECGData();
  };

  const resetGame = () => {
    initializeGame();
  };

  const getHeartHealthColor = () => {
    if (heartHealth >= 80) return 'text-green-400';
    if (heartHealth >= 60) return 'text-yellow-400';
    if (heartHealth >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  const getHeartHealthStatus = () => {
    if (heartHealth >= 80) return 'STABIL';
    if (heartHealth >= 60) return 'LEICHT ERHÖHT';
    if (heartHealth >= 40) return 'KRITISCH';
    return 'LEBENSGEFAHR!';
  };

  if (isLocked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-black text-white p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-3xl font-bold mb-4">Herzrhythmus-Herausforderung</h1>
          <p className="text-lg text-gray-300 mb-6">
            Schließe zuerst das Labyrinth ab!
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
          
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-red-400 to-pink-400 bg-clip-text text-transparent">
            💓 Herzrhythmus-Stabilisierung
          </h1>
          <p className="text-lg text-gray-300 mb-4">
            Halte Dominiks Herz am Schlagen durch perfektes Timing!
          </p>
          <div className="bg-red-900/30 border border-red-500 rounded-lg p-3 max-w-md mx-auto mb-4">
            <p className="text-sm text-red-200 text-center">
              ⚠️ <strong>KRITISCH:</strong> Die Allergie beeinflusst den Herzrhythmus!
            </p>
            <p className="text-xs text-red-300 text-center mt-2">
              Drücke LEERTASTE im perfekten Takt um das Herz zu stabilisieren
            </p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* Left Side - Player Status */}
          <div className="lg:w-1/4 w-full">
            <PlayerStatus 
              currentGame="💓 Herzrhythmus"
              className="sticky top-4"
            />
          </div>

          {/* Right Side - Game Content */}
          <div className="lg:w-3/4 w-full">
            
            {/* Game Stats */}
            <div className="mb-6 bg-black/40 border border-red-500/30 rounded-lg p-4">
              <h3 className="text-lg font-bold text-center mb-4 text-red-400">💓 Vital-Parameter</h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-sm mb-4">
                <div>
                  <div className="text-yellow-400 font-bold">{score}</div>
                  <div className="text-gray-400">Punkte</div>
                </div>
                <div>
                  <div className="text-blue-400 font-bold">{Math.round(heartRate)} BPM</div>
                  <div className="text-gray-400">Herzfrequenz</div>
                </div>
                <div>
                  <div className="text-purple-400 font-bold">{streak}</div>
                  <div className="text-gray-400">Serie</div>
                </div>
                <div>
                  <div className="text-orange-400 font-bold">{timeLeft}s</div>
                  <div className="text-gray-400">Zeit</div>
                </div>
              </div>

              {/* Heart Health */}
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span>💓 Herzgesundheit:</span>
                  <span className={getHeartHealthColor()}>{Math.round(heartHealth)}% - {getHeartHealthStatus()}</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-300 ${
                      heartHealth >= 80 ? 'bg-green-500' :
                      heartHealth >= 60 ? 'bg-yellow-500' :
                      heartHealth >= 40 ? 'bg-orange-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${heartHealth}%` }}
                  ></div>
                </div>
              </div>

              {/* Performance Stats */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="text-center">
                  <div className="text-green-400 font-bold">{perfectHits}</div>
                  <div className="text-gray-400">Perfekte Treffer</div>
                </div>
                <div className="text-center">
                  <div className="text-blue-400 font-bold">{totalBeats > 0 ? Math.round((perfectHits / totalBeats) * 100) : 0}%</div>
                  <div className="text-gray-400">Genauigkeit</div>
                </div>
              </div>
            </div>
            
            {/* ECG Monitor */}
            <div className="bg-black rounded-lg p-4 mb-6 border-2 border-green-500/30">
              <h3 className="text-lg font-bold text-center mb-4 text-green-400">📈 EKG-Monitor</h3>
              
              {!gameStarted ? (
                <div className="flex flex-col items-center justify-center h-80">
                  <div className="text-6xl mb-4 animate-pulse">💓</div>
                  <h2 className="text-2xl font-bold mb-4">Herzrhythmus-Stabilisierung</h2>
                  <p className="text-gray-300 text-center mb-6 max-w-md">
                    Die Allergie verursacht gefährliche Herzrhythmusstörungen! 
                    Drücke die LEERTASTE im perfekten Takt, um Dominiks Herz zu stabilisieren.
                  </p>
                  <div className="mb-6 text-center">
                    <div className="text-sm text-yellow-300 mb-2">🎯 Ziel: Überlebe 90 Sekunden mit stabiler Herzgesundheit</div>
                    <div className="text-xs text-gray-400">💡 Perfekte Treffer heilen das Herz • Verpasste Schläge schaden</div>
                  </div>
                  <button 
                    onClick={startGame}
                    className="px-8 py-4 bg-red-600 hover:bg-red-500 rounded-lg font-bold text-lg transition-colors"
                  >
                    💓 Herzüberwachung starten!
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <canvas
                    ref={canvasRef}
                    width={CANVAS_WIDTH}
                    height={CANVAS_HEIGHT}
                    className="w-full border border-green-500/50 rounded bg-black"
                    style={{ maxWidth: '100%', height: 'auto' }}
                  />
                  
                  {/* Beat instruction overlay */}
                  <div className="absolute top-4 left-4 bg-black/80 rounded-lg p-3">
                    <div className="text-sm text-yellow-300 font-bold">LEERTASTE drücken wenn:</div>
                    <div className="text-xs text-gray-300">🟡 Gelber Punkt die rote TIMING-Linie erreicht</div>
                    <div className="text-xs text-green-300">🟢 Grün = Treffer • 🔴 Rot = Verfehlt</div>
                    <div className="text-xs text-blue-300">📈 EKG scrollt von rechts nach links</div>
                  </div>
                  
                  {/* Current difficulty */}
                  <div className="absolute top-4 right-4 bg-black/80 rounded-lg p-3">
                    <div className="text-sm text-orange-300">Schwierigkeit: {difficulty.toFixed(1)}x</div>
                  </div>
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="text-center mb-8">
              <p className="text-gray-400 mb-4">Steuerung: LEERTASTE oder ENTER zum Herzschlag</p>
              
              {/* Mobile Control */}
              <div className="flex justify-center gap-4 mb-4">
                <button 
                  onClick={handleBeatInput}
                  disabled={!gameStarted || gameOver || gameWon}
                  className="px-8 py-4 bg-red-600 hover:bg-red-500 disabled:bg-gray-600 rounded-lg font-bold text-lg transition-colors"
                >
                  💓 HERZSCHLAG
                </button>
                <button 
                  onClick={resetGame}
                  className="px-6 py-4 bg-gray-600 hover:bg-gray-500 rounded-lg font-semibold transition-colors"
                >
                  🔄 Reset
                </button>
              </div>

              {/* Instructions */}
              <div className="text-xs text-gray-400 space-y-1">
                <div>💓 Drücke LEERTASTE genau wenn der gelbe Punkt die rote Linie erreicht</div>
                <div>🎯 Perfekte Treffer (±100ms) = +100 Punkte + Heilung</div>
                <div>⚡ Gute Treffer (±200ms) = +50 Punkte + kleine Heilung</div>
                <div>💀 Verpasste Schläge = Herzschaden und Serie-Reset</div>
              </div>
            </div>
          </div>
        </div>

        {/* Game Won Modal */}
        {gameWon && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="bg-gradient-to-br from-green-600 to-green-700 p-8 rounded-lg text-center max-w-md mx-4">
              <div className="text-6xl mb-4">💚</div>
              <h2 className="text-2xl font-bold mb-4">Herz stabilisiert!</h2>
              <p className="mb-4">
                Dominiks Herzrhythmus ist wieder stabil! Die Allergie kann seinem Herzen nichts mehr anhaben.
              </p>
              <div className="bg-black/20 rounded-lg p-4 mb-6">
                <div className="text-lg font-semibold mb-2 text-yellow-200">Code-Ziffer erhalten: 2</div>
                <div className="text-sm">Genauigkeit: {totalBeats > 0 ? Math.round((perfectHits / totalBeats) * 100) : 0}%</div>
              </div>
              <div className="flex gap-4 justify-center">
                <button 
                  onClick={() => window.location.href = '/'}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-semibold transition-colors"
                >
                  Weiter zum Hauptspiel
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
              <div className="text-6xl mb-4">💔</div>
              <h2 className="text-2xl font-bold mb-4">Herzstillstand!</h2>
              <p className="mb-6">
                Dominiks Herz ist zum Stillstand gekommen. Die Allergie hat gewonnen... 
                Versuche es nochmal und halte den Rhythmus!
              </p>
              <button 
                onClick={resetGame}
                className="px-6 py-3 bg-red-600 hover:bg-red-500 rounded-lg font-semibold transition-colors"
              >
                💓 Wiederbelebung versuchen
              </button>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="text-center text-gray-400 text-sm mt-8">
          <p>Halte Dominiks Herz durch perfektes Timing am Leben!</p>
          <p className="mt-2">Je genauer dein Timing, desto stabiler wird sein Herzrhythmus.</p>
        </div>
      </div>
    </div>
  );
} 