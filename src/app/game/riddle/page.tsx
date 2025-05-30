'use client';

import { useState, useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import PlayerStatus from '../../components/PlayerStatus';

interface Riddle {
  id: number;
  question: string;
  hint: string;
  answer: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

const RIDDLES: Riddle[] = [
  {
    id: 1,
    question: "Ich bin unsichtbar, aber überall. Ohne mich kannst du nicht atmen. Was bin ich?",
    hint: "Du atmest mich jeden Tag ein und aus.",
    answer: "luft",
    category: "Natur",
    difficulty: 'easy'
  },
  {
    id: 2,
    question: "Ich habe Städte, aber keine Häuser. Ich habe Berge, aber keine Bäume. Ich habe Wasser, aber keine Fische. Was bin ich?",
    hint: "Du findest mich in jedem Auto und an jeder Wand.",
    answer: "karte",
    category: "Objekte",
    difficulty: 'medium'
  },
  {
    id: 3,
    question: "Was wird nasser, je mehr es trocknet?",
    hint: "Du benutzt es nach dem Duschen.",
    answer: "handtuch",
    category: "Alltag",
    difficulty: 'medium'
  },
  {
    id: 4,
    question: "Je mehr du von mir nimmst, desto größer werde ich. Was bin ich?",
    hint: "Du machst mich, wenn du gehst.",
    answer: "loch",
    category: "Logik",
    difficulty: 'medium'
  },
  {
    id: 5,
    question: "Dominiks Lieblingszahl ist die Anzahl der Buchstaben in seinem Namen. Welche Zahl ist das?",
    hint: "Zähle die Buchstaben: D-O-M-I-N-I-K",
    answer: "7",
    category: "Persönlich",
    difficulty: 'easy'
  },
  {
    id: 6,
    question: "Ich bin am Anfang der Ewigkeit, am Ende der Zeit und des Raums, am Anfang jedes Endes und am Ende jedes Ortes. Was bin ich?",
    hint: "Schaue auf die ersten und letzten Buchstaben der Wörter.",
    answer: "e",
    category: "Wortspiel",
    difficulty: 'hard'
  },
  {
    id: 7,
    question: "In welchem Jahr wurde Dominik geboren, wenn er 2024 genau 30 Jahre alt wird?",
    hint: "Rechne rückwärts von 2024.",
    answer: "1994",
    category: "Persönlich",
    difficulty: 'easy'
  },
  {
    id: 8,
    question: "In World of Warcraft: Welche Hauptstadt der Allianz wurde von Deathwing zerstört und liegt in Trümmern?",
    hint: "Diese Stadt war das Zentrum des menschlichen Königreichs und liegt in den Östlichen Königreichen.",
    answer: "sturmwind",
    category: "Gaming",
    difficulty: 'medium'
  },
  {
    id: 9,
    question: "Ich spreche ohne Mund und höre ohne Ohren. Ich habe keinen Körper, aber ich werde durch den Wind zum Leben erweckt. Was bin ich?",
    hint: "Du hörst mich in den Bergen und leeren Räumen.",
    answer: "echo",
    category: "Natur",
    difficulty: 'hard'
  }
];

export default function RiddleGame() {
  const [userAnswers, setUserAnswers] = useState<{ [key: number]: string }>({});
  const [solvedRiddles, setSolvedRiddles] = useState<number[]>([]);
  const [showHints, setShowHints] = useState<{ [key: number]: boolean }>({});
  const [gameWon, setGameWon] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [wrongAnswers, setWrongAnswers] = useState(0);
  const [feedback, setFeedback] = useState<{ [key: number]: { type: 'success' | 'error' | null; message: string } }>({});

  const { gameState, completeChallenge, isChallengeLocked } = useGame();
  const isAlreadyCompleted = gameState.completedChallenges.includes('riddle');
  const isLocked = isChallengeLocked('riddle');

  const totalRiddles = RIDDLES.length;
  const riddlesNeeded = 7; // Need to solve 7 out of 9 riddles

  // Check win condition
  useEffect(() => {
    console.log('Riddle win check:', { 
      solvedRiddlesLength: solvedRiddles.length, 
      riddlesNeeded, 
      isAlreadyCompleted, 
      gameWon,
      solvedRiddles 
    });
    
    if (solvedRiddles.length >= riddlesNeeded && !isAlreadyCompleted && !gameWon) {
      console.log('Riddle game won! Calling completeChallenge...');
      setGameWon(true);
      completeChallenge('riddle', '1', 5); // 5th position gets digit "1"
    }
  }, [solvedRiddles.length, riddlesNeeded, isAlreadyCompleted, gameWon, completeChallenge]);

  const startGame = () => {
    setGameStarted(true);
  };

  const resetGame = () => {
    setUserAnswers({});
    setSolvedRiddles([]);
    setShowHints({});
    setGameWon(false);
    setGameStarted(false);
    setWrongAnswers(0);
    setFeedback({});
  };

  const normalizeAnswer = (answer: string): string => {
    return answer.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
  };

  const handleSubmitAnswer = (riddleId: number) => {
    if (isAlreadyCompleted) return; // Prevent answering if completed
    
    const userAnswer = userAnswers[riddleId];
    if (!userAnswer?.trim()) return;

    const riddle = RIDDLES.find(r => r.id === riddleId);
    if (!riddle) return;

    const normalizedUserAnswer = normalizeAnswer(userAnswer);
    const normalizedCorrectAnswer = normalizeAnswer(riddle.answer);

    if (normalizedUserAnswer === normalizedCorrectAnswer) {
      // Correct answer
      setSolvedRiddles(prev => [...prev, riddleId]);
      setFeedback(prev => ({ ...prev, [riddleId]: { type: 'success', message: '🎉 Richtig! Gut gemacht!' } }));
      setUserAnswers(prev => ({ ...prev, [riddleId]: '' }));
      setTimeout(() => setFeedback(prev => ({ ...prev, [riddleId]: { type: null, message: '' } })), 3000);
    } else {
      // Wrong answer
      setWrongAnswers(prev => prev + 1);
      setFeedback(prev => ({ ...prev, [riddleId]: { type: 'error', message: '❌ Falsch! Versuche es nochmal.' } }));
      setTimeout(() => setFeedback(prev => ({ ...prev, [riddleId]: { type: null, message: '' } })), 3000);
    }
  };

  const handleShowHint = (riddleId: number) => {
    setShowHints(prev => ({ ...prev, [riddleId]: true }));
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-400';
      case 'medium': return 'text-yellow-400';
      case 'hard': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'Leicht';
      case 'medium': return 'Mittel';
      case 'hard': return 'Schwer';
      default: return 'Unbekannt';
    }
  };

  if (isLocked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black text-white p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-3xl font-bold mb-4">Rätsel-Kammer gesperrt</h1>
          <p className="text-lg text-gray-300 mb-6">
            Schließe zuerst die Herzrhythmus-Stabilisierung ab!
          </p>
          <button 
            onClick={() => window.location.href = '/'}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-500 rounded-lg font-semibold transition-colors"
          >
            ← Zurück zum Hauptmenü
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black text-white p-4">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-8">
          <button 
            onClick={() => window.location.href = '/'}
            className="absolute top-4 right-4 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
          >
            ← Zurück
          </button>
          
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            🔍 Rätsel-Kammer
          </h1>
          <p className="text-lg text-gray-300">
            Löse {riddlesNeeded} von {totalRiddles} Rätseln, um die finale Code-Ziffer zu erhalten!
          </p>
          
          {isAlreadyCompleted && (
            <div className="mt-4 bg-green-900/30 border border-green-500 rounded-lg p-3 max-w-md mx-auto">
              <p className="text-green-400 text-sm">
                ✅ Bereits abgeschlossen! Ziffer 1 erhalten.
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* Left Side - Player Status */}
          <div className="lg:w-1/4 w-full">
            <PlayerStatus 
              currentGame="Rätsel lösen"
              className="sticky top-4"
            />
          </div>

          {/* Right Side - Game Content */}
          <div className="lg:w-3/4 w-full">
            
            {/* Game Progress */}
            <div className="mb-6 bg-black/40 border border-purple-500/30 rounded-lg p-4">
              <h3 className="text-lg font-bold text-center mb-4 text-purple-400">🎯 Rätsel-Fortschritt</h3>
              
              {/* Progress */}
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span>Gelöste Rätsel:</span>
                  <span className="text-green-400">{solvedRiddles.length}/{riddlesNeeded} (benötigt)</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-purple-500 to-green-500 transition-all duration-500"
                    style={{ width: `${(solvedRiddles.length / riddlesNeeded) * 100}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-400 mt-1 text-center">
                  Noch {Math.max(0, riddlesNeeded - solvedRiddles.length)} Rätsel zu lösen
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 text-center text-sm">
                <div>
                  <div className="text-green-400 font-bold">{solvedRiddles.length}</div>
                  <div className="text-gray-400">Gelöst</div>
                </div>
                <div>
                  <div className="text-red-400 font-bold">{wrongAnswers}</div>
                  <div className="text-gray-400">Falsch</div>
                </div>
                <div>
                  <div className="text-yellow-400 font-bold">{totalRiddles - solvedRiddles.length}</div>
                  <div className="text-gray-400">Übrig</div>
                </div>
              </div>
            </div>

            {/* All Riddles */}
            <div className="space-y-6 mb-6">
              {RIDDLES.map((riddle) => {
                const isRiddleSolved = solvedRiddles.includes(riddle.id);
                const riddleFeedback = feedback[riddle.id];
                
                return (
                  <div 
                    key={riddle.id} 
                    className={`bg-gray-800 rounded-lg p-6 border-2 transition-all duration-300 ${
                      isRiddleSolved 
                        ? 'border-green-500 bg-green-900/20' 
                        : 'border-gray-600 hover:border-purple-500'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-bold text-purple-400">
                        Rätsel {riddle.id} {isRiddleSolved && '✅'}
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-400">{riddle.category}</span>
                        <span className={`text-sm font-semibold ${getDifficultyColor(riddle.difficulty)}`}>
                          {getDifficultyText(riddle.difficulty)}
                        </span>
                      </div>
                    </div>

                    <div className="bg-gray-700 rounded-lg p-4 mb-4">
                      <p className="text-lg leading-relaxed">{riddle.question}</p>
                    </div>

                    {/* Hint */}
                    {showHints[riddle.id] && (
                      <div className="bg-yellow-900/30 border border-yellow-500 rounded-lg p-3 mb-4">
                        <p className="text-yellow-200 text-sm">
                          💡 <strong>Hinweis:</strong> {riddle.hint}
                        </p>
                      </div>
                    )}

                    {/* Answer Input */}
                    {!isRiddleSolved && (
                      <div className="mb-4">
                        <label className="block text-sm font-medium mb-2">Deine Antwort:</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={userAnswers[riddle.id] || ''}
                            onChange={(e) => setUserAnswers(prev => ({ ...prev, [riddle.id]: e.target.value }))}
                            onKeyPress={(e) => e.key === 'Enter' && handleSubmitAnswer(riddle.id)}
                            className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:border-purple-500 focus:outline-none"
                            placeholder="Gib deine Antwort ein..."
                          />
                          <button
                            onClick={() => handleSubmitAnswer(riddle.id)}
                            disabled={!userAnswers[riddle.id]?.trim()}
                            className="px-6 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors"
                          >
                            Antworten
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    {!isRiddleSolved && (
                      <div className="flex gap-2 justify-center mb-4">
                        <button
                          onClick={() => handleShowHint(riddle.id)}
                          disabled={showHints[riddle.id]}
                          className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg text-sm transition-colors"
                        >
                          💡 Hinweis zeigen
                        </button>
                      </div>
                    )}

                    {/* Feedback */}
                    {riddleFeedback?.type && (
                      <div className={`p-3 rounded-lg text-center ${
                        riddleFeedback.type === 'success' ? 'bg-green-900/50 border border-green-500 text-green-200' :
                        'bg-red-900/50 border border-red-500 text-red-200'
                      }`}>
                        {riddleFeedback.message}
                      </div>
                    )}

                    {/* Solved indicator */}
                    {isRiddleSolved && (
                      <div className="bg-green-900/50 border border-green-500 rounded-lg p-3 text-center">
                        <p className="text-green-200">✅ Rätsel gelöst!</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Reset Button */}
            <div className="text-center">
              <button 
                onClick={resetGame}
                className="px-6 py-3 bg-gray-600 hover:bg-gray-500 rounded-lg font-semibold transition-colors"
              >
                🔄 Spiel zurücksetzen
              </button>
            </div>
          </div>
        </div>

        {/* Game Won Modal */}
        {gameWon && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="bg-gradient-to-br from-purple-600 to-purple-700 p-8 rounded-lg text-center max-w-md mx-4">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-2xl font-bold mb-4">Rätsel-Meister!</h2>
              <p className="mb-4">
                Dominik hat {solvedRiddles.length} von {totalRiddles} Rätseln gelöst und die Kammer gemeistert!
              </p>
              <p className="text-lg font-semibold mb-6 text-yellow-200">
                Fünfte Ziffer des Codes: <span className="text-3xl">1</span>
              </p>
              <div className="flex gap-4 justify-center">
                <button 
                  onClick={() => window.location.href = '/game/final'}
                  className="px-6 py-3 bg-green-600 hover:bg-green-500 rounded-lg font-semibold transition-colors"
                >
                  Finale Herausforderung →
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

        {/* Instructions */}
        <div className="text-center text-gray-400 text-sm mt-8">
          <p>Alle Rätsel sind sichtbar - löse sie in beliebiger Reihenfolge!</p>
          <p className="mt-2">Nutze die Hinweise und denke logisch. Du brauchst {riddlesNeeded} richtige Antworten!</p>
        </div>
      </div>
    </div>
  );
} 