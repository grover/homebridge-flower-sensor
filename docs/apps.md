# HomeKit Apps

This plugin uses standard HomeKit capabilities as much as possible, however the experience will still differ
between the various HomeKit apps. I primarily verify the plugin against two apps:

* Apple Home
* Elgato Eve

Other apps will likely work, but again provide a different experience.

The following table will summarize the behavior to expect between different apps:

| Feature | Apple Home | Elgato Eve |
|---------|------------|------------|
| Soil Temperature | :white_check_mark: | :white_check_mark: |
| Soil Moisture | :white_check_mark: | :white_check_mark: |
| Ambient Light Level | :white_check_mark: | :white_check_mark: |
| Identifying the sensor | :x: | :white_check_mark: |
| Battery level monitoring | :white_check_mark: | :white_check_mark: |
| Last sensor time/date of update visible | :x: | :white_check_mark: |
| Last battery change time/date visible | :x: | :white_check_mark: |
| Configured light level threshold visible | :x: | :white_check_mark: |
| 24h average light level visible | :x: | :white_check_mark: |
| Low light level contact sensor | :white_check_mark: | :white_check_mark: |
| Configured humidity threshold visible | :x: | :white_check_mark: |
| 24h average humidity visible | :x: | :white_check_mark: |
| Low humidity level contact sensor | :white_check_mark: | :white_check_mark: |

A :white_check_mark: checkmark indicates the feature is available and supported. A :x: indicates that the feature is unavailable.
