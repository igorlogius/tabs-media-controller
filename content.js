/*global browser */

function getMediaElementBy(id) {
  return document.querySelector('[tmcuuid="' + id + '"]');
}

function getThumbnail(video) {
  let canvas = document.createElement("canvas");
  let ctx = canvas.getContext("2d");
  ctx.drawImage(video, 0, 0, 300, 200);
  return canvas.toDataURL("image/jpeg", 0.3);
}

function handleQuery(id) {
  const el = getMediaElementBy(id);

  return {
    poster:
      el.tagName.toLowerCase() === "video" ? getThumbnail(el) : "audio.png",
    duration: el.duration,
    currentTime: el.currentTime,
    playing: !el.paused,
    volume: el.volume,
    muted: el.muted,
    id,
  };
}

// get all media elements and their states
function handleQueryAll() {
  const ret = [];
  const els = document.querySelectorAll("video,audio");
  for (const el of els) {
    let tmcuuid = el.getAttribute("tmcuuid");
    if (tmcuuid === null) {
      tmcuuid = crypto.randomUUID();
      el.setAttribute("tmcuuid", tmcuuid);
    }

    if (
      !isNaN(el.duration) // https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/duration
    ) {
      ret.push({
        poster: el.tagName.toLowerCase() === "video" ? getThumbnail(el) : "",
        type: el.tagName.toLowerCase(),
        duration: el.duration,
        currentTime: el.currentTime,
        playing: !el.paused,
        volume: el.volume,
        muted: el.muted,
        id: tmcuuid,
      });
    }
  }

  return ret;
}

function handlePreview(id) {
  let el = getMediaElementBy(id);
  if (el) {
    return getThumbnail(el);
  }
  return "";
}

function handlePause(ids) {
  for (const id of ids) {
    let el = getMediaElementBy(id);
    if (el) {
      el.pause();
    }
  }
  return "play";
}

function handlePauseAll() {
  for (const el of document.querySelectorAll("video,audio")) {
    el.pause();
  }
}

function handleMuteAll() {
  for (const el of document.querySelectorAll("video,audio")) {
    el.muted = true;
  }
}

function handlePlay(ids) {
  for (const id of ids) {
    let el = getMediaElementBy(id);
    if (el) {
      el.play();
    }
  }
}

function handleMute(ids) {
  for (const id of ids) {
    let el = getMediaElementBy(id);
    if (el) {
      el.muted = true;
    }
  }
}

function handleUnMute(ids) {
  for (const id of ids) {
    let el = getMediaElementBy(id);
    if (el) {
      el.muted = false;
    }
  }
}


function handlePIP(ids) {
  for (const id of ids) {
    let el = getMediaElementBy(id);
    if (el) {
      // not supported ref. https://developer.mozilla.org/en-US/docs/Web/API/HTMLVideoElement/requestPictureInPicture
      // and since bug https://bugzilla.mozilla.org/show_bug.cgi?id=1463402
      // is closed with WONTFIX, this feature wont be available any time soon it seems
      el.requestPictureInPicture();
    }
  }
}

async function handleFullscreen(id) {
  let el = getMediaElementBy(id);
  if (el) {
    try {
      el.requestFullscreen(); // not doable since action is not recognized as a short running user action
    } catch (e) {
      console.error(e);
    }
  }
}

async function handleVolume(id, volume) {
  let el = getMediaElementBy(id);
  if (el) {
    try {
      el.volume = volume;
    } catch (e) {
      console.error(e);
    }
  }
}

async function handleCurrentTime(id, currentTime) {
  let el = getMediaElementBy(id);
  if (el) {
    try {
      el.currentTime = currentTime;
    } catch (e) {
      console.error(e);
    }
  }
}

async function handleFocus(id) {
  let el = getMediaElementBy(id);
  if (el) {
    try {
      el.scrollIntoView();
    } catch (e) {
      console.error(e);
    }
  }
}
browser.runtime.onMessage.addListener((request) => {
  //console.debug("onMessage", JSON.stringify(request, null, 4));
  switch (request.cmd) {
    case "query":
      return Promise.resolve(handleQuery(request.id));
    case "queryAll":
      return Promise.resolve(handleQueryAll());
    case "play":
      return Promise.resolve(handlePlay(request.ids));
    case "pause":
      return Promise.resolve(handlePause(request.ids));
    case "pauseAll":
      return Promise.resolve(handlePauseAll());
    case "mute":
      return Promise.resolve(handleMute(request.ids));
    case "muteAll":
      return Promise.resolve(handleMuteAll());
    case "unmute":
      return Promise.resolve(handleUnMute(request.ids));
    case "pip":
      return Promise.resolve(handlePIP(request.ids));
    case "fullscreen":
      return Promise.resolve(handleFullscreen(request.ids));
    case "volume":
      return Promise.resolve(handleVolume(request.id, request.volume));
    case "currentTime":
      return Promise.resolve(
        handleCurrentTime(request.id, request.currentTime),
      );
    case "focus":
      return Promise.resolve(handleFocus(request.id));
    case "preview":
      return Promise.resolve(handlePreview(request.id));
    default:
      console.error("unknown request", request);
      break;
  }
});

setTimeout(() => {
  //console.debug("injecting media.js into document head ");
  var s = document.createElement("script");
  s.src = browser.runtime.getURL("attach.js");
  s.onload = () => s.remove();
  document.head.appendChild(s);
}, 3000);
