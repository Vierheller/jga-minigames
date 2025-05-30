'use client';

import { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';

export default function GameOverPage() {
  const [showContent, setShowContent] = useState(false);
  const [pulseEffect, setPulseEffect] = useState(false);
  const { gameState, resetGame, getProgress } = useGame();

  const progress = getProgress();
  const codeDigitsCollected = Object.keys(gameState.codeDigits).length;

  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 500);
    const pulseTimer = setInterval(() => {
      setPulseEffect(true);
      setTimeout(() => setPulseEffect(false), 1000);
    }, 2000);
    
    return () => {
      clearTimeout(timer);
      clearInterval(pulseTimer);
    };
  }, []);

  const getProgressMessage = () => {
    if (progress.completed === 0) {
      return "Dominik hat es nicht einmal geschafft, eine einzige Herausforderung zu bestehen...";
    } else if (progress.completed < 3) {
      return `Dominik hat nur ${progress.completed} von 5 Herausforderungen geschafft. Ein tapferer Versuch, aber nicht genug...`;
    } else if (progress.completed < 5) {
      return `Dominik war so nah dran! ${progress.completed} von 5 Herausforderungen gemeistert, aber die Zeit ist abgelaufen...`;
    } else if (gameState.completedChallenges.includes('final')) {
      return "Dominik hat alle Herausforderungen gemeistert und das Antiallergikum erhalten! Er ist gerettet!";
    } else {
      return "Dominik hat alle Herausforderungen gemeistert, aber konnte den finalen Code nicht rechtzeitig eingeben...";
    }
  };

  const getOutcomeIcon = () => {
    if (gameState.completedChallenges.includes('final')) {
      return '🎉';
    } else if (progress.completed >= 4) {
      return '😰';
    } else if (progress.completed >= 2) {
      return '😵';
    } else {
      return '💀';
    }
  };

  const getOutcomeTitle = () => {
    if (gameState.completedChallenges.includes('final')) {
      return 'GERETTET!';
    } else {
      return 'GAME OVER';
    }
  };

  const getOutcomeColor = () => {
    if (gameState.completedChallenges.includes('final')) {
      return 'from-green-400 to-green-600';
    } else {
      return 'from-red-400 to-red-600';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-red-900 to-gray-900 text-white relative overflow-hidden">
      {/* Animated background particles */}
      <div className="absolute inset-0 opacity-30">
        {[...Array(100)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-red-400 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${1 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      <div className={`relative z-10 flex flex-col items-center justify-center min-h-screen p-8 transition-all duration-1000 ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        
        {/* Outcome Icon */}
        <div className={`mb-8 text-8xl transition-all duration-500 ${pulseEffect ? 'scale-110' : 'scale-100'}`}>
          {getOutcomeIcon()}
        </div>

        {/* Main Title */}
        <h1 className={`text-6xl md:text-8xl font-bold text-center mb-6 bg-gradient-to-r ${getOutcomeColor()} bg-clip-text text-transparent`}>
          {getOutcomeTitle()}
        </h1>
        
        <h2 className="text-2xl md:text-3xl font-semibold text-center mb-8 text-gray-300">
          Die Zeit ist abgelaufen!
        </h2>

        {/* Time Display */}
        <div className="mb-8 bg-black/60 border-2 border-red-500 rounded-lg p-6 text-center">
          <div className="text-sm text-red-300 mb-2">⏰ ENDZEIT</div>
          <div className="text-5xl font-mono font-bold text-red-400">
            00:00
          </div>
          <div className="text-xs text-gray-400 mt-2">
            ZEIT ABGELAUFEN
          </div>
        </div>

        {/* Story/Outcome Box */}
        <div className="max-w-2xl mx-auto bg-black/50 backdrop-blur-sm border border-red-500/30 rounded-lg p-8 mb-8 shadow-2xl">
          <div className="text-center space-y-4">
            <p className="text-xl font-semibold text-red-300">
              🚨 ENDERGEBNIS 🚨
            </p>
            
            <p className="text-lg leading-relaxed">
              {getProgressMessage()}
            </p>
            
            {!gameState.completedChallenges.includes('final') && (
              <div className="bg-red-900/30 border border-red-500 rounded p-4 mt-6">
                <p className="text-sm text-red-200">
                  💀 <strong>Die Allergie hat gewonnen...</strong>
                </p>
                <p className="text-sm text-red-200 mt-2">
                  Dominik konnte das Antiallergikum nicht rechtzeitig erhalten.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Progress Summary */}
        <div className="mb-8 bg-black/40 border border-gray-500/30 rounded-lg p-6 max-w-md mx-auto">
          <h3 className="text-lg font-semibold text-gray-400 mb-3 text-center">📊 Endstand</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>Herausforderungen abgeschlossen:</span>
              <span className="text-yellow-400">{Math.min(progress.completed, 5)}/5</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Code-Ziffern gesammelt:</span>
              <span className="text-green-400">{codeDigitsCollected}/5</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Finale abgeschlossen:</span>
              <span className={gameState.completedChallenges.includes('final') ? 'text-green-400' : 'text-red-400'}>
                {gameState.completedChallenges.includes('final') ? 'Ja ✅' : 'Nein ❌'}
              </span>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-gray-700 rounded-full h-3 mt-3">
              <div 
                className="h-full bg-gradient-to-r from-red-500 via-orange-500 to-green-500 rounded-full transition-all duration-500"
                style={{ width: `${(Math.min(progress.completed, 5) / 5) * 100}%` }}
              ></div>
            </div>
            
            {/* Collected Code Display */}
            {codeDigitsCollected > 0 && (
              <div className="mt-4 p-3 bg-gray-800 rounded text-center">
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
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 items-center mb-8">
          <button 
            onClick={() => {
              resetGame();
              window.location.href = '/';
            }}
            className="group relative px-8 py-4 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 rounded-lg font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-red-500/25"
          >
            <span className="relative z-10">
              🔄 Neuer Versuch
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-red-400 to-red-300 rounded-lg opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
          </button>
          
          <button 
            onClick={() => window.location.href = '/'}
            className="px-6 py-3 border border-gray-500 hover:border-gray-300 bg-gray-900/20 hover:bg-gray-800/30 rounded-lg font-medium transition-all duration-300"
          >
            🏠 Zum Hauptmenü
          </button>
        </div>

        {/* Motivational Message */}
        {!gameState.completedChallenges.includes('final') && (
          <div className="max-w-lg mx-auto bg-blue-900/30 border border-blue-500 rounded-lg p-6 text-center">
            <h3 className="text-lg font-bold text-blue-400 mb-3">💪 Nicht aufgeben!</h3>
            <p className="text-sm text-blue-200">
              {progress.completed >= 3 
                ? "Du warst so nah dran! Beim nächsten Mal schaffst du es bestimmt!"
                : progress.completed >= 1
                ? "Du hast schon gezeigt, dass du es kannst. Versuche es nochmal!"
                : "Jeder Meister war einmal ein Anfänger. Probiere es erneut!"
              }
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-center text-gray-500 text-sm">
          <p>Ein Junggesellenabschied-Abenteuer für Dominik</p>
          <p className="mt-1">
            {gameState.completedChallenges.includes('final') 
              ? "Mission erfolgreich abgeschlossen! 🎉" 
              : "Versuche es nochmal - Dominik zählt auf dich! 💪"
            }
          </p>
        </div>
      </div>
    </div>
  );
} 