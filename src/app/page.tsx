'use client';

import { useState, useEffect } from 'react';
import { useGame } from './context/GameContext';
import { navigateTo } from './utils/navigation';

const GAME_CHALLENGES = [
  {
    id: 'memory',
    title: '🧠 Gedächtnis-Herausforderung',
    description: 'Finde die passenden Antiallergikum-Zutaten',
    difficulty: 'Leicht',
    estimatedTime: '2-3 Min',
    digit: '7',
    position: 1,
    route: '/game/memory'
  },
  {
    id: 'puzzle',
    title: '🧪 Formel-Puzzle (2048)',
    description: 'Kombiniere Verbindungen zur perfekten Formel',
    difficulty: 'Mittel',
    estimatedTime: '3-5 Min',
    digit: '3',
    position: 2,
    route: '/game/puzzle'
  },
  {
    id: 'maze',
    title: '🌀 Labyrinth-Flucht',
    description: 'Navigiere durch das Allergie-Labor',
    difficulty: 'Mittel',
    estimatedTime: '2-4 Min',
    digit: '9',
    position: 3,
    route: '/game/maze'
  },
  {
    id: 'rhythm',
    title: '💓 Herzrhythmus-Stabilisierung',
    description: 'Halte Dominiks Herz durch perfektes Timing am Leben',
    difficulty: 'Schwer',
    estimatedTime: '1-2 Min',
    digit: '2',
    position: 4,
    route: '/game/rhythm'
  },
  {
    id: 'riddle',
    title: '🔍 Rätsel-Kammer',
    description: 'Löse die finalen Geheimnisse',
    difficulty: 'Schwer',
    estimatedTime: '3-5 Min',
    digit: '1',
    position: 5,
    route: '/game/riddle'
  },
  {
    id: 'final',
    title: '💉 Finale Code-Eingabe',
    description: 'Gib den vollständigen Code ein',
    difficulty: 'Final',
    estimatedTime: '1-2 Min',
    digit: '',
    position: 6,
    route: '/game/final'
  }
];

