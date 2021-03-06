// Author: Sara Amani, Basim Ali
// Copyright (c) 2016, Semcon Sweden AB
// All rights reserved.

// Redistribution and use in source and binary forms, with or without modification, are permitted
// provided that the following conditions are met:
// 1. Redistributions of source code must retain the above copyright notice,
//    this list of conditions and the following disclaimer.
// 2. Redistributions in binary form must reproduce the above copyright notice,  this list of conditions and
//    the following disclaimer in the documentation and/or other materials provided with the distribution.
// 3. Neither the name of the Semcon Sweden AB nor the names of its contributors may be used to endorse or
//    promote products derived from this software without specific prior written permission.

// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
// AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
// IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
// DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
// FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
// DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
// SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
// CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
// OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
// OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

var dropdownTerms;
var currentTerms;
var currentURL;
var jsonData;

var DATA_URL = 'https://raw.githubusercontent.com/Semcon/re-search-config/master/data.json';
var TIP_URL = 'http://semcon.com/re-search-tip/';

var resizeNextContent = false;

var windowRight = false;
var windowLeft = false;

var height;
var width;
var wTop;
var left;
var initialWidth = false;

var tabLeft = false;
var tabRight = false;

var eventListenerWindowLeft = false;
var eventListenerWindowRight = false;
var eventListenerTabLeft = false;
var eventListenerTabRight = false;

var showBar = true;

//First time running script to check what value showBar is in local storage.
//If showBar is undefined it gets set to enabled otherwise it gets the value.

showBar = localStorage.getItem('showBar');

if( typeof showBar === 'undefined' || showBar === null ){
    showBar = true;
    localStorage.setItem('showBar', showBar);
}

// This is used in content.js directly
// eslint-disable-next-line no-unused-vars
function enableToolbar(){
    showBar = true;
    localStorage.setItem('showBar', showBar);
    runToolbarScript();
    sendToolbarStatusToAll();
    var popovers = safari.extension.popovers;

    for(var i = 0; i < popovers.length; i = i + 1){
        popovers[i].contentWindow.postMessage('enableToolbar', '*');
    }
}

function disableToolbar(){
    showBar = false;
    localStorage.setItem('showBar', showBar);
    runToolbarScript();
    sendToolbarStatusToAll();
    var popovers = safari.extension.popovers;

    for(var i = 0; i < popovers.length; i = i + 1){
        popovers[i].contentWindow.postMessage('disableToolbar', '*');
    }
}

//Close handlers for windows and tabs

function closeHandlerTabLeft() {
    tabLeft.removeEventListener('close', closeHandlerTabLeft, false);
    eventListenerTabLeft = false;
    tabLeft = false;
}

function closeHandlerTabRight(){
    tabRight.removeEventListener('close', closeHandlerTabRight, false);
    eventListenerTabRight = false;
    tabRight = false;
}

function closeHandlerWindowLeft(){
    windowLeft.removeEventListener('close', closeHandlerWindowLeft, false);
    eventListenerWindowLeft = false;
    windowLeft = false;
    if( windowRight === false ){
        initialWidth = false;
        return false;
    }

    if( typeof windowRight.tabs === 'undefined' ){
        return false;
    }

    for(var i = 0; i < windowRight.tabs.length; i = i + 1){
        if(typeof windowRight.tabs[i].url !== 'undefined'){
            windowRight.tabs[i].page.dispatchMessage('message', {
                resizeWindow: true,
                width: initialWidth,
                height: Math.max(height, 0),
                left: Math.max(left, 0),
                top: Math.max(wTop, 0)
            });

            windowRight.activate();
            windowRight.removeEventListener('close', closeHandlerWindowRight, false);
            eventListenerWindowRight = false;
            windowRight = false;

            if(tabRight !== false){
                tabRight.removeEventListener('close', closeHandlerTabRight, false);
                eventListenerTabRight = false;
                tabRight = false;
            }

            break;
        }
    }
}

function closeHandlerWindowRight(){
    if(windowLeft === false){
        initialWidth = false;
        return false;
    }

    if(typeof windowLeft.tabs === 'undefined'){
        return false;
    }

    for(var i = 0; i < windowLeft.tabs.length; i = i + 1){
        if(typeof windowLeft.tabs[i].url !== 'undefined'){
            windowLeft.tabs[i].page.dispatchMessage('message', {
                resizeWindow: true,
                width: initialWidth,
                height: Math.max(height, 0),
                left: Math.max(left, 0),
                top: Math.max(wTop, 0)
            });

            windowLeft.activate();
            windowRight.removeEventListener('close', closeHandlerWindowRight, false);
            eventListenerWindowRight = false;
            windowRight = false;

            break;
        }
    }
}

function loadTerms(){
    var xhr = new XMLHttpRequest();
    xhr.open( 'GET', DATA_URL, true );
    xhr.onreadystatechange = function() {
        if ( xhr.readyState === 4 && xhr.status === 200 ) {
            jsonData = JSON.parse( xhr.responseText );
        }
    }

    xhr.send();
}

