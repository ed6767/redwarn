// Find which editor added something to a page (i.e find when this section first occurs in an edit)
wikiEditor.whodunnit = {
    "mouseHighlighter" : () => {
        // Setup UI
        $("#firstHeading").append(" (Inspector)");
        // Show toast
        wikiEditor.visuals.toast.show(`
        Select a highlighted element by clicking it.
        Then, RedWarn will determine when this change was made and which user changed it.
        Push ESC to cancel.`, false, false, 20000000);
        // Add escape handler
        $(document).keyup(function(e) {
            if (e.key === "Escape") { 
                // refresh the page to exit
                window.location.reload();
            }
        });
        // Highlights the element the mouse is touching
        $(".mw-parser-output").unbind("mousemove"); // Clear old handlers
        $(".mw-parser-output")[0].style.cursor = "cursor:pointer;"; // Set cursor to pointer
        $(".mw-parser-output").mousemove(e=>{ // On mouse move
            let x = e.pageX - window.pageXOffset;
            let y = e.pageY - window.pageYOffset;
            // Get all current selected and rm 
            $('*[RWWhoDunnitselected="this"]').each((i, el) => {
                el.style.background = "";
                $(el).attr("RWWhoDunnitselected", ""); // rm selected
                $(el).unbind("click"); // unbind onclick
            });
            let arr = document.elementsFromPoint(x, y);
            // Only continue if more than five elements (works for normal page)
            if (arr.length > 5) {
                let sel = arr[0];
                sel.style.background = "#09b4da7d"; // Select lowest and apply hilight
                $(sel).attr("RWWhoDunnitselected", "this"); // Set element tag
                $(sel).click(e=>{
                    // On click, select this.
                    $(".mw-parser-output").unbind("mousemove"); 
                    let locateHTML = sel.outerHTML.replace(` rwwhodunnitselected="this" style="background: rgba(9, 180, 218, 0.49);"`, ""); // rm our gubbins
                    wikiEditor.whodunnit.locate(locateHTML); // Locate it
                });
            } 
        });
    },

    "locate" : htmlIn=> { // Locate first instance of this html 
        // Show loading dialog
        wikiEditor.ui.loadDialog.show("Investigating...");
        let html = htmlIn.replace(/[^\w\s!?]/g, ""); // Replace most and just leave as a char only string
        setTimeout(()=>{
            let name = mw.config.get("wgRelevantPageName");
            $.getJSON("https://en.wikipedia.org/w/api.php?action=query&prop=revisions&titles="+ encodeURIComponent(name) +"&rvlimit=500&rvprop=ids%7Cuser%7Ctimestamp&format=json", r=>{
                
                let cronologicalRevs = r.query.pages[Object.keys(r.query.pages)[0]].revisions;
                // Process to put in time order based on timestamps
                cronologicalRevs.sort((a,b)=>{
                    return new Date(b.timestamp) - new Date(a.timestamp);
                });

                console.log(cronologicalRevs);
                let done = false;
                // TODO: section requires ENTIRE REWRITE due to major issues
                cronologicalRevs.forEach((rev, i) => { // For each (async due to await)
                    // Get revID and 
                    console.log(i);
                    let revID = rev.revid;
                    $.ajax({
                        async: false,
                        type: 'GET',
                        url: "https://en.wikipedia.org/w/api.php?action=parse&format=json&oldid="+ revID,
                        success: (r2) => {
                            //callback
                            // Now we just need to check if the one before still doesn't
                            console.log(r2);

                            if (!r2.parse.text["*"].replace(/[^\w\s!?]/g,'').includes(html)) { // match strings
                                // Found where it was added!
                                // Get vars for current page to get diff
                                let cprID = cronologicalRevs[i-1].revid;
                                let cpprID = cronologicalRevs[i-1].parentid;
                                $.ajax({
                                    async: false,
                                    type: 'GET',
                                    url: "https://en.wikipedia.org/w/api.php?action=parse&format=json&oldid="+ cronologicalRevs[i+1].revid,
                                    success: (r3) => {
                                        // Yep, it's this one
                                        if (!r3.parse.text["*"].replace(/[^\w\s!?]/g, "").includes(html)) {
                                            if (i==1) {
                                                // We can't do this one ALPHA ONLY
                                                window.location.hash = "#investigateIncomp";
                                                window.location.reload(); // reload page
                                                done = true;
                                            } else {
                                                wikiEditor.ui.loadDialog.setText("Loading diff...");
                                                redirect("https://en.wikipedia.org/w/index.php?title=User:Ed6767/redwarn&diff="+ cprID +"&oldid="+ cpprID +"&diffmode=source"); // go
                                                done = true; // we done :)
                                            }
                                        }
                                    }});
                            }
                        }
                    });
                    if (done) throw ({}); // exit if done bc js stink
                });
                if (!done) {
                    // Likely not here.
                    window.location.hash = "#investigateFail";
                    window.location.reload(); // reload page
                }
            });
        }, 500); // Wait a little before running the above
    }
};