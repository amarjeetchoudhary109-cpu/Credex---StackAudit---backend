"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const drizzle_orm_1 = require("drizzle-orm");
const index_1 = require("../../db/index");
const schema_1 = require("../../db/schema");
const apiError_1 = require("../../utils/apiError");
const token_1 = require("../../utils/token");
const SALT_ROUNDS = 10;
function sanitizeUser(row) {
    const { passwordHash, ...rest } = row;
    return {
        ...rest,
        hasCredentialLogin: Boolean(passwordHash),
    };
}
class AuthService {
    async register(input) {
        const existing = await index_1.db
            .select()
            .from(schema_1.usersTable)
            .where((0, drizzle_orm_1.eq)(schema_1.usersTable.email, input.email))
            .limit(1);
        if (existing[0]) {
            throw new apiError_1.ApiError(409, "Email already registered");
        }
        const passwordHash = await bcrypt_1.default.hash(input.password, SALT_ROUNDS);
        const [user] = await index_1.db
            .insert(schema_1.usersTable)
            .values({
            email: input.email,
            passwordHash,
            name: input.name ?? null,
        })
            .returning();
        if (!user) {
            throw new apiError_1.ApiError(500, "Failed to create user");
        }
        const token = (0, token_1.signToken)({ sub: user.id, email: user.email });
        return { user: sanitizeUser(user), token };
    }
    async login(input) {
        const [user] = await index_1.db
            .select()
            .from(schema_1.usersTable)
            .where((0, drizzle_orm_1.eq)(schema_1.usersTable.email, input.email))
            .limit(1);
        if (!user?.passwordHash) {
            throw new apiError_1.ApiError(401, "Invalid credentials");
        }
        const ok = await bcrypt_1.default.compare(input.password, user.passwordHash);
        if (!ok) {
            throw new apiError_1.ApiError(401, "Invalid credentials");
        }
        const token = (0, token_1.signToken)({ sub: user.id, email: user.email });
        return { user: sanitizeUser(user), token };
    }
    /**
     * Returns the local user row. If missing (e.g. signed in only via Supabase Auth),
     * inserts a shell row using JWT `sub` + email so FKs like `audits.user_id` work.
     */
    async getMe(userId, email) {
        const [byId] = await index_1.db
            .select()
            .from(schema_1.usersTable)
            .where((0, drizzle_orm_1.eq)(schema_1.usersTable.id, userId))
            .limit(1);
        if (byId) {
            return sanitizeUser(byId);
        }
        const normalizedEmail = email.trim();
        if (!normalizedEmail) {
            throw new apiError_1.ApiError(400, "Token has no email claim; cannot provision local user");
        }
        try {
            const [created] = await index_1.db
                .insert(schema_1.usersTable)
                .values({
                id: userId,
                email: normalizedEmail,
                passwordHash: null,
                name: null,
            })
                .returning();
            if (!created) {
                throw new apiError_1.ApiError(500, "Failed to provision user profile");
            }
            return sanitizeUser(created);
        }
        catch (err) {
            const code = err && typeof err === "object" && "code" in err
                ? String(err.code)
                : "";
            if (code === "23505") {
                throw new apiError_1.ApiError(409, "This email is already linked to another login method.");
            }
            throw err;
        }
    }
    async updateProfile(userId, input) {
        const updates = {};
        if ("name" in input && input.name !== undefined) {
            const raw = input.name;
            if (raw === null || raw === "") {
                updates.name = null;
            }
            else {
                const trimmed = raw.trim();
                updates.name = trimmed.length ? trimmed : null;
            }
        }
        if (Object.keys(updates).length === 0) {
            const [existing] = await index_1.db
                .select()
                .from(schema_1.usersTable)
                .where((0, drizzle_orm_1.eq)(schema_1.usersTable.id, userId))
                .limit(1);
            if (!existing) {
                throw new apiError_1.ApiError(404, "User not found");
            }
            return sanitizeUser(existing);
        }
        const [row] = await index_1.db
            .update(schema_1.usersTable)
            .set(updates)
            .where((0, drizzle_orm_1.eq)(schema_1.usersTable.id, userId))
            .returning();
        if (!row) {
            throw new apiError_1.ApiError(404, "User not found");
        }
        return sanitizeUser(row);
    }
    async changePassword(userId, input) {
        const [user] = await index_1.db
            .select()
            .from(schema_1.usersTable)
            .where((0, drizzle_orm_1.eq)(schema_1.usersTable.id, userId))
            .limit(1);
        if (!user?.passwordHash) {
            throw new apiError_1.ApiError(400, "Password login is not enabled for this account.");
        }
        const ok = await bcrypt_1.default.compare(input.currentPassword, user.passwordHash);
        if (!ok) {
            throw new apiError_1.ApiError(401, "Current password is incorrect");
        }
        const passwordHash = await bcrypt_1.default.hash(input.newPassword, SALT_ROUNDS);
        await index_1.db
            .update(schema_1.usersTable)
            .set({ passwordHash })
            .where((0, drizzle_orm_1.eq)(schema_1.usersTable.id, userId));
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=auth.service.js.map