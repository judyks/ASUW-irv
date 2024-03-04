let globalCsvData = null;
let winners = {};

document.addEventListener("DOMContentLoaded", () => {
  const fileInput = document.getElementById("fileInput");
  const processButton = document.getElementById("processButton");
  const resultsByRoundButton = document.getElementById(
    "resultsByRoundButton"
  );
  const dropZone = document.getElementById("dropZone");
  const fileNameElement = document.getElementById("fileName");

  fileInput.addEventListener("change", function (event) {
    handleFileSelect(event);
    if (fileInput.files.length > 0) {
      fileNameElement.innerHTML =
        "<b>" + fileInput.files[0].name + "</b>";
    } else {
      fileNameElement.innerHTML = "<b>No file selected</b>";
    }
  });

  processButton.addEventListener("click", processButtonClick);
  document
    .getElementById("positionDropdown")
    .addEventListener("change", updateLocationHash);
  resultsByRoundButton.addEventListener("click", toggleResultsDisplay);

  dropZone.addEventListener("click", () => fileInput.click());

  dropZone.addEventListener("dragover", (event) => {
    event.stopPropagation();
    event.preventDefault();
    dropZone.classList.add("dragover");
  });

  dropZone.addEventListener("dragleave", (event) => {
    event.stopPropagation();
    event.preventDefault();
    dropZone.classList.remove("dragover");
  });

  dropZone.addEventListener("drop", (event) => {
    event.stopPropagation();
    event.preventDefault();
    dropZone.classList.remove("dragover");

    const files = event.dataTransfer.files;
    if (files.length) {
      fileInput.files = files;
      fileNameElement.textContent = files[0].name;
      handleFileSelect({ target: { files } });
    }
  });
});

function handleFileSelect(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    globalCsvData = e.target.result;
    document.getElementById("processButton").disabled = false;
  };
  reader.readAsText(file);
}

function processButtonClick() {
  if (globalCsvData) {
    processData(globalCsvData);
  }
}

function updateLocationHash() {
  const positionDropdown = document.getElementById("positionDropdown");
  if (positionDropdown.value) {
    location.hash = `#${positionDropdown.value}`;
  }
}

function toggleResultsDisplay() {
  const roundResultsContainer = document.getElementById(
    "roundResultsContainer"
  );
  const outputContainer = document.getElementById("output");
  const positionDropdown = document.getElementById("positionDropdown");
  const winnersOverview = document.getElementById("winnersOverview");
  const isHidden = roundResultsContainer.style.display === "none";

  roundResultsContainer.style.display = isHidden ? "block" : "none";
  outputContainer.style.display = isHidden ? "none" : "block";
  positionDropdown.style.display = isHidden ? "none" : "block";
  winnersOverview.style.display = isHidden ? "none" : "block";
  document.getElementById("resultsByRoundButton").textContent = isHidden
    ? "Results by position"
    : "Results by Round";
}

function processData(csvData) {
  const lines = csvData.split("\n");
  const headers = lines[0].split(",");
  const positions = headers.map((header) =>
    header.split("presidential")[0].trim()
  );
  let uniquePositions = [...new Set(positions)];

  initializePositionDropdown(uniquePositions);
  processPositions(positions, lines, uniquePositions);
}

function initializePositionDropdown(uniquePositions) {
  const positionDropdown = document.getElementById("positionDropdown");
  positionDropdown.style.display = "block";
  positionDropdown.innerHTML =
    '<option value="">Select position</option>' +
    uniquePositions
      .map(
        (position) => `<option value="${position}">${position}</option>`
      )
      .join("");
}

function processPositions(positions, lines, uniquePositions) {
  let output = "Results by Position";
  let roundResults = {};

  uniquePositions.forEach((position) => {
    if (!isAllowedPosition(position)) return;

    const { positionOutput, positionRoundResults } = createPositionOutput(
      position,
      lines
    );
    output += `<div id="${position}">${positionOutput}</div>`;

    positionRoundResults.forEach((roundResult, roundIndex) => {
      roundResults[roundIndex] = roundResults[roundIndex] || [];
      roundResults[roundIndex].push(
        `<h4>Position: ${position}</h4>${roundResult}`
      );
    });
  });

  document.getElementById("output").innerHTML = output;
  updateWinnersOverview();
  document.getElementById("resultsByRoundButton").style.display = "block";
  displayRoundResults(roundResults);
}

function isAllowedPosition(position) {
  const positionName = [
    "President",
    "Vice President",
    "Director of University Affairs",
    "Director of Internal Policy",
    "Director of Community Relations",
    "Director of Diversity Efforts",
    "Director of Programming",
    "Director of Campus Partnerships",
  ];
  return positionName.some((header) =>
    position.toLowerCase().startsWith(header.toLowerCase())
  );
}

