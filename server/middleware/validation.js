const { validationResult } = require('express-validator');

exports.validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

exports.contentFilter = (req, res, next) => {
  const Filter = require('bad-words');
  const filter = new Filter();
  
  // PII patterns to check for
  const piiPatterns = {
    email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    phone: /(\+\d{1,3}[\s\-]?)?\(?\d{3}\)?[\s\-]?\d{3}[\s\-]?\d{4}/g,
    creditCard: /\d{4}[\s\-]?\d{4}[\s\-]?\d{4}[\s\-]?\d{4}/g,
    ssn: /\d{3}[\s\-]?\d{2}[\s\-]?\d{4}/g,
    address: /\d+\s+([a-zA-Z]+\s+){1,5}(st|ave|blvd|rd|drive|court|plaza|heights|lane)/i
  };

  // Check if content contains PII
  const containsPii = (text) => {
    if (!text) return false;
    
    // Check each PII pattern
    for (const pattern of Object.values(piiPatterns)) {
      if (pattern.test(text)) return true;
    }
    return false;
  };
  
  // Get content from request body - adjust as needed for your API structure
  const contentFields = ['content', 'text', 'message', 'description'];
  
  // Check all relevant fields
  for (const field of contentFields) {
    if (req.body[field]) {
      // Check for profanity
      if (filter.isProfane(req.body[field])) {
        return res.status(400).json({ 
          message: 'Content contains inappropriate language',
          field 
        });
      }
      
      // Check for PII
      if (containsPii(req.body[field])) {
        return res.status(400).json({ 
          message: 'Please do not share personal information',
          field 
        });
      }
    }
  }

  next();
};
