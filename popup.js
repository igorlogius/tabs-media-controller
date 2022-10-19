/* global browser */

function onError(error) {
  console.error(`Error: ${error}`);
}


const tablist = document.getElementById('tabs');

async function sendMessageToTabs(tabs) {

    let first = true;
   // 1. determine which tabs have media elements available and playing

  for (const tab of tabs) {
    try {
        const res = await browser.tabs.sendMessage(tab.id, { cmd: 'query' });
        //console.debug(JSON.stringify(res, null, 4));
        if(res.length > 0){
            if(first){
                tablist.textContent = '';
                first = false;
            }
            const url = new URL(tab.url);

            let tabdiv = document.createElement('div');
            tabdiv.style = 'padding-bottom:5px;'
            //tabdiv.textContent = 'Tab ' + tab.index + " : " + url.hostname;
            tablist.appendChild(tabdiv);

            let tablink = document.createElement('button');
            tablink.textContent = 'Tab ' + tab.index + " - " + url.hostname;
            tablink.style = 'word-break: break-all;width:370px;text-align:left;';
            tablink.setAttribute('title', "click to focus");
            tablink.onclick = () => {
                browser.tabs.highlight({tabs: [tab.index]});
            }
            tabdiv.appendChild(tablink);

            let once = true;

            for(const e of res) {
                let elementrow = document.createElement('div');
                elementrow.style   = 'position: relative;width:350px;height: 100px; border: 1px solid black;margin:0px;padding:0px;background-image: url(' + e.poster + '); background-repeat: no-repeat; background-size: 100% 100%; background-attachment: fixed;padding:10px;';
                tabdiv.appendChild(elementrow);


                // focus
                /**/
                let focusbtn = document.createElement('button');
                focusbtn.textContent = 'focus'
                focusbtn.style   = 'float:right;';
                elementrow.appendChild(focusbtn);
                focusbtn.onclick = async (evt) => {
                    await browser.tabs.highlight({tabs: [tab.index]});
                    await browser.tabs.sendMessage(tab.id, { cmd: evt.target.textContent , id: e.id });
                }
                /**/

                // id
                /*
                let iddiv = document.createElement('span');
                //iddiv.style = 'background-color:white;';
                iddiv.textContent = e.id;
                elementrow.appendChild(iddiv);
                */

                // poster
                /*
                let posterImg = document.createElement('img');
                //posterImg.setAttribute('width','100');
                posterImg.src = e.poster;
                posterImg.style = 'border:1px solid green;';
                elementrow.appendChild(posterImg);
                */
                let controls = document.createElement('div');
                controls.style = 'position:absolute;bottom:0;right:-20;width:90%;padding:10px;';
                elementrow.appendChild(controls);

                // mute / unmute
                let mutebtn = document.createElement('button');
                mutebtn.textContent = (e.muted)? 'unmute': 'mute';
                mutebtn.style   = 'float:right;';
                elementrow.appendChild(mutebtn);
                mutebtn.onclick = async (evt) => {
                    const notstate = await browser.tabs.sendMessage(tab.id, { cmd: evt.target.textContent , ids: [e.id] });
                    if(notstate){
                        evt.target.textContent = notstate;
                    }
                }

                // volume slider
                let volumebtn = document.createElement('input');
                volumebtn.setAttribute('type', 'range');
                volumebtn.setAttribute('min', '0');
                volumebtn.setAttribute('max', '100');
                volumebtn.setAttribute('step', '1');
                volumebtn.setAttribute('value', e.volume*100);
                volumebtn.style   = 'float:right;';
                elementrow.appendChild(volumebtn);
                volumebtn.addEventListener('input', async (evt) => {
                    const notstate = await browser.tabs.sendMessage(tab.id, { cmd: 'volume' , id: e.id, volume: evt.target.value/100 });
                    if(!notstate){
                        //evt.target.value = notstate;
                        console.error('failed to set volume');
                    }
                });

                if(e.playing && once){
                   once = false;
                   tablink.textContent = tablink.textContent + " - playing";
                }

                // play / pause
                let playpausebtn = document.createElement('button');
                playpausebtn.textContent = (e.playing)? 'pause': 'play';
                playpausebtn.style   = 'float:right;width:15%;';
                controls.appendChild(playpausebtn);
                playpausebtn.onclick = async (evt) => {
                    evt.preventDefault();
                    const notstate = await browser.tabs.sendMessage(tab.id, { cmd: evt.target.textContent , ids: [e.id] });
                    if(notstate){
                        evt.target.textContent = notstate;
                    }
                }

                // volume slider
                let currentTimebtn = document.createElement('input');
                currentTimebtn.setAttribute('type', 'range');
                currentTimebtn.setAttribute('min', '0');
                currentTimebtn.setAttribute('max', e.duration);
                console.debug('duration', e.duration);
                if(e.duration === -1){
                    currentTimebtn.setAttribute('disabled', 'disabled');
                }
                //currentTimebtn.setAttribute('step', e.currentTime);
                currentTimebtn.setAttribute('value', e.currentTime);
                currentTimebtn.style   = 'float:right;width:75%;';
                controls.appendChild(currentTimebtn);
                currentTimebtn.addEventListener('input', async (evt) => {
                    console.debug(evt.target.value);
                    const notstate = await browser.tabs.sendMessage(tab.id, { cmd: 'currentTime' , id: e.id, currentTime: evt.target.value });
                    if(!notstate){
                        //evt.target.value = notstate;
                        console.error('failed to set currentTime');
                    }
                });



                /*
                // fullscreen // doent work, because needs to be a short running user action ... bugzilla BUG
                let fullscreenbtn = document.createElement('button');
                fullscreenbtn.textContent = 'fullscreen';
                elementrow.appendChild(fullscreenbtn);
                fullscreenbtn.onclick = async (evt) => {
                    await browser.tabs.highlight({tabs: [tab.index]});
                    browser.tabs.sendMessage(tab.id, { cmd: evt.target.textContent , ids: [e.id] });
                }
                */

            }
        }
    }catch(e){
        console.error('tab ', tab.index);
    }
  }
}

( async () => {
  const tabs = await browser.tabs.query({
      url: ['<all_urls>'],
      hidden: false,
      discarded: false,
      status: 'complete',
      currentWindow: true
    });
    sendMessageToTabs(tabs);
})();
