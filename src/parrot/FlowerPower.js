'use strict';

const FLOWER_POWER_LIVE_SERVICE_UUID = '39e1fa0084a811e2afba0002a5d5c51b';

// const FLOWER_POWER_SOIL_EC_CHARACTERISTIC_UUID = '39e1fa0284a811e2afba0002a5d5c51b';
// const FLOWER_POWER_LAST_MOVE_CHARACTERISTIC_UUID = '39e1fa0884a811e2afba0002a5d5c51b';

function isFlowerPowerAdvertisement(advertisement) {
  // Check for the live service in the advertisement data
  return advertisement.serviceUuids && advertisement.serviceUuids.includes(FLOWER_POWER_LIVE_SERVICE_UUID);
}

module.exports = {
  isFlowerPowerAdvertisement: isFlowerPowerAdvertisement,
};