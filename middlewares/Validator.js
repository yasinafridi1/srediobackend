const validateBody = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });

    if (error) {
      error.isJoi = true; // add joi flag
      throw error;
    }

    next();
  };
};

export default validateBody;
