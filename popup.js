/* global browser */

function onError(error) {
  console.error(`Error: ${error}`);
}


const tablist = document.getElementById('tabs');

async function sendMessageToTabs(tabs) {

   // 1. determine which tabs have media elements available and playing
  for (const tab of tabs) {
    try {
        const res = await browser.tabs.sendMessage(tab.id, { cmd: 'query' });
        console.debug(JSON.stringify(res, null, 4));
        if(res.length > 0){
            let tabdiv = document.createElement('div');
            const url = new URL(tab.url);
            tabdiv.textContent = 'Tab ' + tab.index + " : " + url.hostname;
            tablist.appendChild(tabdiv);
            for(const e of res) {
                let elementrow = document.createElement('div');
                //elementrow.style   = 'height:100px; border: 1px solid green;margin:10px;background: url(' + e.poster + ') center center; ';
                elementrow.style   = 'border-bottom: 1px solid black;margin:5px;padding:0px;';
                tabdiv.appendChild(elementrow);

                // id
                let iddiv = document.createElement('span');
                iddiv.textContent = 'Element ' + e.id;
                elementrow.appendChild(iddiv);

                // poster
                let posterImg = document.createElement('img');
                posterImg.src = e.poster;
                //posterImg.style = 'positon:absolute;right:0;top:0;';
                elementrow.appendChild(posterImg);

                // play / pause
                let playpausebtn = document.createElement('button');
                playpausebtn.textContent = (e.playing)? 'pause': 'play';
                elementrow.appendChild(playpausebtn);
                playpausebtn.onclick = async (evt) => {
                    const notstate = await browser.tabs.sendMessage(tab.id, { cmd: evt.target.textContent , ids: [e.id] });
                    if(notstate){
                        evt.target.textContent = notstate;
                    }
                }

                // mute / unmute
                let mutebtn = document.createElement('button');
                mutebtn.textContent = (e.muted)? 'unmute': 'mute';
                elementrow.appendChild(mutebtn);
                mutebtn.onclick = async (evt) => {
                    const notstate = await browser.tabs.sendMessage(tab.id, { cmd: evt.target.textContent , ids: [e.id] });
                    if(notstate){
                        evt.target.textContent = notstate;
                    }
                }

                /*
                // fullscreen
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
        onError(e);
    }
  }
}

( async () => {
  const tabs = await browser.tabs.query({
      currentWindow: true
    });
    sendMessageToTabs(tabs);
})();
