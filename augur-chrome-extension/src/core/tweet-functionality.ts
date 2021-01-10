import twitter from "twitter-text";
import { Position, Toaster } from "@blueprintjs/core";
import {
  createSideButton,
  asyncPaste,
  waitForString,
  newBlockEnter,
} from "./dom";

import {
  getRecursiveChildrenBlocks,
  roamAPIQuery,
  selectBlock,
  selectLastChildBlock,
} from "./roam";
import { TweetReturnString } from "../types/index";
import { templateEngine } from "./template-engine";
import Axios from "axios";

/**
 *
 * @param block
 * @param block_uid
 * Creates Tweet Button to send tweets to Twitter
 */

export const createTweetButton = async (block: Element, block_uid: string) => {
  const twitterSend = document.createElement("span");
  twitterSend.className = "bp3-button bp3-small bp3-minimal";
  twitterSend.setAttribute("data-mercury", "twitter-btn");
  twitterSend.innerHTML = `<img src='${chrome.extension.getURL(
    "images/twitter.svg"
  )}' width="20px" height="20px"/>`;
  twitterSend.addEventListener("click", () => getAndSendTwitterData(block_uid));

  const insertionBlock = block.parentElement?.parentElement?.parentElement?.classList.contains(
    "rm-level1"
  )
    ? block.parentElement?.parentElement?.parentElement?.nextSibling
    : block.parentElement?.parentElement?.nextSibling;

  await createSideButton(insertionBlock as Element, twitterSend);
};

/**
 *
 * @param block_uid
 * Creates CharacterCounter to check if block is within tweet count limits
 * Helper Fns:
 * getColor: given a value, change it to a color in the green to red spectrum
 * createCharCountElement: component to display character count
 */
export const createCharCounter = async (block) => {
  const selectedBlock = block.textContent;
  const charCount = twitter.parseTweet(selectedBlock).weightedLength;

  const charCountElement = createCharCountElement(charCount);

  await createSideButton(block.nextSibling, charCountElement, updateCharCount);
};

const updateCharCount = async (insertion: any, block: any) => {
  const selectedBlock = block.textContent;
  const tweetLength = twitter.parseTweet(selectedBlock).weightedLength;

  if (tweetLength != parseInt(insertion.innerText.split("/")[0])) {
    insertion.innerText = `${tweetLength}/280`;
    insertion.setAttribute(
      "style",
      `background-color:${getColor(
        tweetLength / 280
      )} !important; color: white; font-weight: 600;`
    );
  }
};

const getColor = (value: number) => {
  //value from 0 to 1
  value > 1 ? (value = 1) : value;
  var hue = ((1 - value) * 120).toString(10);
  return ["hsl(", hue, ",60%,50%)"].join("");
};

const createCharCountElement = (chars: number) => {
  const charCounter = document.createElement("span");

  charCounter.setAttribute("data-mercury", "charCount");
  charCounter.setAttribute(
    "style",
    `background-color:${getColor(
      chars / 280
    )} !important; color: white; font-weight: 600;`
  );
  charCounter.className = "bp3-button bp3-small bp3-minimal";
  charCounter.innerText = `${chars}/280`;
  return charCounter;
};

const toDataURL = (url) =>
  fetch(url)
    .then((response) => response.blob())
    .then(
      (blob) =>
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
          console.log("POOp");
        })
    );

const createBase64Img = async (
  blockDataObj: {
    string: string;
    mediaObj: {
      alt: string;
      dataURL: string;
    }[];
  }[]
) => {
  const returnData = await Promise.all(
    blockDataObj.map(async (obj) => {
      if (obj.mediaObj.length !== 0) {
        const results = await Promise.all(
          obj.mediaObj.map(async (item) => {
            const proxyURL = `https://blooming-brook-29146.herokuapp.com/`;
            const dataURL = (await toDataURL(
              proxyURL + item.dataURL
            )) as string;
            return { alt: item.alt, dataURL: dataURL.split(",")[1] };
          })
        );
        return { string: obj.string, mediaObj: results };
      }
      return { string: obj.string, mediaObj: obj.mediaObj };
    })
  );
  return returnData;
};

