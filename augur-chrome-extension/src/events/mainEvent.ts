chrome.runtime.onMessage.addListener((request, sender, _sendResponse) => {
  if (request.popupMounted) {
    console.log("eventPage notified that Popup.tsx has mounted.");
  }

  if (request.message === "enableExtension") {
    chrome.pageAction.show(sender.tab.id);
  }

  return true;
});

// chrome.runtime.connect().onDisconnect.addListener(function () {});
