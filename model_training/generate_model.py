import sys, os, html, re, json, glob, base64, urllib.request, cv2
import tensorflow as tf
import tensorflowjs as tfjs
import numpy as np
from blend_modes import normal
from slpp import slpp as lua

multiline_str = """
-------------------------------------------------------
*     Model generator for League of Legends loot      *
-------------------------------------------------------
This proccess may take several hours to fully complete.
Following steps will be executed:
  1. Game data generation (skin names, prices, etc.)
  2. Game image assets download (~140MB)
  3. Generating training images from assets (~2GB)
  4. Training each of the models:
    A. Champion,
    B. Skin, 
    C. Ward, 
    D. Number, 
    E. Border
        1. Parse image training data
        2. Train the model
        3. Save the model


Type "all" if you want to do a complete run through
Type number/number-letter combination single task.
Example: "2" to download assets, "4B" Train skin model
To exit you don't have to type in anything.
"""
print(multiline_str)
input_task = input()

# Make sure working directory is project root
if os.getcwd().rsplit('\\',1)[1]=="model_training":
    os.chdir( os.getcwd().rsplit('\\',1)[0] )

opener = urllib.request.build_opener()
opener.addheaders = [('User-agent', 'Mozilla/5.0')]
urllib.request.install_opener(opener)

# Define functions used throughout the document
def read_png(path):
    image = cv2.imread(path,-1)
    return cv2.cvtColor(image,cv2.COLOR_BGR2BGRA) if len(image.shape) > 2 and image.shape[2] == 3 else image

def read_jpeg(path):
    BGR = cv2.imread(path, cv2.IMREAD_UNCHANGED)
    BGRA = cv2.cvtColor(BGR,cv2.COLOR_BGR2BGRA)
    BGRA[:,:,3] = 255
    return BGRA

def layer( image_a, image_b ):
    return normal(image_a.astype(float), image_b.astype(float), 1.).astype(np.uint8)

def save_model(model, model_name):
    model.save                             (os.path.join("model_training","models",model_name,"model.h5"))
    model.save                             (os.path.join("model_training","models",model_name,"model"))
    model.save_weights                     (os.path.join("model_training","models",model_name,"model_weights_checkpoint","model_weights"))
    tfjs.converters.save_keras_model(model, os.path.join("public","models",model_name))
    
def progressbar(it, prefix="", size=60, file=sys.stdout):
    count = len(it)
    def show(j):
        x = int(size*j/count)
        file.write("%s[%s%s] %i/%i\r" % (prefix, "#"*x, "."*(size-x), j, count))
        file.flush()        
    show(0)
    for i, item in enumerate(it):
        yield item
        show(i+1)
    file.write("\n")
    file.flush()








# 1. Game data generation (skin names, prices, etc.)
if input_task.lower() == "all" or input_task == "1":
    print("1. Generating game data")
    
    skin_data_url = "https://leagueoflegends.fandom.com/wiki/Module:SkinData/data"
    champions_data_url = "https://leagueoflegends.fandom.com/wiki/Module:ChampionData/data"
    ward_skin_data_url = "https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/ward-skins.json"
    
    export = {
        "champions": [],
        "skins": [],
        "wards": [],
    }

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

                if key.endswith("000"):
                    export["champions"].append( (key, full_skin_name, value, legacy) )
                elif not key.endswith("None"):       
                    export["skins"].append( (key, full_skin_name, value, legacy) )

    with urllib.request.urlopen(ward_skin_data_url) as url:
        data = json.loads(url.read().decode())
        for i in range(len(data)):
            ward = data[i]
            isLegacy = 1 if ward["isLegacy"] else 0
            export["wards"].append( (i, ward["name"], 640, isLegacy) )

    path = os.path.join('public','lookup_table.json')
    with open(path, 'w') as json_save_file:
        json.dump(export, json_save_file)
    
    print("-  Game data saved to: "+path)








