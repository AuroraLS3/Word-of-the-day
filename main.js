WordAPI = {
    apiUrl: "http://api.datamuse.com/words",
    findWordsRelatedTo: async function (word) {
        const relatedToQuery = `?ml=${word}`;
        return await this.xmrJSONRequest(this.apiUrl + relatedToQuery);
    },
    findWordsDescribing: async function (word) {
        const describingQuery = `?rel_jjb=${word}`;
        return await this.xmrJSONRequest(this.apiUrl + describingQuery);
    },
    xmrJSONRequest: function (toURL) {
        return new Promise((resolve, error) => {
            const xhr = new XMLHttpRequest();
            xhr.onreadystatechange = function () {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                        try {
                            resolve(JSON.parse(xhr.responseText));
                        } catch (parseError) {
                            console.error(xhr.responseText);
                            error(parseError.message);
                        }
                    } else {
                        error(
                            `Bad response code '${xhr.status}' for file '${toURL}'`
                        );
                    }
                }
            };
            xhr.open("GET", toURL, true);
            xhr.send();
        });
    },
};

WordStorage = {
    words: [],
    load: async function () {
        const wordsJSONString = localStorage.getItem("words");
        if (!wordsJSONString) {
            await this.loadNewCategory();
        } else {
            this.words = JSON.parse(wordsJSONString);
            if (!this.words || !this.words.length) {
                await this.loadNewCategory();
            }
        }
    },
    loadNewCategory: async function () {
        try {
            const category = await this.askNewCategory();
            this.words = await this.findWordsRelatedTo(category);
            this.save();
        } catch (error) {
            console.error(error);
            await this.loadNewCategory();
        }
    },
    save: function () {
        localStorage.setItem("words", JSON.stringify(this.words));
    },
    askNewCategory: function () {
        return new Promise((resolve, error) => {
            const givenCategory = prompt(
                "What thing would you like to learn vocabulary related to?"
            );
            if (!givenCategory) error();
            resolve(givenCategory);
        });
    },
    findWordsRelatedTo: async function (category) {
        const related = await WordAPI.findWordsRelatedTo(category);
        const found = [];
        for (result of related) {
            found.push(result.word);
        }
        console.log(related, describing, found);
        return found;
    },
    pickAtRandom: async function () {
        if (!this.words.length) await this.loadNewCategory();
        console.log(this.words);
        const index = Math.floor(Math.random() * this.words.length);
        const word = this.words[index];
        this.lookedAtWord(word);
        console.log(word);
        console.log(this.words);
        return word;
    },
    lookedAtWord: function (word) {
        this.words.splice(this.words.indexOf(word), 1);
        this.save();
    },
};

function generateWikipediaIFrame(word) {
    return `<iframe src="https://en.wikipedia.org/wiki/${encodeURI(
        word
    )}"></iframe>`;
}

function generateWikionaryIFrame(word) {
    return `<iframe src="https://en.wiktionary.org/wiki/${encodeURI(
        word
    )}"></iframe>`;
}

let currentWord = undefined;

async function main() {
    await WordStorage.load();

    currentWord = await WordStorage.pickAtRandom();

    document.getElementById("word").innerText = currentWord;
    document.getElementById("wikionary").innerHTML = generateWikionaryIFrame(
        currentWord
    );
    document.getElementById("wikipedia").innerHTML = generateWikipediaIFrame(
        currentWord
    );
}
main();
