import * as functions from "firebase-functions";
import twitter from "twitter-text";
import admin from "firebase-admin";
import express from "express";
import cors from "cors";
import Twit from "twit";

import { twitterReturn } from "./util/index";
admin.initializeApp();

// var cors_proxy = require("cors-anywhere").createServer({
//   requireHeader: ["origin"],
//   removeHeaders: ["cookie", "cookie2"],
//   // See README.md for other options
// });

// export const corsProxy = functions.https.onRequest((req, res) => {
//   cors({ origin: true })(req, res, () => {
//     req.url = req.url.replace("/corsProxy/", "/https://");
//     console.log(req.url);
//     cors_proxy.emit("request", req, res);
//   });
// });

const app = express();

const allowlist = [
  "chrome-extension://bbhblloohhphfgdgmocapbpkgadcpead",
  "chrome-extension://fjclkljmpggljoimiocgcjhjgkcbknfm",
];
const corsOptionsDelegate = (req: any, callback: any) => {
  let corsOptions;
  if (allowlist.indexOf(req.header("Origin")) !== -1) {
    corsOptions = { origin: true }; // reflect (enable) the requested origin in the CORS response
  } else {
    corsOptions = { origin: false }; // disable CORS for this request
  }
  callback(null, corsOptions); // callback expects two parameters: error and options
};