# 2. Game image assets download (~110MB)
if input_task.lower() == "all" or input_task == "2":
    print("2. Game asset download has begun")
    
    # Load up our lookup_table used for labels
    if not os.path.isfile(os.path.join("public","lookup_table.json")):
        exit("Game data file from step 1 not found. Exiting.")
    with open(os.path.join("public","lookup_table.json")) as json_file:
        lookup_table  = json.load(json_file)

    champions_url = "https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/champion-tiles/"
    border_images_url = "https://raw.communitydragon.org/pbe/plugins/rcp-fe-lol-loot/global/default/assets/border_images/"
    rarity_icons_url = "https://raw.communitydragon.org/pbe/plugins/rcp-fe-lol-loot/global/default/assets/rarity_icons/"
    tag_icons_url = "https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-loot/global/default/assets/tag_icons/"
    ward_skins_url = "https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/content/src/leagueclient/wardskinimages/"

    # My TFT loot is empty, horrible starting point. Leaving this here for anyone who'd want to pick it up from here :)
    companions_url = "https://raw.communitydragon.org/pbe/game/assets/loot/companions/"

    assets_folder = os.path.join("model_training","assets")

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

        for i in progressbar(range(len(images)), "-  Downloading: ", 40):
            image = images[i]
            destination = os.path.join(directory, image.split("/")[-1])
            if not os.path.isfile(destination):
                source = url + image                
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
        print("-  Loading image links to download into: "+os.path.join(assets_folder, item[0]))
        download_from_url_and_save_to_directory(item[1], os.path.join(assets_folder, item[0]))  


    # Odd one out - ward skin download to border_images/
    urllib.request.urlretrieve(
        "https://raw.communitydragon.org/pbe/plugins/rcp-fe-lol-loot/global/default/assets/loot_item_icons/wardskin_background.png", 
        os.path.join(assets_folder, "border_images", "wardskin_background.png")
    )





    print("-  Loading image links to download into: "+os.path.join(assets_folder, "loading_screens"))
    req = urllib.request.Request("https://raw.communitydragon.org/latest/cdragon/files.exported.txt")
    resp = urllib.request.urlopen(req)
    images = resp.read().splitlines()

    images = list(filter(lambda img: re.search('loadscreen([^1-9]*)\.png', str(img)) and str(img).startswith("b'game"), images))
    images = list(map(lambda img: "https://raw.communitydragon.org/latest/game/" + str(img).split("game/")[1][:-1], images))

    champ_ids = {}
    for champion_data in lookup_table["champions"]:
        whitelist = set('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ')
        champ = ''.join(filter(whitelist.__contains__, champion_data[1])).lower()
        champ_ids[champ] = champion_data[0]

    # Love it
    champ_ids["nunu"] = champ_ids["nunuwillump"]
    champ_ids["monkeyking"] = champ_ids["wukong"]

    for i in progressbar(range(len(images)), "-  Downloading: ", 40):
        image = images[i]
        source = image
        champ = image.split("/")[-1].split("load")[0]
        if champ in champ_ids:
            champ = champ_ids[champ] + ".png"
            destination = os.path.join(os.path.join(assets_folder, "loading_screens"), champ )
            if not os.path.isfile( destination ):
                if not os.path.exists(destination.rsplit(os.path.sep,1)[0]):
                    os.makedirs(destination.rsplit(os.path.sep,1)[0])
                urllib.request.urlretrieve(source, destination)
    
    print("-  Game asset download complete!")











