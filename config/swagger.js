const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Finance Data Processing & Access Control API",
      version: "1.0.0",
      description:
        "A robust backend API for managing financial records with role-based access control. Built with Node.js, Express, and MongoDB.",
      contact: {
        name: "API Support",
        email: "support@financeapp.com",
      },
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 5000}`,
        description: "Development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Enter your JWT token. Example: Bearer <token>",
        },
      },
      schemas: {
        // --- Auth ---
        RegisterInput: {
          type: "object",
          required: ["name", "email", "password"],
          properties: {
            name: { type: "string", example: "John Doe" },
            email: {
              type: "string",
              format: "email",
              example: "john@example.com",
            },
            password: {
              type: "string",
              minLength: 6,
              example: "SecurePass123",
            },
          },
        },
        LoginInput: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: {
              type: "string",
              format: "email",
              example: "john@example.com",
            },
            password: { type: "string", example: "SecurePass123" },
          },
        },
        AuthResponse: {
          type: "object",
          properties: {
            message: { type: "string" },
            flag: { type: "integer", example: 1 },
            data: {
              type: "object",
              properties: {
                token: { type: "string" },
                user: { $ref: "#/components/schemas/User" },
              },
            },
          },
        },

        // --- User ---
        User: {
          type: "object",
          properties: {
            _id: { type: "string" },
            name: { type: "string" },
            email: { type: "string" },
            role: { $ref: "#/components/schemas/Role" },
            isActive: { type: "boolean" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        UpdateRoleInput: {
          type: "object",
          required: ["role"],
          properties: {
            role: { type: "string", description: "Role ObjectId" },
          },
        },

        // --- Role ---
        Role: {
          type: "object",
          properties: {
            _id: { type: "string" },
            name: { type: "string", enum: ["viewer", "analyst", "admin"] },
            permissions: {
              type: "array",
              items: { type: "string" },
              example: ["read", "write"],
            },
            description: { type: "string" },
          },
        },
        CreateRoleInput: {
          type: "object",
          required: ["name"],
          properties: {
            name: { type: "string", enum: ["viewer", "analyst", "admin"] },
            permissions: {
              type: "array",
              items: {
                type: "string",
                enum: ["read", "write", "delete", "manage_users"],
              },
            },
            description: { type: "string" },
          },
        },

        // --- Transaction ---
        Transaction: {
          type: "object",
          properties: {
            _id: { type: "string" },
            title: { type: "string" },
            amount: { type: "number" },
            type: { type: "string", enum: ["income", "expense"] },
            category: { type: "string" },
            date: { type: "string", format: "date-time" },
            description: { type: "string" },
            tags: { type: "array", items: { type: "string" } },
            isDeleted: { type: "boolean" },
            createdBy: { $ref: "#/components/schemas/User" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        CreateTransactionInput: {
          type: "object",
          required: ["title", "amount", "type", "category"],
          properties: {
            title: { type: "string", example: "Salary" },
            amount: { type: "number", example: 5000 },
            type: {
              type: "string",
              enum: ["income", "expense"],
              example: "income",
            },
            category: { type: "string", example: "salary" },
            date: { type: "string", format: "date-time" },
            description: {
              type: "string",
              example: "Monthly salary for March",
            },
            tags: {
              type: "array",
              items: { type: "string" },
              example: ["monthly", "regular"],
            },
          },
        },

        // --- Generic Responses ---
        SuccessResponse: {
          type: "object",
          properties: {
            message: { type: "string" },
            flag: { type: "integer", example: 1 },
            data: { type: "object" },
          },
        },
        ErrorResponse: {
          type: "object",
          properties: {
            message: { type: "string" },
            flag: { type: "integer", example: -1 },
            errors: { type: "array", items: { type: "object" } },
          },
        },
        PaginatedResponse: {
          type: "object",
          properties: {
            message: { type: "string" },
            flag: { type: "integer", example: 1 },
            data: { type: "array", items: { type: "object" } },
            pagination: {
              type: "object",
              properties: {
                total: { type: "integer" },
                page: { type: "integer" },
                limit: { type: "integer" },
                totalPages: { type: "integer" },
                hasNextPage: { type: "boolean" },
                hasPrevPage: { type: "boolean" },
              },
            },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ["./routes/*.js"],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
