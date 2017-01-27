import imm from 'immutable';

import { expect } from 'chai';

import {
  settings,
  setup_map,
  update_map,
  pick_starting_region,
  go,
} from '../src/parser';

import WarlightState from '../src/state';

describe('settings parsing', () => {
  it('parses playerId', () => {
    let state = new WarlightState;

    expect(state.playerId).to.not.equal(3);
    state = settings(state, 'your_bot', 'player1');
    expect(state.playerId).to.equal('player1');
  });
  it('parses opponentId', () => {
    let state = new WarlightState;

    expect(state.opponentId).to.not.equal(3);
    state = settings(state, 'opponent_bot', 'player2');
    expect(state.opponentId).to.equal('player2');
  });
})

describe('setup_map parsing', () => {
  it('parses super regions', () => {
    let state = new WarlightState;

    state = setup_map(state, 'super_regions', '1 4 5');
    expect(state.superRegions).to.deep.equal([1, 4, 5]);
  });
  it('parses regions', () => {
    let state = new WarlightState;

    state = setup_map(state, 'regions', '1 1 2 1 3 1 4 2 5 2');
    expect(state.getRegion(1).get('super')).to.equal(1);
    expect(state.getRegion(2).get('super')).to.equal(1);
    expect(state.getRegion(3).get('super')).to.equal(1);
    expect(state.getRegion(4).get('super')).to.equal(2);
    expect(state.getRegion(5).get('super')).to.equal(2);
  });
  it('parses neighbors', () => {
    let state = new WarlightState;

    state = setup_map(state, 'regions', '1 1 2 1 3 1 4 1 5 1');
    state = setup_map(state, 'neighbors', '1 2,3 2 1,3 3 1,2,4 4 3');
    expect(state.getRegion(1).get('neighbors').toJS()).to.deep.equal([2,3]);
    expect(state.getRegion(2).get('neighbors').toJS()).to.deep.equal([1,3]);
    expect(state.getRegion(3).get('neighbors').toJS()).to.deep.equal([1,2,4]);
    expect(state.getRegion(4).get('neighbors').toJS()).to.deep.equal([3]);
  });
})

describe('Other commands', () => {
  it('update_map parsing', () => {
    let state = new WarlightState;
    state = setup_map(state, 'regions', '1 1 2 1 3 1 4 2 5 2');

    state = update_map(state, '1 player1 10 2 player1 11 3 player2 12 4 player2 13 5 player1 0');
    expect(state.getOwner(1)).to.equal('player1');
    expect(state.getArmies(1)).to.equal(10);

    expect(state.getOwner(2)).to.equal('player1');
    expect(state.getArmies(2)).to.equal(11);

    expect(state.getOwner(3)).to.equal('player2');
    expect(state.getArmies(3)).to.equal(12);

    expect(state.getOwner(4)).to.equal('player2');
    expect(state.getArmies(4)).to.equal(13);
  });

  it('parses selectable regions', () => {
    let state = new WarlightState;

    state = pick_starting_region (state, '10000', '2 4 5');
    expect(state.selectableRegions.toJS()).to.deep.equal([2,4,5])
  });

  it('uses the go command', () => {
    let state = new WarlightState;

    state = state.set('playerId', 'tits');
    state = go(state, 'attack/transfer');
    expect(state.activeId).to.equal('tits');
  });

});
