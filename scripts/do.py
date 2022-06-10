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
    ("uezdUmrAxzw", "No, we don’t learn grammar in school - Intermediate Spanish"),
    ("wlX1M2pTwt4", "Natural wonders of Spain - Beginner Spanish - Tourism & Travel #26"),
    ("9tWMbi4e1EI", "The best way to learn Spanish - El mejor modo de aprender español"),
    ("9kzuOjM87wE", "Cómo estar bien | Spanish listening practice"),
    ("9PxvQ9Q86wM", "Habla español con fluidez este año"),
    ("sGeB2yESp8c", "❤️RELATIONSHIPS: Fun SPANISH Conversation - How to Spanish Podcast"),
    ("VQMZfw9CYaM", "😇 Being POLITE in SPANISH in real-life situations [SPANISH conversation] - Part 1"),
    ("C6f4AP7Pr6A", "Spanish Cartoons - Beginner Spanish - Spanish Culture #14"),
    ("dmSuiLw5604", "Adrià's Daily Routine 1/2 - Intermediate Spanish - Daily Life #14"),
    ("VQlzBdp2kDU", "I hate snow - Advanced Spanish - Random Topics #21")
]

def video_length(video):
    return video["transcript"][-1]["start"]

def words_from_video(video):
    word_list = []
    for transcription in video["transcript"]:
        words = transcription["text"].lower().split()
        word_list += words
    return word_list

def cumulative_unique_words(word_list):
    unique_words = set()
    accumulator = np.zeros_like(word_list, dtype=int)

    for n in range(len(word_list)):
        unique_words.add(word_list[n])
        accumulator[n] = len(unique_words)
    
    return accumulator, unique_words

def score_from_word(word):
    return dict[word] if word in dict else 1

def analyze_video(videoId, title):
    client = MongoClient("mongodb://localhost:27017")
    db = client.dreamingdb

    video = db.videos.find_one({"videoId": videoId})
    words = words_from_video(video)
    length = video_length(video)

    # Find average speech rate
    words_per_second = len(words) / length

    # Find how unique the words are at the beginning (expand to unique in general)
    unique_words_so_far, unique_words = cumulative_unique_words(words)
    unique_words_after_500 = unique_words_so_far[499] if len(unique_words_so_far) >= 500 else unique_words_so_far[-1]
    
    # Find out how popular 95% of words are at the beginning (expand to in general)
    known_words = [word for word in words if word in dict][0:500]
    scores = np.array([score_from_word(word) for word in known_words])
    scores[::-1].sort()
    idx_95 = len(scores) * 95 // 100
    percentile_95_popularity = scores[idx_95]

    # words_per_second - higher = harder
    # unique_words_after_500 - higher = harder
    # percentile_95_popularity - lower = harder (invert)

    return words_per_second, unique_words_after_500, 1.0 / percentile_95_popularity

    #x = np.linspace(0, len(scores), len(scores)) / len(scores)
    #line,  = plt.semilogy(x, scores)
    #plt.scatter(x=[idx_90 / len(scores)], y=[scores[idx_90]])
    #plt.axhline(y=scores[idx_90], linestyle="dotted")
    #x = np.linspace(0, len(unique_words_so_far), len(unique_words_so_far))
    #line, = plt.plot(x, unique_words_so_far)
    
    #line.set_label(title)

    #print("")
    #print(title)
    #print(f"{len(unique_words) / length} unique words / s.")
    
def analyze_videos(videos):
    results = []

    for videoId, title in videos:
        result = analyze_video(videoId, title)
        results.append((videoId, title, result[0], result[1], result[2]))

    return results
    
    #plt.legend(loc='upper left')
    #plt.xlabel("Time (s)")
    #plt.ylabel("Unique Words so far")
    #plt.xlim(0, 500)
    #plt.ylim(0, 400)
    #plt.savefig("output.png")

def moving_average(x, width):
    return np.convolve(x, np.ones(width), 'valid') / width

if __name__ == "__main__":
    results = analyze_videos(videos)
    positions = {}

    num_trials = 3
    for n in range(num_trials):
        result = sorted(results, key = lambda x: x[n + 2])
        
        print(f"Trial #{n}")
        for position, (videoId, title, _, _, _) in enumerate(result):
            print (f" - {result[position][n + 2]} - {title}")
            if n == 0:
                positions[videoId] = position
            else:
                positions[videoId] += position

    final_result = []
    for video in videos:
        videoId, title = video
        final_result.append((title, positions[videoId]))
    final_result = sorted(final_result, key = lambda x: x[1])

    for title, position in final_result:
        print(f"{position} - {title}")
