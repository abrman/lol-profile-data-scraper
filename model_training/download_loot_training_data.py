import urllib.request, json, html, re, os

opener = urllib.request.build_opener()
opener.addheaders = [('User-agent', 'Mozilla/5.0')]
urllib.request.install_opener(opener)

champions_url = "https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/champion-tiles/"
border_images_url = "https://raw.communitydragon.org/pbe/plugins/rcp-fe-lol-loot/global/default/assets/border_images/"

# My TFT loot is empty, horrible starting point. Leaving this here for anyone who'd want to pick it up from here :)
companions_url = "https://raw.communitydragon.org/pbe/game/assets/loot/companions/"

training_data_folder = "model_training/training_data/"

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
        destination = training_data_folder + "border_images/" + image
        if not os.path.exists(destination.rsplit('/',1)[0]):
            os.makedirs(destination.rsplit('/',1)[0])
        urllib.request.urlretrieve(source, destination)

def download_champions_and_skin():
    images = find_all_images_in_directory(champions_url)
    for image in images:
        folder = "champions/" if image.endswith("000.jpg") else "skins/"        
        source = champions_url + image
        # training_data/(champions|skins)/A+BBB/default.jpg when A+ = champion_id & BBB = skin_id
        destination = training_data_folder + folder + image.split(".")[0].split("/")[1] + "/default.jpg"
        if not os.path.exists(destination.rsplit('/',1)[0]):
            os.makedirs(destination.rsplit('/',1)[0])
        urllib.request.urlretrieve(source, destination)
        print("Downloaded: "+str(image.split(".")[0].split("/")[1]))





# print( find_all_images_in_directory(border_images_url) )
download_champions_and_skin()

