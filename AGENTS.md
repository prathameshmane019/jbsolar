{
  "openapi": "3.1.0",
  "info": {
    "title": "JB Solar API",
    "description": "JB Solar backend APIs for administration and vendor-agent workflows.",
    "version": "v1"
  },
  "servers": [
    {
      "url": "http://localhost:8080",
      "description": "Generated server url"
    }
  ],
  "security": [
    {
      "Bearer Authentication": []
    }
  ],
  "paths": {
    "/api/v1/vendors/{id}": {
      "put": {
        "tags": [
          "vendor-controller"
        ],
        "operationId": "update",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string",
              "format": "uuid"
            }
          }
        ],
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/VendorRequest"
              }
            }
          },
          "required": true
        },
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/VendorResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/v1/policy-plans/{id}": {
      "put": {
        "tags": [
          "policy-plan-controller"
        ],
        "operationId": "update_1",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string",
              "format": "uuid"
            }
          }
        ],
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/PolicyPlanRequest"
              }
            }
          },
          "required": true
        },
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/PolicyPlanResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/v1/vendors": {
      "get": {
        "tags": [
          "vendor-controller"
        ],
        "operationId": "list",
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "type": "array",
                  "items": {
                    "$ref": "#/components/schemas/VendorResponse"
                  }
                }
              }
            }
          }
        }
      },
      "post": {
        "tags": [
          "vendor-controller"
        ],
        "operationId": "create",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/VendorRequest"
              }
            }
          },
          "required": true
        },
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/VendorResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/v1/policy-plans": {
      "get": {
        "tags": [
          "policy-plan-controller"
        ],
        "operationId": "list_1",
        "parameters": [
          {
            "name": "activeOnly",
            "in": "query",
            "required": false,
            "schema": {
              "type": "boolean",
              "default": true
            }
          }
        ],
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "type": "array",
                  "items": {
                    "$ref": "#/components/schemas/PolicyPlanResponse"
                  }
                }
              }
            }
          }
        }
      },
      "post": {
        "tags": [
          "policy-plan-controller"
        ],
        "operationId": "create_1",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/PolicyPlanRequest"
              }
            }
          },
          "required": true
        },
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/PolicyPlanResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/v1/policies": {
      "get": {
        "tags": [
          "policy-controller"
        ],
        "operationId": "list_2",
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "type": "array",
                  "items": {
                    "$ref": "#/components/schemas/PolicyResponse"
                  }
                }
              }
            }
          }
        }
      },
      "post": {
        "tags": [
          "policy-controller"
        ],
        "operationId": "create_2",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/PolicyRequest"
              }
            }
          },
          "required": true
        },
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/PolicyResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/v1/farmers": {
      "get": {
        "tags": [
          "farmer-controller"
        ],
        "operationId": "list_3",
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "type": "array",
                  "items": {
                    "$ref": "#/components/schemas/FarmerResponse"
                  }
                }
              }
            }
          }
        }
      },
      "post": {
        "tags": [
          "farmer-controller"
        ],
        "operationId": "create_3",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/FarmerRequest"
              }
            }
          },
          "required": true
        },
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/FarmerResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/v1/auth/login": {
      "post": {
        "tags": [
          "auth-controller"
        ],
        "operationId": "login",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/LoginRequest"
              }
            }
          },
          "required": true
        },
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/TokenResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/v1/agents": {
      "get": {
        "tags": [
          "agent-controller"
        ],
        "operationId": "list_4",
        "parameters": [
          {
            "name": "vendorId",
            "in": "query",
            "required": false,
            "schema": {
              "type": "string",
              "format": "uuid"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "type": "array",
                  "items": {
                    "$ref": "#/components/schemas/AgentResponse"
                  }
                }
              }
            }
          }
        }
      },
      "post": {
        "tags": [
          "agent-controller"
        ],
        "operationId": "create_4",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/AgentRequest"
              }
            }
          },
          "required": true
        },
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/AgentResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/v1/policy-plans/{id}/status": {
      "patch": {
        "tags": [
          "policy-plan-controller"
        ],
        "operationId": "setStatus",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string",
              "format": "uuid"
            }
          },
          {
            "name": "status",
            "in": "query",
            "required": true,
            "schema": {
              "type": "string",
              "enum": [
                "ACTIVE",
                "INACTIVE"
              ]
            }
          }
        ],
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/PolicyPlanResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/v1/farmers/{id}": {
      "get": {
        "tags": [
          "farmer-controller"
        ],
        "operationId": "get",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string",
              "format": "uuid"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/FarmerResponse"
                }
              }
            }
          }
        }
      }
    }
  },
  "components": {
    "schemas": {
      "VendorRequest": {
        "type": "object",
        "properties": {
          "name": {
            "type": "string",
            "maxLength": 150,
            "minLength": 0
          },
          "contactPerson": {
            "type": "string",
            "maxLength": 100,
            "minLength": 0
          },
          "mobile": {
            "type": "string",
            "maxLength": 20,
            "minLength": 0
          },
          "email": {
            "type": "string",
            "format": "email",
            "maxLength": 150,
            "minLength": 0
          }
        },
        "required": [
          "name"
        ]
      },
      "VendorResponse": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "format": "uuid"
          },
          "name": {
            "type": "string"
          },
          "contactPerson": {
            "type": "string"
          },
          "mobile": {
            "type": "string"
          },
          "email": {
            "type": "string"
          },
          "status": {
            "type": "string",
            "enum": [
              "ACTIVE",
              "INACTIVE"
            ]
          },
          "createdAt": {
            "type": "string",
            "format": "date-time"
          }
        }
      },
      "PolicyPlanRequest": {
        "type": "object",
        "properties": {
          "name": {
            "type": "string",
            "maxLength": 150,
            "minLength": 0
          },
          "description": {
            "type": "string",
            "maxLength": 2000,
            "minLength": 0
          },
          "durationMonths": {
            "type": "integer",
            "format": "int32",
            "minimum": 1
          },
          "price": {
            "type": "number",
            "minimum": 0.01
          },
          "gstPercentage": {
            "type": "number",
            "minimum": 0
          },
          "termsAndConditions": {
            "type": "string",
            "maxLength": 5000,
            "minLength": 0
          }
        },
        "required": [
          "durationMonths",
          "gstPercentage",
          "name",
          "price"
        ]
      },
      "PolicyPlanResponse": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "format": "uuid"
          },
          "name": {
            "type": "string"
          },
          "description": {
            "type": "string"
          },
          "durationMonths": {
            "type": "integer",
            "format": "int32"
          },
          "price": {
            "type": "number"
          },
          "gstPercentage": {
            "type": "number"
          },
          "termsAndConditions": {
            "type": "string"
          },
          "status": {
            "type": "string",
            "enum": [
              "ACTIVE",
              "INACTIVE"
            ]
          }
        }
      },
      "PolicyRequest": {
        "type": "object",
        "properties": {
          "farmerId": {
            "type": "string",
            "format": "uuid"
          },
          "policyPlanId": {
            "type": "string",
            "format": "uuid"
          },
          "startDate": {
            "type": "string",
            "format": "date"
          },
          "vendorId": {
            "type": "string",
            "format": "uuid"
          }
        },
        "required": [
          "farmerId",
          "policyPlanId",
          "startDate"
        ]
      },
      "PolicyResponse": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "format": "uuid"
          },
          "policyNumber": {
            "type": "string"
          },
          "farmerId": {
            "type": "string",
            "format": "uuid"
          },
          "farmerName": {
            "type": "string"
          },
          "policyPlanId": {
            "type": "string",
            "format": "uuid"
          },
          "planName": {
            "type": "string"
          },
          "vendorId": {
            "type": "string",
            "format": "uuid"
          },
          "startDate": {
            "type": "string",
            "format": "date"
          },
          "endDate": {
            "type": "string",
            "format": "date"
          },
          "amount": {
            "type": "number"
          },
          "gstAmount": {
            "type": "number"
          },
          "totalAmount": {
            "type": "number"
          },
          "status": {
            "type": "string",
            "enum": [
              "PENDING",
              "ACTIVE",
              "EXPIRED",
              "CANCELLED"
            ]
          }
        }
      },
      "FarmerRequest": {
        "type": "object",
        "properties": {
          "fullName": {
            "type": "string",
            "maxLength": 150,
            "minLength": 0
          },
          "mobile": {
            "type": "string",
            "minLength": 1,
            "pattern": "^[+0-9][0-9+ -]{7,19}$"
          },
          "address": {
            "type": "string",
            "maxLength": 2000,
            "minLength": 0
          },
          "district": {
            "type": "string",
            "maxLength": 100,
            "minLength": 0
          },
          "taluka": {
            "type": "string",
            "maxLength": 100,
            "minLength": 0
          },
          "village": {
            "type": "string",
            "maxLength": 100,
            "minLength": 0
          }
        },
        "required": [
          "fullName",
          "mobile"
        ]
      },
      "FarmerResponse": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "format": "uuid"
          },
          "customerCode": {
            "type": "string"
          },
          "fullName": {
            "type": "string"
          },
          "mobile": {
            "type": "string"
          },
          "address": {
            "type": "string"
          },
          "district": {
            "type": "string"
          },
          "taluka": {
            "type": "string"
          },
          "village": {
            "type": "string"
          },
          "createdByAgentId": {
            "type": "string",
            "format": "uuid"
          },
          "createdAt": {
            "type": "string",
            "format": "date-time"
          }
        }
      },
      "LoginRequest": {
        "type": "object",
        "properties": {
          "mobile": {
            "type": "string",
            "minLength": 1
          },
          "password": {
            "type": "string",
            "minLength": 1
          }
        },
        "required": [
          "mobile",
          "password"
        ]
      },
      "TokenResponse": {
        "type": "object",
        "properties": {
          "accessToken": {
            "type": "string"
          },
          "tokenType": {
            "type": "string"
          },
          "expiresIn": {
            "type": "integer",
            "format": "int64"
          },
          "userId": {
            "type": "string",
            "format": "uuid"
          },
          "mobile": {
            "type": "string"
          },
          "role": {
            "type": "string",
            "enum": [
              "ADMIN",
              "VENDOR_AGENT"
            ]
          }
        }
      },
      "AgentRequest": {
        "type": "object",
        "properties": {
          "vendorId": {
            "type": "string",
            "format": "uuid"
          },
          "fullName": {
            "type": "string",
            "maxLength": 150,
            "minLength": 0
          },
          "mobile": {
            "type": "string",
            "minLength": 1,
            "pattern": "^[+0-9][0-9+ -]{7,19}$"
          },
          "initialPassword": {
            "type": "string",
            "maxLength": 100,
            "minLength": 10
          }
        },
        "required": [
          "fullName",
          "initialPassword",
          "mobile",
          "vendorId"
        ]
      },
      "AgentResponse": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "format": "uuid"
          },
          "userId": {
            "type": "string",
            "format": "uuid"
          },
          "vendorId": {
            "type": "string",
            "format": "uuid"
          },
          "vendorName": {
            "type": "string"
          },
          "fullName": {
            "type": "string"
          },
          "mobile": {
            "type": "string"
          },
          "status": {
            "type": "string",
            "enum": [
              "ACTIVE",
              "INACTIVE"
            ]
          }
        }
      }
    },
    "securitySchemes": {
      "Bearer Authentication": {
        "type": "http",
        "scheme": "bearer",
        "bearerFormat": "JWT"
      }
    }
  }
}

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
