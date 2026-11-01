// ==============================================================================
// SANKALP — Text-to-Speech Reader & Audio Lab Test Suite
// ==============================================================================

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  OFFICIAL_INDIAN_LANGUAGES,
  detectVoiceGender,
  getVoicesForLanguage,
  getCloudVoiceForLanguage,
  evaluateLanguageVoiceStatus,
  categorizeLanguageAvailability,
  splitTextIntoUtteranceChunks,
  calculateSpeechDurationSeconds,
  formatDuration,
  WINDOWS_SPEECH_INSTRUCTIONS,
} from '../services/ttsService';
import { localStore } from '../services/storageService';
import { apiService } from '../services/apiService';
import { SavedSpeechNote } from '../types';

describe('Text-to-Speech Reader & Multilingual Engine Suite', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  // ---------------------------------------------------------------------------
  // 1. Official Indian Languages Configuration
  // ---------------------------------------------------------------------------
  describe('Indian Languages Configuration', () => {
    it('defines all 23 official Indian languages accurately', () => {
      expect(OFFICIAL_INDIAN_LANGUAGES.length).toBe(23);

      const codes = OFFICIAL_INDIAN_LANGUAGES.map((l) => l.code);
      expect(codes).toContain('hi-IN'); // Hindi
      expect(codes).toContain('en-IN'); // English (Indian)
      expect(codes).toContain('bn-IN'); // Bengali
      expect(codes).toContain('ta-IN'); // Tamil
      expect(codes).toContain('te-IN'); // Telugu
      expect(codes).toContain('mr-IN'); // Marathi
      expect(codes).toContain('gu-IN'); // Gujarati
      expect(codes).toContain('kn-IN'); // Kannada
      expect(codes).toContain('ml-IN'); // Malayalam
      expect(codes).toContain('pa-IN'); // Punjabi
      expect(codes).toContain('ur-IN'); // Urdu
      expect(codes).toContain('as-IN'); // Assamese
      expect(codes).toContain('or-IN'); // Odia
      expect(codes).toContain('sa-IN'); // Sanskrit
      expect(codes).toContain('ne-NP'); // Nepali
      expect(codes).toContain('kok-IN'); // Konkani
      expect(codes).toContain('ks-IN'); // Kashmiri
      expect(codes).toContain('sd-IN'); // Sindhi
      expect(codes).toContain('mni-IN'); // Manipuri
      expect(codes).toContain('brx-IN'); // Bodo
      expect(codes).toContain('doi-IN'); // Dogri
      expect(codes).toContain('mai-IN'); // Maithili
      expect(codes).toContain('sat-IN'); // Santali
    });

    it('each language has a sample greeting and script defined', () => {
      for (const lang of OFFICIAL_INDIAN_LANGUAGES) {
        expect(lang.sampleGreeting).toBeDefined();
        expect(lang.sampleGreeting.length).toBeGreaterThan(5);
        expect(lang.script).toBeDefined();
        expect(lang.nativeName).toBeDefined();
      }
    });
  });

  // ---------------------------------------------------------------------------
  // 2. Voice Categorization & Gender Detection
  // ---------------------------------------------------------------------------
  describe('Voice Categorization & Gender Metadata', () => {
    it('detects verified male and female voices from provider metadata', () => {
      const mockMale = {
        name: 'Microsoft Madhur Online (Natural) - Hindi (India)',
        lang: 'hi-IN',
        voiceURI: 'hi-IN-madhur',
      } as SpeechSynthesisVoice;

      const mockFemale = {
        name: 'Microsoft Swara Online (Natural) - Hindi (India)',
        lang: 'hi-IN',
        voiceURI: 'hi-IN-swara',
      } as SpeechSynthesisVoice;

      const mockUnspecified = {
        name: 'Generic Speech Synthesizer Voice 1',
        lang: 'hi-IN',
        voiceURI: 'hi-IN-generic',
      } as SpeechSynthesisVoice;

      expect(detectVoiceGender(mockMale)).toBe('male');
      expect(detectVoiceGender(mockFemale)).toBe('female');
      expect(detectVoiceGender(mockUnspecified)).toBe('unspecified');
    });

    it('matches available system voices to the correct Indian language', () => {
      const mockVoices = [
        { name: 'Microsoft Swara', lang: 'hi-IN', voiceURI: 'v1', localService: true },
        { name: 'Microsoft Madhur', lang: 'hi-IN', voiceURI: 'v2', localService: true },
        { name: 'Google हिन्दी', lang: 'hi', voiceURI: 'v3', localService: false },
        { name: 'Microsoft Neerja', lang: 'en-IN', voiceURI: 'v4', localService: true },
        { name: 'Microsoft David', lang: 'en-US', voiceURI: 'v5', localService: true },
      ] as SpeechSynthesisVoice[];

      const hindiLang = OFFICIAL_INDIAN_LANGUAGES.find((l) => l.code === 'hi-IN')!;
      const hindiMatches = getVoicesForLanguage(mockVoices, hindiLang);

      expect(hindiMatches.length).toBe(3);
      expect(hindiMatches.some((v) => v.name === 'Microsoft Swara')).toBe(true);
      expect(hindiMatches.some((v) => v.name === 'Microsoft Madhur')).toBe(true);
      expect(hindiMatches.some((v) => v.name === 'Google हिन्दी')).toBe(true);

      const indianEnglishLang = OFFICIAL_INDIAN_LANGUAGES.find((l) => l.code === 'en-IN')!;
      const enInMatches = getVoicesForLanguage(mockVoices, indianEnglishLang);
      expect(enInMatches.length).toBe(1);
      expect(enInMatches[0].name).toBe('Microsoft Neerja');
    });

    it('honestly distinguishes installed versus uninstalled Indian languages', () => {
      const mockVoices = [
        { name: 'Microsoft Swara', lang: 'hi-IN', voiceURI: 'v1', localService: true },
        { name: 'Microsoft Neerja', lang: 'en-IN', voiceURI: 'v2', localService: true },
      ] as SpeechSynthesisVoice[];

      const summary = categorizeLanguageAvailability(mockVoices);

      expect(summary.supported.some((s) => s.language.code === 'hi-IN')).toBe(true);
      expect(summary.supported.some((s) => s.language.code === 'en-IN')).toBe(true);
      expect(summary.unsupported.some((l) => l.code === 'ta-IN')).toBe(true);
      expect(summary.unsupported.some((l) => l.code === 'te-IN')).toBe(true);
      expect(summary.unsupported.some((l) => l.code === 'bn-IN')).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // 3. Multilingual Cloud TTS & Voice Status Evaluation
  // ---------------------------------------------------------------------------
  describe('Multilingual Cloud TTS & Status Evaluation', () => {
    it('evaluates language as installed_local when local voice exists', () => {
      const mockVoices = [
        { name: 'Microsoft Swara', lang: 'hi-IN', voiceURI: 'v1', localService: true },
      ] as SpeechSynthesisVoice[];

      const hindi = OFFICIAL_INDIAN_LANGUAGES.find((l) => l.code === 'hi-IN')!;
      const evaluation = evaluateLanguageVoiceStatus(hindi, mockVoices);

      expect(evaluation.status).toBe('installed_local');
      expect(evaluation.canSynthesize).toBe(true);
      expect(evaluation.localVoices.length).toBe(1);
    });

    it('evaluates language as available_cloud when local is absent but cloud TTS is supported', () => {
      // Empty local system voices (e.g. freshly installed Windows without regional packs)
      const mockVoices: SpeechSynthesisVoice[] = [];

      const tamil = OFFICIAL_INDIAN_LANGUAGES.find((l) => l.code === 'ta-IN')!;
      const evaluation = evaluateLanguageVoiceStatus(tamil, mockVoices);

      expect(evaluation.status).toBe('available_cloud');
      expect(evaluation.canSynthesize).toBe(true);
      expect(evaluation.cloudVoice).not.toBeNull();
      expect(evaluation.cloudVoice?.gender).toBe('female');
      expect(evaluation.cloudVoice?.provider).toBe('cloud');
    });

    it('evaluates low-resource/scheduled language as unsupported_by_provider and suggests alternatives', () => {
      const mockVoices: SpeechSynthesisVoice[] = [];

      const santali = OFFICIAL_INDIAN_LANGUAGES.find((l) => l.code === 'sat-IN')!;
      const evaluation = evaluateLanguageVoiceStatus(santali, mockVoices);

      expect(evaluation.status).toBe('unsupported_by_provider');
      expect(evaluation.canSynthesize).toBe(false);
      expect(santali.alternativeLang).toBe('hi-IN');
    });

    it('creates verified cloud voice metadata for supported cloud languages', () => {
      const bengali = OFFICIAL_INDIAN_LANGUAGES.find((l) => l.code === 'bn-IN')!;
      const cloudVoice = getCloudVoiceForLanguage(bengali);

      expect(cloudVoice).not.toBeNull();
      expect(cloudVoice?.voiceURI).toBe('cloud_bn-IN_standard');
      expect(cloudVoice?.isLocal).toBe(false);
      expect(cloudVoice?.gender).toBe('female');

      const sanskrit = OFFICIAL_INDIAN_LANGUAGES.find((l) => l.code === 'sa-IN')!;
      expect(getCloudVoiceForLanguage(sanskrit)).toBeNull();
    });

    it('provides genuine Windows speech settings instructions', () => {
      expect(WINDOWS_SPEECH_INSTRUCTIONS.settingsUri).toBe('ms-settings:speech');
      expect(WINDOWS_SPEECH_INSTRUCTIONS.steps.length).toBeGreaterThanOrEqual(5);
      expect(WINDOWS_SPEECH_INSTRUCTIONS.notice).toContain('secure sandbox');
    });
  });

  // ---------------------------------------------------------------------------
  // 4. Cloud TTS API Synthesis Invocation
  // ---------------------------------------------------------------------------
  describe('Cloud TTS API Integration', () => {
    it('synthesizes cloud speech audio via local endpoint when available', async () => {
      const fakeBlob = new Blob(['fake-mp3-audio-bytes'], { type: 'audio/mpeg' });

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        blob: async () => fakeBlob,
      });

      // Mock createObjectURL
      globalThis.URL.createObjectURL = vi.fn().mockReturnValue('blob:http://localhost:5173/fake-uuid');

      const result = await apiService.synthesizeCloudSpeech('नमस्ते संकल्प', 'hi-IN', 'hi');

      expect(result.audioBlob).toBeDefined();
      expect(result.audioUrl).toBe('blob:http://localhost:5173/fake-uuid');
      expect(globalThis.fetch).toHaveBeenCalledWith('/api/tts/synthesize', expect.any(Object));
    });
  });

  // ---------------------------------------------------------------------------
  // 5. Sentence-Bounded Utterance Chunking
  // ---------------------------------------------------------------------------
  describe('Sentence-Bounded Utterance Chunker', () => {
    it('splits lecture text on periods and Hindi dandas without losing words', () => {
      const text =
        'Operating systems manage computer hardware. Memory management maps virtual addresses. यह एक अध्ययन सामग्री है। प्रक्रिया अनुसूचक सीपीयू का प्रबंधन करता है।';

      const chunks = splitTextIntoUtteranceChunks(text, 100);

      expect(chunks.length).toBeGreaterThanOrEqual(2);
      const reconstructed = chunks.join(' ');
      expect(reconstructed).toContain('Operating systems manage computer hardware');
      expect(reconstructed).toContain('यह एक अध्ययन सामग्री है');
      expect(reconstructed).toContain('प्रक्रिया अनुसूचक');
    });

    it('handles long complex notes by subdividing on punctuation marks', () => {
      const longNote =
        'In multi-core computing architectures, cache coherence protocols prevent data divergence, maintaining consistency across L1, L2, and L3 caches while ensuring execution order remains strictly deterministic.';

      const chunks = splitTextIntoUtteranceChunks(longNote, 80);
      expect(chunks.length).toBeGreaterThan(1);
      for (const chunk of chunks) {
        expect(chunk.length).toBeLessThanOrEqual(100);
      }
    });
  });

  // ---------------------------------------------------------------------------
  // 6. Duration & Timer Calculations
  // ---------------------------------------------------------------------------
  describe('Audio Duration & Playback Metrics', () => {
    it('estimates reading time accurately for varying speech rates', () => {
      const sampleText = new Array(140).fill('word').join(' ');
      const durNormal = calculateSpeechDurationSeconds(sampleText, 1.0);
      expect(durNormal).toBe(60);

      const durFast = calculateSpeechDurationSeconds(sampleText, 2.0);
      expect(durFast).toBe(30);

      const durSlow = calculateSpeechDurationSeconds(sampleText, 0.75);
      expect(durSlow).toBe(80);
    });

    it('formats seconds into mm:ss display', () => {
      expect(formatDuration(0)).toBe('0:00');
      expect(formatDuration(65)).toBe('1:05');
      expect(formatDuration(182)).toBe('3:02');
    });
  });

  // ---------------------------------------------------------------------------
  // 7. Saved Speech Notes Persistence
  // ---------------------------------------------------------------------------
  describe('Saved Speech Material Persistence', () => {
    it('stores, retrieves, and deletes saved speech reading items', () => {
      const note: Omit<SavedSpeechNote, 'id' | 'created_at'> = {
        user_id: 'usr_student_1',
        title: 'Microservices Lecture Notes',
        text: 'Microservice architectures decompose monoliths into independently deployable units.',
        language_code: 'en-IN',
        language_name: 'English (Indian)',
        voice_name: 'Microsoft Neerja',
        voice_gender: 'female',
      };

      const saved = localStore.saveSpeechNote(note);
      expect(saved.id).toBeDefined();

      const all = localStore.getSavedSpeechNotes();
      expect(all.length).toBe(1);
      expect(all[0].title).toBe('Microservices Lecture Notes');
      expect(all[0].language_name).toBe('English (Indian)');
      expect(all[0].voice_gender).toBe('female');

      // Delete note
      localStore.deleteSavedSpeechNote(saved.id);
      const afterDelete = localStore.getSavedSpeechNotes();
      expect(afterDelete.length).toBe(0);
    });
  });
});
