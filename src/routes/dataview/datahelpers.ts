import { goto } from "$app/navigation";
import {
  type ApplicationHistoryType,
  ApplicationStatuses,
  type DataHistory,
  FilingType,
  type RevisionsType,
  UserRoles,
  UserTypes,
} from "$lib/helpers";
import { faker } from "@faker-js/faker";

export function getStatuses(
  currentStatus: ApplicationStatuses,
  fileType: FilingType,
): ApplicationStatuses[] {
  if (
    fileType === FilingType.Trademark &&
    currentStatus == ApplicationStatuses.AwaitingExaminer
  ) {
    return [
      ApplicationStatuses.Publication,
      ApplicationStatuses.Re_conduct,
      ApplicationStatuses.Rejected,
      ApplicationStatuses.Withdrawn,
    ];
  }
  if (
    fileType === FilingType.Trademark &&
    currentStatus == ApplicationStatuses.Rejected
  ) {
    return [
      ApplicationStatuses.Publication,
      // ApplicationStatuses.Re_conduct
    ];
  }
  if (
    fileType === FilingType.Trademark &&
    currentStatus == ApplicationStatuses.AwaitingRecordalProcess
  ) {
    return [ApplicationStatuses.Approved, ApplicationStatuses.AwaitingPayment];
  }
  if (
    fileType === FilingType.Trademark &&
    currentStatus == ApplicationStatuses.AwaitingCertificateConfirmation
  ) {
    return [ApplicationStatuses.Rejected, ApplicationStatuses.Active];
  }
  if (
    [
      ApplicationStatuses.AwaitingSearch,
      ApplicationStatuses.FormalityFail,
      ApplicationStatuses.Re_conduct,
      // ApplicationStatuses.KivSearch
    ].includes(currentStatus)
  ) {
    const values = [
      ApplicationStatuses.FormalityFail,
      ApplicationStatuses.AwaitingExaminer,
      // ApplicationStatuses.KivSearch
    ];
    values.filter((x) => x === currentStatus);
    return values;
  } else if (
    [
      ApplicationStatuses.AwaitingExaminer,
      ApplicationStatuses.KivExaminer,
    ].includes(currentStatus)
  ) {
    const values = [
      // ApplicationStatuses.KivExaminer,
      ApplicationStatuses.Active,
      ApplicationStatuses.Re_conduct,
      ApplicationStatuses.Rejected,
    ];
    values.filter((x) => x === currentStatus);
    return values;
  } else return [];
}

export function mapStatusOptionToString(obj: ApplicationStatuses): string {
  switch (obj) {
    case ApplicationStatuses.AwaitingSearch:
      return "Revert back to -Awaiting Search-";
    case ApplicationStatuses.AwaitingExaminer:
      return "Formality Pass";
    case ApplicationStatuses.KivSearch:
      return "Search KIV";
    case ApplicationStatuses.KivExaminer:
      return "Examiner Kiv";
    case ApplicationStatuses.FormalityFail:
      return "Formality Failed";
    case ApplicationStatuses.Re_conduct:
      return "Re-conduct Search";
    case ApplicationStatuses.Active:
    case ApplicationStatuses.Approved:
      return "Approve";
    case ApplicationStatuses.Rejected:
      return "Reject";
    case ApplicationStatuses.Publication:
      return "Publication";
    case ApplicationStatuses.Withdrawn:
      return "Withdraw";
    case ApplicationStatuses.AppealRequest:
      return "Appeal Requested";
    case ApplicationStatuses.NewOpposition:
      return "New Opposition";
    case ApplicationStatuses.AwaitingCounter:
      return "Awaiting Counter";
    case ApplicationStatuses.Amendment:
      return "Amendment";
    case ApplicationStatuses.AwaitingRecordalProcess:
      return "Awaiting Recordal Process";
    case ApplicationStatuses.NewOpposition:
      return "New Opposition";
    case ApplicationStatuses.AwaitingCounter:
      return "Awaiting Counter Statement";
    default:
      return "-";
  }
}

