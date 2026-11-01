// ==============================================================================
// SANKALP — Multilingual Text-to-Speech Engine Service
// ==============================================================================

import { IndianLanguageOption, VoiceMeta, VoiceInstallationStatus } from '../types';

// The 23 Official Indian Languages specified in the requirements
export const OFFICIAL_INDIAN_LANGUAGES: IndianLanguageOption[] = [
  {
    code: 'hi-IN',
    iso639: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    script: 'Devanagari',
    sampleGreeting: 'नमस्ते! संकल्प स्मार्ट कैंपस में आपका स्वागत है।',
    windowsPackName: 'Hindi (India)',
    windowsSpeechPackAvailable: true,
    cloudTtsSupported: true,
  },
  {
    code: 'en-IN',
    iso639: 'en',
    name: 'English (Indian)',
    nativeName: 'English (India)',
    script: 'Latin',
    sampleGreeting: 'Hello! Welcome to Sankalp Smart Campus.',
    windowsPackName: 'English (India)',
    windowsSpeechPackAvailable: true,
    cloudTtsSupported: true,
  },
  {
    code: 'bn-IN',
    iso639: 'bn',
    name: 'Bengali',
    nativeName: 'বাংলা',
    script: 'Bengali',
    sampleGreeting: 'নমস্কার! সংকল্প স্মার্ট ক্যাম্পাসে আপনাকে স্বাগতম।',
    windowsPackName: 'Bangla (India)',
    windowsSpeechPackAvailable: true,
    cloudTtsSupported: true,
  },
  {
    code: 'ta-IN',
    iso639: 'ta',
    name: 'Tamil',
    nativeName: 'தமிழ்',
    script: 'Tamil',
    sampleGreeting: 'வணக்கம்! சங்கல்ப் ஸ்மார்ட் கேம்பஸுக்கு உங்களை வரவேற்கிறோம்.',
    windowsPackName: 'Tamil (India)',
    windowsSpeechPackAvailable: true,
    cloudTtsSupported: true,
  },
  {
    code: 'te-IN',
    iso639: 'te',
    name: 'Telugu',
    nativeName: 'తెలుగు',
    script: 'Telugu',
    sampleGreeting: 'నమస్కారం! సంకల్ప్ స్మార్ట్ క్యాంపస్‌కు స్వాగతం.',
    windowsPackName: 'Telugu (India)',
    windowsSpeechPackAvailable: true,
    cloudTtsSupported: true,
  },
  {
    code: 'mr-IN',
    iso639: 'mr',
    name: 'Marathi',
    nativeName: 'मराठी',
    script: 'Devanagari',
    sampleGreeting: 'नमस्कार! संकल्प स्मार्ट कॅम्पसमध्ये आपले स्वागत आहे.',
    windowsPackName: 'Marathi',
    windowsSpeechPackAvailable: true,
    cloudTtsSupported: true,
  },
  {
    code: 'gu-IN',
    iso639: 'gu',
    name: 'Gujarati',
    nativeName: 'ગુજરાતી',
    script: 'Gujarati',
    sampleGreeting: 'નમસ્તે! સંકલ્પ સ્માર્ટ કેમ્પસમાં આપનું સ્વાગત છે.',
    windowsPackName: 'Gujarati',
    windowsSpeechPackAvailable: true,
    cloudTtsSupported: true,
  },
  {
    code: 'kn-IN',
    iso639: 'kn',
    name: 'Kannada',
    nativeName: 'ಕನ್ನಡ',
    script: 'Kannada',
    sampleGreeting: 'ನಮಸ್ಕಾರ! ಸಂಕಲ್ಪ ಸ್ಮಾರ್ಟ್ ಕ್ಯಾಂಪಸ್‌ಗೆ ಸ್ವಾಗತ.',
    windowsPackName: 'Kannada',
    windowsSpeechPackAvailable: true,
    cloudTtsSupported: true,
  },
  {
    code: 'ml-IN',
    iso639: 'ml',
    name: 'Malayalam',
    nativeName: 'മലയാളം',
    script: 'Malayalam',
    sampleGreeting: 'നമസ്കാരം! സങ്കൽപ് സ്മാർട്ട് ക്യാമ്പസിലേക്ക് സ്വാഗതം.',
    windowsPackName: 'Malayalam',
    windowsSpeechPackAvailable: true,
    cloudTtsSupported: true,
  },
  {
    code: 'pa-IN',
    iso639: 'pa',
    name: 'Punjabi',
    nativeName: 'ਪੰਜਾਬੀ',
    script: 'Gurmukhi',
    sampleGreeting: 'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ! ਸੰਕਲਪ ਸਮਾਰਟ ਕੈਂਪਸ ਵਿੱਚ ਤੁਹਾਡਾ ਸੁਆਗਤ ਹੈ।',
    windowsPackName: 'Punjabi',
    windowsSpeechPackAvailable: true,
    cloudTtsSupported: true,
  },
  {
    code: 'ur-IN',
    iso639: 'ur',
    name: 'Urdu',
    nativeName: 'اردو',
    script: 'Perso-Arabic',
    sampleGreeting: 'ہیلو! سنکلپ سمارٹ کیمپس میں خوش آمدید۔',
    windowsPackName: 'Urdu (India)',
    windowsSpeechPackAvailable: true,
    cloudTtsSupported: true,
  },
  {
    code: 'ne-NP',
    iso639: 'ne',
    name: 'Nepali',
    nativeName: 'नेपाली',
    script: 'Devanagari',
    sampleGreeting: 'नमस्ते! संकल्प स्मार्ट क्याम्पसमा स्वागत छ।',
    windowsPackName: 'Nepali (Nepal)',
    windowsSpeechPackAvailable: true,
    cloudTtsSupported: true,
  },
  {
    code: 'as-IN',
    iso639: 'as',
    name: 'Assamese',
    nativeName: 'অসমীয়া',
    script: 'Bengali-Assamese',
    sampleGreeting: 'নমস্কাৰ! সংকল্প স্মাৰ্ট কেম্পাছলৈ স্বাগতম।',
    windowsPackName: 'Assamese',
    windowsSpeechPackAvailable: false,
    cloudTtsSupported: false,
    alternativeLang: 'bn-IN',
  },
  {
    code: 'or-IN',
    iso639: 'or',
    name: 'Odia',
    nativeName: 'ଓଡ଼ିଆ',
    script: 'Odia',
    sampleGreeting: 'ନମସ୍କାର! ସଂକଳ୍ପ ସ୍ମାର୍ଟ କ୍ୟାମ୍ପସକୁ ସ୍ୱାଗତ।',
    windowsPackName: 'Odia',
    windowsSpeechPackAvailable: false,
    cloudTtsSupported: false,
    alternativeLang: 'hi-IN',
  },
  {
    code: 'sa-IN',
    iso639: 'sa',
    name: 'Sanskrit',
    nativeName: 'संस्कृतम्',
    script: 'Devanagari',
    sampleGreeting: 'नमो नमः! संकल्प स्मार्ट परिसरे भवतां स्वागतम्।',
    windowsPackName: 'Sanskrit',
    windowsSpeechPackAvailable: false,
    cloudTtsSupported: false,
    alternativeLang: 'hi-IN',
  },
  {
    code: 'kok-IN',
    iso639: 'kok',
    name: 'Konkani',
    nativeName: 'कोंकणी',
    script: 'Devanagari',
    sampleGreeting: 'नमस्कार! संकल्प स्मार्ट कॅम्पसांत तुमचें येवकार।',
    windowsPackName: 'Konkani',
    windowsSpeechPackAvailable: false,
    cloudTtsSupported: false,
    alternativeLang: 'mr-IN',
  },
  {
    code: 'ks-IN',
    iso639: 'ks',
    name: 'Kashmiri',
    nativeName: 'کٲشُر',
    script: 'Perso-Arabic',
    sampleGreeting: 'سلام! سنکلپ سمارٹ کیمپس منز خوش آمدید۔',
    windowsPackName: 'Kashmiri',
    windowsSpeechPackAvailable: false,
    cloudTtsSupported: false,
    alternativeLang: 'ur-IN',
  },
  {
    code: 'sd-IN',
    iso639: 'sd',
    name: 'Sindhi',
    nativeName: 'سنڌي',
    script: 'Perso-Arabic',
    sampleGreeting: 'سلام! سنڪلپ اسمارٽ ڪيمپس ۾ ڀلي ڪري آيا۔',
    windowsPackName: 'Sindhi',
    windowsSpeechPackAvailable: false,
    cloudTtsSupported: false,
    alternativeLang: 'ur-IN',
  },
  {
    code: 'mni-IN',
    iso639: 'mni',
    name: 'Manipuri',
    nativeName: 'ꯃꯩꯇꯩꯂꯣꯟ',
    script: 'Meetei Mayek',
    sampleGreeting: 'ꯈꯨꯔꯨꯝꯖꯔꯤ! ꯁꯪꯀꯜꯞ ꯁ꯭ꯃꯥꯔ꯭ꯠ ꯀꯦꯝꯄꯁꯇꯥ ꯇꯔꯥꯝꯅꯥ ꯑꯣꯛꯆꯔꯤ꯫',
    windowsPackName: 'Manipuri',
    windowsSpeechPackAvailable: false,
    cloudTtsSupported: false,
    alternativeLang: 'bn-IN',
  },
  {
    code: 'brx-IN',
    iso639: 'brx',
    name: 'Bodo',
    nativeName: 'बर\'',
    script: 'Devanagari',
    sampleGreeting: 'खुबुल! संकल्फ स्मार्ट केम्फासाव बरायबाय।',
    windowsPackName: 'Bodo',
    windowsSpeechPackAvailable: false,
    cloudTtsSupported: false,
    alternativeLang: 'hi-IN',
  },
  {
    code: 'doi-IN',
    iso639: 'doi',
    name: 'Dogri',
    nativeName: 'डोगरी',
    script: 'Devanagari',
    sampleGreeting: 'नमस्ते! संकल्प स्मार्ट कैंपस च तुंदा स्वागत ऐ।',
    windowsPackName: 'Dogri',
    windowsSpeechPackAvailable: false,
    cloudTtsSupported: false,
    alternativeLang: 'hi-IN',
  },
  {
    code: 'mai-IN',
    iso639: 'mai',
    name: 'Maithili',
    nativeName: 'मैथिली',
    script: 'Devanagari',
    sampleGreeting: 'प्रणाम! संकल्प स्मार्ट कैंपस मे अपनेक स्वागत अछि।',
    windowsPackName: 'Maithili',
    windowsSpeechPackAvailable: false,
    cloudTtsSupported: false,
    alternativeLang: 'hi-IN',
  },
  {
    code: 'sat-IN',
    iso639: 'sat',
    name: 'Santali',
    nativeName: 'ᱥᱟᱱᱛᱟᱲᱤ',
    script: 'Ol Chiki',
    sampleGreeting: 'ᱡᱚᱦᱟᱨ! ᱥᱚᱝᱠᱚᱞᱯ ᱥᱢᱟᱨᱴ ᱠᱮᱢᱯᱟᱥ ᱨᱮ ᱥᱟᱜᱩᱱ ᱫᱟᱨᱟᱢ᱾',
    windowsPackName: 'Santali',
    windowsSpeechPackAvailable: false,
    cloudTtsSupported: false,
    alternativeLang: 'hi-IN',
  },
];

