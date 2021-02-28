const BASE = 269;
const TABLE_SIZE = 116477;
const BIG_PRIME = 9999983929951;

let dict, firstLayerStrings = []; 
let firstLayerHash, secondLayerHashes = new Array(TABLE_SIZE);

function getRandom(l, r) {
  return l + Math.floor(Math.random() * (r - l + 1));
}

function rollingHash(word) {
  let value = 0;
  for (let i = 0; i < word.length; ++i) {
    value = (value * BASE + word.charCodeAt(i)) % BIG_PRIME;
  }
  return value;
}

function linearHash(hashFunction, k) {
  return ((BigInt(hashFunction.a) * BigInt(k) + BigInt(hashFunction.b)) % BigInt(BIG_PRIME)) % BigInt(hashFunction.m);
}

async function processData() {
  await fetch('dict-data.json').then(response => response.json()).then(data => {
    dict = data;
  });

  let found = 0;
  while (true) {
    firstLayerHash = {a: getRandom(1, BIG_PRIME - 1), b: getRandom(0, BIG_PRIME - 1), m: TABLE_SIZE};
    let collision = 0, store = new Set();
    
    for (const word of dict) {
      let key = rollingHash(word.en);
      if (store.has(key)) {
        collision = 1;
        break;
      }
      store.add(key);
    }
    
    if (!collision) break;
  }

  for (let i = 0; i < TABLE_SIZE; ++i) firstLayerStrings[i] = [];
  for (const word of dict) {
    const key = rollingHash(word.en);
    const index = linearHash(firstLayerHash, key);
    firstLayerStrings[index].push(word);
  }

  for (let i = 0; i < TABLE_SIZE; ++i) {
    if (!firstLayerStrings[i].length) continue;
    const size = firstLayerStrings[i].length * firstLayerStrings[i].length;
    
    // O(1) iterations
    while (true) {
      let currentHash = {a: getRandom(1, BIG_PRIME - 1), b: getRandom(0, BIG_PRIME - 1), m: size};
      let secondLayerTable = new Array(size), collision = 0;

      for (const word of firstLayerStrings[i]) {
        const key = rollingHash(word.en);
        const index = linearHash(currentHash, key);
        if (secondLayerTable[index] === undefined) {
          secondLayerTable[index] = word;
        } else {
          collision = 1;
          break;
        }
      }

      if (!collision) {
        secondLayerHashes[i] = {m: size, hashFunction: currentHash, table: secondLayerTable};
        break;
      }
    }
  }
}
processData();  

function query(word) {
  const key = rollingHash(word);
  const firstIndex = linearHash(firstLayerHash, key);
  if (firstLayerStrings[firstIndex].length == 0) return undefined;
  const secondIndex = linearHash(secondLayerHashes[firstIndex].hashFunction, key);
  if (secondLayerHashes[firstIndex].table[secondIndex] == undefined) return undefined;
  return secondLayerHashes[firstIndex].table[secondIndex].en == word ? secondLayerHashes[firstIndex].table[secondIndex].bn : undefined;
}

document.getElementById("input").addEventListener("click", function(event) {
  event.preventDefault();
  let input = document.getElementById("box").value.trim().toLowerCase();
  
  if (input === '') {
    document.getElementById("output").innerHTML = "You didn't enter a word. :(";
    return;  
  }

  const response = query(input);

  if (response == undefined) {
    document.getElementById("output").innerHTML = "Sorry, looks like I don't know this word. :(";
    return;
  }
  
  document.getElementById("output").innerHTML = "The word <mark>" + input + "</mark> in Bangla can mean <span style=\"font-family: 'SolaimanLipi', sans-serif;\">" + response + "</span>.";
});



