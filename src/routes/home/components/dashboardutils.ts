import type { FileStatsType } from "$lib/helpers";

export enum FileStatsData {
  totalPatents,
  totalDesigns,
  totalPending,
  renewalDue,
  totalTextTile,
  totalNonTextile,
  totalConventional,
  totalNonConventional,
  totalPct,
  pendingStats,
  newPatent,
  newPatentPending,
  newPatentUpdate,
  newPatentUpdatePending,
  newPatentRenew,
  newPatentRenewPending,
  newDesignTotal,
  newDesignPending,
  newDesignUpdate,
  newDesignUpdatePending,
  newDesignRenew,
  newDesignRenewPending,
}

export function DataMapper(
  datatype: FileStatsData,
  data: FileStatsType[],
  isStaff: boolean
) {
  const listNotShow = [0, 1, 2, 11, 12];
  if (!isStaff) {
    listNotShow.splice(2, 1);
  }
  switch (datatype) {
    case FileStatsData.totalPatents:
      return data.find((x) => x.type === "totalPatents")?.count ?? 0;
    case FileStatsData.totalDesigns:
      return data.find((x) => x.type === "totalDesigns")?.count ?? 0;
    case FileStatsData.renewalDue:
      return data.find((x) => x.type === "renewalDue")?.count ?? 0;
    case FileStatsData.totalConventional:
      return data.find((x) => x.type === "totalConventional")?.count ?? 0;
    case FileStatsData.totalTextTile:
      return data.find((x) => x.type === "totalTextile")?.count ?? 0;
    case FileStatsData.totalNonTextile:
      return data.find((x) => x.type === "totalNonTextile")?.count ?? 0;
    case FileStatsData.totalNonConventional:
      return data.find((x) => x.type === "totalNonConventional")?.count ?? 0;
    case FileStatsData.totalPct:
      return data.find((x) => x.type === "totalPct")?.count ?? 0;
    case FileStatsData.newPatent:
      return (
        data.find(
          (x) =>
            x.fileType === 0 &&
            x.type === 0 &&
            !listNotShow.includes(x.status as number)
        )?.count ?? 0
      );
    case FileStatsData.newDesignTotal: {
      let val = 0;
      val = data
        .filter(
          (x) =>
            x.fileType === 1 &&
            x.type === 0 &&
            !listNotShow.includes(x.status as number)
        )
        .map((x) => x.count)
        ?.reduce((x, y) => x + y, 0);
      return val;
    }
    case FileStatsData.newPatentRenew:
      return (
        data.find(
          (x) =>
            x.fileType === 0 &&
            x.type === 1 &&
            !listNotShow.includes(x.status as number)
        )?.count ?? 0
      );
    case FileStatsData.newDesignRenew:
      return (
        data.find(
          (x) =>
            x.fileType === 1 &&
            x.type === 1 &&
            !listNotShow.includes(x.status as number)
        )?.count ?? 0
      );
    case FileStatsData.newDesignRenewPending: {
      const _filtered = data.filter(
        (x) =>
          x.fileType === 1 &&
          x.type === 1 &&
          !listNotShow.includes(x.status as number)
      );
      const _filteredValues = _filtered.reduce(
        //new app: awaiting search: 20
        (acc, curr) => {
          if (!acc[mapTypeToString(curr.type as number)]) {
            acc[mapTypeToString(curr.type as number)] = [
              {
                applicationType: curr.type as number,
                statusType: curr.status as number,
                status: mapStatusToString(curr.status as number),
                count: curr.count,
              },
            ];
          } else {
            acc[mapTypeToString(curr.type as number)].push({
              applicationType: curr.type as number,
              statusType: curr.status as number,
              status: mapStatusToString(curr.status as number),
              count: curr.count,
            });
          }
          return acc;
        },
        {} as {
          [typeRep: string]: {
            applicationType: number;
            count: number;
            status: string;
            statusType: number;
          }[];
        }
      );
      const finalRes = [];
      for (const valuesKey in _filteredValues) {
        finalRes.push({ valuesKey, values: _filteredValues[valuesKey] });
      }
      return finalRes;
    }
    case FileStatsData.newPatentRenewPending: {
      const _filtered = data.filter(
        (x) =>
          x.fileType === 0 &&
          x.type === 1 &&
          !listNotShow.includes(x.status as number)
      );
      const _filteredValues = _filtered.reduce(
        //new app: awaiting search: 20
        (acc, curr) => {
          if (!acc[mapTypeToString(curr.type as number)]) {
            acc[mapTypeToString(curr.type as number)] = [
              {
                applicationType: curr.type as number,
                statusType: curr.status as number,
                status: mapStatusToString(curr.status as number),
                count: curr.count,
              },
            ];
          } else {
            acc[mapTypeToString(curr.type as number)].push({
              applicationType: curr.type as number,
              statusType: curr.status as number,
              status: mapStatusToString(curr.status as number),
              count: curr.count,
            });
          }
          return acc;
        },
        {} as {
          [typeRep: string]: {
            applicationType: number;
            count: number;
            status: string;
            statusType: number;
          }[];
        }
      );
      const finalRes = [];
      for (const valuesKey in _filteredValues) {
        finalRes.push({ valuesKey, values: _filteredValues[valuesKey] });
      }
      return finalRes;
    }
    case FileStatsData.newDesignPending: {
      const _filtered = data.filter(
        (x) =>
          x.fileType === 1 &&
          x.type === 0 &&
          !listNotShow.includes(x.status as number)
      );
      const _filteredValues = _filtered.reduce(
        //new app: awaiting search: 20
        (acc, curr) => {
          if (!acc[mapTypeToString(curr.type as number)]) {
            acc[mapTypeToString(curr.type as number)] = [
              {
                applicationType: curr.type as number,
                statusType: curr.status as number,
                status: mapStatusToString(curr.status as number),
                count: curr.count,
              },
            ];
          } else {
            acc[mapTypeToString(curr.type as number)].push({
              applicationType: curr.type as number,
              statusType: curr.status as number,
              status: mapStatusToString(curr.status as number),
              count: curr.count,
            });
          }
          return acc;
        },
        {} as {
          [typeRep: string]: {
            applicationType: number;
            count: number;
            status: string;
            statusType: number;
          }[];
        }
      );
      const finalRes = [];
      for (const valuesKey in _filteredValues) {
        finalRes.push({ valuesKey, values: _filteredValues[valuesKey] });
      }
      return finalRes;
    }
    case FileStatsData.newPatentPending: {
      const _filtered = data.filter(
        (x) =>
          x.fileType === 0 &&
          x.type === 0 &&
          !listNotShow.includes(x.status as number)
      );
      const _filteredValues = _filtered.reduce(
        //new app: awaiting search: 20
        (acc, curr) => {
          if (!acc[mapTypeToString(curr.type as number)]) {
            acc[mapTypeToString(curr.type as number)] = [
              {
                applicationType: curr.type as number,
                statusType: curr.status as number,
                status: mapStatusToString(curr.status as number),
                count: curr.count,
              },
            ];
          } else {
            acc[mapTypeToString(curr.type as number)].push({
              applicationType: curr.type as number,
              statusType: curr.status as number,
              status: mapStatusToString(curr.status as number),
              count: curr.count,
            });
          }
          return acc;
        },
        {} as {
          [typeRep: string]: {
            applicationType: number;
            count: number;
            status: string;
            statusType: number;
          }[];
        }
      );
      const finalRes = [];
      for (const valuesKey in _filteredValues) {
        finalRes.push({ valuesKey, values: _filteredValues[valuesKey] });
      }
      return finalRes;
    }
    case FileStatsData.newDesignUpdatePending: {
      const _filtered = data.filter(
        (x) =>
          x.fileType === 1 &&
          x.type === 2 &&
          !listNotShow.includes(x.status as number)
      );
      const _filteredValues = _filtered.reduce(
        //new app: awaiting search: 20
        (acc, curr) => {
          if (!acc[mapTypeToString(curr.type as number)]) {
            acc[mapTypeToString(curr.type as number)] = [
              {
                applicationType: curr.type as number,
                statusType: curr.status as number,
                status: mapStatusToString(curr.status as number),
                count: curr.count,
              },
            ];
          } else {
            acc[mapTypeToString(curr.type as number)].push({
              applicationType: curr.type as number,
              statusType: curr.status as number,
              status: mapStatusToString(curr.status as number),
              count: curr.count,
            });
          }
          return acc;
        },
        {} as {
          [typeRep: string]: {
            applicationType: number;
            count: number;
            status: string;
            statusType: number;
          }[];
        }
      );
      const finalRes = [];
      for (const valuesKey in _filteredValues) {
        finalRes.push({ valuesKey, values: _filteredValues[valuesKey] });
      }
      return finalRes;
    }
    case FileStatsData.newPatentUpdatePending: {
      const _filtered = data.filter(
        (x) =>
          x.fileType === 0 &&
          x.type === 2 &&
          !listNotShow.includes(x.status as number)
      );
      const _filteredValues = _filtered.reduce(
        //new app: awaiting search: 20
        (acc, curr) => {
          if (!acc[mapTypeToString(curr.type as number)]) {
            acc[mapTypeToString(curr.type as number)] = [
              {
                applicationType: curr.type as number,
                statusType: curr.status as number,
                status: mapStatusToString(curr.status as number),
                count: curr.count,
              },
            ];
          } else {
            acc[mapTypeToString(curr.type as number)].push({
              applicationType: curr.type as number,
              statusType: curr.status as number,
              status: mapStatusToString(curr.status as number),
              count: curr.count,
            });
          }
          return acc;
        },
        {} as {
          [typeRep: string]: {
            applicationType: number;
            count: number;
            status: string;
            statusType: number;
          }[];
        }
      );
      const finalRes = [];
      for (const valuesKey in _filteredValues) {
        finalRes.push({ valuesKey, values: _filteredValues[valuesKey] });
      }
      return finalRes;
    }
    case FileStatsData.newPatentUpdate:
      return (
        data.find(
          (x) =>
            x.fileType == 0 &&
            x.type === 2 &&
            !listNotShow.includes(x.status as number)
        )?.count ?? 0
      );
    case FileStatsData.newDesignUpdate:
      return (
        data.find(
          (x) =>
            x.fileType == 1 &&
            x.type === 2 &&
            !listNotShow.includes(x.status as number)
        )?.count ?? 0
      );

    case FileStatsData.totalPending:
      return data
        .filter(
          (x) =>
            [0, 1, 11, 13, 14].find((f) => f === x.status) === undefined &&
            typeof x.type === "number" &&
            x.fileType == undefined
        )
        .map((x) => x.count)
        .reduce((a, b) => a + b, 0);
    case FileStatsData.pendingStats: {
      const filtered = data.filter(
        (x) =>
          [0, 1, 11, 13, 14].find((f) => f === x.status) === undefined &&
          typeof x.type === "number" &&
          x.fileType == undefined
      );
      const values = filtered.reduce(
        (acc, curr) => {
          if (!acc[mapTypeToString(curr.type as number)]) {
            acc[mapTypeToString(curr.type as number)] = [
              {
                applicationType: curr.type as number,
                statusType: curr.status as number,
                status: mapStatusToString(curr.status as number),
                count: curr.count,
              },
            ];
          } else {
            acc[mapTypeToString(curr.type as number)].push({
              applicationType: curr.type as number,
              statusType: curr.status as number,
              status: mapStatusToString(curr.status as number),
              count: curr.count,
            });
          }
          return acc;
        },
        {} as {
          [typeRep: string]: {
            applicationType: number;
            count: number;
            status: string;
            statusType: number;
          }[];
        }
      );
      let final = [];
      for (const valuesKey in values) {
        final.push({ valuesKey, values: values[valuesKey] });
      }
      return final;
    }
  }
}