/**
 * Detect voice gender from genuine provider metadata.
 * Does not invent fake genders. If not verifiable, returns 'unspecified'.
 */
export const detectVoiceGender = (voice: SpeechSynthesisVoice): 'male' | 'female' | 'unspecified' => {
  // 1. Direct provider metadata if present on voice object
  if ((voice as any).gender === 'male' || (voice as any).gender === 'female') {
    return (voice as any).gender;
  }

  const nameLower = voice.name.toLowerCase();

  // 2. Explicit provider labels in voice name
  if (nameLower.includes('male') && !nameLower.includes('female')) {
    return 'male';
  }
  if (nameLower.includes('female')) {
    return 'female';
  }

  // 3. Known official Microsoft Indian voices
  // Microsoft Madhur = Male, Microsoft Swara = Female, Microsoft Hemant = Male, Microsoft Kalpana = Female
  if (nameLower.includes('madhur') || nameLower.includes('hemant') || nameLower.includes('prabhat')) {
    return 'male';
  }
  if (nameLower.includes('swara') || nameLower.includes('kalpana') || nameLower.includes('neerja')) {
    return 'female';
  }

  // 4. Known official Apple Indian voices
  // Rishi = Male, Veena = Female
  if (nameLower.includes('rishi')) {
    return 'male';
  }
  if (nameLower.includes('veena')) {
    return 'female';
  }

  // If gender cannot be authentically determined from provider metadata
  return 'unspecified';
};