function createPositionOutput(position, lines) {
  let output = `<h2>${position}</h2>`;
  let positionVotes = getPositionVotes(position, lines);
  let round = 1;
  let eliminatedCandidates = new Set();
  let positionRoundResults = [];
  let winnerDeclared = false;

  while (!winnerDeclared) {
    let { voteCounts, totalVotes } = countVotes(
      positionVotes,
      eliminatedCandidates
    );
    if (Object.keys(voteCounts).length === 0) {
      output += `<p>No remaining candidates to process for this position.</p>`;
      break;
    }

    let sortedVotes = sortVotes(voteCounts);
    let { newEliminatedCandidates, eliminatedThisRound, isTie } =
      updateEliminatedCandidates(
        sortedVotes,
        eliminatedCandidates,
        totalVotes
      );

    let roundOutput = generateRoundOutput(
      round,
      sortedVotes,
      totalVotes,
      eliminatedThisRound,
      eliminatedCandidates
    );
    output += roundOutput;
    positionRoundResults.push(roundOutput);

    if (
      isTie ||
      sortedVotes[0][1] > totalVotes / 2 ||
      sortedVotes.length === 1
    ) {
      output += declareWinner(sortedVotes, totalVotes, position);
      winnerDeclared = true;
    } else {
      eliminatedCandidates = newEliminatedCandidates;
      round++;
    }
  }

  return { positionOutput: output, positionRoundResults };
}

function getPositionVotes(position, lines) {
  return lines
    .slice(1)
    .map((line) =>
      line
        .split(",")
        .filter((_, index) =>
          lines[0].split(",")[index].trim().startsWith(position)
        )
        .map((pref) => pref.trim())
        .filter((pref) => pref)
    )
    .filter((vote) => vote.length > 0);
}

function countVotes(positionVotes, eliminatedCandidates) {
  let voteCounts = {};
  let totalVotes = 0;

  positionVotes.forEach((vote) => {
    const firstPref = vote.find(
      (pref) => !eliminatedCandidates.has(pref)
    );
    if (firstPref) {
      voteCounts[firstPref] = (voteCounts[firstPref] || 0) + 1;
      totalVotes++;
    }
  });

  return { voteCounts, totalVotes };
}

function sortVotes(voteCounts) {
  return Object.entries(voteCounts).sort((a, b) => b[1] - a[1]);
}

function generateRoundOutput(
  round,
  sortedVotes,
  totalVotes,
  eliminatedThisRound,
  allEliminatedCandidates
) {
  let output = `<h3>Round ${round}</h3><table>`;
  output += `<tr><th>Candidate</th><th>Votes</th><th>Percentage</th></tr>`;

  sortedVotes.forEach(([candidate, votes]) => {
    const percentage = ((votes / totalVotes) * 100).toFixed(2);
    output += `<tr><td>${candidate}</td><td>${votes}</td><td>${percentage}%</td></tr>`;
  });

  output += `</table>`;
  if (eliminatedThisRound.length > 0) {
    output += `<p>Eliminated this round: ${eliminatedThisRound.join(
      ", "
    )}</p>`;
  }
  if (allEliminatedCandidates.size > 0) {
    output += `<p>Eliminated candidates so far: ${Array.from(
      allEliminatedCandidates
    ).join(", ")}</p>`;
  }

  return output;
}

function declareWinner(sortedVotes, totalVotes, position) {
  const winner = sortedVotes[0][0];
  const maxVotes = sortedVotes[0][1];
  const winnerPercentage = ((maxVotes / totalVotes) * 100).toFixed(2);
  winners[position] = {
    name: winner,
    votes: maxVotes,
    percentage: winnerPercentage,
  };
  return `<h4>Winner: ${winner} with ${maxVotes} votes (${winnerPercentage}% of total votes)</h4>`;
}

function updateEliminatedCandidates(
  sortedVotes,
  eliminatedCandidates,
  totalVotes
) {
  let newEliminatedCandidates = new Set(eliminatedCandidates);
  let minVotes = sortedVotes[sortedVotes.length - 1][1];
  let candidatesForElimination = sortedVotes
    .filter(([_, votes]) => votes === minVotes)
    .map(([candidate]) => candidate);
  let isTie =
    sortedVotes.length === 2 && sortedVotes[0][1] === sortedVotes[1][1];

  if (!isTie) {
    candidatesForElimination.forEach((candidate) =>
      newEliminatedCandidates.add(candidate)
    );
  }

  return {
    newEliminatedCandidates,
    eliminatedThisRound: isTie ? [] : candidatesForElimination,
    isTie,
  };
}

// currently overview only shows positions with winners (doesn't show results for positions with ties)
function updateWinnersOverview() {
  let overviewHtml = "<h3>Overview</h3><table>";
  overviewHtml +=
    "<tr><th>Position</th><th>Winner</th><th>Votes</th><th>Percentage</th></tr>";

  for (const position in winners) {
    overviewHtml += `<tr><td>${position}</td><td>${winners[position].name}</td><td>${winners[position].votes}</td><td>${winners[position].percentage}%</td></tr>`;
  }

  overviewHtml += "</table>";
  document.getElementById("winnersOverview").innerHTML = overviewHtml;
}

function displayRoundResults(roundResults) {
  let roundResultsOutput = "<h1>Results by round</h1>";
  Object.keys(roundResults).forEach((round) => {
    roundResultsOutput +=
      `<h2>Round ${parseInt(round) + 1}</h2>` +
      roundResults[round].join("");
  });
  document.getElementById("roundResultsContainer").innerHTML =
    roundResultsOutput;
}