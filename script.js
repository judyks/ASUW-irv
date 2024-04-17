const globalPositionName = [
  "President",
  "Vice President",
  "Director of University Affairs",
  "Director of Internal Policy",
  "Director of Community Relations",
  "Director of Diversity Efforts",
  "Director of Programming",
  "Director of Campus Partnerships",
];


let globalCsvData = null;
let globalCsvDataProto = null;
let winners = {};

document.addEventListener("DOMContentLoaded", initialize);

function initialize() {
  const fileInput = document.getElementById("fileInput");
  const processButton = document.getElementById("processButton");
  const dropZone = document.getElementById("dropZone");
  const fileNameElement = document.getElementById("fileName");
  const positionDropdown = document.getElementById("positionDropdown");
  const roundDropdown = document.getElementById("roundDropdown");
  const resultsByRoundOrPositionButton = document.getElementById("resultsByRoundOrPositionButton");
  const toggleBallotMeasureButton = document.getElementById("toggleBallotMeasureButton");
  const toggleOverviewButton = document.getElementById("toggleOverviewButton");
  const voterStatsButton = document.getElementById("voterStatsButton");


  fileInput.addEventListener("change", (event) => handleFileSelect(event, fileNameElement, processButton));
  setupDropZoneEvents(dropZone, fileInput, fileNameElement);
  processButton.addEventListener("click", onProcessButtonClick);
  positionDropdown.addEventListener("change", (event) => scrollToSegment(event));
  roundDropdown.addEventListener("change", (event) => scrollToSegment(event));
  resultsByRoundOrPositionButton.addEventListener("click", toggleResultsByRoundOrPosition);
  toggleBallotMeasureButton.addEventListener("click", toggleBallotMeasure);
  toggleOverviewButton.addEventListener("click", toggleOverview);
  voterStatsButton.addEventListener("click", showVoterStats);
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
  processButton.disabled = false;

  const reader = new FileReader();
  reader.onload = async (event) => {
    globalCsvData = event.target.result;
    globalCsvDataProto = await Papa.parse(globalCsvData, { header: true });

    const positions = [...new Set(extractPositionsFromHeaders(globalCsvDataProto.meta.fields))]
                        .filter(isAllowedPosition);
    let positionsInfo = positions.length 
                        ? `<div class="center-text"><b>Positions:</b><br><div class="left-aligned-list">${positions.map(position => `&bull; ${position}`).join('<br>')}<br></div></div>` 
                        : `<div class='warning center-text'>Warning: No position found in csv, please check your input.</div>`;

    const headers = globalCsvDataProto.meta.fields.filter(field => positions.some((position) => field.trim().startsWith(position)));
    const candidates = [...new Set(globalCsvDataProto.data.flatMap((data) => {
      let candidates = [];
      for (let header of headers) {
        candidates.push(data[header]?.trim());
      }
      return candidates;
    }))].filter((candidate) => candidate).sort();

    let candidatesInfo = "<b>Candidates:</b>";
    if (candidates.length) {
      candidatesInfo += "<table id='candidatesTable'><tr><th>Select</th><th>Candidate</th></tr>";
      candidates.forEach((candidate, index) => {
        candidatesInfo += `<tr><td><input type="checkbox" id="candidate-${index}" name="candidate-${index}"></td><td>${candidate}</td></tr>`;
      });
      candidatesInfo += "</table>";
    } else {
      candidatesInfo += `<div class='warning'>Warning: No candidate found in csv, please check your input.</div>`;
    }

    document.getElementById('pre-check').innerHTML = [positionsInfo, candidatesInfo].join('<br>');

    // Insert the merge button before the process button
    processButton.parentNode.insertBefore(document.createElement("button"), processButton).outerHTML = "<button id='mergeButton'>Merge Selected</button>";
    document.getElementById("mergeButton").addEventListener("click", mergeCandidates);
  };

  reader.readAsText(file);
  fileNameElement.innerHTML = file ? `<b>${file.name}</b>` : "<b>No file selected</b>";
}



