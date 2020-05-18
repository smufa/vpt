import numpy as np
from os import listdir
from os.path import isfile, join

def translate(value, oldMin, oldMax, newMin, newMax):
    return (((value - oldMin) * (newMax - newMin)) / (oldMax - oldMin)) + newMin

if __name__ == "__main__":
    pathToFiles = "C:/Users/jerne/Desktop/4D-Lung/Volumes/int16"
    pathToOutputFolder = "C:/Users/jerne/Desktop/4D-Lung/Volumes/uint8"
    files = [f for f in listdir(pathToFiles) if isfile(join(pathToFiles, f))]
    print(files)
    max = np.iinfo(np.int16).min;
    min = np.iinfo(np.int16).max;
    for file in files:
        localMax = np.max(np.fromfile(join(pathToFiles, file), dtype=np.int16))
        localMin = np.min(np.fromfile(join(pathToFiles, file), dtype=np.int16))
        if localMax > max:
            max = localMax
        if localMin < min:
            min = localMin

    for file in files:
        print("Started on file " + file)
        int16array = np.fromfile(join(pathToFiles, file), dtype=np.int16)
        uint8array = np.zeros([int16array.size], dtype=np.uint8)
        for index, x in np.ndenumerate(int16array):
            uint8array[index[0]] = translate(x, min, max, np.iinfo(np.uint8).min, np.iinfo(np.uint8).max)

        uint8array.tofile(join(pathToOutputFolder, file))