export function getNewStatusColour(obj: ApplicationStatuses | null): string {
  switch (obj) {
    case ApplicationStatuses.AwaitingPayment:
      return "#8a00c2";
    case ApplicationStatuses.AwaitingSearch:
    case ApplicationStatuses.AwaitingExaminer:
      return "#468a46";
    case ApplicationStatuses.KivSearch:
    case ApplicationStatuses.KivExaminer:
      return "#cfcec3";
    case ApplicationStatuses.FormalityFail:
    case ApplicationStatuses.Re_conduct:
    case ApplicationStatuses.Rejected:
      return "#FAA0A0";
    case ApplicationStatuses.Active:
    case ApplicationStatuses.Approved:
      return "#468a46";
    case ApplicationStatuses.Publication:
      return "#468a46";
    case ApplicationStatuses.AwaitingRecordalProcess:
      return "#29C5F6";
    case ApplicationStatuses.AppealRequest:
      return "#ede064ff";
    case null:
      return "";
    default:
      return "#cfcec3";
  }
}

export function getRevisionStatuses(
  currentStatus: ApplicationStatuses,
): ApplicationStatuses[] {
  let responses: ApplicationStatuses[] = [];
  switch (currentStatus) {
    case ApplicationStatuses.AwaitingSearch:
    case ApplicationStatuses.FormalityFail:
    case ApplicationStatuses.Re_conduct:
    case ApplicationStatuses.KivSearch:
      responses = [
        ApplicationStatuses.AwaitingExaminer,
        ApplicationStatuses.FormalityFail,
        // ApplicationStatuses.KivSearch
      ];
      break;
    case ApplicationStatuses.KivExaminer:
    case ApplicationStatuses.Rejected:
      responses = [
        ApplicationStatuses.Re_conduct,
        ApplicationStatuses.Publication,
      ];
      break;
    case ApplicationStatuses.AwaitingExaminer:
      responses = [
        ApplicationStatuses.Approved,
        ApplicationStatuses.Rejected,
        ApplicationStatuses.Re_conduct,
        // ApplicationStatuses.KivExaminer
      ];
      break;
  }
  responses.filter((x) => x === currentStatus);
  return responses;
}

export function showTreatUpdateAppButton(
  currentStatus: ApplicationStatuses,
  applicationType: FilingType,
  userroles: UserRoles[],
) {
  let hasRequiredPatentSearchPatentRoles = [
    UserRoles.PatentSearch,
    UserRoles.Tech,
  ];
  let hasRequiredTrademarkSearchPatentRoles = [
    UserRoles.TrademarkSearch,
    UserRoles.Tech,
  ];
  let hasRequiredDesignSearchPatentRoles = [
    UserRoles.DesignSearch,
    UserRoles.Tech,
  ];
  let hasRequiredPatentExamRoles = [UserRoles.PatentExaminer, UserRoles.Tech];
  let hasRequiredTrademarkExamRoles = [
    UserRoles.TrademarkExaminer,
    UserRoles.Tech,
  ];
  let hasRequiredDesignExamRoles = [UserRoles.DesignExaminer, UserRoles.Tech];
  let searchOffice = [
    ApplicationStatuses.KivSearch,
    ApplicationStatuses.FormalityFail,
    ApplicationStatuses.AwaitingSearch,
    ApplicationStatuses.Re_conduct,
  ];
  let examinerOffice = [
    ApplicationStatuses.KivExaminer,
    ApplicationStatuses.Rejected,
    ApplicationStatuses.AwaitingExaminer,
  ];
  if (
    applicationType === FilingType.Patent &&
    searchOffice.includes(currentStatus) &&
    userroles.filter((x) => hasRequiredPatentSearchPatentRoles.includes(x))
      .length >= 1
  ) {
    return true;
  }
  if (
    applicationType === FilingType.Patent &&
    examinerOffice.includes(currentStatus) &&
    userroles.filter((x) => hasRequiredPatentExamRoles.includes(x)).length >= 1
  ) {
    return true;
  }

  if (
    applicationType === FilingType.Design &&
    searchOffice.includes(currentStatus) &&
    userroles.filter((x) => hasRequiredDesignSearchPatentRoles.includes(x))
      .length >= 1
  ) {
    return true;
  }
  if (
    applicationType === FilingType.Design &&
    examinerOffice.includes(currentStatus) &&
    userroles.filter((x) => hasRequiredDesignExamRoles.includes(x)).length >= 1
  ) {
    return true;
  }
  if (
    applicationType === FilingType.Trademark &&
    searchOffice.includes(currentStatus) &&
    userroles.filter((x) => hasRequiredTrademarkSearchPatentRoles.includes(x))
      .length >= 1
  ) {
    return true;
  }
  return (
    applicationType === FilingType.Trademark &&
    examinerOffice.includes(currentStatus) &&
    userroles.filter((x) => hasRequiredTrademarkExamRoles.includes(x)).length >=
      1
  );
}

