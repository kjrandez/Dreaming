import numpy as np
import matplotlib.pyplot as plt

from pymongo import MongoClient
from pprint import pprint

dict = {}
total_hits = 0
total_words = 0

with open ("resources/db0.txt") as file:
    for line in file:
        parts = line.split()
        for n in range(0, len(parts), 2):
            hits, word = int(parts[n]), parts[n + 1]
            dict[word] = hits
            total_words += 1
            total_hits += hits
    
    print(f"total words {total_words}")
    print(f"total hits {total_hits}")

videos = [
    ("dwdazglVd-o", "Mis problemas de memoria. | OMG!! Another video about the Spanish SUBJUNCTIVE!! 😱"),
    ("I5ymM3xI6wM", "The best intermediate series to learn Spanish - Intermediate Spanish"),
    ("EeAFY3UF8DU", "¡Adjetivos para hablar sobre comida en español!"),
    ("Sq2a9eq7yj8", "Hacer la compra en español | Vocabulario de la comida"),
    ("HUH85APB9PM", "Fast Things - Superbeginner Spanish - Random Topics #20"),
    ("K-RE7L1pyQs", "The man who stopped everyone - Superbeginner Spanish"),

]

def video_length(video):
    return video["transcript"][-1]["start"]

def words_from_video(video):
    word_list = []
    for transcription in video["transcript"]:
        words = transcription["text"].lower().split()
        word_list += words
    return word_list

def score_from_word(word):
    return dict[word] if word in dict else 1

def analyze_video(videoId, title):
    client = MongoClient("mongodb://localhost:27017")
    db = client.dreamingdb

    video = db.videos.find_one({"videoId": videoId})
    words = words_from_video(video)
    known_words = [word for word in words if word in dict]
    unique_words = set(words)
    scores = np.array([score_from_word(word) for word in known_words]) / total_hits
    
    scores[::-1].sort()
    x = np.linspace(0, len(scores), len(scores)) / len(scores)
    line,  = plt.semilogy(x, scores)
    line.set_label(title)

    idx_90 = len(scores) * 95 // 100
    plt.scatter(x=[idx_90 / len(scores)], y=[scores[idx_90]])
    plt.axhline(y=scores[idx_90], linestyle="dotted")

    print("")
    print(title)
    print(f"{len(unique_words) / video_length(video)} unique words / s.")
    
def analyze_videos(videos):
    for videoId, title in videos:
        analyze_video(videoId, title)

    plt.legend(loc='upper left')
    plt.xlabel("Words in video, Sorted most -> least common")
    plt.ylabel("Word popularity")
    plt.xlim(0.75, 1.0)
    plt.ylim(1E-7, 1E-3)
    plt.savefig("output.png")


if __name__ == "__main__":
    analyze_videos(videos)