export default function Home() {
  const [showContent, setShowContent] = useState(false);
  const [pulseEffect, setPulseEffect] = useState(false);
  const [showOverview, setShowOverview] = useState(false);
  const { gameState, getProgress, isChallengeLocked, timeLeft, resetGame } = useGame();

  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 500);
    const pulseTimer = setInterval(() => {
      setPulseEffect(true);
      setTimeout(() => setPulseEffect(false), 1000);
    }, 3000);
    
    return () => {
      clearTimeout(timer);
      clearInterval(pulseTimer);
    };
  }, []);

  const progress = getProgress();
  // Only count actual code digits (exclude final challenge which has no digit)
  const codeDigitsCollected = Object.keys(gameState.codeDigits).length;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeColor = () => {
    if (timeLeft < 300) return 'text-red-400'; // Less than 5 minutes
    if (timeLeft < 600) return 'text-orange-400'; // Less than 10 minutes
    return 'text-green-400';
  };

  const getChallengeStatus = (challengeId: string) => {
    if (gameState.completedChallenges.includes(challengeId)) {
      return 'completed';
    } else if (isChallengeLocked(challengeId)) {
      return 'locked';
    } else {
      return 'available';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'border-green-500 bg-green-900/20';
      case 'available': return 'border-blue-500 bg-blue-900/20';
      case 'locked': return 'border-gray-500 bg-gray-900/20';
      default: return 'border-gray-500 bg-gray-900/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return '✅';
      case 'available': return '🎯';
      case 'locked': return '🔒';
      default: return '❓';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-black text-white relative overflow-hidden">
      {/* Animated background particles */}
      <div className="absolute inset-0 opacity-20">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-green-400 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      <div className={`relative z-10 flex flex-col items-center justify-center min-h-screen p-8 transition-all duration-1000 ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        
        {/* Skull/Warning Icon */}
        <div className={`mb-8 text-6xl transition-all duration-500 ${pulseEffect ? 'scale-110 text-red-400' : 'scale-100 text-red-500'}`}>
          🐍
        </div>

        {/* Main Title */}
        <h1 className="text-5xl md:text-7xl font-bold text-center mb-6 bg-gradient-to-r from-red-400 via-red-500 to-red-600 bg-clip-text text-transparent">
          GIFTORDEN
        </h1>
        
        <h2 className="text-2xl md:text-3xl font-semibold text-center mb-8 text-green-400">
          Das Antiallergikum-Rennen
        </h2>

        {/* Countdown Timer */}
        <div className="mb-8 bg-black/60 border-2 border-red-500 rounded-lg p-6 text-center">
          <div className="text-sm text-red-300 mb-2">⏰ ZEIT BIS ZUR VOLLSTÄNDIGEN VERGIFTUNG</div>
          <div className={`text-5xl font-mono font-bold ${getTimeColor()}`}>
            {formatTime(timeLeft)}
          </div>
          <div className="text-xs text-gray-400 mt-2">
            {timeLeft < 300 ? 'KRITISCH!' : timeLeft < 600 ? 'WARNUNG!' : 'STABIL'}
          </div>
        </div>

        {/* Story Box */}
        <div className="max-w-2xl mx-auto bg-black/50 backdrop-blur-sm border border-red-500/30 rounded-lg p-8 mb-8 shadow-2xl">
          <div className="text-center space-y-4">
            <p className="text-xl font-semibold text-red-300">
              🚨 NOTFALL PROTOKOLL AKTIVIERT 🚨
            </p>
            
            <p className="text-lg leading-relaxed">
              <span className="font-bold text-white">Dominik</span> hat ausversehen Nüsse gegessen! 
              Die Allergie breitet sich schnell aus und er hat nur noch <span className="font-bold text-red-400">15 Minuten</span> Zeit.
            </p>
            
            <p className="text-lg leading-relaxed">
              Um das lebensrettende Antiallergikum zu erhalten, muss er <span className="font-bold text-green-400">5 Herausforderungen</span> bestehen,
              um den <span className="font-bold text-yellow-400">5-stelligen Code</span> zu entschlüsseln.
            </p>

            <div className="bg-blue-900/30 border border-blue-500 rounded p-4 mt-6">
              <p className="text-sm text-blue-200">
                💡 <strong>Bonus-Zeit:</strong> Herausragende Leistungen in den Mini-Spielen können zusätzliche Zeit gewähren!
              </p>
              <p className="text-sm text-blue-200 mt-2">
                🎯 <strong>Ziel:</strong> Alle Herausforderungen abschließen bevor die Zeit abläuft
              </p>
            </div>
            
            <div className="bg-red-900/30 border border-red-500 rounded p-4 mt-4">
              <p className="text-sm text-red-200">
                ⚠️ <strong>Warnung:</strong> Nur wer ALLE Herausforderungen besteht, erhält das vollständige Antiallergikum!
              </p>
              <p className="text-sm text-red-200 mt-2">
                💀 <strong>Fehlschlag bedeutet:</strong> Die Allergie gewinnt...
              </p>
            </div>
          </div>
        </div>

        {/* Progress Display */}
        {progress.completed > 0 && (
          <div className="mb-6 bg-black/40 border border-green-500/30 rounded-lg p-4 max-w-md mx-auto">
            <h3 className="text-lg font-semibold text-green-400 mb-3 text-center">🎯 Überlebens-Fortschritt</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Herausforderungen:</span>
                <span className="text-green-400">{Math.min(progress.completed, 5)}/5 (ALLE ERFORDERLICH)</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Code-Ziffern:</span>
                <span className="text-yellow-400">{codeDigitsCollected}/5</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3 mt-3">
                <div 
                  className="h-full bg-gradient-to-r from-red-500 via-orange-500 to-green-500 rounded-full transition-all duration-500"
                  style={{ width: `${(Math.min(progress.completed, 5) / 5) * 100}%` }}
                ></div>
              </div>
              {codeDigitsCollected > 0 && (
                <div className="mt-3 p-2 bg-gray-800 rounded text-center">
                  <span className="text-xs text-gray-400">Gesammelte Code-Ziffern:</span>
                  <div className="text-lg font-mono mt-1">
                    {[1,2,3,4,5].map(pos => (
                      <span key={pos} className={gameState.codeDigits[pos] ? 'text-green-400' : 'text-gray-600'}>
                        {gameState.codeDigits[pos] || '?'}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {codeDigitsCollected === 5 && !gameState.completedChallenges.includes('final') && (
                <div className="mt-3 p-2 bg-yellow-900/30 border border-yellow-500 rounded text-center">
                  <span className="text-yellow-200 text-sm">
                    🔓 Alle Ziffern gesammelt! Das Finale ist freigeschaltet!
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 items-center mb-8">
          <button 
            onClick={() => navigateTo('/game/memory')}
            className="group relative px-8 py-4 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 rounded-lg font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-red-500/25"
          >
            <span className="relative z-10">
              {progress.completed === 0 ? '🐍 Überlebenskampf starten!' : '⚡ Kampf fortsetzen!'}
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-red-400 to-red-300 rounded-lg opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
          </button>
          
          <button 
            onClick={() => setShowOverview(!showOverview)}
            className="px-6 py-3 border border-blue-500 hover:border-blue-300 bg-blue-900/20 hover:bg-blue-800/30 rounded-lg font-medium transition-all duration-300"
          >
            🎮 Alle Herausforderungen anzeigen
          </button>

          {/* Bonus Ambulance Game */}
          {progress.completed > 0 && (
            <button 
              onClick={() => navigateTo('/game/ambulance')}
              className="px-6 py-3 border border-orange-500 hover:border-orange-300 bg-orange-900/20 hover:bg-orange-800/30 rounded-lg font-medium transition-all duration-300"
            >
              🚨 BONUS: Krankenwagen-Fahrt
            </button>
          )}

          {/* Reset Game Button */}
          <button 
            onClick={() => {
              if (confirm('Möchtest du das gesamte Spiel zurücksetzen? Aller Fortschritt geht verloren!')) {
                resetGame();
              }
            }}
            className="px-6 py-3 border border-gray-500 hover:border-gray-300 bg-gray-900/20 hover:bg-gray-800/30 rounded-lg font-medium transition-all duration-300 text-gray-300 hover:text-white"
          >
            🔄 Spiel zurücksetzen
          </button>
        </div>

        {/* Game Overview */}
        {showOverview && (
          <div className="w-full max-w-4xl mx-auto mb-8 bg-black/60 backdrop-blur-sm border border-blue-500/30 rounded-lg p-6">
            <h3 className="text-2xl font-bold text-center mb-6 text-blue-400">⚡ Überlebens-Herausforderungen</h3>
            <div className="mb-4 text-center text-yellow-300 font-semibold">
              ALLE 5 Herausforderungen müssen bestanden werden!
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {GAME_CHALLENGES.map((challenge) => {
                const status = getChallengeStatus(challenge.id);
                const isClickable = status !== 'locked';
                
                return (
                  <div
                    key={challenge.id}
                    className={`
                      border-2 rounded-lg p-4 transition-all duration-300
                      ${getStatusColor(status)}
                      ${isClickable ? 'hover:scale-105 cursor-pointer' : 'opacity-60 cursor-not-allowed'}
                    `}
                    onClick={() => isClickable && navigateTo(challenge.route)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold text-lg">{challenge.title}</h4>
                      <span className="text-2xl">{getStatusIcon(status)}</span>
                    </div>
                    
                    <p className="text-sm text-gray-300 mb-3">{challenge.description}</p>
                    
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span>Schwierigkeit:</span>
                        <span className="text-yellow-400">{challenge.difficulty}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Geschätzte Zeit:</span>
                        <span className="text-blue-400">{challenge.estimatedTime}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Code-Ziffer:</span>
                        <span className="text-green-400 font-mono">
                          {challenge.id === 'final' ? 'Finale' : (status === 'completed' ? challenge.digit : '?')}
                        </span>
                      </div>
                    </div>
                    
                    {status === 'locked' && (
                      <div className="mt-2 text-xs text-gray-400 italic">
                        Vorherige Herausforderung abschließen
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            <div className="mt-6 text-center">
              <button 
                onClick={() => setShowOverview(false)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition-colors"
              >
                Übersicht schließen
              </button>
            </div>
          </div>
        )}

        {/* Status Bar */}
        <div className="mt-12 mb-16 flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full animate-pulse ${gameState.completedChallenges.includes('final') ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span>Dominiks Zustand: {gameState.completedChallenges.includes('final') ? 'Gerettet!' : 'Vergiftet'}</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span>Herausforderungen: {Math.min(progress.completed, 5)}/5 (ALLE ERFORDERLICH)</span>
          </div>
        </div>

        {/* Footer */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-center text-gray-400 text-sm">
          <p>Ein Junggesellenabschied-Abenteuer für Dominik</p>
        </div>
      </div>
    </div>
  );
}
