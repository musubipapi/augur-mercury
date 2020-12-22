import axios from "axios";
import { CLOUD_FUNCTION_URL, auth, provider } from "../firebase/firebaseConfig";

const SendLoginToFirestore = async (
  authResult: firebase.auth.UserCredential
) => {
  const token = await auth.currentUser.getIdToken();
  const { isNewUser } = authResult.additionalUserInfo;
  //@ts-ignore
  const { accessToken, secret } = authResult.credential;
  if (isNewUser) {
    axios({
      method: "post",
      url: `${CLOUD_FUNCTION_URL}/api/newUser`,
      data: {
        accessToken,
        secret,
      },
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }).catch((e) => {
      throw new Error(e);
    });
  }
};

const SendBlocksToTwitter = async (data: string) => {
  const token = await auth.currentUser.getIdToken();
  try {
    const response = await axios({
      method: "post",
      url: `${CLOUD_FUNCTION_URL}/api/sendTweet`,
      data,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    return response;
  } catch (err) {
    throw new Error(err);
  }
};

const authListener = async (request: any, _sender, sendResponse: any) => {
  if (request.message === "sign_in") {
    try {
      const result = await auth.signInWithPopup(provider);
      SendLoginToFirestore(result);
      sendResponse({ message: "success" });
      chrome.storage.sync.set({ logged_in: true });
    } catch (err) {
      sendResponse({ message: "error" });
    }
  }

  if (request.message === "sign_out") {
    try {
      await auth.signOut();
      sendResponse({ message: "success" });
      chrome.storage.sync.set({ logged_in: false });
    } catch (err) {
      sendResponse({ message: "error" });
    }
  }

  if (request.message === "is_user_signed_in") {
    try {
      const user = auth.currentUser;
      sendResponse({
        payload: Boolean(user),
      });
    } catch (err) {
      sendResponse({ message: "error" });
    }
  }
  return true;
};

const cloudFunctionListener = async (
  request: any,
  _sender,
  sendResponse: any
) => {
  if (request.message === "sendTwitterData") {
    try {
      const response = await SendBlocksToTwitter(request.data);
      sendResponse({
        message: "success",
        returnTweet: response.data.twitter_url,
      });
    } catch {
      sendResponse({ message: "error" });
    }
  }
  return true;
};

//auth listener
chrome.runtime.onMessage.addListener(cloudFunctionListener);
chrome.runtime.onMessage.addListener(authListener);
