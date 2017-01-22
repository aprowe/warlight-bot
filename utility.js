import imm from 'immutable';

DEFINE_MACRO(STATE, (str) => {
  return state.getIn(str.split('.'));
});

export function getDiagonals (m) {
  return [
    [m[0][0], m[1][1], m[2][2]],
    [m[0][2], m[1][1], m[2][0]],
  ];
}

export function transpose (m) {
  return [
    [ m[0][0], m[1][0], m[2][0] ],
    [ m[0][1], m[1][1], m[2][1] ],
    [ m[0][2], m[1][2], m[2][2] ],
  ];
}

export function diagonal (arr, left) {
  var summax = arr.length + arr[0].length - 1;
  var rotated = [];
  for( var i = 0; i < summax; ++i) {
    rotated.push([]);
  }

  // Fill it up by partitioning the original matrix.
  for( var j = 0; j < arr[0].length; ++j ) {
    for( var i = 0; i < arr.length; ++i) {
      let J = j;
      if (left) {
        J = arr[0].length - j - 1;
      }

      rotated[i+j].push(arr[i][J]);
    }
  }

  return rotated;
}

export function isInf(n) {
  return n + 1 === n;
}

export function chunkArray(array) {
  return array.reduce((dict, current) => {
    if (dict[dict.length - 1] && dict[dict.length - 1].element == current) {
      dict[dict.length - 1].count++;
    } else {
      dict.push({element: current, count: 1});
    }
    return dict;
  }, []);
}

const _memos = [];

export function memoize (fn, hashFn = (x => x)) {
  let memo = {};

  let memoizedFn = function () {
    var args = Array.prototype.slice.call(arguments);
    let hash = hashFn.apply(this, args);
    if (typeof memo[hash] !== 'undefined') {
      return memo[hash];
    } else {
      memo[hash] = fn.apply(this, args);
      return memo[hash];
    }
  }

  memoizedFn.clearMemo = function () {
    memo = {};
  }

  _memos.push(memoizedFn);

  return memoizedFn;
}

export function clearMemos() {
  _memos.map(fn => fn.clearMemo());
}

export function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

export function point (x,y) {
  return imm.fromJS({x, y});
}

export function chain(state, fns) {
  return fns.reduce((result, fns) => {
    fn = fns[0];
    fns[0] = result || state;
    return fn.call(this, fns);
  })
}
