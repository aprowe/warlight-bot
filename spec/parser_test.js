import imm from 'immutable';

import { expect } from 'chai';

import {
  settings,
  setup_map,
  update_map,
} from '../src/parser';

import WarlightState from '../src/state';

describe('settings parsing', () => {
  it('parses playerId', () => {
    let state = new WarlightState;

    expect(state.playerId).to.not.equal(3);
    state = settings(state, 'your_bot', '3');
    expect(state.playerId).to.equal(3);
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
})

describe('update_map parsing', () => {
  it('parses regions', () => {
    let state = new WarlightState;
    state = setup_map(state, 'regions', '1 1 2 1 3 1 4 2 5 2');

    state = update_map(state, '1 1 10 2 1 11 3 2 12 4 2 13 5 1 0');
    expect(state.getOwner(1)).to.equal(1);
    expect(state.getArmies(1)).to.equal(10);
    
    expect(state.getOwner(2)).to.equal(1);
    expect(state.getArmies(2)).to.equal(11);

    expect(state.getOwner(3)).to.equal(2);
    expect(state.getArmies(3)).to.equal(12);

    expect(state.getOwner(4)).to.equal(2);
    expect(state.getArmies(4)).to.equal(13);
  });
})
