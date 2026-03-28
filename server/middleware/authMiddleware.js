const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
};

const authFailure = (req, res, message, code, shouldClearCookie = false) => {
  if (shouldClearCookie) {
    res.clearCookie('token', authCookieOptions);
  }

  console.warn(`[AUTH] ${code} ${req.method} ${req.originalUrl} ip=${req.ip}`);
  return res.status(401).json({ message, code });
};

const protect = async (req, res, next) => {
  const cookieToken = req.cookies?.token;
  const authHeader = req.headers.authorization || '';
  const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
  const token = cookieToken || bearerToken;

  if (!token) {
    return authFailure(req, res, 'Not authorized, token missing', 'TOKEN_MISSING');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return authFailure(req, res, 'Not authorized, user not found', 'USER_NOT_FOUND', Boolean(cookieToken));
    }

    req.user = user;
    return next();
  } catch (error) {
    if (error?.name === 'TokenExpiredError') {
      return authFailure(req, res, 'Session expired, please login again', 'TOKEN_EXPIRED', Boolean(cookieToken));
    }
    return authFailure(req, res, 'Not authorized, token invalid', 'TOKEN_INVALID', Boolean(cookieToken));
  }
};

module.exports = { protect };
