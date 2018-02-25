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
      Characteristic.call(this, 'Water Level', Characteristic.WaterLevel.UUID);
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


    ////////////////////////////////////////////////////////////////////////////
    // WateringService
    ////////////////////////////////////////////////////////////////////////////
    Service.WateringService = function (displayName, subtype) {
      Service.call(this, displayName, Service.WateringService.UUID, subtype);

      this.addOptionalCharacteristic(Characteristic.Name);

      // Required Characteristics
      this.addCharacteristic(Characteristic.WaterLevel);

      // Optional Characteristics
    };

    Service.WateringService.UUID = '652062C2-468E-4D8F-84D0-A459CCAE178C';
    util.inherits(Service.WateringService, Service);
  }
};
