'use strict';

const EventEmitter = require('events').EventEmitter;

class BleBrowser extends EventEmitter {

  constructor(log, noble) {
    super();

    this.log = log;
    this.noble = noble;
    this._isScanning = false;
    this._peripherals = {};

    this.noble.on('discover', this._onBleDeviceDiscovered.bind(this));
    this.noble.on('scanStop', this._onScanStopped.bind(this));
  }

  start() {
    if (this._isScanning === false) {
      this.log('Starting to scan for flower sensors');
      this._scan();
      this._isScanning = true;
    }
  }

  _scan() {
    this.noble.startScanning([], false);
  }

  stop() {
    if (this._isScanning) {
      this.log('Stopped to scan for BLE HomeKit accessories');
      this.noble.stopScanning();
      this._peripherals = {};
    }
  }

  _onBleDeviceDiscovered(peripheral) {
    const p = this._peripherals[peripheral.id];
    if (p === undefined) {
      this._peripherals[peripheral.id] = peripheral;
      this.emit('discovered', peripheral);
    }


    // if (peripheral.advertisement.manufacturerData) {
    //   const data = ManufacturerDataParser(peripheral.advertisement.manufacturerData);
    //   if (data.isHAP) {
    //     if (this._ensureMacAddressIsAvailable(peripheral)) {
    //       if (this._updateDevice(peripheral, data) === false) {
    //         this._addDevice(peripheral, data);
    //       }
    //     }
    //   }
    // }
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

    if (this._isScanning) {
      this.log(`Scanning stopped externally. Restarting in ${DelayScanRestart / 1000}s.`);
      setTimeout(() => {
        if (this._isScanning) {
          this._scan();
        }
      }, DelayScanRestart);
    }
  }
}

module.exports = BleBrowser;