export function getHistoryData(revision: RevisionsType | null) {
  const dataList: DataHistory[] = [];
  const statuses = Object.values(ApplicationStatuses);
  for (let i = 0; i < 10; i++) {
    const beforeStatus = statuses[Math.floor(Math.random() * statuses.length)];
    const afterStatus = statuses[Math.floor(Math.random() * statuses.length)];
    const selectedBefore = [beforeStatus, null];
    const selectedAfter = [afterStatus, null];
    let randoomBNumber = Math.random();
    randoomBNumber = randoomBNumber >= 0.5 ? 1 : 0;
    dataList.push({
      ticketId: randoomBNumber == 0 ? null : "sample_ticketid",
      affected: revision?.field ?? "-",
      date: faker.date.soon().toString().split("GMT")[0],
      applicationType: faker.lorem.word(),
      creator: {
        id: faker.internet.ip(),
        name: faker.person.fullName(),
      },
      message: faker.lorem.sentences(2),
      beforeStatus: selectedBefore[randoomBNumber],
      afterStatus: selectedAfter[randoomBNumber],
    });
  }
  return {
    title: `History of ${revision?.field ?? "-"}`,
    description: "",
    dataList: dataList,
  };
}

export function getAppHistories() {
  const dataList: ApplicationHistoryType[] = [];
  const statuses = Object.values(ApplicationStatuses);
  for (let i = 0; i < 10; i++) {
    const afterStatus = statuses[Math.floor(Math.random() * statuses.length)];
    dataList.push({
      type: faker.lorem.word(),
      status: afterStatus,
      paymentId: faker.database.mongodbObjectId(),
      date: faker.date.soon().toString().split("GMT")[0],
      oldData: faker.lorem.paragraph(5),
      dataChangeField: "patentAbstract",
      newData: faker.lorem.paragraph(5),
      letters: [
        {
          url: faker.internet.url(),
          name: faker.lorem.word(),
        },
        {
          url: faker.internet.url(),
          name: faker.lorem.word(),
        },
        {
          url: faker.internet.url(),
          name: faker.lorem.word(),
        },
        {
          url: faker.internet.url(),
          name: faker.lorem.word(),
        },
      ],
    });
  }
  return dataList;
}

export function CanUpdateApplication(
  loggedInId: string,
  creatorId: string,
  userRoles: UserRoles[],
  applicationStatuses: ApplicationStatuses,
) {
  // can only update if user is creator or support
  const isCreator = creatorId === loggedInId;
  const isAdminSupport = userRoles.includes(UserRoles.Tech);
  return isCreator || isAdminSupport;
  const canUpdate =
    (isCreator &&
      [
        ApplicationStatuses.FormalityFail,
        ApplicationStatuses.AwaitingPayment,
        ApplicationStatuses.AwaitingSearch,
        ApplicationStatuses.Active,
        ApplicationStatuses.Rejected,
      ].includes(applicationStatuses)) ||
    isAdminSupport;
  return canUpdate;
}

