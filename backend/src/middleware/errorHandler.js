function notFound(req, res, next) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

function errorHandler(err, req, res, next) {
  console.error(err);

  if (err.code === "23505") {
    return res.status(409).json({ message: "That record already exists." });
  }
  if (err.code === "23503") {
    return res.status(400).json({ message: "Related record not found." });
  }

  const status = err.status || 500;
  res.status(status).json({
    message: err.message || "Something went wrong on the server.",
  });
}

module.exports = { notFound, errorHandler };
