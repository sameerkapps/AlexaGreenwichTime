// Copyrights @2016 Sameer Khandekar
// MIT License

// This is the entry point for lambda. Gets called for on every invoke.
exports.handler = function (event, context) {
    try {
        console.log("event.session.application.applicationId=" + event.session.application.applicationId);

        // if it is a new session, do initialization
        if (event.session.new) {
            onSessionStarted({requestId: event.request.requestId}, event.session);
        }

        // detemine the type of request and call apporpriate function
        if (event.request.type === "LaunchRequest") {
            onLaunch(event.request,
                event.session,
                function callback(sessionAttributes, speechletResponse) {
                    context.succeed(buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === "IntentRequest") {
            onIntent(event.request,
                event.session,
                function callback(sessionAttributes, speechletResponse) {
                    context.succeed(buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === "SessionEndedRequest") {
            onSessionEnded(event.request, event.session);
            context.succeed();
        }
    } catch (e) {
        context.fail("Exception: " + e);
    }
};

// Do initialization here. This just does logging as no initialization is required
function onSessionStarted(sessionStartedRequest, session) {
    console.log("onSessionStarted requestId=" + sessionStartedRequest.requestId +
        ", sessionId=" + session.sessionId);
}

// Called when the user ends the session.
// Not when the skill returns shouldEndSession=true.
function onSessionEnded(sessionEndedRequest, session) {
    console.log("onSessionEnded requestId=" + sessionEndedRequest.requestId +
        ", sessionId=" + session.sessionId);
    // Clean up would go here. None required for this lambda.
}

// This function gets called when user invokes the skill with no additional intention
function onLaunch(launchRequest, session, callback) {
    console.log("onLaunch requestId=" + launchRequest.requestId +
        ", sessionId=" + session.sessionId);

    // create a welcome message and send that to Alexa
    getWelcomeResponse(callback);
}

// This is called when user utters intent for GMT/Zulu time
function onIntent(intentRequest, session, callback) {
    console.log("onIntent requestId=" + intentRequest.requestId +
        ", sessionId=" + session.sessionId);

    // log the intent name for debugging
    console.log("onIntent name=" + intentRequest.intent.name);        

    var intent = intentRequest.intent,
        intentName = intentRequest.intent.name;

    // Check which intent has been called and call appropriate function.
    if ("ZuluTime" === intentName) {
        setZuluInSession(intent, session, callback);
    } 
    else if ("AMAZON.HelpIntent" === intentName) {
        getHelpResponse(intent, session, callback);
    }
    else {
        throw "Invalid intent";
    }
}

// This provides welcome message to the user.
function getWelcomeResponse(callback) {
    // declare session attributes
    var sessionAttributes = {};
    // define title for the card
    var cardTitle = "Welcome";

    // here is what user will hear
    var speechOutput = "Welcome to the Greenwhich Time. " +
        "You can say something like, say Greenwhich Mean Time or say zulu time.";

    // if user does not respond, this will be played after a few seconds
    var repromptText = "Are you there? , " +
        "ask for GMT";

    // make sure that the session is not ended
    var shouldEndSession = false;

    // build the speech that user will hear
    callback(sessionAttributes,
        buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}

// Help response is provided when user asks for help during the session
// make sure that this is more elaborate than the standard welcome message.
function getHelpResponse(intent, session, callback) {
    // declare session attributes
    var sessionAttributes = {};
    // define title for the card.
    var cardTitle = "GMT Help";
    // here is the help provided to the user
    var speechOutput = "If you would like to know the current GMT, just say, " + " Ask Greenwich Time to say GMT.";

    // if user does not respond, this will be played after a few seconds
    var repromptText = "Are you there? , " +
        "ask for GMT";

    // make sure that the session is not ended
    var shouldEndSession = false;

    // build the speech that user will hear
    callback(sessionAttributes,
        buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}

// This function gets called when user asks for ZuluTime/GMT
function setZuluInSession(intent, session, callback) {
    // declare title of the card
    var cardTitle = intent.name;
    // session should end after this
    var shouldEndSession = true;
    // declare variables
    var speechOutput = "";
    var sessionAttributes = {};
    // reprompt text
    var repromptText = "are you there?";

    // the real logic to get GMT

    // Instantiate Date class
    var x = new Date();
    // build the speech telling user current UTC hours and minutes
    speechOutput = "It is " + x.getUTCHours() + " " + x.getUTCMinutes() + " GMT";

    // call helper that will compose speech and should session end attribute
    callback(sessionAttributes,
         buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}


// This takes title, output speech, reprompt text and flag indicating, if session should end
// and composes that in JSON
function buildSpeechletResponse(title, output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: "PlainText",
            text: output
        },
        card: {
            type: "Simple",
            title: title,
            content: output
        },
        reprompt: {
            outputSpeech: {
                type: "PlainText",
                text: repromptText
            }
        },
        shouldEndSession: shouldEndSession
    };
}

// This takes speech JSON, session attributes and builds the final response
// that will be returned
function buildResponse(sessionAttributes, speechletResponse) {
    return {
        version: "1.0",
        sessionAttributes: sessionAttributes,
        response: speechletResponse
    };
}