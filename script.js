let globalCsvData = null;
let winners = {};

document.addEventListener("DOMContentLoaded", function () {
  const fileInput = document.getElementById("fileInput");
  const processButton = document.getElementById("processButton");
  const positionDropdown = document.getElementById("positionDropdown");

  fileInput.addEventListener("change", handleFileSelect);
  processButton.addEventListener("click", () => {
    if (globalCsvData) {
      processData(globalCsvData);
    }
  });
  positionDropdown.addEventListener("change", () => {
    if (positionDropdown.value) {
      location.hash = `#${positionDropdown.value}`;
    }
  });
});

function handleFileSelect(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();

  reader.onload = function (e) {
    globalCsvData = e.target.result;
    document.getElementById("processButton").disabled = false;
  };

  reader.readAsText(file);
}

function processData(csvData) {
  const lines = csvData.split("\n");
  const headers = lines[0].split(",");
  const positions = headers.map((header) =>
    header.split("presidential")[0].trim()
  );
  let output = "";
  let uniquePositions = [...new Set(positions)];

  document.getElementById("positionDropdown").style.display = "block";
  document.getElementById("positionDropdown").innerHTML =
    '<option value="">Select position</option>' +
    uniquePositions
      .map(
        (position) => `<option value="${position}">${position}</option>`
      )
      .join("");

  uniquePositions.forEach((position) => {
    const allowedPosition = isAllowedPosition(position);
    if (!allowedPosition) return;

    output += `<div id="${position}">${createPositionOutput(
      position,
      lines
    )}</div>`;
  });

  document.getElementById("output").innerHTML = output;
  updateWinnersOverview();
}

function isAllowedPosition(position) {
  const allowedHeaders = [
    "President",
    "Vice President",
    "Director of University Affairs",
    "Director of Internal Policy",
    "Director of Community Relations",
    "Director of Diversity Efforts",
    "Director of Programming",
    "Director of Campus Partnerships",
  ];
  return (
    allowedHeaders.find((header) =>
      position.toLowerCase().startsWith(header.toLowerCase())
    ) || null
  );
}

function createPositionOutput(position, lines) {
  let output = `<h2>${position}</h2>`;
  let positionVotes = getPositionVotes(position, lines);
  let round = 1;
  let eliminatedCandidates = new Set();

  while (true) {
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

    output += generateRoundOutput(
      round,
      sortedVotes,
      totalVotes,
      eliminatedThisRound,
      eliminatedCandidates
    );

    if (isTie) {
      output += `<h4>There is a tie. Ties are resolved using a process that is determined by the ASUW Elections Administration Committee.</h4>`;
      break;
    }

    if (sortedVotes[0][1] > totalVotes / 2 || sortedVotes.length === 1) {
      output += declareWinner(sortedVotes, totalVotes, position);
      break;
    } else {
      eliminatedCandidates = newEliminatedCandidates;
      round++;
    }
  }

  return output;
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

  if (eliminatedThisRound && eliminatedThisRound.length > 0) {
    output += `<p>Eliminated this round: ${eliminatedThisRound.join(
      ", "
    )}</p>`;
  }

  if (allEliminatedCandidates && allEliminatedCandidates.size > 0) {
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