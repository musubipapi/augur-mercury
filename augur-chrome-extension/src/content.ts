import { createMutationObserver } from "./core/dom";
import { roamAPIQuery } from "./core/roam";
import { initializeSettings } from "./core/settings";
import {
  createCharCounter,
  createTweetButton,
} from "./core/tweet-functionality";
chrome.runtime.sendMessage({ message: "enableExtension" });

let settings = initializeSettings([
  "hideCharCount",
  "hideSentTweet",
  "tagValue",
  "logged_in",
]);

chrome.storage.onChanged.addListener(async function (changes) {
  if (changes.hideCharCount) {
    if (changes.hideCharCount.newValue === true) {
      document
        .querySelectorAll(`[data-mercury="charCount"]`)
        .forEach((e) => e.remove());
    } else if (changes.hideCharCount.newValue === false) {
      addCharCount();
    }
    settings.hideCharCount = changes.hideCharCount.newValue;
  }

  if (changes.hideSentTweet) {
    settings.hideSentTweet = changes.hideSentTweet.newValue;
  }
  if (changes.tagValue) {
    settings.tagValue = changes.tagValue.newValue;
  }
  if (changes.logged_in) {
    settings.logged_in = changes.logged_in.newValue;
    if (changes.logged_in === true) {
      await findTweetBlocks();
    } else {
      document.querySelectorAll(`[data-mercury]`).forEach((e) => e.remove());
    }
  }
});

const findTweetBlocks = async () => {
  if (!settings.logged_in) {
    return;
  }

  const blocks = document.querySelectorAll(
    `[data-tag="${settings?.tagValue?.substring(1)}"]`
  );
  blocks.forEach(async (block) => {
    const block_uid = block.parentElement.parentElement.id.slice(-9);

    await createTweetButton(block, block_uid);
  });
  if (!settings.hideCharCount) {
    await addCharCount();
  }
};

const addCharCount = async () => {
  const childrenBlocks = document.querySelectorAll(
    `[data-path-page-links*=\'"${settings?.tagValue?.substring(1)}"\']`
  );
  childrenBlocks.forEach(async (parentBlock) => {
    const block = parentBlock.querySelector(`[id]`);
    if (block.tagName === "TEXTAREA") {
      await createCharCounter(block.parentElement);
    } else {
      await createCharCounter(block);
    }
  });
};

const initiateMutationObserver = (e: Node, runFuction: () => Promise<void>) => {
  runFuction();
  createMutationObserver(runFuction, e, {
    attributes: false,
    childList: true,
    subtree: true,
  });
};

initiateMutationObserver(
  document.getElementById("app") as Node,
  findTweetBlocks
);
