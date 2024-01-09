function parseCSV(csv) {
    let rows = csv.split('\n');
  
    if (rows.length < 2) {
      throw new Error('CSV data is empty or incomplete.');
    }
  
    // Headers and columns
    let header = rows[0].split(',');
    let columns = header.map(column => column.trim()+ "");
  
    csvData = [];

    for (let i = 1; i < rows.length; i++) { // start from 1 to skip header
      const row = rows[i].split(',');
  

      // fill missing columns with empty string 
      // (unanswered or empty optional questions)
      // Would it be better to throw error??
      while (row.length < columns.length) {
      row.push('');
      }
  
      // Info in cells
      const rowData = {};
  
      for (let j = 0; j < columns.length; j++) {
        rowData[columns[j]] = row[j].trim();
      }
  
      // Add rowData into the csvData array (each row is one vote)
      csvData.push(rowData);
    }
  
    return csvData;
  }
