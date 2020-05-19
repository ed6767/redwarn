rw.rollback = { // Rollback features
    "preview" : () => { // Redirect to the preview of the rollback (compare page)
        // Check if latest, else redirect
        rw.ui.loadDialog.show("Loading preview...");
        rw.info.isLatestRevision(mw.config.get("wgRelevantPageName"), $('#mw-diff-ntitle1 > strong > a').attr('href').split('&')[1].split('=')[1], un=>{
            // Fetch latest revision not by user
            rw.info.latestRevisionNotByUser(mw.config.get("wgRelevantPageName"), un, (content, summary, rID) => {
                // Got it! Now open preview dialog
               
                // Add handler for when page loaded

                addMessageHandler("showBrwsrDialog", c=> {
                    // We ready to show
                    rw.ui.loadDialog.close(); // Close load dialog
                    dialogEngine.dialog.showModal();
                });

                let url = "https://en.wikipedia.org/w/index.php?title="+ mw.config.get("wgRelevantPageName") +"&diff="+ rID +"&oldid="+ mw.util.getParamValue("diff") +"&diffmode=source#rollbackPreview";

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
                `, document.body.offsetWidth-70, document.body.offsetHeight-50)); // DON'T SHOW until we get the loaded message (see above)
                
            });
        });
    },

    "apply" : (reason) => {
        // bug fix rev10, get revid from html
        // todo: if has rollback perms, use that
        rw.visuals.toast.show("Reverting...");
        rw.info.isLatestRevision(mw.config.get("wgRelevantPageName"), $('#mw-diff-ntitle1 > strong > a').attr('href').split('&')[1].split('=')[1], (un, crID)=>{
            // Fetch latest revision not by user
            rw.info.latestRevisionNotByUser(mw.config.get("wgRelevantPageName"), un, (content, summary, rID) => {
                // Got it! Now set page content to summary
                // Push UNDO using CSRF token
                $.post("https://en.wikipedia.org/w/api.php", {
                    "action": "edit",
                    "format": "json",
                    "token" : mw.user.tokens.get("csrfToken"),
                    "title" : mw.config.get("wgRelevantPageName"),
                    "summary" : summary + ": " + reason + " [[WP:REDWARN|(RedWarn "+ rw.version +")]]", // summary sign here
                    "undo": crID,
                    "undoafter": rID
                }).done(dt => {
                    // We done. Check for errors, then callback appropriately
                    if (!dt.edit) {
                        // Error occured or other issue
                        console.error(dt);
                        rw.visuals.toast.show("Sorry, there was an error, likely an edit conflict. Your rollback has not been applied.");
                    } else {
                        // Success! Now show warning dialog but w correct info
                        rw.ui.beginWarn(false, un, mw.config.get("wgRelevantPageName"));
                        rw.visuals.toast.show("Rollback complete.", "DON'T WARN AND VIEW", ()=>{
                            rw.info.isLatestRevision(mw.config.get('wgRelevantPageName'), 0, ()=>{});
                        }, 5000); // clicking undo takes to the closest revision, has to be here to overlay the dialog
                    }
                });
            });
        });
    },

    "restore" : (revID, reason) => {
        // Restore revision by ID
        rw.visuals.toast.show("Restoring...", false, false, 4000);
        // Ask API for this revision
        $.getJSON("https://en.wikipedia.org/w/api.php?action=query&prop=revisions&rvprop=user|content&rvstartid="+ revID +"&rvendid="+ revID +"&titles="+ encodeURI(mw.config.get("wgRelevantPageName")) +"&formatversion=2&rvslots=*&format=json", r=>{
            let revUsr = r.query.pages[0].revisions[0].user; // get user
            let content = r.query.pages[0].revisions[0].slots.main.content; // get content
            let summary = "Restoring revision "+ revID + " by " + revUsr; // gen our summary
            // Now we've got that, we just need to submit.
            $.post("https://en.wikipedia.org/w/api.php", {
                    "action": "edit",
                    "format": "json",
                    "token" : mw.user.tokens.get("csrfToken"),
                    "title" : mw.config.get("wgRelevantPageName"),
                    "summary" : summary + ": " + reason + " [[WP:REDWARN|(RedWarn)]]", // summary sign here
                    "text": content,
                    "tags": "undo" // Tag with undo flag
                }).done(dt => {
                    // Request done. Check for errors, then go to the latest revision
                    if (!dt.edit) {
                        // Error occured or other issue
                        console.error(dt);
                        rw.visuals.toast.show("Sorry, there was an error, likely an edit conflict. This edit has not been restored.");
                    } else {
                        rw.info.isLatestRevision(mw.config.get('wgRelevantPageName'), 0, ()=>{}); // we done, go to the latest revision
                    }
                });
        });
    },

    "promptRollbackReason" : reason=> {
        rw.info.isLatestRevision(mw.config.get("wgRelevantPageName"), $('#mw-diff-ntitle1 > strong > a').attr('href').split('&')[1].split('=')[1],un=>{ // validate is latest
            // Show dialog then rollback
            // Add submit handler

            addMessageHandler("reason`*", rs=>rw.rollback.apply(rs.split("`")[1])); // When reason recieved, submit rollback

            // CREATE DIALOG
            // MDL FULLY SUPPORTED HERE (container). 
            dialogEngine.create(mdlContainers.generateContainer(`
            [[[[include rollbackReason.html]]]]
            `, 500, 120)).showModal(); // 500x120 dialog, see rollbackReason.html for code
        });
    },

    "promptRestoreReason" : revID=> {
        // Prompt for reason to restore. very sim to rollback reason
        let reason = ""; // Needed for rollback reason page

        // Add submit handler
        addMessageHandler("reason`*", rs=>rw.rollback.restore(revID, rs.split("`")[1])); // When reason recieved, submit rollback

        // CREATE DIALOG
        // MDL FULLY SUPPORTED HERE (container). 
        dialogEngine.create(mdlContainers.generateContainer(`
        [[[[include rollbackReason.html]]]]
        `, 500, 120)).showModal(); // 500x120 dialog, see rollbackReason.html for code
    },

    "welcomeRevUsr" :() => {
        // Send welcome to user who made most recent revision
        rw.visuals.toast.show("Please wait...", false, false, 1000);
        rw.info.isLatestRevision(mw.config.get("wgRelevantPageName"), $('#mw-diff-ntitle1 > strong > a').attr('href').split('&')[1].split('=')[1], un=>{
            // We got the username, send the welcome
            rw.info.quickWelcome(un);
        });
    },


    "loadIcons" : () => {
        // Add icons to page
        // Icons for current revision

        // Load icons from config
        // ? config : default
        // This is a mess :p
        let rollBackVandal = rw.config['rollBackVandalIcon'] != null ? rw.config['rollBackVandalIcon'] : "delete_forever"; // vandal
        let rollBackRM = !(rw.config['rollBackRMIcon'] == null) ? rw.config['rollBackRMIcon'] : "format_indent_increase"; // rm
        let rollBackNC = !(rw.config['rollBackNCIcon'] == null) ? rw.config['rollBackNCIcon'] : "work_outline"; // nc
        let rollBack = !(rw.config['rollBackIcon'] == null) ? rw.config['rollBackIcon'] : "replay"; // normal rollback
        let rollBackAGF = !(rw.config['rollBackAGFIcon'] == null) ? rw.config['rollBackAGFIcon'] : "thumb_up"; // agf
        let rollBackPrev = !(rw.config['rollBackPrevIcon'] == null) ? rw.config['rollBackPrevIcon'] : "compare_arrows"; // prev
        let wlRU = !(rw.config['wlRUIcon'] == null) ? rw.config['wlRUIcon'] : "sentiment_satisfied_alt"; // welcome revision user
        let currentRevIcons = `
        <div id="rollBackVandal" class="icon material-icons"><span style="cursor: pointer; font-size:28px; padding-right:5px; color:red;" onclick="rw.rollback.apply('vandalism');">`+ rollBackVandal +`</span></div>
        <div class="mdl-tooltip mdl-tooltip--large" for="rollBackVandal">
            Quick rollback vandalism
        </div>

        <div id="rollBackRM" class="icon material-icons"><span style="cursor: pointer; font-size:28px; padding-right:5px; color:orange;" onclick="rw.rollback.apply('unexplained content removal');">`+ rollBackRM +`</span></div>
        <div class="mdl-tooltip mdl-tooltip--large" for="rollBackRM">
            Quick rollback unexplained content removal
        </div>

        <div id="rollBackNC" class="icon material-icons"><span style="cursor: pointer; font-size:28px; padding-right:5px; color:gold;" onclick="rw.rollback.apply('non-constructive');">`+ rollBackNC +`</span></div>
        <div class="mdl-tooltip mdl-tooltip--large" for="rollBackNC">
            Quick rollback non-constructive edit
        </div>
        
        <div id="rollBack" class="icon material-icons"><span style="cursor: pointer; font-size:28px; padding-right:5px; color:blue;" onclick="rw.rollback.promptRollbackReason('');">`+ rollBack +`</span></div>
        <div class="mdl-tooltip mdl-tooltip--large" for="rollBack">
            Rollback
        </div>
        
        <div id="rollBackAGF" class="icon material-icons"><span style="cursor: pointer; font-size:28px; padding-right:5px; color:green;" onclick="rw.rollback.promptRollbackReason('revert good faith edits ');">`+ rollBackAGF +`</span></div>
        <div class="mdl-tooltip mdl-tooltip--large" for="rollBackAGF">
            Assume Good Faith and Rollback
        </div>
        
        <div id="rollBackPrev" class="icon material-icons"><span style="cursor: pointer; font-size:28px; padding-right:5px;" onclick="rw.rollback.preview();">`+ rollBackPrev +`</span></div>
        <div class="mdl-tooltip mdl-tooltip--large" for="rollBackPrev">
            Preview Rollback
        </div>

        <div id="wlRU" class="icon material-icons"><span style="cursor: pointer; font-size:28px; padding-right:5px;" onclick="rw.rollback.welcomeRevUsr();">`+ wlRU +`</span></div>
        <div class="mdl-tooltip mdl-tooltip--large" for="wlRU">
            Quick Welcome User
        </div>
        `;

        // RESTORE THIS VERSION ICONS. DO NOT FORGET TO CHANGE BOTH FOR LEFT AND RIGHT

        let isLatest = $("#mw-diff-ntitle1").text().includes("Latest revision"); // is this the latest revision diff page?
        // On left side (always restore)
        // DO NOT FORGET TO CHANGE BOTH!!
        $('.diff-otitle').prepend(`
        <div id="rOld1" class="icon material-icons"><span style="cursor: pointer; font-size:28px; padding-right:5px; color:purple;"
            onclick="rw.rollback.promptRestoreReason($('#mw-diff-otitle1 > strong > a').attr('href').split('&')[1].split('=')[1]);"> <!-- the revID on left -->
                history
            </span>
        </div>
        <div class="mdl-tooltip mdl-tooltip--large" for="rOld1">
            Restore this version
        </div>
        `
        ); 

        // On the right side
        $('.diff-ntitle').prepend(isLatest ? currentRevIcons : `
        <div id="rOld2" class="icon material-icons"><span style="cursor: pointer; font-size:28px; padding-right:5px; color:purple;"
            onclick="rw.rollback.promptRestoreReason($('#mw-diff-ntitle1 > strong > a').attr('href').split('&')[1].split('=')[1]);"> <!-- the revID on right -->
                history
            </span>
        </div>
        <div class="mdl-tooltip mdl-tooltip--large" for="rOld2">
            Restore this version
        </div>
        `); // if the latest rev, show the accurate revs, else, don't 

        // Now register all tooltips
        for (let item of document.getElementsByClassName("mdl-tooltip")) {
            rw.visuals.register(item); 
        } 
        // That's done :)
    }
};
