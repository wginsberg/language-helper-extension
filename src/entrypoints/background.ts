import { sendMessage } from "webext-bridge/background";
import { Menus } from "wxt/browser";

function onClicked(info: Menus.OnClickData) {
  console.log("clicked")
  browser.action.openPopup()
    .catch(() => {
      // silently ignore error if pop was already open
    })
    .finally(async () => {
      let didSend = false
      let attempts = 1
      while (!didSend && attempts < 5) {
        console.log("Attempting to send...", attempts)
        await sendMessage(
          "chrome-ai-context-menu",
          { selectionText: info.selectionText },
          "popup"
        )
        .then(() => { didSend = true })
        .catch(() => { })
        attempts += 1
      }
    })
}

export default defineBackground(() => {
  // Dummy message is required to make message passing work (?)
  sendMessage("dummy", null)

  browser.contextMenus.create({
    id: "chrome-ai",
    title: "Explain with AI Spanish Helper",
    contexts: ["selection"],
  }, () => {
    console.log("register")
    browser.contextMenus.onClicked
      .addListener(onClicked)
  })
});
