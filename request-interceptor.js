(function() {
    const originalXMLHttpRequest = XMLHttpRequest;
    const originalFetch = window.fetch;

    let collectedRequests = [];

    // Intercept XMLHttpRequest
    XMLHttpRequest = function() {
        const xhr = new originalXMLHttpRequest();
        const requestDetails = {};

        const originalOpen = xhr.open;
        const originalSend = xhr.send;

        xhr.open = function(method, url, ...rest) {
            requestDetails.method = method;
            requestDetails.url = url;
            requestDetails.headers = {};
            requestDetails.startTime = new Date().toISOString();
            originalOpen.apply(xhr, [method, url, ...rest]);
        };

        xhr.setRequestHeader = function(header, value) {
            requestDetails.headers[header] = value;
            xhr.__proto__.setRequestHeader.call(xhr, header, value);
        };

        xhr.send = function(body) {
            requestDetails.body = body;
            xhr.addEventListener('load', function() {
                requestDetails.status = xhr.status;
                requestDetails.responseText = xhr.responseText;
                requestDetails.responseHeaders = xhr.getAllResponseHeaders();
                requestDetails.endTime = new Date().toISOString();

                // Collect the request data
                collectedRequests.push(requestDetails);

                // Optionally send the data to your REST endpoint
                sendCollectedData();
            });

            originalSend.apply(xhr, [body]);
        };

        return xhr;
    };

    // Intercept fetch
    window.fetch = function(url, options = {}) {
        const requestDetails = {
            method: options.method || 'GET',
            url: url,
            headers: options.headers || {},
            body: options.body || null,
            startTime: new Date().toISOString()
        };

        return originalFetch(url, options).then(response => {
            return response.clone().text().then(responseBody => {
                requestDetails.status = response.status;
                requestDetails.responseText = responseBody;
                requestDetails.responseHeaders = [...response.headers.entries()].reduce((acc, [key, value]) => {
                    acc[key] = value;
                    return acc;
                }, {});
                requestDetails.endTime = new Date().toISOString();

                // Collect the request data
                collectedRequests.push(requestDetails);

                // Optionally send the data to your REST endpoint
                sendCollectedData();

                return response;
            });
        });
    };

    // Function to send the collected data to your REST endpoint
    function sendCollectedData() {
        if (collectedRequests.length > 0) {
            const endpointUrl = 'https://your-rest-endpoint.com/collect';
            
            //navigator.sendBeacon(endpointUrl, JSON.stringify(collectedRequests));

            console.log(JSON.stringify(collectedRequests));
            
            // Clear the collected requests after sending
            collectedRequests = [];
        }
    }

    // Optionally, you can also periodically send collected data if needed
    setInterval(sendCollectedData, 5000); // Every 5 seconds
})();
