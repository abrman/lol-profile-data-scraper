import urllib.request, json
import os

# CONFIG
assets_folder = "assets"
skip_champions_under_id = 0  # Used for incomplete champion downloads (lets you start at specific ID)
download_champion_icons = True  # Download champions icons
download_loot_icons = False  # Download other loot icons
download_skin_prices_from_wiki = False  # Downloads prices

opener = urllib.request.build_opener()
opener.addheaders = [('User-agent', 'Mozilla/5.0')]
urllib.request.install_opener(opener)

community_dragon = "http://raw.communitydragon.org/pbe/plugins/"
champion_summary_json_url = community_dragon + "rcp-be-lol-game-data/global/default/v1/champion-summary.json"
champion_key_name_dictionary = {}

with urllib.request.urlopen(champion_summary_json_url) as url:
    data = json.loads(url.read().decode())

    for champion in data:
        champion_key_name_dictionary[champion["id"]] = champion["alias"]

# print(champion_key_name_dictionary)
# {-1: 'None', 1: 'Annie', 2: 'Olaf', 3: 'Galio', 4: 'TwistedFate', 5: 'XinZhao',...}

if download_champion_icons:
    if not os.path.exists(assets_folder):
        os.makedirs(assets_folder)
    if not os.path.exists(assets_folder+"/skins"):
        os.makedirs(assets_folder+"/skins")
    if not os.path.exists(assets_folder+"/champions"):
        os.makedirs(assets_folder+"/champions")

    for champion_id in champion_key_name_dictionary.keys():
        if champion_id <= skip_champions_under_id: continue
        skin_id = 0
        loop = True
        while loop:
            url = community_dragon + "rcp-be-lol-game-data/global/default/v1/champion-tiles/" + \
                  str(champion_id) + "/" + str(champion_id) + f'{skin_id:03}' + ".jpg"
            try:
                target_folder = assets_folder + "/champions/" + champion_key_name_dictionary[champion_id] + "_" + str(champion_id)
                if skin_id > 0:
                    target_folder = assets_folder + "/skins/" + champion_key_name_dictionary[champion_id] + "_" + str(champion_id)

                if not os.path.exists(target_folder):
                    os.makedirs(target_folder)
                destination = target_folder + "/" + champion_key_name_dictionary[champion_id] + \
                              "_" + str(champion_id) + "_" + str(skin_id) + ".jpg"
                urllib.request.urlretrieve(url, destination)
                skin_id += 1
            except urllib.error.HTTPError as e:
                print("Finished downloading: " + champion_key_name_dictionary[champion_id])
                loop = False

    print("Finished downloading all champion/skin icons.")

if download_loot_icons:
    print("Hi")
