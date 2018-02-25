'use strict';

const EventEmitter = require('events').EventEmitter;
const util = require('util');

const BleUtils = require('./BleUtils');

class Device extends EventEmitter {
  constructor(name, peripheral, executor) {
    super();

    this.name = name;
    this.log = require('debug')(`flower:ble:${this.name}`);

    this._executor = executor;

    this.peripheral = peripheral;
    this.peripheral
      .on('connected', this._onConnected.bind(this))
      .on('disconnected', this._onDisconnected.bind(this));
  }

  isConnected() {
    return this.peripheral.state === 'connected';
  }

  connect() {
    return Promise.race([
      new Promise((resolve, reject) => {
        this.peripheral.connect((error) => {
          if (error) {
            reject(error);
            return;
          }

          if (this._characteristics !== undefined) {
            resolve();
          }

          this._discover()
            .then(resolve)
            .catch(reject);
        });
      }),
      BleUtils.createTimeoutPromise(15000)
    ]);
  }

  disconnect() {
    return Promise.race([
      new Promise((resolve, reject) => {
        this.peripheral.disconnect(error => {
          if (error) {
            reject(error);
            return;
          }

          resolve();
        });
      }),
      BleUtils.createTimeoutPromise(2000)
    ]);
  }

  _discover() {
    return Promise.race([
      new Promise((resolve, reject) => {
        this.log('Discovering services/characteristics');
        this.peripheral.discoverAllServicesAndCharacteristics((error, services, characteristics) => {
          if (error) {
            reject(error);
            return;
          }

          this._services = services;
          this._characteristics = characteristics;

          resolve();
        });
      }),
      BleUtils.createTimeoutPromise(2000)
    ]);
  }

  execute(task) {
    return this._executor.execute(this, task);
  }

  _onConnected() {
    this.log(`Connected to ${this._name}`);
  }

  _onDisconnected() {
    this.log(`Disconnected from ${this._name}`);
  }

  readCharacteristic(uuid, defaultValue) {
    return Promise.race([
      new Promise((resolve, reject) => {
        this.log(`Reading ${uuid}`);
        const characteristic = this._characteristics.find(c => c.uuid === uuid);
        if (!characteristic) {
          this.log(`Characteristic ${uuid} not available. Returning default value.`);
          resolve(defaultValue);
        }

        characteristic.read((error, data) => {
          if (error) {
            this.log(`Failed to read characteristic: ${uuid}, error ${util.inspect(error)}`);
            reject(error);
            return;
          }

          this.log(`Retrieved ${uuid}: ${util.inspect(data)}`);

          const value = data;
          resolve(value);
        });
      }),
      BleUtils.createTimeoutPromise(3000)
    ]);
  }

  writeCharacteristic(uuid, value) {
    return Promise.race([
      new Promise((resolve, reject) => {
        this.log(`Writing ${value} to ${uuid}`);

        const characteristic = this._characteristics.find(c => c.uuid === uuid);
        if (!characteristic) {
          this.log(`Characteristic ${uuid} not available. Rejecting.`);
          reject('Characteristic unavailable.');
        }

        const withoutResponse =
          (characteristic.properties.indexOf('writeWithoutResponse') !== -1)
          && (characteristic.properties.indexOf('write') === -1);

        characteristic.write(value, withoutResponse, (error) => {
          if (error) {
            this.log(`Failed to write characteristic: ${uuid}, error ${util.inspect(error)}`);
            reject(error);
            return;
          }

          this.log(`Written ${uuid}`);
          resolve();
        });
      }),
      BleUtils.createTimeoutPromise(3000)
    ]);
  }
}

module.exports = Device;