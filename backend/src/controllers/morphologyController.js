import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import asyncHandler from '../utils/asyncHandler.js';
import { ValidationError, InternalError } from '../utils/errors.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCRIPT_PATH = path.join(__dirname, '../../scripts/morphology_analyzer.py');
const PYTHON_BIN = process.env.PYTHON_BIN || 'python3';

// Configuration
const MAX_TEXT_LENGTH = 10000; // 10KB max
const ANALYZER_TIMEOUT = 5000; // 5 seconds
const CACHE_LIMIT = 50000;
const WORD_RE = /[а-яА-ЯёЁ]+(?:-[а-яА-ЯёЁ]+)*/g;

// Кэш разобранных слов
const wordCache = new Map();

// Statistics
let stats = {
  totalRequests: 0,
  cacheHits: 0,
  cacheMisses: 0,
  errors: 0,
  timeouts: 0,
};

const runAnalyzer = (text) =>
  new Promise((resolve, reject) => {
    const proc = spawn(PYTHON_BIN, [SCRIPT_PATH], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    const timer = setTimeout(() => {
      proc.kill('SIGKILL');
      stats.timeouts++;
      reject(new Error('Morphology analyzer timeout'));
    }, ANALYZER_TIMEOUT);

    proc.stdout.on('data', (chunk) => {
      stdout += chunk;
    });

    proc.stderr.on('data', (chunk) => {
      stderr += chunk;
    });

    proc.on('error', (error) => {
      clearTimeout(timer);
      stats.errors++;
      reject(new Error(`Failed to spawn analyzer: ${error.message}`));
    });

    proc.on('close', (code) => {
      clearTimeout(timer);

      if (code !== 0) {
        stats.errors++;
        const errorMsg = stderr.trim() || `Analyzer exited with code ${code}`;
        return reject(new Error(errorMsg));
      }

      try {
        const result = JSON.parse(stdout);
        resolve(result);
      } catch (error) {
        stats.errors++;
        reject(new Error(`Invalid analyzer response: ${error.message}`));
      }
    });

    // Send input
    try {
      proc.stdin.write(JSON.stringify({ text }));
      proc.stdin.end();
    } catch (error) {
      clearTimeout(timer);
      stats.errors++;
      reject(new Error(`Failed to write to analyzer: ${error.message}`));
    }
  });

export const analyzeText = asyncHandler(async (req, res) => {
  const { text } = req.body || {};

  // Validation
  if (typeof text !== 'string' || !text.trim()) {
    throw new ValidationError('Text field is required');
  }

  if (text.length > MAX_TEXT_LENGTH) {
    throw new ValidationError(`Text too long. Maximum ${MAX_TEXT_LENGTH} characters allowed`);
  }

  stats.totalRequests++;

  // Extract words
  const tokens = text.match(WORD_RE) || [];

  if (tokens.length === 0) {
    return res.json({
      words: [],
      cached: 0,
      analyzed: 0,
    });
  }

  const unique = [...new Set(tokens.map((t) => t.toLowerCase()))];

  // Check cache
  const cached = [];
  const missing = [];

  for (const word of unique) {
    if (wordCache.has(word)) {
      stats.cacheHits++;
      cached.push({
        word,
        pos: wordCache.get(word),
        cached: true,
      });
    } else {
      stats.cacheMisses++;
      missing.push(word);
    }
  }

  // All words cached - return immediately
  if (missing.length === 0) {
    return res.json({
      words: cached,
      cached: cached.length,
      analyzed: 0,
    });
  }

  // Analyze missing words
  try {
    const { words = [] } = await runAnalyzer(missing.join(' '));

    // Update cache
    for (const { word, pos } of words) {
      const key = word.toLowerCase();

      // Clear cache if limit reached
      if (wordCache.size >= CACHE_LIMIT) {
        wordCache.clear();
      }

      wordCache.set(key, pos);
    }

    res.json({
      words: [...cached, ...words],
      cached: cached.length,
      analyzed: words.length,
    });
  } catch (error) {
    // Log error but provide fallback
    console.error('Morphology analysis error:', {
      error: error.message,
      stats,
    });

    // Fallback: return cached words and mark missing as unknown
    const fallbackWords = [
      ...cached,
      ...missing.map(word => ({
        word,
        pos: 'UNKNOWN',
        error: true,
      })),
    ];

    res.json({
      words: fallbackWords,
      cached: cached.length,
      analyzed: 0,
      error: 'Morphology service unavailable',
      fallback: true,
    });
  }
});

// Get morphology service stats
export const getStats = asyncHandler(async (req, res) => {
  res.json({
    ...stats,
    cacheSize: wordCache.size,
    cacheLimit: CACHE_LIMIT,
    maxTextLength: MAX_TEXT_LENGTH,
    timeout: ANALYZER_TIMEOUT,
    cacheHitRate: stats.totalRequests > 0
      ? ((stats.cacheHits / (stats.cacheHits + stats.cacheMisses)) * 100).toFixed(2) + '%'
      : '0%',
  });
});

// Clear cache (admin endpoint)
export const clearCache = asyncHandler(async (req, res) => {
  const oldSize = wordCache.size;
  wordCache.clear();

  res.json({
    message: 'Cache cleared',
    clearedEntries: oldSize,
  });
});
