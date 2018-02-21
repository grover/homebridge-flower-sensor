
'use strict';

const debug = require('debug')('flower:ble');

const BleUtils = require('../ble/BleUtils');

const FLOWER_POWER_LIVE_SERVICE_UUID = '39e1fa0084a811e2afba0002a5d5c51b';

const FLOWER_POWER_LED_CHARACTERISTIC_UUID = '39e1fa0784a811e2afba0002a5d5c51b';

class WriteLedStateTask {
  constructor(state) {
    this._state = state;
  }

  async execute(peripheral) {
    const [service] = await BleUtils.discoverServices(peripheral, [FLOWER_POWER_LIVE_SERVICE_UUID]);
    debug('Discovered flower power live service');

    const [led] =
      await BleUtils.discoverCharacteristics(service, [FLOWER_POWER_LED_CHARACTERISTIC_UUID]);
    debug('Discovered flower power LED characteristic');

    const value = this._state ? 0x01 : 0x00;

    await BleUtils.writeCharacteristic(led, new Buffer([value]));

    return {};
  }
}

module.exports = WriteLedStateTask;