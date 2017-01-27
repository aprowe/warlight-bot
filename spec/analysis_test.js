import imm from 'immutable';
import { expect } from 'chai';

import {
  calcDistanceFrom,
  getRegionType,
  REGION_TYPE,
  getSurroundingPower,
  scoreState,
  getShortestPath,
  calcBottleNecks,
} from '../src/Analysis';

import WarlightState, {
  OWNER,
  PHASE,
} from '../src/state';

let testState = new WarlightState(imm.fromJS({
  playerId: '1',
  opponentId: '2',
  activeId: 1,
  superRegions:{
    1: 2,
    2: 3,
  },
  regions: {
    1: {
      neighbors: [2, 3],
      super: 1,
      owner: 2,
      armies: 2,
    },
    2: {
      neighbors: [1, 3],
      super: 1,
      armies: 2,
      owner: OWNER.NEUTRAL,
    },
    3: {
      neighbors: [1,2,4],
      super: 2,
      armies: 10,
      owner: OWNER.NEUTRAL,
    },
    4: {
      neighbors: [3],
      super: 2,
      armies: 20,
      owner: 1,
    }
  },
  armiesToPlace: 3,
  selectableRegions: [1,3,4],
  phase: PHASE.PLACE_ARMIES,
}));

describe('Analysis Functions', () => {
  it ("Gets the region type", () => {
    let type = getRegionType(testState, 4);
    expect(type).to.equal(REGION_TYPE.FRONTIER);
  });

  it ("Gets the surrounding power", () => {
    let power = getSurroundingPower(testState, 1);
    expect(power).to.equal(12);
  });
});

describe('Distance Functions', () => {
  it ("Gets the distance from owners", () => {
    let depths = calcDistanceFrom(testState, 2);

    expect(depths['1']).to.equal(0);
    expect(depths['2']).to.equal(1);
    expect(depths['3']).to.equal(1);
    expect(depths['4']).to.equal(2);

    depths = calcDistanceFrom(testState, 1);

    expect(depths['1']).to.equal(2);
    expect(depths['2']).to.equal(2);
    expect(depths['3']).to.equal(1);
    expect(depths['4']).to.equal(0);
  });

  it ("Gets the distance for a single region", () => {
    let depth = calcDistanceFrom(testState, 2, 4);
    expect(depth).to.equal(2);

    depth = testState.calcDistanceFrom(2, 4);
    expect(depth).to.equal(2);
  });
});

describe('Scoring Functions', () => {
  it ("Score State", () => {
    let score = scoreState(testState);
  });
});

describe('Pathfinding', () => {
  it ('Finds the shortest path', () => {
    let path = getShortestPath(testState, 1, 4);
    expect(path).to.deep.equal([1,3,4])
  });

  it ('Finds the shortest path for another configuration', () => {
    let testState2 = new WarlightState(imm.fromJS({
      regions: {
        1: {
          neighbors: [3],
        },
        3: {
          neighbors: [1,5],
        },
        5: {
          neighbors: [3,7],
        },
        7: {
          neighbors: [5],
        }
      },
    }));
    let path = getShortestPath(testState2, 1, 7);
    expect(path).to.deep.equal([1,3,5,7])
  });

  it ('Works if same region', () => {
    let path = getShortestPath(null, 19, 19);
    expect(path).to.deep.equal([19]);
  });

  it ("Calculates BottleNecks", () => {
    let testState2 = new WarlightState(imm.fromJS({
      regions: {
        0: { neighbors: [1,2,3], },
        1: { neighbors: [0,2,3], },
        2: { neighbors: [1,2,3], },
        3: { neighbors: [0,1,2,8], },
        8: { neighbors: [3,4], },
        4: { neighbors: [8,5,6,7], },
        5: { neighbors: [4], },
        6: { neighbors: [4], },
        7: { neighbors: [4], },
      },
    }));
    let bottles = testState2.calcBottleNecks();

    expect(bottles[3] > bottles[2]).to.be.true;
    expect(bottles[3] > bottles[1]).to.be.true;
    expect(bottles[3] > bottles[0]).to.be.true;

    expect(bottles[4] > bottles[5]).to.be.true;
    expect(bottles[4] > bottles[6]).to.be.true;
    expect(bottles[4] > bottles[7]).to.be.true;
  });
});
