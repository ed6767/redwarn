// (c) Ed.E
// REPLACE WIKIEDITOR WITH NAME ONCE DECIDED!

var wikiEditor = {
    "visuals" : {
        "init" : (callback) => {
            // Load MDL and everything needed, then callback when all loaded
            $('head').append(`
                <link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons">
                <script src="https://code.getmdl.io/1.3.0/material.min.js" id="MDLSCRIPT"></script>
                <style>
                `+ wikiEditorStyle +`
                </style>
            `); // Append required libaries to page
            document.querySelector("#MDLSCRIPT").addEventListener("load", ((cb)=>{setTimeout(cb, 500)})(callback)); // when loaded, wait 1/2 second to give loading time to mdl
        },

        "register" : function(c) {
            // Register a componant with MDL
            componentHandler.upgradeElement(c);
        },

        "pageIcons" : ()=> {
            try {
                /* [[[[include pageIcons.html]]]] */
            } catch (error) {
                // Likely invalid theme
                dialogEngine.create(`
                <b>Sorry</b><br>
                RedWarn isn't compatible with this theme. Please revert to a compatible theme to continue using RedWarn.<br>
                <a href="https://en.wikipedia.org/wiki/Special:Preferences#mw-prefsection-rendering" style="font-size:25px">Go to Theme Preferences</a> <br>
                <a href='#' onclick='dialogEngine.dialog.close();'>Close</a>`).showModal();
                return; // Exit
            }
            

            // Now register all icons
            for (let item of document.getElementsByClassName("mdl-tooltip")) {
                wikiEditor.visuals.register(item); 
            }
            // That's done :)
        }
    },
    "alerts" : {
        "accountNotPermitted" : () => {
            // BEHAVIOR
            // Shows toast for 15 seconds, shows dialog on click
            wikiEditor.visuals.toast.show(`
                To prevent vandalism, you cannot use this tool until you are a confirmed user. Come back later.
                `, false, false, 15000);
        }
    },

    "info" : { // API
        "targetUsername": ()=>{return mw.config.values.wgRelevantUserName},
        "getUsername":  ()=>{return mw.config.values.wgUserName},

        "checkRevisionAge": (callback)=>{
            // Check if a revision is old or not
            // NEEDS OPTIMISATION. PULLED FROM TWINKLE SOURCE.
            
            try {
                let RelRevID = mw.util.getParamValue('vanarticlerevid');
                let isOld = 2; // 0 means not old, 1 means old, 2 means no related revision
                if (RelRevID) {
                    isOld = 0;
                    new Morebits.wiki.api('Grabbing the revision timestamps', {action: 'query', prop: 'revisions', rvprop: 'timestamp', revids: vanrevid}, function(apiobj) {
                        let vantimestamp = $(apiobj.getResponse()).find('revisions rev').attr('timestamp');
                        let revDate = new Morebits.date(vantimestamp);
                        if (vantimestamp && revDate.isValid()) {
                            if (revDate.add(24, 'hours').isBefore(new Date())) {
                                isOld = 1;
                            }
                        }
                    }).post();
                }
                callback(isOld);
            } catch (er) {
                callback(0); // no old rev id
            }
            
        },

        "getRelatedPage" : ()=> {
            try {
                let x = mw.util.getParamValue('vanarticle');
                if (x != null) {return x;} else {return "";}
            } catch (er) {
                // If none
                return "error";
            }  
        },

        "parseWikitext" : (wikiTxt, callback) => { // Uses Wikipedia's API to turn Wikitext to string
            $.getJSON("https://en.wikipedia.org/w/api.php?action=parse&text="+ encodeURI(wikiTxt) +"&contentmodel=wikitext&format=json&prop=text&pst=true&assert=user", (r)=> {
                let processedResult = r.parse.text['*'].replace(/\/\//g, "https://").replace(/href=\"\/wiki/g, `href="https://en.wikipedia.org/wiki`); // regex replace w direct urls
                console.log(processedResult)
                callback(processedResult); // make callback w HTML
            });
        },

        "addWikiTextToUserPage" : (user, text, underDate, summary, blacklist, blacklistToast) => {
            // Add text to a page. If underdate true, add it under a date marker
            $.getJSON("https://en.wikipedia.org/w/api.php?action=query&prop=revisions&titles=User_talk:"+user+"&rvslots=*&rvprop=content&formatversion=2&format=json", latestR=>{
                // Grab text from latest revision of talk page
                wikiEditor.visuals.toast.show("Please wait...", false, false, 2500);
                let revisionWikitext = latestR.query.pages[0].revisions[0].slots.main.content;
                let wikiTxtLines = revisionWikitext.split("\n");
                let finalTxt = "";

                // Check blacklist (if defined)
                if (blacklist) {
                    if (revisionWikitext.includes(blacklist)) {
                        // Don't continue and show toast
                        wikiEditor.visuals.toast.show(blacklistToast, false, false, 5000);
                        return;
                    }
                }

                // let's continue
                // Returns date in == Month Year == format and matches
                let currentDateHeading = ((d)=>{return "== " + ['January','February','March','April','May','June','July','August','September','October','November','December'][d.getMonth()] + " " + (1900 + d.getYear()) + " =="})(new Date);
                let pageIncludesCurrentDate = wikiTxtLines.includes(currentDateHeading);
                console.log(wikiTxtLines);
                console.log(pageIncludesCurrentDate);

                if (underDate) {
                    if (pageIncludesCurrentDate) {
                        // Locate and add text in section

                        // Locate where the current date section ends so we can append ours to the bottom
                        let locationOfLastLine = wikiTxtLines.indexOf(currentDateHeading) + 1; // in case of date heading w nothing under it
                        for (let i = wikiTxtLines.indexOf(currentDateHeading) + 1; i < wikiTxtLines.length; i++) {
                            // For each
                            if (wikiTxtLines[i].startsWith("==")) {
                                // New section
                                locationOfLastLine = i - 1; // the line above is therefore the last
                                console.log(wikiTxtLines[i]);
                                break; // exit the loop
                            }
                        }
                        if (locationOfLastLine == wikiTxtLines.length - 1) {
                            // To prevent to end notices squishing against eachother
                            // Same as without, but we just include the date string at bottom of page
                            wikiTxtLines.push(["\n\n" + text]);
                        } else {
                            wikiTxtLines.splice(locationOfLastLine, 0, ["\n\n" + text]); // Add notice to array at correct position. Note the "" at the start is for a newline to seperate from prev content
                        }
                    } else {
                        // Same as without, but we just include the date string at bottom of page
                        wikiTxtLines.push(["\n" + currentDateHeading + "\n\n" + text]);
                    }
                } else {
                    // No need to add to date. Just shove at the bottom of the page
                    wikiTxtLines.push([text]);
                }

                // Process final string
                wikiTxtLines.forEach(ln => finalTxt = finalTxt + ln + "\n"); // Remap to lines
                console.log(finalTxt);

                // Push edit using CSRF token, post as more secure
                $.post("https://en.wikipedia.org/w/api.php", {
                    "action": "edit",
                    "format": "json",
                    "token" : mw.user.tokens.get("csrfToken"),
                    "title" : "User_talk:"+ user,
                    "summary" : summary + " (RedWarn)", // summary sign here
                    "text": finalTxt
                }).done(dt => {
                    // We done. Check for errors, then callback appropriately
                    if (!dt.edit) {
                        // Error occured or other issue
                        console.error(dt);
                        wikiEditor.visuals.toast.show("Sorry, there was an error. See the console for more info. Your message has not been sent.");
                        // Reshow dialog
                        dialogEngine.dialog.showModal();
                    } else {
                        // Success! Redirect to complete page
                        let reloadNeeded = window.location.href.includes("https://en.wikipedia.org/wiki/User_talk:"+ user); // if we are already on the talk page we need to refresh as this would just change the hash
                        window.location.replace("https://en.wikipedia.org/wiki/User_talk:"+ user + "#noticeApplied-" + dt.edit.newrevid + "-" + dt.edit.oldrevid); // go to talk page
                        if (reloadNeeded) {location.reload();}
                        // We done
                    }
                });
            }); 
        }, // end addTextToUserPage

        "quickWelcome" : ()=>{
            // Quickly welcome the current user
            wikiEditor.info.addWikiTextToUserPage(wikiEditor.info.targetUsername(), "\n{{welcome}}\n", false, "Welcome", "{{welcome}}", "This user has already been welcomed.");
        },

        // Used for rollback
        "isLatestRevision" : (name, revID, callback) => { // callback only if successful!! in other cases, will REDIRECT to latest revison compare page
            // Check if revsion is the latest revision
            $.getJSON("https://en.wikipedia.org/w/api.php?action=query&prop=revisions&titles="+ name +"&rvslots=*&rvprop=ids&formatversion=2&format=json", r=>{
                // We got the response
                let latestRId = r.query.pages[0].revisions[0].revid;
                let parentRId = r.query.pages[0].revisions[0].parentid;
                if (latestRId == revID) {
                    // Yup! Send the callback
                    callback();
                } else {
                    // Nope :(
                    // Load the preview page of the latest one
                    window.location.replace("https://en.wikipedia.org/w/index.php?title="+ name +"&diff="+ latestRId +"&oldid="+ parentRId +"&diffmode=source#redirectLatestRevision");
                }
            });
        },

        "latestRevisionNotByUser" : (name, username, callback) => { // CALLBACK revision, summaryText
            // Name is page name, username is bad username
            $.getJSON("https://en.wikipedia.org/w/api.php?action=query&prop=revisions&titles="+ name +"&rvslots=*&rvprop=ids%7Cuser%7Ccontent&rvexcludeuser="+ username +"&formatversion=2&format=json", r=>{
                // We got the response
                let latestRId = r.query.pages[0].revisions[0].revid;
                let latestContent = r.query.pages[0].revisions[0].slots.main['*'];
                console.log(latestContent);
            });
        }
    },
    "ui" : {
        "beginWarn" : (ignoreWarnings)=> {
            // Give user a warning (show dialog)
            if ((wikiEditor.info.targetUsername() == wikiEditor.info.getUsername()) && !ignoreWarnings) {
                // Usernames are the same, give toast.
                wikiEditor.visuals.toast.show("You can not warn yourself. To test this tool, use User talk:Sandbox for user warnings.", false, false, 7500);
                return; // DO NOT continue.
            }

            wikiEditor.info.checkRevisionAge((oldness)=>{ // Check if older than 24 hrs
                if ((oldness == 1) && !ignoreWarnings) {
                    // over 24hrs old. we show the toast, nothing else happens
                    wikiEditor.visuals.toast.show("The revision being reported is old. Your warning may be stale.", "Continue", function() {
                        wikiEditor.ui.beginWarn(true);
                    }, 5000);
                } else {
                    // Let's continue
                    let finalListBox = "";
                    rules.forEach((rule, i) => {
                        let style = "";
                        if (rule.name.length > 62) {
                            // Too long to fit
                            style="font-size:14px"
                        }
                        finalListBox += `<li class="mdl-menu__item" data-val="`+ i +`" onmousedown="refreshLevels(`+i+`);"style="`+style +`">`+ rule.name +`</li>`;
                    });

                    // Setup preview handling
                    addMessageHandler("generatePreview`*", m=>{
                        wikiEditor.info.parseWikitext(m.split("`")[1], parsed=>{ // Split to Wikitext and send over to the API to be handled
                            dialogEngine.dialog.getElementsByTagName("iframe")[0].contentWindow.postMessage({
                                "action": "parseWikiTxt",
                                "result": parsed}, '*'); // push to container for handling in dialog and add https:// to stop image breaking
                        });
                    });

                    // Add toast handler
                    addMessageHandler("pushToast`*", m=>wikiEditor.visuals.toast.show(m.split('`')[1],false,false,15000));

                    // Add submit handler

                    addMessageHandler("applyNotice`*", eD=> {
                        // i.e applyNotice`user`wikitext`summary
                        // TODO: maybe b64 encode?
                        let _eD = eD.split("`"); // params
                        let user = _eD[1];
                        let wikiTxt = _eD[2];
                        let summary = _eD[3];

                        // MAKE EDIT
                        wikiEditor.info.addWikiTextToUserPage(user, wikiTxt, true, summary);
                    });

                    // CREATE DIALOG
                    // MDL FULLY SUPPORTED HERE (container). 
                    dialogEngine.create(mdlContainers.generateContainer(`
                    [[[[include warnUserDialog.html]]]]
                    `, 500, 630)).showModal(); // 500x630 dialog, see warnUserDialog.html for code
                }
            });
        }, // end beginWarn

        "newMsg" : ()=>{
            // New message dialog
            // Setup preview handling
            addMessageHandler("generatePreview`*", m=>{
                wikiEditor.info.parseWikitext(m.split("`")[1], parsed=>{ // Split to Wikitext and send over to the API to be handled
                    dialogEngine.dialog.getElementsByTagName("iframe")[0].contentWindow.postMessage({
                        "action": "parseWikiTxt",
                        "result": parsed}, '*'); // push to container for handling in dialog and add https:// to stop image breaking
                });
            });

            // Add toast handler
            addMessageHandler("pushToast`*", m=>wikiEditor.visuals.toast.show(m.split('`')[1],false,false,15000));

            // Add submit handler

            addMessageHandler("applyNotice`*", eD=> {
                // i.e applyNotice`user`wikitext`summary
                // TODO: maybe b64 encode?
                let _eD = eD.split("`"); // params
                let user = _eD[1];
                let wikiTxt = _eD[2];
                let summary = _eD[3];

                // MAKE EDIT
                wikiEditor.info.addWikiTextToUserPage(user, wikiTxt, false, summary); // This requires title.
            });

            // CREATE DIALOG
            // MDL FULLY SUPPORTED HERE (container). 
            dialogEngine.create(mdlContainers.generateContainer(`
            [[[[include newMsg.html]]]]
            `, 500, 390)).showModal(); // 500x390 dialog, see newMsg.html for code
        }
    }
};

var messageHandlers = {"testHandler": () => {alert("Working!");}};

function addMessageHandler(msg, callback) { // calling more than once will just overwrite
    Object.assign(messageHandlers, ((a,b)=>{let _ = {}; _[a]=b; return _;})(msg, callback)); // function ab returns a good formatted obj
}

window.onmessage = function(e){
    if (messageHandlers[e.data]){messageHandlers[e.data]();} // Excecute handler if exact
    else { // We find ones that contain
        for (const evnt in messageHandlers) {
            if ((evnt.substr(evnt.length - 1) == "*") && e.data.includes(evnt.substr(0, evnt.length - 2))) { // and includes w * chopped off
                messageHandlers[evnt](e.data);
                return;
            } // if contains and ends with wildcard then we do it
        }
    }
};

// init everthing
function initwikiEdit() {
    wikiEditor.visuals.init(()=>{
        wikiEditor.visuals.toast.init();
        dialogEngine.init();
        wikiEditor.visuals.pageIcons();

        // Check if a message is in URL (i.e edit complete ext)
        if(window.location.hash.includes("#noticeApplied-")) {
            // Show toast w undo edit capabilities
            // #noticeApplied-currentEdit-pastEdit
            wikiEditor.visuals.toast.show("Message saved", "UNDO", ()=>{
                // Redirect to undo page mw.config.get("wgRelevantPageName");
                // TODO: maybe replace with custom page in future? 
                window.location.href = "/w/index.php?title="+ mw.config.get("wgRelevantPageName") +"&action=edit&undoafter="+ window.location.hash.split("-")[2] +"&undo="+ window.location.hash.split("-")[1];
            }, 7500);
        } else if (window.location.hash.includes("#redirectLatestRevision")) {
            wikiEditor.visuals.toast.show("You were automatically redirected to the lastest revision due to an edit conflict.");
        }
    });
}