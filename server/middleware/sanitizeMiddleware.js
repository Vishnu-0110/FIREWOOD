const isObject = (value) => value && typeof value === 'object' && !Array.isArray(value);

const sanitizeValue = (value) => {
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }

  if (!isObject(value)) {
    return value;
  }

  const sanitized = {};

  Object.keys(value).forEach((key) => {
    // Block Mongo operators and dotted-path injection keys.
    if (key.startsWith('$') || key.includes('.')) {
      return;
    }

    sanitized[key] = sanitizeValue(value[key]);
  });

  return sanitized;
};

const sanitizeRequest = (req, res, next) => {
  if (req.body && isObject(req.body)) {
    req.body = sanitizeValue(req.body);
  }

  if (req.params && isObject(req.params)) {
    Object.assign(req.params, sanitizeValue(req.params));
  }

  if (req.query && isObject(req.query)) {
    const cleaned = sanitizeValue(req.query);
    Object.keys(req.query).forEach((key) => {
      if (!(key in cleaned)) {
        delete req.query[key];
      }
    });
    Object.entries(cleaned).forEach(([key, value]) => {
      req.query[key] = value;
    });
  }

  next();
};

module.exports = sanitizeRequest;