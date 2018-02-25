'use strict';

const FlowerPower = require('./parrot/FlowerPower');
const Pot = require('./parrot/Pot');

function isSupportedDevice(advertisement) {
  return FlowerPower.isFlowerPowerAdvertisement(advertisement)
    || Pot.isPotAdvertisement(advertisement);
}

function createDevice(executor, peripheral) {
  if (FlowerPower.isFlowerPowerAdvertisement(peripheral.advertisement)) {
    return FlowerPower.createDevice(executor, peripheral);
  }

  if (Pot.isPotAdvertisement(peripheral.advertisement)) {
    return Pot.createDevice(executor, peripheral);
  }

  throw new Error('Unsupported device');
}

module.exports = {
  isSupportedDevice: isSupportedDevice,
  createDevice: createDevice
};