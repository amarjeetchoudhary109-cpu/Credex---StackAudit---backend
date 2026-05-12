"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.changePasswordSchema = exports.updateProfileSchema = exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
exports.registerSchema = zod_1.z.object({
    email: zod_1.z.string().email().max(255),
    password: zod_1.z.string().min(8).max(72),
    name: zod_1.z.string().max(255).optional(),
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(1),
});
exports.updateProfileSchema = zod_1.z.object({
    name: zod_1.z
        .union([zod_1.z.string().max(255), zod_1.z.literal(""), zod_1.z.null()])
        .optional(),
});
exports.changePasswordSchema = zod_1.z.object({
    currentPassword: zod_1.z.string().min(1).max(72),
    newPassword: zod_1.z.string().min(8).max(72),
});
//# sourceMappingURL=auth.validation.js.map