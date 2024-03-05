let globalCsvData = null;
let winners = {};

document.addEventListener("DOMContentLoaded", initialize);

function initialize() {
  const fileInput = document.getElementById("fileInput");
  const processButton = document.getElementById("processButton");
  const dropZone = document.getElementById("dropZone");
  const fileNameElement = document.getElementById("fileName");
  const positionDropdown = document.getElementById("positionDropdown");
  const resultsByRoundButton = document.getElementById(
    "resultsByRoundButton"
  );
  const toggleOverviewButton = document.getElementById(
    "toggleOverviewButton"
  );

  addEventListeners(
    fileInput,
    processButton,
    dropZone,
    fileNameElement,
    positionDropdown,
    resultsByRoundButton,
    toggleOverviewButton
  );
}

function addEventListeners(
  fileInput,
  processButton,
  dropZone,
  fileNameElement,
  positionDropdown,
  resultsByRoundButton,
  toggleOverviewButton
) {
  fileInput.addEventListener("change", (event) =>
    handleFileSelect(event, fileNameElement, processButton)
  );
  processButton.addEventListener("click", processButtonClick);
  positionDropdown.addEventListener("change", updateLocationHash);
  resultsByRoundButton.addEventListener("click", toggleResultsDisplay);
  toggleOverviewButton.addEventListener("click", toggleOverview);

  setupDropZoneEvents(dropZone, fileInput, fileNameElement);
}

function handleFileSelect(event, fileNameElement, processButton) {
  const file = event.target.files[0];
  if (!file) return;

  if (file.type !== "text/csv" && !file.name.endsWith(".csv")) {
    alert("Error: The file must be a CSV.");
    processButton.disabled = true;
    fileNameElement.innerHTML = "<b>Please select a CSV file</b>";
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    globalCsvData = e.target.result;
    processButton.disabled = false;
  };
  reader.readAsText(file);

  fileNameElement.innerHTML = file
    ? `<b>${file.name}</b>`
    : "<b>No file selected</b>";
}

function processButtonClick() {
  if (globalCsvData) {
    processData(globalCsvData);
    document.getElementById("uploadFileContainer").style.display = "none";
    document.getElementById("toggleOverviewButton").style.display =
      "block";
    document.getElementById("voterStatsButton").style.display = "block";
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
  const isHidden = roundResultsContainer.style.display === "none";

  roundResultsContainer.style.display = isHidden ? "block" : "none";
  outputContainer.style.display = isHidden ? "none" : "block";
  document.getElementById("resultsByRoundButton").textContent = isHidden
    ? "Results by Position"
    : "Results by Round";
}

function toggleOverview() {
  const overviewSection = document.getElementById("winnersOverview");
  overviewSection.style.display =
    overviewSection.style.display === "none" ||
    overviewSection.style.display === ""
      ? "block"
      : "none";
  document.getElementById("toggleOverviewButton").textContent =
    overviewSection.style.display === "block"
      ? "Hide Overview"
      : "Show Overview";
}

function setupDropZoneEvents(dropZone, fileInput, fileNameElement) {
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
      handleFileSelect(
        { target: { files } },
        fileNameElement,
        document.getElementById("processButton")
      );
    }
  });
}

function processData(csvData) {
  const lines = csvData.split("\n");
  const headers = lines[0].split(",");
  const positions = extractPositionsFromHeaders(headers);
  let uniquePositions = [...new Set(positions)];

  initializePositionDropdown(uniquePositions);
  processPositions(positions, lines, uniquePositions);
}

function extractPositionsFromHeaders(headers) {
  return headers.map((header) => {
    // Use a regular expression to match either "presidential" or "choice" from headers
    const regex = /(presidential|choice)/;
    const match = header.split(regex);
    return match && match[0].trim(); // Trim the part before the match
  });
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
  // let output = "Results by Position";
  let output = "<h1>Results by Pound</h1>";
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
      position,
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
  output += `<div class="position-separator"></div>`;
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
  position,
  round,
  sortedVotes,
  totalVotes,
  eliminatedThisRound,
  allEliminatedCandidates
) {
  // Using a sanitized version of the position name to create a valid ID
  const positionId = position.replace(/[^a-zA-Z0-9]/g, "");
  let output = `<h3>Round ${round} (${position})</h3><div><canvas id="chart${positionId}Round${round}" width="400" height="400"></canvas></div><table>`;
  output += `<tr><th>Candidate</th><th>Votes</th><th>Percentage</th></tr>`;

  sortedVotes.forEach(([candidate, votes]) => {
    const percentage = ((votes / totalVotes) * 100).toFixed(2);
    output += `<tr><td>${candidate}</td><td>${votes}</td><td>${percentage}%</td></tr>`;
  });

  output += `</table>`;

  if (eliminatedThisRound.length > 0) {
    output += `<p><b>Eliminated this round:</b>  ${eliminatedThisRound.join(
      ", "
    )}</p>`;
  }
  if (allEliminatedCandidates.size > 0) {
    output += `<p><b>Eliminated candidates so far:</b> ${Array.from(
      allEliminatedCandidates
    ).join(", ")}</p>`;
  }

  setTimeout(
    () =>
      renderChart(
        `chart${positionId}Round${round}`,
        sortedVotes,
        totalVotes,
        position
      ),
    0
  );

  return output;
}

function renderChart(canvasId, sortedVotes, totalVotes, position) {
  const ctx = document.getElementById(canvasId).getContext("2d");
  ctx.canvas.width = 300;
  ctx.canvas.height = 300;
  const data = {
    labels: sortedVotes.map((vote) => vote[0]),
    datasets: [
      {
        label: "Votes",
        data: sortedVotes.map((vote) => vote[1]),
        backgroundColor: [
          "rgba(255, 99, 132, 0.2)",
          "rgba(54, 162, 235, 0.2)",
          "rgba(255, 206, 86, 0.2)",
          "rgba(75, 192, 192, 0.2)",
          "rgba(153, 102, 255, 0.2)",
          "rgba(255, 159, 64, 0.2)",
        ],
        borderColor: [
          "rgba(255,99,132,1)",
          "rgba(54, 162, 235, 1)",
          "rgba(255, 206, 86, 1)",
          "rgba(75, 192, 192, 1)",
          "rgba(153, 102, 255, 1)",
          "rgba(255, 159, 64, 1)",
        ],
        borderWidth: 1,
      },
    ],
  };
  new Chart(ctx, {
    type: "pie",
    data: data,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        yAxes: [
          {
            ticks: {
              beginAtZero: true,
            },
          },
        ],
      },
    },
  });
}

function declareWinner(sortedVotes, totalVotes, position) {
  // Check if there's a tie between the last two candidates
  if (
    sortedVotes.length === 2 &&
    sortedVotes[0][1] === sortedVotes[1][1]
  ) {
    return `<h4>There is a tie. Ties are resolved using a process that is determined by the Elections Administration Committee.</h4>`;
  } else {
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
  let overviewHtml = "<h2>Overview</h2><table>";
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
      `<h2>ROUND ${parseInt(round) + 1}</h2>` +
      roundResults[round].join("");
  });
  document.getElementById("roundResultsContainer").innerHTML =
    roundResultsOutput;
}