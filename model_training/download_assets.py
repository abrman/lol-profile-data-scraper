import urllib.request, html, re, os

champions_url = "https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/champion-tiles/"
border_images_url = "https://raw.communitydragon.org/pbe/plugins/rcp-fe-lol-loot/global/default/assets/border_images/"
rarity_icons_url = "https://raw.communitydragon.org/pbe/plugins/rcp-fe-lol-loot/global/default/assets/rarity_icons/"
tag_icons_url = "https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-loot/global/default/assets/tag_icons/"
ward_skins_url = "https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/content/src/leagueclient/wardskinimages/"

# My TFT loot is empty, horrible starting point. Leaving this here for anyone who'd want to pick it up from here :)
companions_url = "https://raw.communitydragon.org/pbe/game/assets/loot/companions/"

assets_folder = os.path.join("model_training","assets")


# Make sure working directory is project root
if os.getcwd().rsplit('\\',1)[1]=="model_training":
    os.chdir( os.getcwd().rsplit('\\',1)[0] )

# Spoof the user-agent so out requests don't return a 403
opener = urllib.request.build_opener()
opener.addheaders = [('User-agent', 'Mozilla/5.0')]
urllib.request.install_opener(opener)


def find_all_images_in_directory( url ):
    images = find_all_images_in_directory_recursive( url )
    return list(map(lambda image: image.replace(url,""), images))


def find_all_images_in_directory_recursive( url ):
    with urllib.request.urlopen(url) as url_data:
        data = html.unescape(url_data.read().decode('utf-8'))
        folders = list(re.findall('<td class="link"><a href="([^"]*/)"', data))
        images = list(re.findall('<td class="link"><a href="([^"]*.(?:png|jpg|jpeg))', data))
        images = list(map(lambda img: url+img, images))

        folders.remove("../")

        for folder in folders:
            images = images + find_all_images_in_directory_recursive(url+folder)
        return images

def download_from_url_and_save_to_directory( url, directory):
    images = find_all_images_in_directory(url)
    for image in images:
        source = url + image
        destination = os.path.join(directory, image.split("/")[-1])
        if not os.path.exists(destination.rsplit(os.path.sep,1)[0]):
            os.makedirs(destination.rsplit(os.path.sep,1)[0])
        urllib.request.urlretrieve(source, destination)

# Queue of download target folders & source urls pairs
queue = (
    ("champions_and_skins", champions_url),
    ("border_images", border_images_url),
    ("rarity_icons", rarity_icons_url),
    ("tag_icons", tag_icons_url),
    ("ward_skins", ward_skins_url),
)

for item in queue:
    print("Downloading into "+os.path.join(assets_folder, item[0]))
    download_from_url_and_save_to_directory(item[1], os.path.join(assets_folder, item[0]))  


# Odd one out - ward skin download to border_images/
urllib.request.urlretrieve(
    "https://raw.communitydragon.org/pbe/plugins/rcp-fe-lol-loot/global/default/assets/loot_item_icons/wardskin_background.png", 
    os.path.join(assets_folder, "border_images", "wardskin_background.png")
)
