// Most UI elements
// See also dialog.js (dialogEngine) and mdlContainer.js (mdlContainer)
wikiEditor.ui = {

    "revisionBrowser" : url=> {
        // Show new container for revision reviewing
        dialogEngine.create(mdlContainers.generateContainer(`
        <div id="close" class="icon material-icons" style="float:right;">
            <span style="cursor: pointer; padding-right:15px;" onclick="window.parent.postMessage('closeDialog');">
                clear
            </span>
        </div>
        <div class="mdl-tooltip" for="close">
            Close
        </div>
        <iframe src="`+ url +`" frameborder="0" style="height:95%;"></iframe>
        `, document.body.offsetWidth-70, document.body.offsetHeight-50)).showModal();
    },

    "beginWarn" : (ignoreWarnings, un, pg)=> {
        // Give user a warning (show dialog)
        if ((wikiEditor.info.targetUsername(un) == wikiEditor.info.getUsername()) && !ignoreWarnings) {
            // Usernames are the same, give toast.
            wikiEditor.visuals.toast.show("You can not warn yourself. To test this tool, use a sandbox.", false, false, 7500);
            return; // DO NOT continue.
        }

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
        addMessageHandler("pushToast`*", m=>wikiEditor.visuals.toast.show(m.split('`')[1],false,false, 5000));

        // Add admin report handler
        addMessageHandler("adminR", ()=>wikiEditor.ui.openAdminReport(un));

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

        // Check most recent warning level

        wikiEditor.info.lastWarningLevel(wikiEditor.info.targetUsername(un), (w, usrPgMonth, userPg)=>{
            let lastWarning = [ // Return HTML for last warning level.
                // NO PAST WARNING
                `
                <span class="material-icons" id="PastWarning" style="cursor:help;position: relative;top: 5px;padding-left: 10px;color:green;">thumb_up</span>
                <div class="mdl-tooltip mdl-tooltip--large" for="PastWarning">
                    <span style="font-size:x-small;">
                    No notices this month.
                    </span>
                </div>
                `,

                // NOTICE
                `
                <span class="material-icons" id="PastWarning" style="cursor:help;position: relative;top: 5px;padding-left: 10px;color:blue;">info</span>
                <div class="mdl-tooltip mdl-tooltip--large" for="PastWarning">
                    <span style="font-size:x-small;">
                    Has been given a Level 1 notice this month.
                    </span>
                </div>
                `,
                // CAUTION
                `
                <span class="material-icons" id="PastWarning" style="cursor:help;position: relative;top: 5px;padding-left: 10px;color:orange;">announcement</span>
                <div class="mdl-tooltip mdl-tooltip--large" for="PastWarning">
                    <span style="font-size:x-small;">
                    Has been given a Level 2 caution this month.
                    </span>
                </div>
                `,
                // Warning- in red. RedWarn, get it? This is the peak of programming humour.
                `
                <span class="material-icons" id="PastWarning" style="cursor:help;position: relative;top: 5px;padding-left: 10px; color:red;">report_problem</span>
                <div class="mdl-tooltip mdl-tooltip--large" for="PastWarning">
                    <span style="font-size:x-small;">
                    Has been given a Level 3 warning this month.
                    </span>
                </div>
                `,

                // Final/Only Warning (dark red) TODO: Click opens admin report pannel.
                `
                <span class="material-icons" id="PastWarning" style="cursor:pointer;position: relative;top: 5px;padding-left: 10px;color:#a20000;" onclick="window.parent.postMessage('adminR');">report</span>
                <div class="mdl-tooltip mdl-tooltip--large" for="PastWarning">
                    <span style="font-size:x-small;">
                    Has been given a Level 4 Final or ONLY warning.<br/>
                    Click here to report to admins for vandalism. Review user page first.
                    </span>
                </div>
                `
            ][w];

            // CREATE DIALOG
            // MDL FULLY SUPPORTED HERE (container). 
            dialogEngine.create(mdlContainers.generateContainer(`
            [[[[include warnUserDialog.html]]]]
            `, 500, 630)).showModal(); // 500x630 dialog, see warnUserDialog.html for code
        });
            
    }, // end beginWarn

    "newMsg" : un=>{
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
    },

    "registerContextMenu" : () => { // Register context menus for right-click actions
        // More docs at https://swisnl.github.io/jQuery-contextMenu/demo/trigger-custom.html

        // USER TALK ACTIONS
        $(()=>{
            $.contextMenu({
                selector: 'a[href*="/wiki/User_talk:"], a[href*="/wiki/User:"], a[href*="/wiki/Special:Contributions/"]', // Select all appropriate user links
                callback: (act, info)=>{
                    // CALLBACK
                    let hrefOfSelection = $(info.$trigger[0]).attr("href"); // href of userpage or contribs
                    let targetUsername = "";
                    if (hrefOfSelection.includes("/wiki/User_talk:") || hrefOfSelection.includes("/wiki/User:")) {
                        // This is easy because w should just be ablt to spit at last :
                        // We run a regex (rev8 ipv6 fix)
                        /*
                            Find "User_talk"
                            OR "User"
                            Then ":"
                            Or "/"
                            Anything but "/"
                            OR line break
                        */
                        let matches = (hrefOfSelection + "\n").match(/(?:(?:(?:User_talk))|(?:(?:User)(?:\:))|(?:(?:\/)(?:[^\/]*)(?:(?:\n)|(?:\r\n))))/g);
                        // result /User_talk:user, so we removed everything up to the first colon
                        let unURL = matches[0];
                        targetUsername = unURL.replace(unURL.match(/(?:[^\:]*)(?:\:)/g)[0], ""); // Regex first group of colon and remove
                    } else {
                        // Contribs link, go split at last slash
                        targetUsername = (a=>{return a[a.length - 1]})(hrefOfSelection.split("/"));
                    }
                    
                    // Do the action for each action now.
                    ({
                        "usrPg" : un=>redirect("https://en.wikipedia.org/wiki/User:"+ un, true),  // Open user page in new tab

                        "tlkPg" : un=>redirect("https://en.wikipedia.org/wiki/User_talk:"+ un, true),  // Open talk page in new tab

                        "contribs" : un=>redirect("https://en.wikipedia.org/wiki/Special:Contributions/"+ un, true),  // Redirect to contribs page in new tab

                        "accInfo" : un=>redirect("https://en.wikipedia.org/wiki/Special:CentralAuth?target="+ un, true),  // Redirect to Special:CentralAuth page in new tab

                        "sendMsg" : un=>wikiEditor.ui.newMsg(un), // show new msg dialog

                        "quickWel" : un=>wikiEditor.info.quickWelcome(un), // Submit quick welcome

                        "newNotice" : un=>wikiEditor.ui.beginWarn(false, un), // show new warning dialog

                        "adminReport" : un=>wikiEditor.ui.openAdminReport(un)
                    })[act](targetUsername);
                    
                },
                items: {
                    "usrPg": {name: "User Page"},
                    "tlkPg": {name: "Talk Page"},
                    "sendMsg": {name: "Send message"},
                    "newNotice": {name: "New Notice"},
                    "quickWel": {name: "Quick Welcome"},
                    "contribs": {name: "Contributions"},
                    "accInfo": {name: "Account Info"},
                    "adminReport": {name: "Report to Admin"}
                }
            });
        }); // END USER ACTIONS CONTEXT MENU


        // VOID NOTICE CONTEXT MENU (extendedconfirmed ONLY)
        wikiEditor.info.featureRestrictPermissionLevel("extendedconfirmed", ()=>$(()=>{
            $.contextMenu({
                selector: 'p:has(a[href*="wiki/File:Stop_hand_nuvola.svg"]), p:has(a[href*="wiki/File:Information_orange.svg"]), p:has(a[href*="wiki/File:Information.svg"]), p:has(a[href*="wiki/File:Nuvola_apps_important.svg"])', // Select all appropriate paragraphs containing a notice
                callback: (act, info)=>{
                    // CALLBACK
                    let textToMatch = $(info.$trigger[0]).text(); // Text to match w api
                    if (!$(info.$trigger[0]).html().includes("/wiki/User_talk:")) { // No sig. Likely multi-line
                        // We can't void this as it is multi-line. Maybe something to add in future?
                        wikiEditor.visuals.toast.show("This type of notice can't be automatically voided. You will need to remove this notice manually.", false, false, 7500);
                        return; //exit
                    }
                    
                    console.log(textToMatch);
                    // Now we make the request and read line by line
                    $.getJSON("https://en.wikipedia.org/w/api.php?action=query&prop=revisions&titles="+mw.config.get("wgRelevantPageName")+"&rvslots=*&rvprop=content&formatversion=2&format=json", latestR=>{
                        // Grab text from latest revision of talk page
                        // Check if exists
                        
                        if (latestR.query.pages[0].missing) { // If page doesn't exist, error because something defo went wrong
                            wikiEditor.visuals.toast.show("The notice could not be automatically removed due to an error.", false, false, 5000);
                            return; // exit
                        }

                        wikiEditor.visuals.toast.show("Please wait...", false, false, 2000);
                        let revisionWikitext = latestR.query.pages[0].revisions[0].slots.main.content;
                        let wikiTxtLines = revisionWikitext.split("\n");
                        // let's continue
                        
                        let hasBeenMatched = false;
                        let finalStr = "";
                        wikiTxtLines.forEach((element, i) => {
                            let compStr = wikiEditor.info.stripWikiTxt(element);
                            if (compStr.toLowerCase().includes(textToMatch.toLowerCase().trim())) {
                                // Match! Don't add this one normally. Add our sig and that it is now void. MUST REMOVE PIC (as the textTomatch did) in order to stop Redwarn showing as warning still
                                hasBeenMatched = true;
                                finalStr += "{{strikethrough|" + textToMatch + "}}<br>'''The above notice was placed in error and is now void.''' " + wikiEditor.sign() + " \n";
                            } else {
                                finalStr += element + "\n";
                            }
                        });
                        if (!hasBeenMatched) {
                            // For whatever reason, we cannot remove this, no match.
                            wikiEditor.visuals.toast.show("This type of notice can't be automatically voided. You will need to remove this notice manually.", false, false, 7500);
                            return; //exit
                        }

                        // Let's continue and apply edit
                        $.post("https://en.wikipedia.org/w/api.php", {
                            "action": "edit",
                            "format": "json",
                            "token" : mw.user.tokens.get("csrfToken"),
                            "title" : mw.config.get("wgRelevantPageName"),
                            "summary" : "Void notice made in error [[WP:REDWARN|(RedWarn)]]", // summary sign here
                            "text": finalStr
                        }).done(dt => {
                            // We done. Check for errors, then callback appropriately
                            if (!dt.edit) {
                                // Error occured or other issue
                                console.error(dt);
                                wikiEditor.visuals.toast.show("Sorry, there was an error. This notice has not been voided.");
                            } else {
                                // Success! Redirect to complete page
                                window.location.hash = "#noticeApplied-" + dt.edit.newrevid + "-" + dt.edit.oldrevid; 
                                location.reload();
                                // We done
                            }
                        });
                        // END CALLBACK
                    });
                    
                },
                items: {
                    "rm": {name: "Void this notice"}
                }
            });
        }), ()=>{}); // END REMOVE NOTICE CONTEXT MENU

        // NON-CONTRUCTIVE QUICKROLLBACK BUTTON CONTEXT MENU
        $(()=>{
            $.contextMenu({
                selector: '#rollBackNC', // Select non-constructive edit button
                callback: (act, info)=>{
                    // CALLBACK
                    // Do the action for each action now.

                    ({
                        "rbTestEdits" : ()=>wikiEditor.rollback.apply('test edit.')  // Submit quick rollback
                    })[act]();
                    
                },
                items: {
                    "rbTestEdits": {name: "Quick Rollback Test Edit"}
                }
            });
        }); // NON-CONTRUCTIVE QUICKROLLBACK BUTTON CONTEXT MENU

        // TODO: add more, like quick welcome options ext.. and right-click on article link to begin rollback ext.


    }, // end context menus


    "requestSpeedyDelete" : (pg)=>{
        // Open Speedy Deletion dialog for first selection, i.e I'm requesting the speedy deletion of..
        // Programming this is proving to be very boring.
        // Add toast handler
        addMessageHandler("pushToast`*", m=>wikiEditor.visuals.toast.show(m.split('`')[1],false,false,15000));

        addMessageHandler("csdR`*", rs=>{
            // Reason recieved.
            let reason = eval(rs.split("`")[1]);
            let reasonTitle = reason.title;
            let additionalInfoReq = reason.input != ""; // if special info needed
            let additionalInfo = "";
            if (additionalInfoReq) {
                if (rs.split("`")[2] == "undefined") {
                    // No reason specified
                    additionalInfo = "Not specified.";
                } else {
                    additionalInfo = rs.split("`")[2]; // set to the additional info
                }
            }
            console.log(`Deleting under: `+ reasonTitle +`
            `+ reason.input + additionalInfo + ` (redwarn)
            `);
        }); 

        let finalStr = ``;
        for (const key in speedyDeleteReasons) {
            speedyDeleteReasons[key].forEach((e,i)=>{
                let style = "";
                if ((key + e.title).length > 62) {
                    // Too long to fit
                    style="font-size:10px;";
                }
                finalStr += `<li class="mdl-menu__item" data-val='speedyDeleteReasons["`+ key + `"][`+ i +`]' onmousedown="refreshLevels('speedyDeleteReasons[\\\'`+ key + `\\\'][`+ i +`]');" style="`+ style +`">`+ key + e.title +`</li>`;;
            });
        }
        // CREATE DIALOG
        // MDL FULLY SUPPORTED HERE (container). 
        dialogEngine.create(mdlContainers.generateContainer(`
        [[[[include speedyDeletionp1.html]]]]
        `, 500, 450)).showModal(); // 500x300 dialog, see speedyDeletionp1.html for code
    },

    "openPreferences" : () => { // Open Preferences page
        // Add toast handler
        addMessageHandler("pushToast`*", m=>wikiEditor.visuals.toast.show(m.split('`')[1],false,false,15000));

        addMessageHandler("config`*", rs=>{ // On config change
            // New config recieved
            let config = JSON.parse(atob(rs.split("`")[1])); // b64 encoded json string
            //Write to our config
            for (const key in config) {
                if (config.hasOwnProperty(key)) {
                    const element = config[key];
                    wikiEditor.config[key] = element; // add or change value
                }
            }

            // Push change
            wikiEditor.info.writeConfig();
        }); 

        addMessageHandler("resetConfig", rs=>{
            // Reset config recieved, set config back to default
            wikiEditor.info.getConfig(()=>{}, true); // TRUE HERE MEANS RESET TO DEAULT
        });
        // Open preferences page with no padding, full screen
        dialogEngine.create(mdlContainers.generateContainer(`
        [[[[include preferences.html]]]]
        `, document.body.offsetWidth, document.body.offsetHeight), true).showModal(); // TRUE HERE MEANS NO PADDING.
    },

    "openAdminReport" : (un)=> { // Open admin report dialog
        // Add toast handler
        addMessageHandler("pushToast`*", m=>wikiEditor.visuals.toast.show(m.split('`')[1],false,false,2500));

        // On report
        addMessageHandler("report`*", m=>{
            let reportContent = m.split('`')[1]; // report content
            let target = m.split('`')[2]; // target username
            let targetIsIP = wikiEditor.info.isUserAnon(target); // is the target an IP? (2 different types of reports)
            console.log("reporting "+ target + ": "+ reportContent);
            console.log("is ip? "+ (targetIsIP ? "yes" : "no"));
            wikiEditor.visuals.toast.show("Reporting "+ target +"...", false, false, 2000); // show toast
            // Submit the report. MUST REPLACE WITH REAL AIV WHEN DONE AND WITH SANDBOX IN DEV!    
            //let aivPage = "User:Ed6767/sandbox"; // dev
            let aivPage = "Wikipedia:Administrator_intervention_against_vandalism"; // PRODUCTION! 

            $.getJSON("https://en.wikipedia.org/w/api.php?action=query&prop=revisions&titles="+aivPage+"&rvslots=*&rvprop=content&formatversion=2&format=json", latestR=>{
                // Grab text from latest revision of AIV page
                // Check if exists
                let revisionWikitext =  latestR.query.pages[0].revisions[0].slots.main.content; // Set wikitext
                if (revisionWikitext.toLowerCase().includes(target.toLowerCase())) {// If report is already there
                    wikiEditor.visuals.toast.show("This user has already been reported.", false, false, 5000); // show already reported toast
                    return; // Exit
                }

                // Let's continue
                // We don't need to do anything special. Just shove our report at the bottom of the page, although, may be advisiable to change this if ARV format changes
                let textToAdd = "*" + (targetIsIP ? "{{IPvandal|" : "{{vandal|") + target + "}} " + reportContent; // DANGER! WIKITEXT (here is fine. be careful w changes.) - if target IP give correct template, else normal
                let finalTxt = revisionWikitext + "\n\n" + textToAdd; // compile final string
                // Now we just submit
                $.post("https://en.wikipedia.org/w/api.php", {
                    "action": "edit",
                    "format": "json",
                    "token" : mw.user.tokens.get("csrfToken"),
                    "title" : aivPage,
                    "summary" : "Reporting "+ target +" [[WP:REDWARN|(RedWarn)]]", // summary sign here
                    "text": finalTxt
                }).done(dt => {
                    // We done. Check for errors, then callback appropriately
                    if (!dt.edit) {
                        // Error occured or other issue
                        console.error(dt);
                        dialogEngine.dialog.showModal(); // reshow dialog
                        wikiEditor.visuals.toast.show("Sorry, there was an error, likely an edit conflict. Try reporting again."); // That's it
                    } else {
                        // Success! No need to do anything else.
                        wikiEditor.visuals.toast.show("User reported.", false, false, 5000); // we done
                    }
                });
            });
        }); // END ON REPORT EVENT

        // Check matching user
        if (wikiEditor.info.targetUsername(un) == wikiEditor.info.getUsername()) {
            // Usernames are the same, give toast.
            wikiEditor.visuals.toast.show("You can not report yourself, nor can you test this feature except in a genuine case.", false, false, 7500);
            return; // DO NOT continue.
        }


        // See adminReport.html for code
        dialogEngine.create(mdlContainers.generateContainer(`
        [[[[include adminReport.html]]]]
        `, 500, 410)).showModal();
    }
}