export const initializeSettings = (settingVars: string[]) => {
  let settingsObj: { [k: string]: any } = {};

  settingVars.forEach((settingVar) => {
    chrome.storage.sync.get([settingVar], function (result) {
      settingsObj[settingVar] = result[settingVar];
    });
  });
  return settingsObj;
};
