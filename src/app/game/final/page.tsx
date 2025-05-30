'use client';

import { useState, useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import PlayerStatus from '../../components/PlayerStatus';
import { navigateTo } from '../../utils/navigation';

export default function FinalGame() {
  const [enteredCode, setEnteredCode] = useState(['', '', '', '', '']);
  const [gameWon, setGameWon] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [shakeEffect, setShakeEffect] = useState(false);
  const [lockState, setLockState] = useState<'locked' | 'unlocking' | 'unlocked'>('locked');
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success' | 'hint' | null; message: string }>({ type: null, message: '' });

  const { gameState, isChallengeLocked, timeLeft, completeChallenge } = useGame();
  const isLocked = isChallengeLocked('final');

  // The correct code based on collected digits
  const correctCode = [
    gameState.codeDigits[1] || '?', // Memory game
    gameState.codeDigits[2] || '?', // Puzzle game  
    gameState.codeDigits[3] || '?', // Maze game
    gameState.codeDigits[4] || '?', // Rhythm game
    gameState.codeDigits[5] || '?'  // Riddle game
  ];

  const collectedDigits = Object.keys(gameState.codeDigits).length;
  const allDigitsCollected = collectedDigits === 5;

  // No auto-fill - players must enter everything manually

  const handleDigitChange = (index: number, value: string) => {
    if (value.length <= 1 && /^[0-9]*$/.test(value)) {
      const newCode = [...enteredCode];
      newCode[index] = value;
      setEnteredCode(newCode);

      // Auto-focus next input
      if (value && index < 4) {
        const nextInput = document.getElementById(`digit-${index + 1}`);
        nextInput?.focus();
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !enteredCode[index] && index > 0) {
      const prevInput = document.getElementById(`digit-${index - 1}`);
      prevInput?.focus();
    }
    if (e.key === 'Enter') {
      handleSubmitCode();
    }
  };

  const handleSubmitCode = () => {
    if (enteredCode.some(digit => !digit)) {
      setFeedback({ type: 'error', message: '❌ Bitte alle Ziffern eingeben!' });
      setTimeout(() => setFeedback({ type: null, message: '' }), 3000);
      return;
    }

    setAttempts(prev => prev + 1);

    const isCorrect = enteredCode.every((digit, index) => digit === correctCode[index]);

    if (isCorrect) {
      // Success!
      setLockState('unlocking');
      setFeedback({ type: 'success', message: '🎉 Code korrekt! Schloss wird geöffnet...' });
      
      setTimeout(() => {
        setLockState('unlocked');
        setGameWon(true);
        completeChallenge('final', '', 0);
      }, 2000);
    } else {
      // Wrong code
      setShakeEffect(true);
      setFeedback({ type: 'error', message: `❌ Falscher Code! Versuch ${attempts + 1}` });
      
      setTimeout(() => {
        setShakeEffect(false);
        setFeedback({ type: null, message: '' });
      }, 3000);

      // Give hints after multiple attempts
      if (attempts >= 2) {
        setTimeout(() => {
          setFeedback({ 
            type: 'hint', 
            message: '💡 Hinweis: Überprüfe die Ziffern aus den vorherigen Herausforderungen!' 
          });
        }, 1500);
      }
    }
  };

  const resetCode = () => {
    setEnteredCode(['', '', '', '', '']);
    setAttempts(0);
    setShakeEffect(false);
    setLockState('locked');
    setGameWon(false);
    setFeedback({ type: null, message: '' });
  };

  const getLockIcon = () => {
    switch (lockState) {
      case 'locked': return '🔒';
      case 'unlocking': return '🔓';
      case 'unlocked': return '🔓';
      default: return '🔒';
    }
  };

  const getLockColor = () => {
    switch (lockState) {
      case 'locked': return 'text-red-500';
      case 'unlocking': return 'text-yellow-500';
      case 'unlocked': return 'text-green-500';
      default: return 'text-red-500';
    }
  };

  if (isLocked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-yellow-900 to-black text-white p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-3xl font-bold mb-4">Finale Herausforderung gesperrt</h1>
          <p className="text-lg text-gray-300 mb-6">
            Schließe alle Herausforderungen ab, um das Finale freizuschalten.
          </p>
          <div className="bg-blue-900/30 border border-blue-500 rounded-lg p-4 max-w-md mx-auto mb-6">
            <p className="text-blue-200 text-sm">
              Schließe alle Herausforderungen ab, um das Finale freizuschalten.
            </p>
          </div>
          <button 
            onClick={() => navigateTo('/')}
            className="px-6 py-3 bg-yellow-600 hover:bg-yellow-500 rounded-lg font-semibold transition-colors"
          >
            ← Zurück zum Hauptmenü
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-yellow-900 to-black text-white p-4">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-8">
          <button 
            onClick={() => navigateTo('/')}
            className="absolute top-4 right-4 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
          >
            ← Zurück
          </button>
          
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
            💉 Finale Code-Eingabe
          </h1>
          <p className="text-lg text-gray-300">
            Gib den 5-stelligen Code ein, um das Antiallergikum freizuschalten!
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* Left Side - Player Status */}
          <div className="lg:w-1/4 w-full">
            <PlayerStatus 
              currentGame="Code-Eingabe"
              className="sticky top-4"
            />
          </div>

          {/* Right Side - Game Content */}
          <div className="lg:w-3/4 w-full">
            
            {/* Lock Display */}
            <div className="mb-8 text-center">
              <div className={`text-8xl mb-4 transition-all duration-500 ${getLockColor()} ${shakeEffect ? 'animate-bounce' : ''} ${lockState === 'unlocking' ? 'animate-pulse' : ''}`}>
                {getLockIcon()}
              </div>
              <h2 className="text-2xl font-bold mb-2">
                {lockState === 'locked' && 'Antiallergikum-Tresor'}
                {lockState === 'unlocking' && 'Öffne Tresor...'}
                {lockState === 'unlocked' && 'Tresor geöffnet!'}
              </h2>
              <p className="text-gray-400">
                {lockState === 'locked' && 'Gib den 5-stelligen Code ein'}
                {lockState === 'unlocking' && 'Code wird überprüft...'}
                {lockState === 'unlocked' && 'Das Antiallergikum ist frei!'}
              </p>
            </div>

            {/* Code Input */}
            {!gameWon && (
              <div className="mb-8 bg-gray-800 rounded-lg p-6">
                <h3 className="text-xl font-bold text-center mb-6 text-yellow-400">
                  🔢 Code-Eingabe
                </h3>

                <div className="flex justify-center gap-4 mb-6">
                  {enteredCode.map((digit, index) => (
                    <input
                      key={index}
                      id={`digit-${index}`}
                      type="text"
                      value={digit}
                      onChange={(e) => handleDigitChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      className={`w-16 h-16 text-3xl font-mono font-bold text-center bg-gray-700 border-2 rounded-lg focus:outline-none transition-all duration-300 border-gray-600 focus:border-yellow-500 text-white ${shakeEffect ? 'animate-pulse border-red-500' : ''}`}
                      maxLength={1}
                      disabled={lockState !== 'locked'}
                    />
                  ))}
                </div>

                <div className="text-center mb-4">
                  <button
                    onClick={handleSubmitCode}
                    disabled={lockState !== 'locked' || enteredCode.some(digit => !digit)}
                    className="px-8 py-3 bg-yellow-600 hover:bg-yellow-500 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-bold text-lg transition-colors"
                  >
                    🔓 Code eingeben
                  </button>
                </div>

                <div className="text-center">
                  <button
                    onClick={resetCode}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg text-sm transition-colors"
                  >
                    🔄 Zurücksetzen
                  </button>
                </div>

                {/* Feedback */}
                {feedback.type && (
                  <div className={`mt-4 p-3 rounded-lg text-center ${
                    feedback.type === 'success' ? 'bg-green-900/50 border border-green-500 text-green-200' :
                    feedback.type === 'error' ? 'bg-red-900/50 border border-red-500 text-red-200' :
                    'bg-yellow-900/50 border border-yellow-500 text-yellow-200'
                  }`}>
                    {feedback.message}
                  </div>
                )}

                {/* Attempts Counter */}
                {attempts > 0 && (
                  <div className="mt-4 text-center text-gray-400 text-sm">
                    Versuche: {attempts}
                  </div>
                )}
              </div>
            )}

            {/* Hints */}
            {!allDigitsCollected && (
              <div className="mb-6 bg-blue-900/30 border border-blue-500 rounded-lg p-4">
                <h3 className="text-lg font-bold text-blue-400 mb-3">💡 Hinweise</h3>
                <div className="space-y-2 text-sm text-blue-200">
                  <p>• Denke an die Reihenfolge der absolvierten Herausforderungen</p>
                  <p>• Jede Herausforderung hat dir eine wichtige Ziffer gegeben</p>
                  <p>• Die erste Ziffer stammt aus der ersten Herausforderung, die zweite aus der zweiten, usw.</p>
                  <p>• Erinnerst du dich an die Belohnungen für deine Erfolge?</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Game Won Modal */}
        {gameWon && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="bg-gradient-to-br from-green-600 to-green-700 p-8 rounded-lg text-center max-w-md mx-4">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-3xl font-bold mb-4">GERETTET!</h2>
              <p className="text-lg mb-4">
                Dominik hat das Antiallergikum erfolgreich freigeschaltet!
              </p>
              <p className="mb-6">
                Der Code <span className="font-mono text-2xl text-yellow-200">{enteredCode.join('')}</span> war korrekt!
              </p>
              <div className="bg-green-900/50 border border-green-400 rounded-lg p-4 mb-6">
                <p className="text-green-200 text-sm">
                  🏆 <strong>Glückwunsch!</strong> Alle Herausforderungen gemeistert!
                </p>
                <p className="text-green-200 text-sm mt-2">
                  ⏰ Zeit übrig: <span className="font-mono">{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</span>
                </p>
              </div>
              <div className="flex gap-4 justify-center">
                <button 
                  onClick={() => navigateTo('/')}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-semibold transition-colors"
                >
                  🏠 Zum Hauptmenü
                </button>
                <button 
                  onClick={resetCode}
                  className="px-6 py-3 bg-gray-600 hover:bg-gray-500 rounded-lg font-semibold transition-colors"
                >
                  🔄 Nochmal versuchen
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="text-center text-gray-400 text-sm mt-8">
          <p>Gib den 5-stelligen Code ein, den du aus allen Herausforderungen gesammelt hast!</p>
          <p className="mt-2">Jede Ziffer stammt aus einer anderen Herausforderung in der richtigen Reihenfolge.</p>
        </div>
      </div>
    </div>
  );
} 