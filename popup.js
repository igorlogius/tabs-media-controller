/* global browser */

async function getFromStorage(type, id, fallback) {
  let tmp = await browser.storage.local.get(id);
  return typeof tmp[id] === type ? tmp[id] : fallback;
}

const tablist = document.getElementById("tabs");

async function queryTabs() {
  let first = true;

  const tabs = await browser.tabs.query({
    url: ["<all_urls>"],
    discarded: false,
    status: "complete",
  });

  // lets move the audible tabs to the front/top
  tabs.sort((a, b) => {
    if (a.audible && !b.audible) {
      return -1;
    }
    if (b.audible && !a.audible) {
      return 1;
    }
    return 0;
  });

  for (const tab of tabs) {
    try {
      const res = await browser.tabs.sendMessage(tab.id, { cmd: "queryAll" });
      //console.debug(JSON.stringify(res, null, 4));

      res.sort((a, b) => {
        if (a.playing && !b.playing) {
          return -1;
        }
        if (b.playing && !a.playing) {
          return 1;
        }
        if (a.playing && b.playing) {
          if (!a.muted && b.muted) {
            return -1;
          }
          if (a.muted && !b.muted) {
            return 1;
          }
          // both are muted or unmuted => equal
        }
        return 0;
      });

      if (res.length > 0) {
        if (first) {
          tablist.textContent = "";
          first = false;
        }

        const url = new URL(tab.url);
        const favIconUrl = tab.favIconUrl || "";

        let tabdiv = document.createElement("div");
        tabdiv.classList.add("tabDiv");
        /*let seperator = document.createElement("hr");
        tabdiv.appendChild(seperator);*/

        tablist.appendChild(tabdiv);

        let tabFavImg = document.createElement("img");
        tabFavImg.classList.add("tabFavImg");
        tabFavImg.src = favIconUrl;
        let tablink = document.createElement("button");

        tablink.textContent =
          "#" +
          tab.index +
          " " +
          url.hostname.replace(/^www\./, "") +
          " - " +
          tab.title;
        tablink.classList.add("tabFocusBtn");
        tabdiv.appendChild(tablink);
        tablink.setAttribute("title", "focus tab");
        tablink.onclick = () => {
          browser.tabs.highlight({ windowId: tab.windowId, tabs: [tab.index] });
        };
        tablink.appendChild(tabFavImg);

        let mutetabbtn = document.createElement("button");
        mutetabbtn.textContent = "mute(tab)";
        mutetabbtn.classList.add("tabMuteBtn");
        mutetabbtn.setAttribute("title", "mute tab");
        tabdiv.appendChild(mutetabbtn);
        mutetabbtn.onclick = async () => {
          browser.tabs.sendMessage(tab.id, {
            cmd: "muteAll",
          });
        };

        let pausetabbtn = document.createElement("button");
        pausetabbtn.textContent = "pause(tab)";
        pausetabbtn.classList.add("tabPauseBtn");
        pausetabbtn.setAttribute("title", "pause tab");
        tabdiv.appendChild(pausetabbtn);
        pausetabbtn.onclick = () => {
          browser.tabs.sendMessage(tab.id, { cmd: "pauseAll" });
        };

        let pauseOriginbtn = document.createElement("button");
        pauseOriginbtn.textContent = "pause(site)";
        pauseOriginbtn.classList.add("sitePauseBtn");
        pauseOriginbtn.setAttribute("title", "pause site");
        tabdiv.appendChild(pauseOriginbtn);
        pauseOriginbtn.onclick = () => {
          for (const tt of tabs) {
            if (tt.url.startsWith(url.origin)) {
              browser.tabs.sendMessage(tt.id, { cmd: "pauseAll" });
            }
          }
        };

        let muteOriginbtn = document.createElement("button");
        muteOriginbtn.textContent = "mute(site)";
        muteOriginbtn.classList.add("siteMuteBtn");
        muteOriginbtn.setAttribute("title", "mute site");
        tabdiv.appendChild(muteOriginbtn);
        muteOriginbtn.onclick = async () => {
          for (const tt of tabs) {
            if (tt.url.startsWith(url.origin)) {
              browser.tabs.sendMessage(tt.id, {
                cmd: "muteAll",
              });
            }
          }
        };

        for (const e of res) {
          // media element
          let elementrow = document.createElement("div");
          elementrow.setAttribute("eid", e.id);
          elementrow.setAttribute("tid", tab.id);
          elementrow.classList.add("elementDiv");
          tabdiv.appendChild(elementrow);

          // poster
          let previewImg = document.createElement("img");
          previewImg.src = e.poster || "audio.png";
          previewImg.classList.add("previewImg");
          elementrow.appendChild(previewImg);

          let controls = document.createElement("div");
          controls.classList.add("elementControlsDiv");
          elementrow.appendChild(controls);

          // focus
          let focusbtn = document.createElement("button");
          focusbtn.textContent = "focus";
          focusbtn.classList.add("elementFocusBtn");
          focusbtn.setAttribute("title", "focus element");
          controls.appendChild(focusbtn);
          focusbtn.onclick = async (evt) => {
            await browser.windows.update(tab.windowId, { focused: true });
            await browser.tabs.highlight({
              windowId: tab.windowId,
              tabs: [tab.index],
            });
            await browser.tabs.sendMessage(tab.id, {
              cmd: evt.target.textContent,
              id: e.id,
            });
          };

          // playbackRate
          let playbackRatebtn = document.createElement("input");
          playbackRatebtn.setAttribute("type", "range");
          playbackRatebtn.setAttribute("min", "25");
          playbackRatebtn.setAttribute("max", "400");
          playbackRatebtn.setAttribute("step", "1");
          playbackRatebtn.setAttribute("value", e.playbackRate * 100);
          playbackRatebtn.classList.add("elementPlaybackRateBtn");
          playbackRatebtn.setAttribute(
            "title",
            "Playback Rate: " + e.playbackRate,
          );
          controls.appendChild(playbackRatebtn);
          playbackRatebtn.addEventListener("input", (evt) => {
            browser.tabs.sendMessage(tab.id, {
              cmd: "playbackRate",
              id: e.id,
              playbackRate: evt.target.value / 100,
            });

            evt.target.setAttribute(
              "title",
              "Playback Rate: " + evt.target.value / 100,
            );
          });

          // mute
          let mutebtn = document.createElement("button");
          mutebtn.textContent = e.muted ? "unmute" : "mute";
          mutebtn.classList.add("elementMuteBtn");
          mutebtn.setAttribute("title", "un/mute element");
          controls.appendChild(mutebtn);
          mutebtn.onclick = (evt) => {
            browser.tabs.sendMessage(tab.id, {
              cmd: evt.target.textContent,
              ids: [e.id],
            });
          };

          // volume
          let volumebtn = document.createElement("input");
          volumebtn.setAttribute("type", "range");
          volumebtn.setAttribute("min", "0");
          volumebtn.setAttribute("max", "100");
          volumebtn.setAttribute("step", "1");
          volumebtn.setAttribute("value", e.volume * 100);
          volumebtn.classList.add("elementVolumeBtn");
          volumebtn.setAttribute("title", "change volume");
          controls.appendChild(volumebtn);
          volumebtn.addEventListener("input", (evt) => {
            browser.tabs.sendMessage(tab.id, {
              cmd: "volume",
              id: e.id,
              volume: evt.target.value / 100,
            });
          });

          // play / pause
          let playpausebtn = document.createElement("button");
          playpausebtn.textContent = e.playing ? "pause" : "play";
          playpausebtn.classList.add("elementPlayPauseBtn");
          playpausebtn.setAttribute("title", "play/pause element");
          controls.appendChild(playpausebtn);
          playpausebtn.onclick = async (evt) => {
            browser.tabs.sendMessage(tab.id, {
              cmd: evt.target.textContent,
              ids: [e.id],
            });
          };

          // currentTime
          let currentTimebtn = document.createElement("input");
          currentTimebtn.setAttribute("type", "range");
          currentTimebtn.setAttribute("min", "0");
          currentTimebtn.setAttribute("max", e.duration);
          if (e.duration === -1) {
            currentTimebtn.setAttribute("disabled", "disabled");
          }
          currentTimebtn.setAttribute("value", e.currentTime);

          currentTimebtn.classList.add("elementTimeBtn");
          currentTimebtn.setAttribute("title", "change playback position");
          controls.appendChild(currentTimebtn);
          currentTimebtn.addEventListener("input", (evt) => {
            browser.tabs.sendMessage(tab.id, {
              cmd: "currentTime",
              id: e.id,
              currentTime: evt.target.value,
            });
          });
        }
      }
    } catch (e) {
      console.error("tab ", tab.index, e);
    }
  }
  tablist.focus();
}

