'use strict';

class RetrieveBatteryLevelTask {
  constructor() {
  }

  async execute(device) {
    const level = await device.readCharacteristic('2a19', Buffer.from([0]));
    return {
      level: level.readUInt8()
    };
  }
}

module.exports = RetrieveBatteryLevelTask;
