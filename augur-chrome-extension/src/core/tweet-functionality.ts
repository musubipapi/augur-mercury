import twitter from "twitter-text";
import { Position, Toaster } from "@blueprintjs/core";

import {
  createSideButton,
  asyncPaste,
  waitForString,
  newBlockEnter,
} from "./dom";
import { roamAPIQuery, selectLastChildBlock } from "./roam";

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

const getAndSendTwitterData = async (block_uid: string) => {
  const timeout = 3000;
  let timerId = setTimeout(async () => {
    try {
      const tweetBlock = await roamAPIQuery(
        `[:find (pull ?e [* {:block/children [*]}]) :where [?e :block/uid "${block_uid}"] ]`
      );
      const parentString = tweetBlock.string.match(
        /https:\/\/twitter.com\/.+\/status\/(\d+)/
      );
      const childrenStrings = tweetBlock.children.sort(
        (a: { order: number }, b: { order: number }) =>
          a.order < b.order ? -1 : 1
      );

      const childrenStringsText = childrenStrings.map(
        (tweetObject: { uid: any }) =>
          document.querySelector(`[id*="${tweetObject.uid}"]`).textContent
      );
      const data = JSON.stringify({
        ...(parentString && { start: parentString[1] }),
        tweets: childrenStringsText,
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
                const lastBlock = await selectLastChildBlock(block_uid);
                if (lastBlock.value.trim().length !== 0) {
                  newBlockEnter();
                }
                await waitForString("");
                await asyncPaste(`Tweet: ${response.returnTweet}`);
              }
            });
          } else if (response.message === "error") {
            Toaster.create({
              autoFocus: true,
              canEscapeKeyClear: true,
              className: "recipe-toaster",
              position: Position.TOP,
            }).show({
              message: "Error posting tweet",
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
