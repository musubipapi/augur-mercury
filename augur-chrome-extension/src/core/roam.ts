import { runInPageContext } from "./page-context";
import { waitForTextAreaEnter } from "./dom";
import userEvent from "@testing-library/user-event";

export const roamAPIQuery = async (queryString: string) => {
  console.log(queryString);
  const query = await runInPageContext(
    async (query: any) => window.roamAlphaAPI.q(query),
    queryString
  );
  //@ts-ignore
  if (query.length === 0 || query[0].length === 0) {
    throw new Error("query not found");
  }
  console.log(query);
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

export const selectLastChildBlock = async (uid: string) => {
  const selectedBlock = await roamAPIQuery(
    `[:find (pull ?e [* {:block/children [*]}]) :where [?e :block/uid "${uid}"] ]`
  );
  const childrenBlocks = selectedBlock.children.sort(
    (a: { order: number }, b: { order: number }) =>
      a.order >= b.order ? -1 : 1
  );
  return (await selectBlock(childrenBlocks[0].uid)) as HTMLTextAreaElement;
};

export const getChildrenBlocks = async (uid: string) => {
  const selectedBlock = await roamAPIQuery(
    `[:find (pull ?e [* {:block/children [*]}]) :where [?e :block/uid "${uid}"] ]`
  );
  const childrenBlocks = selectedBlock.children.sort(
    (a: { order: number }, b: { order: number }) => (a.order < b.order ? -1 : 1)
  );
  return childrenBlocks;
};
