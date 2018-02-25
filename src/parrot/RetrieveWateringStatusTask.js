
'use strict';

const debug = require('debug')('flower:ble');

const BleUtils = require('../ble/BleUtils');

const POT_WATERING_SERVICE_UUID = '39e1f90084a811e2afba0002a5d5c51b';

/** 
 * Must keep these sorted as they're used sorted.
 */
const WateringCharacteristics = [
  '39e1f90784a811e2afba0002a5d5c51b' // WATER_TANK_LEVEL_CHARACTERISTIC_UUID
];

class RetrieveWateringStatusTask {
  constructor() {
  }

  async execute(peripheral) {
    const [service] = await BleUtils.discoverServices(peripheral, [POT_WATERING_SERVICE_UUID]);
    debug('Discovered flower power watering service');

    const [tankLevel] =
      await BleUtils.discoverCharacteristics(service, WateringCharacteristics);
    debug('Discovered characteristics');

    const rawWaterTankLevel = await BleUtils.readCharacteristic(tankLevel);

    return {
      waterLevel: rawWaterTankLevel.readUInt8(),
    };
  }
}

module.exports = RetrieveWateringStatusTask;