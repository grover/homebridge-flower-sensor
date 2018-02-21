
'use strict';

const debug = require('debug')('flower:ble');

const BleUtils = require('./BleUtils');

class RetrieveBatteryLevelTask {
  constructor() {
  }

  async execute(peripheral) {
    const [service] = await BleUtils.discoverServices(peripheral, ['180f']);
    debug('Discovered battery level service');

    const [level] =
      await BleUtils.discoverCharacteristics(service, ['2a19']);
    debug('Discovered level characteristic');

    return {
      level: await BleUtils.readUInt8(level)
    };
  }
}

module.exports = RetrieveBatteryLevelTask;