loadTerms();
setInterval( loadTerms, 21600000 );

function sendTip(tipTerm){
    var xhr = new XMLHttpRequest();
    xhr.open( 'POST', TIP_URL, true );
    xhr.setRequestHeader( 'Content-Type', 'application/x-www-form-urlencoded' );
    xhr.onreadystatechange = function() {
        if ( xhr.readyState === 4 && xhr.status === 200 ) {
            console.log( 'Tip sent' );
        }
    }

    xhr.send( 'term=' + encodeURIComponent( tipTerm ).replace( /%20/g, '+' ) );
}

// eslint-disable-next-line max-params
function showWindows(term, newTerm, windowWidth, windowHeight, windowScreenLeft, windowScreenTop, searchOriginWindow) {
    if(typeof currentURL === 'undefined'){
        return false;
    }

    width = windowWidth;
    height = windowHeight;
    left = windowScreenLeft;
    wTop = windowScreenTop;

    if(!initialWidth){
        initialWidth = windowWidth;
    }

    var link = currentURL + newTerm;
    var originLink = currentURL + term;

    if (!windowRight || typeof windowRight === 'undefined') {
        resizeNextContent = true;
        windowRight = safari.application.openBrowserWindow();

        if(!eventListenerWindowRight){
            windowRight.addEventListener('close', closeHandlerWindowRight, false);
            eventListenerWindowRight = true;
        }

        tabRight = windowRight.tabs[0];

        if(!eventListenerTabRight){
            tabRight.addEventListener('close', closeHandlerTabRight, false);
            eventListenerTabRight = true;
        }

        tabRight.url = link;
        tabRight.activate();

        tabLeft.page.dispatchMessage("message",{
            resizeWindow: true,
            width: Math.max(width / 2, 0),
            height: Math.max(height, 0),
            left: Math.max(left, 0),
            top: Math.max(wTop, 0)
        });
    } else {

        if (searchOriginWindow.page === tabRight.page) {
            if(tabLeft !== false){
                tabLeft.url = originLink;
                tabLeft.activate();
            } else {
                tabLeft = windowLeft.openTab();
                if( !eventListenerTabLeft ){
                    tabLeft.addEventListener('close', closeHandlerTabLeft, false);
                    eventListenerTabLeft = true;
                }

                tabLeft.url = originLink;
            }
        }

        if( !tabRight ){
            tabRight = windowRight.openTab();
            if(!eventListenerTabRight){
                tabRight.addEventListener('close', closeHandlerTabRight, false);
                eventListenerTabRight = true;
            }
            tabRight.url = link;
            tabRight.activate();
        } else {
            tabRight.url = link;
            tabRight.activate();
        }
    }
}


function runToolbarScript(){
    if( !currentURL ){
        return false;
    }

    safari.extension.addContentStyleSheetFromURL(
        safari.extension.baseURI + 'toolbar.css'
    );
}

function hasBetterTerm( term ){
    var lowercaseTerms;
     if( typeof currentTerms === 'undefined' ){
         return false;
     }

     term = term.toLowerCase();

     lowercaseTerms = Object.keys( currentTerms ).map( function( string ){
         return string.toLowerCase();
     });

     if( lowercaseTerms.indexOf( term ) > -1 ){
         return currentTerms[ Object.keys( currentTerms )[ lowercaseTerms.indexOf( term ) ] ];
     }

     return false;
}


function isValidUrl( url ){
    if( !getEngine( url ) ){
        return false;
    }
    return true;
}


function getEngine( url ){
    if( typeof jsonData === 'undefined' ) {
        return false;
    }

    if( typeof url === 'undefined' ){
        return false;
    }

    for( var i = 0; i < jsonData.engines.length; i = i + 1 ){
        var matchCount = 0;
        // Loop over all required matches for the engine
        for( var matchIndex = 0; matchIndex < jsonData.engines[ i ].match.length; matchIndex = matchIndex + 1 ){
            if( url.indexOf( jsonData.engines[ i ].match[ matchIndex ] ) > -1 ){
                // We have a match, increment our counter
                matchCount = matchCount + 1;
            }
        }
        // If we have the same number of matches as required matches we have a valid site
        if( matchCount === jsonData.engines[ i ].match.length ){
            return jsonData.engines[ i ];
        }
    }

    return false;
}


// Content script calls this function to get information about the search engine.
// If the website matches any of the required, the terms will be declared and the
// search field selector will be sent back to the content script

function getEngineInformation(messageEvent) {
    var currentEngine = getEngine( messageEvent.message.url );

    if( !currentEngine ){
        return false;
    }

    currentTerms = {};
    dropdownTerms = [];

    for ( var key in jsonData.terms[ currentEngine.terms ] ){
        currentTerms[ key ] = jsonData.terms[ currentEngine.terms ][ key ].updated;
        if( jsonData.terms[ currentEngine.terms ][ key ].dropdown ){
            dropdownTerms.push( key );
        }
    }

    currentURL = currentEngine.url;
    runToolbarScript();

    messageEvent.target.page.dispatchMessage('message', {
        selectorSearchField: currentEngine.selectors.input
    });

    return true;
}

