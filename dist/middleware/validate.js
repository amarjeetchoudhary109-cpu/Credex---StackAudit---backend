"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateBody = validateBody;
exports.validateParams = validateParams;
const zod_1 = require("zod");
function formatZodIssues(issues) {
    return issues.map((err) => ({
        field: err.path.join("."),
        message: err.message,
    }));
}
function validateBody(schema) {
    return (req, res, next) => {
        try {
            req.body = schema.parse(req.body);
            next();
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return res.status(400).json({
                    success: false,
                    message: "Validation error",
                    errors: formatZodIssues(error.issues),
                });
            }
            next(error);
        }
    };
}
function validateParams(schema) {
    return (req, res, next) => {
        try {
            Object.assign(req.params, schema.parse(req.params));
            next();
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid parameters",
                    errors: formatZodIssues(error.issues),
                });
            }
            next(error);
        }
    };
}
//# sourceMappingURL=validate.js.map