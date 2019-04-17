const request = require('request');
const app = require("express")();
const PORT = process.env.PORT||3000;

app.listen(PORT, () => console.log(`Example app listening on port ${PORT}!`));

//HANDLE CLIENT INTERFACE BELOW////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
 app.get("/", (req, res) => {
     res.send(
         "<p>Here we return the client rquest. please work. </p>"
     );
 });

//UPDATE CARD ANALYTICS BELOW//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

let page = 1; //the current page the backend is checking
let pages;    //the total pages available to be checked
let url = `https://www.keyforgegame.com/api/decks/?wins=1,100&losses=1,100000&page=${page}&page_size=25&links=cards`;

let matchedDecks; //the total number of decks that fit the API request

//Every X minutes, request 50 more pages of decks to be updated
//TODO add interval here
    //first, update the page count
    // request(url, (err, response, body) => {
    //     // if there's no error, and if the server's status code is 200 (i.e. "Ok")
    //     if(!err && response.statusCode == 200){
    //         // A - convert the downloaded text to a JavaScript Object (in this case an array)
    //         let data = JSON.parse(body); 
            
    //         matchedDecks = data.count;

    //         pages = Math.floor(matchedDecks / 25); //split the available decks into separate page loads

    //         console.log("Total pages: " + pages);

    //         for(let i = 0; i < 50; i++)
    //         {
    //             url = `https://www.keyforgegame.com/api/decks/?wins=1,100&losses=1,100000&page=${page}&page_size=25&links=cards`;
    //             page = page + 1;
    //             page = page % pages;

    //             request(url, (err, response, body) => {
    //                 // if there's no error, and if the server's status code is 200 (i.e. "Ok")
    //                 if(!err && response.statusCode == 200){
    //                     console.log("Page loaded: " + page);
    //                     console.log("Deck Name: " + JSON.parse(body).data["0"].name);

                        
    //                 }
    //             });
    //         }

    //     }
    // });
