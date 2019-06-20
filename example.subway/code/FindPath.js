module.exports.function = function findPath(startPoint, endPoint) {
  const api = '59726d4b58736b79343548564e7141';
  const service = 'SearchSTNTimeTableByIDService';

  const console = require('console')
  const graphData = require("./station.js");
  const stationData = require("./vertices.js");

  function PriorityQueue() {
    this._nodes = [];

    this.enqueue = function (priority, key) {
      this._nodes.push({
        key: key,
        priority: priority
      });
      this.sort();
    };
    this.dequeue = function () {
      return this._nodes.shift().key;
    };
    this.sort = function () {
      this._nodes.sort(function (a, b) {
        return a.priority - b.priority;
      });
    };
    this.isEmpty = function () {
      return !this._nodes.length;
    };
  }


  function Graph() {
    var INFINITY = 1 / 0;
    this.vertices = {};

    this.addVertex = function (graph) {
      this.vertices = graph;
    };

    this.shortestPath = function (start, finish) {
      var nodes = new PriorityQueue(),
        distances = {},
        previous = {},
        path = [],
        smallest, vertex, neighbor, alt;

      for (vertex in this.vertices) {
        if (vertex === start) {
          distances[vertex] = 0;
          nodes.enqueue(0, vertex);
        } else {
          distances[vertex] = INFINITY;
          nodes.enqueue(INFINITY, vertex);
        }

        previous[vertex] = null;
      }

      while (!nodes.isEmpty()) {
        smallest = nodes.dequeue();

        if (smallest === finish) {
          path = [];

          while (previous[smallest]) {
            path.push(smallest);
            smallest = previous[smallest];
          }

          break;
        }

        if (!smallest || distances[smallest] === INFINITY) {
          continue;
        }

        for (neighbor in this.vertices[smallest]) {
          alt = distances[smallest] + this.vertices[smallest][neighbor];

          if (alt < distances[neighbor]) {
            distances[neighbor] = alt;
            previous[neighbor] = smallest;

            nodes.enqueue(alt, neighbor);
          }
        }
      }

      return path;
    };
  }
  /*
    function pathTime(path) {
      let station = makeStation();
      var time = 0;
      for (let i = 0; i < path.length - 1; i++) {
        time += station[path[i]]['time'][path[i + 1]];
      }
      return time;
    }
  */
  function matchLineBeforeNext(beforeStation, nowStation, nextStation) {
    var beforeLine = new Array;
    var nowLine = new Array;
    var nextLine = new Array;
    for (let i = 0; i < stationData.length; i++) {
      if (stationData[i].station_nm == beforeStation)
        beforeLine.push(stationData[i].line_num);
      if (stationData[i].station_nm == nowStation)
        nowLine.push(stationData[i].line_num);
      if (stationData[i].station_nm == nextStation)
        nextLine.push(stationData[i].line_num);
    }

    for (let i = 0; i < beforeLine.length; i++) {
      for (let j = 0; j < nowLine.length; j++) {
        for (let k = 0; k < nextLine.length; k++) {
          if (beforeLine[i] == nowLine[j] && nowLine[j] == nextLine[k]) {
            return beforeLine[i];
          }
        }
      }
    }
    return false;
  }

  function matchLineBefore(beforeStation, nowStation) {
    var beforeLine = new Array;
    var nowLine = new Array;
    for (let i = 0; i < stationData.length; i++) {
      if (stationData[i].station_nm == beforeStation)
        beforeLine.push(stationData[i].line_num);
      if (stationData[i].station_nm == nowStation)
        nowLine.push(stationData[i].line_num);
    }

    for (let i = 0; i < beforeLine.length; i++) {
      for (let j = 0; j < nowLine.length; j++) {
        if (beforeLine[i] == nowLine[j])
          return beforeLine[i];
      }
    }
    return false;
  }

  function splitPath(path) {
    var cpath = path;
    var splitPath = new Array();
    var resultPath = new Array();

    var splitLine = new Array();
    var resultLine = new Array();

    end:
      while (1) {
        for (let i = 0; i <= cpath.length; i++) {
          if (i == cpath.length) {
            resultPath.push(cpath);
            resultLine.push(splitLine);
            break end;
          }
          if (i == 0) {
            split = matchLineBeforeNext(cpath[i], cpath[i + 1], cpath[i + 2]);
            splitB = matchLineBefore(cpath[i], cpath[i + 1]);
            if (cpath.length == 2)
              splitLine.push(splitB);
            else {
              if (split)
                splitLine.push(split);
              else {
                splitLine.push(splitB);
              }
            }
          } else if (i == cpath.length - 1) {
            split = matchLineBeforeNext(cpath[i - 2], cpath[i - 1], cpath[i]);
            splitB = matchLineBefore(cpath[i - 1], cpath[i]);
            if (cpath.length == 2) {
              splitLine.push(splitB);
            } else {
              if (split)
                splitLine.push(split);
              else
                splitLine.push(splitB);
            }
          } else {
            split = matchLineBeforeNext(cpath[i - 1], cpath[i], cpath[i + 1]);
            split_before = matchLineBeforeNext(cpath[i - 2], cpath[i - 1], cpath[i]);
            splitB = matchLineBefore(cpath[i - 1], cpath[i]);
            if (split) {
              splitLine.push(split);
            } else {
              splitPath = cpath.slice(0, i + 1);
              cpath = cpath.slice(i, cpath.length + 1);
              if (i == 1) {
                splitLine.push(splitB);
              } else {
                splitLine.push(split_before);
              }
              resultPath.push(splitPath);
              resultLine.push(splitLine);
              splitLine = [];
              break;
            }
          }
        }
      }
    return {
      resultPath: resultPath,
      resultLine: resultLine
    };
  }


  var date = new Date();
  var nowMinTime = Number(date.getHours()) * 60 + Number(date.getMinutes());

  function changeTime(time) {
    var minTime = Number(time.substr(0, 2)) * 60 + Number(time.substr(3, 2));
    return minTime;
  }

  function minusTime(time) {
    time -= 1;
    var hour = Math.floor(time / 60);
    var min = time % 60;
    var res = '';
    if (min < 10) {
      res = hour + ':0' + min;
    } else
      res = hour + ':' + min;

    return res;
  }

  function noMinusTime(time) {
    var hour = Math.floor(time / 60);
    var min = time % 60;
    var res = '';
    if (min < 10) {
      res = hour + ':0' + min;
    }
    else
      res = hour + ':' + min;

    return res;
  }

  function noSecond(time) {
    return time.substr(0, 5);
  }

  function matchStation(station, line) {
    for (let i = 0; i < stationData.length; i++) {
      if (stationData[i].station_nm == station && stationData[i].line_num == line)
        return stationData[i].station_cd;
    }
    return null;
  }

  function matchLine(engLine, korLine) {
    switch (engLine) {
      case '1':
        if (korLine == '01호선') return true;
        else return false;
      case '2':
        if (korLine == '02호선') return true;
        else return false;
      case '3':
        if (korLine == '03호선') return true;
        else return false;
      case '4':
        if (korLine == '04호선') return true;
        else return false;
      case '5':
        if (korLine == '05호선') return true;
        else return false;
      case '6':
        if (korLine == '06호선') return true;
        else return false;
      case '7':
        if (korLine == '07호선') return true;
        else return false;
      case '8':
        if (korLine == '08호선') return true;
        else return false;
      case '9':
        if (korLine == '09호선') return true;
        else return false;
      case 'A':
        if (korLine == '공항철도') return true;
        else return false;
      case 'B':
        if (korLine == '분당선') return true;
        else return false;
      case 'E':
        if (korLine == '용인경전철') return true;
        else return false;
      case 'G':
        if (korLine == '경춘선') return true;
        else return false;
      case 'I':
        if (korLine == '인천선') return true;
        else return false;
      case 'I2':
        if (korLine == '인천2호선') return true;
        else return false;
      case 'K':
        if (korLine == '경의선') return true;
        else return false;
      case 'KK':
        if (korLine == '경강선') return true;
        else return false;
      case 'S':
        if (korLine == '신분당선') return true;
        else return false;
      case 'SU':
        if (korLine == '수인선') return true;
        else return false;
      case 'U':
        if (korLine == '의정부경전철') return true;
        else return false;
      case 'UI':
        if (korLine == '우이신설경전철') return true;
        else return false;
    }
  }

  function changeLineName(line) {
    for (let i = 0; i < line.length; i++) {
      for (let j = 0; j < line[i].length; j++) {
        switch (line[i][j]) {
          case '1':
            line[i][j] = '1호선';
            break;
          case '2':
            line[i][j] = '2호선';
            break;
          case '3':
            line[i][j] = '3호선';
            break;
          case '4':
            line[i][j] = '4호선';
            break;
          case '5':
            line[i][j] = '5호선';
            break;
          case '6':
            line[i][j] = '6호선';
            break;
          case '7':
            line[i][j] = '7호선';
            break;
          case '8':
            line[i][j] = '8호선';
            break;
          case '9':
            line[i][j] = '9호선';
            break;
          case 'A':
            line[i][j] = '공항철도';
            break;
          case 'B':
            line[i][j] = '분당선';
            break;
          case 'E':
            line[i][j] = '용인경전철';
            break;
          case 'G':
            line[i][j] = '경춘선';
            break;
          case 'I':
            line[i][j] = '인천1호선';
            break;
          case 'I2':
            line[i][j] = '인천2호선';
            break;
          case 'K':
            line[i][j] = '경의선';
            break;
          case 'KK':
            line[i][j] = '경강선';
            break;
          case 'S':
            line[i][j] = '신분당선';
            break;
          case 'SU':
            line[i][j] = '수인선';
            break;
          case 'U':
            line[i][j] = '의정부경전철';
            break;
          case 'UI':
            line[i][j] = '우이신설경전철';
        }
      }
    }
    return line;
  }

  function getStationTime(station, day, arrow, nowMinTime, line) {
    const config = require('config');
    const baseURL = config.get("baseUrl");
    const console = require('console');
    const http = require('http');
    const fail = require('fail');
    let url = baseURL + api + '/json/' + service + '/1/800/' + station + '/' + day + '/' + arrow + '/';
    const json = http.getUrl(url, {
      format: "json",
      cacheTime: 0,
      returnHeaders: true
    });
    const timeSchedule = json.parsed.SearchSTNTimeTableByIDService.row;
    for (let i = 0; i < timeSchedule.length; i++) {
      var arriveTime = changeTime(timeSchedule[i].ARRIVETIME);
      var leftTime = changeTime(timeSchedule[i].LEFTTIME);
      var apiLine = timeSchedule[i].LINE_NUM;

      if (leftTime > nowMinTime && matchLine(line, apiLine) && leftTime != 0) {
        let resultTime = timeSchedule[i].LEFTTIME;
        let resultTrain = timeSchedule[i].TRAIN_NO;

        return {
          resultTime: resultTime,
          resultTrain: resultTrain
        };
      }
    }
    return null;
  }

  function findSameTrain(station, day, arrow, time, train) {
    const config = require('config');
    const baseURL = config.get("baseUrl");
    const console = require('console');
    const http = require('http');
    const fail = require('fail');
    let url = baseURL + api + '/json/' + service + '/1/800/' + station + '/' + day + '/' + arrow + '/';
    const json = http.getUrl(url, {
      format: "json",
      cacheTime: 0,
      returnHeaders: true
    });
    const timeSchedule = json.parsed.SearchSTNTimeTableByIDService.row;
    for (let i = 0; i < timeSchedule.length; i++) {
      var arriveTime = changeTime(timeSchedule[i].ARRIVETIME);
      if (arriveTime > time && timeSchedule[i].TRAIN_NO == train && arriveTime != 0) {
        resultTime = timeSchedule[i].ARRIVETIME;
        return resultTime;
      }
    }
    return false;
  }

  function getResultTime(start, end, line, times, j, beforeTime) {
    var res = times;
    for (let i = 1; i < 3; i++) {
      var startTime = getStationTime(start, '1', i, (j == 0) ? nowMinTime : changeTime(beforeTime), line);
      var endTime = findSameTrain(end, '1', i, changeTime(startTime.resultTime), startTime.resultTrain);
      if (endTime != false) {
        //          console.log(startTime);
        //          console.log(endTime);
        //         console.log('\n');
        res[j].push(startTime.resultTime);
        res[j].push(endTime);
        return res;
      };
    }
  }

  function splitTime(path) {
    let resultPath = splitPath(path).resultPath;
    let resultLine = splitPath(path).resultLine;
    var result;
    var times = [
      [],
      [],
      [],
      [],
      []
    ];

    for (let i = 0; i < resultLine.length; i++) {
      var startStationCode = matchStation(resultPath[i][0], resultLine[i][0]);
      var endStationCode = matchStation(resultPath[i][resultPath[i].length - 1], resultLine[i][resultLine[i].length - 1]);
      var beforeTime;
      if (i == 0)
        beforeTime = false;
      else
        beforeTime = times[i - 1][1];

      var result = getResultTime(startStationCode, endStationCode, resultLine[i][0], times, i, beforeTime);
    }
    let totalTime = changeTime(times[resultLine.length - 1][1]) - changeTime(times[0][0]);
    //  setTimeout(() => {console.log(result)}, 2000);
    return {
      result: result,
      totalTime: totalTime
    };
  }

  var g = new Graph();
  g.addVertex(graphData);

  let path = g.shortestPath(String(startPoint), String(endPoint)).concat([String(startPoint)]).reverse();
  let res = splitPath(path);
  let split = res.resultPath;
  let split2 = split;
  let line = res.resultLine;
  let korLine = changeLineName(line)
  let setTime = splitTime(path);
  let time = setTime.result;
  let totalTime = setTime.totalTime;

  var result = [];

  for (let i = 0; i < split2.length; i++) {
    var result_in = {};
    result_in['line'] = korLine[i][0];
    result_in['startTime'] = noSecond(minusTime(changeTime(time[i][0])));
    result_in['path'] = split2[i];
    result_in['endTime'] = noSecond(noMinusTime(changeTime(time[i][1])));
    result_in['startStation'] = split2[i][0];
    result_in['endStation'] = split2[i][split2[i].length - 1];
    result.push(result_in);
    console.log(date);
  }

  return result;
}