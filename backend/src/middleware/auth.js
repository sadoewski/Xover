import jwt from 'jsonwebtoken';

export const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Токен не предоставлен' });
    }

    const token = authHeader.substring(7);

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.userId = decoded.userId;
    req.username = decoded.username;

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Неверный токен' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Токен истёк' });
    }

    console.error('Ошибка аутентификации:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};
