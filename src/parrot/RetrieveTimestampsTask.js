'use strict';

const LAST_MOVE_DATE_UUID = '39e1fa0884a811e2afba0002a5d5c51b';
const CLOCK_CURRENT_TIME_UUID = '39e1fd0184a811e2afba0002a5d5c51b';

class RetrieveTimestampsTask {

  constructor() {
  }

  async execute(device) {
    let lastMoveDate = await device.readCharacteristic(LAST_MOVE_DATE_UUID, Buffer.from([0, 0, 0, 0]));
    let currentTime = await device.readCharacteristic(CLOCK_CURRENT_TIME_UUID);

    return {
      lastMoved: lastMoveDate.readUInt32LE(0),
      uptime: currentTime.readUInt32LE(0)
    };
  }
}

module.exports = RetrieveTimestampsTask;