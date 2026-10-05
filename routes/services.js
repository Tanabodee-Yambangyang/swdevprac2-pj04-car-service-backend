/**
 * @swagger
 * {
 *   "/api/v1/services": {
 *     "get": {
 *       "tags": [
 *         "Service packages"
 *       ],
 *       "summary": "List active service packages",
 *       "responses": {
 *         "200": {
 *           "description": "Successful operation",
 *           "content": {
 *             "application/json": {
 *               "schema": {
 *                 "$ref": "#/components/schemas/ServiceListResponse"
 *               }
 *             }
 *           }
 *         },
 *         "429": {
 *           "$ref": "#/components/responses/Error429"
 *         },
 *         "500": {
 *           "$ref": "#/components/responses/Error500"
 *         }
 *       }
 *     },
 *     "post": {
 *       "tags": [
 *         "Service packages"
 *       ],
 *       "summary": "Create a service package (admin only)",
 *       "security": [
 *         {
 *           "bearerAuth": []
 *         }
 *       ],
 *       "requestBody": {
 *         "required": true,
 *         "content": {
 *           "application/json": {
 *             "schema": {
 *               "$ref": "#/components/schemas/ServiceInput"
 *             }
 *           }
 *         }
 *       },
 *       "responses": {
 *         "201": {
 *           "description": "Created",
 *           "content": {
 *             "application/json": {
 *               "schema": {
 *                 "$ref": "#/components/schemas/ServiceResponse"
 *               }
 *             }
 *           }
 *         },
 *         "400": {
 *           "$ref": "#/components/responses/Error400"
 *         },
 *         "401": {
 *           "$ref": "#/components/responses/Error401"
 *         },
 *         "403": {
 *           "$ref": "#/components/responses/Error403"
 *         },
 *         "429": {
 *           "$ref": "#/components/responses/Error429"
 *         },
 *         "500": {
 *           "$ref": "#/components/responses/Error500"
 *         }
 *       }
 *     }
 *   },
 *   "/api/v1/services/{id}": {
 *     "parameters": [
 *       {
 *         "name": "id",
 *         "in": "path",
 *         "required": true,
 *         "schema": {
 *           "type": "string",
 *           "pattern": "^[a-fA-F0-9]{24}$",
 *           "example": "507f1f77bcf86cd799439011"
 *         }
 *       }
 *     ],
 *     "get": {
 *       "tags": [
 *         "Service packages"
 *       ],
 *       "summary": "Read an active service package",
 *       "responses": {
 *         "200": {
 *           "description": "Successful operation",
 *           "content": {
 *             "application/json": {
 *               "schema": {
 *                 "$ref": "#/components/schemas/ServiceResponse"
 *               }
 *             }
 *           }
 *         },
 *         "404": {
 *           "$ref": "#/components/responses/Error404"
 *         },
 *         "429": {
 *           "$ref": "#/components/responses/Error429"
 *         },
 *         "500": {
 *           "$ref": "#/components/responses/Error500"
 *         }
 *       }
 *     },
 *     "put": {
 *       "tags": [
 *         "Service packages"
 *       ],
 *       "summary": "Update a service package (admin only)",
 *       "description": "Existing appointments retain their saved duration.",
 *       "security": [
 *         {
 *           "bearerAuth": []
 *         }
 *       ],
 *       "requestBody": {
 *         "required": true,
 *         "content": {
 *           "application/json": {
 *             "schema": {
 *               "$ref": "#/components/schemas/ServiceUpdate"
 *             }
 *           }
 *         }
 *       },
 *       "responses": {
 *         "200": {
 *           "description": "Successful operation",
 *           "content": {
 *             "application/json": {
 *               "schema": {
 *                 "$ref": "#/components/schemas/ServiceResponse"
 *               }
 *             }
 *           }
 *         },
 *         "400": {
 *           "$ref": "#/components/responses/Error400"
 *         },
 *         "401": {
 *           "$ref": "#/components/responses/Error401"
 *         },
 *         "403": {
 *           "$ref": "#/components/responses/Error403"
 *         },
 *         "404": {
 *           "$ref": "#/components/responses/Error404"
 *         },
 *         "429": {
 *           "$ref": "#/components/responses/Error429"
 *         },
 *         "500": {
 *           "$ref": "#/components/responses/Error500"
 *         }
 *       }
 *     },
 *     "delete": {
 *       "tags": [
 *         "Service packages"
 *       ],
 *       "summary": "Soft-delete a service package (admin only)",
 *       "description": "Marks isActive=false; appointment history remains available.",
 *       "security": [
 *         {
 *           "bearerAuth": []
 *         }
 *       ],
 *       "responses": {
 *         "200": {
 *           "description": "Successful operation",
 *           "content": {
 *             "application/json": {
 *               "schema": {
 *                 "$ref": "#/components/schemas/EmptyResponse"
 *               }
 *             }
 *           }
 *         },
 *         "401": {
 *           "$ref": "#/components/responses/Error401"
 *         },
 *         "403": {
 *           "$ref": "#/components/responses/Error403"
 *         },
 *         "404": {
 *           "$ref": "#/components/responses/Error404"
 *         },
 *         "429": {
 *           "$ref": "#/components/responses/Error429"
 *         },
 *         "500": {
 *           "$ref": "#/components/responses/Error500"
 *         }
 *       }
 *     }
 *   }
 * }
 */
const express = require("express");
const { getServices, getService, createService, updateService, deleteService } = require("../controllers/services");
const { protect, authorize } = require("../middleware/auth");
const { serialize } = require("../middleware/serialize");

const router = express.Router();
router.route("/").get(getServices).post(protect, authorize("admin"), serialize(createService));
router.route("/:id").get(getService).put(protect, authorize("admin"), serialize(updateService)).delete(protect, authorize("admin"), serialize(deleteService));

module.exports = router;
