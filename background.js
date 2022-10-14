function onError(error) {
  console.error(`Error: ${error}`);
}

async function sendMessageToTabs(tabs) {
  for (const tab of tabs) {
    try {
    const res = await browser.tabs.sendMessage(tab.id, { greeting: "Hi from background script" });
    console.log(res.response);
    }catch(e){
        onError(e);
    }
  }
}

browser.browserAction.onClicked.addListener( async () => {
    console.log('onBAClicked');
  const tabs = await browser.tabs.query({
      currentWindow: true
    });
    sendMessageToTabs(tabs);
});
