// Used to manage the toast notifications
// init is seperate here as it isn't always needed or used

/*
    EXAMPLE SYNTAX:
    Required somewhere: wikiEditor.visuals.toast.init();
    Then:
    (for no button) wikiEditor.visuals.toast.show("Text", false, false, 2000);
    (for button) wikiEditor.visuals.toast.show("Text", "BtnTxt", function() {
        // your code here
    }, 5000);
*/

wikiEditor.visuals.toast = {
    
    "active" : false,

    "init" : function(){
        if (!wikiEditor.visuals.toast.active) { // If init already done, no need
            $('body').append(`
                <div id="wikiEditor-toast" class="mdl-js-snackbar mdl-snackbar">
                <div class="mdl-snackbar__text"></div>
                <button class="mdl-snackbar__action" type="button"></button>
                </div>
            `); // init
            (function() {
                'use strict';
                window['counter'] = 0;
                var toast = document.querySelector('#wikiEditor-toast');
                wikiEditor.visuals.register(toast); // register comp

                // create function
                wikiEditor.visuals.toast.show = (text, buttonTxt, btnClick, tOut) => {
                    'use strict';
                    if (buttonTxt) {
                        // Show with action and button
                        toast.MaterialSnackbar.showSnackbar({message: text, actionHandler: btnClick, actionText: buttonTxt, timeout: tOut}); 
                    } else {
                        // Show just message
                        toast.MaterialSnackbar.showSnackbar({message: text, timeout: tOut});
                    }
                };
                }());

            // Init done. Register.
            wikiEditor.visuals.toast.active = true;
        }
    },

    "show" : function(text, buttonTxt, btnClick) {} // made in init()

}