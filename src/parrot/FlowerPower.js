'use strict';

const debug = require('debug')('flower:device');

const Device = require('../ble/Device');
const isEqual = require('array-equal');
const clone = require('clone');
const util = require('util');

const Parrot = require('./Parrot');

const RetrieveBatteryLevelTask = require('../ble/RetrieveBatteryLevelTask');
const RetrieveDeviceInformationTask = require('../ble/RetrieveDeviceInformationTask');
const RetrieveFlowerPowerCalibratedDataTask = require('./RetrieveFlowerPowerCalibratedDataTask');
const RetrieveTimestampsTask = require('./RetrieveTimestampsTask');
const WriteLedStateTask = require('./WriteLedStateTask');

const FLOWER_POWER_LIVE_SERVICE_UUID = '39e1fa0084a811e2afba0002a5d5c51b';

/** 
 * Refresh the battery level every 48 hours. Given that it lasts 180 days, this
 * should be plenty sufficient to take care of early warnings.
 */
const BATTERY_LEVEL_REFRESH_INTERVAL = 36 * 60 * 60 * 1000;

/**
 * Refresh the plant data every 10 minutes. Given that it lasts 180 days, this
 * should be plenty sufficient to take care of early warnings.
 */
const PLANT_DATA_REFRESH_INTERVAL = 10 * 60 * 1000;

function getDeviceInformation(advertisement) {
  const deviceInfo = {
    generation: 1,
    name: advertisement.localName,
    type: 'Flower Power',
    color: 'Unknown'
  };

  const manufacturerData = advertisement.manufacturerData;
  if (manufacturerData && manufacturerData.length == 5) {
    deviceInfo.generation = 2;
    deviceInfo.companyIdentifier = manufacturerData.readUInt16LE(0);
    deviceInfo.dataVersion = manufacturerData[2];
    deviceInfo.type = Parrot.DeviceTypes[manufacturerData[3] & 0x0F];
    deviceInfo.color = Parrot.Colors[(manufacturerData[3] & 0xF0) >> 4];
  }

  return deviceInfo;
}

function isFlowerPowerAdvertisement(advertisement) {
  return advertisement.serviceUuids && advertisement.serviceUuids.includes(FLOWER_POWER_LIVE_SERVICE_UUID);
}

function getDeviceStatus(manufacturerData) {
  const UNREAD_ENTRIES_MASK = 0x01;
  const DEVICE_MOVED_MASK = 0x02;
  const DEVICE_STARTED_MASK = 0x04;

  const deviceStatus = {
    unreadEntries: false,
    moved: false,
    started: false,
    lowWater: false,
    lowBattery: false,
    wateringNeeded: false
  };

  if (manufacturerData.length == 5) {
    deviceStatus.unreadEntries = (manufacturerData[4] & UNREAD_ENTRIES_MASK) === UNREAD_ENTRIES_MASK;
    deviceStatus.moved = (manufacturerData[4] & DEVICE_MOVED_MASK) === DEVICE_MOVED_MASK;
    deviceStatus.started = (manufacturerData[4] & DEVICE_STARTED_MASK) === DEVICE_STARTED_MASK;
  }
  else {
    // TODO: Gen. 1 device?
  }

  return deviceStatus;
}

class FlowerPowerDevice extends Device {

  constructor(executor, peripheral) {
    super(peripheral.advertisement.localName, peripheral, executor);

    this._manufacturerData = [];

    this._accessoryInformation = {};
    this._batteryInfo = {};
    this._batteryTimer = undefined;
    this._dataTimer = undefined;
    this._deviceInfo = getDeviceInformation(peripheral.advertisement);
    this._deviceStatus = {};

    this.newAdvertisement(peripheral.advertisement);
  }

  async _initialize() {
    await this._requestAccessoryInformation();
  }

  async refresh() {
    await this._retrieveBatteryStatus();
    await this._retrieveTimestamps();
    await this.requestSensorData();
  }

  getAccessoryInformation() {
    return this._accessoryInformation;
  }

  getBatteryInfo() {
    return this._batteryInfo;
  }

  getCapabilities() {
    return {
      airTemperature: true,
      soilTemperature: true,
      soilHumidity: true,
      soilConductivity: true,
      waterTank: false,
      automaticWatering: false
    };
  }

  getDeviceInfo() {
    return this._deviceInfo;
  }

  getDeviceStatus() {
    return this._deviceStatus;
  }

