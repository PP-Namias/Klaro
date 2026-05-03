"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.accountRelations = exports.sessionRelations = exports.userRelations = exports.verification = exports.account = exports.session = exports.user = void 0;
var drizzle_orm_1 = require("drizzle-orm");
var pg_core_1 = require("drizzle-orm/pg-core");
exports.user = (0, pg_core_1.pgTable)("user", {
    id: (0, pg_core_1.text)("id").primaryKey(),
    name: (0, pg_core_1.text)("name").notNull(),
    email: (0, pg_core_1.text)("email").notNull().unique(),
    emailVerified: (0, pg_core_1.boolean)("email_verified").default(false).notNull(),
    image: (0, pg_core_1.text)("image"),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at")
        .defaultNow()
        .$onUpdate(function () { /* @__PURE__ */ return new Date(); })
        .notNull(),
});
exports.session = (0, pg_core_1.pgTable)("session", {
    id: (0, pg_core_1.text)("id").primaryKey(),
    expiresAt: (0, pg_core_1.timestamp)("expires_at").notNull(),
    token: (0, pg_core_1.text)("token").notNull().unique(),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at")
        .$onUpdate(function () { /* @__PURE__ */ return new Date(); })
        .notNull(),
    ipAddress: (0, pg_core_1.text)("ip_address"),
    userAgent: (0, pg_core_1.text)("user_agent"),
    userId: (0, pg_core_1.text)("user_id")
        .notNull()
        .references(function () { return exports.user.id; }, { onDelete: "cascade" }),
}, function (table) { return [(0, pg_core_1.index)("session_userId_idx").on(table.userId)]; });
exports.account = (0, pg_core_1.pgTable)("account", {
    id: (0, pg_core_1.text)("id").primaryKey(),
    accountId: (0, pg_core_1.text)("account_id").notNull(),
    providerId: (0, pg_core_1.text)("provider_id").notNull(),
    userId: (0, pg_core_1.text)("user_id")
        .notNull()
        .references(function () { return exports.user.id; }, { onDelete: "cascade" }),
    accessToken: (0, pg_core_1.text)("access_token"),
    refreshToken: (0, pg_core_1.text)("refresh_token"),
    idToken: (0, pg_core_1.text)("id_token"),
    accessTokenExpiresAt: (0, pg_core_1.timestamp)("access_token_expires_at"),
    refreshTokenExpiresAt: (0, pg_core_1.timestamp)("refresh_token_expires_at"),
    scope: (0, pg_core_1.text)("scope"),
    password: (0, pg_core_1.text)("password"),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at")
        .$onUpdate(function () { /* @__PURE__ */ return new Date(); })
        .notNull(),
}, function (table) { return [(0, pg_core_1.index)("account_userId_idx").on(table.userId)]; });
exports.verification = (0, pg_core_1.pgTable)("verification", {
    id: (0, pg_core_1.text)("id").primaryKey(),
    identifier: (0, pg_core_1.text)("identifier").notNull(),
    value: (0, pg_core_1.text)("value").notNull(),
    expiresAt: (0, pg_core_1.timestamp)("expires_at").notNull(),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at")
        .defaultNow()
        .$onUpdate(function () { /* @__PURE__ */ return new Date(); })
        .notNull(),
}, function (table) { return [(0, pg_core_1.index)("verification_identifier_idx").on(table.identifier)]; });
exports.userRelations = (0, drizzle_orm_1.relations)(exports.user, function (_a) {
    var many = _a.many;
    return ({
        sessions: many(exports.session),
        accounts: many(exports.account),
    });
});
exports.sessionRelations = (0, drizzle_orm_1.relations)(exports.session, function (_a) {
    var one = _a.one;
    return ({
        user: one(exports.user, {
            fields: [exports.session.userId],
            references: [exports.user.id],
        }),
    });
});
exports.accountRelations = (0, drizzle_orm_1.relations)(exports.account, function (_a) {
    var one = _a.one;
    return ({
        user: one(exports.user, {
            fields: [exports.account.userId],
            references: [exports.user.id],
        }),
    });
});
