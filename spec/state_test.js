import WarlightState, {
  OWNER,
  PHASE,
} from '../state';

import imm from 'immutable';

import { expect } from 'chai';

let testState = imm.fromJS({
  playerId: 1,
  opponentId: 2,
  activeId: 1,
  superRegions:{
    1: 2,
    2: 9,
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

describe('Warlight State', () => {
  it ('Gets regions', () => {
    let state = new WarlightState(testState);

    expect(state.getRegion(1)).to.equal(testState.getIn(['regions', '1']));
    expect(state.getRegion(2)).to.equal(testState.getIn(['regions', '2']));
  });

  it ('Gets owner', () => {
    let state = new WarlightState(testState);

    expect(state.getOwner(1)).to.equal(testState.getIn(['regions', '1', 'owner']));
  });

  it ('Gets Neighbors', () => {
    let state = new WarlightState(testState);

    let list = imm.List.of(
      testState.getIn(['regions', '2']),
      testState.getIn(['regions', '3'])
    );

    expect(state.getNeighbors(1)).to.deep.equal(list);
  });

  it('can determine if regions are adjacent', () => {
    let state = new WarlightState(testState);
    expect(state.isAdjacent(1, 2)).to.be.true;
    expect(state.isAdjacent(1, 4)).to.be.false;
  });
});

describe('Movement Functions', () => {
  it ('places armies', () => {
    let state = new WarlightState(testState)
    state = state.placeArmies(4, 10).toJS();
    expect(state.regions[4].armies).to.equal(30);
  });

  it ('catches incorrect placement', () => {
    let state = new WarlightState(testState)
    expect(state.placeArmies(4, 10)).to.throw;
  });

  it ('can attack a region and not conquer it', () => {
    let state = new WarlightState(testState)
    state = state.attack(4, 3, 10);

    expect(state.getArmies(4)).to.equal(13);
    expect(state.getArmies(3)).to.equal(4);
    expect(state.getOwner(3)).to.equal(-1);

    state = state.attack(4, 3, 10);
    expect(state.getArmies(4)).to.equal(3);
    expect(state.getArmies(3)).to.equal(7);
    expect(state.getOwner(3)).to.equal(1);
  });
  it ('Throws error for invalid moves', () => {
    let state = new WarlightState(testState)

    expect(() => state.attack(4, 3, 999)).to.throw('Exceeded number of armies in territory');
    expect(() => state.attack(4, 1, 1)).to.throw('Regions are not adjacent');
    expect(() => state.attack(4, 3, -11)).to.throw('Minimum of one attacker');
  });
});
