import { sendMessage } from "webext-bridge/background";
import { Menus, Tabs } from "wxt/browser";

function onClicked(info: Menus.OnClickData, tab: Tabs.Tab | undefined) {
  console.log("clicked", tab);

  if (!tab?.id) {
    return;
  }

  browser.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => {
      // Get surrounding text in the page execution context
      const selection = window.getSelection();
      if (!selection) return;
      const node = selection.focusNode;
      return node?.textContent?.trim();
    },
  }).then((injectionResults) => {
    const surroundingText = (injectionResults[0].result || "") as string;

    browser.action.openPopup()
      .catch(() => {
        // silently ignore error if pop was already open
      })
      .finally(async () => {
        let didSend = false;
        let attempts = 1;
        while (!didSend && attempts < 5) {
          console.log("Attempting to send...", attempts);
          await sendMessage(
            "chrome-ai-context-menu",
            { selectionText: info.selectionText, surroundingText },
            "popup",
          )
            .then(() => {
              didSend = true;
            })
            .catch(() => {});
          attempts += 1;
        }
      });
  });
}

export default defineBackground(() => {
  // Dummy message is required to make message passing work (?)
  sendMessage("dummy", null);

  browser.contextMenus.create({
    id: "chrome-ai",
    title: "Explain with AI Language Helper",
    contexts: ["selection"],
  }, () => {
    console.log("register");
    browser.contextMenus.onClicked
      .addListener(onClicked);
  });
});
