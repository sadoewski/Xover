import pool from '../config/database.js';
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

export const rwprintController = {
  // === ENVIRONMENTS ===

  async getEnvironments(req, res) {
    try {
      const result = await pool.query(
        'SELECT * FROM rwprint_environments WHERE user_id = $1 ORDER BY created_at DESC',
        [req.userId]
      );
      res.json({ environments: result.rows });
    } catch (error) {
      console.error('Ошибка получения окружений:', error);
      res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
  },

  async createEnvironment(req, res) {
    const { name, description } = req.body;
    try {
      const result = await pool.query(
        'INSERT INTO rwprint_environments (user_id, name, description) VALUES ($1, $2, $3) RETURNING *',
        [req.userId, name, description || null]
      );
      res.status(201).json({ environment: result.rows[0] });
    } catch (error) {
      console.error('Ошибка создания окружения:', error);
      if (error.code === '23505') {
        res.status(400).json({ error: 'Окружение с таким именем уже существует' });
      } else {
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
      }
    }
  },

  async updateEnvironment(req, res) {
    const { id } = req.params;
    const { name, description } = req.body;
    try {
      const result = await pool.query(
        'UPDATE rwprint_environments SET name = COALESCE($1, name), description = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 AND user_id = $4 RETURNING *',
        [name, description, id, req.userId]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Окружение не найдено' });
      }
      res.json({ environment: result.rows[0] });
    } catch (error) {
      console.error('Ошибка обновления окружения:', error);
      res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
  },

  async deleteEnvironment(req, res) {
    const { id } = req.params;
    try {
      const result = await pool.query(
        'DELETE FROM rwprint_environments WHERE id = $1 AND user_id = $2 RETURNING *',
        [id, req.userId]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Окружение не найдено' });
      }
      res.json({ message: 'Окружение удалено' });
    } catch (error) {
      console.error('Ошибка удаления окружения:', error);
      res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
  },

  // === FOLDERS ===

  async getFolders(req, res) {
    const { environmentId } = req.params;
    try {
      const result = await pool.query(
        'SELECT f.* FROM rwprint_folders f JOIN rwprint_environments e ON f.environment_id = e.id WHERE f.environment_id = $1 AND e.user_id = $2 ORDER BY f.created_at',
        [environmentId, req.userId]
      );
      res.json({ folders: result.rows });
    } catch (error) {
      console.error('Ошибка получения папок:', error);
      res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
  },

  async createFolder(req, res) {
    const { environmentId } = req.params;
    const { name, parent_folder_id } = req.body;
    try {
      const result = await pool.query(
        'INSERT INTO rwprint_folders (environment_id, parent_folder_id, name) VALUES ($1, $2, $3) RETURNING *',
        [environmentId, parent_folder_id || null, name]
      );
      res.status(201).json({ folder: result.rows[0] });
    } catch (error) {
      console.error('Ошибка создания папки:', error);
      res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
  },

  async updateFolder(req, res) {
    const { id } = req.params;
    const { name, parent_folder_id } = req.body;
    try {
      const result = await pool.query(
        'UPDATE rwprint_folders f SET name = COALESCE($1, f.name), parent_folder_id = $2, updated_at = CURRENT_TIMESTAMP FROM rwprint_environments e WHERE f.id = $3 AND f.environment_id = e.id AND e.user_id = $4 RETURNING f.*',
        [name, parent_folder_id, id, req.userId]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Папка не найдена' });
      }
      res.json({ folder: result.rows[0] });
    } catch (error) {
      console.error('Ошибка обновления папки:', error);
      res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
  },

  async deleteFolder(req, res) {
    const { id } = req.params;
    try {
      const result = await pool.query(
        'DELETE FROM rwprint_folders f USING rwprint_environments e WHERE f.id = $1 AND f.environment_id = e.id AND e.user_id = $2 RETURNING f.*',
        [id, req.userId]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Папка не найдена' });
      }
      res.json({ message: 'Папка удалена' });
    } catch (error) {
      console.error('Ошибка удаления папки:', error);
      res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
  },

  // === DOCUMENTS ===

  async getDocuments(req, res) {
    const { environmentId } = req.params;
    const { folderId, bookmarked, sortBy } = req.query;
    try {
      let query = `
        SELECT d.* FROM rwprint_documents d
        JOIN rwprint_environments e ON d.environment_id = e.id
        WHERE d.environment_id = $1 AND e.user_id = $2
      `;
      const params = [environmentId, req.userId];

      if (folderId) {
        query += ' AND d.folder_id = $3';
        params.push(folderId);
      } else if (folderId === null || req.query.folderId === 'null') {
        query += ' AND d.folder_id IS NULL';
      }

      if (bookmarked === 'true') {
        query += ' AND d.is_bookmarked = true';
      }

      if (sortBy === 'alphabetical') {
        query += ' ORDER BY d.title ASC';
      } else if (sortBy === 'oldest') {
        query += ' ORDER BY d.created_at ASC';
      } else {
        query += ' ORDER BY d.created_at DESC';
      }

      const result = await pool.query(query, params);
      res.json({ documents: result.rows });
    } catch (error) {
      console.error('Ошибка получения документов:', error);
      res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
  },

  async getDocumentById(req, res) {
    const { id } = req.params;
    const { password } = req.body;
    try {
      const result = await pool.query(
        'SELECT d.* FROM rwprint_documents d JOIN rwprint_environments e ON d.environment_id = e.id WHERE d.id = $1 AND e.user_id = $2',
        [id, req.userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Документ не найден' });
      }

      const document = result.rows[0];

      // Проверка пароля если документ защищен
      if (document.is_password_protected) {
        if (!password) {
          return res.status(401).json({ error: 'Требуется пароль', passwordRequired: true });
        }
        const isValidPassword = await bcrypt.compare(password, document.password_hash);
        if (!isValidPassword) {
          return res.status(401).json({ error: 'Неверный пароль' });
        }
      }

      res.json({ document });
    } catch (error) {
      console.error('Ошибка получения документа:', error);
      res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
  },

  async createDocument(req, res) {
    const { environmentId } = req.params;
    const { title, content, folder_id, format, font_family, font_size, password } = req.body;
    try {
      let passwordHash = null;
      let isPasswordProtected = false;

      if (password) {
        passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
        isPasswordProtected = true;
      }

      const wordCount = content ? content.split(/\s+/).filter(w => w.length > 0).length : 0;
      const charCount = content ? content.length : 0;

      const result = await pool.query(
        `INSERT INTO rwprint_documents (environment_id, folder_id, title, content, format, font_family, font_size, is_password_protected, password_hash, word_count, char_count)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
        [environmentId, folder_id || null, title, content || '', format || 'md', font_family || null, font_size || null, isPasswordProtected, passwordHash, wordCount, charCount]
      );
      res.status(201).json({ document: result.rows[0] });
    } catch (error) {
      console.error('Ошибка создания документа:', error);
      res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
  },

  async updateDocument(req, res) {
    const { id } = req.params;
    const { title, content, folder_id, format, font_family, font_size, is_bookmarked, password } = req.body;
    try {
      let passwordHash = undefined;
      let isPasswordProtected = undefined;

      if (password !== undefined) {
        if (password) {
          passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
          isPasswordProtected = true;
        } else {
          passwordHash = null;
          isPasswordProtected = false;
        }
      }

      const wordCount = content ? content.split(/\s+/).filter(w => w.length > 0).length : undefined;
      const charCount = content !== undefined ? content.length : undefined;

      const result = await pool.query(
        `UPDATE rwprint_documents d SET
          title = COALESCE($1, d.title),
          content = COALESCE($2, d.content),
          folder_id = $3,
          format = COALESCE($4, d.format),
          font_family = $5,
          font_size = $6,
          is_bookmarked = COALESCE($7, d.is_bookmarked),
          is_password_protected = COALESCE($8, d.is_password_protected),
          password_hash = COALESCE($9, d.password_hash),
          word_count = COALESCE($10, d.word_count),
          char_count = COALESCE($11, d.char_count),
          updated_at = CURRENT_TIMESTAMP
         FROM rwprint_environments e
         WHERE d.id = $12 AND d.environment_id = e.id AND e.user_id = $13
         RETURNING d.*`,
        [title, content, folder_id, format, font_family, font_size, is_bookmarked, isPasswordProtected, passwordHash, wordCount, charCount, id, req.userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Документ не найден' });
      }

      res.json({ document: result.rows[0] });
    } catch (error) {
      console.error('Ошибка обновления документа:', error);
      res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
  },

  async deleteDocument(req, res) {
    const { id } = req.params;
    try {
      const result = await pool.query(
        'DELETE FROM rwprint_documents d USING rwprint_environments e WHERE d.id = $1 AND d.environment_id = e.id AND e.user_id = $2 RETURNING d.*',
        [id, req.userId]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Документ не найден' });
      }
      res.json({ message: 'Документ удален' });
    } catch (error) {
      console.error('Ошибка удаления документа:', error);
      res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
  },

  // === TAGS ===

  async getTags(req, res) {
    const { environmentId } = req.params;
    try {
      const result = await pool.query(
        'SELECT t.* FROM rwprint_tags t JOIN rwprint_environments e ON t.environment_id = e.id WHERE t.environment_id = $1 AND e.user_id = $2 ORDER BY t.name',
        [environmentId, req.userId]
      );
      res.json({ tags: result.rows });
    } catch (error) {
      console.error('Ошибка получения тегов:', error);
      res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
  },

  async createTag(req, res) {
    const { environmentId } = req.params;
    const { name, color } = req.body;
    try {
      const result = await pool.query(
        'INSERT INTO rwprint_tags (environment_id, name, color) VALUES ($1, $2, $3) RETURNING *',
        [environmentId, name, color || null]
      );
      res.status(201).json({ tag: result.rows[0] });
    } catch (error) {
      console.error('Ошибка создания тега:', error);
      if (error.code === '23505') {
        res.status(400).json({ error: 'Тег с таким именем уже существует' });
      } else {
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
      }
    }
  },

  async deleteTag(req, res) {
    const { id } = req.params;
    try {
      const result = await pool.query(
        'DELETE FROM rwprint_tags t USING rwprint_environments e WHERE t.id = $1 AND t.environment_id = e.id AND e.user_id = $2 RETURNING t.*',
        [id, req.userId]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Тег не найден' });
      }
      res.json({ message: 'Тег удален' });
    } catch (error) {
      console.error('Ошибка удаления тега:', error);
      res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
  },

  async addTagToDocument(req, res) {
    const { documentId, tagId } = req.params;
    try {
      await pool.query(
        'INSERT INTO rwprint_document_tags (document_id, tag_id) VALUES ($1, $2)',
        [documentId, tagId]
      );
      res.status(201).json({ message: 'Тег добавлен к документу' });
    } catch (error) {
      console.error('Ошибка добавления тега:', error);
      if (error.code === '23505') {
        res.status(400).json({ error: 'Тег уже добавлен к документу' });
      } else {
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
      }
    }
  },

  async removeTagFromDocument(req, res) {
    const { documentId, tagId } = req.params;
    try {
      const result = await pool.query(
        'DELETE FROM rwprint_document_tags WHERE document_id = $1 AND tag_id = $2',
        [documentId, tagId]
      );
      res.json({ message: 'Тег удален из документа' });
    } catch (error) {
      console.error('Ошибка удаления тега из документа:', error);
      res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
  },

  async getDocumentTags(req, res) {
    const { documentId } = req.params;
    try {
      const result = await pool.query(
        `SELECT t.* FROM rwprint_tags t
         JOIN rwprint_document_tags dt ON t.id = dt.tag_id
         WHERE dt.document_id = $1
         ORDER BY t.name`,
        [documentId]
      );
      res.json({ tags: result.rows });
    } catch (error) {
      console.error('Ошибка получения тегов документа:', error);
      res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
  },

  // === METADATA ===

  async getDocumentMetadata(req, res) {
    const { documentId } = req.params;
    try {
      const result = await pool.query(
        'SELECT * FROM rwprint_document_metadata WHERE document_id = $1',
        [documentId]
      );
      res.json({ metadata: result.rows });
    } catch (error) {
      console.error('Ошибка получения метаданных:', error);
      res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
  },

  async setDocumentMetadata(req, res) {
    const { documentId } = req.params;
    const { key, value } = req.body;
    try {
      const result = await pool.query(
        `INSERT INTO rwprint_document_metadata (document_id, key, value)
         VALUES ($1, $2, $3)
         ON CONFLICT (document_id, key)
         DO UPDATE SET value = $3, created_at = CURRENT_TIMESTAMP
         RETURNING *`,
        [documentId, key, value]
      );
      res.json({ metadata: result.rows[0] });
    } catch (error) {
      console.error('Ошибка установки метаданных:', error);
      res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
  },

  async deleteDocumentMetadata(req, res) {
    const { documentId, key } = req.params;
    try {
      await pool.query(
        'DELETE FROM rwprint_document_metadata WHERE document_id = $1 AND key = $2',
        [documentId, key]
      );
      res.json({ message: 'Метаданные удалены' });
    } catch (error) {
      console.error('Ошибка удаления метаданных:', error);
      res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
  },

  // === BOOKMARKS ===
  async getAllBookmarks(req, res) {
    try {
      const result = await pool.query(
        `SELECT d.*, e.name as environment_name, e.id as environment_id
         FROM rwprint_documents d
         JOIN rwprint_environments e ON d.environment_id = e.id
         WHERE e.user_id = $1 AND d.is_bookmarked = true
         ORDER BY d.updated_at DESC`,
        [req.userId]
      );
      res.json({ bookmarks: result.rows });
    } catch (error) {
      console.error('Ошибка получения закладок:', error);
      res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
  },

  // === STORAGE STATS ===
  async getStorageStats(req, res) {
    try {
      const result = await pool.query(
        `SELECT
          COUNT(*) as totalDocuments,
          COALESCE(SUM(file_size), 0) as totalSize,
          COALESCE(SUM(word_count), 0) as totalWords,
          COALESCE(SUM(char_count), 0) as totalChars
         FROM rwprint_documents d
         JOIN rwprint_environments e ON d.environment_id = e.id
         WHERE e.user_id = $1`,
        [req.userId]
      );

      const stats = result.rows[0];
      res.json({
        totalDocuments: parseInt(stats.totaldocuments),
        totalSize: parseInt(stats.totalsize),
        totalWords: parseInt(stats.totalwords),
        totalChars: parseInt(stats.totalchars)
      });
    } catch (error) {
      console.error('Ошибка получения статистики:', error);
      res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
  },
};

