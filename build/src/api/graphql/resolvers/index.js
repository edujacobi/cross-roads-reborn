"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolvers = void 0;
const dashboard_1 = require("./dashboard");
const users_1 = require("./users");
const gangs_1 = require("./gangs");
const season_1 = require("./season");
const events_1 = require("./events");
const admin_1 = require("./admin");
const me_1 = require("./me");
exports.resolvers = {
    UserDetail: users_1.userResolvers.UserDetail,
    Query: {
        ...me_1.meResolvers.Query,
        ...users_1.userResolvers.Query,
        ...gangs_1.gangResolvers.Query,
        ...dashboard_1.dashboardResolvers.Query,
        ...season_1.seasonResolvers.Query,
        ...events_1.eventResolvers.Query,
        ...admin_1.adminResolvers.Query,
    },
    Mutation: {
        ...me_1.meResolvers.Mutation,
        ...season_1.seasonResolvers.Mutation,
        ...events_1.eventResolvers.Mutation,
        ...admin_1.adminResolvers.Mutation,
        ...gangs_1.gangResolvers.Mutation,
    },
};
//# sourceMappingURL=index.js.map