import cv2

img = cv2.imread('training_data/champions/Annie_1/Annie_1_0.jpg')

img = cv2.cvtColor(img, cv2.COLOR_RGB2GRAY)

cv2.imshow("output", img)
cv2.waitKey(0)