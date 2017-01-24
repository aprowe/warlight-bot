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

class Interface {
  constructor() {
    this.state = null;
    this.options = {};
  }

  run () {
    let io = readline.createInterface(process.stdin, process.stdout);
    let bot = this;
    io.on('line',  data => {

    let line;
    let lines;
    let lineParts;
    let command;
    let response;

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
      if (!this[command]) {
        continue;
      }

      response = this[command](lineParts);

      if (response && 0 < response.length) {
        process.stdout.write(response + '\n');
      }
    }
  }
  
  /*
  * Respond to settings command
  * @param Array data
  */
  settings(data) {
    let key = data[0],
    let value = data[1];

    // set key to value
    this.options[key] = value;
    this.state = updateGameState(this.state, key, value);
  };
}


export default Interface;
