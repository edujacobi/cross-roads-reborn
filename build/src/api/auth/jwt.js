"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signAuthToken = signAuthToken;
exports.verifyAuthToken = verifyAuthToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const log_1 = require("#shared/log");
const JWT_SECRET = process.env.JWT_SECRET || "cr-reborn-admin-secret-key-2026";
const TOKEN_EXPIRY = "7d";
function signAuthToken(payload) {
    return jsonwebtoken_1.default.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}
function verifyAuthToken(token) {
    try {
        return jsonwebtoken_1.default.verify(token, JWT_SECRET);
    }
    catch (err) {
        log_1.logger.debug("Failed to verify JWT auth token", err);
        return null;
    }
}
//# sourceMappingURL=jwt.js.map