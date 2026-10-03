import { useState, useRef, useEffect } from 'react';
import { Trash2, X, TerminalSquare, Bookmark } from 'lucide-react';
import { Editor, rootCtx, defaultValueCtx, editorViewCtx } from '@milkdown/core';
import { nord } from '@milkdown/theme-nord';
import { Milkdown, MilkdownProvider, useEditor } from '@milkdown/react';
import { commonmark } from '@milkdown/preset-commonmark';
import { gfm } from '@milkdown/preset-gfm';
import { history } from '@milkdown/plugin-history';
import { cursor } from '@milkdown/plugin-cursor';
import { listener, listenerCtx } from '@milkdown/plugin-listener';
import { prosePluginsCtx } from '@milkdown/core';
import { Plugin, PluginKey } from '@milkdown/prose/state';
import { Decoration, DecorationSet } from '@milkdown/prose/view';
import { morphologyService } from '../services/morphology';
import {
  POS_COLORS,
  WORD_REGEX,
  validateHighlightData,
  validateDecorationPosition,
  getColorForPOS,
  runSyntaxHighlightSelfCheck,
} from '../utils/syntaxHighlightValidation';
import './DocumentEditor.css';

// Запускаем самопроверку при загрузке модуля
let SYNTAX_HIGHLIGHT_ENABLED = false;
try {
  const selfCheck = runSyntaxHighlightSelfCheck();
  SYNTAX_HIGHLIGHT_ENABLED = selfCheck.ok;
  if (!selfCheck.ok) {
    console.error('[SyntaxHighlight] Self-check failed, syntax highlighting disabled:', selfCheck.errors);
  }
} catch (error) {
  console.error('[SyntaxHighlight] Self-check crashed, syntax highlighting disabled:', error);
}

// Создаем плагин для подсветки синтаксиса с защитой от ошибок
const createSyntaxHighlightPlugin = (highlightData) => {
  const pluginKey = new PluginKey('syntax-highlight');

  return new Plugin({
    key: pluginKey,
    state: {
      init() {
        return DecorationSet.empty;
      },
      apply(tr, oldState) {
        try {
          // Проверка: есть ли данные для подсветки
          if (!highlightData || typeof highlightData !== 'object' || !Object.keys(highlightData).length) {
            return DecorationSet.empty;
          }

          const decorations = [];
          const doc = tr.doc;

          // Проверка: существует ли документ
          if (!doc) {
            console.warn('[SyntaxHighlight] Document is missing');
            return DecorationSet.empty;
          }

          doc.descendants((node, pos) => {
            try {
              // Проверка: текстовая ли нода и есть ли текст
              if (!node || !node.isText || !node.text || typeof node.text !== 'string') {
                return;
              }

              const text = node.text;
              const WORD_RE = /([а-яА-ЯёЁ]+(?:-[а-яА-ЯёЁ]+)*)/g;
              let match;

              while ((match = WORD_RE.exec(text)) !== null) {
                const word = match[1];
                if (!word) continue;

                const wordLower = word.toLowerCase();
                const posTag = highlightData[wordLower];

                // Проверка: есть ли тег и цвет для этого слова
                if (!posTag || !POS_COLORS[posTag]) {
                  continue;
                }

                const color = POS_COLORS[posTag];
                const from = pos + match.index;
                const to = from + word.length;

                // Проверка: валидные ли позиции
                if (from < 0 || to < 0 || from > to || to > doc.content.size) {
                  console.warn('[SyntaxHighlight] Invalid position:', { from, to, docSize: doc.content.size });
                  continue;
                }

                decorations.push(
                  Decoration.inline(from, to, {
                    style: `color: ${color}`,
                    class: 'syntax-highlight-word'
                  })
                );
              }
            } catch (nodeError) {
              console.error('[SyntaxHighlight] Error processing node:', nodeError);
            }
          });

          return DecorationSet.create(doc, decorations);
        } catch (error) {
          console.error('[SyntaxHighlight] Error in apply:', error);
          return DecorationSet.empty;
        }
      },
    },
    props: {
      decorations(state) {
        try {
          return pluginKey.getState(state) || DecorationSet.empty;
        } catch (error) {
          console.error('[SyntaxHighlight] Error getting decorations:', error);
          return DecorationSet.empty;
        }
      },
    },
  });
};