  newAdvertisement(advertisement) {
    const hasChanged = this._hasAdvertisementChanged(advertisement.manufacturerData);
    if (!hasChanged) {
      return;
    }

    this._manufacturerData = clone(advertisement.manufacturerData);
    this._deviceStatus = getDeviceStatus(advertisement.manufacturerData);
    debug(`New device status: ${util.inspect(this._deviceStatus)}`);

    this.emit('deviceStatusChanged', this._deviceStatus);

    if (this._deviceStatus.started || this._deviceStatus.moved) {
      this._retrieveTimestamps();
    }
  }

  _hasAdvertisementChanged(manufacturerData) {
    return isEqual(manufacturerData, this._manufacturerData) === false;
  }

  async _requestAccessoryInformation() {
    this.accessoryInformation = await this.execute(new RetrieveDeviceInformationTask());
    this.accessoryInformation.model = this._deviceInfo.type;
    this.accessoryInformation.firmwareRevision = extractVersion(this.accessoryInformation.firmwareRevision);
    this.accessoryInformation.hardwareRevision = extractVersion(this.accessoryInformation.hardwareRevision);
  }

  async _retrieveBatteryStatus() {
    debug('Retrieving battery status');
    try {
      this._batteryInfo = await this.execute(new RetrieveBatteryLevelTask());
      debug(`Retrieved battery status: ${util.inspect(this._batteryInfo)}`);

      this.emit('batteryInfoChanged', this._batteryInfo);
    }
    catch (e) {
      debug(`Failed to retrieve the battery status. Error: ${util.inspect(e)}`);
    }

    this._scheduleBatteryRefresh();
  }

  _scheduleBatteryRefresh() {
    if (this._batteryTimer) {
      clearTimeout(this._batteryTimer);
    }

    this._batteryTimer = setTimeout(this._retrieveBatteryStatus.bind(this), BATTERY_LEVEL_REFRESH_INTERVAL);
  }

  async requestSensorData() {
    debug('Retrieving sensor data');
    try {
      const task = new RetrieveFlowerPowerCalibratedDataTask();
      const sensorData = await this.execute(task);

      sensorData.timestamp = Date.now();

      debug(`Retrieved sensor data: ${util.inspect(sensorData)}`);
      sensorData.lightLevel = this._getLightLevelInLux(sensorData.lightLevel);

      this.emit('sensorData', sensorData);
    }
    catch (e) {
      debug(`Failed to retrieve the flower power data. Error: ${util.inspect(e)}`);
    }

    this._scheduleDataRefresh();
  }

  _getLightLevelInLux(lightLevel) {
    // Factor 4659.293 was determined by sampling the lux conversion done by the Parrot app on iOS
    // over the course of several days.
    const ParrotFactor = 4659.293;
    const LowerLuxThreshold = 500.0;

    let lux = lightLevel * ParrotFactor;
    if (lux < LowerLuxThreshold) {
      lux = 0;
    }

    return lux;
  }

  _scheduleDataRefresh() {
    if (this._dataTimer) {
      clearTimeout(this._dataTimer);
    }

    this._dataTimer = setTimeout(this.requestSensorData.bind(this), PLANT_DATA_REFRESH_INTERVAL);
  }

  async _retrieveTimestamps() {
    debug('Retrieving timestamps');
    try {
      const timestamps = await this.execute(new RetrieveTimestampsTask());
      debug(`Retrieved timestamps: ${util.inspect(timestamps)}`);

      this.emit('timestampsChanged', timestamps);
    }
    catch (e) {
      debug(`Failed to retrieve the timestamps. Error: ${util.inspect(e)}`);
    }
  }

  async identify() {
    debug(`Identify requested on ${this._}`);
    return this
      .execute(new WriteLedStateTask(true))
      .then(() => {
        setTimeout(() => this._disableLED(), 5000);
      });
  }

  _disableLED() {
    this
      .execute(new WriteLedStateTask(false))
      .catch(e => {
        debug(`Failed to disable the LED: ${util.inspect(e)}`);
      });
  }
}


function extractVersion(value) {
  const versionRegEx = /.*-(\d+\.{1}\d+\.?\d*)_.*/;
  try {
    return versionRegEx.exec(value)[1];
  }
  catch (e) {
    debug(`Failed to extract version from ${value}`);
  }

  return '';
}

async function createDevice(executor, peripheral) {
  const device = new FlowerPowerDevice(executor, peripheral);
  await device._initialize();
  return device;
}

module.exports = {
  isFlowerPowerAdvertisement: isFlowerPowerAdvertisement,
  createDevice: createDevice
};
