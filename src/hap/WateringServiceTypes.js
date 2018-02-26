'use strict';

const util = require('util');

module.exports = {
  registerWith: function (hap) {

    const Characteristic = hap.Characteristic;
    const Service = hap.Service;

    //////////////////////////////////////////////////////////////////////////////////////////
    // Water Level
    //////////////////////////////////////////////////////////////////////////////////////////
    Characteristic.WaterLevel = function () {
      Characteristic.call(this, 'Level', Characteristic.WaterLevel.UUID);
      this.setProps({
        format: Characteristic.Formats.FLOAT,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY],
        unit: Characteristic.Units.PERCENTAGE,
        minValue: 0,
        maxValue: 100,
        minStep: 1
      });
      this.value = this.getDefaultValue();
    };
    util.inherits(Characteristic.WaterLevel, Characteristic);
    Characteristic.WaterLevel.UUID = '642AD46D-AF85-429E-908D-BFB099D49C9C';

    //////////////////////////////////////////////////////////////////////////////////////////
    // Watering Mode
    //////////////////////////////////////////////////////////////////////////////////////////
    Characteristic.WateringMode = function () {
      Characteristic.call(this, 'Mode', Characteristic.WateringMode.UUID);
      this.setProps({
        format: Characteristic.Formats.STRING,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    };
    util.inherits(Characteristic.WateringMode, Characteristic);
    Characteristic.WateringMode.UUID = 'C9548914-182B-481A-A7D7-97D6A79354D3';

    //////////////////////////////////////////////////////////////////////////////////////////
    // Watering Status
    //////////////////////////////////////////////////////////////////////////////////////////
    Characteristic.WateringStatus = function () {
      Characteristic.call(this, 'Status', Characteristic.WateringStatus.UUID);
      this.setProps({
        format: Characteristic.Formats.STRING,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    };
    util.inherits(Characteristic.WateringStatus, Characteristic);
    Characteristic.WateringStatus.UUID = '8C483360-F60D-4F7B-8A3C-1C6976B506F5';

    ////////////////////////////////////////////////////////////////////////////
    // WateringService
    ////////////////////////////////////////////////////////////////////////////
    Service.WateringService = function (displayName, subtype) {
      Service.call(this, displayName, Service.WateringService.UUID, subtype);

      this.addOptionalCharacteristic(Characteristic.Name);

      // Required Characteristics
      this.addCharacteristic(Characteristic.WaterLevel);
      this.addCharacteristic(Characteristic.WateringMode);
      this.addCharacteristic(Characteristic.WateringStatus);

      // Optional Characteristics
    };

    Service.WateringService.UUID = '652062C2-468E-4D8F-84D0-A459CCAE178C';
    util.inherits(Service.WateringService, Service);
  }
};
