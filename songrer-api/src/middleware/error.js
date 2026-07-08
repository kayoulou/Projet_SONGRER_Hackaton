export function notFound(req, res) {
  res.status(404).json({ message: `Route introuvable: ${req.method} ${req.originalUrl}` });
}

export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);

  const status = error.statusCode || error.status || 500;
  const message = status >= 500 ? "Erreur serveur." : error.message;

  if (process.env.NODE_ENV !== "test") {
    console.error(error);
  }

  res.status(status).json({
    message,
    details: process.env.NODE_ENV === "production" ? undefined : error.details
  });
}

