
'use strict';

const debug = require('debug')('flower:ble');

const BleUtils = require('../ble/BleUtils');

const FLOWER_POWER_LIVE_SERVICE_UUID = '39e1fa0084a811e2afba0002a5d5c51b';
const LAST_MOVE_DATE_UUID = '39e1fa0884a811e2afba0002a5d5c51b';

const CLOCK_SERVICE_UUID = '39e1fd0084a811e2afba0002a5d5c51b';
const CLOCK_CURRENT_TIME_UUID = '39e1fd0184a811e2afba0002a5d5c51b';

class RetrieveTimestampsTask {

  constructor() {
  }

  async execute(peripheral) {
    const [liveService, clockService] = await BleUtils.discoverServices(peripheral, [FLOWER_POWER_LIVE_SERVICE_UUID, CLOCK_SERVICE_UUID]);
    debug('Discovered flower power live and clock service');

    const [lastMoveDateCharacteristic] =
      await BleUtils.discoverCharacteristics(liveService, [LAST_MOVE_DATE_UUID]);

    const [currentTimeCharacteristic] =
      await BleUtils.discoverCharacteristics(clockService, [CLOCK_CURRENT_TIME_UUID]);
    debug('Discovered characteristics');

    let lastMoveDate = undefined;
    let currentTime = undefined;

    if (lastMoveDateCharacteristic) {
      lastMoveDate = await BleUtils.readCharacteristic(lastMoveDateCharacteristic);
      lastMoveDate = lastMoveDate.readUInt32LE(0);
    }

    if (currentTimeCharacteristic) {
      currentTime = await BleUtils.readCharacteristic(currentTimeCharacteristic);
      currentTime = currentTime.readUInt32LE(0);
    }

    return {
      lastMoved: lastMoveDate,
      uptime: currentTime
    };
  }
}

module.exports = RetrieveTimestampsTask;