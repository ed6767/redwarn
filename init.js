// (c) Ed.E 2020

// Window focus checking n things
var windowFocused = true;

window.onblur = function(){  
    windowFocused = false;  
}  
window.onfocus = function(){  
    windowFocused = true;  
}

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
if (rw != null) {
    // Double init, rm the old version and hope for the best
    rw = {};
    mw.notify("Warning! You have two versions of RedWarn installed at once! Please ensure that you only use one instance to prevent issues.");
}
var rw = {
    "version" : "rev12dev", // don't forget to change each version!
    "logoHTML" : `<span style="font-family:Roboto;font-weight: 300;text-shadow:2px 2px 4px #0600009e;"><span style="color:red">Red</span>Warn</span>`, // HTML of the logo
    "sign": ()=>{return atob("fn5+fg==")}, // we have to do this because mediawiki will swap this out with devs sig.
    "welcome": ()=> {return atob("e3tzdWJzdDpXZWxjb21lfX0=");}, // welcome template
    "welcomeIP": ()=> {return atob("e3tzdWJzdDp3ZWxjb21lLWFub259fQ==");}, // welcome IP template
    "sharedIPadvice" : ()=> {return atob("XG46e3tzdWJzdDpTaGFyZWQgSVAgYWR2aWNlfX0=");}, // if this is a shared...
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
                `+ rwStyle +`
                </style>
            `); // Append required libaries to page


            
            // wait for load
            waitForMDLLoad(callback);
        },

        "register" : c=> {
            // Register a componant with MDL
            componentHandler.upgradeElement(c);
        },

        "pageIcons" : ()=> {
            // Thanks to User:Awesome Aasim for the suggestion and some sample code.
            try {
                let pageIconHTML = "<span id='rwPGIconContainer' style='display:none;'>"; // obj it is appended to
                // Possible icons locations: default (page icons area) or sidebar
                let iconsLocation = rw.config.pgIconsLocation ? rw.config.pgIconsLocation : "default"; // If set in config, use config
                /* [[[[include pageIcons.html]]]] */
                pageIconHTML += "</span>"; // close contianer
                if (iconsLocation == "default") {
                    try {
                        document.getElementsByClassName("mw-indicators mw-body-content")[0].innerHTML += pageIconHTML; // Append our icons to the page icons
                    } catch (error) {
                        // Incompatible theme, use sidebar instead
                        iconsLocation = "sidebar";
                    }
                }
                // delib. not else if
                if (iconsLocation == "sidebar") {
                    // Add our icons to the sidebar (w/ all theme compatibility)
                    (_t=>{
                        $('<div class="sidebar-chunk" id="redwarn"><h2><span>RedWarn</span></h2><div class="sidebar-inner">' + _t + '</div></div>').prependTo("#mw-site-navigation");
                        $('<div class="portal" role="navigation" id="redwarn" aria-labelledby="p-redwarn-label">' + _t + '</div>').prependTo("#mw-panel");
                        $('<div role="navigation" class="portlet generated-sidebar" id="redwarn" aria-labelledby="p-redwarn-label">' + _t + '</div>').prependTo("#sidebar");
                        $('<div class="portlet" id="redwarn">' + _t + '</div>').prependTo("#mw_portlets");
                        $('<ul id="redwarn">' + _t + '</ul>').appendTo("#mw-mf-page-left"); //minerva
                        $("#p-navigation").prependTo("#mw-panel");
                        $("#p-search").prependTo("#quickbar");
                        $('#p-logo').prependTo("#mw-site-navigation");
                        $('#p-logo').prependTo("#mw-panel");
                        $('#p-logo').prependTo("#sidebar");
                        $('#p-logo').prependTo("#mw_portlets");
                        $('ul.hlist:first').appendTo('#mw-mf-page-left');

                        // Add click event handlers
                        $(document).click(e=> {
                            if ($(e.target).closest("#redwarn").length == 0) {
                                $("#redwarn").removeClass("dropdown-active");
                            }
                        });
                        (h=>{
                            $($('.sidebar-chunk > h2:contains("RedWarn")')[0]).click(e=>h(e)); // collapsed
                            $($('.sidebar-inner > #redwarn-label')[0]).click(e=>h(e)); // visible
                        })(e=>{ // Handler
                            e.preventDefault();
                            if ($("#redwarn").hasClass("dropdown-active")) {
                                $("#redwarn").removeClass("dropdown-active");
                            } else {
                                $("#redwarn").toggleClass("dropdown-active");
                            }
                        });
                        // We done
                    })(` <!-- hand in pageIconHTML and some extra gubbins to become _t -->
                        <h3 id="redwarn-label" lang="en" dir="ltr">RedWarn tools</h3><div class="mw-portlet-body body pBody" id="redwarn-tools">
                        ` + pageIconHTML + `
                        </div>
                    `);
                }
            } catch (error) {
                // Likely invalid theme, not all themes can use default
                mw.notify("RedWarn isn't compatible with this theme.");
                return; // Exit
            }
            

            // Now register all icons
            for (let item of document.getElementsByClassName("mdl-tooltip")) {
                rw.visuals.register(item); 
            }
            
            // Now fade in container
            $("#rwPGIconContainer").fadeIn();
            
            // That's done :)
        }
    },

    "recentChanges" : {
        "openPage" : (filters)=> {
            // Open recent changes url
            let sidebarSize = 500;
            let addCol = "0,255,0"; // rbg
            let rmCol = "255,0,0"; // rgb
            /*if (rw.config.ptrSidebar) sidebarSize = rw.config.ptrSidebar; DEP. REV12*/
             // If preferences set, apply them
            if (rw.config.ptrAddCol) addCol = rw.config.ptrAddCol;
            if (rw.config.ptrRmCol) rmCol = rw.config.ptrRmCol;
            
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
                    $(el).parent().prepend(`<a href='#redwarn' onclick='rw.ui.revisionBrowser("`+ el.href +`");'>Redwarn</a>  | `);
                }
            });
            window.addEventListener("focus", e=>{ 
                rw.recentChanges.bindRecentChanges(); // fix chrome unfocus bug 
            }, false);
            rw.recentChanges.bindRecentChanges();
        },

        "bindRecentChanges" : () => { // on list change add redwarn
            $('body').on('DOMSubtreeModified', 'ul.special', ()=>rw.recentChanges.diffLinkAddRedWarn());
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
function initRW() {
    rw.visuals.init(()=>{
        rw.visuals.toast.init();
        dialogEngine.init();

        // Quick check we have perms to use (in confirmed/autoconfirmed group)
        rw.info.featureRestrictPermissionLevel("confirmed", false, ()=>{
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
                rw.visuals.register(item); 
            }
            rw = {}; // WIPE OUT ENTIRE CLASS. We're not doing anything here.
            // Notification
            mw.notify("Thank you for you interest in moderating Wikipedia. However, you do not have permission to use RedWarn. Please refer to the user guide for more information.");
            // That's it
        });

        // We have perms, let's continue.

        // Load config and check if updated
        rw.info.getConfig(()=> {
            rw.visuals.pageIcons(); // page icons once config loaded
            rw.ui.registerContextMenu(); // register context menus once config loaded
            if (rw.config.lastVersion != rw.version) {
                // We've had an update
                rw.config.lastVersion = rw.version; // update entry 
                rw.info.writeConfig(true, ()=> { // update the config file
                    // Show an update dialog
                    rw.ui.confirmDialog(`
                    <h2 style="font-weight: 200;font-size:45px;line-height: 48px;">Welcome to `+rw.logoHTML+` `+ rw.version +`!</h2>
                    <b>RedWarn has just got a new update!</b> Would you like to read more about what's new?
                    `,
                    "READ SUMMARY", ()=>{
                        dialogEngine.dialog.close();
                        redirect("https://en.wikipedia.org/wiki/User:Ed6767/redwarn/bugsquasher#"+ rw.version + "_summary", true);
                    },
                    "LATER", ()=>{
                        dialogEngine.dialog.close();
                        rw.visuals.toast.show("You can read more later at RedWarn's page (WP:REDWARN)");
                    },168);
                });
            }
            // TODO: probably fix this mess into a URL
                // Check if a message is in URL (i.e edit complete ext)
            if(window.location.hash.includes("#noticeApplied-")) {
                // Show toast w undo edit capabilities
                // #noticeApplied-currentEdit-pastEdit
                rw.visuals.toast.show("Message saved", "UNDO", ()=>{
                    // Redirect to undo page mw.config.get("wgRelevantPageName");
                    // TODO: maybe replace with custom page in future?
                    window.location.href = "/w/index.php?title="+ mw.config.get("wgRelevantPageName") +"&action=edit&undoafter="+ window.location.hash.split("-")[2] +"&undo="+ window.location.hash.split("-")[1];
                }, 7500);
            } else if (window.location.hash.includes("#redirectLatestRevision")) { // When latest revision loaded
                rw.visuals.toast.show("Redirected to the lastest revision.", "BACK", ()=>window.history.back(), 4000); // When back clciked go back
            } else if (window.location.hash.includes("#watchLatestRedirect")) {
                // Redirected to latest by redirector, play sound
                let src = 'https://raw.githubusercontent.com/ed6767/redwarn/master/redwarn%20notifs%20new%20edit.mp3';
                let audio = new Audio(src);
                audio.play();
                // enable watcher
                rw.info.changeWatch.toggle();
            } else if (window.location.hash.includes("#investigateFail")) {
                rw.visuals.toast.show("Investigation Failed. This text has not been modified in the past 500 revisions or originated when the page was created.", false, false, 10000);
            } else if (window.location.hash.includes("#investigateIncomp")) {
                rw.visuals.toast.show("The selection could not be investigated.", false, false, 10000);
            } else if (window.location.hash.includes("#configChange")) {
                rw.visuals.toast.show("Preferences saved.");
            } else if (window.location.hash.includes("#rwPendingAccept")) {
                rw.visuals.toast.show("Changes accepted.");
            } else if (window.location.hash.includes("#rwReviewUnaccept")) {
                rw.visuals.toast.show("Changes unaccepted.");
            } else if (window.location.hash.includes("#compLatest")) {
                // Go to the latest revison
                rw.info.isLatestRevision(mw.config.get("wgRelevantPageName"), 0, ()=>{}); // auto filters and redirects for us - 0 is an ID that will never be
            } else if (window.location.hash.includes("#rollbackPreview")) {
                // Rollback preview page
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
                    To rollback, return to the original page.
                </div>

                <script>
                // We're ready
                window.parent.parent.postMessage('showBrwsrDialog');
                </script>

                <br>
                `);

                $('.mw-revslider-container').attr("style", "border: 3px solid red;");
                

            } else if (window.location.hash.includes("#rollbackFailNoRev")) {
                rw.visuals.toast.show("Could not rollback as there were no recent revisions by other users. Use the history page to try and manually revert.", false, false, 15000);
            }
            
            if (window.location.href.includes("&diff=") && window.location.href.includes("&oldid=")) {
                // Diff page
                rw.rollback.loadIcons(); // load rollback icons
            } else if (window.location.href.includes("/wiki/Special:RecentChanges")) {
                // Recent changes page
                // Add redwarn btn
                $(".mw-specialpage-summary").prepend(`
                <div id="openRWP" class="icon material-icons"><span style="cursor: pointer;" onclick="rw.recentChanges.openPage(window.location.search.substr(1));">how_to_reg</span></div>  Click the icon to launch RedWarn patrol with these filters
                <div class="mdl-tooltip mdl-tooltip--large" for="openRWP">
                    Launch RedWarn Patrol with these filters
                </div>
                `); // Register tooltip
                for (let item of document.getElementsByClassName("mdl-tooltip")) {
                    rw.visuals.register(item); 
                }

            } else if (window.location.hash.includes("#rwPatrolAttach-RWBC_")) { // Connect to recent changes window
                let bcID = window.location.hash.split("-")[1]; // get bc id from hash
                const bc = new BroadcastChannel(bcID); // open channel
                bc.onmessage = msg=>{// On message open here
                    rw.ui.loadDialog.show("Loading...");
                    redirect(msg.data);
                } 
                // Set session storage (see below) Hopefully will only effect this window
                sessionStorage.rwBCID = bcID;
            }
            if (sessionStorage.rwBCID != null){
                //  Session storage set! Connect to bcID
                const bc = new BroadcastChannel(sessionStorage.rwBCID); // open channel
                bc.onmessage = msg=>{// On message open here
                    rw.ui.loadDialog.show("Loading...");
                    redirect(msg.data);
                } 
            }
            
            // Pending changes
            rw.PendingChangesReview.reviewPage(); // will auto check if possible ext and add icons

            // MultiAct history
            rw.multiAct.initHistoryPage();
        }); 
    });
}