'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface GameState {
  completedChallenges: string[];
  codeDigits: { [key: number]: string };
  currentChallenge: number;
  playerName: string;
}

interface GameContextType {
  gameState: GameState;
  completeChallenge: (challengeId: string, digit: string, position: number) => void;
  resetGame: () => void;
  isChallengeLocked: (challengeId: string) => boolean;
  getProgress: () => { completed: number; total: number };
}

const GameContext = createContext<GameContextType | undefined>(undefined);

const CHALLENGES = [
  'memory',
  'puzzle', 
  'maze',
  'riddle',
  'final'
];

const initialState: GameState = {
  completedChallenges: [],
  codeDigits: {},
  currentChallenge: 0,
  playerName: 'Dominik'
};

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [gameState, setGameState] = useState<GameState>(initialState);

  // Load state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem('dominik-antidote-game');
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        setGameState(parsed);
      } catch (error) {
        console.error('Error loading game state:', error);
      }
    }
  }, []);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('dominik-antidote-game', JSON.stringify(gameState));
  }, [gameState]);

  const completeChallenge = (challengeId: string, digit: string, position: number) => {
    setGameState(prev => {
      const newCompletedChallenges = prev.completedChallenges.includes(challengeId) 
        ? prev.completedChallenges 
        : [...prev.completedChallenges, challengeId];
      
      const newCodeDigits = { ...prev.codeDigits, [position]: digit };
      
      const challengeIndex = CHALLENGES.indexOf(challengeId);
      const newCurrentChallenge = Math.max(prev.currentChallenge, challengeIndex + 1);

      return {
        ...prev,
        completedChallenges: newCompletedChallenges,
        codeDigits: newCodeDigits,
        currentChallenge: newCurrentChallenge
      };
    });
  };

  const resetGame = () => {
    setGameState(initialState);
    localStorage.removeItem('dominik-antidote-game');
  };

  const isChallengeLocked = (challengeId: string): boolean => {
    const challengeIndex = CHALLENGES.indexOf(challengeId);
    if (challengeIndex === -1) return true;
    
    // First challenge is always unlocked
    if (challengeIndex === 0) return false;
    
    // Check if previous challenge is completed
    const previousChallenge = CHALLENGES[challengeIndex - 1];
    return !gameState.completedChallenges.includes(previousChallenge);
  };

  const getProgress = () => ({
    completed: gameState.completedChallenges.length,
    total: CHALLENGES.length
  });

  return (
    <GameContext.Provider value={{
      gameState,
      completeChallenge,
      resetGame,
      isChallengeLocked,
      getProgress
    }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
} 