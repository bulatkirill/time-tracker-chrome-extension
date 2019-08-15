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
            visitedPages[tabId] = [{
                tabId: tabId,
                dateOpen: new Date().getTime(),
                fullUrl: url
            }];
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
        let timeEntries = visitedPages[tabId];
        if (timeEntries) {
            let lastTimeEntry = timeEntries[timeEntries.length - 1];
            console.log(`Time entry was found = ${JSON.stringify(lastTimeEntry)}. Setting closing time.`);
            // TODO maybe add check for the closing task that the url of opened
            //  time entry with this tab id is the same as the closing one
            lastTimeEntry.dateClosed = new Date().getTime();
            timeEntries[timeEntries.length - 1] = lastTimeEntry;
            visitedPages[tabId] = timeEntries;
            localStorage.set({visitedPages});
        } else {
            console.error(`onRemoved event was fired on undefined tab in the local storage. Something is very bad.`)
            //TODO logic in case of this mistakes
        }
    });
};

/**
 * https://developer.chrome.com/extensions/tabs#event-onUpdated
 * @param tabId
 * @param changeInfo
 * @param tab
 */
const onUpdated = (tabId, changeInfo, tab) => {
    let status = changeInfo.status;
    // continue only in case of complete load of the page. Helps with # referencing on the page and double recording the same page
    if (status === 'complete') {
        console.log(`status is complete`);
        const newUrl = tab.url;
        localStorage.get('visitedPages', (items => {
            let visitedPages = items.visitedPages;
            const timeEntries = visitedPages[tabId];
            const lastTimeEntry = timeEntries[timeEntries.length - 1];
            // compare old fullUrl and new one. If different - than continue - otherwise it is just reload
            if (lastTimeEntry.fullUrl !== newUrl) {
                lastTimeEntry.dateClosed = new Date().getTime();
                const newTimeEntry = {
                    tabId: tabId,
                    dateOpen: new Date().getTime(),
                    fullUrl: newUrl
                };
                timeEntries[timeEntries.length - 1] = lastTimeEntry;
                timeEntries.push(newTimeEntry);
                visitedPages[tabId] = timeEntries;
                localStorage.set({visitedPages})
            } else {
                console.log(`It is just reload of the tab wit id = ${tabId}`);
            }
        }))

    }
};


chrome.tabs.onCreated.addListener(onCreated);
chrome.tabs.onRemoved.addListener(onRemoved);
chrome.tabs.onUpdated.addListener(onUpdated);

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
