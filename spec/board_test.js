import imm from 'immutable';
import { expect } from 'chai';

import {
  initialState,
  getRegionsByOwner,
  getRegionsBySuper,
  getRegionsByNeighbor,
  placeArmies,
  attack,
  calcDistanceFrom,
  OWNER,
  PHASE,
} from '../Board';

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

describe("Region Fetching", () => {

  it("Gets regions by super region", () => {
    let regions = getRegionsBySuper(testState, 1);

    expect(regions.size).to.equal(2);
    expect(regions.get('1').equals(testState.getIn(['regions', '1']))).to.be.true;
    expect(regions.get('2').equals(testState.getIn(['regions', '2']))).to.be.true;
  });

  it("Gets regions by owner", () => {
    let regions = getRegionsByOwner(testState, 1);

    expect(regions.size).to.equal(1);
    expect(regions.get('4').equals(testState.getIn(['regions', '4']))).to.be.true;
  });

  it("Gets regions by neighbor", () => {
    let regions = getRegionsByNeighbor(testState, '3');

    expect(regions.size).to.equal(3);
    expect(regions.get(0).equals(testState.getIn(['regions', '1']).set('id', 1))).to.be.true;
    expect(regions.get(1).equals(testState.getIn(['regions', '2']).set('id', 2))).to.be.true;
    expect(regions.get(2).equals(testState.getIn(['regions', '4']).set('id', 4))).to.be.true;
  });
});

describe('Search Functions', () => {
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
});

describe('Movement Functions', () => {
  it ('places armies', () => {
    let state = placeArmies(testState, 4, 10).toJS();
    expect(state.regions[4].armies).to.equal(30);
  });

  it ('catches incorrect placement', () => {
    expect(placeArmies(testState, 4, 10)).to.throw;
  });

  it ('can attack', () => {
    let state = attack(testState, 4, 3, 10);
    expect(state.toJS().regions['4'].armies).to.equal(13);
    expect(state.toJS().regions['3'].armies).to.equal(4);
    expect(state.toJS().regions['3'].owner).to.equal(-1);

    state = attack(state, 4, 3, 10);
    expect(state.toJS().regions['4'].armies).to.equal(3);
    expect(state.toJS().regions['3'].armies).to.equal(7);
    expect(state.toJS().regions['3'].owner).to.equal(1);

    // exceeds max amount
    expect(attack.bind(this, testState, 4, 3, 999)).to.throw('Exceeded number of armies in territory');
    expect(attack.bind(this, testState, 4, 1, 1)).to.throw('Regions are not adjacent');
    expect(attack.bind(this, testState, 4, 3, -11)).to.throw('Minimum of one attacker');
  });
});
