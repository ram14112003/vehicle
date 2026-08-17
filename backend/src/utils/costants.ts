type IContext = {
  Id: string;
  adminId?: string;
  roles?: string;
};

export const ORDER = {
  STATUS: {
      PENDING: 0,   
      CONFIRMED: 1,     
    ACCEPTED: 2,
    STARTED: 3,
     COMPLETED: 4,
     PAYMENTCOMPLETED: 9,
    CLOSED: 5,
    CANCELLED: 6,
    DECLINED: 7 ,
    INITIALIZED: 8  

   
  }

}
export const SUCCESS_NAMES = new Set([
  "SUCCESS",
  "CAPTURED",
  "CHARGED",
  "COMPLETED",
  "PAID",        // <- add this so statusHint=PAID is accepted
]);

export const FAILURE_NAMES = new Set([
  "FAILED",
  "FAILURE",
  "CANCELLED",
  "VOID",
  "DECLINED",
  "AUTHENTICATION_FAILED",
  "AUTHORIZATION_FAILED",
]);

export const isTerminal = (code: number | string) => {
  const n = Number(code);
  return (
    n === ORDER.STATUS.PAYMENTCOMPLETED ||
    n === ORDER.STATUS.DECLINED ||
    n === ORDER.STATUS.CANCELLED
  );
};

export const toUiName = (code: number | string) => {
  const n = Number(code);
  if (n === ORDER.STATUS.PAYMENTCOMPLETED) return "PAID";
  if (n === ORDER.STATUS.DECLINED || n === ORDER.STATUS.CANCELLED) return "FAILED";
  if (n === ORDER.STATUS.INITIALIZED) return "PENDING";
  return "PENDING";
};


export const COMPANY = {
  NAME: {
    DANFOSS: "danfoss"
  }
}

export const USERS = {
  ROLES: {
    SUPERADMIN: "superadmin",
    ADMIN: "admin",
    USER: "user",
    EMPLOYEE: "employee",
    DRIVER: "driver"
  },
};

export const VEHICLESTATUS = {
  STATUS: {
     UNAVAILABLE:40, 
    AVAILABLE:10, 
     BOOKED:20,
    MAINTENANCE:30, 
  },
};

export const USERSTATUS = {
  USER_STATUS: {
     ACTIVE: "active", 
    INACTIVE:"inactive",
    SUSPENDED: "suspended",
    PENDING:"pending"
  },
};

export type { IContext };
