import imm from 'immutable';
import { expect } from 'chai';

import {
  initialState,
  getRegionsByOwner,
  getRegionsBySuper,
  getRegionsByNeighbor,
  placeArmies,
  attack,
  OWNER,
  PHASE,
} from '../Board';

import {
  calcDistanceFrom,
  getRegionType,
  REGION_TYPE,
  getSurroundingPower,
  scoreState,
} from '../Analysis';

let testState = imm.fromJS({
  playerId: 1,
  opponentId: 2,
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
});

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

describe('Scoring Functions', () => {
  it ("Score State", () => {
    let score = scoreState(testState);
    console.log(score);
  });
});