# 3. Generating training images from assets (~2GB)
if input_task.lower() == "all" or input_task == "3": 
    print("3. Image generation has begun")

    if not os.path.isfile(os.path.join("public","lookup_table.json")):
        exit("Game data file from step 1 not found. Exiting.")
    with open(os.path.join("public","lookup_table.json")) as json_file:
        lookup_table  = json.load(json_file)
    
    def generate_champion_and_skin_training_images( champion_image_path ):
        
        champion_id = champion_image_path.rsplit(os.path.sep,1)[1].split('.')[0]
        champion_data = list(filter(lambda row: row[0] == champion_id, lookup_table["champions"]+lookup_table["skins"]))[0]
        price = champion_data[2]
        is_legacy = champion_data[3] == 1
        asset_folder = "champions" if champion_id.endswith("000") else "skins"  
        
        if len(glob.glob(os.path.join("model_training","training_data",asset_folder,champion_id,"*.png"))) == 336:
            return
        
        # 1.A loading and preparing assets
        champion = cv2.copyMakeBorder(read_jpeg(champion_image_path), 0, 5, 5, 0, cv2.BORDER_CONSTANT,value=(0,0,0,255))
        shard_border = cv2.resize(read_png(os.path.join("model_training","assets","border_images","shard.png")), (385,385))
        permanent_border = cv2.resize(read_png(os.path.join("model_training","assets","border_images","permanent.png")), (385,385))
        token_6_border = read_png(os.path.join("model_training","assets","border_images","champion_token_6.png"))[5:74, :]
        token_6_border = cv2.resize(token_6_border, (385,385))
        token_7_border = read_png(os.path.join("model_training","assets","border_images","champion_token_7.png"))[5:74, :]
        token_7_border = cv2.resize(token_7_border, (385,385))
        quantity_background = cv2.resize(read_png(os.path.join("model_training","assets","border_images","quantity_background.png")), (385,385))

        if is_legacy: legacy_icon = read_png(os.path.join("model_training","assets","tag_icons","legacy.png"))
            
        if price == "special": rarity_icon = read_png(os.path.join("model_training","assets","rarity_icons","rarity_mythic.png"))
        if price == 3250: rarity_icon = read_png(os.path.join("model_training","assets","rarity_icons","rarity_ultimate.png"))
        if price == 1820: rarity_icon = read_png(os.path.join("model_training","assets","rarity_icons","rarity_legendary.png"))
        if price == 1350: rarity_icon = read_png(os.path.join("model_training","assets","rarity_icons","rarity_epic.png"))

        # 1.B Resize rarity and legacy icons to 395x395 pixel resolution overlay images
        if 'legacy_icon' in locals():
            legacy_icon = cv2.resize(legacy_icon, (110,110))
            legacy_icon = cv2.copyMakeBorder(legacy_icon, 291, 0, 0, 297, cv2.BORDER_CONSTANT,value=(0,0,0,0))
            legacy_icon = legacy_icon[0:395,legacy_icon.shape[1]-395:legacy_icon.shape[1]]

        if 'rarity_icon' in locals():
            rarity_icon = cv2.resize(rarity_icon, (385,int(385/rarity_icon.shape[1]*rarity_icon.shape[0])))
            rarity_icon = cv2.copyMakeBorder(rarity_icon, 285, 5, 5, 5, cv2.BORDER_CONSTANT,value=(0,0,0,0))
            rarity_icon = rarity_icon[0:395,0:395]

        # 2. Set up borders this asset uses in the loot tab
        if champion_id.endswith("000"):
            borders = (shard_border, permanent_border, token_6_border, token_7_border)
        else:
            borders = (shard_border, permanent_border)
        
        # 3. Create variations of assets from layers
        for border_index in range(len(borders)):
            for shadow in (False, True):
                image = layer(champion, quantity_background) if shadow else champion
                image = layer(image, borders[border_index])
                image = cv2.copyMakeBorder(image, 5, 5, 5, 5, cv2.BORDER_CONSTANT,value=(14,14,14,255))            

                y_range_increment = 2
                if not champion_id.endswith("000"):
                    y_range_increment = 1
                    if 'legacy_icon' in locals(): image = layer(image, legacy_icon)  
                    if 'rarity_icon' in locals(): image = layer(image, rarity_icon)  
                        
                image = cv2.cvtColor(image, cv2.COLOR_BGRA2GRAY)

            
                # Create different crops to accomodate the imperfection of client screenshot percision
                for x in range(0, 13, 2):
                    for y in range(1, 13, y_range_increment):
                        crop = image[0+y:image.shape[1]-10+y, 0+x:image.shape[1]-10+x]              
                        resized_image = cv2.resize(crop, (28,28), interpolation = cv2.INTER_AREA)
                                              
                        destination = os.path.join("model_training","training_data",asset_folder,champion_id,f'{("shard","permanent","token6","token7")[border_index]}_{"yes" if shadow else "no"}-shadow_x{x}_y{y}.png')

                        if not os.path.exists(destination.rsplit(os.path.sep,1)[0]):
                            os.makedirs(destination.rsplit(os.path.sep,1)[0])

                        cv2.imwrite(destination, resized_image)



    def generate_ward_skin_training_images( ward_image_path ):

        ward_id = ward_image_path.rsplit("_",1)[1].split(".")[0]

        if len(glob.glob(os.path.join("model_training","training_data","wards",ward_id,"*.png"))) == 336:
            return

        # 1.A loading and preparing assets
        ward = read_png(ward_image_path)
        ward = cv2.copyMakeBorder(ward[0:ward.shape[1],:], 0, 7, 7, 0, cv2.BORDER_CONSTANT,value=(0,0,0,0))
        ward_background = cv2.resize(read_png(os.path.join("model_training","assets","border_images","wardskin_background.png")), (467,467))
        shard_border = cv2.resize(read_png(os.path.join("model_training","assets","border_images","shard.png")), (467,467))
        permanent_border = cv2.resize(read_png(os.path.join("model_training","assets","border_images","permanent.png")), (467,467))
        quantity_background = cv2.resize(read_png(os.path.join("model_training","assets","border_images","quantity_background.png")), (467,467))


        borders = (shard_border, permanent_border)
            
        # 2. Create variations of assets from layers
        for border_index in range(len(borders)):
            for shadow in (False, True):
                image = layer(ward_background, quantity_background) if shadow else ward_background
                image = layer(image, ward)
                image = layer(image, borders[border_index])
                image = cv2.copyMakeBorder(image, 5, 5, 5, 5, cv2.BORDER_CONSTANT,value=(14,14,14,255))
                        
                image = cv2.cvtColor(image, cv2.COLOR_BGRA2GRAY)
            
                # Create different crops to accomodate the imperfection of client screenshot percision
                for x in range(0, 13, 2):
                    for y in range(1, 13, 1):
                        crop = image[0+y:image.shape[1]-10+y, 0+x:image.shape[1]-10+x]              
                        resized_image = cv2.resize(crop, (28,28), interpolation = cv2.INTER_AREA)

                        destination = os.path.join("model_training","training_data","wards",ward_id,f'{("shard","permanent")[border_index]}_{"yes" if shadow else "no"}-shadow_x{x}_y{y}.png')

                        if not os.path.exists(destination.rsplit(os.path.sep,1)[0]):
                            os.makedirs(destination.rsplit(os.path.sep,1)[0])

                        cv2.imwrite(destination, resized_image)

    # Get champion and skins assets
    champions_and_skins = glob.glob(os.path.join("model_training","assets","champions_and_skins","*.jpg"))

    # Generate training data if the lookup_table contains the ID
    # If ID is missing in lookup table run "generate_lookup_table.py"
    # If ID is still missing, this champion is very fresh as wikipedia doesn't know of him :)
    missing_ids = []

    for i in progressbar(range(len(champions_and_skins)), "-  Generating champion/skin images: ", 40):
        image = champions_and_skins[i]
        champion_id = image.rsplit(os.path.sep,1)[1].split('.')[0]
        champion_data = list(filter(lambda row: row[0] == champion_id, lookup_table["champions"]+lookup_table["skins"]))
        if len(champion_data) > 0:
            generate_champion_and_skin_training_images(image)
        else:
            missing_ids.append(champion_id)

    if len(missing_ids) > 0:
        print("!   Missing asset data. Perhaps a new champion/skin has been released?")
        print("!   The model will not be able to classify this ")
        print("!   IDs with missing data: "+",".join(map(lambda x: str(x), missing_ids)))
        if input("Would you like to continue? (y/n)").lower() == "n":
            exit()

    # Get ward skin assets while ignoring their shadow png image
    ward_skins = glob.glob(os.path.join("model_training","assets","ward_skins","*.png"))
    ward_skins = list(filter(lambda ward: "shadow" not in ward, ward_skins))

    # Generate training data if the lookup_table contains the ID
    # If ID is missing in lookup table run "generate_lookup_table.py"
    # If ID is still missing, this champion is very fresh as wikipedia doesn't know of him :)
    missing_ids = []

    for i in progressbar(range(len(ward_skins)), "-  Generating ward skin images: ", 40):
        image = ward_skins[i]
        ward_id = image.rsplit("_",1)[1].split(".")[0]
        ward_data = list(filter(lambda row: row[0] == int(ward_id), lookup_table["wards"]))
        if len(ward_data) > 0:
            generate_ward_skin_training_images(image)
        else:
            missing_ids.append(ward_id)

    if len(missing_ids) > 0:
        print("!   Missing asset data. Perhaps a new ward has been released?")
        print("!   The model will not be able to classify this asset.")
        print("!   IDs with missing data: "+",".join(map(lambda x: str(x), missing_ids)))
        if input("Would you like to continue? (y/n)").lower() == "n":
            exit()
    print("-  Image generation complete")





