
import os
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "2"   # 0 = كل شيء، 1 = INFO أقل، 2 = WARNING أقل، 3 = ERROR فقط
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"  # لإلغاء oneDNN custom operations messages

os.environ["ABSL_LOGGING_MIN_LOG_LEVEL"] = "2"

import tensorflow as tf
tf.get_logger().setLevel("ERROR")  # يقلل لوجات TF أكثر

from tensorflow.keras.models import load_model
from tensorflow.keras.applications.efficientnet import preprocess_input
from tensorflow.keras.preprocessing import image
import numpy as np
import matplotlib.pyplot as plt

# =========================
# 1️⃣ تحميل المودل
# =========================
model = load_model('best_plant_model.keras')


class_names = [
    # Apple
    'Apple__Apple_scab',
    'Apple__Black_rot',
    'Apple__Cedar_apple_rust',
    'Apple__healthy',

    # Apricot
    'Apricot__blight_leaf_disease',
    'Apricot__Normal',
    'Apricot__shot_hole',

    # Carambola
    'Carambola__Anthracnose_Disease',
    'Carambola__Bed_Bugs_Disease',
    'Carambola__Early_Blight_Disease',
    'Carambola__Fruit_Borer_Disease',
    'Carambola__Healthy_Fruits',
    'Carambola__Healthy_leaf',
    'Carambola__Hooded_Hopper_Insect_Disease',
    'Carambola__Leaf_Insect_Pest_Disease',
    'Carambola__Stem_Borer_Disease',

    # Cauliflower
    'Cauliflower__Alternaria_Leaf_Spot',
    'Cauliflower__Bacterial_spot_rot',
    'Cauliflower__Black_Rot',
    'Cauliflower__Cabbage_aphid_colony',
    'Cauliflower__club_root',
    'Cauliflower__Downy_Mildew',
    'Cauliflower__Healthy',
    'Cauliflower__ring_spot',

    # Corn
    'Corn_(maize)__Cercospora_leaf_spot',
    'Corn_(maize)__Common_rust',
    'Corn_(maize)__healthy',
    'Corn_(maize)__Northern_Leaf_Blight',

    # Cucumber
    'Cucumber__Downy_mildew',
    'Cucumber__Healthy_leaves',
    'Cucumber__Powdery_mildew',

    # Eggplant
    'Eggplant__Insect_Pest_Disease',
    'Eggplant__Leaf_Spot_Disease',
    'Eggplant__Mosaic_Virus_Disease',
    'Eggplant__Small_Leaf_Disease',
    'Eggplant__White_Mold_Disease',
    'Eggplant__Wilt_Disease',
    'Eggplant__Healthy_Leaf',

    # Grape
    'Grape__Black_rot',
    'Grape__Esca_(Black_Measles)',
    'Grape__healthy',
    'Grape__Leaf_blight_(Isariopsis_Leaf_Spot)',

    # Guava
    'Guava__Canker',
    'Guava__Dot',
    'Guava__Healthy',
    'Guava__Mummification',
    'Guava__Rust',

    # Lemon
    'Lemon__Anthracnose',
    'Lemon__Bacterial_Blight',
    'Lemon__Citrus_Canker',
    'Lemon__Curl_Virus',
    'Lemon__Deficiency_Leaf',
    'Lemon__Dry_Leaf',
    'Lemon__Healthy_Leaf',
    'Lemon__Sooty_Mould',
    'Lemon__Spider_Mites',

    # Lettuce
    'Lettuce__Bacterial',
    'Lettuce__Downy_mildew_on_lettuce',
    'Lettuce__Healthy',
    'Lettuce__Powdery_mildew_on_lettuce',
    'Lettuce__Septoria_blight_on_lettuce',
    'Lettuce__Shepherd_purse_weeds',
    'Lettuce__Viral',

    # Mango
    'Mango__Anthracnose',
    'Mango__Bacterial_Canker',
    'Mango__Cutting_Weevil',
    'Mango__Die_Back',
    'Mango__Gall_Midge',
    'Mango__Healthy',
    'Mango__Powdery_Mildew',
    'Mango__Sooty_Mould',

    # Olive
    'Olive__aculus_olearius',
    'Olive__Healthy',
    'Olive__peacock_spot',

    # Orange
    'Orange__Citrus_Canker_Diseases_Leaf',
    'Orange__Citrus_Nutrient_Deficiency_Yellow',
    'Orange__Healthy_Leaf',
    'Orange__Multiple_Diseases_Leaf',
    'Orange__Young_Healthy_Leaf',

    # Pea
    'Pea__DOWNY_MILDEW_LEAF',
    'Pea__healthy',
    'Pea__LEAFMINNER_LEAF',
    'Pea__POWDER_MILDEW_LEAF',

    # Pepper
    'Pepper_bell__Bacterial_spot',
    'Pepper_bell__healthy',

    # Pomegranate
    'Pomegranate__Alternaria',
    'Pomegranate__Anthracnose',
    'Pomegranate__Bacterial_Blight',
    'Pomegranate__Cercospora',
    'Pomegranate__Healthy',

    # Potato
    'Potato___Early_blight',
    'Potato___healthy',
    'Potato___Late_blight',

    # Pumpkin
    'Pumpkin__Bacterial_Leaf_Spot',
    'Pumpkin__Downy_Mildew',
    'Pumpkin__Healthy_Leaf',
    'Pumpkin__Mosaic_Disease',
    'Pumpkin__Powdery_Mildew',

    # Radish
    'Radish__Black_leaf_spot',
    'Radish__Downey_mildew',
    'Radish__flea_beetle',
    'Radish__Fresh_leaf',
    'Radish__Mosaic_virus',

    # Soybean
    'Soybean__bacterial_blight',
    'Soybean__brown_spot',
    'Soybean__crestament',
    'Soybean__ferrugen',
    'Soybean__Mosaic_Virus',
    'Soybean__powdery_mildew',
    'Soybean__septoria',
    'Soybean__Southern_blight',
    'Soybean__Sudden_Death_Syndrome',
    'Soybean__Yellow_Mosaic',

    # Strawberry
    'Strawberry__healthy',
    'Strawberry__Leaf_scorch',

    # Tomato
    'Tomato__Target_Spot',
    'Tomato__Tomato_mosaic_virus',
    'Tomato__Tomato_YellowLeaf_Curl_Virus',
    'Tomato__Bacterial_spot',
    'Tomato__Early_blight',
    'Tomato__healthy',
    'Tomato__Late_blight',
    'Tomato__Leaf_Mold',
    'Tomato__Septoria_leaf_spot',
    'Tomato__Spider_mites_Two_spotted_spider_mite',

    # Watermelon
    'watermelon__anthracnose',
    'watermelon__downy_mildew',
    'watermelon__healthy',
    'watermelon__mosaic_virus'
    

]

# =========================
# 3️⃣ دالة لفحص الصورة
# =========================
def predict_plant_disease(img_path):
    img = image.load_img(img_path, target_size=(300, 300))
    img_array = image.img_to_array(img)
    img_array = np.expand_dims(img_array, axis=0)
    img_array = preprocess_input(img_array)

    predictions = model.predict(img_array, verbose=0)  # verbose=0 عشان ما يطبع progress bar
    idx = int(np.argmax(predictions))
    predicted_class = class_names[idx]
    confidence = float(np.max(predictions) * 100)

    plt.imshow(img)
    plt.axis('off')
    plt.title(f"{predicted_class} ({confidence:.2f}%)")
    plt.show()

    return predicted_class, confidence

#TEST
img_path = r"C:\Users\user\Desktop\adam_project\Plant_new_dataset_test\Lychee__Anthrax Leaf\Anthrax Leaf00001_bright_3.jpg"
predict_plant_disease(img_path)