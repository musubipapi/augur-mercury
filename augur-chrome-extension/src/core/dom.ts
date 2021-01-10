import { fireEvent, waitFor } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";

export const createMutationObserver = (
  callback: MutationCallback,
  watchElement: Node,
  options: MutationObserverInit | undefined
) => {
  return new MutationObserver(callback).observe(watchElement, options);
};

export const insertAfter = (newNode: any, refNode: any) => {
  refNode.parentNode?.insertBefore(newNode, refNode.nextSibling);
};

// https://stackoverflow.com/questions/38881301/observe-mutations-on-a-target-node-that-doesnt-exist-yet
interface IWaitForAddedNode {
  id: string;
  parent: HTMLElement | null;
  recursive: boolean;
  done: (e?: any) => void;
}

export const waitForAddedNode = ({
  id,
  parent,
  recursive,
  done,
}: IWaitForAddedNode) => {
  new MutationObserver(function (this: MutationObserver, _mutations) {
    const el = document.querySelector(id);

    if (el) {
      this.disconnect();
      done(el);
    }
  }).observe(parent || document, {
    subtree: !!recursive,
    childList: true,
  });
};

export const createSideButton = async (
  insertionPoint: Element,
  component: HTMLElement,
  existFn?: (insertion: any, block: Element) => Promise<void>
) => {
  if (insertionPoint?.nextSibling) {
    existFn &&
      existFn(
        insertionPoint.nextSibling,
        insertionPoint.previousSibling as Element
      );
  } else {
    insertAfter(component, insertionPoint);
  }
};

// credit to @dvargas92495 (roam/js) for utility functions below

export const waitForTextAreaEnter = async () => {
  await waitFor(
    () => {
      if (document.activeElement?.tagName !== "TEXTAREA") {
        throw new Error("Textarea didn't render");
      }
    },
    {
      timeout: 5000,
    }
  );
};

export const newBlockEnter = async () => {
  if (!document.activeElement) {
    return;
  }
  const element = document.activeElement as HTMLElement;
  if (element.tagName !== "TEXTAREA") {
    return;
  }
  const textarea = element as HTMLTextAreaElement;
  const end = textarea.value.length;
  textarea.setSelectionRange(end, end);

  // Need to switch to fireEvent because user-event enters a newline when hitting enter in a text area
  // https://github.com/testing-library/user-event/blob/master/src/type.js#L505
  const enterObj = {
    key: "Enter",
    keyCode: 13,
    code: 13,
    which: 13,
  };
  await fireEvent.keyDown(document.activeElement, enterObj);
  await fireEvent.keyUp(document.activeElement, enterObj);
  await waitForString("");
  return document.activeElement as HTMLTextAreaElement;
};

export const asyncType = async (text: string, delay?: number) =>
  document.activeElement &&
  (await userEvent.type(document.activeElement, text, {
    skipClick: true,
    ...(delay && { delay }),
  }));

export const waitForString = (text: string) =>
  waitFor(
    () => {
      const textArea = document.activeElement as HTMLTextAreaElement;
      if (textArea?.value == null) {
        throw new Error(
          `Textarea is undefined. Active Element ${textArea.tagName}. Input text ${text}`
        );
      }

      const expectedTextWithoutPeriod = text.replace(/\./g, "").toUpperCase();
      const actualTextWithoutPeriod = textArea.value
        .replace(/\./g, "")
        .toUpperCase();

      // relaxing constraint for equality because there is an issue with periods.
      // in some cases, userEvent.type doesn't type the periods.
      if (actualTextWithoutPeriod !== expectedTextWithoutPeriod) {
        throw new Error(
          `Typing not complete. Actual: ${actualTextWithoutPeriod} Expected: ${expectedTextWithoutPeriod}`
        );
      }
    },
    {
      timeout: 5000,
    }
  );

export const asyncPaste = async (text: string) =>
  document.activeElement &&
  (await userEvent.paste(document.activeElement, text, {
    // @ts-ignore - https://github.com/testing-library/user-event/issues/512
    clipboardData: new DataTransfer(),
  }));
