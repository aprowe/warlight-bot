//
// Output from engine	Description
// - IMPLEMENTED
// - setup_map super_regions [-i -i ...]	The superregions are given, with their bonus armies reward, all separated by spaces. Odd numbers are superregion ids, even numbers are rewards.
// - setup_map regions [-i -i ...]	The regions are given, with their parent superregion, all separated by spaces. Odd numbers are the region ids, even numbers are the superregion ids.
// - setup_map neighbors [-i [-i,...] ...]	The connectivity of the regions are given, first is the region id. Then the neighboring regions' ids, separated by commas. Connectivity is only given in one way: 'region id' < 'neighbour id'.
// - setup_map wastelands [-i ...]	The regions ids of the regions that are wastelands are given. These are neutral regions with more than 2 armies on them.
// - setup_map opponent_starting_regions [-i ...]	All the regions your opponent has picked to start on, called after distribution of starting regions.
// - settings your_bot -b	The name of your bot is given.
// - settings opponent_bot -b	The name of your opponent bot is given.
// - settings starting_armies -i	The amount of armies your bot can place on the map at the start of this round.
// - update_map [-i -b -i ...]	Visible map for the bot is given like this: region id; player owning region; number of armies.
// - pick_starting_region -t [-i ...]	Starting regions to be chosen from are given, one region id is to be returned by your bot
// - go place_armies -t	Request for the bot to return his place armies moves.
// - go attack/transfer -t
//
// Not necessary for bot
// settings starting_regions [-i ...]	The complete list of starting regions your bot can pick from is given, before pick_starting_regions is called.
// settings starting_pick_amount -i	The amount of regions your bot can pick from the above list.
// settings timebank -i	The maximum (and initial) amount of time in the timebank is given in ms.
// settings time_per_move -i	The amount of time that is added to your timebank each time a move is requested in ms.
// settings max_rounds -i	The maximum amount of rounds in this game. When this number is reached it's a draw.
// opponent_moves [‑m ...]	all the visible moves the opponent has done are given in consecutive order. -m can be any move and has the same format as in the table below

import imm from 'immutable';

import {
  OWNER,
  PHASE
} from './state';


export function settings (state, key, value) {
  switch(key) {
    case 'your_bot': {
      return state.set('playerId', value);
    }

    case 'starting_armies': {
      return state.set('armiesToPlace', Number(value));
    }

    case 'opponent_bot': {
      return state.set('opponentId', value);
    }
  }

  return state;
}

export function setup_map(state, key, value) {
  switch(key) {
    case 'super_regions': {
      return state.set('superRegions', value.split(' ').map(Number));
    }

    case 'regions': {
      let list = value.split(' ');
      let regions = {};
      for (let i = 0; i < list.length; i += 2) {
        regions[list[i]] = {
          id: list[i],
          super: Number(list[i+1]),
          armies: 0,
          owner: null,
          neighbors: [],
        };
      }

      return state.set('regions', imm.fromJS(regions));
    }

    case 'wastelands': {
      let list = value.split(' ');
      for (let id of list) {
        state = state.setIn(['regions', id, 'owner'], OWNER.NEUTRAL);
        state = state.setIn(['regions', id, 'armies'], 2);
      }

      return state;
    }

    case 'opponent_starting_regions': {
      let list = value.split(' ');
      for (let id of list) {
        state = state.setIn(['regions', id, 'owner'], state.opponentId);
      }
      return state;
    }

    case 'neighbors': {
      // eg. 1 2,3,4 2 3,4 3 1,2
      let list = value.split(' ');
      for (let i = 0; i < list.length; i += 2) {
        let region = list[i];
        let neighbors = list[i+1].split(',').map(Number);
        state = state.setIn(['regions', region, 'neighbors'], imm.fromJS(neighbors));
      }

      return state;
    }
  }

  return state;
}

export function update_map (state, value) {
  let list = value.split(' ');

  return state.withMutations(s => {
    for (let i = 0; i < list.length; i += 3) {
      s.setIn(['regions', list[i], 'owner'],  list[i+1]);
      s.setIn(['regions', list[i], 'armies'], Number(list[i+2]));
    }
  })
}

export function go (state, key) {
  state = state.set('activeId', state.get('playerId'));
  switch(key) {
    case 'place_armies': {
      return state.set('phase', PHASE.PLACE_ARMIES);
    }
    case 'attack/transfer': {
      return state.set('phase', PHASE.ATTACK);
    }
  }

  return state;
}

export function pick_starting_region (state, time, regions) {
  return state.set('selectableRegions', imm.fromJS(regions.split(' ').map(Number)));
}
