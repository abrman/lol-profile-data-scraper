import urllib.request, json
import re
import html
import json
import os
from slpp import slpp as lua
# SLPP to convert to parse lua object from wikipedia
# pip install git+https://github.com/SirAnthony/slpp
# https://github.com/SirAnthony/slpp
# https://stackoverflow.com/questions/39838489/converting-lua-table-to-a-python-dictionary
# https://stackoverflow.com/questions/31235376/pycharm-doesnt-recognise-installed-module#:~:text=Solution%3A%20just%20install%20the%20package,you%20will%20see%20it%20pycharm%20.&text=After%20pip%20installing%20everything%20I%20needed.


skin_data_url = "https://leagueoflegends.fandom.com/wiki/Module:SkinData/data"
champions_data_url = "https://leagueoflegends.fandom.com/wiki/Module:ChampionData/data"

# Make sure working directory is project root
if os.getcwd().rsplit('\\',1)[1]=="model_training":
    os.chdir( os.getcwd().rsplit('\\',1)[0] )
    
export = {}
with urllib.request.urlopen(skin_data_url) as url:
    data = re.search(
        '(?<=-- \<pre\>\nreturn )([^$]*)(?=-- \<\/pre\>)',
        html.unescape(url.read().decode('utf-8'))
    ).group(0)
    data = lua.decode(data)
    for champion in data.keys():
        for skin_name in data[champion]["skins"].keys():
            skin = data[champion]["skins"][skin_name]
            key = str(data[champion]["id"]) + str(skin["id"]).zfill(3)

            champion_name = champion

            if skin_name == "Original":
                skin_name = ""
            if champion_name in skin_name:
                champion_name = ""
            
            full_skin_name = (skin_name + " " + champion_name).strip()
            value = skin["cost"]
            legacy = 0
            if skin["availability"] == "Legacy":
                legacy = 1


            export[key] = (full_skin_name, value, legacy)
            # if data[champion]["id"] != "None":
            #     skin_prices[key] = {
            #         "champion_name": champion,
            #         "champion_id": data[champion]["id"],
            #         "skin_name": skin_name,
            #         "skin_id": skin["id"],
            #         "cost": skin["cost"],
            #         "release": skin["release"],
            #         "availability": skin["availability"]
            #     }

# champion_prices = {}
# with urllib.request.urlopen(champions_data_url) as url:
#     data = re.search(
#         '(?<=-- \<pre\>\nreturn )([^$]*)(?=-- \<\/pre\>)',
#         html.unescape(url.read().decode('utf-8'))
#     ).group(0)
#     data = lua.decode(data)
#     for champion in data.keys():
#         key = str(data[champion]["id"])
#         champion_prices[key] = {
#             "champion_name": champion,
#             "champion_id": data[champion]["id"],
#             "be_cost": skin["cost"]
#         }

print(json.dumps(export))

if not os.path.exists('shared'):
    os.makedirs('shared')

with open(os.path.join('public','loot_id_and_prices.json'), 'w') as json_save_file:
    json.dump(export, json_save_file)
