//functions
//I use both callbacks and async function to test them :)
//findID gives back the appid to findPrice as a promise.
//findPrice gives back the price as a promise.

'use strict';
var Alexa = require('alexa-sdk');
var https = require('https');
var request = require('request');

const APP_ID = '';

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
async function findID(gameName) {
    var data = [{
        appid: null,
        name: null,
        price: null
    }];
    return new Promise(function (resolve) {

        //Useful for finding the similarity between the game the was given in input and the ones found.
        var lengthDifference = 100;

        //api of the steam database.
        var url = "https://api.steampowered.com/ISteamApps/GetAppList/v0001/?format=json";
        //Request the json of the list of steam games
        request({
            url: url,
            json: true
        }, function (error, response, body) {

            if (error) {
                console.log("Can't get the json"); // Print the json response
            }
            //Checks if the name contains the one given in input
            body["applist"]["apps"]["app"].forEach(element => {
                //if(element["name"].toLowerCase().includes(gameName.toLowerCase())){
                    if(element["name"].toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"").indexOf(gameName.toLowerCase())> -1){
                //If it does, it checks the difference in length to get the most similar one and keeps its appid.

                //#####################################
                //one of the most important functions. needs to be optimized
                if ((element["name"].length - gameName.length) < lengthDifference) {
                    lengthDifference = element["name"].length - gameName.length;
                    data[0].appid = element["appid"];
                    data[0].name = element["name"];
                }
                //#####################################
            }
            })
            console.log('Finished findID with ID : ' + data[0].appid);
            return resolve(data);
        });
    });
}

//finds the price of the game given in input
//This functions calls findID at the beggining to get the ID.
async function findPrice(game) {
    var data = [{
        appid: null,
        name: null,
        price: null
    }];
    try {
        data = await findID(game);
    } catch (error) {
        console.log("Can't get the appid, I found : " + data[0].appid);
    }
    return new Promise(function (resolve) {

        //url of the game we found
        var url = "https://store.steampowered.com/api/appdetails/?appids=" + data[0].appid;

        //Request the json of the data of our steam game
        request({
            url: url,
            json: true
        }, function (error, response, body) {

            if (error) {
                console.log("Can't get the json"); // Print the json response
            }
            //If it can't find the data sectore it means it didn't find the game, but something related to it, like videos or dlc.
            //in that case it resolve the price to null
            if (data[0].appid==null || body[data[0].appid]["data"] == undefined || body[data[0].appid] == undefined || body[data[0].appid]["data"]["price_overview"] == undefined) {
                console.log('Finished findPrice with null price.');
                return resolve(data);
            } else {
                //otherwise it resolves the price to the one found in "final_formatted" but cuts the last char which is "€" because alexa can't read it.
                data[0].price = body[data[0].appid]["data"]["price_overview"]["final_formatted"];
                data[0].price = data[0].price.slice(0, -1);
                console.log('Finished findPrice with price : ' + data[0].price);
                return resolve(data);
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
        var data = [{
            appid: null,
            name: null,
            price: null
        }];
        console.log("name understood : " + game);
        //await for the price to be returned.
        try{
            data= await findPrice(game);
        }catch(error){
            console.log("error at receiving price in the priceIntent handler, i got : " + data[0].price);
        }
        //If the price returned is null it means it couldn't find the game.
        //In any case alexa emits the appropriate response.
        if(data[0].price== null){
            speechOutput = GAME_NOT_FOUND_MESSAGE;
        }else{
            speechOutput = GET_PRICE_MESSAGE + data[0].name + " su steam è di " + data[0].price + " euro";
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
