/**
 *  FIRST ALEXA SKILL I MADE AND ALSO FIRST TIME I USED JAVASCRIPT.
 *  I DON'T LIKE ASYNC STUFF.
 * 
 */
'use strict';
var Alexa = require('alexa-sdk');
var https = require('https');

const APP_ID = 'HIDDEN FOR PRIVACY REASON';

const SKILL_NAME = 'Prezzi Steam';
const GAME_NOT_FOUND_MESSAGE = 'Non ho trovato giochi con questo nome';
const GET_PRICE_MESSAGE = "Il prezzo di ";
const HELP_MESSAGE = 'Prova a chiedermi quanto costa The witcher 3';
const HELP_REPROMPT = 'Come posso aiutarti?';
const STOP_MESSAGE = 'Grazie per aver usato Prezzi Steam, ci vediamo!';

//functions
//I use both callbacks and async function to test them :)
//findID gives back the appid to findPrice with callback, because findPrice needs to wait for findID to finish before continuing.
//findPrice on the other hand gives back the price to PriceIntent as a Promise because it's an async function, and PriceIntent waits for the promise with await.

//Finds the game id based on its name
function findID(gameName, callback){

    var id='';
    var values='';
    //Useful for finding the similarity between the game the was given in input and the ones found.
    var gameNameLength=gameName.length;
    var lengthDifference=100;
    
    //Contacts steam apis to get the list of all the games in its database, and adds them in values.
    https.get('https://api.steampowered.com/ISteamApps/GetAppList/v0001/?format=json', (res) => {
        res.on('data', (d) => {
            values += d;
        });
        //After it finished adding everything it searches for the game with most similar name to the one given in input.
        res.on('end', function(res) {
            var jsonContent = JSON.parse(values);
            jsonContent["applist"]["apps"]["app"].forEach(element => {
                //Checks if the name contains the one given in input
                if(element["name"].toLowerCase().includes(gameName.toLowerCase())){
                    //If it does, it checks the difference in length to get the most similar one and keeps its appid.
                    //This is done because steam gave us everything related to the game, dlcs, videos etc., but we just want the game.
                    if((element["name"].length - gameName.length)<=lengthDifference){
                        lengthDifference=element["name"].length - gameName.length;
                        id=element["appid"];  
                    }
                }
            });
            //Returns the appid found
            if(id==''){
                callback(null);
            }else{
                callback(id);
            }
        });
      
    }).on('error', (e) => {
        console.error(e);
    });
}

//finds the price of the game given in input
//This functions calls findID at the beggining to get the ID.
async function findPrice(game){
    //Code to execute before resolving the promise and giving it back to PriceIntent.
    return new Promise( function(resolve) {
    var price='';
    var appid =''; 
    //calls findID and waits for the callback function
    findID(game, function(appid) {
        //If the appid is not fund resolves the promise giving back the price.
        if(appid==null){
            price=null;
            resolve(price);
        }else{
            //otherwise contacts steam apis to get the info of the game with the appid received, and stores the informations in values.
        var values='';
        https.get('https://store.steampowered.com/api/appdetails/?appids='+ appid + '&format=json', (res) => {
            res.on('data', (d) => {
              values += d;
              });
            
            res.on('end', function(res) {
                var jsonContent = JSON.parse(values);
                console.log("app id in trovaPrezzo vale : " + appid);
                //If it can't find the data sectore it means it didn't find the game, but something related to it, like videos or dlc.
                //in that case it resolve the price to null
                if(jsonContent[appid]["data"]== undefined || jsonContent[appid] == undefined || jsonContent[appid]["data"]["price_overview"] == undefined){
                    price=null;
                    resolve(price);
                }else{
                    //otherwise it resolves the price to the one found in "final_formatted" but cuts the last char which is "€" because alexa can't read it.
                    price = jsonContent[appid]["data"]["price_overview"]["final_formatted"];
                    price = price.slice(0, -1);
                    resolve(price);
                }

            });
        }).on('error', (e) => {
            console.error(e);
        });
        }
        
    });
    });
}

const handlers = {
    'LaunchRequest': function () {
        this.response.speak("Qual è il gioco di cui cerchi il prezzo?").listen("Non ho capito, puoi ripetere il nome del gioco?");
        this.emit(':responseReady');
    },
    'PriceIntent' : async function() {
        var speechOutput='';
        var game=this.event.request.intent.slots.game.value;
        var price='';
        console.log("name understood : " + game);
        //await for the price to be returned.
        try{
            price= await findPrice(game);
        }catch(error){
            console.log("c'è stato un errore, prezzo vale  " + price);
        }
        console.log("prezzo : " + price);
        //If the price returned is null it means it couldn't find the game.
        //In any case alexa emits the appropriate response.
        if(price== null){
            console.log("prezzo non trovato");
            speechOutput = GAME_NOT_FOUND_MESSAGE;
        }else{
            speechOutput = GET_PRICE_MESSAGE + game + " su steam è di " + price + " euro";
        }
        
        this.response.cardRenderer(SKILL_NAME, speechOutput);
        this.response.speak(speechOutput);
        this.emit(':responseReady');
    },
    'AMAZON.HelpIntent': function () {
        const speechOutput = HELP_MESSAGE;
        const reprompt = HELP_REPROMPT;
        this.response.speak(speechOutput).listen(reprompt);
        this.emit(':responseReady');
    },
    'AMAZON.CancelIntent': function () {
        this.response.speak(STOP_MESSAGE);
        this.emit(':responseReady');
    },
    'AMAZON.StopIntent': function () {
        this.response.speak(STOP_MESSAGE);
        this.emit(':responseReady');
    },
    'AMAZON.FallbackIntent': function () {
        this.response.speak(GAME_NOT_FOUND_MESSAGE+ " " + HELP_MESSAGE);
        this.emit(':responseReady');
    },
    'Unhandled': function () {
        this.response.speak(GAME_NOT_FOUND_MESSAGE+ " " + HELP_MESSAGE);
        this.emit(':responseReady');
    },
};

exports.handler = function (event, context, callback) {
    const alexa = Alexa.handler(event, context, callback);
    alexa.appId = APP_ID;
    alexa.registerHandlers(handlers);
    alexa.execute();
};
