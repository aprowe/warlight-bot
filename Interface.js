// Copyright 2016 TheAIGames.com

//    Licensed under the Apache License, Version 2.0 (the "License");
//    you may not use this file except in compliance with the License.
//    You may obtain a copy of the License at

//        http://www.apache.org/licenses/LICENSE-2.0

//    Unless required by applicable law or agreed to in writing, software
//    distributed under the License is distributed on an "AS IS" BASIS,
//    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//    See the License for the specific language governing permissions and
//    limitations under the License.

import readline from 'readline';
import {
  updateGameState,
  initialState,
  getNextBoards,
  makeMove,
  getAvailableMoves,
} from './Board';
import {
  getBestMove,
  scoreState,
} from './Bot';
import {
  shuffle
} from './utility';

/**
 * Main class
 * Initializes a map instance and an empty settings object
 */
var Interface = function () {

    if (false === (this instanceof Interface)) {
        return new Interface();
    }

    this.state = initialState();
    this.options = {};
    this.depth = 2;
    this.lastTime = 10000;
};

/**
 *
 */
Interface.prototype.run = function () {

    var io = readline.createInterface(process.stdin, process.stdout);

    var bot = this;

    io.on('line', function (data) {
        var line,
            lines,
            lineParts,
            command,
            response;

        // stop if line doesn't contain anything
        if (data.length === 0) {
            return;
        }

        lines = data.trim().split('\n');

        while (0 < lines.length) {

            line = lines.shift().trim();
            lineParts = line.split(" ")

            // stop if lineParts doesn't contain anything
            if (lineParts.length === 0) {
                return;
            }

            // get the input command and convert to camel case
            command = lineParts.shift().toCamelCase();

            // invoke command if function exists and pass the data along
            // then return response if exists
            if (command in bot) {
                response = bot[command](lineParts);

                if (response && 0 < response.length) {
                    process.stdout.write(response + '\n');
                }
            } else {
                process.stderr.write('Unable to execute command: ' + command + ', with data: ' + lineParts + '\n');
            }
        }
    });

    io.on('close', function () {
        process.exit(0);
    });
};

/**
 * Respond to settings command
 * @param Array data
 */
Interface.prototype.settings = function (data) {
    var key = data[0],
        value = data[1];

    // set key to value
    this.options[key] = value;
    this.state = updateGameState(this.state, key, value);
};

const timeTiers = [
  // [10000, 6],
  [5000, 5],
  [1500, 4],
  // [450, 4],
];

export const determineDepth = function (timebank, state) {
  if (state.get('allActive')) {
    return 3;
  }

  for (let i in timeTiers) {
    if (timeTiers[i][0] <= timebank)  {
      return timeTiers[i][1];
    }
  }

  return 3;
}

Interface.prototype.action = function (data) {
    if (data[0] === 'move') {
      this.state = this.state.set('activeId', this.state.get('playerId'));

      let timeout = Number(data[1]);
      let depth = determineDepth(timeout, this.state);

      process.stderr.write('depth: ' + depth + '\n');

      let move;
      if (this.move == 1) {
        // if we have the first move, put it here to not waste time
        move = {x: 4, y: 4};

        // use some time to memoize
        // getBestMove(this.state, 2);
      } else {
        // get best move
        move = getBestMove(this.state, depth, timeout);
      }

      // Last chance to catch an error;
      if (!move) {
        process.stderr.write('Panic choice!\n');
        move = shuffle(getAvailableMoves(this.state))[0];
      }

      // output move
      let response = "place_move " + move.x + ' ' + move.y;
      process.stdout.write(response + '\n');

      // Start pondering
      // getBestMove(makeMove(this.state, move), 3);
    }
};

Interface.prototype.update = function (data) {
  if (data[0] === 'game') {
    if (data[1] === 'move') {
      this.move = Number(data[2]);
    }
    this.state = updateGameState(this.state, data[1], data[2]);
  }
};

String.prototype.toCamelCase = function () {

    return this.replace('/', '_').replace(/_[a-z]/g, function (match) {
        return match.toUpperCase().replace('_', '');
    });
};

export default Interface;
