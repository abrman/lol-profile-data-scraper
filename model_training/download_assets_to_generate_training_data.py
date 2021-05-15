import urllib.request, json, html, re, os

champions_url = "https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/champion-tiles/"
border_images_url = "https://raw.communitydragon.org/pbe/plugins/rcp-fe-lol-loot/global/default/assets/border_images/"
rarity_icons_url = "https://raw.communitydragon.org/pbe/plugins/rcp-fe-lol-loot/global/default/assets/rarity_icons/"
tag_icons_url = "https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-loot/global/default/assets/tag_icons/"
ward_skins_wiki_url = "https://leagueoflegends.fandom.com/wiki/Ward_skins"

# My TFT loot is empty, horrible starting point. Leaving this here for anyone who'd want to pick it up from here :)
companions_url = "https://raw.communitydragon.org/pbe/game/assets/loot/companions/"

assets_folder = "model_training/assets/"


# Make sure working directory is project root
if os.getcwd().rsplit('\\',1)[1]=="model_training":
    os.chdir( os.getcwd().rsplit('\\',1)[0] )
    
opener = urllib.request.build_opener()
opener.addheaders = [('User-agent', 'Mozilla/5.0')]
urllib.request.install_opener(opener)


def find_all_images_in_directory( url ):
    images = find_all_images_in_directory_recursive( url )
    return list(map(lambda image: image.replace(url,""), images))


def find_all_images_in_directory_recursive( url ):
    with urllib.request.urlopen(url) as url_data:
        data = html.unescape(url_data.read().decode('utf-8'))
        folders = list(re.findall('<td><a href="([^"]*/)"', data))
        images = list(re.findall('<td><a href="([^"]*.(?:png|jpg|jpeg))', data))
        images = list(map(lambda img: url+img, images))

        folders.remove("../")

        for folder in folders:
            images = images + find_all_images_in_directory_recursive(url+folder)
        return images
    return False

def download_border_images():
    images = find_all_images_in_directory(border_images_url)
    for image in images:
        source = border_images_url + image
        destination = assets_folder + "border_images/" + image
        if not os.path.exists(destination.rsplit('/',1)[0]):
            os.makedirs(destination.rsplit('/',1)[0])
        urllib.request.urlretrieve(source, destination)
        
def download_rarity_icons():
    images = find_all_images_in_directory(rarity_icons_url)
    for image in images:
        source = rarity_icons_url + image
        destination = assets_folder + "rarity_icons/" + image
        if not os.path.exists(destination.rsplit('/',1)[0]):
            os.makedirs(destination.rsplit('/',1)[0])
        urllib.request.urlretrieve(source, destination)
        
def download_tag_icons():
    images = find_all_images_in_directory(tag_icons_url)
    for image in images:
        source = tag_icons_url + image
        destination = assets_folder + "tag_icons/" + image
        if not os.path.exists(destination.rsplit('/',1)[0]):
            os.makedirs(destination.rsplit('/',1)[0])
        urllib.request.urlretrieve(source, destination)

def download_champions_and_skin():
    images = find_all_images_in_directory(champions_url)
    for image in images:
        folder = "champions/" if image.endswith("000.jpg") else "skins/"        
        source = champions_url + image
        # training_data/(champions|skins)/A+BBB/default.jpg when A+ = champion_id & BBB = skin_id
        destination = assets_folder + folder + image.split(".")[0].split("/")[1] + "/default.jpg"
        if not os.path.exists(destination.rsplit('/',1)[0]):
            os.makedirs(destination.rsplit('/',1)[0])
        urllib.request.urlretrieve(source, destination)
        print("Downloaded: "+str(image.split(".")[0].split("/")[1]))

def download_ward_skins():
    export = {}
    with urllib.request.urlopen(ward_skins_wiki_url) as url:
        wards = re.findall(
            '(?<=_Ward.png" data-src=")([^"]+\.png)',
            html.unescape(url.read().decode('utf-8'))
        )
        for source in wards:
            ward_name = source.rsplit("/",1)[1]
            destination = assets_folder + "ward_icons/" + ward_name
            if not os.path.exists(destination.rsplit('/',1)[0]):
                os.makedirs(destination.rsplit('/',1)[0])
            urllib.request.urlretrieve(source, destination)







# download_champions_and_skin()
# download_border_images()
# download_rarity_icons()
# download_tag_icons()
download_ward_skins()