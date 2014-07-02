function ajaxRequest(method, url, opts) {
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function() {
        if (xmlhttp.readyState === 4 ) {
            var ready = opts.ready || function() {
                console.log("Ready " + method + " request to " + url);
            };
            ready(xmlhttp);
        }
    };
    xmlhttp.open(method, url, true);
    if (method === "POST") {
        xmlhttp.setRequestHeader("Content-Type",
                                 opts.contentType ||
                                     "application/x-www-form-urlencoded");
    }
    xmlhttp.send(opts.body);
}
