import sys, os, html, re, json, glob, base64, urllib.request, cv2
import tensorflow as tf
import tensorflowjs as tfjs
import numpy as np
import matplotlib.pyplot as plt
from blend_modes import normal
from slpp import slpp as lua


# Lets make sure working directory is project root
if os.getcwd().rsplit(os.path.sep,1)[1]=="model_training":
    os.chdir( os.getcwd().rsplit(os.path.sep,1)[0] )

# Load up our lookup_table used for labels
with open(os.path.join("public","lookup_table.json")) as json_file:
    lookup_table  = json.load(json_file)

# Define functions used throughout the document
def read_png(path):
    image = cv2.imread(path,-1)
    return cv2.cvtColor(image,cv2.COLOR_BGR2BGRA) if len(image.shape) > 2 and image.shape[2] == 3 else image

def read_jpeg(path):
    BGR = cv2.imread(path, cv2.IMREAD_UNCHANGED)
    BGRA = cv2.cvtColor(BGR,cv2.COLOR_BGR2BGRA)
    BGRA[:,:,3] = 255
    return BGRA

def layer( image_a, image_b, ratio=1.):
    return normal(image_a.astype(float), image_b.astype(float), ratio).astype(np.uint8)

def save_model(model, model_name):
    model.save                             (os.path.join("model_training","models",model_name,"model.h5"))
    model.save                             (os.path.join("model_training","models",model_name,"model"))
    model.save_weights                     (os.path.join("model_training","models",model_name,"model_weights_checkpoint","model_weights"))
    tfjs.converters.save_keras_model(model, os.path.join("public","models",model_name))












cd_files_url = "https://raw.communitydragon.org/latest/cdragon/files.exported.txt"

# Make sure working directory is project root
if os.getcwd().rsplit('\\',1)[1]=="model_training":
    os.chdir( os.getcwd().rsplit('\\',1)[0] )

# Spoof the user-agent so out requests don't return a 403
opener = urllib.request.build_opener()
opener.addheaders = [('User-agent', 'Mozilla/5.0')]
urllib.request.install_opener(opener)


req = urllib.request.Request(cd_files_url)
resp = urllib.request.urlopen(req)
images = resp.read().splitlines()

# Load up our lookup_table used for labels
with open(os.path.join("public","lookup_table.json")) as json_file:
    lookup_table  = json.load(json_file)

champ_ids = {}
for champion_data in lookup_table["champions"]:
    whitelist = set('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ')
    champ = ''.join(filter(whitelist.__contains__, champion_data[1])).lower()
    champ_ids[champ] = champion_data[0][:-3]

champ_ids["nunu"] = champ_ids["nunuwillump"]
champ_ids["monkeyking"] = champ_ids["wukong"]



images = list(filter(lambda img: re.search('loadscreen.*\.png', str(img)) and str(img).startswith("b'game/ass") and not "/hud/" in str(img), images))
images = list(map(lambda img: "https://raw.communitydragon.org/latest/game/" + str(img).split("game")[1][:-1], images))
images_data = list(map(lambda img: re.sub('\.pie[^\.]*','',img), images))
limited_edition = list(map(lambda img: re.search(r"_le[^a-z]",img), images_data))
image_data = list(map(lambda img: re.sub('^.*\/([^\/]*)\/([^\/]*)load[^\/]*\.png',r'\1,\2', img), images_data))

for i in range(len(image_data)):

    data = image_data[i].replace("base","").replace("skin","").split(",")
    champ_id = champ_ids[data[1]] if data[1] in champ_ids else data[1]
    skin_id = data[0].zfill(3)
    filename = champ_id+skin_id+("_limited" if limited_edition[i] else "")+".png"

    image = images[i]
    source = image
    print("Saving: "+filename)
    destination = os.path.join(os.path.join("model_training","assets","loading_screens"), filename )
    # destination = os.path.join(os.path.join("model_training","assets","loading_screens"), image.split("/")[-1])
    if not os.path.isfile( destination ):
        if not os.path.exists(destination.rsplit(os.path.sep,1)[0]):
            os.makedirs(destination.rsplit(os.path.sep,1)[0])
        urllib.request.urlretrieve(source, destination)












def generate_collection_champion_training_images( champion_image_path ):
    
    champion_id = champion_image_path.rsplit(os.path.sep,1)[1].split('.')[0]
    
    image = read_png(champion_image_path)[0:377,:]

    bg = np.zeros((image.shape[0], image.shape[1], image.shape[2]), np.uint8)
    bg[:] = (22, 13, 1, 255)

    image = layer(bg, image, 0.8)    
    image = cv2.copyMakeBorder(image, 5, 5, 5, 5, cv2.BORDER_CONSTANT,value=(30,35,40,255))
    image = cv2.cvtColor(image, cv2.COLOR_BGRA2GRAY)

    for x in range(0, 13, 2):
        for y in range(0, 13, 2):
            crop = image[0+y:image.shape[0]-10+y, 0+x:image.shape[1]-10+x]              
            resized_image = cv2.resize(crop, (28,28), interpolation = cv2.INTER_AREA)
                    
            destination = os.path.join("model_training","training_data","collection_champions",champion_id,f'x{x}_y{y}.png')

            if not os.path.exists(destination.rsplit(os.path.sep,1)[0]):
                os.makedirs(destination.rsplit(os.path.sep,1)[0])

            cv2.imwrite(destination, resized_image)


def generate_collection_skin_training_images( skin_image_path ):
    
    skin_id = skin_image_path.rsplit(os.path.sep,1)[1].split('.')[0]
    
    image = read_png(skin_image_path)[18:409,14:291]

    bg = np.zeros((image.shape[0], image.shape[1], image.shape[2]), np.uint8)
    bg[:] = (22, 13, 1, 255)

    image = layer(bg, image, 0.8)    
    image = cv2.copyMakeBorder(image, 5, 5, 5, 5, cv2.BORDER_CONSTANT,value=(30,35,40,255))
    image = cv2.cvtColor(image, cv2.COLOR_BGRA2GRAY)

    for x in range(0, 13, 2):
        for y in range(0, 13, 2):
            crop = image[0+y:image.shape[0]-10+y, 0+x:image.shape[1]-10+x]              
            resized_image = cv2.resize(crop, (28,28), interpolation = cv2.INTER_AREA)
                    
            destination = os.path.join("model_training","training_data","collection_skins",skin_id,f'x{x}_y{y}.png')

            if not os.path.exists(destination.rsplit(os.path.sep,1)[0]):
                os.makedirs(destination.rsplit(os.path.sep,1)[0])

            cv2.imwrite(destination, resized_image)








# Get ward skin assets while ignoring their shadow png image
coll_champion = glob.glob(os.path.join("model_training","assets","loading_screen_assets","*.png"))
coll_champion = list(filter(lambda path: path.endswith("000.png"), coll_champion))

for path in coll_champion:
    generate_collection_champion_training_images(path)