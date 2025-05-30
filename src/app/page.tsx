'use client';

import { useState, useEffect } from 'react';

export default function Home() {
  const [showContent, setShowContent] = useState(false);
  const [pulseEffect, setPulseEffect] = useState(false);

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
          ☠️
        </div>

        {/* Main Title */}
        <h1 className="text-5xl md:text-7xl font-bold text-center mb-6 bg-gradient-to-r from-red-400 via-red-500 to-red-600 bg-clip-text text-transparent">
          GIFTCODE
        </h1>
        
        <h2 className="text-2xl md:text-3xl font-semibold text-center mb-8 text-green-400">
          Das Gegengift-Rätsel
        </h2>

        {/* Story Box */}
        <div className="max-w-2xl mx-auto bg-black/50 backdrop-blur-sm border border-red-500/30 rounded-lg p-8 mb-8 shadow-2xl">
          <div className="text-center space-y-4">
            <p className="text-xl font-semibold text-red-300">
              🚨 NOTFALL PROTOKOLL AKTIVIERT 🚨
            </p>
            
            <p className="text-lg leading-relaxed">
              <span className="font-bold text-white">Dominik</span> wurde vergiftet! 
              Das Gift wirkt schnell und nur ein spezielles Gegengift kann ihn retten.
            </p>
            
            <p className="text-lg leading-relaxed">
              Um das Gegengift zu erhalten, muss er eine Reihe von Rätseln lösen 
              und Mini-Spiele meistern, um einen <span className="font-bold text-green-400">6-stelligen Giftcode</span> zu entschlüsseln.
            </p>
            
            <div className="bg-red-900/30 border border-red-500 rounded p-4 mt-6">
              <p className="text-sm text-red-200">
                ⏰ <strong>Zeit läuft ab:</strong> Etwa 10-15 Minuten bis zur vollständigen Vergiftung
              </p>
              <p className="text-sm text-red-200 mt-2">
                💀 <strong>Warnung:</strong> Fehlschläge können zu zusätzlichen Strafen führen
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <button className="group relative px-8 py-4 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 rounded-lg font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-green-500/25">
            <span className="relative z-10">🧪 Gegengift-Mission starten</span>
            <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-green-300 rounded-lg opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
          </button>
          
          <button className="px-6 py-3 border border-gray-500 hover:border-gray-300 rounded-lg font-medium transition-all duration-300 hover:bg-white/10">
            📋 Spielregeln ansehen
          </button>
        </div>

        {/* Status Bar */}
        <div className="mt-12 mb-16 flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <span>Dominiks Zustand: Vergiftet</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span>Gegengift-Code: 0/6 Ziffern</span>
          </div>
        </div>

        {/* Footer */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-center text-gray-400 text-sm">
          <p>Ein Junggesellenabschied-Abenteuer für Dominik</p>
          <p className="mt-1">Viel Glück, Bräutigam! 🎩</p>
        </div>
      </div>
    </div>
  );
}
