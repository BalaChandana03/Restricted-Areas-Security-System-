import numpy as np
import cv2

minimum = 4000  # Define Min Contour area
frame1 = None
cap = cv2.VideoCapture(0)  # Capture object to access the camera
method = 'ABS'

# Background Subtraction Methods
mog = cv2.createBackgroundSubtractorMOG2()
knn = cv2.createBackgroundSubtractorKNN()

while True:
    ret, frame = cap.read()
    vid = cv2.flip(frame, 1)

    if method == 'MOG2':
        bgs = mog.apply(vid)
    elif method == 'KNN':
        bgs = knn.apply(vid)
    elif method == 'ABS':
        frame = cv2.GaussianBlur(vid, (7, 7), 0)
        frame = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

        if frame1 is None:
            frame1 = frame
            continue

        framedelta = cv2.absdiff(frame1, frame)
        retval, bgs = cv2.threshold(framedelta, 50, 255, cv2.THRESH_BINARY)

    mask = np.zeros_like(vid)

    # Finding contours and drawing them on the frame
    contours, _ = cv2.findContours(bgs, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    contours = sorted(contours, key=cv2.contourArea, reverse=True)

    for cnt in contours:
        if cv2.contourArea(cnt) < minimum:
            continue

        (x, y, w, h) = cv2.boundingRect(cnt)
        cv2.rectangle(vid, (x, y), (x + w, y + h), (0, 255, 0), 2)
        cv2.putText(vid, f'{method}', (20, 20), cv2.FONT_HERSHEY_COMPLEX_SMALL, 1, (0, 255, 0, 2))
        cv2.putText(vid, 'Motion Detected', (20, 40), cv2.FONT_HERSHEY_COMPLEX_SMALL, 1, (0, 255, 0, 2))
        cv2.drawContours(mask, cnt, -1, (0, 255, 0), 2)
        break

    cv2.imshow('frame', vid)
    cv2.imshow('BGS', bgs)

    key = cv2.waitKey(1)
    if key == ord('q') or key == ord('Q'):
        break
    elif key == ord('M') or key == ord('m'):
        method = 'MOG2'
    elif key == ord('K') or key == ord('k'):
        method = 'KNN'
    elif key == ord('A') or key == ord('a'):
        method = 'ABS'

cap.release()
cv2.destroyAllWindows()