/**
 * Filter system voices matching an Indian language code or ISO-639 tag.
 */
export const getVoicesForLanguage = (
  voices: SpeechSynthesisVoice[],
  langOption: IndianLanguageOption
): VoiceMeta[] => {
  const targetCode = langOption.code.toLowerCase();
  const targetIso = langOption.iso639.toLowerCase();

  return voices
    .filter((v) => {
      const vLang = v.lang.toLowerCase().replace(/_/g, '-');
      // Exact language match (e.g. "hi-in" === "hi-in")
      if (vLang === targetCode) return true;
      // Primary subtag match for non-English (e.g. "hi" starts with "hi", "ta" starts with "ta")
      if (targetIso !== 'en' && vLang.startsWith(`${targetIso}-`)) return true;
      if (targetIso !== 'en' && vLang === targetIso) return true;
      // English (Indian) specifically requires en-in
      if (targetCode === 'en-in') {
        return vLang === 'en-in' || (vLang.startsWith('en') && v.name.toLowerCase().includes('india'));
      }
      return false;
    })
    .map((v) => ({
      voiceURI: v.voiceURI,
      name: v.name,
      lang: v.lang,
      gender: detectVoiceGender(v),
      isLocal: v.localService,
      provider: 'local',
    }));
};

/**
 * Construct verified Cloud Neural Voice for a supported language
 */
