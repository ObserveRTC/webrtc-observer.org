(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
module.exports = Object.freeze({
    PageParamNames: {
        callId: 'callId',
    },
});
},{}],2:[function(require,module,exports){
const { PageParamNames } = require('./constants');
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const joinCall = () => new Promise(async (resolve, reject) => {
    const inputs = document.getElementsByTagName('input');
    const buttons = document.getElementsByTagName('button');
    
    console.log('inputs', JSON.stringify(inputs));
    console.log('buttons', JSON.stringify(buttons));

    const input = inputs[0];
    const button = buttons[0];

    // for (index = 0; index < inputs.length; ++index) {
        // deal with inputs[index] element.
        // console.log('input', inputs[index]);
    // }

    if (window[PageParamNames.callId]) {
        console.log(`window[PageParamNames.callId]: ${window[PageParamNames.callId]}`);
        input.focus();
       
        // input.value = window[PageParamNames.callId];
        input.value = window[PageParamNames.callId];
        const event = new Event('change');
        input.dispatchEvent(event);
    }

    await sleep(4000);

    button.click();

    await sleep(2000);

    if (!window[PageParamNames.callId]) {
        const bolds = document.getElementsByTagName('b');

        for(const bold of bolds) {
            if (bold.innerText === 'CallId') {
                const callId = bold.parentElement.innerText.split(': ')[1];
                if (callId) {
                    console.warn('bold.innerText', callId);
                    window[PageParamNames.callId] = callId;
                    break;
                }
            }
        }
    }
    

    resolve();

    // const nameInput = document.querySelector('.jstest-nameprompt input');
    // const nameContinueButton = document.querySelector('.jstest-nameprompt-continue');
    // nameInput.value = "DarthVader";
    // // join the room
    // nameContinueButton.click();
});


const main = (async () => {
    try {
        await joinCall();
    } catch (error) {
        console.error(error);
    }
});

main().catch(err => console.log(err));
},{"./constants":1}]},{},[2]);
