'use strict';

const WATER_TANK_LEVEL_CHARACTERISTIC_UUID = '39e1f90784a811e2afba0002a5d5c51b';

// const WATER_TANK_CAPACITY_CHARACTERISTIC_UUID = '39e1fe0584a811e2afba0002a5d5c51b';
// const WATER_TANK_ISAVAILABLE_CHARACTERISTIC_UUID = '39e1fe0684a811e2afba0002a5d5c51b';
const WATERING_MODE_CHARACTERISTIC_UUID = '39e1f90d84a811e2afba0002a5d5c51b';
const WATERING_ALGORITHM_STATUS_CHARACTERISTIC_UUID = '39e1f91284a811e2afba0002a5d5c51b';
// const NEXT_EMPTY_TANK_DATE_CHARACTERISTIC_UUID = '39e1fd8784a811e2afba0002a5d5c51b';
// const NEXT_WATERING_DATE_CHARACTERISTIC_UUID = '39e1fd8884a811e2afba0002a5d5c51b';
// const FULL_TANK_AUTONOMY_CHARACTERISTIC_UUID = '39e1fd8984a811e2afba0002a5d5c51b';

class RetrieveWateringStatusTask {
  constructor() {
  }

  async execute(device) {
    const zero = Buffer.alloc(4);

    const waterTankLevel = (await device.readCharacteristic(WATER_TANK_LEVEL_CHARACTERISTIC_UUID, zero)).readUInt8();
    const wateringMode = (await device.readCharacteristic(WATERING_MODE_CHARACTERISTIC_UUID, zero)).readUInt8();
    const wateringStatus = (await device.readCharacteristic(WATERING_ALGORITHM_STATUS_CHARACTERISTIC_UUID, zero)).readUInt8();

    // const rawWaterTankCapacity = await device.readCharacteristic(WATER_TANK_CAPACITY_CHARACTERISTIC_UUID, zero);
    // const rawWaterTankIsAvailable = await device.readCharacteristic(WATER_TANK_ISAVAILABLE_CHARACTERISTIC_UUID, zero);

    // const rawNextEmptDate = await device.readCharacteristic(NEXT_EMPTY_TANK_DATE_CHARACTERISTIC_UUID, zero);
    // const rawNextWateringDate = await device.readCharacteristic(NEXT_WATERING_DATE_CHARACTERISTIC_UUID, zero);
    // const rawFullTankAutonomyDate = await device.readCharacteristic(FULL_TANK_AUTONOMY_CHARACTERISTIC_UUID, zero);

    // TODO: Add tank capacity
    // TODO: is_available?

    // TODO: Next empty tank date
    // TODO: Next watering date
    // TODO: Full tank autonomy

    return {
      waterLevel: waterTankLevel,
      wateringMode: this._convertWateringMode(wateringMode),
      wateringStatus: this._convertWateringAlgorithmStatus(wateringStatus),
      hasWateringError: this._isErrorStatus(wateringStatus),
      isWatering: this._isWatering(wateringStatus)
    };
  }

  _convertWateringMode(mode) {
    const MODES = [
      'Manual',
      'Auto',
      'Vacation'
    ];

    return MODES[mode];
  }

  _convertWateringAlgorithmStatus(status) {
    const STATUS = [
      'Initializing',
      'Ready',
      'Watering',
      'Error: No water',
      'Error: In Air',
      'Error: VWC Still',
      'Error: Internal'
    ];

    return STATUS[status];
  }

  _isErrorStatus(status) {
    return status >= 3;
  }

  _isWatering(status) {
    return status === 2;
  }
}

module.exports = RetrieveWateringStatusTask;