export function mapTypeToString(type: number) {
  switch (type) {
    case 0:
      return "New Application";
    case 1:
      return "Renewal Application";
    case 2:
      return "Data Update";
    case 3:
      return "Data Capture";
    case 4:
      return "None";
    case 5:
      return "Assignment Application";
    case 6:
      return "Ownership change";
    case 7:
      return "Registered Users";
    case 8:
      return "Merger Application";
    case 9:
      return "Change of Applicant Name";
    case 10:
      return "Change of Applicant Address";
    case 11:
      return "Clerical Update";
    case 12:
      return "Status Search";
    case 13:
      return "Appeal Request";
    case 14:
      return "Publication Status Update";
    case 15:
      return "Withdrawal Request";
    case 16:
      return "New Opposition";
    case 17:
      return "Clerical Update";
    default:
      return "";
  }
}

export function mapStatusToString(status: number) {
  switch (status) {
    case 0:
      return "Active";
    case 1:
      return "Inactive";
    case 2:
      return "Awaiting Payment";
    case 3:
      return "Awaiting Search";
    case 4:
      return "Awaiting Examiner";
    case 5:
      return "Rejected By Examiner";
    case 6:
      return "Re_conduct";
    case 7:
      return "Formality Fail";
    case 8:
      return "Kiv Search";
    case 9:
      return "Kiv Examiner";
    case 10:
      return "Approved";
    case 11:
      return "Rejected";
    case 12:
      return "None";
    case 13:
      return "Auto-Approved";
    case 14:
      return "Publication";
    case 15:
      return "Opposition";
    case 16:
      return "Awaiting Counter";
    case 17:
      return "Awaiting Staff";
    case 18:
      return "Awaiting Resolution";
    case 19:
      return "Resolved";
    case 20:
      return "Awaiting Certification";
    case 21:
      return "Awaiting Confirmation";
    case 22:
      return "Awaiting Save";
    case 23:
      return "Awaiting Certificate Confirmation";
    case 24:
      return "Withdrawn";
    case 25:
      return "Awaiting Certificate Payment";
    case 26:
      return "Awaiting Recordal Process";
    case 27:
      return "Appeal Requested";
    case 28:
      return "Awaiting Status Update";
    case 29:
      return "Request Withdrawal";
    case 30:
      return "New Opposition";
    case 31:
      return "Awaiting Counter";
    case 32:
      return "Awaiting Approval";
    default:
      return "";
  }
}

