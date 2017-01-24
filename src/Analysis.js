import {
  OWNER,
} from './state';

import {
  shuffle,
  sample,
} from './utility';

export const REGION_TYPE = {
  // Tucked away, only friendly neighbors
  HOMELAND: 1,

  // Only Netural or friendly neighbors
  FRONTIER: 2,

  // One or More Hostile neighbors
  WARZONE: 3,
};

/**
 * Uses a breadth-first search to determne a nodes distance from
 * the enemy (or unknown)
 */
export function calcDistanceFrom (state, targetId, regionId) {
  let nodes;

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
    let owner = state.getOwner(n);
    if (owner === targetId) {
      dist[n] = 0;
      continue;
    }

    while(queue.length || nextQueue.length) {
      let regionId = queue.shift();

      if (regionId === n) {
        continue;
      }

      let owner = state.getOwner(regionId);

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

/**
 * Region Heuristics
 */
export function getRegionType (state, regionId) {
  let distFromEnemy = calcDistanceFrom(state, state.opponentId(), regionId);
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

/***********************************
 * Scoring Functions and Constants
 ***********************************/
const TYPE_MULTIPLIER = {
  [REGION_TYPE.WARZONE]:   2,
  [REGION_TYPE.HOMELAND]: -1,
  [REGION_TYPE.FRONTIER]:  1,
};

const REGION_SCORE = 10;

export function scoreRegion (state, regionId) {
  let type = getRegionType(state, regionId);

  return TYPE_MULTIPLIER[type] * state.getArmies(regionId);
}

export function scoreState (state) {
  let score = 0;
  let player = state.get('activeId');

  let regions = state.getRegionsByOwner(player);
  regions.forEach((r, id) => {
    score += scoreRegion(state, id);
    score += 10;
  });

  return score;
}

export function diffRegionScore(state, regionId) {
  let plusOne  = state.updateIn(['regions', regionId, 'armies'], n => n++);
  let minusOne = state.updateIn(['regions', regionId, 'armies'], n => n--);

  return {
    plus: scoreState(plusOne),
    minus: scoreState(minusOne),
  };
}

/**
 * Helper class for getShortestPath
 */
function Node (id, parent = null) {
  this.parent = parent;
  this.children = [];
  this.id = id;
  this.depth = 0;
}

/**
 * Returns a random shortes path from one region to another
 */
export function getShortestPath(state, region1, region2) {
  // if same, exit immediately
  if (region1 == region2) {
    return [region1];
  }

  // dictionary for whats counted
  let counted = {
    [region1]: true,
  };

  let queue = [new Node(region1)];

  let targetNode = null;
  while(targetNode === null && queue.length) {
    let node = queue.shift();

    shuffle(state.getRegion(node.id).get('neighbors').toJS()).forEach(id => {
      // If already counted, continue
      if (counted[id]) {
        return;
      }

      counted[id] = true;

      // make new node
      let newNode = new Node(id, node);

      // Add to queues
      queue.push(newNode);

      // if its the one, break
      if (id == region2) {
        targetNode = newNode;
      }
    });
  }


  let path = [];
  let currentNode = targetNode;
  while(currentNode) {
    path.push(currentNode.id);
    currentNode = currentNode.parent;
  }

  return path.reverse();
}

export function calcBottleNecks(state, loops = 10000) {
  const regionList = Object.keys(state.regions.toJS());

  const scores = {};
  regionList.forEach((id) => {
    scores[id] = 0;
  });

  for(let i = 0; i < loops; i++) {
    let r1 = sample(regionList);
    let r2 = sample(regionList);
    let path = getShortestPath(state, r1, r2)
    path.forEach(id => {
      scores[id]++;
    });
  }

  let smallest = Infinity;
  for (let i in scores) {
    smallest = Math.min(smallest, scores[i]);
  }

  for (let i in scores) {
    scores[i] /= smallest;
  }

  return scores;
}
