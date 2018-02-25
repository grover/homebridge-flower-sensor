'use strict';

const FLOWER_POWER_LED_CHARACTERISTIC_UUID = '39e1fa0784a811e2afba0002a5d5c51b';

class WriteLedStateTask {
  constructor(state) {
    this._state = state;
  }

  async execute(device) {
    const value = this._state ? 0x01 : 0x00;
    await device.writeCharacteristic(FLOWER_POWER_LED_CHARACTERISTIC_UUID, new Buffer([value]));
    return {};
  }
}

module.exports = WriteLedStateTask;