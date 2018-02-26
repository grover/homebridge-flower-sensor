'use strict';

const WATERING_CMD_CHARACTERISTIC_UUID = '39e1f90684a811e2afba0002a5d5c51b';

class WaterPlantTask {
  constructor() {
  }

  async execute(device) {
    const cmd = Buffer.alloc(2);
    cmd.writeUInt16LE(0x08);

    await device.writeCharacteristic(WATERING_CMD_CHARACTERISTIC_UUID, cmd);
    return {
    };
  }
}

module.exports = WaterPlantTask;