(async () => {
  const styles = await getFromStorage(
    "string",
    "styles",
    `
/* The World is your canvas, have fun */

body {
  padding:0;
  margin:0;
  background-color:silver;
}
#tabs {
  padding:0;
  margin:0;
}
.tabDiv {
  padding:10px;
}
.tabFocusBtn {
  width: 100%;
  word-break: break-all;
}
.tabMuteBtn {
  width: 25%;
}
.tabPauseBtn {
  width: 25%;
}
.sitePauseBtn {
  width: 25%;
}
.siteMuteBtn {
  width: 25%;
}
.elementDiv {
 width: 100%;
 height: 150px;
}
.previewImg {
  height: 150px;
  float:left;
  border:5px groove gray;
}
.elementControlsDiv {
  position:relative;
  border:5px groove gray;
  height: 140px;
  width: 250px;
  float: left;
  padding-top:10px;
}
.elementFocusBtn {
  width: 70%;
  margin-left:15%;
}
.elementMuteBtn {
  width: 70%;
  margin-left:15%;
}
.elementVolumeBtn {
  width: 70%;
  margin-left:15%;
}
.elementPlayPauseBtn {
  width: 70%;
  margin-left:15%;
}
.elementTimeBtn {
  width: 70%;
  margin-left:15%;
}
`,
  );

  let styleSheet = document.createElement("style");
  styleSheet.innerText = styles;
  document.head.appendChild(styleSheet);

  queryTabs();

  setInterval(async () => {
    for (const el of document.querySelectorAll(".elementDiv")) {
      const newdata = await browser.tabs.sendMessage(
        parseInt(el.getAttribute("tid")),
        { cmd: "query", id: el.getAttribute("eid") },
      );

      el.querySelector(".previewImg").setAttribute("src", newdata.poster);
      el.querySelector(".elementVolumeBtn").setAttribute(
        "value",
        newdata.volume * 100,
      );
      el.querySelector(".elementVolumeBtn").setAttribute(
        "title",
        "Volume: " + newdata.volume * 100,
      );

      el.querySelector(".elementTimeBtn").setAttribute(
        "value",
        newdata.currentTime,
      );
      el.querySelector(".elementTimeBtn").setAttribute(
        "title",
        "CurrentTime: " + newdata.currentTime,
      );
      el.querySelector(".elementMuteBtn").textContent = newdata.muted
        ? "unmute"
        : "mute";
      el.querySelector(".elementPlayPauseBtn").textContent = newdata.playing
        ? "pause"
        : "play";
    }
  }, 150);
})();

function isElementInViewport(el) {
  var rect = el.getBoundingClientRect();

  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <=
      (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}
