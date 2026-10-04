import jwt from 'jsonwebtoken';
import { AuthenticationError } from '../utils/errors.js';

export const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('Token not provided');
    }

    const token = authHeader.substring(7);

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.userId = decoded.userId;
    req.username = decoded.username;

    next();
  } catch (error) {
    // JWT errors будут обработаны в errorHandler middleware
    next(error);
  }
};