# 4. Training each of the models
if input_task.lower() == "all" or input_task.startswith("4"):

    if not os.path.isfile(os.path.join("public","lookup_table.json")):
        exit("Game data file from step 1 not found. Exiting.")
    with open(os.path.join("public","lookup_table.json")) as json_file:
        lookup_table  = json.load(json_file)




    # 4A. Champion
    if input_task.lower() == "all" or input_task == "4A" or input_task == "4":
        print("4. A. Champion model training has begun")
        champion_train_image_paths = glob.glob( os.path.join("model_training","training_data","champions","**","*.png") )

        champion_train_labels = []
        champion_train_images = []

        
        for i in progressbar(range(len(champion_train_image_paths)), "-     Parsing image data: ", 40):
            image = champion_train_image_paths[i]
            asset_id = image.rsplit(os.path.sep, 2)[1]
            
            for row_index in range(len(lookup_table["champions"])):
                if lookup_table["champions"][row_index][0] == asset_id:
                    label = row_index

            image = read_png(image)
            image = image / 255

            champion_train_labels.append(label)
            champion_train_images.append(image)
            
        champion_train_images = np.array(champion_train_images)
        champion_train_labels = np.array(champion_train_labels)

        champion_model = tf.keras.Sequential([
            tf.keras.layers.Flatten(input_shape=(28, 28)),
            tf.keras.layers.Dense(len(lookup_table["champions"]))
        ])

        champion_model.compile(optimizer='adam',
            loss=tf.keras.losses.SparseCategoricalCrossentropy(from_logits=True),
            metrics=['accuracy'])

        champion_model.fit( champion_train_images, champion_train_labels, epochs=100)

        champion_model.summary()
        save_model(champion_model, "champions")
        
        del champion_train_image_paths
        del champion_train_labels
        del champion_train_images

        print("-     Champion model training is complete!")




    # 4B. Skin
    if input_task.lower() == "all" or input_task == "4B" or input_task == "4":
        print("4. B. Skin model training has begun")
        skin_train_image_paths = glob.glob( os.path.join("model_training","training_data","skins","**","*.png") )

        skin_train_labels = []
        skin_train_images = []

        for i in progressbar(range(len(skin_train_image_paths)), "-     Parsing image data: ", 40):
            image = skin_train_image_paths[i]
            asset_id = image.rsplit(os.path.sep, 2)[1]
            
            for row_index in range(len(lookup_table["skins"])):
                if lookup_table["skins"][row_index][0] == asset_id:
                    label = row_index

            image = read_png(image)
            image = image / 255

            skin_train_labels.append(label)
            skin_train_images.append(image)
            
        skin_train_images = np.array(skin_train_images)
        skin_train_labels = np.array(skin_train_labels)

        skin_model = tf.keras.Sequential([
            tf.keras.layers.Flatten(input_shape=(28, 28)),
            tf.keras.layers.Dense(len(lookup_table["skins"]))
        ])

        skin_model.compile(optimizer='adam',
            loss=tf.keras.losses.SparseCategoricalCrossentropy(from_logits=True),
            metrics=['accuracy'])

        skin_model.fit( skin_train_images, skin_train_labels, epochs=100)

        skin_model.summary()
        save_model(skin_model, "skins")
        
        del skin_train_image_paths
        del skin_train_labels
        del skin_train_images
        print("-     Skin model training is complete!")




    # 4C. Ward
    if input_task.lower() == "all" or input_task == "4C" or input_task == "4":
        print("4. C. Ward model training has begun")
        ward_train_image_paths = glob.glob( os.path.join("model_training","training_data","wards","**","*.png") )

        ward_train_labels = []
        ward_train_images = []

        for i in progressbar(range(len(ward_train_image_paths)), "-     Parsing image data: ", 40):
            image = ward_train_image_paths[i]
            asset_id = image.rsplit(os.path.sep, 2)[1]

            image = read_png(image)
            image = image / 255

            ward_train_labels.append(int(asset_id))
            ward_train_images.append(image)
            
        ward_train_images = np.array(ward_train_images)
        ward_train_labels = np.array(ward_train_labels)

        ward_model = tf.keras.Sequential([
            tf.keras.layers.Flatten(input_shape=(28, 28)),
            tf.keras.layers.Dense(len(lookup_table["wards"]))
        ])

        ward_model.compile(optimizer='adam',
            loss=tf.keras.losses.SparseCategoricalCrossentropy(from_logits=True),
            metrics=['accuracy'])

        ward_model.fit( ward_train_images, ward_train_labels, epochs=100)

        ward_model.summary()
        save_model(ward_model, "wards")
        
        del ward_train_image_paths
        del ward_train_labels
        del ward_train_images
        print("-     Ward model training is complete!")





    # 4D. Number
    if input_task.lower() == "all" or input_task == "4D" or input_task == "4":
        print("4. D. Number model training has begun")
        number_train_labels = []
        number_train_images = []

        numbers_image = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEYAAACTAQMAAAAJE/1bAAAAAXNSR0IB2cksfwAAAAlwSFlzAAALEwAACxMBAJqcGAAAAAZQTFRFAAAA////pdmf3QAAAhFJREFUeJyNzz9r20AYx/GjGKNBlDNdBA1BQ4aMJwLtmYRGAbVT+h5cktGGZHOoWrtOiDUYTDaHhPY1ZAt0qHHFNYMSz4YMNinemlZ4afDSe05/fFLkNNvDDZ/7fRHGW8Nm/ZVGkLWLTUd5YjnIKmDk4JzJL4xQvYAUcS3VjxRLQSZu6PUjjT9gwzcPVKzrCJObUfvgI90BZSNUDNzgitVCFkHmp0Jumb8Rc6krFIs0dEcoxLjrNlVMdUT/o+gZSg8UN1SeagllUyj5lEKs/YK6DJf5Iq3QUCkFymGGouVeC8Xdf6bacJVecsVNKMW7bvuRSvu5rGhoW1KmoFQjpQaKjzdaKcUl5KeknCksUC5ipT9fWcG9pOKBst71QSmTHnlIIUJpCaUlFDZfYUllEirlCQVlExSNK/m3oXICiisUR1K0lNI/rK1VQdny1EjxYqX/NVKGM+VYKHvTYagYE58rtqwwUBbyFVCMMSjXaWWgMRooi9SOt1ChvPOUjC1ZRcdhUXJLVlFlVpS1JS6CLcWg6C8qT4VyeYrYKlcWhULjIlpaH/kdxn+jPTKYFX2mc5Sr1Y6sfAOFPazsScqNt/BmpvyKlQ+RcioURgbTWPlC7T/3lT4o53MVG5Qdrowpqr5PKE1J+X0NyvdQKUbKWFZ208oaKO17yo+0cktLtVApgtIJlFGg2LFSeYxyFSu3kvIP9ENXILgWa2YAAAAASUVORK5CYII="
        encoded_data = numbers_image.split(',')[1]
        nparr = np.frombuffer(base64.b64decode(encoded_data), np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)[:,:,0] / 255

        for x in range(0, img.shape[1], 7):
            for y in range(0, img.shape[0], 7):
                crop = img[y:y+7, x:x+7]

                number_train_labels.append(x//7)
                number_train_images.append(crop)

        model_number = tf.keras.Sequential([
            tf.keras.layers.Flatten(input_shape=(7, 7)),
            tf.keras.layers.Dense(10)
        ])

        model_number.compile(optimizer='adam',
            loss=tf.keras.losses.SparseCategoricalCrossentropy(from_logits=True),
            metrics=['accuracy'])

        number_train_labels = np.array(number_train_labels)
        number_train_images = np.array(number_train_images)

        model_number.fit( number_train_images, number_train_labels, epochs=5000)

        model_number.summary()
        save_model(model_number, "numbers")
        
        del number_train_labels
        del number_train_images
        print("-     Number model training is complete!")





    # 4E. Border
    if input_task.lower() == "all" or input_task == "4E" or input_task == "4":
        print("4. E. Border model training has begun")
        shard_permanent_image_paths = glob.glob( os.path.join("model_training","training_data","**","*.png") )

        shard_permanent_train_labels = []
        shard_permanent_train_images = []

        for i in progressbar(range(len(shard_permanent_image_paths)), "-     Parsing image data: ", 40):

            image = shard_permanent_image_paths[i]
            label = 0 if "shard" in image else 1

            image = read_png(image) / 255

            shard_permanent_train_labels.append(label)
            shard_permanent_train_images.append(image)

        shard_permanent_train_images = np.array(shard_permanent_train_images)
        shard_permanent_train_labels = np.array(shard_permanent_train_labels)

        model_shard_permanent = tf.keras.Sequential([
            tf.keras.layers.Flatten(input_shape=(28, 28)),
            tf.keras.layers.Dense(2)
        ])

        model_shard_permanent.compile(optimizer='adam',
            loss=tf.keras.losses.SparseCategoricalCrossentropy(from_logits=True),
            metrics=['accuracy'])
            
        model_shard_permanent.fit( shard_permanent_train_images, shard_permanent_train_labels, epochs=10)

        model_shard_permanent.summary()
        save_model(model_shard_permanent, "shard_permanent")
        
        del shard_permanent_image_paths
        del shard_permanent_train_labels
        del shard_permanent_train_images
        print("-     Border model training is complete!")