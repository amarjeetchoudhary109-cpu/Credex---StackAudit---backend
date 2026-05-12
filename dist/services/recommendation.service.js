"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseLegacyPayload = parseLegacyPayload;
function parseLegacyPayload(description) {
    if (!description?.trim()) {
        return null;
    }
    try {
        return JSON.parse(description);
    }
    catch {
        return null;
    }
}
//# sourceMappingURL=recommendation.service.js.map