const getTweetReturn: () => Promise<string> = async () => {
  return await new Promise((resolve, reject) => {
    chrome.storage.sync.get(["tweetReturn"], (result) => {
      if (!result.tweetReturn) {
        resolve("firstTweet");
      } else {
        if (result.tweetReturn === TweetReturnString.every) {
          resolve("everyTweet");
        } else if (result.tweetReturn === TweetReturnString.last) {
          resolve("lastTweet");
        } else {
          resolve("firstTweet");
        }
      }
    });
  });
};

const getTweetTemplate: () => Promise<string> = async () => {
  return await new Promise((resolve, reject) => {
    chrome.storage.sync.get(["tweetTemplateString"], (result) => {
      resolve(result.tweetTemplateString as string);
    });
  });
};

const getAndSendTwitterData = async (block_uid: string) => {
  const timeout = 3000;
  let timerId = setTimeout(async () => {
    try {
      const tweetBlock = await roamAPIQuery(
        `[:find  (pull ?e [:block/order :block/string :block/uid {:block/children ...} ]) :in $ ?desiredId :where [?e :block/uid ?desiredId]]`,
        block_uid
      );

      const parentString = Array.from(
        tweetBlock.string.matchAll(
          /https:\/\/twitter.com\/.*?\/status\/(\d+)/gm
        )
      );

      const isSecond =
        tweetBlock.string.match(/#secondLink/) && parentString.length > 1
          ? 1
          : 0;

      const childrenStrings = await getRecursiveChildrenBlocks(block_uid);

      const blockDataObj = childrenStrings.map((uid) => {
        const mediaObj = Array.from(
          document
            .querySelector(`[id*="${uid}"]`)
            .querySelectorAll(".rm-inline-img")
        ).map((document: HTMLImageElement) => {
          return { alt: document.alt, dataURL: document.src };
        });

        return {
          string: document.querySelector(`[id*="${uid}"]`).textContent,
          mediaObj,
        };
      });

      const tweets = await createBase64Img(blockDataObj);
      const tweetSetting = await getTweetReturn();
      const tweetTemplate = await getTweetTemplate();
      const data = JSON.stringify({
        ...(parentString.length !== 0 && { start: parentString[isSecond][1] }),
        tweetSetting,
        tweets,
      });
      chrome.runtime.sendMessage(
        { message: "sendTwitterData", data },
        async (response) => {
          //creates a new block to paste sent tweet
          if (response.message === "success") {
            Toaster.create({
              autoFocus: true,
              canEscapeKeyClear: true,
              className: "recipe-toaster",
              position: Position.TOP,
            }).show({
              message: "Tweet successfully posted",
              intent: "success",
              timeout,
            });
            chrome.storage.sync.get(["hideSentTweet"], async (result) => {
              if (!result.hideSentTweet) {
                if (tweetSetting !== "everyTweet") {
                  const lastBlock = await selectLastChildBlock(block_uid);
                  if (lastBlock.value.trim().length !== 0) {
                    newBlockEnter();
                  }
                  await waitForString("");
                  const templatedString = templateEngine(
                    tweetTemplate,
                    {
                      url: response.returnTweet[0],
                    },
                    /<%([^%>]+)?%>/g
                  );
                  await asyncPaste(`${templatedString}`);
                } else {
                  const childrenBlocks: any[] = await getRecursiveChildrenBlocks(
                    block_uid
                  );
                  for (let i = 0; i < childrenBlocks.length; i++) {
                    const templatedString = templateEngine(
                      tweetTemplate,
                      {
                        url: response.returnTweet[i],
                      },
                      /<%([^%>]+)?%>/g
                    );
                    await selectBlock(childrenBlocks[i]);
                    await waitForString(
                      document.querySelector(`[id*="${childrenBlocks[i]}"]`)
                        .textContent
                    );
                    await asyncPaste(templatedString);
                  }
                }
              }
            });
          } else if (response.message === "error") {
            Toaster.create({
              autoFocus: true,
              canEscapeKeyClear: true,
              className: "recipe-toaster",
              position: Position.TOP,
            }).show({
              message: response.payload
                ? `${response.payload}`
                : `Error posting tweet`,
              intent: "danger",
              timeout,
            });
          }
        }
      );
    } catch (e) {
      throw new Error(e);
    }
  }, timeout);

  Toaster.create({
    autoFocus: true,
    canEscapeKeyClear: true,
    className: "recipe-toaster",
    position: Position.TOP,
  }).show({
    message: "Tweet Sent",
    intent: "primary",
    timeout,
    action: { onClick: () => clearInterval(timerId), text: "Undo" },
  });
};
