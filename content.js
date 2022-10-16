
const mediaElements = new Map();

function getThumbnail(video) {
    let canvas = document.createElement('canvas');
    let ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, 300,200);
    return canvas.toDataURL();
}

// get all media elements and their states
function handleQuery(){
    console.debug('handleQuery');
    const ret = [];
    const els = document.querySelectorAll('video,audio');
    //console.log(els.length);
    let count = 0;
    for(const el of els){
        mediaElements.set(count, el); // required for controlling later
        if(
             /*
                   el.paused === false
             ||  el.autoplay === true
            */
            !isNaN(el.duration)  // https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/duration
        ){
            ret.push({
                    poster: (el.tagName.toLowerCase() === 'video' ? getThumbnail(el) : ''),
                    type: el.tagName.toLowerCase(),
                    duration: el.duration,
                    currentTime: el.currentTime,
                    playing: !el.paused,
                    volume: el.volume,
                    muted: el.muted,
                    id: count
            });
        }
        count++;
    }
    return ret;
}

function handlePause(ids){
    console.debug('handlePause');
    for(const id of ids){
        if(mediaElements.has(id)){
            mediaElements.get(id).pause();
        }
    }
    return 'play';
}

function handlePlay(ids){
    console.debug('handlePlay');
    for(const id of ids){
        if(mediaElements.has(id)){
            mediaElements.get(id).play();
        }
    }
    return 'pause';
}

function handleMute(ids){
    console.debug('handleMute');
    for(const id of ids){
        if(mediaElements.has(id)){
            mediaElements.get(id).muted = true;
        }
    }
    return 'unmute';
}

function handleUnMute(ids){
    console.debug('handleUnMute');
    for(const id of ids){
        if(mediaElements.has(id)){
            mediaElements.get(id).muted = false;
        }
    }
    return 'mute';
}

function handlePIP(ids){
    console.debug('handleMute');
    for(const id of ids){
        if(mediaElements.has(id)){
            mediaElements.get(id).requestPictureInPicture(); // not supported ref. https://developer.mozilla.org/en-US/docs/Web/API/HTMLVideoElement/requestPictureInPicture
        }
    }
    return 'unmute';
}

async function handleFullscreen(ids){
    console.debug('handleMute');
    for(const id of ids){
        if(mediaElements.has(id)){
            try {
                await mediaElements.get(id).requestFullscreen();
                return true;
            }catch(e){
                console.error(e);
                return false;
            }
        }
    }
}

async function handleVolume(id,volume){
    if(mediaElements.has(id)){
        try {
            mediaElements.get(id).volume = volume;
            return true;
        }catch(e){
            console.error(e);
            return false;
        }
    }
}

async function handleCurrentTime(id,currentTime){
    if(mediaElements.has(id)){
        try {
            mediaElements.get(id).currentTime = currentTime;
            return true;
        }catch(e){
            console.error(e);
            return false;
        }
    }
}

browser.runtime.onMessage.addListener((request) => {
    console.debug('onMessage',JSON.stringify(request,null,4));
    switch(request.cmd){
        case 'query':
            return Promise.resolve(handleQuery());
            break;
        case 'play':
            return Promise.resolve(handlePlay(request.ids));
            break;
        case 'pause':
            return Promise.resolve(handlePause(request.ids));
            break;
        case 'mute':
            return Promise.resolve(handleMute(request.ids));
            break;
        case 'unmute':
            return Promise.resolve(handleUnMute(request.ids));
            break;
        case 'pip':
            return Promise.resolve(handlePIP(request.ids));
            break;
        case 'fullscreen':
            return Promise.resolve(handleFullscreen(request.ids));
            break;
        case 'volume':
            return Promise.resolve(handleVolume(request.id, request.volume));
            break;
        case 'currentTime':
            return Promise.resolve(handleCurrentTime(request.id, request.currentTime));
            break;
        default:
            console.error('unknown request', request);
            break;
    }
});

console.debug('content.js');
