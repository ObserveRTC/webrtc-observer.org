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