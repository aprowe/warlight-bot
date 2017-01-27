import {
  expect
} from 'chai';


import Interface from '../src/interface';

describe('Interface', () => {
  it('parses setup phase', () => {
    let inter = new Interface;

    inter.handleLines('settings your_bot kazooie\n\
                       settings opponent_bot banjo');
    expect(inter.state.get('playerId')).to.equal('kazooie');
    expect(inter.state.get('opponentId')).to.equal('banjo');
  });
  
  it('parses setup phase', () => {
    let inter = new Interface;

    inter.handleLines('settings your_bot kazooie\n\
      settings timebank 10000\n\
      settings time_per_move 500\n\
      settings max_rounds 50\n\
      settings your_bot player1\n\
      settings opponent_bot player2\n\
      setup_map super_regions 1 2 2 5\n\
      setup_map regions 1 1 2 1 3 2 4 2 5 2\n\
      setup_map neighbors 1 2,3,4 2 3 4 5\n\
      setup_map wastelands 3\n\
      settings starting_regions 2 4\n\
      settings starting_pick_amount 1');
    expect(inter.settings['timebank']).to.equal('10000');
    expect(inter.settings['time_per_move']).to.equal('500');
    expect(inter.settings['max_rounds']).to.equal('50');

    expect(inter.state.get('playerId')).to.equal('player1');
    expect(inter.state.get('opponentId')).to.equal('player2');
    expect(inter.state.getRegion('1').get('neighbors').toJS()).to.deep.equal([2,3,4]);
  });

  it('parses setup phase', () => {
    let inter = new Interface;

    let response = inter.handleLines('pick_starting_region');
    expect(response).to.equal('random');
  });

});
