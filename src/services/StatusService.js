'use strict';

const moment = require('moment');

let Characteristic;

const preferredFormat = 'L LT';

class SensorStatusService {

  constructor(log, api, name, device) {
    this.log = log;
    this.name = name;
    this._device = device;

    Characteristic = api.hap.Characteristic;

    this._createService(api.hap);

    device
      .on('sensorData', this._onSensorData.bind(this))
      .on('timestampsChanged', this._onTimestampsChanged.bind(this));
  }

  _createService(hap) {
    this._statusService = new hap.Service.SensorStatusService(this.name);
  }

  getServices() {
    return [this._statusService];
  }

  _onSensorData() {
    this._statusService
      .getCharacteristic(Characteristic.LastUpdated)
      .updateValue(moment().format(preferredFormat));
  }

  _onTimestampsChanged(timestamps) {
    const now = moment();

    if (timestamps.uptime) {
      const uptime = moment.duration(timestamps.uptime, 's');
      const lastBatteryChange = now.subtract(uptime).format(preferredFormat);

      this._statusService
        .getCharacteristic(Characteristic.LastBatteryChange)
        .updateValue(lastBatteryChange);

      if (timestamps.lastMoved) {
        const moveTime = moment.duration(timestamps.lastMoved);
        const lastMoved = now.subtract(uptime).add(moveTime).format(preferredFormat);

        this._statusService
          .getCharacteristic(Characteristic.LastMoved)
          .updateValue(lastMoved);
      }
    }
  }
}

module.exports = SensorStatusService;