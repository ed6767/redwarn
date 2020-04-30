var dialogEngine = {
    "init" : function(){
        $("body").append(`
        <div id="dialogEngineContainer">
        </div>
        `);
        // Add events
        addMessageHandler("closeDialog", ()=>{dialogEngine.dialog.close();}); // closing
    },
    "create" : (content, noPad)=>{ 
       
        $("#dialogEngineContainer").html(`
        <dialog class="mdl-dialog">
            `+ content +`
        </dialog>
        `);


        dialogEngine.dialog = document.querySelector('dialog');

        if (noPad) $("dialog").attr("style", "padding:inherit;"); // if no padding requested

        // Firefox issue fix
        if (! dialogEngine.dialog.showModal) {
            dialogPolyfill.registerDialog(dialogEngine.dialog);
        }
        
        return dialogEngine.dialog;
    }
}