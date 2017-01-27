import imm from 'immutable';
import * as Analysis from './Analysis';

export const OWNER = {
  NONE: 0,
  NEUTRAL: -1,
  UNKNOWN: -2
};

export const PHASE = {
  SELECT_REGIONS: 0,
  PLACE_ARMIES: 1,
  ATTACK: 2,
};

export const QUERY = {
  ARMIES: 'armies',
  REGIONS: 'regions',
  OWNER: 'owner',
}

const initialState = {
  playerId: '',
  opponentId: '',
  activeId: 1,
  superRegions: imm.List(),
  regions: imm.Map(),
  armiesToPlace: 0,
  selectableRegions: imm.List(),
  phase: PHASE.PLACE_ARMIES,
};

export default class WarlightState extends imm.Record(initialState) {
  getRegion(id) {
    return this.regions.get(''+id);
  }

  updateRegion(id, fn) {
    return this.setIn(['regions', id], this.getRegion(id).withMutations(fn));
  }

  getArmies(id) {
    return this.getRegion(id).get('armies');
  }

  getOwner(id) {
    return this.getRegion(id).get('owner');
  }

  getRegionsByOwner (owner) {
    return this.get('regions').filter(n => {
      return n.get('owner') === owner;
    });
  }

  getNeighbors(id) {
    return this.getRegion(id).get('neighbors').map(n => {
      return this.getRegion(n);
    });
  }

  getRegionsBySuper(id) {
    return this.get('regions').filter(region => {
      return (region.get('super') == id);
    });
  }

  placeArmies(regionId, count = 1) {
    if (this.getOwner(regionId) !== this.get('activeId')) {
      throw "Cannot place army in region";
    }

    return this.setIn(['regions', regionId, 'armies'], this.getArmies(regionId) + count);
  }

  isAdjacent(r1, r2) {
    let list = this.getRegion(r1).get('neighbors');
    return list.includes(r2);
  }

  attack(r1, r2, count) {
    if (!this.isAdjacent(r1, r2)) {
      throw "Regions are not adjacent";
    }

    if (count <= 0) {
      throw "Minimum of one attacker";
    }

    // Transfer the region belongs to an owner
    if (this.getOwner(r2) === this.get('activeId')) {
      return this.placeArmies(r1, -count).placeArmies(r2, count);
    }

    let defenderCount = this.getArmies(r2);
    let attackerCount = count;

    // New count of armies at original region
    let homeCount = this.getArmies(r1) - count;

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

    r1 = '' + r1;
    r2 = '' + r2;

    if (defenderCount <= 0) {
      return this.withMutations(map => {
        // Set new count and owner
        map.setIn(['regions', r2, 'armies'], attackerCount);
        map.setIn(['regions', r2, 'owner'], this.get('activeId'));

        // deduct from region
        map.setIn(['regions', r1, 'armies'], homeCount);
      });
    }

    // // No transer of ownership
    return this.withMutations(map => {
      map.setIn(['regions', r1, 'armies'], homeCount + attackerCount);
      map.setIn(['regions', r2, 'armies'], defenderCount);
    })
  }

}

WarlightState.OWNER = OWNER;
WarlightState.PHASE = PHASE;


for (let i in Analysis) {
  WarlightState.prototype[i] = function () {
    return Analysis[i](this, arguments[0], arguments[1], arguments[2], arguments[3], arguments[4]);
  }
}
