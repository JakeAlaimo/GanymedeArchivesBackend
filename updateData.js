const request = require('request');
const jsonFile = require("jsonfile");

const publicData = "./Data/cardData.json";


let page = 1; //the current page the backend is checking
let pages;    //the total pages available to be checked
let url = `https://www.keyforgegame.com/api/decks/?wins=1,100000&losses=1,100000&page=${page}&page_size=25&links=cards`;

let matchedDecks; //the total number of decks that fit the API request

let tempData = {}; //holds all of the data pulled from the API as it is being constructed

tempData._houses = {}; //will hold w/l data for each house

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

            //now process all of the pages, one at a time. Request once every half second
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

                                            //add custom attributes
                                            tempData[card.card_title].totalWins = 0;
                                            tempData[card.card_title].totalLosses = 0;
                                            tempData[card.card_title].winRate = 0;

                                            tempData[card.card_title].winRateModifier = 0; //how much influence this particular card has

                                            tempData[card.card_title].partnerHouseWins = {};
                                            tempData[card.card_title].partnerHouseLosses = {};
                                            tempData[card.card_title].synergies = {};

                                            tempData[card.card_title].count = 0;
                                            tempData[card.card_title].cardFrequency = 0;
                                        }
                                    }                                    
                                }
                            }

                            //loop through every deck on the page and update their card statistics
                            for (let deckKey in pageObj.data) 
                            {
                                if (pageObj.data.hasOwnProperty(deckKey)) 
                                {
                                    let deck = pageObj.data[deckKey];
                                    
                                    let houses = deck._links.houses;
                                    let cards = deck._links.cards;

                                    for (let key in cards) 
                                    {
                                        if (cards.hasOwnProperty(key)) 
                                        {
                                            let cardID = cards[key];

                                            //locate the proper card given the ID
                                            for (let card in tempData) 
                                            {
                                                if (tempData.hasOwnProperty(card)) 
                                                {
                                                    if(tempData[card].id == cardID) //we've located the appropriate card. Update its data
                                                    {
                                                        tempData[card].totalWins += deck.wins;
                                                        tempData[card].totalLosses += deck.losses;

                                                        //add data for all partner houses
                                                        for(let i = 0; i < 3; i++)
                                                        {
                                                            if(tempData[card].house != houses[i]) 
                                                            {
                                                                if(!tempData[card].partnerHouseWins.hasOwnProperty(houses[i])) //this card has no relationship with this house yet
                                                                {
                                                                    tempData[card].partnerHouseWins[houses[i]] = 0;
                                                                    tempData[card].partnerHouseLosses[houses[i]] = 0;
                                                                }
                                                                tempData[card].partnerHouseWins[houses[i]] += deck.wins;
                                                                tempData[card].partnerHouseLosses[houses[i]] += deck.losses;
                                                            }

                                                        }

                                                        tempData[card].count += 1;

                                                        break;
                                                    }
                                                }
                                            }
                                        }

                                        //add data for all partner houses
                                        for(let i = 0; i < 3; i++)
                                        {
                                            //update the global house wins + losses
                                            if(!tempData._houses.hasOwnProperty(houses[i])) //add the house entry if it isn't yet present
                                            {
                                                tempData._houses[houses[i]] = {wins: 0, losses: 0, count: 0}; 
                                            }

                                            tempData._houses[houses[i]].wins += deck.wins; 
                                            tempData._houses[houses[i]].losses += deck.losses; 
                                            tempData._houses[houses[i]].count += 12;
                                        }
                                    }                    
                                }
                            }

                            processed = processed + 1;
                        }

                        if(processed == pages) //the final page has been processed
                        {
                            clearInterval(intervalObject); //stop the interval (and processing pages)

                            //set the final rates for each card
                            for (let card in tempData) 
                            {
                                if (tempData.hasOwnProperty(card) && card != "_houses") 
                                {
                                    tempData[card].winRate =  tempData[card].totalWins / (tempData[card].totalWins + tempData[card].totalLosses);

                                    tempData[card].winRateModifier = tempData[card].winRate - (tempData._houses[tempData[card].house].wins / (tempData._houses[tempData[card].house].wins + tempData._houses[tempData[card].house].losses));

                                    for (let house in tempData[card].partnerHouseWins) 
                                    {
                                        if (tempData[card].partnerHouseWins.hasOwnProperty(house)) 
                                        {
                                            
                                            tempData[card].synergies[house] = tempData[card].partnerHouseWins[house] / (tempData[card].partnerHouseWins[house] + tempData[card].partnerHouseLosses[house]);
                                        }
                                    }

                                    tempData[card].cardFrequency =  tempData[card].count / (pages * 25 * 36); //x pages, 25 decks per page, 36 cards per deck
                                }
                            }

                            //update the cardData with the final information
                            jsonFile.writeFile(publicData, tempData, function (err) {
                                if (err) console.error(err)
                            });

                            console.log("Done oof");

                            //tell the backend to update its copy of cardData
                            //request("http://localhost:3000/Update", (err, response, body) => {}); //http://ganymede-archives.herokuapp.com/

                        }
                    }
                });
            }, 500); //0.5 second breaks between each page
        }
    });