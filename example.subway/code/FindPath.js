module.exports.function = function findPath(startPoint, endPoint, wishTime, mak) {
  const config = require('config');
  const baseURL = config.get("baseUrl");
  const console = require('console');
  const http = require('http');
  const fail = require('fail');

  const api = '59726d4b58736b79343548564e7141';
  const service = 'SearchSTNTimeTableByIDService';

  const graphData = require("./station.js");
  const stationData = require("./vertices.js");

  var Graph = (function (undefined) {

    var extractKeys = function (obj) {
      var keys = [],
        key;
      for (key in obj) {
        Object.prototype.hasOwnProperty.call(obj, key) && keys.push(key);
      }
      return keys;
    }

    var sorter = function (a, b) {
      return parseFloat(a) - parseFloat(b);
    }

    var findPaths = function (map, start, end, infinity) {
      infinity = infinity || Infinity;

      var costs = {},
        open = {
          '0': [start]
        },
        predecessors = {},
        keys;

      var addToOpen = function (cost, vertex) {
        var key = "" + cost;
        if (!open[key]) open[key] = [];
        open[key].push(vertex);
      }

      costs[start] = 0;

      while (open) {
        if (!(keys = extractKeys(open)).length) break;

        keys.sort(sorter);

        var key = keys[0],
          bucket = open[key],
          node = bucket.shift(),
          currentCost = parseFloat(key),
          adjacentNodes = map[node] || {};

        if (!bucket.length) delete open[key];

        for (var vertex in adjacentNodes) {
          if (Object.prototype.hasOwnProperty.call(adjacentNodes, vertex)) {
            var cost = adjacentNodes[vertex],
              totalCost = cost + currentCost,
              vertexCost = costs[vertex];

            if ((vertexCost === undefined) || (vertexCost > totalCost)) {
              costs[vertex] = totalCost;
              addToOpen(totalCost, vertex);
              predecessors[vertex] = node;
            }
          }
        }
      }

      if (costs[end] === undefined) {
        return null;
      } else {
        return predecessors;
      }

    }

    var extractShortest = function (predecessors, end) {
      var nodes = [],
        u = end;

      while (u !== undefined) {
        nodes.push(u);
        u = predecessors[u];
      }

      nodes.reverse();
      return nodes;
    }

    var findShortestPath = function (map, nodes) {
      var start = nodes.shift(),
        end,
        predecessors,
        path = [],
        shortest;

      while (nodes.length) {
        end = nodes.shift();
        predecessors = findPaths(map, start, end);

        if (predecessors) {
          shortest = extractShortest(predecessors, end);
          if (nodes.length) {
            path.push.apply(path, shortest.slice(0, -1));
          } else {
            return path.concat(shortest);
          }
        } else {
          return null;
        }

        start = end;
      }
    }

    var toArray = function (list, offset) {
      try {
        return Array.prototype.slice.call(list, offset);
      } catch (e) {
        var a = [];
        for (var i = offset || 0, l = list.length; i < l; ++i) {
          a.push(list[i]);
        }
        return a;
      }
    }

    var Graph = function (map) {
      this.map = map;
    }

    Graph.prototype.findShortestPath = function (start, end) {
      if (Object.prototype.toString.call(start) === '[object Array]') {
        return findShortestPath(this.map, start);
      } else if (arguments.length === 2) {
        return findShortestPath(this.map, [start, end]);
      } else {
        return findShortestPath(this.map, toArray(arguments));
      }
    }

    Graph.findShortestPath = function (map, start, end) {
      if (Object.prototype.toString.call(start) === '[object Array]') {
        return findShortestPath(map, start);
      } else if (arguments.length === 3) {
        return findShortestPath(map, [start, end]);
      } else {
        return findShortestPath(map, toArray(arguments, 1));
      }
    }

    return Graph;

  })();

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

  var plusTime = typeof (wishTime) === 'undefined' ? 0 : wishTime;
  var date = new Date();
  var utcTime = Number(date.getHours()) * 60 + Number(date.getMinutes()) + plusTime;
  var nowMinTime = (utcTime + 540) % 1440;

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
    } else
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
    var res = [
      [],
      [],
      [],
      [],
      []
    ];
    for (let i = 0; i < line.length; i++) {
      for (let j = 0; j < line[i].length; j++) {
        switch (line[i][j]) {
          case '1':
            res[i][j] = '1호선';
            break;
          case '2':
            res[i][j] = '2호선';
            break;
          case '3':
            res[i][j] = '3호선';
            break;
          case '4':
            res[i][j] = '4호선';
            break;
          case '5':
            res[i][j] = '5호선';
            break;
          case '6':
            res[i][j] = '6호선';
            break;
          case '7':
            res[i][j] = '7호선';
            break;
          case '8':
            res[i][j] = '8호선';
            break;
          case '9':
            res[i][j] = '9호선';
            break;
          case 'A':
            res[i][j] = '공항철도';
            break;
          case 'B':
            res[i][j] = '분당선';
            break;
          case 'E':
            res[i][j] = '용인경전철';
            break;
          case 'G':
            res[i][j] = '경춘선';
            break;
          case 'I':
            res[i][j] = '인천1호선';
            break;
          case 'I2':
            res[i][j] = '인천2호선';
            break;
          case 'K':
            res[i][j] = '경의선';
            break;
          case 'KK':
            res[i][j] = '경강선';
            break;
          case 'S':
            res[i][j] = '신분당선';
            break;
          case 'SU':
            res[i][j] = '수인선';
            break;
          case 'U':
            res[i][j] = '의정부경전철';
            break;
          case 'UI':
            res[i][j] = '우이신설경전철';
        }
      }
    }
    return res;
  }

  function getStationTime(j, arrow, nowMinTime, line) {

    for (let i = 0; i < timeSchedule[j][0][arrow - 1].length; i++) {
      var arriveTime = changeTime(timeSchedule[j][0][arrow - 1][i].ARRIVETIME);
      var leftTime = changeTime(timeSchedule[j][0][arrow - 1][i].LEFTTIME);
      var apiLine = timeSchedule[j][0][arrow - 1][i].LINE_NUM;
      var fastLine = timeSchedule[j][0][arrow - 1][i].EXPRESS_YN;

      if (leftTime > nowMinTime && matchLine(line, apiLine) && leftTime != 0) {
        let resultTime = timeSchedule[j][0][arrow - 1][i].LEFTTIME;
        let resultTrain = timeSchedule[j][0][arrow - 1][i].TRAIN_NO;
        return {
          resultTime: resultTime,
          resultTrain: resultTrain,
          fastLine: fastLine
        };
      }
    }
    return false;
  }

  function findSameTrain(j, arrow, time, train) {

    for (let i = 0; i < timeSchedule[j][1][arrow - 1].length; i++) {
      var arriveTime = changeTime(timeSchedule[j][1][arrow - 1][i].ARRIVETIME);
      if (arriveTime > time && timeSchedule[j][1][arrow - 1][i].TRAIN_NO == train && arriveTime != 0) {
        resultTime = timeSchedule[j][1][arrow - 1][i].ARRIVETIME;
        return resultTime;
      }
    }
    return false;
  }

  function setDay(day) {
    if (utcTime + 540 >= 1440) {
      if (day == 6)
        day = 0;
      else
        day = day + 1;
    }
    return day;
  }

  function nowDay(day) {
    switch (day) {
      case 1:
      case 2:
      case 3:
      case 4:
      case 5:
        return '1';
      case 6:
        return '2';
      case 0:
        return '3';
    }
  }

  function getResultTime(line, times, j, beforeTime, resFastLine, nowMinTime) {
    var res = times;
    while (1) {
      for (let i = 1; i < 3; i++) {
        var startTime = getStationTime(j, i, (j == 0) ? nowMinTime : changeTime(beforeTime), line);
        if (startTime == false) continue;
        var endTime = findSameTrain(j, i, changeTime(startTime.resultTime), startTime.resultTrain);
        if (endTime != false) {
          res[j].push(startTime.resultTime);
          res[j].push(endTime);
          resFastLine[j].push(startTime.fastLine);
          return {
            res: res,
            resFastLine: resFastLine
          };
        };
        nowMinTime++;
      }
    }
  }

  function getStationInfo(station, day, arrow) {

    let url = baseURL + api + '/json/' + service + '/1/800/' + station + '/' + day + '/' + arrow + '/';
    const json = http.getUrl(url, {
      format: "json",
      cacheTime: 0,
      returnHeaders: true
    });
    const timeSchedule = json.parsed.SearchSTNTimeTableByIDService.row;

    return timeSchedule;
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
    var resFastLine = [
      [],
      [],
      [],
      [],
      []
    ];

    for (let i = 0; i < resultLine.length; i++) {
      var startStationCode = matchStation(resultPath[i][0], resultLine[i][0]);
      var endStationCode = matchStation(resultPath[i][resultPath[i].length - 1], resultLine[i][resultLine[i].length - 1]);


      for (let a = 0; a <= 1; a++) {
        timeSchedule[i][0][a] = getStationInfo(startStationCode, nowDay(setDay(date.getDay())), a + 1);
        timeSchedule[i][1][a] = getStationInfo(endStationCode, nowDay(setDay(date.getDay())), a + 1);
      }
    }
    for (let i = 0; i < resultLine.length; i++) {
      var startStationCode = matchStation(resultPath[i][0], resultLine[i][0]);
      var endStationCode = matchStation(resultPath[i][resultPath[i].length - 1], resultLine[i][resultLine[i].length - 1]);
      var beforeTime;
      if (i == 0)
        beforeTime = false;
      else
        beforeTime = times[i - 1][1];

      var result = getResultTime(resultLine[i][0], times, i, beforeTime, resFastLine, nowMinTime);
    }
    console.log(result);
    let totalTime = changeTime(times[resultLine.length - 1][1]) - changeTime(times[0][0]);
    //  setTimeout(() => {console.log(result)}, 2000);
    return {
      result: result,
      totalTime: totalTime
    };
  }

  var timeSchedule = [
    [
      [{}, {}],
      [{}, {}]
    ],
    [
      [{}, {}],
      [{}, {}]
    ],
    [
      [{}, {}],
      [{}, {}]
    ],
    [
      [{}, {}],
      [{}, {}]
    ],
    [
      [{}, {}],
      [{}, {}]
    ]
  ];

  var graph = new Graph(graphData);
  let path = graph.findShortestPath(String(startPoint), String(endPoint));
  let res = splitPath(path);
  let split = res.resultPath;
  let split2 = split;
  let engline = res.resultLine;
  let korLine = changeLineName(engline);
  let setTime = splitTime(path);
  let time = setTime.result.res;
  let fastLine = setTime.result.resFastLine;
  let totalTime = setTime.totalTime;

  var result = [];

  for (let i = 0; i < split2.length; i++) {
    var result_in = {};
    result_in['imgLine'] = engline[i][0];
    result_in['line'] = korLine[i][0];
    result_in['startTime'] = noSecond(minusTime(changeTime(time[i][0])));
    result_in['path'] = split2[i];
    result_in['endTime'] = noSecond(noMinusTime(changeTime(time[i][1])));
    if (fastLine[i][0] == 'G') {
      result_in['startStation'] = split2[i][0];
      result_in['endStation'] = split2[i][split2[i].length - 1];
    } else {
      result_in['startStation'] = split2[i][0] + '(급)';
      result_in['endStation'] = split2[i][split2[i].length - 1] + '(급)';
    }
    result_in['totalTime'] = totalTime;
    result.push(result_in);
  }
  return result;
}