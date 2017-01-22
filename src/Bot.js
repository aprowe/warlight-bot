import imm from 'immutable';

import { hashState, getNextBoards, getAllMicroBoards, getAvailableMoves } from './Board';
import { shuffle, getDiagonals, isInf, chunkArray, memoize, transpose } from './utility';

export function getBestMove(state, depth = 1, timeout = Infinity) {
  depth++;
  // console.log('=============');
  return alphabeta(state, depth , depth, new Date().getTime() + timeout - 50).move;
}

function alphabeta(state, depth, max, timeout = Infinity, alpha = -Infinity, beta = Infinity, maximizingPlayer = true) {
  // console.log('entering depth', depth, state.toJS());

  // Exit early if takes too long
  if (depth == 0 || (new Date().getTime() > timeout && depth != max)) {
    // console.log('leaving depth', depth, scoreState(state));
    return {
      v: scoreState(state),
    }
  }

  // let nodes = shuffle(getNextBoards(state)).sort((a,b) => {
  let nodes = getNextBoards(state).sort((a,b) => {
    return a.state.get('allActive') - b.state.get('allActive')
  });

  if (nodes.length == 0) {
    // console.log("END");
    return {
      v: scoreState(state),
    };
  }

  let v;
  let move;
  if (maximizingPlayer) {
    v = - Infinity;
    for (let i in nodes) {
      let tmp = v;
      // console.log(depth, nodes[i].move);
      v = Math.max(v, alphabeta(nodes[i].state, depth - 1, max, timeout, alpha, beta, false).v)
      if (tmp != v) {
        move = nodes[i].move;
      }

      alpha = Math.max(alpha, v)
      if (beta <= alpha || v === Infinity) {
        break;
      }
     }
  } else {
    v = Infinity;
    for (let i in nodes) {
      let tmp = v;
      // console.log(depth, nodes[i].move);
      v = Math.min(v, alphabeta(nodes[i].state, depth - 1, max, timeout, alpha, beta, true).v);
      if (tmp != v) {
        move = nodes[i].move;
      }

      beta = Math.min(beta, v);
      if (beta <= alpha || v === -Infinity) {
        break;
      }
    }
  }

  // console.log('leaving depth', depth, v, move);
  return {
    v: v,
    move,
  };
}

const MAX_SCORE = 1000;

const ROW_SCORES = {
  '000': 0,
  '111': MAX_SCORE,
  '222': - (MAX_SCORE - 1),
  '100': 1,
  '010': 1,
  '001': 1,
  '101': 10,
  '110': 10,
  '011': 10,
  '200': -1,
  '020': -1,
  '002': -1,
  '202': -10,
  '220': -10,
  '022': -10,
  '112': 0,
  '121': 0,
  '211': 0,
  '221': 0,
  '212': 0,
  '122': 0,
  '021': 0,
  '012': 0,
  '102': 0,
  '120': 0,
  '210': 0,
  '201': 0,
};

function getRowScore(row, player) {
  let mod = player == 1 ? 1 : -1;
  let score = ROW_SCORES['' + row[0] + row[1] + row[2]] * mod;
  return score
}

export function scoreMatrix(mat, player) {
  let opponent = 3 - player;

  let score = 0;
  for (let i in mat) {
    // Continue for diagonals
    if (mat[i].length < 3) continue;
    let rowScore = getRowScore(mat[i], player);
    if (rowScore >= MAX_SCORE) return MAX_SCORE;
    if (rowScore <= -MAX_SCORE) return -MAX_SCORE;
    score += getRowScore(mat[i], player);
  }

  return score;
}

function slowScoreState (state) {
  let matrix = state.get('board').toJS();

  if (state.get('winner') == state.get('playerId')) {
    return Infinity;
  } else if (state.get('winner') == state.get('opponentId')) {
    return -Infinity;
  }

  let boards = getAllMicroBoards(state);

  let player = state.get('playerId');
  let score = 0;
  for (let i in boards) {
    let mult = 1;
    if (i == 4) {
      mult = 1.5;
    }
    score += scoreMicroBoard(boards[i], player) * mult;
  }

  let macro = state.get('macroBoard').toJS();

  // convert -1 to 0 for scoring purposes
  for (let i in macro) {
    macro[i] = macro[i].map(x => x > 0 ? x : 0);
  }
  score += scoreMicroBoard(macro, player) * 1000;

  return score;
}

function slowScoreMicroBoard(board, player) {
  let score = 0;
  var transposed = transpose(board);
  var diagonals = getDiagonals(board);

  if (board[1][1] == player) {
    score += 1;
  } else if (board[1][1] == 3 - player){
    score -= 1;
  }

  let scores = [];
  scores.push(scoreMatrix(board, player));
  scores.push(scoreMatrix(transposed, player));
  scores.push(scoreMatrix(diagonals, player));

  for (let i in scores) {
    if (scores[i] > MAX_SCORE) {
      return MAX_SCORE
    } else if (scores[i] < -MAX_SCORE) {
      return -MAX_SCORE
    }
  }

  return scores.reduce((t, x) => t+x);
}

export const scoreMicroBoard = memoize(slowScoreMicroBoard, (board, player) => board.map(r=>r.join('')).join('')+'p'+player);
// export const scoreMicroBoard = slowScoreMicroBoard;
// export const scoreState = memoize(slowScoreState, hashState);
export const scoreState = slowScoreState;
