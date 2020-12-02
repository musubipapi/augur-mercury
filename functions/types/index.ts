import { Request } from "express";

export interface IFirebaseRequests extends Request {
  user: any;
}
