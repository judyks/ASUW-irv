

// Extract info from the selected file to process its contents
function handleSelectedFile(evt) {
  let file = evt.target.files[0];
  let fileReader = new FileReader();

  fileReader.onload = function(event) {
      let contents = event.target.result;
      parseCSV(contents);
  };

  fileReader.readAsText(file);
}

// Implementation of CSV parsing
function parseCSV(csv) {
    let rows = csv.split('\n');
  
    if (rows.length < 2) {
      throw new Error('CSV data is empty or incomplete.');
    }
  
    let header = rows[0].split(',');
    let columns = header.map(column => column.trim()+ "");
  
    csvData = [];

    for (let i = 1; i < rows.length; i++) { // start from 1 to skip header names
      const row = rows[i].split(',');
  

      // fill missing columns with empty string 
      // (unanswered or empty optional questions)
      // Would it be better to throw error??
      while (row.length < columns.length) {
      row.push('');
      }
 
      // CHANGE TO SEPARATE CELLS (??)
      const rowData = {};
  
      for (let j = 0; j < columns.length; j++) {
        rowData[columns[j]] = row[j].trim();
      }
  
      csvData.push(rowData);
    }
  
    return csvData;
  }
