// (c) Ed.E 2020

function waitForMDLLoad(cb) { // Used to wait for MDL load
    if(typeof componentHandler !== "undefined"){
        cb(); // callback
    } else {
        setTimeout(()=>waitForMDLLoad(cb), 250);
    }
}

function redirect(url, inNewTab) {
    if (inNewTab) {
        Object.assign(document.createElement('a'), { target: '_blank', href: url}).click(); // Open in new tab
    } else {
        window.location.href = url; // open here
    }
}

var wikiEditor = {
    "version" : "rev4", // don't forget to change each version!
    "visuals" : {
        "init" : (callback) => {
            // Welcome message
            console.log(`
+------------------------------+
|                              |
| RedWarn (c) 2020 Ed E        |
| and contributors             |
|                              |
+------------------------------+
            `);
            // Load MDL and everything needed, then callback when all loaded
            $('head').append(`
                <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/jquery-contextmenu/2.7.1/jquery.contextMenu.min.css">
                <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery-contextmenu/2.7.1/jquery.contextMenu.min.js"></script>
                <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery-contextmenu/2.7.1/jquery.ui.position.js"></script>
                <link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons">
                <script src="https://cdnjs.cloudflare.com/ajax/libs/dialog-polyfill/0.4.2/dialog-polyfill.min.js"></script> <!-- firefox being dumb -->
                <script src="https://code.getmdl.io/1.3.0/material.min.js" id="MDLSCRIPT"></script>
                <style>
                /* Context menus */
                .context-menu-list {
                    list-style-type: none;
                    list-style-image: none;
                }

                /* MDL */
                `+ wikiEditorStyle +`
                </style>
            `); // Append required libaries to page
            // wait for load
            waitForMDLLoad(callback);
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

    "recentChanges" : {
        "openPage" : (filters)=> {
            // Open recent changes url
            let url = URL.createObjectURL(new Blob([mdlContainers.generateHtml(`
            [[[[include recentChanges.html]]]]
            `)], { type: 'text/html' })); // blob url
            redirect(url, false);
        },
        "diffLinkAddRedWarn" : () => { // add redwarn to recent changes page
            $('body').unbind('DOMSubtreeModified'); // Prevent infinite loop
            $.each($(".mw-changeslist-diff"), (i,el)=>{
                if ($(el).parent().html().includes("#redwarn")) {
                    // Link already there.
                } else {
                    $(el).parent().prepend(`<a href='#redwarn' onclick='wikiEditor.ui.revisionBrowser("`+ el.href +`");'>Redwarn</a>  | `);
                }
            });
            window.addEventListener("focus", e=>{ 
                wikiEditor.recentChanges.bindRecentChanges(); // fix chrome unfocus bug 
            }, false);
            wikiEditor.recentChanges.bindRecentChanges();
        },

        "bindRecentChanges" : () => { // on list change add redwarn
            $('body').on('DOMSubtreeModified', 'ul.special', ()=>wikiEditor.recentChanges.diffLinkAddRedWarn());
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
        wikiEditor.ui.registerContextMenu(); // register context menus

        // Quick check we have perms to use (in confirmed/autoconfirmed group)
        wikiEditor.info.featureRestrictPermissionLevel("confirmed", false, ()=>{
            // We don't have permission
            
            // Add red lock to the top right to show that RedWarn cannot be used
            document.getElementsByClassName("mw-indicators mw-body-content")[0].innerHTML = `
            <div id="Lock" class="icon material-icons"><span style="cursor: help; color:red;" onclick="">lock</span></div>
            <div class="mdl-tooltip" for="Lock">
                You don't have permission to use RedWarn yet. Please refer to the user guide for more information.
            </div>
            `;
            // Now register that
            for (let item of document.getElementsByClassName("mdl-tooltip")) {
                wikiEditor.visuals.register(item); 
            }
            wikiEditor = {}; // WIPE OUT ENTIRE CLASS. We're not doing anything here.
            // Notification
            mw.notify("Thank you for you interest in moderating Wikipedia. However, you do not have permission to use RedWarn. Please refer to the user guide for more information.");
            // That's it
        });

        // We have perms, let's continue.

        // Load config and check if updated
        wikiEditor.info.getConfig(()=> {
            if (wikiEditor.config.lastVersion != wikiEditor.version) {
                // We've had an update
                wikiEditor.config.lastVersion = wikiEditor.version; // update entry 
                wikiEditor.info.writeConfig(()=> { // update the config file
                    // Push an update toast
                    wikiEditor.visuals.toast.show("RedWiki has been updated!", "MORE",
                    ()=>redirect("https://en.wikipedia.org/wiki/User:JamesHSmith6789/redwarn/bugsquasher", true), 7500);
                });
            }
        });

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
            wikiEditor.visuals.toast.show("Redirected to the lastest revision.");
        } else if (window.location.hash.includes("#compLatest")) {
            // Go to the latest revison
            wikiEditor.info.isLatestRevision(mw.config.get("wgRelevantPageName"), 0, ()=>{}); // auto filters and redirects for us - 0 is an ID that will never be
        } else if (window.location.hash.includes("#rollbackPreview")) {
            // Rollback preview iframe. NEEDS WORK. DON'T FORGET TO SET common.js back!!!
            $('.mw-revslider-container').html(`
            <style>
            #mw-navigation {
                display: none;
            }

            .mw-indicators {
                display:none;
            }

            .mw-body {margin-left:0;}

            .noprint { display: none; }
            .diff-ntitle {display: none; }
            .diff-otitle {display: none; }
            </style>
            <div style="padding-left:10px;">
                <h2>This is a rollback preview</h2>
                <a href="#" onclick="window.parent.parent.postMessage('closeDialog');">Click here</a> or the cross in the top-right corner to close this preview
            </div>

            <script>
            // We're ready
            window.parent.parent.postMessage('showBrwsrDialog');
            </script>

            <br>
            `);

            $('.mw-revslider-container').attr("style", "border: 3px solid red;");
            

        } else if (window.location.hash.includes("#rollbackFailNoRev")) {
            wikiEditor.visuals.toast.show("Could not rollback as there were no recent revisions by other users. Use the history page to try and manually revert.", false, false, 15000);
        }
        
        if (window.location.href.includes("&diff=") && window.location.href.includes("&oldid=")) {
            // Diff page
            wikiEditor.rollback.loadIcons(); // load rollback icons
        } else if (window.location.href.includes("/wiki/Special:RecentChanges")) {
            // Recent changes page
            // Add redwarn btn
            $(".mw-rcfilters-ui-filterWrapperWidget-bottom").prepend(`
            <div id="openRWP" class="icon material-icons"><span style="cursor: pointer;" onclick="wikiEditor.recentChanges.openPage(window.location.search.substr(1));">how_to_reg</span></div>
            <div class="mdl-tooltip mdl-tooltip--large" for="openRWP">
                Launch RedWarn Patrol with these filters
            </div>
            `); // Register tooltip
            for (let item of document.getElementsByClassName("mdl-tooltip")) {
                wikiEditor.visuals.register(item); 
            }

            wikiEditor.recentChanges.diffLinkAddRedWarn(); // Add redwarn to all links
        }
    });
}