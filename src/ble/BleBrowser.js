'use strict';

const EventEmitter = require('events').EventEmitter;

class BleBrowser extends EventEmitter {

  constructor(log, noble) {
    super();

    this.log = log;
    this.noble = noble;

    this._isScanning = false;
    this._suspended = 0;

    this.noble.on('stateChange', this._onNobleStateChanged.bind(this));
    this.noble.on('discover', this._onBleDeviceDiscovered.bind(this));
    this.noble.on('scanStop', this._onScanStopped.bind(this));
  }

  start() {
    if (this._isScanning === false) {
      this._scan();
      this._isScanning = true;
    }
  }

  _scan() {
    if (this.noble.state === 'poweredOn' && this._isScanning === true && this._suspended === 0) {
      this.log('Starting to scan for flower sensors');
      this.noble.startScanning([], true);
    }
  }

  stop() {
    if (this._isScanning) {
      this._stop();
      this._isScanning = false;
    }
  }

  _stop() {
    if (this._isScanning) {
      this.log('Stopped to scan for BLE HomeKit accessories');
      this.noble.stopScanning();
    }
  }


  suspend() {
    this._suspended++;
    this.log(`Suspending BLE discovery: suspended=${this._suspended}`);
    if (this._suspended === 1) {
      this._stop();
    }
  }

  resume() {
    this._suspended--;
    this.log(`Resumed BLE discovery: suspended=${this._suspended}`);
    if (this._suspended === 0) {
      setTimeout(() => this._scan(), 1000);
    }
  }

  _onNobleStateChanged() {
    this._scan();
  }

  _onBleDeviceDiscovered(peripheral) {
    this.emit('discovered', peripheral);
  }

  _onScanStopped() {
    /**
     * RPi Zero W stops scanning once a connection has been established. We make sure that
     * we keep scanning here to receive disconnected events in the future. Additionally
     * we can't aggressively restart scanning as that interferes with the establishment of
     * accessory connections. Since they're of higher importance than "disconnected events",
     * as the connection is established to influence something, we hold of for 2s.
     */
    const DelayScanRestart = 2000;

    if (this._isScanning && this._suspended === 0) {
      this.log(`Scanning stopped externally. Restarting in ${DelayScanRestart / 1000}s.`);
      setTimeout(() => this._scan(), DelayScanRestart);
    }
  }
}

module.exports = BleBrowser;