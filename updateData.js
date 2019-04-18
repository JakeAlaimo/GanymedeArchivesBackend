const request = require('request');
const jsonFile = require("jsonfile");

const publicData = "./Data/cardData.json";


let page = 1; //the current page the backend is checking
let pages;    //the total pages available to be checked
let url = `https://www.keyforgegame.com/api/decks/?wins=1,100000&losses=1,100000&page=${page}&page_size=25&links=cards`;

let matchedDecks; //the total number of decks that fit the API request

let tempData = {}; //holds all of the data pulled from the API as it is being constructed

//first, update the page count
    request(url, (err, response, body) => {
        // if there's no error, and if the server's status code is 200 (i.e. "Ok")
        if(!err && response.statusCode == 200){
            // A - convert the downloaded text to a JavaScript Object (in this case an array)
            let data = JSON.parse(body); 
        
            matchedDecks = data.count;

            pages = Math.floor(matchedDecks / 25); //split the available decks into separate page loads

            console.log("Total pages: " + pages);

            let processed = 0;

            //now process all of the pages, 50 at a time. Pause liberally
            var intervalObject = setInterval(function () { 
                
                url = `https://www.keyforgegame.com/api/decks/?wins=1,100&losses=1,100000&page=${page}&page_size=25&links=cards`;
                
                page = page + 1;

                if(page > pages+1)
                    return;

                request(url, (err, response, body) => {
                    // if there's no error, and if the server's status code is 200 (i.e. "Ok")
                    if(!err && response.statusCode == 200){

                        if(processed < pages) //not all pages have been processed yet
                        {
                            console.log("Processed: " + (processed + 1));

                            let pageObj = JSON.parse(body);

                            //loop through every card detailed on the page
                            for (let key in pageObj._linked.cards) 
                            {
                                if (pageObj._linked.cards.hasOwnProperty(key)) 
                                {
                                    let card = pageObj._linked.cards[key];
                                    
                                    //create a child object if this is a new card. Store all basic information
                                    if(tempData.hasOwnProperty(card.card_title) == false)
                                    {
                                        //don't include mavericks as their names will conflict with non-mavericks (and include a bunch of outliers in the data)
                                        if(!card.is_maverick)
                                        {
                                            tempData[card.card_title] = {};

                                            //copy all basic card attributes
                                            for(let attrib in card)
                                            {
                                                tempData[card.card_title][attrib] = card[attrib];
                                            }
                                        }
                                    }                                    
                                }
                            }

                            processed = processed + 1;
                        }

                        if(processed == pages) //the final page has been processed
                        {
                            clearInterval(intervalObject); //stop the interval (and processing pages)

                            //update the cardData with the final information
                            jsonFile.writeFile(publicData, tempData, function (err) {
                                if (err) console.error(err)
                            });

                            console.log("Done oof");

                            //tell the backend to update its copy of cardData
                            request("http://localhost:3000/Update", (err, response, body) => {});

                        }
                    }
                });
            }, 500); //10 second breaks between each batch of 50 pages
        }
    });