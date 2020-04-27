// API calls ext.
wikiEditor.info = { // API
    "targetUsername": un=>{
        if (un) {return un;} // return username if defined
        return mw.config.values.wgRelevantUserName},
    "getUsername":  ()=>{return mw.config.values.wgUserName},

    "featureRestrictPermissionLevel": (l, callback, callbackIfNot)=> {
        // Restrict feature to users in this group
        mw.user.getGroups(g=>{
            let hasPerm = g.includes(l);
            if (l == "confirmed" && !hasPerm) {hasPerm = g.includes("autoconfirmed");} // Due to 2 types of confirmed user, confirmed and autoconfirmed, we have to check both
            if (hasPerm) {
                // Has the permission needed
                if (callback) {
                    callback();
                }
            } else {
                if (callbackIfNot) {
                    // Make no perm callback
                    callbackIfNot();
                } else {
                    // Show no perm toast
                    wikiEditor.visuals.toast.show("Your account doesn't have permission to do that yet.", false, false, 5000);
                }
            }
        });
    },

    "getRelatedPage" : (pg)=> {
        if (pg) {return pg;} // return page if defined
        try {
            let x = mw.util.getParamValue('vanarticle');
            if (x != null) {return x;} else {return "";}
        } catch (er) {
            // If none
            return "error";
        }  
    },

    "parseWikitext" : (wikiTxt, callback) => { // Uses Wikipedia's API to turn Wikitext to string. NEED TO USE POST IF USERPAGE IS LARGE EXT..
    $.post("https://en.wikipedia.org/w/api.php", {
                "action": "parse",
                "format": "json",
                "contentmodel" : "wikitext",
                "prop": "text",
                "pst": true,
                "assert": "user",
                "text": wikiTxt
            }).done(r => {
                let processedResult = r.parse.text['*'].replace(/\/\//g, "https://").replace(/href=\"\/wiki/g, `href="https://en.wikipedia.org/wiki`); // regex replace w direct urls
                callback(processedResult); // make callback w HTML
            });
    },

    "lastWarningLevel" : (user, callback)=> { // callback(wLevel. thisMonthsNotices, userPg) 0 none 1 notice 2 caution 3 warning 4 final warning
        // Get the last warning level of a user this month
        $.getJSON("https://en.wikipedia.org/w/api.php?action=query&prop=revisions&titles=User_talk:"+user+"&rvslots=*&rvprop=content&formatversion=2&format=json", latestR=>{
            // Grab text from latest revision of talk page
            // Check if exists
            let revisionWikitext = "";
            if (!latestR.query.pages[0].missing) { // If page isn't missing, i.e exists
                revisionWikitext = latestR.query.pages[0].revisions[0].slots.main.content;
            } else {
                // Return that record is clean as no past warnings due to page not existing
                callback(0, "Talk page doesn't exist.", "Talk page doesn't exist."); // exit
                return;
            }
            let wikiTxtLines = revisionWikitext.split("\n");
            // let's continue
            // Returns date in == Month Year == format and matches
            let currentDateHeading = ((d)=>{return "== " + ['January','February','March','April','May','June','July','August','September','October','November','December'][d.getMonth()] + " " + (1900 + d.getYear()) + " =="})(new Date);
            let pageIncludesCurrentDate = wikiTxtLines.includes(currentDateHeading);
            if (!pageIncludesCurrentDate) {
                // No warnings this month
                callback(0, "No notices for this month.", revisionWikitext);
                return;
            }

            let highestWarningLevel = 0; // Set highest to nothing so if there is a date title w nothing in then that will be reported 
            let thisMonthsNotices = ""; // for dialog
            // For each line
            for (let i = wikiTxtLines.indexOf(currentDateHeading) + 1; i < wikiTxtLines.length; i++) {
                if (wikiTxtLines[i].startsWith("==")) {
                    // New section
                    break; // exit the loop
                }

                // Check if it contains logo for each level
                thisMonthsNotices += wikiTxtLines[i]; // Add to this months
                if (wikiTxtLines[i].includes("File:Stop hand nuvola.svg")) { // Level 4 warning
                    // This is the highest warning level. We can leave now
                    highestWarningLevel = 4;
                    break; // exit the loop
                }

                // Not using elseif in case of formatting ext..

                if (wikiTxtLines[i].includes("File:Nuvola apps important.svg")) { // Level 3 warning
                    highestWarningLevel = 3; // No need for if check as highest level exits
                }

                if (wikiTxtLines[i].includes("File:Information orange.svg")) { // Level 2 warning
                    if (highestWarningLevel < 3) {
                        // We can set
                        highestWarningLevel = 2;
                    }
                }

                if (wikiTxtLines[i].includes("File:Information.svg")) { // Level 1 notice
                    if (highestWarningLevel < 2) {
                        // We can set
                        highestWarningLevel = 1;
                    }
                }
            } // End for loop

            callback(highestWarningLevel, thisMonthsNotices, revisionWikitext); // We done

        });
    },// End lastWarningLevel

    "addWikiTextToUserPage" : (user, text, underDate, summary, blacklist, blacklistToast) => {
        // Add text to a page. If underdate true, add it under a date marker
        wikiEditor.visuals.toast.show("Please wait...", false, false, 2500);
        $.getJSON("https://en.wikipedia.org/w/api.php?action=query&prop=revisions&titles=User_talk:"+user+"&rvslots=*&rvprop=content&formatversion=2&format=json", latestR=>{
            // Grab text from latest revision of talk page
            // Check if exists
            let revisionWikitext = "";
            if (!latestR.query.pages[0].missing) { // If page isn't missing, i.e exists
                revisionWikitext = latestR.query.pages[0].revisions[0].slots.main.content;
            } // else we keep to ""
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

            // Push edit using CSRF token
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

    "quickWelcome" : un=>{
        // Quickly welcome the current user
        wikiEditor.info.addWikiTextToUserPage(wikiEditor.info.targetUsername(un), "\n{{welcome}}\n", false, "Welcome", "{{welcome}}", "This user has already been welcomed.");
    },

    // Used for rollback
    "isLatestRevision" : (name, revID, callback) => { // callback(username) only if successful!! in other cases, will REDIRECT to latest revison compare page
        // Check if revsion is the latest revision
        $.getJSON("https://en.wikipedia.org/w/api.php?action=query&prop=revisions&titles="+ encodeURIComponent(name) +"&rvslots=*&rvprop=ids%7Cuser&formatversion=2&format=json", r=>{
            // We got the response
            let latestRId = r.query.pages[0].revisions[0].revid;
            let parentRId = r.query.pages[0].revisions[0].parentid;
            let latestUsername = r.query.pages[0].revisions[0].user;
            if (latestRId == revID) {
                // Yup! Send the callback
                callback(latestUsername);
            } else {
                // Nope :(
                // Load the preview page of the latest one
                try {if (dialogEngine.dialog.open) {return;}} catch (error) {} // DO NOT REDIRECT IF DIALOG IS OPEN.
                window.location.replace("https://en.wikipedia.org/w/index.php?title="+ encodeURIComponent(name) +"&diff="+ latestRId +"&oldid="+ parentRId +"&diffmode=source#redirectLatestRevision");
            }
        });
    },

    "latestRevisionNotByUser" : (name, username, callback) => { // CALLBACK revision, summaryText, rId
        // Name is page name, username is bad username
        $.getJSON("https://en.wikipedia.org/w/api.php?action=query&prop=revisions&titles="+ encodeURIComponent(name) +"&rvslots=*&rvprop=ids%7Cuser%7Ccontent&rvexcludeuser="+ username +"&formatversion=2&format=json", r=>{
            // We got the response
            let _r;
            try {
                _r = r.query.pages[0].revisions[0]; // get latest revision
                if (_r == null) { throw "can't be null"; } // if empty error
            } catch (error) {
                // Probably no other edits. Redirect to history page and show the notice
                window.location.replace("https://en.wikipedia.org/w/index.php?title="+ encodeURIComponent(name) +"&action=history#rollbackFailNoRev");
                return; // exit
            }



            console.log("_r");
            let latestContent = _r.slots.main.content;
            let summary = "Rollback recent rev. by [[Special:Contributions/"+ username +"|"+ username +"]] ([[User_talk:"+ username +"|talk]]) to rev. "+ _r.revid +" by " +_r.user;
            callback(latestContent, summary, _r.revid);
        });
    },

    "stripWikiTxt" : wikiTxt=> {
        // VERY BASIC Convert WikiText to string
        try {
            wikiTxt = wikiTxt.replace(/<!--[^>]*-->/g, ""); // Strip html comments
            wikiTxt.match(/\[\[(?:[^\]\]]*)\]\]/g).forEach(t=>{
                txtToKeep = (a=>{return a[a.length - 1];})(t.split("|")).replace("]]", ""); // Last | iin the string then rm the end
                wikiTxt = wikiTxt.replace(t, txtToKeep); // now replace
            });
            wikiTxt = wikiTxt.replace(/'''/g, ""); // rm bold
        } catch (err) {} // Probably no wikitxt there
         return wikiTxt;
    }
    
};