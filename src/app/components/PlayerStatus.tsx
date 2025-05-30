'use client';

import { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { navigateTo } from '../utils/navigation';

interface PlayerStatusProps {
  currentGame?: string;
  className?: string;
}

export default function PlayerStatus({ currentGame, className = '' }: PlayerStatusProps) {
  const [pulseEffect, setPulseEffect] = useState(false);
  const { gameState, getProgress, timeLeft } = useGame();

  // Pulse effect for critical time
  useEffect(() => {
    if (timeLeft < 300) { // Less than 5 minutes
      const pulseTimer = setInterval(() => {
        setPulseEffect(true);
        setTimeout(() => setPulseEffect(false), 500);
      }, 1000);
      return () => clearInterval(pulseTimer);
    }
  }, [timeLeft]);

  // Redirect to game over if time is up and final not completed
  useEffect(() => {
    if (timeLeft <= 0 && !gameState.completedChallenges.includes('final')) {
      // Avoid redirect loops
      if (!window.location.pathname.includes('/gameover')) {
        window.location.href = '/gameover';
      }
    }
  }, [timeLeft, gameState.completedChallenges]);

  const progress = getProgress();
  const codeDigitsCollected = Object.keys(gameState.codeDigits).length;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeColor = () => {
    if (timeLeft < 180) return 'text-red-400'; // Less than 3 minutes - CRITICAL
    if (timeLeft < 300) return 'text-orange-400'; // Less than 5 minutes - WARNING
    if (timeLeft < 600) return 'text-yellow-400'; // Less than 10 minutes - CAUTION
    return 'text-green-400'; // More than 10 minutes - STABLE
  };

  const getStatusText = () => {
    if (timeLeft < 180) return 'KRITISCH!';
    if (timeLeft < 300) return 'GEFÄHRLICH!';
    if (timeLeft < 600) return 'WARNUNG!';
    return 'STABIL';
  };

  const getVenomLevel = () => {
    const totalTime = 15 * 60;
    const elapsed = totalTime - timeLeft;
    return Math.min((elapsed / totalTime) * 100, 100);
  };

  const getHeartRate = () => {
    const baseRate = 70;
    const totalTime = 15 * 60; // 15 minutes total
    const elapsed = totalTime - timeLeft;
    
    // Calculate stress based on time elapsed (0 to 1)
    const timeProgress = Math.min(elapsed / totalTime, 1);
    
    // Additional stress multiplier for critical time periods
    const criticalStress = timeLeft < 180 ? 1.8 : timeLeft < 300 ? 1.4 : timeLeft < 600 ? 1.2 : 1;
    
    // Calculate final heart rate with a reasonable cap
    const stressRate = baseRate + (timeProgress * 80); // Base 70 + up to 80 = 150 max from time
    const finalRate = Math.round(stressRate * criticalStress); // Apply critical multiplier
    
    return Math.min(finalRate, 200); // Cap at 200 BPM
  };

  return (
    <div className={`bg-black/60 backdrop-blur-sm border-2 border-red-500/50 rounded-lg p-4 ${className}`}>
      {/* Header */}
      <div className="text-center mb-4">
        <h3 className="text-lg font-bold text-red-400 mb-1">🐍 PATIENT STATUS</h3>
        <div className="text-sm text-gray-300">Dominik - Nuss-Allergie</div>
      </div>

      {/* Critical Timer */}
      <div className={`text-center mb-4 p-3 rounded-lg border-2 ${timeLeft < 300 ? 'border-red-500 bg-red-900/30' : 'border-orange-500 bg-orange-900/20'}`}>
        <div className="text-xs text-gray-300 mb-1">⏰ ZEIT BIS ALLERGIE-TOD</div>
        <div className={`text-3xl font-mono font-bold transition-all duration-300 ${getTimeColor()} ${pulseEffect ? 'scale-110' : 'scale-100'}`}>
          {formatTime(timeLeft)}
        </div>
        <div className={`text-xs font-semibold mt-1 ${getTimeColor()}`}>
          {getStatusText()}
        </div>
      </div>

      {/* Venom Level */}
      <div className="mb-4">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-gray-300">Allergie-Level:</span>
          <span className="text-red-400">{Math.round(getVenomLevel())}%</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-green-500 via-yellow-500 via-orange-500 to-red-500 transition-all duration-1000"
            style={{ width: `${getVenomLevel()}%` }}
          ></div>
        </div>
        <div className="text-xs text-center mt-1 text-red-300">
          {getVenomLevel() > 80 ? 'LEBENSGEFAHR!' : getVenomLevel() > 60 ? 'Kritisch' : getVenomLevel() > 40 ? 'Erhöht' : 'Niedrig'}
        </div>
      </div>

      {/* Vital Signs */}
      <div className="mb-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-300">💓 Herzfrequenz:</span>
          <span className={timeLeft < 300 ? 'text-red-400' : 'text-yellow-400'}>{getHeartRate()} BPM</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-300">🧠 Bewusstsein:</span>
          <span className={timeLeft < 180 ? 'text-red-400' : timeLeft < 600 ? 'text-orange-400' : 'text-green-400'}>
            {timeLeft < 180 ? 'Benommen' : timeLeft < 600 ? 'Müde' : 'Klar'}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-300">✅ Abgeschlossene Missionen:</span>
          <span className="text-green-400">{Math.min(progress.completed, 5)}/5</span>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-4">
        <div className="flex justify-between text-xs mb-2">
          <span className="text-gray-300">Überlebens-Fortschritt:</span>
          <span className="text-green-400">{Math.min(progress.completed, 5)}/5</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-red-500 via-orange-500 to-green-500 transition-all duration-500"
            style={{ width: `${(Math.min(progress.completed, 5) / 5) * 100}%` }}
          ></div>
        </div>
        <div className="text-xs text-center mt-1">
          {Math.min(progress.completed, 5) === 5 ? (
            <span className="text-green-400 font-bold">✅ ALLE MISSIONEN ERFÜLLT!</span>
          ) : (
            <span className="text-orange-400">{5 - Math.min(progress.completed, 5)} Missionen verbleibend</span>
          )}
        </div>
      </div>

      {/* Code Progress */}
      <div className="mb-4">
        <div className="text-xs text-gray-300 mb-2 text-center">💉 Antiallergikum-Code:</div>
        <div className="text-center font-mono text-lg bg-gray-800 rounded p-2">
          {[1,2,3,4,5].map(pos => (
            <span key={pos} className={gameState.codeDigits[pos] ? 'text-green-400' : 'text-gray-600'}>
              {gameState.codeDigits[pos] || '?'}
            </span>
          ))}
        </div>
        <div className="text-xs text-center mt-1 text-gray-400">
          {codeDigitsCollected}/5 Ziffern gesammelt
        </div>
      </div>

      {/* Completed Missions */}
      <div className="mb-4">
        <div className="text-xs text-gray-300 mb-2 text-center">🎯 Missionen Status:</div>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-300">🧠 Gedächtnis:</span>
            <span className={gameState.completedChallenges.includes('memory') ? 'text-green-400' : 'text-gray-500'}>
              {gameState.completedChallenges.includes('memory') ? '✅ Abgeschlossen' : '⏳ Ausstehend'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-300">🧪 Formel:</span>
            <span className={gameState.completedChallenges.includes('puzzle') ? 'text-green-400' : 'text-gray-500'}>
              {gameState.completedChallenges.includes('puzzle') ? '✅ Abgeschlossen' : '⏳ Ausstehend'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-300">🌀 Labyrinth:</span>
            <span className={gameState.completedChallenges.includes('maze') ? 'text-green-400' : 'text-gray-500'}>
              {gameState.completedChallenges.includes('maze') ? '✅ Abgeschlossen' : '⏳ Ausstehend'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-300">💓 Herzrhythmus:</span>
            <span className={gameState.completedChallenges.includes('rhythm') ? 'text-green-400' : 'text-gray-500'}>
              {gameState.completedChallenges.includes('rhythm') ? '✅ Abgeschlossen' : '⏳ Ausstehend'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-300">🔍 Rätsel:</span>
            <span className={gameState.completedChallenges.includes('riddle') ? 'text-green-400' : 'text-gray-500'}>
              {gameState.completedChallenges.includes('riddle') ? '✅ Abgeschlossen' : '⏳ Ausstehend'}
            </span>
          </div>
        </div>
      </div>

      {/* Emergency Actions */}
      <div className="space-y-2">
        <button 
          onClick={() => navigateTo('/')}
          className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-500 rounded text-sm font-semibold transition-colors"
        >
          🏠 Hauptmenü
        </button>
        
        {timeLeft < 300 && (
          <div className="text-center p-2 bg-red-900/50 rounded border border-red-500">
            <div className="text-xs text-red-300 font-bold">⚠️ NOTFALL!</div>
            <div className="text-xs text-red-200">Sofortige Behandlung erforderlich!</div>
          </div>
        )}
      </div>

      {/* Medical Footer */}
      <div className="mt-4 pt-3 border-t border-gray-600 text-center">
        <div className="text-xs text-gray-400">
          🏥 Notfall-Protokoll aktiv
        </div>
        <div className="text-xs text-gray-500 mt-1">
          Patient: Dominik | Nuss-Allergie
        </div>
      </div>
    </div>
  );
} 