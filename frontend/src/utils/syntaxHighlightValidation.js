/**
 * Утилиты валидации для подсветки синтаксиса
 * Эти функции обеспечивают безопасную работу подсветки при любых изменениях кода
 */

// Цвета для частей речи - единственный источник истины
export const POS_COLORS = {
  noun: '#4DA3FF',
  adjective: '#B388FF',
  numeral: '#F06292',
  pronoun: '#FF5C5C',
  verb: '#66BB6A',
  adverb: '#FFD54F',
  preposition: '#90A4AE',
  conjunction: '#4DD0E1',
  particle: '#D4E157',
  interjection: '#EC407A',
};

// Регулярное выражение для извлечения русских слов
export const WORD_REGEX = /([а-яА-ЯёЁ]+(?:-[а-яА-ЯёЁ]+)*)/g;

/**
 * Валидирует HEX цвет
 * @param {string} color - цвет в формате #RRGGBB
 * @returns {boolean}
 */
export function isValidHexColor(color) {
  if (typeof color !== 'string') return false;
  return /^#[0-9A-F]{6}$/i.test(color);
}

/**
 * Валидирует структуру POS_COLORS
 * @returns {boolean}
 */
export function validatePOSColors() {
  if (!POS_COLORS || typeof POS_COLORS !== 'object') {
    console.error('[SyntaxHighlight] POS_COLORS is not an object');
    return false;
  }

  const requiredPOS = [
    'noun', 'adjective', 'numeral', 'pronoun', 'verb',
    'adverb', 'preposition', 'conjunction', 'particle', 'interjection'
  ];

  for (const pos of requiredPOS) {
    if (!POS_COLORS[pos]) {
      console.error(`[SyntaxHighlight] Missing color for POS: ${pos}`);
      return false;
    }
    if (!isValidHexColor(POS_COLORS[pos])) {
      console.error(`[SyntaxHighlight] Invalid color for POS ${pos}: ${POS_COLORS[pos]}`);
      return false;
    }
  }

  return true;
}

/**
 * Валидирует данные подсветки от API
 * @param {Object} highlightData - объект {слово: часть_речи}
 * @returns {boolean}
 */
export function validateHighlightData(highlightData) {
  // Проверка на null/undefined
  if (!highlightData) {
    return false;
  }

  // Проверка типа
  if (typeof highlightData !== 'object' || Array.isArray(highlightData)) {
    console.error('[SyntaxHighlight] highlightData is not an object:', typeof highlightData);
    return false;
  }

  // Проверка на пустой объект
  if (Object.keys(highlightData).length === 0) {
    return false;
  }

  // Валидация каждой записи
  for (const [word, posTag] of Object.entries(highlightData)) {
    if (typeof word !== 'string' || word.length === 0) {
      console.warn('[SyntaxHighlight] Invalid word in highlightData:', word);
      return false;
    }
    if (typeof posTag !== 'string' || posTag.length === 0) {
      console.warn('[SyntaxHighlight] Invalid POS tag for word', word, ':', posTag);
      return false;
    }
  }

  return true;
}

/**
 * Валидирует позиции декорации в документе
 * @param {number} from - начальная позиция
 * @param {number} to - конечная позиция
 * @param {number} docSize - размер документа
 * @returns {boolean}
 */
export function validateDecorationPosition(from, to, docSize) {
  if (typeof from !== 'number' || typeof to !== 'number' || typeof docSize !== 'number') {
    return false;
  }

  if (from < 0 || to < 0) {
    return false;
  }

  if (from > to) {
    return false;
  }

  if (to > docSize) {
    return false;
  }

  return true;
}

/**
 * Безопасно получает цвет для части речи
 * @param {string} posTag - тег части речи
 * @returns {string|null} - HEX цвет или null
 */
export function getColorForPOS(posTag) {
  if (!posTag || typeof posTag !== 'string') {
    return null;
  }

  const color = POS_COLORS[posTag];
  if (!color || !isValidHexColor(color)) {
    console.warn('[SyntaxHighlight] No valid color for POS:', posTag);
    return null;
  }

  return color;
}

/**
 * Извлекает слова из текста с их позициями
 * @param {string} text - текст для анализа
 * @returns {Array<{word: string, from: number, to: number}>}
 */
export function extractWordsWithPositions(text) {
  if (!text || typeof text !== 'string') {
    return [];
  }

  const words = [];
  const regex = new RegExp(WORD_REGEX);
  let match;

  try {
    while ((match = regex.exec(text)) !== null) {
      const word = match[1];
      if (!word) continue;

      words.push({
        word,
        from: match.index,
        to: match.index + word.length
      });
    }
  } catch (error) {
    console.error('[SyntaxHighlight] Error extracting words:', error);
    return [];
  }

  return words;
}

/**
 * Проверяет работоспособность подсветки синтаксиса
 * Вызывается при инициализации для самодиагностики
 * @returns {Object} результат проверки {ok: boolean, errors: string[]}
 */
export function runSyntaxHighlightSelfCheck() {
  const errors = [];

  // Проверка 1: POS_COLORS
  if (!validatePOSColors()) {
    errors.push('POS_COLORS validation failed');
  }

  // Проверка 2: WORD_REGEX
  try {
    const testText = 'привет мир кто-то';
    const words = extractWordsWithPositions(testText);
    if (words.length !== 3) {
      errors.push(`WORD_REGEX failed: expected 3 words, got ${words.length}`);
    }
  } catch (error) {
    errors.push(`WORD_REGEX test failed: ${error.message}`);
  }

  // Проверка 3: валидация данных
  const testData = { 'привет': 'noun', 'красивый': 'adjective' };
  if (!validateHighlightData(testData)) {
    errors.push('validateHighlightData failed on valid data');
  }

  // Проверка 4: валидация позиций
  if (!validateDecorationPosition(0, 5, 100)) {
    errors.push('validateDecorationPosition failed on valid positions');
  }

  const ok = errors.length === 0;

  if (!ok) {
    console.error('[SyntaxHighlight] Self-check failed:', errors);
  } else {
  }

  return { ok, errors };
}

/**
 * Создает безопасную декорацию с валидацией
 * @param {number} from - начальная позиция
 * @param {number} to - конечная позиция
 * @param {string} posTag - тег части речи
 * @param {number} docSize - размер документа
 * @returns {Object|null} - объект декорации или null
 */
export function createSafeDecoration(from, to, posTag, docSize) {
  // Валидация позиций
  if (!validateDecorationPosition(from, to, docSize)) {
    console.warn('[SyntaxHighlight] Invalid decoration position:', { from, to, docSize });
    return null;
  }

  // Получение цвета
  const color = getColorForPOS(posTag);
  if (!color) {
    return null;
  }

  return {
    from,
    to,
    attrs: {
      style: `color: ${color}`,
      class: 'syntax-highlight-word'
    }
  };
}
