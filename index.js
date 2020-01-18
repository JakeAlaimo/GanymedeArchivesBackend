//const request = require('request');
const app = require("express")();
const cors = require("cors");
//const jsonFile = require("jsonfile");

const redis = require('redis');

const PORT = process.env.PORT||3000;

//allow CORS with our website specifically
app.use(cors(/*{origin: 'http://www.ganymedearchives.com'}*/));

//begin listening on the given port
app.listen(PORT, () => console.log(`Listening on port ${PORT}!`));


//const publicData = "./Data/cardData.json";
let cardData; //reads and writes from the publicData address

//prepare cardData for use
ReadPublicData();


//Handle client interface
 app.get("/api/Card/", (req, res) => {
    
    if(req.query.card_name == undefined || !cardData.hasOwnProperty(req.query.card_name)) //improperly formed request sent
    {
        res.json({error: 'Search failed.'});
    }
    else //a card name query was provided and exists in the json
    {
        //return the appropriate data
        res.json(cardData[req.query.card_name]);
        console.log(cardData[req.query.card_name]);
        console.log(req.query.card_name);
    }

 });

 app.get("/Update/", (req, res) => {
    
    ReadPublicData();
    console.log("updated card data");
 });

 app.get("/Dump/", (req, res) => {
    //ReadPublicData();
    res.json(cardData);
 });

 function ReadPublicData()
 {
    /*jsonFile.readFile(publicData, (err, obj) => {
        if (err) 
            console.log(err);
        else
        {
            cardData = obj; 
        }
    });*/
    
    let redisClient = redis.createClient(process.env.REDIS_URL);

    //retrieve cardData from redis storage
    redisClient.get('CardData', function(err, val) {
        if(err) 
            console.log(err);
        else cardData = JSON.parse(val);

        redisClient.quit();

        console.log(cardData["Faygin"]);
    });

   
 }
