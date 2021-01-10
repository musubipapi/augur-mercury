export {};
declare global {
  interface Window {
    roamAlphaAPI: any;
  }
}

export interface IUserInfo {
  username: string;
  picture: string;
  name: string;
}

export enum TweetReturnString {
  first = "first tweet",
  last = "last tweet",
  every = "every tweet",
}
