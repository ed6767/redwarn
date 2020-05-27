rw.quickTemplate = { // Quick template UI and loader

    "packStore" : [],

    "packs" : ()=>{ // Get packs from config and default and merge to packstore
        if (rw.quickTemplate.packStore.length > 0) return rw.quickTemplate.packStore; // return if already set

        if (rw.config.templatePacks == null) { // if templates not set
            rw.config.templatePacks = []; // set to empty
            rw.info.writeConfig(true, ()=>{}); // update config page
        }
        rw.quickTemplate.packStore = rw.quickTemplate.packStore.concat(rw.config.templatePacks);
        return rw.quickTemplate.packStore; // return
    },


    "openSelectPack" : un=>{
        // Assemble buttons for each pack
        let finalBtnStr = "";
        rw.quickTemplate.packs().forEach((pack, i) => {
            if (pack.name == null) return; // skip "undefined by undefined"
            finalBtnStr += `
            <button class="mdl-button mdl-js-button mdl-button--raised mdl-js-ripple-effect mdl-button--accent" style="width:85%" onclick="window.parent.postMessage('selectPack\``+i+`', '*');">
                `+ pack.name +` by `+ pack.createdBy +`
            </button>
            <!-- EDIT BUTTON -->
            <button class="mdl-button mdl-js-button mdl-js-ripple-effect" style="width:5%" onclick="window.parent.postMessage('editPack\``+i+`', '*');">
                <i class="material-icons">create</i>
            </button>
            <br/><br/>
            `;
        });

        // Add toast handler
        addMessageHandler("pushToast`*", m=>rw.visuals.toast.show(m.split('`')[1],false,false,4000));
        // Add new pack handler
        addMessageHandler("qTnewPack", ()=>rw.quickTemplate.newPack());

        // Show pack selection dialog
        dialogEngine.create(mdlContainers.generateContainer(`
        [[[[include quickTemplateSelectPack.html]]]]
        `, 500, 530)).showModal();

        // Pack Selected Handler
        addMessageHandler("selectPack`*", cI=>{
            dialogEngine.dialog.close();

            let i = parseInt(cI.split("`")[1]); // get index from call
            rw.quickTemplate.selectTemplate(un, i); // open select template screen
        });

        // Pack edit handler
        addMessageHandler("editPack`*", cI=>{
            dialogEngine.dialog.close();

            let i = parseInt(cI.split("`")[1]); // get index from call
            rw.quickTemplate.selectTemplate(un, i, true); // open select template screen, true denotes edit
        });
    },

    "selectTemplate" : (un, i, editMode) => {
        if (editMode) un = "(edit mode)";
        let selectedPack = rw.quickTemplate.packs()[i];

        let finalSelectStr = "<hr />"; // final select string
        selectedPack.templates.forEach((template,i)=>{
            finalSelectStr += `
            <label class="mdl-radio mdl-js-radio mdl-js-ripple-effect" for="template-`+ i +`">
                <input type="radio" id="template-`+ i +`" class="mdl-radio__button" name="options" value="`+ i +`">
                <span class="mdl-radio__label">`+ template.title +`</span>
            </label><br>
            <i>`+ template.about +`</i>
            <hr />
            `;
        });

        // Add edit mode handlers
        if (editMode) {
            // TODO: add publish
            addMessageHandler("qTdeletePack", ()=>{
                // Confirm
                rw.ui.confirmDialog(`
                Are you sure you want to delete this pack?<br />
                <b>Note:</b> This will only delete the pack from your account. If it is published, this won't unpublish it.
                `,
                    "YES, DELETE.", ()=>{
                        dialogEngine.dialog.close(); // close prompt
                        rw.ui.loadDialog.show("Deleting...");
                        // Now remove at index
                        rw.config.templatePacks.splice(i, 1);
                        // Now refresh and save config
                        rw.info.writeConfig(); // save config, will also refresh
                    },
                    "CANCEL", ()=>{
                        // On cancel just recall
                        dialogEngine.dialog.close();
                        rw.quickTemplate.selectTemplate(un, i, editMode); // reshow, then done!
                    }, 45
                );
            });

            // Handle edit and new

            addMessageHandler("qTNew`*", cI=>{ //create new template
                dialogEngine.dialog.close();

                // Set up vars
                let nTitle = cI.split("`")[1];
                let nAbout = cI.split("`")[2];
                
                // Add to our template array
                rw.config.templatePacks[i].templates.push({
                    "title": nTitle,
                    "about": nAbout,
                    "content": "<!-- Enter your content here! This box fully supports wikitext. Once done, you can check that your template works and looks as expected by clicking the test button. -->"
                });
                // Clear and reload config
                rw.ui.loadDialog.show("Creating...");
                rw.info.writeConfig(true, ()=>{ // save config
                    rw.ui.loadDialog.close();
                    rw.quickTemplate.packStore = []; // clear out packs
                    
                    // Refresh selected pack
                    selectedPack = rw.quickTemplate.packs()[i];
                    // Open editor
                    rw.quickTemplate.editTemplate(i, selectedPack.length - 1); // w pack index and template index
                }); 
            });

            addMessageHandler("qTEdit`*", cI=>{
                // Open editor
                rw.quickTemplate.editTemplate(i, cI.split("`")[1]); // w pack index and template index
            });
        }
        // END edit mode handlers

        // Now we need to assemble the select screen
        // Show template selection dialog
        dialogEngine.create(mdlContainers.generateContainer(`
        [[[[include quickTemplateSelectTemplate.html]]]]
        `, 500, 530)).showModal();

        // Continue Handler (not called in edit mode)
        addMessageHandler("qTNext`*", cI2=>{
            let i2 = parseInt(cI2.split("`")[1]); // i from above frame
            let selectedTemplate = selectedPack.templates[i2];
            let contentStr = selectedTemplate.content;
            let addUnderDate = contentStr.includes("##RW UNDERDATE##");
            // Now we need to assemble inputs for this template


            // Add dialog handlers for preview
            addMessageHandler("generatePreview`*", m=>{
                rw.info.parseWikitext(m.split("`")[1], parsed=>{ // Split to Wikitext and send over to the API to be handled
                    dialogEngine.dialog.getElementsByTagName("iframe")[0].contentWindow.postMessage({
                        "action": "parseWikiTxt",
                        "result": parsed}, '*'); // push to container for handling in dialog and add https:// to stop image breaking
                });
            });

            // Add handlers for submit
            addMessageHandler("qtDone`*", eD=> {
                let wikiTxtToAdd = atob(eD.split("`")[1]); // params
                
                // MAKE EDIT
                rw.info.addWikiTextToUserPage(rw.info.targetUsername(un), wikiTxtToAdd, addUnderDate, "[[WP:REDWARN/QTPACKS|" + selectedPack.name + " - " + selectedTemplate.title + "]]");
            });

            // Finally, show final submit dialog
            dialogEngine.create(mdlContainers.generateContainer(`
            [[[[include quickTemplateSubmit.html]]]]
            `, 500, 530)).showModal();
        });
    },

    "newPack" : ()=> {
        // Creates a new pack and saves to config
        // Add toast handler
        addMessageHandler("pushToast`*", m=>rw.visuals.toast.show(m.split('`')[1],false,false,4000));

        addMessageHandler("qTcreateNew`*", cI=>{
            // Handle calls the create new pack
            let packName = cI.split("`")[1];
            rw.config.templatePacks.push(
                {
                    "name" : packName,
                    "createdBy": rw.info.getUsername(),
                    "templates" : []
                }
            ); // add to config
            rw.ui.loadDialog.show("Creating...");
            rw.info.writeConfig(true, ()=>{ // save config
                rw.ui.loadDialog.close();
                rw.quickTemplate.packStore = []; // clear out packs

                // Refresh packs and open selection screen in edit mode
                rw.quickTemplate.selectTemplate("",rw.quickTemplate.packs().length - 1, true); // true here distingishes edit mode
            });
            
        });

        // Finally, show the dialog - needs redesign rev13
        dialogEngine.create(mdlContainers.generateContainer(`
            [[[[include quickTemplateNewPack.html]]]]
        `, 500, 150)).showModal();
    },

    "editTemplate" : (selectedPackI, selectedTemplateI)=>{
        // Used to edit template
        let selectedPack = rw.quickTemplate.packs()[selectedPackI];
        let selectedTemplate = selectedPack.templates[selectedTemplateI];
        
        // Save changes handler
        addMessageHandler("qTSave`*", cI=>{
            // Set vars
            let title = atob(cI.split("`")[1]);
            let about = atob(cI.split("`")[2]);
            let content = atob(cI.split("`")[3]);
            rw.config.templatePacks[selectedTemplateI].templates[selectedTemplateI] = {
                "title": title,
                "about": about,
                "content": content
            };
            // Clear and reload config
            rw.ui.loadDialog.show("Saving...");
            rw.info.writeConfig(true, ()=>{ // save config
                rw.ui.loadDialog.close();
                rw.quickTemplate.packStore = []; // clear out packs
                
                // Refresh selected pack
                selectedPack = rw.quickTemplate.packs()[selectedPackI];
                
                // Refresh selected template
                selectedTemplate = selectedPack.templates[selectedTemplateI];
            }); 
        });

        // Finally, open the edit template dialog
        dialogEngine.create(mdlContainers.generateContainer(`
            [[[[include quickTemplateEditTemplate.html]]]]
        `, 500, 550)).showModal();
    }
};