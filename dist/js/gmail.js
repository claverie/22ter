
// Your Client ID can be retrieved from your project in the Google
// Developer Console, https://console.developers.google.com
var CLIENT_ID = '653479896684-bh89ra7bon0ku9u6d77jtpsjdrcg3ti9.apps.googleusercontent.com';
var SCOPES = ['https://www.googleapis.com/auth/gmail.modify'];

/**
 * Check if current user has authorized this application.
 */
function checkAuth() {
    console.log("gmail.js:checkAuth");
    // ???? -> https://groups.google.com/forum/#!topic/google-api-javascript-client/GuFxPzqQ9-0
    gapi.auth.authorize(
        {
            'client_id': CLIENT_ID,
            'scope': SCOPES.join(' '),
            'immediate': true
        }, handleAuthResult);
}

/**
 * Handle response from authorization server.
 *
 * @param {Object} authResult Authorization result.
 */
function handleAuthResult(authResult) {
    console.log("gmail.js:handleAuthResult", authResult);
    var authorizeDiv = document.getElementById('authorize-div');
    if (authResult && !authResult.error) {
        // Hide auth UI, then load client library.
        authorizeDiv.style.display = 'none';
        loadGmailApi();
    } else {
        // Show auth UI, allowing the user to initiate authorization by
        // clicking authorize button.
        authorizeDiv.style.display = 'inline';
    }
}
/**
 * Initiate auth flow in response to user clicking authorize button.
 *
 * @param {Event} event Button click event.
 */
function handleAuthClick(event) {
    console.log("gmail.js:handleAuthClick", event);
    gapi.auth.authorize(
        {client_id: CLIENT_ID, scope: SCOPES, immediate: false},
        handleAuthResult
    );
    return false;
}

/**
 * Load Gmail API client library. List labels once client library
 * is loaded.
 */
function loadGmailApi() {
    console.log("gmail.js:loadGmailApi");
    gapi.client.load('gmail', 'v1', getInboxState);
}

function getInboxState() {
    console.log("gmail.js:getInboxState");
    $(".message-search").fadeIn();
    $(".message-status").removeClass("fa-envelope-o").addClass("fa-spin fa-refresh");
    $("[data-domo-key='message-count']").removeClass("have-message").addClass("no-message").html(""); // +"/"+resp.messagesTotal);
    var request = gapi.client.gmail.users.labels.get({
        'userId': 'me',
        'id': "INBOX"
    });
    request.execute(function(resp) {
        if (resp.messagesUnread > 0) {
            $("[data-domo-key='message-count']").removeClass("no-message").addClass("have-message").html(resp.messagesUnread); // +"/"+resp.messagesTotal);
        }
        $(".message-status").addClass("fa-envelope-o").removeClass("fa-spin fa-refresh");
        $(".message-search").fadeOut();
        setInterval(
            function() {
                getInboxState();
            },
            10*60*1000
        );
    });
}
$("#authorize-div").on("click", function() {

    console.log("gmail.js  / Handle user click");
    handleAuthClick();
});