
'use strict';

const BleUtils = require('./BleUtils');

const MODEL_CHARACTERISTIC = '2a24';
const SERIAL_NUMBER_CHARACTERISTIC = '2a25';
const FIRMWARE_VERSION_CHARACTERISTIC = '2a26';
const HARDWARE_VERSION_CHARACTERISTIC = '2a27';
const SOFTWARE_VERSION_CHARACTERISTIC = '2a28';
const MANUFACTURER_CHARACTERISTIC = '2a29';

class RetrieveDeviceInformationTask {
  constructor() {
  }

  async execute(device) {
    return {
      name: device.name,
      manufacturer: await BleUtils.readString(device, MANUFACTURER_CHARACTERISTIC),
      model: await BleUtils.readString(device, MODEL_CHARACTERISTIC),
      serial: await BleUtils.readString(device, SERIAL_NUMBER_CHARACTERISTIC),
      firmwareRevision: await BleUtils.readString(device, FIRMWARE_VERSION_CHARACTERISTIC),
      softwareVersion: await BleUtils.readString(device, SOFTWARE_VERSION_CHARACTERISTIC),
      hardwareRevision: await BleUtils.readString(device, HARDWARE_VERSION_CHARACTERISTIC)
    };
  }
}

module.exports = RetrieveDeviceInformationTask;