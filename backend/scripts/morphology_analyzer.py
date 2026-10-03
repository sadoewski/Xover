#!/usr/bin/env python3
"""Морфологический анализ русского текста (pymorphy3).

Читает JSON {"text": "..."} из stdin, пишет в stdout
{"words": [{"word": "кошка", "pos": "noun"}, ...]}.
Слова, встречающиеся несколько раз, возвращаются один раз.
"""
import json
import re
import sys

import pymorphy3

morph = pymorphy3.MorphAnalyzer()

# Маппинг частей речи pymorphy3 на категории подсветки
POS_MAPPING = {
    'NOUN': 'noun',           # существительное
    'ADJF': 'adjective',      # прилагательное (полное)
    'ADJS': 'adjective',      # прилагательное (краткое)
    'COMP': 'adjective',      # компаратив
    'VERB': 'verb',           # глагол (личная форма)
    'INFN': 'verb',           # инфинитив
    'PRTF': 'verb',           # причастие (полное)
    'PRTS': 'verb',           # причастие (краткое)
    'GRND': 'verb',           # деепричастие
    'NUMR': 'numeral',        # числительное
    'ADVB': 'adverb',         # наречие
    'NPRO': 'pronoun',        # местоимение-существительное
    'PRED': 'adverb',         # предикатив
    'PREP': 'preposition',    # предлог
    'CONJ': 'conjunction',    # союз
    'PRCL': 'particle',       # частица
    'INTJ': 'interjection',   # междометие
}

WORD_RE = re.compile(r'[а-яА-ЯёЁ]+(?:-[а-яА-ЯёЁ]+)*')


def main():
    try:
        payload = json.load(sys.stdin)
    except (json.JSONDecodeError, ValueError) as exc:
        json.dump({'error': f'invalid input: {exc}'}, sys.stdout)
        return 1

    text = payload.get('text') or ''
    seen = {}

    for token in WORD_RE.findall(text):
        key = token.lower()
        if key in seen:
            continue
        parsed = morph.parse(token)
        pos = parsed[0].tag.POS if parsed else None
        seen[key] = POS_MAPPING.get(pos, 'noun')

    json.dump(
        {'words': [{'word': w, 'pos': p} for w, p in seen.items()]},
        sys.stdout,
        ensure_ascii=False,
    )
    return 0


if __name__ == '__main__':
    sys.exit(main())
