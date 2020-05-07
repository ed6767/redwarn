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
    "version" : "rev9", // don't forget to change each version!
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
            // Thanks to User:Awesome Aasim for the suggestion and some sample code.
            try {
                let pageIconHTML = ""; // obj it is appended to
                /* [[[[include pageIcons.html]]]] */

                // Possible icons locations: default (page icons area) or sidebar
                let iconsLocation = wikiEditor.config.pgIconsLocation ? wikiEditor.config.pgIconsLocation : "default"; // If set in config, use config
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
                        $(".sidebar-chunk").find("h2").click(e=>{
                            e.preventDefault();
                            if ($(this).parent().attr("id") != "redwarn") {
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
            let sidebarSize = 500;
            let addCol = "0,255,0"; // rbg
            let rmCol = "255,0,0"; // rgb
            if (wikiEditor.config.ptrSidebar) sidebarSize = wikiEditor.config.ptrSidebar; // If preferences set, apply them
            if (wikiEditor.config.ptrAddCol) addCol = wikiEditor.config.ptrAddCol;
            if (wikiEditor.config.ptrRmCol) rmCol = wikiEditor.config.ptrRmCol;
            
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
            wikiEditor.visuals.pageIcons(); // page icons once config loaded
            if (wikiEditor.config.lastVersion != wikiEditor.version) {
                // We've had an update
                wikiEditor.config.lastVersion = wikiEditor.version; // update entry 
                wikiEditor.info.writeConfig(true, ()=> { // update the config file
                    // Push an update toast
                    wikiEditor.visuals.toast.show("RedWiki has been updated!", "MORE",
                    ()=>redirect("https://en.wikipedia.org/wiki/User:Ed6767/redwarn/bugsquasher", true), 7500);
                });
            }

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
            } else if (window.location.hash.includes("#configChange")) {
                wikiEditor.visuals.toast.show("Preferences saved.");
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
    });
}