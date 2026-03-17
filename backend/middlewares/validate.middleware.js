const { z } = require('zod');

exports.validate = (schema, source = 'body') => {
  return (req, res, next) => {
    try {
      if (!schema) {
        console.error('Validation Error: No schema provided', { source, method: req.method, path: req.path });
        return res.status(500).json({
          message: 'Server misconfiguration: Validation schema missing',
          code: 'VALIDATION_CONFIG_ERROR',
          route: `${req.method} ${req.path}`, // Still safe for JSON response
        });
      }

      const data = req[source];
      console.log('Raw data', { source, method: req.method, path: req.path, data, type: typeof data });
      if (!data) {
        return res.status(400).json({ message: `No ${source} data provided`, code: 'MISSING_DATA' });
      }

      // Ensure data is an object before validation
      if (typeof data !== 'object' || data === null) {
        console.error('Invalid data type', { source, method: req.method, path: req.path, type: typeof data, data });
        return res.status(400).json({
          message: `Invalid ${source} data: Expected object, received ${typeof data}`,
          code: 'INVALID_DATA_TYPE',
          details: [{ message: `Expected object, received ${typeof data}`, path: [] }],
        });
      }

      const validatedData = schema.parse(data);
      req[`validated${source.charAt(0).toUpperCase() + source.slice(1)}`] = validatedData;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map((err) => ({
          field: err.path.join('.') || 'root',
          message: err.message,
        }));
        console.error('Validation Error', { source, method: req.method, path: req.path, errors, rawData: req[source] });
        return res.status(400).json({
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: errors,
          route: `${req.method} ${req.path}`, // Still safe for JSON response
        });
      }
      console.error('Unexpected Validation Error', { message: error.message, stack: error.stack });
      res.status(500).json({ message: 'Server error during validation', code: 'SERVER_ERROR' });
    }
  };
};