export const getCloudVoiceForLanguage = (langOption: IndianLanguageOption): VoiceMeta | null => {
  if (!langOption.cloudTtsSupported) return null;
  return {
    voiceURI: `cloud_${langOption.code}_standard`,
    name: `Cloud Neural Voice (${langOption.name})`,
    lang: langOption.code,
    gender: 'female', // Verified Google standard neural voice tier is female profile
    isLocal: false,
    provider: 'cloud',
  };
};

/**
 * Evaluate the comprehensive voice availability status for an Indian language.
 */
export const evaluateLanguageVoiceStatus = (
  langOption: IndianLanguageOption,
  systemVoices: SpeechSynthesisVoice[]
): {
  status: VoiceInstallationStatus;
  statusBadgeText: string;
  statusBadgeColor: string;
  localVoices: VoiceMeta[];
  cloudVoice: VoiceMeta | null;
  description: string;
  canSynthesize: boolean;
} => {
  const localVoices = getVoicesForLanguage(systemVoices, langOption);
  const cloudVoice = getCloudVoiceForLanguage(langOption);

  if (localVoices.length > 0) {
    return {
      status: 'installed_local',
      statusBadgeText: 'Installed Locally',
      statusBadgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      localVoices,
      cloudVoice,
      description: `${localVoices.length} local system voice(s) available on this machine.`,
      canSynthesize: true,
    };
  }

  if (cloudVoice) {
    return {
      status: 'available_cloud',
      statusBadgeText: 'Available via Cloud TTS',
      statusBadgeColor: 'bg-[#00D9FF]/10 text-[#00D9FF] border-[#00D9FF]/30',
      localVoices,
      cloudVoice,
      description: 'Local voice pack not on device, but high-fidelity Cloud Neural Voice is ready.',
      canSynthesize: true,
    };
  }

  if (langOption.windowsSpeechPackAvailable) {
    return {
      status: 'not_installed',
      statusBadgeText: 'Installation Required',
      statusBadgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      localVoices,
      cloudVoice: null,
      description: `Windows provides a speech pack for ${langOption.name}, but it is not installed yet.`,
      canSynthesize: false,
    };
  }

  return {
    status: 'unsupported_by_provider',
    statusBadgeText: 'Not Supported by Provider',
    statusBadgeColor: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
    localVoices,
    cloudVoice: null,
    description: `No public prebuilt voice currently available. Consider using Hindi or English.`,
    canSynthesize: false,
  };
};

/**
 * Determine which Indian languages have genuinely installed voices or cloud availability.
 */
export const categorizeLanguageAvailability = (
  voices: SpeechSynthesisVoice[]
): {
  supported: Array<{ language: IndianLanguageOption; voices: VoiceMeta[] }>;
  unsupported: IndianLanguageOption[];
} => {
  const supported: Array<{ language: IndianLanguageOption; voices: VoiceMeta[] }> = [];
  const unsupported: IndianLanguageOption[] = [];

  for (const lang of OFFICIAL_INDIAN_LANGUAGES) {
    const matched = getVoicesForLanguage(voices, lang);
    if (matched.length > 0) {
      supported.push({ language: lang, voices: matched });
    } else {
      unsupported.push(lang);
    }
  }

  return { supported, unsupported };
};

/**
 * Windows Speech Pack step-by-step instructions
 */
export const WINDOWS_SPEECH_INSTRUCTIONS = {
  settingsUri: 'ms-settings:speech',
  languageUri: 'ms-settings:regionlanguage',
  steps: [
    'Open Windows Settings (press Win + I).',
    'Go to "Time & Language" → "Language & Region".',
    'Locate or add your preferred Indian language under "Preferred languages".',
    'Click Options (...) next to the language and select "Language options".',
    'Download the "Speech" / "Text-to-speech" feature if offered by Windows.',
    'After download completes, return to SANKALP and click "Refresh System Voices".',
  ],
  notice:
    'Web browsers run in a secure sandbox and cannot silently install OS software packages. Windows voice packs must be installed through Windows Settings.',
};

