let sequence = 'ara\nforretg\n';
const max_sequence_length = 12;
const num_chars = 27;
const char2idx = {
    '\n': 0, 'a': 1, 'b': 2, 'c': 3, 'd': 4, 'e': 5, 'f': 6, 'g': 7, 'h': 8, 'i': 9, 'j': 10, 'k': 11, 'l': 12,
    'm': 13, 'n': 14, 'o': 15, 'p': 16, 'q': 17, 'r': 18, 's': 19, 't': 20, 'u': 21, 'v': 22, 'w': 23, 'x': 24,
    'y': 25, 'z': 26
};
const idx2char = {
    0: '\n', 1: 'a', 2: 'b', 3: 'c', 4: 'd', 5: 'e', 6: 'f', 7: 'g', 8: 'h', 9: 'i', 10: 'j', 11: 'k', 12: 'l',
    13: 'm', 14: 'n', 15: 'o', 16: 'p', 17: 'q', 18: 'r', 19: 's', 20: 't', 21: 'u', 22: 'v', 23: 'w', 24: 'x',
    25: 'y', 26: 'z'
};

function randomChoice(p) {
    let rnd = p.reduce((a, b) => a + b) * Math.random();
    return p.findIndex(a => (rnd -= a) < 0);
}


let model;
(async function () {
    showButtonId("#loading-button");
    model = await tf.loadLayersModel("../../static/models/pokename/model.json");
    showButtonId("#generate-button");
})();

async function predict_model(n) {
    let new_names = [];
    while (new_names.length < n) {
        // init zero matrix
        let x = [];
        for (let i = 0; i < max_sequence_length; i++) {
            x[i] = [];
            for (let j = 0; j < num_chars; j++) {
                x[i][j] = 0;
            }
        }
        // add sequence definition
        for (let i = 0; i < sequence.length; i++) {
            x[i][char2idx[sequence[i]]] = 1;
        }
        x = [x];
        x = tf.tensor(x);

        let prediction = await model.predict(x);
        let prediction_vals = prediction.dataSync();
        let random_p_idx = randomChoice(Array.from(prediction_vals));
        let next_char = idx2char[random_p_idx];

        sequence = sequence.substring(1,) + next_char;
        if (next_char === '\n') {
            var gen_name = sequence.split('\n')[1];

            // never start name with two identical chars, could probably also
            if (gen_name.length > 2 && gen_name[0] === gen_name[1]) {
                gen_name = gen_name.substring(1,);
            }

            // discard names that are too short
            if (gen_name.length > 2) {
                if (!new_names.includes(gen_name)) {
                    new_names.push(gen_name.toLowerCase());
                }
            }
        }
    }
    return new_names;
}

