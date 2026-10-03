import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCRIPT_PATH = path.join(__dirname, '../../scripts/morphology_analyzer.py');
const PYTHON_BIN = process.env.PYTHON_BIN || 'python3';

// Кэш разобранных слов, чтобы не гонять Python на повторы
const wordCache = new Map();
const CACHE_LIMIT = 50000;

const WORD_RE = /[а-яА-ЯёЁ]+(?:-[а-яА-ЯёЁ]+)*/g;

const runAnalyzer = (text) =>
  new Promise((resolve, reject) => {
    const proc = spawn(PYTHON_BIN, [SCRIPT_PATH], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';
    const timer = setTimeout(() => {
      proc.kill('SIGKILL');
      reject(new Error('Таймаут морфологического анализа'));
    }, 15000);

    proc.stdout.on('data', (chunk) => { stdout += chunk; });
    proc.stderr.on('data', (chunk) => { stderr += chunk; });

    proc.on('error', (error) => {
      clearTimeout(timer);
      reject(error);
    });

    proc.on('close', (code) => {
      clearTimeout(timer);
      if (code !== 0) {
        return reject(new Error(stderr.trim() || `Анализатор завершился с кодом ${code}`));
      }
      try {
        resolve(JSON.parse(stdout));
      } catch (error) {
        reject(new Error(`Некорректный ответ анализатора: ${error.message}`));
      }
    });

    proc.stdin.end(JSON.stringify({ text }));
  });

export const analyzeText = async (req, res) => {
  const { text } = req.body || {};

  if (typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({ error: 'Требуется поле text' });
  }

  const tokens = text.match(WORD_RE) || [];
  const unique = [...new Set(tokens.map((t) => t.toLowerCase()))];

  const cached = [];
  const missing = [];
  for (const word of unique) {
    if (wordCache.has(word)) {
      cached.push({ word, pos: wordCache.get(word) });
    } else {
      missing.push(word);
    }
  }

  if (missing.length === 0) {
    return res.json({ words: cached });
  }

  try {
    const { words = [] } = await runAnalyzer(missing.join(' '));

    for (const { word, pos } of words) {
      if (wordCache.size >= CACHE_LIMIT) wordCache.clear();
      wordCache.set(word.toLowerCase(), pos);
    }

    res.json({ words: [...cached, ...words] });
  } catch (error) {
    console.error('Ошибка морфологического анализа:', error);
    res.status(500).json({ error: 'Не удалось выполнить морфологический анализ' });
  }
};
