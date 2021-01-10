import axios from "axios";
import {
  CLOUD_FUNCTION_URL,
  auth,
  provider,
  db,
} from "../firebase/firebaseConfig";

const SendLoginToFirestore = async (
  authResult: firebase.auth.UserCredential
) => {
  const token = await auth.currentUser.getIdToken();
  const { isNewUser, username } = authResult.additionalUserInfo;
  //@ts-ignore
  const { accessToken, secret } = authResult.credential;
  if (isNewUser) {
    try {
      await axios({
        method: "post",
        url: `${CLOUD_FUNCTION_URL}/api/newUser`,
        data: {
          accessToken,
          secret,
          username,
        },
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
    } catch (e) {
      throw new Error(e);
    }
  }
  const user_info = (
    await db.collection("users").doc(auth.currentUser.uid).get()
  ).data();
  chrome.storage.sync.set({
    user_info,
  });
};

const SendBlocksToTwitter = async (data: string) => {
  const token = await auth.currentUser.getIdToken();
  try {
    const response = await axios({
      method: "post",
      url: `${CLOUD_FUNCTION_URL}/api/v2/sendTweet`,
      data,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    return { response, isSuccess: true };
  } catch (err) {
    if (err.response) {
      console.log(err.response.data);
      return { response: err.response.data?.message, isSuccess: false };
    }
    throw new Error(err);
  }
};
const authListener = async (request: any, _sender, sendResponse: any) => {
  if (request.message === "sign_in") {
    try {
      const result = await auth.signInWithPopup(provider);

      await SendLoginToFirestore(result);

      chrome.storage.sync.set({ logged_in: true });
      sendResponse({ message: "success" });
    } catch (err) {
      sendResponse({ message: "error", payload: err });
    }
  }

  if (request.message === "sign_out") {
    try {
      await auth.signOut();
      sendResponse({ message: "success" });
      chrome.storage.sync.set({ logged_in: false });
      chrome.storage.sync.set({ user_info: false });
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

  if (request.message === "get_user_info") {
    try {
      chrome.storage.sync.get(["user_info"], async (result) => {
        if (!result.user_info) {
        } else {
          sendResponse({ payload: result.user_info });
        }
      });
    } catch (err) {
      console.log(err.response);
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
      const result = await SendBlocksToTwitter(request.data);
      if (result.isSuccess)
        sendResponse({
          message: "success",
          returnTweet: result.response.data.twitter_urls,
        });
      else {
        sendResponse({
          message: "error",
          payload: result.response,
        });
      }
    } catch (e) {
      sendResponse({ message: "error" });
    }
  }
  return true;
};

//auth listener
chrome.runtime.onMessage.addListener(cloudFunctionListener);
chrome.runtime.onMessage.addListener(authListener);
