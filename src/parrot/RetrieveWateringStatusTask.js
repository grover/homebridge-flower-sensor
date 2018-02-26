'use strict';

const WATER_TANK_LEVEL_CHARACTERISTIC_UUID = '39e1f90784a811e2afba0002a5d5c51b';

class RetrieveWateringStatusTask {
  constructor() {
  }

  async execute(device) {
    const rawWaterTankLevel = await device.readCharacteristic(WATER_TANK_LEVEL_CHARACTERISTIC_UUID);
    // TODO: Add tank capacity
    // TODO: is_available?
    // TODO: Add watering mode
    // TODO: Next empty tank date
    // TODO: Next watering date
    // TODO: Full tank autonomy

    return {
      waterLevel: rawWaterTankLevel.readUInt8(),
    };
  }
}

module.exports = RetrieveWateringStatusTask;