wikiEditor.rollback = { // Rollback features
    "preview" : () => { // Redirect to the preview of the rollback (compare page)
        // Check if latest, else redirect
        wikiEditor.visuals.toast.show("Please wait...");
        wikiEditor.info.isLatestRevision(mw.config.get("wgRelevantPageName"), mw.util.getParamValue("diff"), un=>{
            // Fetch latest revision not by user
            wikiEditor.info.latestRevisionNotByUser(mw.config.get("wgRelevantPageName"), un, (content, summary, rID) => {
                // Got it! Now open preview dialog

                // Add handler for when page loaded

                addMessageHandler("showBrwsrDialog", c=> {
                    // We ready to show
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
        // Apply rollback
        wikiEditor.visuals.toast.show("Please wait...", false, false, 1000);
        wikiEditor.info.isLatestRevision(mw.config.get("wgRelevantPageName"), mw.util.getParamValue("diff"), un=>{
            // Fetch latest revision not by user
            wikiEditor.info.latestRevisionNotByUser(mw.config.get("wgRelevantPageName"), un, (content, summary, rID) => {
                // Got it! Now set page content to summary
                // Push edit using CSRF token
                $.post("https://en.wikipedia.org/w/api.php", {
                    "action": "edit",
                    "format": "json",
                    "token" : mw.user.tokens.get("csrfToken"),
                    "title" : mw.config.get("wgRelevantPageName"),
                    "summary" : summary + ": " + reason + " (RedWarn)", // summary sign here
                    "text": content,
                    "tags": "undo" // Tag with undo flag
                }).done(dt => {
                    // We done. Check for errors, then callback appropriately
                    if (!dt.edit) {
                        // Error occured or other issue
                        console.error(dt);
                        wikiEditor.visuals.toast.show("Sorry, there was an error. Your rollback has not been applied.");

                    } else {
                        
                        // Success! Now show warning dialog but w correct info
                        wikiEditor.ui.beginWarn(false, un, mw.config.get("wgRelevantPageName"));

                        wikiEditor.visuals.toast.show("Rollback complete.", "DON'T WARN AND VIEW", ()=>{
                            wikiEditor.info.isLatestRevision(mw.config.get('wgRelevantPageName'), 0, ()=>{});
                        }, 5000); // clicking undo takes to the closest revision, has to be here to overlay the dialog
                    }
                });
            });
        });
    },

    "promptRollbackReason" : reason=> {
        wikiEditor.info.isLatestRevision(mw.config.get("wgRelevantPageName"), mw.util.getParamValue("diff"),un=>{ // validate is latest
            // Show dialog then rollback
            // Add submit handler

            addMessageHandler("reason`*", rs=>wikiEditor.rollback.apply(rs.split("`")[1])); // When reason recieved, submit rollback

            // CREATE DIALOG
            // MDL FULLY SUPPORTED HERE (container). 
            dialogEngine.create(mdlContainers.generateContainer(`
            [[[[include rollbackReason.html]]]]
            `, 500, 120)).showModal(); // 500x120 dialog, see rollbackReason.html for code
        });
    },

    "welcomeRevUsr" :() => {
        // Send welcome to user who made most recent revision
        wikiEditor.visuals.toast.show("Please wait...", false, false, 1000);
        wikiEditor.info.isLatestRevision(mw.config.get("wgRelevantPageName"), mw.util.getParamValue("diff"), un=>{
            // We got the username, send the welcome
            wikiEditor.info.addWikiTextToUserPage(un, "{{welcome}}", false, "Welcome!", "{{welcome}}", "This user has already been welcomed.");
        });
    },


    "loadIcons" : () => {
        // Add rollback icons (on left side)
        $('.diff-ntitle').prepend(`
        <div id="rollBackVandal" class="icon material-icons"><span style="cursor: pointer; font-size:28px; padding-right:5px; color:red;" onclick="wikiEditor.rollback.apply('vandalism');">delete_forever</span></div>
        <div class="mdl-tooltip mdl-tooltip--large" for="rollBackVandal">
            Quick rollback vandalism
        </div>

        <div id="rollBackRM" class="icon material-icons"><span style="cursor: pointer; font-size:28px; padding-right:5px; color:orange;" onclick="wikiEditor.rollback.apply('rm content w no good reason or consensus');">format_indent_increase</span></div>
        <div class="mdl-tooltip mdl-tooltip--large" for="rollBackRM">
            Quick rollback removal of content with no good reason or consensus in talk page
        </div>

        <div id="rollBackNC" class="icon material-icons"><span style="cursor: pointer; font-size:28px; padding-right:5px; color:gold;" onclick="wikiEditor.rollback.apply('non-constructive edit');">work_outline</span></div>
        <div class="mdl-tooltip mdl-tooltip--large" for="rollBackNC">
            Quick rollback non-constructive edit
        </div>
        
        <div id="rollBack" class="icon material-icons"><span style="cursor: pointer; font-size:28px; padding-right:5px; color:blue;" onclick="wikiEditor.rollback.promptRollbackReason('');">replay</span></div>
        <div class="mdl-tooltip mdl-tooltip--large" for="rollBack">
            Rollback
        </div>
        
        <div id="rollBackAGF" class="icon material-icons"><span style="cursor: pointer; font-size:28px; padding-right:5px; color:green;" onclick="wikiEditor.rollback.promptRollbackReason('revert good faith edits ');">thumb_up</span></div>
        <div class="mdl-tooltip mdl-tooltip--large" for="rollBackAGF">
            Assume Good Faith and Rollback
        </div>
        
        <div id="rollBackPrev" class="icon material-icons"><span style="cursor: pointer; font-size:28px; padding-right:5px;" onclick="wikiEditor.rollback.preview();">compare_arrows</span></div>
        <div class="mdl-tooltip mdl-tooltip--large" for="rollBackPrev">
            Preview Rollback
        </div>

        <div id="wlRU" class="icon material-icons"><span style="cursor: pointer; font-size:28px; padding-right:5px;" onclick="wikiEditor.rollback.welcomeRevUsr();">sentiment_satisfied_alt</span></div>
        <div class="mdl-tooltip mdl-tooltip--large" for="wlRU">
            Quick Welcome User
        </div>
        
        `);

        // On right side (restore)
        $('.diff-otitle').prepend(`
            <div id="restoreOld" class="icon material-icons"><span style="cursor: pointer; font-size:28px; padding-right:5px; color:purple;" onclick="wikiEditor.ui.newMsg();">history</span></div>
            <div class="mdl-tooltip mdl-tooltip--large" for="restoreOld">
                Restore this version
            </div>
        `);

        // Now register all icons
        for (let item of document.getElementsByClassName("mdl-tooltip")) {
            wikiEditor.visuals.register(item); 
        } 
        // That's done :)
    }
};
