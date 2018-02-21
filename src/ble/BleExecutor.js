'use strict';

const util = require('util');

const debug = require('debug')('flower:ble');
const SequentialTaskQueue = require('sequential-task-queue').SequentialTaskQueue;

const MAX_RETRIES = 3;

class BleExecutor {

  constructor(peripheral) {
    this._peripheral = peripheral;
    this._peripheral
      .on('connected', this._onConnected.bind(this))
      .on('disconnected', this._onDisconnected.bind(this));

    this._isConnected = false;
    this._name = this._peripheral.advertisement.localName;

    this._queue = new SequentialTaskQueue();
  }

  execute(task) {
    return this._queue.push(async () => {

      const errors = [];

      for (let i = 0; i < MAX_RETRIES; i++) {
        try {
          if (this._isConnected === false) {
            await this._connect();
          }

          const result = await task.execute(this._peripheral);
          return result;
        }
        catch (e) {
          errors.push(e);
        }
      }

      const error = new Error('Failed to execute task');
      error.task = task;
      error.internalErrors = errors;

      debug(`Task execution failed: ${util.inspect(error)}`);
      throw error;
    });
  }

  async _connect() {
    /**
     * RPi noble sometimes has connectivity issues by disconnecting immediately
     * after a connection has been established.
     * 
     * This loop attempts to connect three times and waits afterwards to see if
     * a connection has been established. Gives up after three times.
     * 
     * See https://github.com/sandeepmistry/noble/issues/465
     * 
     */

    // TODO: Stop/Resume scanning

    for (let n = 0; n < 3 && this._peripheral.state !== 'connected'; n++) {
      await this._connectToDevice();

      if (this._peripheral.state !== 'connected') {
        await this._sleep(100);
      }
    }

    if (this._peripheral.state !== 'connected') {
      this.log(`noble failed to establish a BLE connection to ${this.name}`);
      throw new Error(`noble failed to establish a BLE connection to ${this.name}`);
    }
  }

  _connectToDevice() {
    return new Promise((resolve, reject) => {
      this._peripheral.connect((error) => {
        if (error) {
          reject(error);
        }

        resolve();
      });
    });
  }

  _sleep(timeout) {
    return new Promise(resolve => {
      setTimeout(resolve, timeout);
    });
  }

  _onConnected() {
    debug(`Connected to ${this._name}`);
    this._isConnected = true;
  }

  _onDisconnected() {
    debug(`Disconnected from ${this._name}`);
    this._isConnected = false;
  }
}

module.exports = BleExecutor;
