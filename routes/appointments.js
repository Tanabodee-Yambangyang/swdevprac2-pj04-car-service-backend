/**
 * @swagger
 * {
 *   "/api/v1/appointments": {
 *     "get": {
 *       "tags": [
 *         "Appointments"
 *       ],
 *       "summary": "List own appointments; admins see all",
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
 *                 "$ref": "#/components/schemas/AppointmentListResponse"
 *               }
 *             }
 *           }
 *         },
 *         "401": {
 *           "$ref": "#/components/responses/Error401"
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
 *         "Appointments"
 *       ],
 *       "summary": "Create an appointment (member only)",
 *       "description": "Enforces UTC date, one service, one vehicle/day/member, global vehicle overlap, and three future appointments. Vehicle duration is saved on creation.",
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
 *               "$ref": "#/components/schemas/AppointmentInput"
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
 *                 "$ref": "#/components/schemas/AppointmentResponse"
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
 *         "409": {
 *           "$ref": "#/components/responses/Error409"
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
 *   "/api/v1/appointments/{id}": {
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
 *         "Appointments"
 *       ],
 *       "summary": "Read an appointment (owner or admin)",
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
 *                 "$ref": "#/components/schemas/AppointmentResponse"
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
 *     },
 *     "put": {
 *       "tags": [
 *         "Appointments"
 *       ],
 *       "summary": "Update an appointment (owner or admin)",
 *       "description": "Rechecks rules for the original owner, excluding this appointment. A different service uses its current duration; the same service retains the saved duration.",
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
 *               "$ref": "#/components/schemas/AppointmentUpdate"
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
 *                 "$ref": "#/components/schemas/AppointmentResponse"
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
 *         "409": {
 *           "$ref": "#/components/responses/Error409"
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
 *         "Appointments"
 *       ],
 *       "summary": "Delete an appointment (owner or admin)",
 *       "description": "Permanently removes the appointment and releases the booking slot.",
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
const { getAppointments, getAppointment, createAppointment, updateAppointment, deleteAppointment } = require("../controllers/appointments");
const { protect, authorize } = require("../middleware/auth");
const { serialize } = require("../middleware/serialize");

const router = express.Router();
router.use(protect);
router.get("/", getAppointments);
router.post("/", authorize("member"), serialize(createAppointment));
router.route("/:id").get(getAppointment).put(serialize(updateAppointment)).delete(serialize(deleteAppointment));

module.exports = router;
