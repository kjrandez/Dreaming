import { ITranscription, IVideoStats } from "./mongo_types";
import readline from "readline";
import fs from "fs";

export class Analysis {
    dict: { [_: string]: number };

    constructor() {
        this.dict = {};

        const reader = readline.createInterface(
            fs.createReadStream("./resources/db0.txt")
        );

        reader.on("line", (line) => {
            const parts = line.split(" ");
            for (let i = 0; i < parts.length - 1; i += 2) {
                this.dict[parts[i + 1]] = Math.log(parseInt(parts[i]));
            }
        });
    }

    getStats(transcript: ITranscription[]): IVideoStats {
        const words = this.wordsFromTranscript(transcript);

        return {
            speed: words.length / this.videoLength(transcript),
            diversity: this.averageUniqueWords(words),
            lexicon: this.wordPopularity(words)
        };
    }

    /*averageWordPopularity(words: string[], width = 500, percentile = 95) {
        if (words.length < width) {
            return this.wordPopularity(words, percentile);
        }

        var i, acc;
        for (i = 0, acc = 0; i + width <= words.length; i++) {
            acc += this.wordPopularity(words.slice(i, i + width), percentile);
        }
        return acc / i;
    }*/

    wordPopularity(words: string[], percentile = 95) {
        const knownWords = words.filter((word) => word in this.dict);
        const scores = knownWords.map((word) => this.dict[word]);
        scores.sort();

        const index = Math.trunc((scores.length * (100 - percentile)) / 100);
        return -1.0 * scores[index];
    }

    averageUniqueWords(words: string[], width = 500) {
        if (words.length < width) {
            return new Set(words).size;
        }

        var i, acc;
        for (i = 0, acc = 0; i + width <= words.length; i++) {
            acc += new Set(words.slice(i, i + width)).size;
        }

        return acc / i;
    }

    wordsFromTranscript(transcript: ITranscription[]) {
        return transcript.map((e) => e.text.split(" ")).flat();
    }

    videoLength(transcript: ITranscription[]) {
        const last = transcript.slice(-1)[0];
        return last.start + last.duration;
    }
}
