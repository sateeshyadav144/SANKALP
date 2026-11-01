// ==============================================================================
// SANKALP — Premium Loading Screen & Brand Identity Test Suite
// ==============================================================================

import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { SankalpLogo } from '../components/common/SankalpLogo';
import { LoadingScreen } from '../components/common/LoadingScreen';

describe('SANKALP Brand Identity & Loading Screen Suite', () => {
  // ---------------------------------------------------------------------------
  // 1. Reusable SankalpLogo Component Tests
  // ---------------------------------------------------------------------------
  describe('SankalpLogo Component', () => {
    it('renders the SVG emblem with open book, S symbol, and graduation cap', () => {
      const { container } = render(<SankalpLogo size="md" glow={true} />);
      const svg = container.querySelector('svg');
      expect(svg).not.toBeNull();
      expect(svg?.getAttribute('viewBox')).toBe('0 0 100 100');

      // Verify graduation cap and book paths exist
      const paths = container.querySelectorAll('path');
      expect(paths.length).toBeGreaterThanOrEqual(5);
    });

    it('renders properly across different size presets', () => {
      const { container: smContainer } = render(<SankalpLogo size="sm" />);
      const smWrapper = smContainer.querySelector('.relative.flex');
      expect(smWrapper?.getAttribute('style')).toContain('width: 32px');

      const { container: xlContainer } = render(<SankalpLogo size="xl" />);
      const xlWrapper = xlContainer.querySelector('.relative.flex');
      expect(xlWrapper?.getAttribute('style')).toContain('width: 88px');

      const { container: customContainer } = render(<SankalpLogo size={120} />);
      const customWrapper = customContainer.querySelector('.relative.flex');
      expect(customWrapper?.getAttribute('style')).toContain('width: 120px');
    });

    it('renders brand text when showText is true', () => {
      render(<SankalpLogo size="md" showText={true} textLayout="horizontal" />);
      expect(screen.getByText('SANKALP')).toBeDefined();
      expect(screen.getByText('Smart Campus Ecosystem')).toBeDefined();
    });
  });

  // ---------------------------------------------------------------------------
  // 2. LoadingScreen Component Tests
  // ---------------------------------------------------------------------------
  describe('LoadingScreen Component', () => {
    it('renders the approved brand title and ecosystem subtitle', () => {
      render(<LoadingScreen />);
      expect(screen.getByText('SANKALP')).toBeDefined();
      expect(screen.getByText('Smart Campus Ecosystem')).toBeDefined();
    });

    it('renders the approved initialization status message', () => {
      render(<LoadingScreen message="Initializing your learning experience..." />);
      expect(screen.getByText('Initializing your learning experience...')).toBeDefined();
    });

    it('renders the approved educational brand footer', () => {
      render(<LoadingScreen />);
      expect(screen.getByText('LEARN')).toBeDefined();
      expect(screen.getByText('ORGANIZE')).toBeDefined();
      expect(screen.getByText('ACHIEVE')).toBeDefined();
    });

    it('contains animated progress indicator and corner decorative waves', () => {
      const { container } = render(<LoadingScreen />);
      const progressBar = container.querySelector('.animate-sankalp-progress');
      expect(progressBar).not.toBeNull();

      // Top-left and bottom-right decorative SVGs exist
      const decorativeSvgs = container.querySelectorAll('svg');
      expect(decorativeSvgs.length).toBeGreaterThanOrEqual(3);
    });
  });
});

