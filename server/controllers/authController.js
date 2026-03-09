const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const { logAudit } = require('../utils/audit');

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: 24 * 60 * 60 * 1000
};

const register = async (req, res) => {
  const { name, password } = req.body;
  const email = String(req.body.email || '').trim().toLowerCase();

  const existing = await User.findOne({ email });
  if (existing) {
    return res.status(400).json({ message: 'Email already registered' });
  }

  const user = await User.create({ name, email, password });
  await logAudit({ user: user._id, action: 'REGISTER', module: 'AUTH', metadata: { email: user.email } });

  return res.status(201).json({ user: { id: user._id, name: user.name, email: user.email, role: user.role } });
};

const login = async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const { password } = req.body;
  const user = await User.findOne({ email });

  if (!user || !(await user.matchPassword(password))) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  await logAudit({ user: user._id, action: 'LOGIN', module: 'AUTH' });
  const token = generateToken(user._id);
  res.cookie('token', token, cookieOptions);

  return res.json({
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
    token
  });
};

const me = async (req, res) => {
  return res.json({ user: req.user });
};

const logout = async (req, res) => {
  if (req.user?._id) {
    await logAudit({ user: req.user._id, action: 'LOGOUT', module: 'AUTH' });
  }

  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  });

  return res.json({ message: 'Logged out successfully' });
};

module.exports = { register, login, me, logout };
