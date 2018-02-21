
'use strict';

const debug = require('debug')('flower:ble');

const BleUtils = require('./BleUtils');

class RetrieveDeviceInformationTask {
  constructor() {
  }

  async execute(peripheral) {
    const [service] = await BleUtils.discoverServices(peripheral, ['180a']);
    debug('Discovered device information service');

    const [model, serial, fwversion, hwversion, swversion, manufacturer] =
      await BleUtils.discoverCharacteristics(service, ['2a24', '2a25', '2a26', '2a27', '2a28', '2a29']);
    debug('Discovered device information characteristics');

    return {
      name: peripheral.advertisement.localName,
      manufacturer: await BleUtils.readString(manufacturer),
      model: await BleUtils.readString(model),
      serial: await BleUtils.readString(serial),
      firmwareRevision: await BleUtils.readString(fwversion),
      softwareVersion: await BleUtils.readString(swversion),
      hardwareRevision: await BleUtils.readString(hwversion)
    };
  }
}

module.exports = RetrieveDeviceInformationTask;