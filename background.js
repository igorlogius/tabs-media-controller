/* global browser */

const manifest = browser.runtime.getManifest();
const extname = manifest.name;

async function onCommand(cmd) {
  let qryObj = { hidden: false, currentWindow: true };
  let tabs = [],
    atab;

  for (const t of await browser.tabs.query(qryObj)) {
    if (t.active === true) {
      atab = { windowId: t.windowId, index: t.index };
    }
    if (t.audible === true) {
      tabs.push(t.index);
    }
  }

  if (tabs.length < 1 || (tabs.length === 1 && atab.index === tabs[0])) {
    return;
  }
  switch (cmd) {
    case "gotoNextRight":
      tabs.sort((a, b) => {
        return a - b;
      });
      if (atab.index === tabs[tabs.length - 1]) {
        browser.tabs.highlight({
          windowId: atab.windowId,
          tabs: [tabs[0]],
        }); // overflow
        return;
      }
      for (const tidx of tabs) {
        if (tidx > atab.index) {
          browser.tabs.highlight({ windowId: atab.windowId, tabs: [tidx] });
          return;
        }
      }
      break;
    case "gotoNextLeft":
      tabs.sort((a, b) => {
        return b - a;
      });
      if (atab.index === tabs[tabs.length -1]) {
        browser.tabs.highlight({
          windowId: atab.windowId,
          tabs: [tabs[0]],
        }); // overflow
      }
      for (const tidx of tabs) {
        if (tidx < atab.index) {
          browser.tabs.highlight({ windowId: atab.windowId, tabs: [tidx] });
          return;
        }
      }
      break;
  }
}

browser.commands.onCommand.addListener(onCommand);