// Express middleware that validates Firebase ID Tokens passed in the Authorization HTTP header.
// The Firebase ID token needs to be passed as a Bearer token in the Authorization HTTP header like this:
// `Authorization: Bearer <Firebase ID Token>`.
// when decoded successfully, the ID Token content will be added as `req.user`.
const authenticate = (req: any, res: any, next: any) => {
  if (
    !req.headers.authorization ||
    !req.headers.authorization.startsWith("Bearer ")
  ) {
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
app.use(cors(corsOptionsDelegate));
app.use(authenticate);

app.post("/newUser", async (req: any, res) => {
  const { firebase, name, picture, uid } = req.user;
  const { accessToken, secret, username } = req.body;

  try {
    // set user ids
    await admin.firestore().collection("users").doc(uid).set({
      name,
      picture,
      twitter_id: firebase.identities["twitter.com"][0],
      username,
    });

    //set tokens
    await admin
      .firestore()
      .collection("users")
      .doc(uid)
      .collection("private")
      .doc("tokens")
      .set({ accessToken, secret });

    res.send("successful request!");
  } catch (e) {
    res.status(400).json({ message: "Bad Request" });
  }
});

app.post("/sendTweet", async (req: any, res) => {
  const getUserProfile = admin
    .firestore()
    .collection("users")
    .doc(req.user.uid);
  const userProfileData = (await getUserProfile.get()).data();
  const tokenData = (
    await getUserProfile.collection("private").doc("tokens").get()
  ).data();
  const body = req.body;
  const tweetBlocks = body["tweets"].filter(Boolean);
  if (!tweetBlocks) {
    res.status(400).json({ message: "Bad Request" });
    return;
  }
  if (
    tweetBlocks.some((tweet: any) => twitter.parseTweet(tweet).valid !== true)
  ) {
    res.status(400).json({ message: "Bad Request" });
    return;
  }
  const start = body["start"];
  if (
    Boolean(userProfileData && userProfileData.username) &&
    Boolean(tokenData && tokenData.accessToken && tokenData.secret)
  ) {
    const { accessToken, secret } = tokenData!;
    const username = userProfileData!.username;
    const T = new Twit({
      consumer_key: functions.config().twitter.consumer_key,
      consumer_secret: functions.config().twitter.consumer_secret,
      access_token: accessToken,
      access_token_secret: secret,
      timeout_ms: 60 * 1000,
    });
    const sendTweet = async (id = null, return_id = null) => {
      for (let i = 0; i < tweetBlocks.length; i++) {
        //@ts-ignore
        const response = await T.post(
          "statuses/update",
          Object.assign(
            { status: tweetBlocks[i] },
            (start &&
              i === 0 && {
                in_reply_to_status_id: start,
                auto_populate_reply_metadata: true,
              }) ||
              (id && {
                in_reply_to_status_id: id,
              })
          )
        );
        if (i === 0) {
          //@ts-ignore
          return_id = await response.data.id_str;
        }
        //@ts-ignore
        id = await response.data.id_str;
      }
      res.status(200).json({
        twitter_url: `https://twitter.com/${username}/status/${return_id}`,
      });
      return;
    };
    await sendTweet();
  } else {
    res.status(400).send("Error in Request");
    return;
  }
});

interface ITweetBlock {
  string: string;
  mediaObj: {
    alt: string;
    dataURL: string;
  }[];
}

app.post("/v2/sendTweet", async (req: any, res) => {
  try {
    const getUserProfile = admin
      .firestore()
      .collection("users")
      .doc(req.user.uid);

    const userProfileData = (await getUserProfile.get()).data();
    const tokenData = (
      await getUserProfile.collection("private").doc("tokens").get()
    ).data();

    const body = req.body;
    const tweetBlocks: ITweetBlock[] = body["tweets"].filter(Boolean);
    console.log(tweetBlocks);
    if (tweetBlocks.length === 0) {
      res.status(400).json({ message: "Bad Request" });
      return;
    }
    if (
      tweetBlocks.some(
        (tweet: ITweetBlock) => twitter.parseTweet(tweet.string).valid !== true
      )
    ) {
      res
        .status(400)
        .json({ message: "Error: One(or more) of your tweets are invalid" });
      return;
    }

    const start = body["start"];
    const tweetSetting = body["tweetSetting"];
    if (
      Boolean(userProfileData && userProfileData.username) &&
      Boolean(tokenData && tokenData.accessToken && tokenData.secret)
    ) {
      const { accessToken, secret } = tokenData!;
      const username = userProfileData!.username;
      const T = new Twit({
        consumer_key: functions.config().twitter.consumer_key,
        consumer_secret: functions.config().twitter.consumer_secret,
        access_token: accessToken,
        access_token_secret: secret,
        timeout_ms: 60 * 1000,
      });

      const sendTweet = async (id: any = null) => {
        let twitter_urls: string[] = [];
        const tweetFunc = twitterReturn(tweetSetting);

        for (let i = 0; i < tweetBlocks.length; i++) {
          //@ts-ignore
          const media_strings: string[] = [];
          if (tweetBlocks[i].mediaObj) {
            for (let j = 0; j < tweetBlocks[i].mediaObj.length; j++) {
              const { alt, dataURL } = tweetBlocks[i].mediaObj[j];
              const upload: any = await T.post("media/upload", {
                media_data: dataURL,
              });
              const mediaIdStr = upload.data.media_id_string;
              alt &&
                (await T.post("media/metadata/create", {
                  media_id: mediaIdStr,
                  alt_text: { text: alt },
                }));
              media_strings.push(mediaIdStr);
            }
          }
          const response: any = await T.post("statuses/update", {
            status: tweetBlocks[i].string,
            ...((start &&
              i === 0 && {
                in_reply_to_status_id: start,
                auto_populate_reply_metadata: true,
              }) ||
              (id && {
                in_reply_to_status_id: id,
              })),
            ...(media_strings.length !== 0 && { media_ids: media_strings }),
          });

          twitter_urls = await tweetFunc(
            i,
            tweetBlocks.length - 1,
            `https://twitter.com/${username}/status/${response.data.id_str}`,
            twitter_urls
          );
          id = response.data.id_str;
        }
        console.log(twitter_urls);
        res.status(200).json({
          twitter_urls,
        });
        return;
      };
      await sendTweet();
    } else {
      console.log("error");
      res.status(400).json({ message: "Error in Request" });
      return;
    }
  } catch (e) {
    console.log("error:", e);
    res.status(400).json({ message: `${e}` });
    return;
  }
});

export const api = functions.https.onRequest(app);
