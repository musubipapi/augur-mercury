import {
  Colors,
  InputGroup,
  Tooltip,
  Position,
  Switch,
  Alignment,
  Popover,
  Menu,
  MenuItem,
  Button,
} from "@blueprintjs/core";
import React, { useState, useEffect } from "react";

import { IUserInfo, TweetReturnString } from "../../types/index";

export const Settings: React.FunctionComponent = () => {
  const [tagValue, setTagValue] = useState<string>("#TweetThis");
  const [hideSentTweet, setHideSentTweet] = useState<boolean>(false);
  const [hideCharCount, setHideCharCount] = useState<boolean>(false);
  const [userInfo, setUserInfo] = useState<IUserInfo | undefined>(undefined);
  const [tweetReturn, setTweetReturn] = useState<TweetReturnString | undefined>(
    TweetReturnString.first
  );
  const [tweetTemplate, setTweetTemplate] = useState<
    { template: string; isValid: boolean } | undefined
  >({ template: "<%url%>", isValid: true });
  // getters of storage.sync vals
  useEffect(() => {
    chrome.storage.sync.get({ tagValue }, (result) => {
      if (!result.tagValue) {
      } else {
        setTagValue(result.tagValue);
      }
    });
    chrome.storage.sync.get({ hideSentTweet }, (result) => {
      if (!result.hideSentTweet) {
      } else {
        setHideSentTweet(result.hideSentTweet);
      }
    });
    chrome.storage.sync.get({ hideCharCount }, (result) => {
      if (!result.hideCharCount) {
      } else {
        setHideCharCount(result.hideCharCount);
      }
    });
    chrome.storage.sync.get(["user_info"], (result) => {
      if (!result.user_info) {
      } else {
        setUserInfo(result.user_info);
      }
    });
    chrome.storage.sync.get({ tweetReturn }, (result) => {
      if (!result.tweetReturn) {
      } else {
        setTweetReturn(result.tweetReturn);
      }
    });
    chrome.storage.sync.get(["tweetTemplateString"], (result) => {
      if (!result.tweetTemplateString) {
      } else {
        setTweetTemplate({
          template: result.tweetTemplateString,
          isValid: true,
        });
      }
    });
  }, []);

  // eventListeners
  useEffect(() => {
    if (!tagValue.match(/^(#)(.*)/)) {
      return;
    }
    chrome.storage.sync.set({ tagValue });
  }, [tagValue]);

  useEffect(() => {
    chrome.storage.sync.set({ hideSentTweet });
  }, [hideSentTweet]);

  useEffect(() => {
    chrome.storage.sync.set({ hideCharCount });
  }, [hideCharCount]);
  useEffect(() => {
    chrome.storage.sync.set({ tweetReturn });
  }, [tweetReturn]);
  useEffect(() => {
    if (tweetTemplate.isValid) {
      chrome.storage.sync.set({ tweetTemplateString: tweetTemplate.template });
    }
  }, [tweetTemplate]);
  // change handlers
  const handleTagChange = (e) => {
    let value = e.target.value;
    setTagValue(value);
  };

  const handleSentTweetBlock = () => {
    setHideSentTweet(!hideSentTweet);
  };

  const handleCharacterCount = () => {
    setHideCharCount(!hideCharCount);
  };

  const handleMenuSelect = (e) => {
    setTweetReturn(e.target.innerText);
  };
  const handleTweetTemplate = (e) => {
    const isValid = e.target.value.match(/<%url%>/gm);
    setTweetTemplate({ template: e.target.value, isValid });
  };
  const addHash = (elem: any) => {
    var val = elem.target.value;
    if (!val.match(/^#/)) {
      elem.target.value = "#" + val;
    }
  };
  const permissionsMenu = (
    <Popover
      content={
        <Menu>
          <MenuItem onClick={handleMenuSelect} text={TweetReturnString.first} />
          <MenuItem onClick={handleMenuSelect} text={TweetReturnString.last} />
          <MenuItem onClick={handleMenuSelect} text={TweetReturnString.every} />
        </Menu>
      }
      position={Position.BOTTOM_RIGHT}
      usePortal={false}
      minimal={true}
    >
      <Button minimal={true} rightIcon="caret-down">
        {tweetReturn}
      </Button>
    </Popover>
  );
  console.log();
  return (
    <div>
      <h4
        style={{ color: Colors.WHITE, marginTop: "20px" }}
        className="bp3-heading"
      >
        Settings
      </h4>
      <div style={{ marginTop: "20px" }}>
        <Tooltip
          className="fill"
          content={<span>Set tag to be used to send tweets</span>}
          position={Position.TOP_LEFT}
          usePortal={false}
        >
          <InputGroup
            onKeyUp={addHash}
            fill={true}
            leftIcon="tag"
            onChange={handleTagChange}
            placeholder="#TweetThis..."
            value={tagValue}
          />
        </Tooltip>
      </div>
      <div style={{ marginTop: "20px" }}>
        <Tooltip
          className="fill"
          content={<span>Hide character count of tweet blocks</span>}
          position={Position.TOP_LEFT}
          usePortal={false}
        >
          <Switch
            alignIndicator={Alignment.RIGHT}
            label="Hide character count"
            checked={hideCharCount}
            onChange={handleCharacterCount}
          />
        </Tooltip>
      </div>
      <div style={{ marginTop: "10px" }}>
        <Tooltip
          className="fill"
          content={<span>Turn off url paste of sent tweet in block</span>}
          position={Position.TOP_LEFT}
          usePortal={false}
        >
          <Switch
            checked={hideSentTweet}
            alignIndicator={Alignment.RIGHT}
            label="Turn off tweet receipt"
            onChange={handleSentTweetBlock}
          />
        </Tooltip>
      </div>
      <div style={{ marginTop: "10px" }}>
        <Tooltip
          className="fill"
          content={<span>Template for tweet receipt and return type</span>}
          position={Position.TOP_LEFT}
          usePortal={false}
        >
          <InputGroup
            fill={true}
            intent={tweetTemplate.isValid ? "none" : "danger"}
            onChange={handleTweetTemplate}
            leftIcon="percentage"
            placeholder="[Link](<%url%>)..."
            value={tweetTemplate.template}
            rightElement={permissionsMenu}
          />
        </Tooltip>
      </div>
      {userInfo && (
        <div
          style={{
            position: "absolute",
            bottom: "15px",
            display: "flex",
            flexDirection: "row",
          }}
        >
          <a
            style={{
              display: "flex",
              flexDirection: "row",
              textDecoration: "none",
              color: "white",
              flex: "0 0 133%",
            }}
            href={`https://twitter.com/${userInfo.username}`}
            target="_blank"
          >
            <img
              style={{
                width: "30px",
                height: "30px",
                borderRadius: "100%",
                marginRight: "5px",
              }}
              src={userInfo.picture}
            />
            <div
              style={{
                fontSize: "12px",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <span style={{ fontWeight: "bold" }}>{userInfo.name}</span>
              <span>@{userInfo.username}</span>
            </div>
          </a>
        </div>
      )}
      <div style={{ position: "absolute", bottom: "15px", right: "12px" }}>
        v{chrome.runtime.getManifest().version}
      </div>
    </div>
  );
};