function MilkdownEditor({ content, onChange, syntaxHighlightEnabled, highlightData }) {
  const highlightDataRef = useRef(highlightData);
  const editorViewRef = useRef(null);

  // Обновляем ref при изменении данных И форсируем перерисовку
  useEffect(() => {
    highlightDataRef.current = highlightData;

    // Принудительно обновляем view
    if (editorViewRef.current && highlightData && Object.keys(highlightData).length > 0) {
      const view = editorViewRef.current;
      const tr = view.state.tr.setMeta('forceUpdate', true);
      view.dispatch(tr);
    }
  }, [highlightData]);

  useEditor((root) => {

    const editor = Editor.make()
      .config((ctx) => {
        ctx.set(rootCtx, root);
        ctx.set(defaultValueCtx, content || '');
      })
      .config(nord)
      .use(commonmark)
      .use(gfm)
      .use(history)
      .use(cursor)
      .use(listener)
      .config((ctx) => {
        ctx.get(listenerCtx).markdownUpdated((ctx, markdown) => {
          onChange(markdown);
        });

        // Сохраняем ссылку на view для принудительных обновлений
        ctx.get(listenerCtx).mounted((ctx) => {
          try {
            const editorView = ctx.get(editorViewCtx);
            // Milkdown EditorView - это и есть ProseMirror view
            editorViewRef.current = editorView;
          } catch (error) {
            console.error('[SyntaxHighlight] Error saving view:', error);
          }
        });
      });

    // Добавляем плагин подсветки ВСЕГДА, он сам проверяет данные в ref
    editor.config((ctx) => {
        try {
          // Проверка: включена ли подсветка на уровне модуля
          if (!SYNTAX_HIGHLIGHT_ENABLED) {
            console.warn('[SyntaxHighlight] Plugin disabled due to failed self-check');
            return;
          }

          // Создаем плагин, который читает highlightData из ref
          const syntaxPlugin = new Plugin({
            key: new PluginKey('syntax-highlight'),
            state: {
              init() {
                return DecorationSet.empty;
              },
              apply(tr, oldState) {
                try {
                  // Читаем АКТУАЛЬНЫЕ данные из ref
                  const currentHighlightData = highlightDataRef.current;

                  // Валидация данных подсветки
                  if (!validateHighlightData(currentHighlightData)) {
                    return DecorationSet.empty;
                  }

                  // Если документ изменился или есть мета-флаг forceUpdate - пересоздаем декорации
                  // Если документ не изменился и нет флага - возвращаем старые декорации
                  if (!tr.docChanged && !tr.getMeta('forceUpdate')) {
                    return oldState.map(tr.mapping, tr.doc);
                  }

                  const decorations = [];
                  const doc = tr.doc;

                  if (!doc) {
                    console.warn('[SyntaxHighlight] Document is missing');
                    return DecorationSet.empty;
                  }

                  doc.descendants((node, pos) => {
                    try {
                      if (!node || !node.isText || !node.text || typeof node.text !== 'string') {
                        return;
                      }

                      const text = node.text;
                      const WORD_RE = new RegExp(WORD_REGEX);
                      let match;

                      while ((match = WORD_RE.exec(text)) !== null) {
                        const word = match[1];
                        if (!word) continue;

                        const wordLower = word.toLowerCase();
                        const posTag = currentHighlightData[wordLower];

                        if (!posTag) {
                          continue;
                        }

                        // Безопасное получение цвета
                        const color = getColorForPOS(posTag);
                        if (!color) {
                          continue;
                        }

                        const from = pos + match.index;
                        const to = from + word.length;

                        // Валидация позиций
                        if (!validateDecorationPosition(from, to, doc.content.size)) {
                          console.warn('[SyntaxHighlight] Invalid position:', { from, to, docSize: doc.content.size });
                          continue;
                        }

                        decorations.push(
                          Decoration.inline(from, to, {
                            style: `color: ${color}`,
                            class: 'syntax-highlight-word'
                          })
                        );
                      }
                    } catch (nodeError) {
                      console.error('[SyntaxHighlight] Error processing node:', nodeError);
                    }
                  });

                  return DecorationSet.create(doc, decorations);
                } catch (error) {
                  console.error('[SyntaxHighlight] Error in apply:', error);
                  return DecorationSet.empty;
                }
              },
            },
            props: {
              decorations(state) {
                try {
                  return this.getState(state) || DecorationSet.empty;
                } catch (error) {
                  return DecorationSet.empty;
                }
              },
            },
          });

          ctx.update(prosePluginsCtx, (plugins) => [...plugins, syntaxPlugin]);
        } catch (error) {
          console.error('[SyntaxHighlight] Error adding plugin:', error);
        }
      });

    return editor;
  }, []); // Редактор создается ОДИН раз

  return <Milkdown />;
}

