# 22ter
Domoticz HTML5 frontend


# Installation

* install ngnix on the domoticz server
* install 22ter 

# bridge to domoticz

Update nginx server configuration, add this in `server` settings  :

    location /domo/ {
        proxy_pass http://127.0.0.1:8080/;
		    proxy_set_header Host $host;
	  }

# Groups configuration

Complete groups (Domoticz devices), only blinds (On,Stop,Off) ... `/usr/share/nginx/www/configuration/groups.json` :
    
    {
        "groups": [
        {
           "label": "tous",
           "list": [
           {
              "idx": 8
           },
           ...
           


# forecast.io

Create `forecast.conf` from `/usr/share/nginx/www/configuration/forecast.json.sample` in the same directory.
Set yours API key and coordinate. (Get the key from forecast.io API page).
