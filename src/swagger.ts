import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Bank Aid — Account Unfreeze Assistant API',
      version: '1.0.0',
      description:
        'API for the Account Unfreeze Assistant app. Helps users with frozen bank accounts generate formal escalation letters.',
    },
    servers: [
      {
        url: 'http://localhost:8000',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        CaseSummary: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            bankName: { type: 'string', nullable: true },
            branchName: { type: 'string', nullable: true },
            declaredStuckAmount: { type: 'string' },
            ncrpNo: { type: 'string', nullable: true },
            exchangeName: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            lettersSent: { type: 'number' },
            lettersTotal: { type: 'number' },
            isComplete: { type: 'boolean' },
          },
        },
      },
    },
    tags: [
      { name: 'Auth', description: 'Registration, login, phone OTP, password reset' },
      { name: 'Subscription', description: 'Plans, Razorpay orders, payment verification' },
      { name: 'Form', description: 'Case form submission and retrieval' },
      { name: 'Letter', description: 'Letter generation, send tracking' },
      { name: 'Case', description: 'Case listing, detail with letter previews, home screen summary' },
    ],
  },
  apis: ['./src/api/**/*.route.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
