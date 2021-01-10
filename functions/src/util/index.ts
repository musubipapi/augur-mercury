export const twitterReturn = (tweetSetting: string) => {
  if (tweetSetting === "lastTweet") {
    const returnFunc = async (
      i: number,
      max: number,
      twitter_url: string,
      twitter_urls: string[]
    ) => {
      if (i === max) {
        twitter_urls.push(twitter_url);
      }
      return twitter_urls;
    };
    return returnFunc;
  } else if (tweetSetting === "everyTweet") {
    const returnFunc = async (
      _i: number,
      _max: number,
      twitter_url: string,
      twitter_urls: string[]
    ) => {
      twitter_urls.push(twitter_url);
      return twitter_urls;
    };
    return returnFunc;
  } else {
    const returnFunc = async (
      i: number,
      _max: number,
      twitter_url: string,
      twitter_urls: string[]
    ) => {
      if (i === 0) {
        twitter_urls.push(twitter_url);
      }
      return twitter_urls;
    };
    return returnFunc;
  }
};
