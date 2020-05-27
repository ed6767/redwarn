<?php
// RedWarn's very basic build tool
// (c) Ed E
// USAGE: run in terminal or w a request
// to save to file php build.php > redwarn,js

function buildScript() {
    // For each js file
    $result = "";
    $jsFiles = [
    'styles.js',
    'init.js',
    'dialog.js',
    'mdlContainer.js',
    'rules.js',
    'toast.js',
    'info.js',
    'rollback.js',
    'ui.js',
    'whodunnit.js',
    'pendingChanges.js',
    'multiAct.js',
    'quickTemplate.js'
    ]; // List of files in order to import 
    foreach($jsFiles as $file) {
        $result .= file_get_contents($file) . "\n"; // get contents and append
    }

    $files = glob('./*.html', GLOB_BRACE); // for each html file
    foreach($files as $file) {
        $result = str_replace("[[[[include ". end(explode("/", $file)). "]]]]", file_get_contents($file), $result); // replace include statements
    }
    return '
/*
R E D W A R N
(c) 2020 Ed. E and contributors - ed6767wiki (at) gmail.com
Licensed under the Apache License 2.0 - read more at https://github.com/ed6767/redwarn/blob/master/LICENSE

+-------------------------------------------+
|                                           |
| ATTENTION ALL USERS WITH SCRIPT CHANGE    |
| PERMISSIONS                               |
|                                           |
| CHANGING THIS FILE WILL AFFECT MANY USERS |
| AND WILL BE REVERTED WHEN A NEW UPDATE    |
| IS RELEASED AS THIS FILE IS BUILT BY A    |
| SEPERATE SCRIPT. INSTEAD, ISSUE A PULL    |
| REQUEST AT                                |
| https://github.com/ed6767/redwarn         |
|                                           |
+-------------------------------------------+

To all normal users, if you wish to customise RedWarn, submit a request on the talk page or download source.
*/
// <nowiki>
'. $result . '
    $( document ).ready( function () {
        // Init when page loaded
      try {
        initRW();
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