function mergeCandidates() {
  const table = document.getElementById('candidatesTable');
  const rows = Array.from(table.getElementsByTagName('tr'));
  let selectedCandidates = [];

  rows.forEach((row, index) => {
    if (index > 0) { // Skipping header row
      const checkbox = row.getElementsByTagName('input')[0];
      if (checkbox && checkbox.checked) {
        selectedCandidates.push(row.getElementsByTagName('td')[1].textContent);
        row.remove(); // Remove selected rows
      }
    }
  });

  // Add a new row with merged candidates
  if (selectedCandidates.length > 0) {
    const newRow = table.insertRow();
    const newCell = newRow.insertCell();
    newCell.colSpan = 2;
    newCell.innerHTML = selectedCandidates.join(', ');
  }
}


function isAllowedPosition(position) {
  return globalPositionName.some((header) =>
    position.toLowerCase().startsWith(header.toLowerCase())
  );
}

function onProcessButtonClick() {
  if (!globalCsvDataProto) return;

  const positions = [...new Set(extractPositionsFromHeaders(globalCsvDataProto.meta.fields))].filter(isAllowedPosition);

  processEntry(positions, globalCsvDataProto);

  document.getElementById("uploadFileSection").style.display = "none";
  
  document.getElementById("toggleBallotMeasureButton").style.display = "block";
  document.getElementById("toggleOverviewButton").style.display = "block";

  document.getElementById("resultsByRoundOrPositionButton").style.display = "block";
  document.getElementById("voterStatsButton").style.display = "block";

  document.getElementById("positionResultsContainer").style.display = "block";
  document.getElementById("roundResultsContainer").style.display = "none";
}

function scrollToSegment(event) {
  const dropdown = event?.target;
  if (dropdown?.value) { location.hash = `#${dropdown.value}`; }
}

function toggleOverview() {
  const overviewSection = document.getElementById("winnersOverview");
  overviewSection.style.display =
    overviewSection.style.display == "none" ||
      overviewSection.style.display == "" ? "block" : "none";
  document.getElementById("toggleOverviewButton").textContent =
    overviewSection.style.display == "block" ? "Hide Overview" : "Show Overview";
}

