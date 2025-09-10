import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import logger from '../utils/logger.js';

export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1]; // Extract the token
      const decoded = jwt.verify(token, process.env.JWT_SECRET); // Verify the token
      req.user = await User.findById(decoded.id).select('-password'); // Attach user to request
      next();
    } catch (error) {
      logger.error('Authentication failed in protect middleware:', {
        error: error.message,
        token: token ? 'provided' : 'missing',
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else {
    logger.warn('Authentication attempted without token', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.url
    });
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};
