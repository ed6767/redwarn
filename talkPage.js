rw.talkPage = { // For talk page ease of use. rev11
    "init" : ()=> {
        // Called when on a talk page.
        // Find every message by regex matching the timestamps
        /*
            REGEX ref.

            To match a timestamp (in a signiture)
            \d{1,2}\:\d{2}, \d{1,2} (\b\d{1,2}\D{0,3})?\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|(Nov|Dec)(?:ember)?)\D?(\d{1,2}\D?)?\D?((19[7-9]\d|20\d{2})|\d{2}) \(UTC\)

            To match titles:
            ==(.*?)==
            Match titles requires work, i.e check if only 2 = at the start else we done goofed
        */
        
    },

    "loadTalkPage": msg=> { // Array of lines, beginning with title
        $("#mw-content-text > p, #mw-content-text > dl").each((i,el)=> { // for each paragraph element
            // Match sigs
            let matchedSigs = $(el).text().match(/\d{1,2}\:\d{2}, \d{1,2} (\b\d{1,2}\D{0,3})?\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|(Nov|Dec)(?:ember)?)\D?(\d{1,2}\D?)?\D?((19[7-9]\d|20\d{2})|\d{2}) \(UTC\)/g);

            if (matchedSigs != null) { // Match?
                // Find the location of the sigs then add the username
                // For now
                $(el).append(" - Reply");
            }
        });
    }


};