let downloadedUrls = new Set(); // To keep track of URLs that have already been downloaded

browser.webRequest.onCompleted.addListener(
    function(details) {
        let timestamp = new Date().toISOString().replace(/:/g, '_');
        if (details.statusCode === 200) {
            let url = details.url;
            if (url.match(/filenameorextension$/) && !downloadedUrls.has(url)) {
                console.log("Matched URL: " + url);  // Log matched URL to console
                downloadedUrls.add(url); // Add the URL to the set of downloaded URLs
                browser.downloads.download({
                    url: url,
                    filename: timestamp + '-' + url.split('/').pop() + '.jpg',
                    conflictAction: 'uniquify'
                });

                // show notification
                browser.notifications.create({
                    "type": "basic",
                    "iconUrl": browser.extension.getURL("icon.png"), // path to some icon in your extension
                    "title": "File Matched and Downloaded",
                    "message": url + " has been downloaded"
                });
            }
        }
    },
    {urls: ["*://targetdomainhere.com/*"], types: ["main_frame", "sub_frame", "stylesheet", "script", "image", "object", "xmlhttprequest", "other"]},
    ["responseHeaders"]
);