function toggleBallotMeasure() {
  const ballotMeasureSection = document.getElementById("ballotMeasureSection");
  
  // Toggle display of the ballot measure section
  ballotMeasureSection.style.display = ballotMeasureSection.style.display === "none" ? "block" : "none";
  document.getElementById("toggleBallotMeasureButton").textContent = ballotMeasureSection.style.display === "block" ? "Hide Ballot Measure" : "Show Ballot Measure";
  
  // Ensure content is generated and chart is rendered only when the section is visible
  if (ballotMeasureSection.style.display === "block" && globalCsvDataProto) {
    ballotMeasureSection.innerHTML = `
      <div class="ballot-measure-container">
          <div class="ballot-measure-text">
          <h1>Ballot Measure</h1>
          <p>Information regarding the Ballot Measure can be found at: <a href="http://vote.asuw.org/initiatives/">vote.asuw.org/initiatives/</a></p>
          <h4>Do you approve the 2024 ASUW Proposal Constitution written by the ASUW Constitutional Reform Task Force and presented on <a href="https://vote.asuw.org/initiatives/">vote.asuw.org/initiatives/</a> ?</h4>
        </div>
        <div class="ballot-measure-chart" style="width:300px; height:300px;">
          <canvas id="ballotMeasureChart"></canvas>
          <h3 id="ballotMeasureResult"></h3>
        </div>
      </div>
    `;

    const ballotHeader = globalCsvDataProto.meta.fields.find(field => field.startsWith("Do you approve the 2024 ASUW Proposal Constitution"));
    if (ballotHeader) {
      const yesVotes = globalCsvDataProto.data.filter(row => row[ballotHeader]?.trim().toLowerCase() === 'yes').length;
      const noVotes = globalCsvDataProto.data.filter(row => row[ballotHeader]?.trim().toLowerCase() === 'no').length;

      document.getElementById("ballotMeasureResult").textContent = yesVotes > noVotes ? "Ballot Measure Passed" : "Ballot Measure Failed";

      const ctx = document.getElementById("ballotMeasureChart").getContext('2d');
      const ballotChart = new Chart(ctx, {
        type: 'pie',
        data: {
          labels: ['Yes', 'No'],
          datasets: [{
            data: [yesVotes, noVotes],
            backgroundColor: ['rgba(54, 162, 235, 0.5)', 'rgba(255, 99, 132, 0.5)'],
            borderColor: ['rgba(54, 162, 235, 1)', 'rgba(255, 99, 132, 1)'],
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
        }
      });
    } else {
      console.error('Ballot measure question not found in the data');
    }
  }
}

function toggleResultsByRoundOrPosition() {
  const roundResultsContainer = document.getElementById("roundResultsContainer");
  const positionResultsContainer = document.getElementById("positionResultsContainer");
  const displayStatus = roundResultsContainer.style.display == "none";
  roundResultsContainer.style.display = displayStatus ? "block" : "none";
  positionResultsContainer.style.display = displayStatus ? "none" : "block";
  document.getElementById("resultsByRoundOrPositionButton").textContent = displayStatus ? "Results by Position" : "Results by Round";
  document.getElementById("positionDropdown").style.display = displayStatus ? "none" : "block";
  document.getElementById("roundDropdown").style.display = displayStatus ? "block" : "none";

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


function extractPositionsFromHeaders(headers) {
  var results = headers.map((header) => {
    // Use a regular expression to match either "presidential" or "choice" from headers.
    const regex = /(presidential|choice|Link)/;
    const match = header.split(regex);
    return match && match[0].trim(); // Trim the part before the match.
  });
  return results;
}


function processEntry(positions, csvDataProto) {
  updateGlobalCsvDataProtoForMergedCandidates();

  let htmlByRound = {};
  let htmlOfPositions = "<h1>Results by Position</h1>";
  for (const position of positions) {
    const htmlForPositionByRoundList = generateHtmlForPositionByRound(position, csvDataProto);
    htmlOfPositions += `<h2>${position}</h2>`
      + `<div id="${position}">${htmlForPositionByRoundList.join("")}`
      + `<div class="position-separator"></div></div>`;
    htmlForPositionByRoundList.forEach((roundResult, roundIndex) => {
      htmlByRound[roundIndex] = htmlByRound[roundIndex] || [];
      htmlByRound[roundIndex].push(`${roundResult}`);
    });
  }
  let htmlOfRounds = "<h1>Results by Round</h1>";
  for (const round in htmlByRound) {
    htmlOfRounds += `<h2 id="round-${parseInt(round) + 1}">ROUND ${parseInt(round) + 1}</h2>`
      + htmlByRound[round].join("") + `<div class="position-separator"></div>`;
  }
  let winnersOverviewHtml = "<h2>Overview</h2><table>";
  winnersOverviewHtml += "<tr><th>Position</th><th>Winner</th><th>Votes</th><th>Percentage</th></tr>";
  for (const position in winners) {
    if (winners[position].tie) {
      winnersOverviewHtml += `<tr><td>${position} (Tie)</td><td colspan="3">${winners[position].tie.join(", ")}</td></tr>`;
    } else {
      winnersOverviewHtml += `<tr><td>${position}</td><td>${winners[position].name}</td><td>${winners[position].votes}</td><td>${winners[position].percentage}%</td></tr>`;
    }
  }
  winnersOverviewHtml += "</table>";
  document.getElementById("positionResultsContainer").innerHTML = htmlOfPositions.replaceAll("canvas-chart-", "canvas-chart-by-position-");
  document.getElementById("roundResultsContainer").innerHTML = htmlOfRounds.replaceAll("canvas-chart-", "canvas-chart-by-round-");
  document.getElementById("winnersOverview").innerHTML = winnersOverviewHtml;

  document.getElementById("positionDropdown").style.display = "block";
  document.getElementById("positionDropdown").innerHTML = '<option value="">Select position</option>' +
    positions.map((position) => `<option value="${position}">${position}</option>`).join("");

  document.getElementById("roundDropdown").style.display = "none";
  document.getElementById("roundDropdown").innerHTML = '<option value="">Select round</option>' +
    Object.keys(htmlByRound).map((round) => `<option value="round-${parseInt(round) + 1}">ROUND ${parseInt(round) + 1}</option>`).join("");

  setTimeout(() => renderAllCharts(), 10);
}


function updateGlobalCsvDataProtoForMergedCandidates() {
  const mergedCandidatesRow = document.querySelector('#candidatesTable tr:last-child');
  if (!mergedCandidatesRow) return;

  const mergedCandidates = mergedCandidatesRow.cells[0].textContent.split(', ').map(c => c.trim());
  if (mergedCandidates.length <= 1) return; // No merge has been done

  // Create the new merged candidate name
  const mergedCandidateName = mergedCandidates.join(', ');

  // Iterate over each vote entry to update the merged candidates
  globalCsvDataProto.data = globalCsvDataProto.data.map(row => {
    Object.keys(row).forEach(key => {
      if (mergedCandidates.includes(row[key])) {
        row[key] = mergedCandidateName; // Replace individual candidate with merged candidate name
      }
    });
    return row;
  });
}

function generateHtmlForPositionByRound(position, csvDataProto) {
  let positionVotes = getPositionVotes(position, csvDataProto);
  let round = 1;
  let eliminatedCandidates = new Set();
  let htmlForPositionByRoundList = [];
  let winnerDeclared = false;

  while (!winnerDeclared) {
    let { voteCounts, totalVotes } = countVotes(positionVotes, eliminatedCandidates);
    if (Object.keys(voteCounts).length == 0) {
      htmlForPositionByRoundList.push(`<p>No remaining candidates to process for this position.</p>`);
      winners[position] = { tie: [""], };
      break;
    }

    let sortedVotes = sortVotes(voteCounts);
    let { newEliminatedCandidates, eliminatedThisRound, isTie } = updateEliminatedCandidates(sortedVotes, eliminatedCandidates,);

    let htmlOfPostionRound = generatePositionRoundUnit(
      position,
      round,
      sortedVotes,
      totalVotes,
      eliminatedThisRound,
      eliminatedCandidates
    );
    if (isTie || sortedVotes[0][1] > totalVotes / 2 || sortedVotes.length == 1) {
      htmlOfPostionRound += declareWinner(sortedVotes, totalVotes, position);
      winnerDeclared = true;
    } else {
      eliminatedCandidates = newEliminatedCandidates;
      round++;
    }
    htmlForPositionByRoundList.push(htmlOfPostionRound);
  }
  return htmlForPositionByRoundList;
}

function getPositionVotes(position, csvDataProto) {
  return csvDataProto.data.map(line =>
    csvDataProto.meta.fields
      .filter(field => field.trim().startsWith(position))
      .map(field => line[field]?.trim() || '')
      .filter((pref) => pref))
    .filter((vote) => vote.length > 0);
}

function countVotes(positionVotes, eliminatedCandidates) {
  let voteCounts = {};
  let totalVotes = 0;

  positionVotes.forEach((vote) => {
    const firstPref = vote.find((pref) => !eliminatedCandidates.has(pref));
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

function generatePositionRoundUnit(position, round, sortedVotes, totalVotes, eliminatedThisRound, allEliminatedCandidates) {
  const positionId = position.replace(/[^a-zA-Z0-9]/g, "");
  let canvasId = `canvas-chart-position-${positionId}-round-${round}`;

  let outputHtml = `<div class="chart-table-container">`;
  // Including the position name in the table-text-container
  outputHtml += `<div class="table-text-container">`;
  outputHtml += `<h3>${position} (Round ${round})</h3>`; // Display the position name
  outputHtml += `<table>`;
  outputHtml += `<tr><th>Candidate</th><th>Votes</th><th>Percentage</th></tr>`;

  sortedVotes.forEach(([candidate, votes]) => {
    const percentage = ((votes / totalVotes) * 100).toFixed(2);
    outputHtml += `<tr><td>${candidate}</td><td>${votes}</td><td>${percentage}%</td></tr>`;
  });

  outputHtml += `</table>`;

  if (eliminatedThisRound.length > 0) {
    outputHtml += `<p><b>Eliminated this round:</b> ${eliminatedThisRound.join(", ")}</p>`;
  }
  if (allEliminatedCandidates.size > 0) {
    outputHtml += `<p><b>Eliminated candidates so far:</b> ${Array.from(allEliminatedCandidates).join(", ")}</p>`;
  }

  outputHtml += `</div>`; // Close table-text-container div

  // Chart container remains the same
  outputHtml += `<div class="chart-container"><canvas id="${canvasId}" width="400" height="400" position="${positionId}" round="${round}" sortedVotes="${btoa(JSON.stringify(sortedVotes))}"></canvas></div>`;

  outputHtml += `</div>`; // Close chart-table-container div

  return outputHtml;
}

function renderAllCharts() {
  const canvasElements = document.querySelectorAll('canvas[id^="canvas-"]');
  canvasElements.forEach(canvas => {
    const sortedVotesEncoded = canvas.getAttribute('sortedvotes');
    const sortedVotes = JSON.parse(atob(sortedVotesEncoded));
    renderChart(canvas.id, sortedVotes);
  });
}

function renderChart(canvasId, sortedVotes) {
  let canvas = document.getElementById(canvasId);
  const ctx = canvas.getContext("2d");
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
  let chart = new Chart(ctx, {
    type: "bar",
    data: data,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true
        }
      }
    },
  });
}

function declareWinner(sortedVotes, totalVotes, position) {
  const maxVotes = sortedVotes[0][1];
  const winner = sortedVotes[0][0];
  const winnersList = [];

  sortedVotes.forEach(([candidate, votes]) => { if (votes == maxVotes) { winnersList.push(candidate); } });

  if (winnersList.length > 1) {
    winners[position] = { tie: winnersList, };
    return `<h4>There is a tie. Ties are resolved using a process that is determined by the Elections Administration Committee.</h4>`;
  } else {
    const winnerPercentage = ((maxVotes / totalVotes) * 100).toFixed(2);
    winners[position] = {
      name: winner,
      votes: maxVotes,
      percentage: winnerPercentage,
    };
    return `<h4>Winner: ${winner} with ${maxVotes} votes (${winnerPercentage}% of total votes)</h4>`;
  }
}
function updateEliminatedCandidates(sortedVotes, eliminatedCandidates,) {
  let newEliminatedCandidates = new Set(eliminatedCandidates);
  let minVotes = sortedVotes[sortedVotes.length - 1][1];
  let candidatesForElimination = sortedVotes
    .filter(([_, votes]) => votes == minVotes)
    .map(([candidate]) => candidate);
  let isTie = sortedVotes.length >= 2 && sortedVotes.every((sortedVote) => sortedVote[1] == sortedVotes[0][1]);

  if (!isTie) {
    candidatesForElimination.forEach((candidate) => newEliminatedCandidates.add(candidate));
  }

  return {
    newEliminatedCandidates,
    eliminatedThisRound: isTie ? [] : candidatesForElimination,
    isTie,
  };
}

function generateLivingCommunityChart() {
  const livingCommunityVotes = {};
  globalCsvDataProto.data.forEach(row => {
    const community = row['Please select your living community:'].trim();
    livingCommunityVotes[community] = (livingCommunityVotes[community] || 0) + 1;
  });

  const ctx = document.getElementById('livingCommunityChart').getContext('2d');
  new Chart(ctx, {
    type: 'pie',
    data: {
      labels: Object.keys(livingCommunityVotes),
      datasets: [{
        data: Object.values(livingCommunityVotes),
        backgroundColor: generateColorArray(Object.keys(livingCommunityVotes).length),
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      title: {
        display: true,
        text: 'Living Community Votes'
      }
    }
  });
}

function generateClassStandingChart() {
  const classStandingVotes = {};
  globalCsvDataProto.data.forEach(row => {
    const standing = row['Please list your class standing:'].trim();
    classStandingVotes[standing] = (classStandingVotes[standing] || 0) + 1;
  });

  const ctx = document.getElementById('classStandingChart').getContext('2d');
  new Chart(ctx, {
    type: 'pie',
    data: {
      labels: Object.keys(classStandingVotes),
      datasets: [{
        data: Object.values(classStandingVotes),
        backgroundColor: generateColorArray(Object.keys(classStandingVotes).length),
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      title: {
        display: true,
        text: 'Class Standing Votes'
      }
    }
  });
}

function generateColorArray(numColors) {
  const colors = [];
  for (let i = 0; i < numColors; i++) {
    colors.push(`hsl(${(i / numColors) * 360}, 70%, 70%)`);
  }
  return colors;
}

function showVoterStats() {
  document.getElementById("uploadFileSection").style.display = "none";
  document.getElementById("positionResultsContainer").style.display = "none";
  document.getElementById("roundResultsContainer").style.display = "none";
  document.getElementById("winnersOverview").style.display = "none";

  const voterStatsSection = document.getElementById("voterStatsSection");
  voterStatsSection.style.display = "block";

  voterStatsSection.innerHTML = `
    <div class="voter-stats-container">
      <div>
        <h2>Living Community Votes</h2>
        <div style="width:300px; height:300px;">
        <canvas id="livingCommunityChart"></canvas>
        </div>
      </div>
      <div>
        <h2>Class Standing Votes</h2>
        <div style="width:300px; height:300px;">
          <canvas id="classStandingChart"></canvas>
        </div>
      </div>
    </div>
  `;

  generateLivingCommunityChart();
  generateClassStandingChart();
}

