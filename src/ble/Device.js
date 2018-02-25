'use strict';

const EventEmitter = require('events').EventEmitter;

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

          resolve();
        });
      }),
      BleUtils.createTimeoutPromise(2000)
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

  execute(task) {
    return this._executor.execute(this, task);
  }

  _onConnected() {
    this.log(`Connected to ${this._name}`);
  }

  _onDisconnected() {
    this.log(`Disconnected from ${this._name}`);
  }
}

module.exports = Device;