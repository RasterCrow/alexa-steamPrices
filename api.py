'''
FIRST PROTOTYPE MADE IN PYTHON

import requests
import json


def trovaPrezzo(appid):
    #contatto api steam
    r=requests.get("https://store.steampowered.com/api/appdetails/?appids="+ str(appid))
    data=r.json()
    #alexa dice il prezzo
    print(data[str(appid)]["data"]["price_overview"]["final_formatted"])


#gioco è il gioco captato da alexa
gioco="grand theft auto v"
#contatto api steam
r=requests.get("http://api.steampowered.com/ISteamApps/GetAppList/v0001")
data=r.json()
appid="null"
for value in data["applist"]["apps"]["app"]:
    if gioco.lower() in value["name"].lower():
        appid=value["appid"]
        print(value["name"])
        #magari qui aggiungere un check da parte di alex se quello che abbiamo trovato è quello che ci interessa
        #oppure no. per giochi con tanti dlc ci metterebbe molto

if appid is "null":
    #dire che non è stato trovato nulla
    print("Non ci sono risultati")
else:
    #alexa trova l'appid
    trovaPrezzo(appid)
'''

from flask import Flask
from flask_ask import Ask, statement, question, session
import json
import requests
import time
import unidecode

app = Flask(__name__)
ask = Ask(app, "/prezzi_steam")

def trovaGioco(game):
    #prendo tutti i giochi di steam
    r=requests.get("http://api.steampowered.com/ISteamApps/GetAppList/v0001")
    data=r.json()
    appid="null"
    for value in data["applist"]["apps"]["app"]:
        if game.lower() in value["name"].lower():
            appid=value["appid"]
            print(value["name"])
            #magari qui aggiungere un check da parte di alex se quello che abbiamo trovato è quello che ci interessa
            #oppure no. per giochi con tanti dlc ci metterebbe molto

    if appid is "null":
        #dire che non è stato trovato nulla
         print("Non ci sono risultati")
    else:
        #alexa trova l'appid
        return appid


def trovaPrezzo(gamename):
    
    appid= trovaGioco(gamename)
    #contatto api steam del gioco
    r=requests.get("https://store.steampowered.com/api/appdetails/?appids="+ str(appid))
    data=r.json()
    #alexa dice il prezzo
    price=data[str(appid)]["data"]["price_overview"]["final_formatted"]
    return price

@app.route('/')
def homepage():
    return "hi there"

@ask.launch
def start_skill():
    print("potato")
    welcome_message  = 'Ciao, che gioco stai cercando?'
    return question(welcome_message)

@ask.intent("PriceIntent")
def share_game_price(game):
    gameprice=trovaPrezzo(game)
    gameprice_msg = 'Il prezzo del gioco è {}' .format(gameprice)
    return statement(gameprice_msg)

if __name__=='__main__':
    app.run(debug=True)



def trovaGioco(game):
    #prendo tutti i giochi di steam
    r=requests.get("http://api.steampowered.com/ISteamApps/GetAppList/v0001")
    data=r.json()
    appid="null"
    for value in data["applist"]["apps"]["app"]:
        if game.lower() in value["name"].lower():
            appid=value["appid"]
            print(value["name"])
            #magari qui aggiungere un check da parte di alex se quello che abbiamo trovato è quello che ci interessa
            #oppure no. per giochi con tanti dlc ci metterebbe molto

    if appid is "null":
        #dire che non è stato trovato nulla
         print("Non ci sono risultati")
    else:
        #alexa trova l'appid
        return appid


def trovaPrezzo(gamename):
    
    appid= trovaGioco(gamename)
    #contatto api steam del gioco
    r=requests.get("https://store.steampowered.com/api/appdetails/?appids="+ str(appid))
    data=r.json()
    #alexa dice il prezzo
    price=data[str(appid)]["data"]["price_overview"]["final_formatted"]
    return price