export default function DocumentEditor({
  document,
  onSave,
  onClose,
  onDelete,
  onToggleBookmark,
  saveStatus,
  syntaxHighlightEnabled: externalSyntaxHighlightEnabled,
  onSyntaxHighlightChange
}) {
  // Очищаем экранированные точки и типографские символы при загрузке
  let cleanContent = (document?.content || '')
    .replace(/(\d+)\\\./g, '$1.')
    .replace(/['']/g, "'")
    .replace(/[""]/g, '"')
    .replace(/—/g, '--')
    .replace(/–/g, '-')
    .replace(/…/g, '...')
    .replace(/ /g, ' ');

  // Гарантируем, что первая строка - это заголовок H1
  const ensureH1Title = (content) => {
    const lines = content.split('\n');
    if (lines.length === 0 || !lines[0]) {
      return '# Без названия\n\n' + content;
    }

    const firstLine = lines[0].trim();

    // Если первая строка уже H1 - оставляем как есть
    if (firstLine.startsWith('# ')) {
      return content;
    }

    // Если первая строка другой заголовок (##, ###) или обычный текст - делаем H1
    const titleText = firstLine.replace(/^#+\s*/, '').trim() || 'Без названия';
    lines[0] = `# ${titleText}`;

    return lines.join('\n');
  };

  cleanContent = ensureH1Title(cleanContent);

  const [markdownContent, setMarkdownContent] = useState(cleanContent);
  const [isSaving, setIsSaving] = useState(false);

  // Используем внешнее состояние подсветки, если оно передано, иначе берем из документа
  const syntaxHighlightEnabled = externalSyntaxHighlightEnabled !== undefined
    ? externalSyntaxHighlightEnabled
    : (document?.syntax_highlight_enabled || false);

  const [highlightData, setHighlightData] = useState({});
  const [showHotkeys, setShowHotkeys] = useState(false);
  const hotkeysRef = useRef(null);
  const autoSaveTimerRef = useRef(null);
  const ruMorphologyRef = useRef({});


  // Закрытие выпадающего списка при клике вне его
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (hotkeysRef.current && !hotkeysRef.current.contains(event.target)) {
        setShowHotkeys(false);
      }
    };

    if (showHotkeys) {
      window.document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      window.document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showHotkeys]);

  // Автосохранение
  useEffect(() => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(() => {
      handleSave();
    }, 2000);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [markdownContent]);

  const handleSave = async () => {
    if (isSaving) return;

    setIsSaving(true);
    try {
      // Извлекаем первую строку как заголовок
      const lines = markdownContent.split('\n');
      const firstLine = lines[0]?.trim() || '';
      const title = firstLine.replace(/^#+\s*/, '').trim() || 'Без названия';

      await onSave(document.id, {
        title,
        content: markdownContent,
        syntax_highlight_enabled: syntaxHighlightEnabled,
      });
    } catch (error) {
      console.error('Error saving document:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Удалить этот документ?')) {
      await onDelete(document.id);
    }
  };

  // Получение морфологического анализа для подсветки
  // Морфологический анализ для подсветки синтаксиса с автотестами
  useEffect(() => {
    if (!syntaxHighlightEnabled || !markdownContent) {
      setHighlightData({});
      return;
    }

    const analyzeText = async () => {
      try {

        const WORD_RE = /([а-яА-ЯёЁ]+(?:-[а-яА-ЯёЁ]+)*)/g;
        const words = [...markdownContent.matchAll(WORD_RE)].map(m => m[1]);
        const uniqueWords = [...new Set(words.map(w => w.toLowerCase()))];


        // Фильтруем только новые слова
        const newWords = uniqueWords.filter(word => !ruMorphologyRef.current[word]);

        if (newWords.length === 0) {
          return;
        }

        // API принимает весь текст сразу и возвращает карту { слово: pos }
        const text = newWords.join(' ');
        const resultMap = await morphologyService.analyze(text);


        const newData = { ...ruMorphologyRef.current };
        let addedCount = 0;

        // resultMap это уже объект { слово: pos }
        Object.entries(resultMap).forEach(([word, pos]) => {
          // Автотест: проверяем что POS-тег валидный
          if (pos && typeof pos === 'string' && POS_COLORS.hasOwnProperty(pos)) {
            newData[word] = pos;
            addedCount++;
          } else {
            console.warn('[SyntaxHighlight] Invalid POS tag for word:', word, pos);
          }
        });


        // Автотест: финальная проверка данных
        const invalidEntries = Object.entries(newData).filter(([word, pos]) => {
          return !word || typeof word !== 'string' || !pos || !POS_COLORS.hasOwnProperty(pos);
        });

        if (invalidEntries.length > 0) {
          console.error('[SyntaxHighlight] Found invalid entries:', invalidEntries);
          // Очищаем невалидные
          invalidEntries.forEach(([word]) => delete newData[word]);
        }

        ruMorphologyRef.current = newData;
        setHighlightData(newData);
      } catch (error) {
        console.error('[SyntaxHighlight] Error analyzing text:', error);
        setHighlightData({});
      }
    };

    // Debounce: анализируем только после паузы в наборе текста
    const timeoutId = setTimeout(analyzeText, 500);
    return () => clearTimeout(timeoutId);
  }, [syntaxHighlightEnabled, markdownContent]);

  const toggleSyntaxHighlight = async () => {
    const newValue = !syntaxHighlightEnabled;

    // Вызываем внешний callback, если он передан
    if (onSyntaxHighlightChange) {
      onSyntaxHighlightChange(newValue);
    }

    // Сохраняем состояние в документе
    if (document?.id) {
      try {
        await onSave({
          ...document,
          syntax_highlight_enabled: newValue
        });
      } catch (error) {
        console.error('[SyntaxHighlight] Failed to save state:', error);
      }
    }

    // Очищаем данные подсветки при выключении
    if (syntaxHighlightEnabled) {
      setHighlightData({});
    }
  };

  const handleEditorChange = (markdown) => {
    // Убираем экранирование точек в нумерованных списках
    let cleanMarkdown = markdown.replace(/(\d+)\\\./g, '$1.');

    // Заменяем типографские символы на ASCII
    cleanMarkdown = cleanMarkdown
      .replace(/['']/g, "'")  // Типографские одинарные кавычки
      .replace(/[""]/g, '"')  // Типографские двойные кавычки
      .replace(/—/g, '--')    // Длинное тире
      .replace(/–/g, '-')     // Среднее тире
      .replace(/…/g, '...')   // Многоточие
      .replace(/ /g, ' '); // Неразрывный пробел

    // Гарантируем, что первая строка всегда H1
    const lines = cleanMarkdown.split('\n');
    if (lines.length > 0 && lines[0]) {
      const firstLine = lines[0].trim();

      // Если первая строка не H1 - исправляем
      if (!firstLine.startsWith('# ')) {
        const titleText = firstLine.replace(/^#+\s*/, '').trim() || 'Без названия';
        lines[0] = `# ${titleText}`;
        cleanMarkdown = lines.join('\n');
      }
    }

    setMarkdownContent(cleanMarkdown);
  };

  return (
    <div className="document-editor-container">
      {/* Toolbar */}
      <div className="editor-toolbar-minimal">
        <div className="toolbar-left">
          <div className="syntax-highlight-toggle">
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={syntaxHighlightEnabled}
                onChange={toggleSyntaxHighlight}
                className="toggle-checkbox"
              />
              <span className="toggle-slider"></span>
              <span className="toggle-text">Подсветка синтаксиса</span>
            </label>
          </div>

          <div style={{ position: 'relative', marginLeft: '16px' }} ref={hotkeysRef}>
            <button
              className="toolbar-btn-minimal"
              onClick={() => setShowHotkeys(!showHotkeys)}
              title="Горячие клавиши"
            >
              <TerminalSquare size={18} />
            </button>

            {showHotkeys && (
              <div className="hotkeys-dropdown">
                <div className="hotkeys-title">Горячие клавиши</div>
                <div className="hotkey-item">
                  <span className="hotkey-keys">Cmd + B</span>
                  <span className="hotkey-desc">Жирный текст</span>
                </div>
                <div className="hotkey-item">
                  <span className="hotkey-keys">Cmd + I</span>
                  <span className="hotkey-desc">Курсив</span>
                </div>
                <div className="hotkey-item">
                  <span className="hotkey-keys">Cmd + K</span>
                  <span className="hotkey-desc">Код</span>
                </div>
                <div className="hotkey-item">
                  <span className="hotkey-keys">Cmd + Shift + X</span>
                  <span className="hotkey-desc">Зачеркнутый</span>
                </div>
                <div className="hotkeys-divider"></div>
                <div className="hotkey-item">
                  <span className="hotkey-keys"># Текст</span>
                  <span className="hotkey-desc">Заголовок H1</span>
                </div>
                <div className="hotkey-item">
                  <span className="hotkey-keys">## Текст</span>
                  <span className="hotkey-desc">Заголовок H2</span>
                </div>
                <div className="hotkey-item">
                  <span className="hotkey-keys">1. Текст</span>
                  <span className="hotkey-desc">Нумерованный список</span>
                </div>
                <div className="hotkey-item">
                  <span className="hotkey-keys">- Текст</span>
                  <span className="hotkey-desc">Маркированный список</span>
                </div>
                <div className="hotkey-item">
                  <span className="hotkey-keys">{'>'} Текст</span>
                  <span className="hotkey-desc">Цитата</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="toolbar-right">
          <button
            className={`toolbar-btn-minimal ${document.is_bookmarked ? 'bookmarked' : ''}`}
            onClick={() => onToggleBookmark && onToggleBookmark(document.id)}
            title={document.is_bookmarked ? 'Удалить из закладок' : 'Добавить в закладки'}
          >
            <Bookmark size={18} fill={document.is_bookmarked ? 'currentColor' : 'none'} />
          </button>
          <button
            className="toolbar-btn-minimal"
            onClick={handleDelete}
            title="Удалить документ"
          >
            <Trash2 size={18} />
          </button>
          <button
            className="toolbar-btn-minimal"
            onClick={onClose}
            title="Закрыть документ"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Milkdown Editor */}
      <div className="editor-container">
        <div className="milkdown-wrapper">
          <MilkdownProvider>
            <MilkdownEditor
              content={markdownContent}
              onChange={handleEditorChange}
              syntaxHighlightEnabled={syntaxHighlightEnabled}
              highlightData={highlightData}
            />
          </MilkdownProvider>
        </div>
      </div>
    </div>
  );
}
