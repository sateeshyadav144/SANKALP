// ==============================================================================
// SANKALP — Premium Loading Screen & Brand Identity
// Recreated from approved design specifications
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { SankalpLogo } from './SankalpLogo';
import { AlertCircle, RotateCcw } from 'lucide-react';

interface LoadingScreenProps {
  onRetry?: () => void;
  message?: string;
  timeoutMs?: number;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  onRetry,
  message = 'Initializing your learning experience...',
  timeoutMs = 12000,
}) => {
  const [showTimeoutNotice, setShowTimeoutNotice] = useState<boolean>(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowTimeoutNotice(true);
    }, timeoutMs);

    return () => clearTimeout(timer);
  }, [timeoutMs]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-between items-center bg-[#020813] text-[#F4F7FF] select-none overflow-hidden p-6 selection:bg-transparent">
      {/* =================================================================== */}
      {/* 1. BACKGROUND AESTHETICS: Multi-layered Corner Waves & Glow         */}
      {/* =================================================================== */}

      {/* Center Ambient Radial Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gradient-to-tr from-[#00D9FF]/10 via-[#087BFF]/08 to-transparent rounded-full blur-[140px] pointer-events-none" />

      {/* Top-Left Organic Glowing Wave Ribbon */}
      <div className="absolute top-0 left-0 w-[380px] sm:w-[540px] h-[340px] sm:h-[480px] pointer-events-none overflow-hidden z-0">
        <svg
          viewBox="0 0 500 450"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full transform -translate-x-12 -translate-y-12 animate-pulse"
          style={{ animationDuration: '6s' }}
        >
          {/* Deep Blue Wave Layer */}
          <path
            d="M-50,0 C120,40 180,180 130,300 C80,420 280,420 400,320 L500,0 Z"
            fill="url(#topWaveDeep)"
            opacity="0.55"
          />
          {/* Front Cyan Crest Wave */}
          <path
            d="M-40,0 C90,60 140,160 100,260 C60,360 220,380 340,300 L500,0 Z"
            fill="url(#topWaveFront)"
            opacity="0.4"
          />
          {/* Glowing Crest Edge */}
          <path
            d="M-40,0 C90,60 140,160 100,260 C60,360 220,380 340,300"
            stroke="url(#waveEdgeGlow)"
            strokeWidth="2.5"
            strokeLinecap="round"
            opacity="0.85"
            fill="none"
          />
          <defs>
            <linearGradient id="topWaveDeep" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#085ED6" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#022866" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#020813" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="topWaveFront" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00D9FF" stopOpacity="0.6" />
              <stop offset="60%" stopColor="#087BFF" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#020813" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="waveEdgeGlow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00D9FF" />
              <stop offset="70%" stopColor="#0077FF" />
              <stop offset="100%" stopColor="#00D9FF" stopOpacity="0.2" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Bottom-Right Organic Glowing Wave Ribbon */}
      <div className="absolute bottom-0 right-0 w-[420px] sm:w-[620px] h-[360px] sm:h-[500px] pointer-events-none overflow-hidden z-0">
        <svg
          viewBox="0 0 600 500"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full transform translate-x-12 translate-y-12"
        >
          {/* Back Soft Wave */}
          <path
            d="M650,550 C460,520 380,380 430,260 C480,140 280,140 160,240 L100,550 Z"
            fill="url(#botWaveDeep)"
            opacity="0.5"
          />
          {/* Front Cyan Highlight Wave */}
          <path
            d="M650,550 C490,490 420,360 460,260 C500,160 340,160 220,240 L150,550 Z"
            fill="url(#botWaveFront)"
            opacity="0.35"
          />
          {/* Glowing Rim Line */}
          <path
            d="M650,550 C490,490 420,360 460,260 C500,160 340,160 220,240"
            stroke="url(#waveEdgeGlowBot)"
            strokeWidth="2.5"
            strokeLinecap="round"
            opacity="0.8"
            fill="none"
          />
          <defs>
            <linearGradient id="botWaveDeep" x1="100%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#085ED6" stopOpacity="0.75" />
              <stop offset="60%" stopColor="#021C4A" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#020813" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="botWaveFront" x1="100%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#00D9FF" stopOpacity="0.55" />
              <stop offset="50%" stopColor="#087BFF" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#020813" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="waveEdgeGlowBot" x1="100%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#00D9FF" />
              <stop offset="60%" stopColor="#0088FF" />
              <stop offset="100%" stopColor="#00D9FF" stopOpacity="0.1" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Header Spacer (Balances vertical centering) */}
      <div className="w-full h-8 z-10" />

      {/* =================================================================== */}
      {/* 2. CENTER SECTION: Logo, Brand Typography, & Loading Box           */}
      {/* =================================================================== */}
      <div className="flex flex-col items-center justify-center text-center z-10 max-w-xl w-full px-4 space-y-6 sm:space-y-7">
        {/* New SANKALP Emblem Logo */}
        <div className="relative group">
          <SankalpLogo size={130} glow={true} />
        </div>

        {/* Brand Typography */}
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-[0.25em] font-sans uppercase drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
            SANKALP
          </h1>

          {/* Subtitle with Flanking Minimal Cyan Accent Lines */}
          <div className="flex items-center justify-center gap-3 w-full max-w-md mx-auto">
            <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-[#00D9FF]/60 to-[#00D9FF]" />
            <p className="text-xs sm:text-sm text-[#D7E5F5] font-medium tracking-wider whitespace-nowrap">
              Smart Campus Ecosystem
            </p>
            <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent via-[#00D9FF]/60 to-[#00D9FF]" />
          </div>
        </div>

        {/* Loading Section Container */}
        <div className="w-full max-w-md">
          <div className="relative rounded-2xl bg-[#030F21]/80 backdrop-blur-md border border-[#00D9FF]/30 shadow-[0_0_25px_rgba(0,217,255,0.15)] p-4 sm:p-5 space-y-3.5">
            {/* Equalizer Pulse + Status Message */}
            <div className="flex items-center justify-center gap-3">
              {/* Animated 5-bar Soundwave Indicator */}
              <div className="flex items-center gap-[3px] h-4">
                <span
                  className="w-[3px] bg-[#00D9FF] rounded-full animate-pulse"
                  style={{ height: '45%', animationDuration: '0.8s', animationDelay: '0.1s' }}
                />
                <span
                  className="w-[3px] bg-[#00D9FF] rounded-full animate-pulse"
                  style={{ height: '90%', animationDuration: '0.9s', animationDelay: '0.3s' }}
                />
                <span
                  className="w-[3px] bg-[#00D9FF] rounded-full animate-pulse"
                  style={{ height: '60%', animationDuration: '0.7s', animationDelay: '0.2s' }}
                />
                <span
                  className="w-[3px] bg-[#00D9FF] rounded-full animate-pulse"
                  style={{ height: '100%', animationDuration: '1.0s', animationDelay: '0.4s' }}
                />
                <span
                  className="w-[3px] bg-[#00D9FF] rounded-full animate-pulse"
                  style={{ height: '50%', animationDuration: '0.8s', animationDelay: '0.25s' }}
                />
              </div>

              <span className="text-xs sm:text-sm text-[#E2EDF8] font-medium tracking-wide">
                {message}
              </span>
            </div>

            {/* Smooth Cyan Animated Progress Track */}
            <div className="relative w-full h-2 rounded-full bg-[#051833] overflow-hidden border border-[#17365C]/80">
              {/* Indeterminate Moving Glow Bar */}
              <div
                className="absolute top-0 bottom-0 rounded-full bg-gradient-to-r from-transparent via-[#00D9FF] to-[#087BFF] shadow-[0_0_12px_#00D9FF] animate-sankalp-progress"
                style={{
                  width: '50%',
                }}
              />
            </div>
          </div>

          {/* Timeout Retry Notice (if connection takes longer than expected) */}
          {showTimeoutNotice && (
            <div className="mt-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 flex items-center justify-between gap-3 animate-fade-in">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Taking longer than usual to connect.</span>
              </div>
              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 font-semibold flex items-center gap-1 transition text-[11px]"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Retry</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* =================================================================== */}
      {/* 3. FOOTER: LEARN • ORGANIZE • ACHIEVE                               */}
      {/* =================================================================== */}
      <footer className="z-10 py-4 text-center">
        <p className="text-[11px] sm:text-xs font-semibold tracking-[0.3em] text-[#7F9FC6] uppercase font-sans">
          <span>LEARN</span>
          <span className="text-[#00D9FF] mx-3">•</span>
          <span>ORGANIZE</span>
          <span className="text-[#00D9FF] mx-3">•</span>
          <span>ACHIEVE</span>
        </p>
      </footer>
    </div>
  );
};

