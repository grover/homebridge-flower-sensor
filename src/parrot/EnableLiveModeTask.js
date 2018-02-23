
'use strict';

const debug = require('debug')('flower:ble');
const util = require('util');

const BleUtils = require('../ble/BleUtils');

const FLOWER_POWER_LIVE_SERVICE_UUID = '39e1fa0084a811e2afba0002a5d5c51b';

class EnableLiveModeTask {
  constructor(period) {
    this._period = period;
  }

  async execute(peripheral) {
    const [service] = await BleUtils.discoverServices(peripheral, [FLOWER_POWER_LIVE_SERVICE_UUID]);
    debug('Discovered flower power live service');

    const LiveCharacteristics = [
      '39e1fa0384a811e2afba0002a5d5c51b', // FLOWER_POWER_SOIL_TEMP_CHARACTERISTIC_UUID (not calibrated)
      '39e1fa0684a811e2afba0002a5d5c51b', // FLOWER_POWER_LIVE_MODE_CHARACTERISTIC_UUID
      '39e1fa0984a811e2afba0002a5d5c51b', // FLOWER_POWER_SOIL_VWC_CHARACTERISTIC_UUID
      '39e1fa0a84a811e2afba0002a5d5c51b', // FLOWER_POWER_AIR_TEMP_CHARACTERISTIC_UUID
      '39e1fa0b84a811e2afba0002a5d5c51b', // FLOWER_POWER_LIGHT_LEVEL_CHARACTERISTIC_UUID
    ];

    const [soilTemp, led, soilMoisture, airTemp, lightLevel] =
      await BleUtils.discoverCharacteristics(service, LiveCharacteristics);
    debug('Discovered flower power live mode characteristic');

    await Promise.all([soilTemp, soilMoisture, airTemp, lightLevel].map(async c => {
      c.addListener('data', (data, isNotification) => {
        debug(`Received from ${c.uuid}: isNotification=${isNotification} data=${util.inspect(data)}`);
      });

      await BleUtils.subscribe(c);
      debug(`Subscribed to ${c.uuid}`);
    }));

    await BleUtils.writeCharacteristic(led, new Buffer([this._period]));

    setTimeout(async () => {
      try {
        await BleUtils.writeCharacteristic(led, new Buffer([0]));
      }
      catch (e) {
        debug(`${util.inspect(e)}`);
      }
    }, 2 * 60 * 1000);

    return {};
  }
}

module.exports = EnableLiveModeTask;
