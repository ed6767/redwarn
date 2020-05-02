<?php
// RedWarn's very basic build tool
// (c) Ed E
// USAGE: run in terminal or w a request
// to save to file php build.php > redwarn,js

function buildScript() {
    // For each js file
    $result = "";
    $jsFiles = ['styles.js', 'init.js', 'dialog.js', 'mdlContainer.js', 'rules.js', 'toast.js', 'info.js', 'rollback.js', 'ui.js']; // List fo files in order to import 
    foreach($jsFiles as $file) {
        $result .= file_get_contents($file) . "\n"; // get contents and append
    }

    $files = glob('./*.html', GLOB_BRACE); // for each html file
    foreach($files as $file) {
        $result = str_replace("[[[[include ". end(explode("/", $file)). "]]]]", file_get_contents($file), $result); // replace include statements
    }
    return '
// <nowiki>
'. $result . '
    $( document ).ready( function () {
        // Init when page loaded
      try {
        initwikiEdit();
      } catch (err) {
        mw.notify("Sorry, an error occured while loading RedWarn.");
        console.error(err);
      }
    } );
// </nowiki>
    ';
}

header("content-type: application/javascript");
print buildScript();