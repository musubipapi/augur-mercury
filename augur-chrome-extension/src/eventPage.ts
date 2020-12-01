// Listen to messages sent from other parts of the extension.
let user_signed_in = false;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // onMessage must return "true" if response is async.
  let isResponseAsync = true;

  if (request.popupMounted) {
    console.log("eventPage notified that Popup.tsx has mounted.");
  }

  if (request.message === "enableExtension") {
    chrome.pageAction.show(sender.tab.id);
  }

  if (request.message === "is_user_signed_in") {
    sendResponse({
      message: "success",
      payload: user_signed_in,
    });
  }

  if (request.message === "sign_out") {
    user_signed_in = false;
    sendResponse({ message: "success" });
  }
  if (request.message === "sign_in") {
    user_signed_in = true;
    sendResponse({ message: "success" });
  }
  return isResponseAsync;
});
