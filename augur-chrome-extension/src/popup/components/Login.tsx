import React, { useState, useEffect } from "react";
import firebase from "firebase/app";
import StyledFirebaseAuth from "react-firebaseui/StyledFirebaseAuth";
import axios from "axios";

import "firebase/auth";

import { firebaseConfig } from "../../firebase/firebaseConfig";
firebase.initializeApp(firebaseConfig);

const CLOUD_FUNCTION_URL = "https://us-central1-augur-8e52d.cloudfunctions.net";

const SendLoginToFirestore = async (authResult: any) => {
  const token = await firebase.auth().currentUser.getIdToken();
  const { creationTime, lastSignInTime } = firebase.auth().currentUser.metadata;
  const { accessToken, secret } = authResult.credential;
  if (creationTime === lastSignInTime) {
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

export const Login: React.FunctionComponent = () => {
  const [signedIn, setSignedIn] = useState<boolean>(false);
  var uiConfig = {
    callbacks: {
      signInSuccessWithAuthResult: (authResult: any, _redirect: any) => {
        SendLoginToFirestore(authResult);
        setSignedIn(true);
        chrome.runtime.sendMessage({ message: "sign_in" });

        return false;
      },
    },
    signInFlow: "popup",
    signInOptions: [firebase.auth.TwitterAuthProvider.PROVIDER_ID],
  };
  useEffect(() => {
    chrome.runtime.sendMessage({ message: "is_user_signed_in" }, (response) => {
      if (response.message === "success" && response.payload) {
        setSignedIn(true);
      }
    });
  });

  const handleSendRequest = async () => {
    if (!firebase.auth().currentUser) {
      throw new Error("Not authenticated. Make sure you're signed in!");
    }

    // Get the Firebase auth token to authenticate the request
    const token = await firebase.auth().currentUser.getIdToken();
    console.log(token);
    axios({
      method: "post",
      url: `${CLOUD_FUNCTION_URL}/api/sendTweet`,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }).catch((e) => {
      throw new Error(e);
    });
  };

  const handleSignOut = () => {
    setSignedIn(false);
    firebase.auth().signOut;
    chrome.runtime.sendMessage({ message: "sign_out" }, (response) => {});
  };

  return (
    <div>
      <div id="firebaseui-auth-container"></div>
      {!signedIn && (
        <StyledFirebaseAuth
          uiCallback={(ui) => ui.disableAutoSignIn()}
          uiConfig={uiConfig}
          firebaseAuth={firebase.auth()}
        />
      )}
      {signedIn && (
        <div>
          Welcome! You're officially Signed in! <br />
          <button onClick={handleSignOut}>Sign-out</button>
          <button onClick={handleSendRequest}>Send Request </button>
        </div>
      )}
    </div>
  );
};
