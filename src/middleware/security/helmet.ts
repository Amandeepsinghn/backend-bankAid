import helmetPkg from 'helmet';

export const helmetMiddleware = helmetPkg({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      scriptSrcAttr: ["'none'"],
      // swagger-ui-express injects inline <style> blocks; 'unsafe-inline' is required for /api-docs
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:'],
      fontSrc: ["'self'", 'data:'],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  // X-Frame-Options: DENY — belt-and-suspenders with frame-ancestors 'none' above
  xFrameOptions: { action: 'deny' },
  strictTransportSecurity: {
    maxAge: 31536000,    // 1 year
    includeSubDomains: true,
    preload: true,
  },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
});