export function CanTreatApplication(
  userRoles: UserRoles[],
  type: FilingType,
  applicationStatus: ApplicationStatuses,
  appHistory?: [],
) {
  let hasRole: boolean = false;
  if (
    [
      ApplicationStatuses.Re_conduct,
      ApplicationStatuses.FormalityFail,
      ApplicationStatuses.KivSearch,
      ApplicationStatuses.Rejected,
      ApplicationStatuses.AwaitingSearch,
      ApplicationStatuses.Publication,
    ].includes(applicationStatus)
  ) {
    if (type === FilingType.Design) {
      hasRole = userRoles.includes(UserRoles.DesignSearch);
    }
    if (type === FilingType.Patent) {
      hasRole = userRoles.some((x) =>
        [UserRoles.PatentSearch, UserRoles.Tech].includes(x),
      );
    }

    if (type === FilingType.Trademark) {
      hasRole = userRoles.some((x) =>
        [UserRoles.TrademarkSearch, UserRoles.Tech].includes(x),
      );
    }
  }

  if (
    applicationStatus === ApplicationStatuses.KivExaminer ||
    applicationStatus === ApplicationStatuses.AwaitingExaminer ||
    applicationStatus === ApplicationStatuses.Rejected
  ) {
    if (type === FilingType.Patent) {
      hasRole = userRoles.some((x) =>
        [UserRoles.PatentExaminer, UserRoles.Tech].includes(x),
      );
    }

    if (type == FilingType.Design) {
      hasRole = userRoles.some((x) => [UserRoles.DesignExaminer].includes(x));
    }

    if (type == FilingType.Trademark) {
      hasRole = userRoles.some((x) =>
        [UserRoles.TrademarkExaminer, UserRoles.Tech].includes(x),
      );
    }
  }
  if (applicationStatus === ApplicationStatuses.Rejected) {
    if (type === FilingType.Patent) {
      hasRole = userRoles.some((x) =>
        [
          UserRoles.PatentExaminer,
          UserRoles.Tech,
          UserRoles.AppealExaminer,
        ].includes(x),
      );
    }

    if (type == FilingType.Design) {
      hasRole = userRoles.some((x) =>
        [UserRoles.DesignExaminer, UserRoles.AppealExaminer].includes(x),
      );
    }

    if (type == FilingType.Trademark) {
      hasRole = userRoles.some((x) =>
        [
          UserRoles.TrademarkExaminer,
          UserRoles.Tech,
          UserRoles.AppealExaminer,
        ].includes(x),
      );
    }
  }
  if (
    applicationStatus === ApplicationStatuses.AwaitingCertificateConfirmation ||
    applicationStatus === ApplicationStatuses.AwaitingRecordalProcess
  ) {
    if (type === FilingType.Trademark) {
      hasRole = userRoles.some((x) =>
        [UserRoles.TrademarkCertification, UserRoles.Tech].includes(x),
      );
    }
  }
  if (
    applicationStatus === ApplicationStatuses.AwaitingCertificateConfirmation
  ) {
    if (type === FilingType.Patent || type === FilingType.Design) {
      hasRole = userRoles.some((x) =>
        [
          UserRoles.PatentCertification,
          UserRoles.DesignCertification,
          UserRoles.SuperAdmin,
          UserRoles.Tech,
        ].includes(x),
      );
    }
  }

  return hasRole;
}

export function parseLoggedInUser(cookie: string) {
  const cookieUser = cookie
    .split(";")
    .find((x) => x.startsWith(" user=") || x.startsWith("user="));
  if (!cookieUser) {
    goto("/auth");
  } else {
    let user = cookieUser?.trimStart();
    user = user.slice(5);
    return JSON.parse(decodeURIComponent(user));
  }
}

