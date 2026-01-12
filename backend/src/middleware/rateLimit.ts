import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

// Custom handler for rate limit exceeded
const rateLimitHandler = (req: Request, res: Response) => {
  res.status(429).json({
    error: 'Too many requests',
    message: 'You have exceeded the rate limit. Please try again later.',
    retryAfter: res.getHeader('Retry-After'),
  });
};

// Common options for all rate limiters (handles Vercel/proxy environments)
const commonOptions = {
  standardHeaders: true,
  legacyHeaders: false,
  // Disable validation for forwarded headers (handled by trust proxy)
  validate: { xForwardedForHeader: false },
};

/**
 * Strict rate limiter for login attempts
 * 10 attempts per 15 minutes per IP
 * Prevents brute force attacks
 */
export const loginLimiter = rateLimit({
  ...commonOptions,
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per window
  message: {
    error: 'Too many login attempts',
    message: 'Too many login attempts. Please try again after 15 minutes.'
  },
  handler: rateLimitHandler,
  skipSuccessfulRequests: false, // Count all requests
});

/**
 * Rate limiter for registration
 * 3 registrations per hour per IP
 * Prevents spam account creation
 */
export const registerLimiter = rateLimit({
  ...commonOptions,
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 registrations per hour
  message: {
    error: 'Too many registrations',
    message: 'Too many registration attempts. Please try again later.'
  },
  handler: rateLimitHandler,
});

/**
 * General API rate limiter
 * 300 requests per minute per IP
 * Prevents abuse of authenticated endpoints
 */
export const apiLimiter = rateLimit({
  ...commonOptions,
  windowMs: 60 * 1000, // 1 minute
  max: 300, // 300 requests per minute
  message: {
    error: 'Rate limit exceeded',
    message: 'Too many requests. Please slow down.'
  },
  handler: rateLimitHandler,
  skip: (req: Request) => {
    // Skip rate limiting for health checks
    return req.path === '/api/health';
  },
});

/**
 * Strict limiter for password reset requests
 * 3 attempts per hour per IP
 */
export const passwordResetLimiter = rateLimit({
  ...commonOptions,
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: {
    error: 'Too many password reset attempts',
    message: 'Too many password reset requests. Please try again later.'
  },
  handler: rateLimitHandler,
});

/**
 * Limiter for file uploads
 * 20 uploads per hour per IP
 */
export const uploadLimiter = rateLimit({
  ...commonOptions,
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  message: {
    error: 'Upload limit exceeded',
    message: 'Too many file uploads. Please try again later.'
  },
  handler: rateLimitHandler,
});

/**
 * Rate limiter for tenant portal (public endpoints)
 * 10 requests per 15 minutes per IP
 * Prevents spam ticket submissions
 */
export const tenantPortalLimiter = rateLimit({
  ...commonOptions,
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: {
    error: 'Too many requests',
    message: 'Too many requests from this IP. Please try again later.'
  },
  handler: rateLimitHandler,
});
