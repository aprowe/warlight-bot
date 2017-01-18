import imm from 'immutable';

import {
  chain
} from './utility';

// Amy Owner Types
const NONE = 0;
const NEUTRAL = -1;
const UNKNOWN = -2;

export const OWNER = {
  NONE,
  NEUTRAL,
  UNKNOWN,
};

const SELECT_REGIONS = 0;
const PLACE_ARMIES = 1;
const ATTACK = 2;

export const PHASE = {
  SELECT_REGIONS,
  PLACE_ARMIES,
  ATTACK,
};

export function initialState () {
  return imm.fromJS({
    playerId: 1,
    opponentId: 2,
    activeId: 1,
    superRegions:{
      1: 2,
      2: 3,
    },
    regions: {
      1: {
        id: 1,
        neighbors: [2, 3],
        super: 1,
        owner: 2,
        armies: 2,
      },
      2: {
        id: 2,
        neighbors: [1,3],
        super: 1,
        armies: 2,
        owner: NEUTRAL,
      },
      3: {
        id: 3,
        neighbors: [1,2],
        super: 2,
        armies: 2,
        owner: NEUTRAL,
      },
      4: {
        id: 4,
        neighbors: [3],
        super: 2,
        armies: 2,
        owner: 1,
      }
    },
    armiesToPlace: 3,
    selectableRegions: [1,3,4],
    phase: PLACE_ARMIES,
  });
}

export function getRegionsByOwner(state, playerId) {
  return state.get('regions').filter(region => {
    return (region.get('owner') == playerId);
  });
}

export function getRegionsBySuper(state, superId) {
  return state.get('regions').filter(region => {
    return (region.get('super') == superId);
  });
}

export function getRegionsByNeighbor(state, regionId) {
  return state.getIn(['regions', ''+regionId, 'neighbors']).map(neighbor => {
    return state.getIn(['regions', ''+neighbor]).set('id', neighbor)
  });
}

export function opponentId(state) {
  return 3 - state.get('playerId');
}

export function getOwner(state, regionId) {
  return state.getIn(['regions', '' + regionId, 'owner']);
}

function getRegion(state, regionId) {
  return state.getIn(['regions', regionId]);
}

export function placeArmies(state, region, count = 1) {
  region += '';
  if (state.getIn(['regions', region, 'owner']) !== state.get('activeId')) {
    throw "Cannot place army in region";
  }

  return state.setIn(['regions', region, 'armies'], state.getIn(['regions', region, 'armies']) + count);
}

export function isAdjacent(state, r1, r2) {
  let list = state.getIn(['regions', ''+r1, 'neighbors']).toJS();
  return list.indexOf(r2) >= 0;
  // return state.getIn(['regions',  r1, 'neighbors']).has(r2);
}

export function attack(state, r1, r2, count) {
  if (!isAdjacent(state, r1, r2)) {
    throw "Regions are not adjacent";
  }

  if (count <= 0) {
    throw "Minimum of one attacker";
  }

  // Mak einto strings
  r1 += '';
  r2 += '';

  // Transfer it belongs to an owner
  if (getOwner(state, r2) == state.get('activeId')) {
    return placeArmies(
           placeArmies(state, r1, -count)
           , r2, count);

  }

  let defenderCount = getRegion(state, r2).get('armies');
  let attackerCount = count;

  // New count of armies at original region
  let homeCount = getRegion(state, r1).get('armies') - count;

  if (homeCount <= 0) {
    throw "Exceeded number of armies in territory";
  }

  // In units of armies destroyed
  let attackPower = attackerCount * 0.6;
  let defendPower = defenderCount * 0.7;

  defenderCount -= attackPower;
  attackerCount -= defendPower;

  defenderCount = Math.floor(defenderCount);
  attackerCount = Math.floor(attackerCount);

  if (defenderCount <= 0) {
    return state.withMutations(map => {
      // Set new count and owner
      map.setIn(['regions', r2, 'armies'], attackerCount);
      map.setIn(['regions', r2, 'owner'], state.get('activeId'));

      // deduct from region
      map.setIn(['regions', r1, 'armies'], homeCount);
    });
  }

  // No transer of ownership
  return state.withMutations(map => {
    map.setIn(['regions', r1, 'armies'], homeCount + attackerCount);
    map.setIn(['regions', r2, 'armies'], defenderCount);
  })
}
