import * as functions from "firebase-functions";
import admin from "firebase-admin";
import express from "express";
import cors from "cors";
import { _topicWithOptions } from "firebase-functions/lib/providers/pubsub";

import Twit from "twit";

admin.initializeApp();

const app = express();

app.use(cors());

// Express middleware that validates Firebase ID Tokens passed in the Authorization HTTP header.
// The Firebase ID token needs to be passed as a Bearer token in the Authorization HTTP header like this:
// `Authorization: Bearer <Firebase ID Token>`.
// when decoded successfully, the ID Token content will be added as `req.user`.
const authenticate = (req: any, res: any, next: any) => {
  if (
    !req.headers.authorization ||
    !req.headers.authorization.startsWith("Bearer ")
  ) {
    console.log("doesn not pass first test");
    res.status(403).send("Unauthorized");
    return;
  }
  const idToken = req.headers.authorization.split("Bearer ")[1];

  admin
    .auth()
    .verifyIdToken(idToken)
    .then((decodedIdToken) => {
      req.user = decodedIdToken;
      next();
      return;
    })
    .catch((e) => {
      res.status(403).send("Unauthorized");
      return;
    });
};

app.use(authenticate);

app.post("/newUser", async (req: any, res) => {
  const { firebase, name, picture, uid } = req.user;
  const { accessToken, secret } = req.body;

  await admin.firestore().collection("users").add({
    name,
    picture,
    uid,
    twitter_id: firebase.identities["twitter.com"][0],
    accessToken,
    secret,
  });

  res.send("successful request!");
});

app.post("/sendTweet", async (req: any, res) => {
  console.log(req.user.uid);
  const getUserProfile = await admin
    .firestore()
    .collection("users")
    .where("uid", "==", req.user.uid)
    .limit(1)
    .get();

  if (getUserProfile.docs.length === 1) {
    const { accessToken, secret } = getUserProfile.docs[0].data();
    var T = new Twit({
      consumer_key: functions.config().twitter.consumer_key,
      consumer_secret: functions.config().twitter.consumer_secret,
      access_token: accessToken,
      access_token_secret: secret,
      timeout_ms: 60 * 1000,
    });
    T.post(
      "statuses/update",
      { status: "hello world!" },
      function (err, data, response) {
        console.log(data);
      }
    );
  } else {
    res.status(400).send("Error in Request");
  }
  res.send("test");
});

export const api = functions.https.onRequest(app);

export const helloWorld = functions.https.onRequest((request, response) => {
  functions.logger.info("Hello logs!", { structuredData: true });
  response.send("Hello from Firebasdfadfadfdadfe!");
});

export const test = functions.https.onRequest((request, response) => {
  functions.logger.info("Hello logs!", { structuredData: true });
  response.send("Hello from test!");
});
