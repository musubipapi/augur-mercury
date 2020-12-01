import React, { useState, useEffect } from "react";
import firebase from "firebase/app";
import StyledFirebaseAuth from "react-firebaseui/StyledFirebaseAuth";

import "firebase/auth";

import { firebaseConfig } from "../../firebase/firebaseConfig";
firebase.initializeApp(firebaseConfig);

export const Login: React.FunctionComponent = () => {
  const [signedIn, setSignedIn] = useState<boolean>(false);
  var uiConfig = {
    callbacks: {
      signInSuccessWithAuthResult: function (authResult: any, _redirect: any) {
        const { accessToken, secret } = authResult.credential;

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
        </div>
      )}
    </div>
  );
};