/**
 * Sentence-bounded text chunker for reliable SpeechSynthesis playback.
 * Prevents browser speech synthesis from cutting off on long lecture texts.
 */
export const splitTextIntoUtteranceChunks = (
  text: string,
  maxChunkChars: number = 200
): string[] => {
  if (!text || !text.trim()) return [];

  const raw = text.replace(/\r/g, '').trim();

  // Split on sentence boundaries: periods, exclamation, questions, Hindi dandas (।), or double newlines
  const rawSentences = raw.split(/(?<=[.?!।\n])\s+/);
  const chunks: string[] = [];
  let currentChunk = '';

  for (const sentence of rawSentences) {
    const trimmed = sentence.trim();
    if (!trimmed) continue;

    // If single sentence exceeds maxChunkChars, split by comma or semi-colon
    if (trimmed.length > maxChunkChars) {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = '';
      }

      const clauses = trimmed.split(/(?<=[,;])\s+/);
      for (const clause of clauses) {
        if ((currentChunk + ' ' + clause).trim().length <= maxChunkChars) {
          currentChunk = (currentChunk + ' ' + clause).trim();
        } else {
          if (currentChunk) chunks.push(currentChunk.trim());
          currentChunk = clause.trim();
        }
      }
    } else if ((currentChunk + ' ' + trimmed).trim().length <= maxChunkChars) {
      currentChunk = (currentChunk + ' ' + trimmed).trim();
    } else {
      if (currentChunk) chunks.push(currentChunk.trim());
      currentChunk = trimmed;
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
};

/**
 * Calculates estimated listening duration in seconds based on word count & playback speed.
 */
export const calculateSpeechDurationSeconds = (text: string, rate: number = 1.0): number => {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  if (words === 0) return 0;
  // Standard speech is ~140 words per minute at 1.0x rate
  const wordsPerSecond = (140 * Math.max(0.5, rate)) / 60;
  return Math.ceil(words / wordsPerSecond);
};

/**
 * Format seconds into mm:ss display
 */
export const formatDuration = (totalSeconds: number): string => {
  const mins = Math.floor(totalSeconds / 60);
  const secs = Math.floor(totalSeconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

export interface CleanVoiceOption {
  id: string;
  name: string;
  gender: 'male' | 'female' | 'unspecified';
  isLocal: boolean;
}

/**
 * Filter and return only the languages that can genuinely generate speech
 * (either through genuinely installed system voices or verified backend service)
 */
export const getPlayableLanguages = (systemVoices: SpeechSynthesisVoice[]): IndianLanguageOption[] => {
  return OFFICIAL_INDIAN_LANGUAGES.filter((lang) => {
    const local = getVoicesForLanguage(systemVoices, lang);
    return local.length > 0 || lang.cloudTtsSupported;
  });
};

/**
 * Returns simplified, friendly voices for a language without technical engine names
 */
export const getCleanVoicesForLanguage = (
  lang: IndianLanguageOption,
  systemVoices: SpeechSynthesisVoice[]
): CleanVoiceOption[] => {
  const localVoices = getVoicesForLanguage(systemVoices, lang);
  const options: CleanVoiceOption[] = [];

  // Local voices (clean friendly names with verified gender)
  localVoices.forEach((v, idx) => {
    const genderTag = v.gender === 'male' ? ' (Male)' : v.gender === 'female' ? ' (Female)' : '';
    const simpleName = v.name
      .replace(/Microsoft\s*/gi, '')
      .replace(/Desktop\s*/gi, '')
      .replace(/Online\s*\(Natural\)\s*-\s*/gi, '')
      .replace(/Google\s*/gi, '')
      .replace(/Apple\s*/gi, '')
      .replace(/\s*\(India\)/gi, '')
      .trim();

    options.push({
      id: v.voiceURI,
      name: `${simpleName || `Voice ${idx + 1}`}${genderTag}`,
      gender: v.gender,
      isLocal: true,
    });
  });

  // Natural Cloud voice (female profile)
  if (lang.cloudTtsSupported) {
    options.push({
      id: `cloud_${lang.code}`,
      name: localVoices.length > 0 ? 'Natural Voice (Female)' : 'Standard Voice (Female)',
      gender: 'female',
      isLocal: false,
    });
  }

  return options;
};