function sendToolbarStatusToAll(){
    if( !windowLeft && !windowRight ){
        var browserWindows = safari.application.browserWindows;
        for( var i = 0; i < browserWindows.length; i = i + 1 ){
            if(typeof browserWindows[i].activeTab.page !== 'undefined'){
                browserWindows[i].activeTab.page.dispatchMessage('message', {
                    showBar: showBar
                });
            }
        }
    }

    if(windowLeft !== false){
        if(typeof windowLeft.tabs !== 'undefined'){
            for(var x = 0; x < windowLeft.tabs.length; x = x + 1 ){
                if(typeof windowLeft.tabs[x].page !== 'undefined'){
                    windowLeft.tabs[x].page.dispatchMessage('message', {
                        showBar: showBar
                    });
                }
            }
        }
    }

    if(windowRight !== false){
        if(typeof windowRight.tabs !== 'undefined'){
            for(var j = 0; j < windowRight.tabs.length; j = j + 1){
                if(typeof windowRight.tabs[j].page !== 'undefined'){
                    windowRight.tabs[j].page.dispatchMessage('message', {
                        showBar: showBar
                    });
                }
            }
        }
    }
}

// Message handler for all incoming messages
// eslint-disable-next-line complexity
safari.application.addEventListener('message', function(MessageEvent) {
    var betterTerm = false;

    switch (MessageEvent.message.action) {
        case 'resize':
            if(resizeNextContent){
                MessageEvent.target.page.dispatchMessage("message", {
                    resizeWindow: true,
                    width: Math.max(width / 2, 0),
                    height: Math.max(height, 0),
                    left: Math.max(left + (width / 2), 0),
                    top: Math.max(wTop, 0)
                });

                resizeNextContent = false;
            }

            break;
        case 'getEngineInformation':
            getEngineInformation(MessageEvent);

            break;
        case 'searchForTerm':
            betterTerm = hasBetterTerm(MessageEvent.message.term);

            if( !betterTerm ){
                break;
            }

            if(MessageEvent.target !== tabLeft && MessageEvent.target !== tabRight){

                tabLeft = MessageEvent.target;
                if(!eventListenerTabLeft){
                    tabLeft.addEventListener('close', closeHandlerTabLeft, false);
                    eventListenerTabLeft = true;
                }
                windowLeft = tabLeft.browserWindow;
                if(!eventListenerWindowLeft){
                    windowLeft.addEventListener('close', closeHandlerWindowLeft, false);
                    eventListenerWindowLeft = true;
                }
            } else if( MessageEvent.target.browserWindow !== windowLeft ){
                if(!windowLeft){
                    windowLeft = MessageEvent.target.browserWindow;
                    if(!eventListenerWindowLeft){
                        windowLeft.addEventListener('close', closeHandlerWindowLeft, false);
                        eventListenerWindowLeft = true;
                    }
                }
            }

            showWindows(MessageEvent.message.term, betterTerm, MessageEvent.message.windowWidth, MessageEvent.message.windowHeight, MessageEvent.message.windowScreenLeft, MessageEvent.message.windowScreenTop, MessageEvent.target);

            break;
        case 'updateTabURL':

            if(typeof currentURL !== 'undefined'){
                var newURL = currentURL + MessageEvent.message.term;
                if(tabLeft !== false){
                    tabLeft.url = newURL;
                    tabLeft.activate();
                } else if ( !windowRight ){
                    MessageEvent.target.url = newURL;
                    MessageEvent.target.activate();
                } else {
                    tabLeft = windowLeft.openTab();
                    if(!eventListenerTabLeft){
                        tabLeft.addEventListener('close', closeHandlerTabLeft, false);
                        eventListenerTabLeft = true;
                    }
                    tabLeft.url = newURL;
                    tabLeft.activate();
                }
            }

            break;
        case 'getDropdownTerms':
            MessageEvent.target.page.dispatchMessage('message', {
                dropdownTerms: dropdownTerms
            });

            break;
        case 'isValidUrl':
            if( isValidUrl(MessageEvent.message.url) ){
                MessageEvent.target.page.dispatchMessage('message', {
                    valid: true
                });

            } else {
                MessageEvent.target.page.dispatchMessage('message', {
                    valid: false
                });
            }

            break;
        case 'sendTip':
            sendTip(MessageEvent.message.tipTerm);

            break;
        case 'getToolbarStatus':
            sendToolbarStatusToAll();

            break;
        case 'disableToolbar':
            disableToolbar();

            break;
        default:
            console.log( 'Message to event page was not handled: ', MessageEvent.message );
    }

    return true;
}, false);
