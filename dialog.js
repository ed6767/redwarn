var dialogEngine = {
    "init" : function(){
        $("body").append(`
        <div id="dialogEngineContainer">
        </div>
        `);
        // Add events
        addMessageHandler("closeDialog", ()=>{dialogEngine.dialog.close();}); // closing
    },
    "create" : function(content){
        $("#dialogEngineContainer").html(`
        <dialog class="mdl-dialog">
            `+ content +`
        </dialog>
        `);
        dialogEngine.dialog = document.querySelector('dialog');
        return dialogEngine.dialog;
    }
}