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
      { Voter: 'B', CandidateA: 3, CandidateB: 2, CandidateC: 1 },
      { Voter: 'C', CandidateA: 1, CandidateB: 3, CandidateC: 2 },
      { Voter: 'D', CandidateA: 3, CandidateB: 1, CandidateC: 2 },
    ];
    expect(parseCSV(inputData)).toEqual(expectedOutput);
  });

  // more voters
  test('sample2', () => {
    const inputData = readFileSync('sample2.csv');
    const expectedOutput = [
        { Voter: 'A', CandidateA: 1, CandidateB: 2, CandidateC: 3 },
        { Voter: 'B', CandidateA: 3, CandidateB: 2, CandidateC: 1 },
        { Voter: 'C', CandidateA: 1, CandidateB: 3, CandidateC: 2 },
        { Voter: 'D', CandidateA: 3, CandidateB: 1, CandidateC: 2 },
        { Voter: 'E', CandidateA: 1, CandidateB: 2, CandidateC: 3 },
        { Voter: 'F', CandidateA: 3, CandidateB: 2, CandidateC: 1 },
        { Voter: 'G', CandidateA: 1, CandidateB: 3, CandidateC: 2 },
        { Voter: 'H', CandidateA: 3, CandidateB: 1, CandidateC: 2 },
    ];
    expect(parseCSV(inputData)).toEqual(expectedOutput);
  });

  // more candidates
  test('sample3', () => {
    const inputData = readFileSync('sample3.csv');
    const expectedOutput = [
        { Voter: 'A', CandidateA: 1, CandidateB: 2, CandidateC: 3, CandidateD: 4, CandidateF: 5 },
        { Voter: 'B', CandidateA: 3, CandidateB: 2, CandidateC: 1, CandidateD: 4, CandidateF: 5 },
        { Voter: 'C', CandidateA: 1, CandidateB: 3, CandidateC: 2, CandidateD: 4, CandidateF: 5 },
        { Voter: 'D', CandidateA: 3, CandidateB: 1, CandidateC: 2, CandidateD: 4, CandidateF: 5 },
        { Voter: 'E', CandidateA: 1, CandidateB: 2, CandidateC: 3, CandidateD: 4, CandidateF: 5 },
        { Voter: 'F', CandidateA: 3, CandidateB: 2, CandidateC: 1, CandidateD: 4, CandidateF: 5 },
        { Voter: 'G', CandidateA: 1, CandidateB: 3, CandidateC: 2, CandidateD: 4, CandidateF: 5 },
        { Voter: 'H', CandidateA: 3, CandidateB: 1, CandidateC: 2, CandidateD: 4, CandidateF: 5 },
    ];
    expect(parseCSV(inputData)).toEqual(expectedOutput);
  });


  // inputs with comma
  test('sample4', () => {
    const inputData = readFileSync('sample4.csv');
    const expectedOutput = [
        { Voter: 'A', CandidateA: 1, CandidateB: 2, CandidateC: 3 },
        { Voter: 'B', CandidateA: 3, CandidateB: 2, CandidateC: 1 },
        { Voter: 'C', CandidateA: 1, CandidateB: 3, CandidateC: 2 },
        { Voter: 'D', CandidateA: 3, CandidateB: 1, CandidateC: 2 },
        { Voter: 'E', CandidateA: 1, CandidateB: 2, CandidateC: 3 },
        { Voter: 'F', CandidateA: 3, CandidateB: 2, CandidateC: 1 },
        { Voter: 'G', CandidateA: 1, CandidateB: 3, CandidateC: 2 },
        { Voter: 'H', CandidateA: 3, CandidateB: 1, CandidateC: 2 },
    ];
    expect(parseCSV(inputData)).toEqual(expectedOutput);
  });




});
