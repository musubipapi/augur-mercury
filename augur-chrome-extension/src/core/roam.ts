import { runInPageContext } from "./page-context";
import { asyncPaste, asyncType, waitForTextAreaEnter } from "./dom";
import userEvent from "@testing-library/user-event";
//@ts-ignore

export const roamAPIQuery = async (queryString: string, ...params: any[]) => {
  const query = runInPageContext(
    (...args: any[]) => window.roamAlphaAPI.q(...args),
    queryString,
    ...params
  );
  //@ts-ignore
  if (query.length === 0 || query[0].length === 0) {
    throw new Error("query not found");
  }
  return query[0][0];
};

export const roamAPIPull = async (pullString: string, blockId: number) => {
  return await runInPageContext(
    async (...args: any) => window.roamAlphaAPI.pull(...args),
    pullString,
    blockId
  );
};

export const selectBlock = async (uid: string) => {
  const divElement = document.querySelector(`[id*="${uid}"]`);
  if (!divElement) {
    throw new Error("no block with specified uid");
  }
  userEvent.click(divElement);
  await waitForTextAreaEnter();
  return document.activeElement as HTMLTextAreaElement;
};
export const selectBlockAndPaste = async (uid: string, str: string) => {
  const divElement = document.querySelector(`[id*="${uid}"]`);
  if (!divElement) {
    throw new Error("no block with specified uid");
  }
  userEvent.click(divElement);
  await waitForTextAreaEnter();
  await asyncType(str);
  return document.activeElement as HTMLTextAreaElement;
};

export const selectLastChildBlock = async (uid: string) => {
  const selectedBlock = await roamAPIQuery(
    `[:find (pull ?e [* {:block/children [*]}]) :in $ ?desiredId :where [?e :block/uid ?desiredId]]`,
    uid
  );
  const childrenBlocks = selectedBlock.children.sort(
    (a: { order: number }, b: { order: number }) =>
      a.order >= b.order ? -1 : 1
  );
  return (await selectBlock(childrenBlocks[0].uid)) as HTMLTextAreaElement;
};

export const getChildrenBlocks = async (uid: string) => {
  const selectedBlock = await roamAPIQuery(
    `[:find (pull ?e [* {:block/children [*]}]) :in $ ?desiredId :where [?e :block/uid ?desiredId]]`,
    uid
  );
  const childrenBlocks = selectedBlock.children.sort(
    (a: { order: number }, b: { order: number }) => (a.order < b.order ? -1 : 1)
  );
  return childrenBlocks;
};

const DFTChildrenBlocks = (childrenArray: any[]) => {
  let finalUidArray: string[] = [];
  let currentNode = childrenArray.shift();
  while (currentNode) {
    finalUidArray.push(currentNode.uid);
    if (currentNode.children) {
      childrenArray.unshift(
        ...currentNode.children.sort(
          (a: { order: number }, b: { order: number }) =>
            a.order < b.order ? -1 : 1
        )
      );
    }
    currentNode = childrenArray.shift();
  }
  return finalUidArray;
};

export const getBlock = async (uid: string) => {
  return await roamAPIQuery(
    `[:find  (pull ?e [*]) :in $ ?desiredId :where [?e :block/uid ?desiredId]]`,
    uid
  );
};

export const getRecursiveChildrenBlocks = async (uid: string) => {
  const tweetBlock = await roamAPIQuery(
    `[:find  (pull ?e [:block/order :block/string :block/uid {:block/children ...} ]) :in $ ?desiredId :where [?e :block/uid ?desiredId]]`,
    uid
  );
  const childrenStrings = DFTChildrenBlocks(
    tweetBlock.children.sort((a: { order: number }, b: { order: number }) =>
      a.order < b.order ? -1 : 1
    )
  );
  return childrenStrings;
};
