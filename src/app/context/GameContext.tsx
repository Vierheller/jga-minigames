'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface GameState {
  completedChallenges: string[];
  codeDigits: { [key: number]: string };
  currentChallenge: number;
  playerName: string;
  timeLeft: number;
  gameStartTime: number;
}

interface GameContextType {
  gameState: GameState;
  completeChallenge: (challengeId: string, digit: string, position: number) => void;
  resetGame: () => void;
  isChallengeLocked: (challengeId: string) => boolean;
  getProgress: () => { completed: number; total: number };
  timeLeft: number;
  addTimeBonus: (seconds: number) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

const CHALLENGES = [
  'memory',
  'puzzle', 
  'maze',
  'rhythm',
  'riddle',
  'final'
];

const gameTime = 8;

const initialState: GameState = {
  completedChallenges: [],
  codeDigits: {},
  currentChallenge: 0,
  playerName: 'Dominik',
  timeLeft: 0,
  gameStartTime: 0
};

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [gameState, setGameState] = useState<GameState>(initialState);
  const [timeLeft, setTimeLeft] = useState(gameTime * 60); // 12 minutes

  // Load state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem('dominik-antidote-game');
    const savedTime = localStorage.getItem('dominik-venom-timer');
    
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        setGameState(parsed);
      } catch (error) {
        console.error('Error loading game state:', error);
      }
    }
    
    if (savedTime) {
      setTimeLeft(parseInt(savedTime));
    }
  }, []);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('dominik-antidote-game', JSON.stringify(gameState));
  }, [gameState]);

  // Global countdown timer
  useEffect(() => {
    if (timeLeft > 0 && getProgress().completed < CHALLENGES.length) {
      const timer = setTimeout(() => {
        const newTime = timeLeft - 1;
        setTimeLeft(newTime);
        localStorage.setItem('dominik-venom-timer', newTime.toString());
        
        // Check if time is up and final challenge not completed
        if (newTime <= 0 && !gameState.completedChallenges.includes('final')) {
          // Redirect to game over screen (avoid redirect loops)
          if (!window.location.pathname.includes('/gameover')) {
            window.location.href = '/gameover';
          }
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft, gameState.completedChallenges]);

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
    setTimeLeft(gameTime * 60); // Reset to 12 minutes
    localStorage.removeItem('dominik-antidote-game');
    localStorage.removeItem('dominik-venom-timer');
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

  const addTimeBonus = (seconds: number) => {
    setTimeLeft(prev => {
      const newTime = prev + seconds;
      localStorage.setItem('dominik-venom-timer', newTime.toString());
      return newTime;
    });
  };

  return (
    <GameContext.Provider value={{
      gameState,
      completeChallenge,
      resetGame,
      isChallengeLocked,
      getProgress,
      timeLeft,
      addTimeBonus
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