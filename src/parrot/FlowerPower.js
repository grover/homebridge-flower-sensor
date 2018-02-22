'use strict';

const FLOWER_POWER_LIVE_SERVICE_UUID = '39e1fa0084a811e2afba0002a5d5c51b';

// const FLOWER_POWER_SOIL_EC_CHARACTERISTIC_UUID = '39e1fa0284a811e2afba0002a5d5c51b';
// const FLOWER_POWER_LAST_MOVE_CHARACTERISTIC_UUID = '39e1fa0884a811e2afba0002a5d5c51b';

const FlowerPowerTypes = [
  'Dongle',
  'Flower Power',
  'H2O',
  'Pot'
];

const FlowerPowerColor = [
  'Unknown',
  'Brown',
  'Esmerald',
  'Lemon',
  'Gray Brown',
  'Gray Green',
  'Classic Green',
  'Gray Blue'
];

function getDeviceInformation(manufacturerData) {
  const deviceInfo = {
    generation: 1,
    type: 'Flower Power',
    color: 'Unknown'
  };

  if (manufacturerData && manufacturerData.length == 5) {
    deviceInfo.generation = 2;
    deviceInfo.companyIdentifier = manufacturerData.readUInt16LE(0);
    deviceInfo.dataVersion = manufacturerData[2];
    deviceInfo.type = FlowerPowerTypes[manufacturerData[3] & 0x0F];
    deviceInfo.color = FlowerPowerColor[(manufacturerData[3] & 0xF0) >> 4];
  }

  return deviceInfo;
}

function isFlowerPowerAdvertisement(advertisement) {
  // Check for the live service in the advertisement data
  return advertisement.serviceUuids && advertisement.serviceUuids.includes(FLOWER_POWER_LIVE_SERVICE_UUID);
}

function getDeviceStatus(manufacturerData) {
  const UNREAD_ENTRIES_MASK = 0x01;
  const DEVICE_MOVED_MASK = 0x02;
  const DEVICE_STARTED_MASK = 0x04;
  const DEVICE_LOW_WATER_MASK = 0x08;
  const DEVICE_LOW_BATTERY_MASK = 0x10;
  const DEVICE_WATERING_NEEDED_MASK = 0x20;

  const deviceStatus = {
    unreadEntries: false,
    moved: false,
    started: false,
    lowWater: false,
    lowBattery: false,
    wateringNeeded: false
  };

  if (manufacturerData.length == 5) {
    deviceStatus.unreadEntries = (manufacturerData[4] & UNREAD_ENTRIES_MASK) === UNREAD_ENTRIES_MASK;
    deviceStatus.moved = (manufacturerData[4] & DEVICE_MOVED_MASK) === DEVICE_MOVED_MASK;
    deviceStatus.started = (manufacturerData[4] & DEVICE_STARTED_MASK) === DEVICE_STARTED_MASK;
    deviceStatus.lowWater = (manufacturerData[4] & DEVICE_LOW_WATER_MASK) === DEVICE_LOW_WATER_MASK;
    deviceStatus.lowBattery = (manufacturerData[4] & DEVICE_LOW_BATTERY_MASK) === DEVICE_LOW_BATTERY_MASK;
    deviceStatus.wateringNeeded = (manufacturerData[4] & DEVICE_WATERING_NEEDED_MASK) === DEVICE_WATERING_NEEDED_MASK;
  }
  else {
    // TODO: Gen. 1 device?
  }

  return deviceStatus;
}

module.exports = {
  isFlowerPowerAdvertisement: isFlowerPowerAdvertisement,
  getDeviceInformation: getDeviceInformation,
  getDeviceStatus: getDeviceStatus
};