export function mapStatusToColor(status: string) {
  switch (status) {
    case "Active":
      return "green";
    case "Inactive":
      return "red";
    case "Awaiting Payment":
      return "purple";
    case "Awaiting Certificate Payment":
      return "purple";
    case "Awaiting Search":
      return "yellow";
    case "Awaiting Examiner":
      return "yellow";
    case "Rejected By Examiner":
      return "red";
    case "RejectedBySearch":
      return "red";
    case "Re_conduct":
      return "red";
    case "Formality Fail":
      return "red";
    case "Kiv Search":
      return "gray";
    case "Kiv Examiner":
      return "gray";
    case "Approved":
      return "green";
    case "Rejected":
      return "red";
    case "Awaiting Recordal Process":
      return "blue";
    case "Appeal Requested":
      return "yellow";
    case "None":
      return "";
    case "Auto-Approved":
      return "green";
    case "Awaiting Status Update":
      return "yellow";
    case "Request Withdrawal":
      return "orange";
    case "New Opposition":
      return "yellow";
    default:
      return "";
  }
}

export function fileTypeToString(file: number) {
  switch (file) {
    case 0:
      return "Patent";
    case 1:
      return "Design";
    case 2:
      return "Trademark";
    default:
      return "";
  }
}
export function mapDateToString(data: string) {
  return Intl.DateTimeFormat("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
    weekday: "short",
    hour: "numeric",
    minute: "numeric",
    timeZone: "UTC",
  }).format(new Date(data));
}

export function mapDateToStringNoDate(data: string) {
  return Intl.DateTimeFormat("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
    weekday: "short",
  }).format(new Date(data));
}

export function mapPatentAppTypeToString(data: number) {
  switch (data) {
    case 0:
      return "Patent";
    case 1:
      return "Business Method";
    case 2:
      return "Utility Model";
    default:
      return "";
  }
}

export function mapPatentTypeToString(data: number) {
  switch (data) {
    case 0:
      return "Conventional";
    case 1:
      return "Non Conventional";
    case 2:
      return "PCT";
    default:
      return "";
  }
}
