export function errorMiddleware(err, req, res, next) {
    console.error('[AURORA SHIELD ERROR]:', err);
    const statusCode = err.status || err.statusCode || 500;
    const message = err.message || 'An unexpected regulatory scanning error occurred. Please try again.';
    res.status(statusCode).json({
        error: err.name || 'InternalServerError',
        message,
        timestamp: new Date().toISOString()
    });
}
