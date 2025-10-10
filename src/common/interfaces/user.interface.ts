export interface IUser {
  id: string;
  email: string;
  role?: string;
  branchId?: string;
  companyId?: string;
}

export interface IRequestWithUser extends Request {
  user: IUser;
}
