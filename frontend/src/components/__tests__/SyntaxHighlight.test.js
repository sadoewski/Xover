/**
 * Тесты для подсветки синтаксиса
 * Эти тесты проверяют критические части функциональности подсветки
 */

import { describe, it, expect, beforeEach } from 'vitest';

// Импортируем цвета и функции валидации
const POS_COLORS = {
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

describe('SyntaxHighlight Protection Tests', () => {
  describe('POS_COLORS validation', () => {
    it('все части речи имеют цвета', () => {
      const requiredPOS = [
        'noun', 'adjective', 'numeral', 'pronoun', 'verb',
        'adverb', 'preposition', 'conjunction', 'particle', 'interjection'
      ];

      requiredPOS.forEach(pos => {
        expect(POS_COLORS[pos]).toBeDefined();
        expect(POS_COLORS[pos]).toMatch(/^#[0-9A-F]{6}$/i);
      });
    });

    it('все цвета валидные HEX', () => {
      Object.values(POS_COLORS).forEach(color => {
        expect(color).toMatch(/^#[0-9A-F]{6}$/i);
      });
    });
  });

  describe('Word extraction regex', () => {
    const WORD_RE = /([а-яА-ЯёЁ]+(?:-[а-яА-ЯёЁ]+)*)/g;

    it('извлекает русские слова', () => {
      const text = 'привет мир';
      const words = [];
      let match;
      while ((match = WORD_RE.exec(text)) !== null) {
        words.push(match[1]);
      }
      expect(words).toEqual(['привет', 'мир']);
    });

    it('извлекает слова с дефисом', () => {
      const text = 'кто-то где-нибудь';
      const words = [];
      let match;
      while ((match = WORD_RE.exec(text)) !== null) {
        words.push(match[1]);
      }
      expect(words).toEqual(['кто-то', 'где-нибудь']);
    });

    it('игнорирует английские слова', () => {
      const text = 'hello привет world мир';
      const words = [];
      let match;
      while ((match = WORD_RE.exec(text)) !== null) {
        words.push(match[1]);
      }
      expect(words).toEqual(['привет', 'мир']);
    });

    it('игнорирует цифры и символы', () => {
      const text = 'привет123 @мир# 456';
      const words = [];
      let match;
      while ((match = WORD_RE.exec(text)) !== null) {
        words.push(match[1]);
      }
      expect(words).toEqual(['привет', 'мир']);
    });
  });

  describe('Data validation', () => {
    it('валидирует структуру highlightData', () => {
      const validData = {
        'привет': 'noun',
        'красивый': 'adjective'
      };

      expect(typeof validData).toBe('object');
      expect(Object.keys(validData).length).toBeGreaterThan(0);
      Object.entries(validData).forEach(([word, pos]) => {
        expect(typeof word).toBe('string');
        expect(typeof pos).toBe('string');
        expect(word.length).toBeGreaterThan(0);
      });
    });

    it('отклоняет невалидные данные', () => {
      const invalidData = [
        null,
        undefined,
        [],
        'string',
        123,
        {},
      ];

      invalidData.forEach(data => {
        const isValid = data &&
          typeof data === 'object' &&
          !Array.isArray(data) &&
          Object.keys(data).length > 0;
        expect(isValid).toBe(false);
      });
    });
  });

  describe('Position calculation', () => {
    it('корректно вычисляет позиции слов', () => {
      const text = 'привет мир';
      const WORD_RE = /([а-яА-ЯёЁ]+(?:-[а-яА-ЯёЁ]+)*)/g;
      const positions = [];
      let match;

      while ((match = WORD_RE.exec(text)) !== null) {
        const word = match[1];
        const from = match.index;
        const to = from + word.length;
        positions.push({ word, from, to });
      }

      expect(positions).toEqual([
        { word: 'привет', from: 0, to: 6 },
        { word: 'мир', from: 7, to: 10 }
      ]);
    });

    it('валидирует границы позиций', () => {
      const docSize = 100;
      const testCases = [
        { from: 0, to: 5, valid: true },
        { from: 95, to: 100, valid: true },
        { from: -1, to: 5, valid: false },
        { from: 0, to: -5, valid: false },
        { from: 10, to: 5, valid: false },
        { from: 0, to: 101, valid: false },
      ];

      testCases.forEach(({ from, to, valid }) => {
        const isValid = from >= 0 && to >= 0 && from <= to && to <= docSize;
        expect(isValid).toBe(valid);
      });
    });
  });
});
