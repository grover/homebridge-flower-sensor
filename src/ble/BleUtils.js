'use strict';

const util = require('util');

const debug = require('debug')('flower:ble');

function discoverServices(peripheral, serviceUuids) {
  return new Promise((resolve, reject) => {
    peripheral.discoverServices(serviceUuids, (error, services) => {
      if (error) {
        debug('Failed to discover the device information service.');
        reject(error);
        return;
      }

      resolve(services);
    });
  });
}

function discoverCharacteristics(service, characteristics) {
  return new Promise((resolve, reject) => {
    service.discoverCharacteristics(characteristics, (error, result) => {
      if (error) {
        debug('Failed to discover the characteristics for the device information service.');
        reject(error);
        return;
      }

      resolve(result);
    });
  });
}

function createTimeoutPromise(timeout) {
  return new Promise((resolve, reject) => {
    setTimeout(() => reject(new Error('Request timed out.')), timeout);
  });
}

function readCharacteristic(characteristic) {
  return Promise.race([
    new Promise((resolve, reject) => {
      debug(`Reading ${characteristic.uuid}`);
      characteristic.read((error, data) => {
        if (error) {
          debug(`Failed to read characteristic: ${characteristic.uuid}, error ${util.inspect(error)}`);
          reject(error);
          return;
        }

        debug(`Retrieved ${characteristic.uuid}: ${util.inspect(data)}`);
        resolve(data);
      });
    }),
    createTimeoutPromise(3000)
  ]);
}

function writeCharacteristic(characteristic, value) {
  return Promise.race([
    new Promise((resolve, reject) => {
      debug(`Writing ${value} to ${characteristic.uuid}`);

      const withoutResponse =
        (characteristic.properties.indexOf('writeWithoutResponse') !== -1)
        && (characteristic.properties.indexOf('write') === -1);

      characteristic.write(value, withoutResponse, (error) => {
        if (error) {
          debug(`Failed to read characteristic: ${characteristic.uuid}, error ${util.inspect(error)}`);
          reject(error);
          return;
        }

        debug(`Written ${characteristic.uuid}`);
        resolve();
      });
    }),
    createTimeoutPromise(3000)
  ]);
}

async function readString(characteristic) {
  const data = await readCharacteristic(characteristic);
  let end = data.indexOf(0);
  if (end === -1) {
    end = data.length;
  }

  return data.toString('utf-8', 0, end);
}

async function readUInt8(characteristic) {
  const data = await readCharacteristic(characteristic);
  return data.readUInt8(0);
}

module.exports = {
  discoverServices: discoverServices,
  discoverCharacteristics: discoverCharacteristics,
  readCharacteristic: readCharacteristic,
  readString: readString,
  readUInt8: readUInt8,

  writeCharacteristic: writeCharacteristic
};