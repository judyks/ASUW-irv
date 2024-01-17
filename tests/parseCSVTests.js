// 8-10 test inputs 
// To test: 
// Create sample input and parse it back into csv should be the same as output generated 

import { parseCSV } from './index.html';
//import * as fs from 'fs';

describe('CSV Parser Tests', () => {

//   const readFileSync = (filename: string): string => {
//     return fs.readFileSync(filename, 'utf-8');
//   };

  test('sample1', () => {
    const inputData = readFileSync('sample1.csv');
    const expectedOutput = [
      { Voter: 'A', CandidateA: 1, CandidateB: 2, CandidateC: 3 },
      { Voter: 'B', CandidateB: 3, CandidateA: 2, CandidateC: 1 },
      { Voter: 'C', CandidateC: 1, CandidateB: 3, CandidateA: 2 },
      { Voter: 'D', CandidateC: 3, CandidateA: 1, CandidateB: 2 },
    ];
    expect(parseCSV(inputData)).toEqual(expectedOutput);
  });

  // more voters
  test('sample2', () => {
    const inputData = readFileSync('sample2.csv');
    const expectedOutput = [
        { Voter: 'A', CandidateA: 1, CandidateB: 2, CandidateC: 3 },
        { Voter: 'B', CandidateB: 3, CandidateA: 2, CandidateC: 1 },
        { Voter: 'C', CandidateC: 1, CandidateB: 3, CandidateA: 2 },
        { Voter: 'D', CandidateC: 3, CandidateA: 1, CandidateB: 2 },
        { Voter: 'E', CandidateA: 1, CandidateB: 2, CandidateC: 3 },
        { Voter: 'F', CandidateB: 3, CandidateA: 2, CandidateC: 1 },
        { Voter: 'G', CandidateC: 1, CandidateB: 3, CandidateA: 2 },
        { Voter: 'H', CandidateC: 3, CandidateA: 1, CandidateB: 2 },
    ];
    expect(parseCSV(inputData)).toEqual(expectedOutput);
  });

  // more candidates

  // input with comma

  

});
