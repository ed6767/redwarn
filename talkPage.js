wikiEditor.talkPage = { // For talk page ease of use. rev10
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

    "parseTalkPageMessage": msg=> { // Array of lines, beginning with title

    }


};