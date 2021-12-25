const path = require("path");
const { Worker, threadId } = require("worker_threads");
const { getRandomIntInclusive } = require("./utils/getRandomIntInclusive");
const { quickSort } = require("./utils/quickSort");

const n = 100_000;

const array = Array(n)
  .fill()
  .map(() => getRandomIntInclusive(0, 1000_000));

console.log("array: ", array);

// Buffer creation // After buffer is created pass it in workerData
// const buffer = new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT * n);
// const view = new Int32Array(buffer);

function runQuickSortWorker(workerData) {
  return new Promise((resolve, reject) => {
    const quickSortWorker = new Worker(
      path.join(__dirname, "./workers/quickSortWorker.js"),
      { workerData }
    );

    quickSortWorker.on("message", resolve);
    quickSortWorker.on("error", reject);
    quickSortWorker.on("exit", (code) => {
      if (code !== 0)
        reject(new Error(`Worker stopped with exit code ${code}`));
    });
  });
}

function fillInSharedArrayView(view, viewLength) {
  for (let i = 0; i <= viewLength; i++) {
    view[i];
  }
}

async function threadedQuickSort(array) {
  if (array.length < 2) {
    return array;
  }
  const pivot = array[0];
  const less = [];
  const greater = [];

  for (let i = 1; i < array.length; i++) {
    if (pivot > array[i]) {
      less.push(array[i]);
    } else {
      greater.push(array[i]);
    }
  }

  const sortedPartitions = await Promise.all([
    runQuickSortWorker(less),
    runQuickSortWorker(greater),
  ]);

  return sortedPartitions[0].concat(pivot, sortedPartitions[1]);
}

console.log("mainThreadId: ", threadId);

console.time("quickSort");
console.log("Sorted array: ", quickSort([...array]));
console.timeEnd("quickSort");

async function runThreadedQuickSort() {
  console.time("threadedQuickSort");
  console.log("Sorted threaded array: ", await threadedQuickSort([...array]));
  console.timeEnd("threadedQuickSort");
}

runThreadedQuickSort().catch((error) => console.error(error));
