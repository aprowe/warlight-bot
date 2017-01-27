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
import * as Parser from './parser';
import WarlightState from './state';

class Interface {
  constructor() {
    this.state = new WarlightState;
    this.settings = {};
  }

  run () {
    let io = readline.createInterface(process.stdin, process.stdout);
    let bot = this;
    io.on('line', (data) => {
      let response = this.handleLines(data);
      if (response) {
        process.stdout.write(response);
      }
    });
  }

  handleLines(data) {
    // stop if line doesn't contain anything
    if (data.length === 0) {
        return;
    }

    let responses = [];

    let lines = data.trim().split('\n');

    while (0 < lines.length) {
      let line = lines.shift().trim();
      let lineParts = line.split(" ")

      // stop if lineParts doesn't contain anything
      if (lineParts.length === 0) {
        return;
      }

      // get the input command and convert to camel case
      let command = lineParts.shift();

      // invoke command if function exists and pass the data along
      // then return response if exists
      let response = this.execute(command, lineParts);

      if (response && 0 < response.length) {
        responses.push(response);
      }
    }

    return responses.join('\n');
  }

  /**
   * Excute based on the
   */
  execute(command, args) {
    switch(command) {
      case 'setup_map': {
        this.state = Parser.setup_map(this.state, args.shift(), args.join(' '));
        return;
      }
      case 'settings': {
        this.settings[args[0]] = args.length <= 2 ? args[1] : args;
        this.state = Parser.settings(this.state, args.shift(), args.join(' '));
        return;
      }
      case 'update_map': {
        this.state = Parser.update_map(this.state, args.join(' '));
        return;
      }
      case 'pick_starting_region': {
        this.state = Parser.pick_starting_region(this.state, args.shift(), args.join(' '));
        return 'random';
      }
      case 'go': {
        this.state = Parser.go(this.state, args.shift());
        return 'TODO';
      }
      case 'print': {

        return JSON.stringify(this.state.toJS(), null, '\t');
      }

    }
  }
}


export default Interface;
