// **************************************************************************************************
// * Module that handles everything to do with the ETA that shows while waiting for demos to parse. *
// **************************************************************************************************

// variables that will be used to store information about the ETA
let currentFile = 0;
let totalTime = 0;
let averageTime = 1;
let timeLeft = 0;

// initialize the ETA body
const initializeETABody = () => {
  const eta = document.createElement("p");
  eta.id = "eta";
  document.body.append(eta);

  return eta;
}

// update any information we currently have before parsing the next demo
const updateETABeforeParse = (amountOfFiles) => {
  currentFile++;
  const timeBefore = Date.now();
  eta.innerText = `Parsing ${currentFile}/${amountOfFiles}\nETA: ${timeLeft} ms\nTime elapsed: ${totalTime} ms\nAverage: ${averageTime.toFixed(0)} ms`

  return timeBefore;
}

// update any information we currently have after parsing the demo
const updateETAAfterParse = (timeBefore, amountOfFiles) => {
  const timeAfter = Date.now();
  totalTime += (timeAfter - timeBefore);
  averageTime = totalTime / currentFile;
  timeLeft = (averageTime * (amountOfFiles - currentFile)).toFixed(0);
}

// removes the ETA from the screen after the demos are finished parsing
const removeETA = () => {
  document.getElementById("eta").innerText = "Done.";
  setTimeout(() => {
    document.getElementById("eta").remove();
  }, 2000);
}

export {initializeETABody, updateETABeforeParse, updateETAAfterParse, removeETA};