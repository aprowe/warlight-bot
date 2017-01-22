import {
  getOwner,
  opponentId,
  OWNER,
} from './Board';

import * as Board from './Board';

export const REGION_TYPE = {
  // Tucked away, only friendly neighbors
  HOMELAND: 1,

  // Only Netural or friendly neighbors
  FRONTIER: 2,

  // One or More Hostile neighbors
  WARZONE: 3,
};

DEFINE_MACRO(STATE, (str) => {
  return state.getIn(str.split('.'));
});

/**
 * Uses a breadth-first search to determne a nodes distance from
 * the enemy (or unknown)
 */
export function calcDistanceFrom (state, targetId, regionId) {
  let nodes

  // if region is specified, just search that region
  if (regionId) {
    regionId = '' + regionId;
    nodes = [regionId];
  } else {
    nodes = state.get('regions').keys();
  }

  let dist = {};

  for (let n of nodes) {
    // Get neighbors
    let queue = state.getIn(['regions', n, 'neighbors']).toJS();

    // Next level of queue
    let nextQueue = [];
    let depth = 1;

    // If it is an opponent, set distance to 0
    let owner = getOwner(state, n);
    if (owner === targetId) {
      dist[n] = 0;
      continue;
    }

    while(queue.length || nextQueue.length) {
      let regionId = queue.shift();

      if (regionId === n) {
        continue;
      }

      let owner = getOwner(state, regionId);

      if (owner == targetId) {
        dist[n] = depth;
        break;
      }

      nextQueue = nextQueue.concat(state.getIn(['regions', ''+regionId, 'neighbors']).toJS());

      if (queue.length == 0) {
        depth++;
        queue = nextQueue;
        nextQueue = [];
      }
    }
  }

  if (regionId) {
    return dist[regionId];
  } else {
    return dist;
  }
}

export function getRegionType (state, regionId) {
  let distFromEnemy = calcDistanceFrom(state, opponentId(state), regionId);
  if (distFromEnemy <= 1) {
    return REGION_TYPE.WARZONE;
  }

  let distFromNeutral = calcDistanceFrom(state, OWNER.NEUTRAL, regionId);
  if (distFromNeutral <= 1) {
    return REGION_TYPE.FRONTIER;
  }

  return REGION_TYPE.HOMELAND;
}

export function getSurroundingPower (state, regionId) {
  let regions = state.getIn(['regions', ''+regionId, 'neighbors']).toJS();

  let power = 0;
  for (let r of regions) {
    if (state.getIn(['regions', r, 'owner']) != state.get('playerId')) {
      power += state.getIn(['regions', ''+r, 'armies']);
    }
  }

  return power;
}

const TYPE_MULTIPLIER = {
  [REGION_TYPE.WARZONE]:   2,
  [REGION_TYPE.HOMELAND]: -1,
  [REGION_TYPE.FRONTIER]:  1,
};

export function scoreRegion (state, regionId) {
  let type = getRegionType(state, regionId);

  return TYPE_MULTIPLIER[type] * STATE(`regions.${regionId}.armies`);
}

export function scoreState (state) {
  let score = 0;
  let player = state.get('activeId');

  let regions = Board.getRegionsByOwner(state, player);
  regions.forEach((r, id) => {
    score += scoreRegion(state, id);
  });

  return score;
}
