const request = require('request');

let page = 1;
let pages;
let url = `https://www.keyforgegame.com/api/decks/?wins=1,100&losses=1,100000&page=${page}&page_size=25`;

let count;


request(url, (err, response, body) => {
    // if there's no error, and if the server's status code is 200 (i.e. "Ok")
    if(!err && response.statusCode == 200){
    	// A - convert the downloaded text to a JavaScript Object (in this case an array)
        let data = JSON.parse(body); 
        
        count = data.count;

        pages = Math.floor(count / 25); //split the available decks into separate page loads

        console.log("Total pages: " + pages);

        for(let i = 0; i < 50; i++)
        {
            url = `https://www.keyforgegame.com/api/decks/?wins=1,100&losses=1,100000&page=${page}&page_size=25`;
            page = page + 1;
            page = page % pages;

            request(url, (err, response, body) => {
                // if there's no error, and if the server's status code is 200 (i.e. "Ok")
                if(!err && response.statusCode == 200){
                    console.log("Page loaded: " + page);
                    console.log("Deck Name: " + JSON.parse(body).data["0"].name);

                    
                }
            });
        }

    }
});
