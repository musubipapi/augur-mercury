import React, { useState, useEffect } from "react";
import { Button, Colors } from "@blueprintjs/core";

import { Settings } from "./Settings";

export const Login: React.FunctionComponent = () => {
  const [signedIn, setSignedIn] = useState<boolean>(false);

  useEffect(() => {
    chrome.runtime.sendMessage({ message: "is_user_signed_in" }, (response) => {
      if (response.payload) {
        setSignedIn(true);
      }
    });
  });

  const handleSignIn = async () => {
    chrome.runtime.sendMessage({ message: "sign_in" }, (response) => {
      if (response.message === "success") {
        setSignedIn(true);
      }
    });
  };

  const handleSignOut = () => {
    chrome.runtime.sendMessage({ message: "sign_out" }, (response) => {
      if (response.message === "success") {
        setSignedIn(false);
      }
    });
  };

  return (
    <div className="container-pad">
      <div className="grid-container">
        <h2 style={{ color: Colors.WHITE }} className="bp3-heading">
          Mercury
        </h2>
        {!signedIn && (
          <Button
            style={{ color: Colors.WHITE, justifyContent: "left" }}
            text="Login using Twitter"
            icon={"log-in"}
            onClick={handleSignIn}
            small={true}
            minimal={true}
          />
        )}
        {signedIn && (
          <Button
            style={{ color: Colors.WHITE, justifyContent: "left" }}
            icon={"log-out"}
            text="Logout"
            onClick={handleSignOut}
            minimal={true}
            small={true}
          />
        )}
      </div>
      {signedIn && <Settings />}
    </div>
  );
};
