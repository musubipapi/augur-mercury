import {
  Colors,
  InputGroup,
  Tooltip,
  Position,
  Switch,
  Alignment,
} from "@blueprintjs/core";
import React, { useState, useEffect } from "react";

export const Settings: React.FunctionComponent = () => {
  const [tagValue, setTagValue] = useState<string>("#TweetThis");
  const [hideSentTweet, setHideSentTweet] = useState<boolean>(false);
  const [hideCharCount, setHideCharCount] = useState<boolean>(false);

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
  }, []);

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

  const addHash = (elem: any) => {
    var val = elem.target.value;
    if (!val.match(/^#/)) {
      elem.target.value = "#" + val;
    }
  };

  return (
    <div>
      <h4 style={{ color: Colors.WHITE }} className="bp3-heading">
        Settings
      </h4>
      <div style={{ marginTop: "40px" }}>
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
      <div style={{ marginTop: "30px" }}>
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
      <div style={{ marginTop: "20px" }}>
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
    </div>
  );
};
