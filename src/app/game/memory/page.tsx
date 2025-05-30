'use client';

import { useState, useEffect } from 'react';
import { useGame } from '../../context/GameContext';

interface Card {
  id: number;
  symbol: string;
  name: string;
  isFlipped: boolean;
  isMatched: boolean;
}

const ANTIDOTE_INGREDIENTS = [
  { symbol: '🌿', name: 'Heilkraut' },
  { symbol: '🍄', name: 'Zauberpilz' },
  { symbol: '💎', name: 'Kristall' },
  { symbol: '🧪', name: 'Elixier' },
  { symbol: '⚗️', name: 'Trank' },
  { symbol: '🔮', name: 'Magiekugel' }
];

export default function MemoryGame() {
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [moves, setMoves] = useState(0);
  const [gameWon, setGameWon] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [gameStarted, setGameStarted] = useState(false);
  
  const { gameState, completeChallenge } = useGame();
  const isAlreadyCompleted = gameState.completedChallenges.includes('memory');

  // Initialize cards
  useEffect(() => {
    const shuffledCards = [...ANTIDOTE_INGREDIENTS, ...ANTIDOTE_INGREDIENTS]
      .map((ingredient, index) => ({
        id: index,
        symbol: ingredient.symbol,
        name: ingredient.name,
        isFlipped: false,
        isMatched: false
      }))
      .sort(() => Math.random() - 0.5);
    
    setCards(shuffledCards);
  }, []);

  // Timer
  useEffect(() => {
    if (gameStarted && timeLeft > 0 && !gameWon) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      // Game over
      alert('Zeit abgelaufen! Das Gift wirkt stärker... 💀');
    }
  }, [timeLeft, gameStarted, gameWon]);

  // Check for matches
  useEffect(() => {
    if (flippedCards.length === 2) {
      const [first, second] = flippedCards;
      const firstCard = cards.find(card => card.id === first);
      const secondCard = cards.find(card => card.id === second);

      if (firstCard && secondCard && firstCard.symbol === secondCard.symbol) {
        // Match found!
        setCards(prev => prev.map(card => 
          card.id === first || card.id === second 
            ? { ...card, isMatched: true }
            : card
        ));
        setMatchedPairs(prev => prev + 1);
        setFlippedCards([]);
      } else {
        // No match, flip back after delay
        setTimeout(() => {
          setCards(prev => prev.map(card => 
            card.id === first || card.id === second 
              ? { ...card, isFlipped: false }
              : card
          ));
          setFlippedCards([]);
        }, 1000);
      }
      setMoves(prev => prev + 1);
    }
  }, [flippedCards, cards]);

  // Check win condition
  useEffect(() => {
    if (matchedPairs === ANTIDOTE_INGREDIENTS.length && !isAlreadyCompleted) {
      setGameWon(true);
      // Save progress to context
      completeChallenge('memory', '7', 1);
    }
  }, [matchedPairs, isAlreadyCompleted, completeChallenge]);

  const handleCardClick = (cardId: number) => {
    if (!gameStarted) setGameStarted(true);
    
    const card = cards.find(c => c.id === cardId);
    if (!card || card.isFlipped || card.isMatched || flippedCards.length >= 2) return;

    setCards(prev => prev.map(c => 
      c.id === cardId ? { ...c, isFlipped: true } : c
    ));
    setFlippedCards(prev => [...prev, cardId]);
  };

  const resetGame = () => {
    setGameStarted(false);
    setTimeLeft(60);
    setMoves(0);
    setMatchedPairs(0);
    setGameWon(false);
    setFlippedCards([]);
    
    const shuffledCards = [...ANTIDOTE_INGREDIENTS, ...ANTIDOTE_INGREDIENTS]
      .map((ingredient, index) => ({
        id: index,
        symbol: ingredient.symbol,
        name: ingredient.name,
        isFlipped: false,
        isMatched: false
      }))
      .sort(() => Math.random() - 0.5);
    
    setCards(shuffledCards);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black text-white p-4">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-8">
          <button 
            onClick={() => window.location.href = '/'}
            className="absolute top-4 left-4 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
          >
            ← Zurück
          </button>
          
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            🧠 Gedächtnis-Herausforderung
          </h1>
          <p className="text-lg text-gray-300">
            Finde die passenden Gegengift-Zutaten!
          </p>
          
          {isAlreadyCompleted && (
            <div className="mt-4 bg-green-900/30 border border-green-500 rounded-lg p-3 max-w-md mx-auto">
              <p className="text-green-400 text-sm">
                ✅ Bereits abgeschlossen! Ziffer 7 erhalten.
              </p>
            </div>
          )}
        </div>

        {/* Game Stats */}
        <div className="flex justify-center items-center gap-8 mb-8">
          <div className="bg-black/30 px-4 py-2 rounded-lg">
            <span className="text-red-400">⏰ Zeit: {timeLeft}s</span>
          </div>
          <div className="bg-black/30 px-4 py-2 rounded-lg">
            <span className="text-blue-400">🎯 Züge: {moves}</span>
          </div>
          <div className="bg-black/30 px-4 py-2 rounded-lg">
            <span className="text-green-400">✅ Paare: {matchedPairs}/{ANTIDOTE_INGREDIENTS.length}</span>
          </div>
        </div>

        {/* Game Board */}
        <div className="grid grid-cols-4 gap-4 max-w-2xl mx-auto mb-8">
          {cards.map((card) => (
            <div
              key={card.id}
              onClick={() => handleCardClick(card.id)}
              className={`
                aspect-square rounded-lg cursor-pointer transition-all duration-300 transform hover:scale-105
                ${card.isFlipped || card.isMatched 
                  ? 'bg-gradient-to-br from-green-500 to-green-600 shadow-lg shadow-green-500/25' 
                  : 'bg-gradient-to-br from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700'
                }
                ${card.isMatched ? 'ring-2 ring-yellow-400' : ''}
              `}
            >
              <div className="w-full h-full flex flex-col items-center justify-center">
                {card.isFlipped || card.isMatched ? (
                  <>
                    <div className="text-3xl mb-1">{card.symbol}</div>
                    <div className="text-xs text-center px-1">{card.name}</div>
                  </>
                ) : (
                  <div className="text-2xl">❓</div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Game Won Modal */}
        {gameWon && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="bg-gradient-to-br from-green-600 to-green-700 p-8 rounded-lg text-center max-w-md mx-4">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-2xl font-bold mb-4">Zutat gefunden!</h2>
              <p className="mb-4">
                Dominik hat erfolgreich alle Gegengift-Zutaten gesammelt!
              </p>
              <p className="text-lg font-semibold mb-6 text-yellow-200">
                Erste Ziffer des Codes: <span className="text-3xl">7</span>
              </p>
              <div className="flex gap-4 justify-center">
                <button 
                  onClick={() => window.location.href = '/game/puzzle'}
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

        {/* Instructions */}
        <div className="text-center text-gray-400 text-sm">
          <p>Klicke auf die Karten, um sie umzudrehen und finde die passenden Paare!</p>
          <p className="mt-2">Jedes Paar repräsentiert eine wichtige Zutat für das Gegengift.</p>
        </div>
      </div>
    </div>
  );
} 