"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GangJoinRequestStatus = exports.GangRecruitmentType = void 0;
var GangRecruitmentType;
(function (GangRecruitmentType) {
    GangRecruitmentType[GangRecruitmentType["Disabled"] = 0] = "Disabled";
    GangRecruitmentType[GangRecruitmentType["Approval"] = 1] = "Approval";
    GangRecruitmentType[GangRecruitmentType["Open"] = 2] = "Open";
})(GangRecruitmentType || (exports.GangRecruitmentType = GangRecruitmentType = {}));
var GangJoinRequestStatus;
(function (GangJoinRequestStatus) {
    GangJoinRequestStatus["Pending"] = "PENDING";
    GangJoinRequestStatus["Accepted"] = "ACCEPTED";
    GangJoinRequestStatus["Rejected"] = "REJECTED";
    GangJoinRequestStatus["Cancelled"] = "CANCELLED";
})(GangJoinRequestStatus || (exports.GangJoinRequestStatus = GangJoinRequestStatus = {}));
//# sourceMappingURL=GangRecruitment.js.map