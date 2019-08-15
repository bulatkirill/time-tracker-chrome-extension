const localStorage = chrome.storage.local;

localStorage.set({
    // object to save map of visited pages
    visitedPages: {},

}, () => {
    console.log("visited pages created")
});

const onCreated = (tab) => {
    let url = tab.url;
    const tabId = tab.id;
    localStorage.get('visitedPages', (result) => {
        let visitedPages = result.visitedPages;
        console.log(`Tab id = ${tabId}, url = ${url}, storage[tabId] = ${visitedPages[tabId]}`);
        if (visitedPages[tabId]) {
            console.error(`Something went wrong. Tab with id = ${tabId} was opened again without registering closing.`);
            // TODO logic missing in this case
        } else {
            console.log(`Storage doesn't have row for this tabId = ${tabId}`);
            visitedPages[tabId] = {
                tabId: tabId,
                dateOpen: new Date().getTime(),
                fullUrl: url
            };
            localStorage.set({visitedPages});
        }
    })
};

/**
 * https://developer.chrome.com/extensions/tabs#event-onRemoved
 * @param tabId
 * @param removeInfo
 */
const onRemoved = (tabId, removeInfo) => {
    console.log(`onRemoved action was fired with tab id = ${tabId}`);
    localStorage.get('visitedPages', (result) => {
        let visitedPages = result.visitedPages;
        let timeEntry = visitedPages[tabId];
        if (timeEntry) {
            console.log(`Time entry was found = ${JSON.stringify(timeEntry)}. Setting closing time.`);
            // TODO maybe add check for the closing task that the url of opened
            //  time entry with this tab id is the same as the closing one
            timeEntry.dateClosed = new Date().getTime();
            visitedPages[tabId] = timeEntry;
            localStorage.set({visitedPages});
        } else {
            console.error(`onRemoved event was fired on undefined tab in the local storage. Something is very bad.`)
            //TODO logic in case of this mistakes
        }
    });
};


chrome.tabs.onCreated.addListener(onCreated);
chrome.tabs.onRemoved.addListener(onRemoved);

// chrome.runtime.onInstalled.addListener(function() {
//     chrome.storage.sync.set({color: '#3aa757'}, function() {
//         console.log('The color is green.');
//     });
//     chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
//         chrome.declarativeContent.onPageChanged.addRules([{
//             conditions: [new chrome.declarativeContent.PageStateMatcher({
//                 pageUrl: {hostEquals: 'developer.chrome.com'},
//             })
//             ],
//             actions: [new chrome.declarativeContent.ShowPageAction()]
//         }]);
//     });
// });