export function mapAttchToString(name: string) {
  switch (name) {
    case "form2":
      return "Power of Attorney";
    case "cs":
      return "Claims and Specifications";
    case "patentDrawing":
      return "Patent Drawing";
    case "pdoc":
      return "Priority Document";
    case "any":
      return "Other document";
    case "pct":
      return "PCT document";
    case "nov":
      return "Novelty statement";
    case "designs":
      return "Designs representation";
    case "representation":
      return "Trademark representation";
    case "other1":
      return "Supporting document 1";
    case "other2":
      return "Supporting document 2";
    default:
      return "Supporting Document";
  }
}
export function getLetterName(letter: number): string {
  switch (letter) {
    case 0:
      return "New Application Receipt";
    case 1:
      return "New Application Acknowledgement";
    case 2:
      return "New Application Acceptance";
    case 3:
      return "New Application Certificate";
    case 4:
      return "New Application Rejection";
    case 5:
      return "Renewal Receipt";
    case 6:
      return "Renewal Acknowledgement";
    case 7:
      return "Renewal Certificate";
    case 8:
      return "Recordal Receipt";
    case 9:
      return "Recordal Acknowledgement";
    case 10:
      return "Recordal Certificate";
    case 11:
      return "Assignment Receipt";
    case 12:
      return "Assignment Acknowledgement";
    case 13:
      return "Assignment Certificate";
    case 14:
      return "Assignment Rejection";
    case 15:
      return "New Opposition Receipt";
    case 16:
      return "New Opposition Acknowledgement";
    case 17:
      return "Opposition Response Receipt";
    case 18:
      return "Opposition Response Acknowledgement";
    case 19:
      return "Opposition Resolution Receipt";
    case 20:
      return "Opposition Resolution Acknowledgement";
    case 21:
      return "New Application Certificate Acknowledgement";
    case 22:
      return "New Application Certificate Receipt";
    case 23:
      return "Status Request Receipt";
    case 24:
      return "Status Request Acknowledgement";
    case 25:
      return "Merger Receipt";
    case 26:
      return "Merger Acknowledgement";
    case 27:
      return "Merger Certificate";
    case 28:
      return "Registered User Receipt";
    case 29:
      return "Registered User Acknowledgement";
    case 30:
      return "Registered User Certificate";
    case 31:
      return "Change of Address Acknowledgement";
    case 32:
      return "Change of Name Acknowledgement";
    case 33:
      return "Change of Address Receipt";
    case 34:
      return "Change of Name Receipt";
    case 35:
      return "Clerical Update Receipt";
    case 36:
      return "Clerical Update Acknowledgement";
    case 37:
      return "New Trademark Application Receipt";
    case 38:
      return "Status Search Report";
    case 39:
      return "Status Search Receipt";
    case 40:
      return "Appeal Acknowledgement";
    case 41:
      return "Patent Renewal Acknowledgement Letter";
    case 42:
      return "Patent Renewal Receipt";
    case 43:
      return "Patent Renewal Certificate";
    case 44:
      return "Publication Status Update Acknowledgement";
    case 45:
      return "Publication Status Update Receipt";
    case 46:
      return "Publication Status Update Approval";
    case 47:
      return "Publication Status Update Refusal";
    case 48:
      return "Change of Name Certificate";
    case 49:
      return "Change of Address Certificate";
    case 50:
      return "Withdrawal Request Acknowledgement";
    case 51:
      return "Withdrawal Request Receipt";
    case 52:
      return "Withdrawal Request Approval";
    case 53:
      return "Withdrawal Request Refusal";
    case 54:
      return "Patent Assignment Acknowledgement";
    case 55:
      return "Patent License Acknowledgement";
    case 56:
      return "Patent Mortgage Acknowledgement";
    case 57:
      return "Patent Merger Acknowledgement";
    case 58:
      return "Patent CTC Acknowledgement";
    case 59:
      return "Patent Amendment Acknowledgement";
    case 60:
      return "Patent Assignment Refusal Letter";
    case 61:
      return "Patent License Refusal Letter";
    case 62:
      return "Patent Mortgage Refusal Letter";
    case 63:
      return "Patent Merger Refusal Letter";
    case 64:
      return "Patent CTC Refusal Letter";
    case 65:
      return "Patent Amendment Refusal Letter";
    case 66:
      return "Patent Assignment Receipt";
    case 67:
      return "Patent License Receipt";  
    case 68:
      return "Patent Mortgage Receipt"; 
    case 69:
      return "Patent Merger Receipt";
    case 70:
      return "Patent CTC Receipt";
    case 71:
      return "Patent Amendment Receipt";
    default:
      return "Unknown Document";
  }
}
