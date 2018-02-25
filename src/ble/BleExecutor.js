'use strict';

const util = require('util');

const debug = require('debug')('flower:ble');
const SequentialTaskQueue = require('sequential-task-queue').SequentialTaskQueue;

const MAX_RETRIES = 3;

class BleExecutor {

  constructor(browser) {
    this._browser = browser;
    this._queue = new SequentialTaskQueue();
  }

  execute(device, task) {
    this._browser.suspend();

    return this._queue.push(async () => {

      const errors = [];

      try {
        for (let i = 0; i < MAX_RETRIES; i++) {
          try {
            await this._connectToDevice(device);

            const result = await task.execute(device);
            return result;
          }
          catch (e) {
            errors.push(e);
            await device.disconnect();
          }
        }
      }
      finally {
        this._browser.resume();
      }

      const error = new Error('Failed to execute task');
      error.task = task;
      error.internalErrors = errors;

      debug(`Task execution failed: ${util.inspect(error)}`);
      throw error;
    });
  }

  async _connectToDevice(device) {
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
    debug(`Attempting to connect to ${device.name}`);

    for (let n = 0; n < 3 && !device.isConnected(); n++) {
      await device.connect();

      if (device.isConnected() === false) {
        await this._sleep(100);
      }
    }

    if (!device.isConnected()) {
      this.log(`noble failed to establish a BLE connection to ${this.name}`);
      throw new Error(`noble failed to establish a BLE connection to ${this.name}`);
    }
  }

  _sleep(timeout) {
    return new Promise(resolve => {
      setTimeout(resolve, timeout);
    });
  }
}

module.exports = BleExecutor;
